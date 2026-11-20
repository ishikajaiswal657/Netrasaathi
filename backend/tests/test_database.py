import os
os.environ["TESTING"] = "1"
import unittest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db, normalize_database_url, apply_migrations
from backend.app.main import app
from backend.app.models.document import Document, Page
from backend.app.models.user import User
from backend.app.security.tokens import create_access_token

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestDatabaseAndPersistence(unittest.TestCase):
    """Tests for PostgreSQL URL handling, missing image resilience, and Alembic migrations."""

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        import backend.app.database as db_module
        cls._orig_session_local = db_module.SessionLocal
        db_module.SessionLocal = TestingSessionLocal
        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        import backend.app.database as db_module
        db_module.SessionLocal = cls._orig_session_local
        Base.metadata.drop_all(bind=test_engine)

    def setUp(self):
        db = TestingSessionLocal()
        try:
            db.query(Page).delete()
            db.query(Document).delete()
            db.query(User).delete()
            db.commit()

            user = User(
                email="persist_student@netrasaathi.org",
                password_hash="test_hash",
                role="student"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            self.user_id = user.id
            self.user_email = user.email
            self.user_role = user.role
            self.token = create_access_token(data={"sub": self.user_email, "role": self.user_role})
            self.headers = {"Authorization": f"Bearer {self.token}"}
        finally:
            db.close()

    def test_normalize_database_url_postgresql(self):
        """Render-style postgres:// URLs must be normalized to postgresql:// for SQLAlchemy."""
        render_url = "postgres://user:secret@dpg-xxxx.render.com/netrasaathi_db"
        normalized = normalize_database_url(render_url)
        self.assertEqual(normalized, "postgresql://user:secret@dpg-xxxx.render.com/netrasaathi_db")

        # Standard sqlite URL remains unchanged
        sqlite_url = "sqlite:///./netrasaathi.db"
        self.assertEqual(normalize_database_url(sqlite_url), sqlite_url)

    def test_missing_image_returns_404_with_expired_message(self):
        """
        When ephemeral disk on Render wipes ./uploads, the image endpoint must return
        a clear 404 message indicating that images expired and reading continues from saved text.
        """
        from fastapi import HTTPException
        from backend.app.routers.documents import get_page_image

        db = TestingSessionLocal()
        try:
            doc = Document(
                user_id=self.user_id,
                filename="wiped_disk_lecture.pdf",
                file_path="/tmp/wiped/lecture.pdf",
                status="ready",
                page_count=1
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)

            page = Page(
                document_id=doc.id,
                page_number=1,
                image_path="/tmp/non_existent_folder_wiped/page_1.png",
                ocr_text="Persistent text saved safely in database.",
                status="ready"
            )
            db.add(page)
            db.commit()
            db.refresh(page)

            with self.assertRaises(HTTPException) as ctx:
                get_page_image(
                    document_id=doc.id,
                    page_number=1,
                    db=db,
                    current_user=User(id=self.user_id, email=self.user_email, role="student")
                )
            self.assertEqual(ctx.exception.status_code, 404)
            self.assertIn("Document image expired, reading from saved text", ctx.exception.detail)
        finally:
            db.close()

    def test_alembic_migrations_apply_cleanly(self):
        """Alembic migrations must execute cleanly without exceptions."""
        try:
            apply_migrations()
            migration_succeeded = True
        except Exception:
            migration_succeeded = False
        self.assertTrue(migration_succeeded)


if __name__ == "__main__":
    unittest.main()
