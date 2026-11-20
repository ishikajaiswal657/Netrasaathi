import io
import os
import shutil
import sys
from pathlib import Path
import unittest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Use SQLite in-memory for testing
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["TESTING"] = "true"

from fastapi.testclient import TestClient
from PIL import Image
import pymupdf
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.audit import AuditLog
from backend.app.models.document import Document, Page, Block
from backend.app.models.user import User

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


app.dependency_overrides[get_db] = override_get_db


def create_sample_pdf() -> bytes:
    """Generates an authentic 2-page PDF in memory for testing."""
    doc = pymupdf.open()
    p1 = doc.new_page()
    p1.insert_text((50, 72), "Netrasaathi Page 1: Accessible AI Study Assistant")
    p2 = doc.new_page()
    p2.insert_text((50, 72), "Netrasaathi Page 2: Cybersecurity & Visual Explanation")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def create_sample_png() -> bytes:
    """Generates an authentic PNG image in memory for testing."""
    img = Image.new("RGB", (150, 150), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


class TestDocumentUploadAndReading(unittest.TestCase):
    """Integration test suite for document upload, validation, page splitting, and data isolation."""

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        import backend.app.database as db_module
        cls._orig_session_local = db_module.SessionLocal
        db_module.SessionLocal = TestingSessionLocal
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        import backend.app.database as db_module
        db_module.SessionLocal = cls._orig_session_local
        Base.metadata.drop_all(bind=test_engine)
        # Clean up test upload files created during tests
        upload_dir = Path("uploads")
        if upload_dir.exists():
            shutil.rmtree(upload_dir, ignore_errors=True)

    def setUp(self):
        # Bind this test's database override to the app
        app.dependency_overrides[get_db] = override_get_db
        db = TestingSessionLocal()
        try:
            db.query(AuditLog).delete()
            db.query(Block).delete()
            db.query(Page).delete()
            db.query(Document).delete()
            db.query(User).delete()
            db.commit()
        finally:
            db.close()

        # Register and login Student A
        self.client.post("/auth/signup", json={
            "email": "studentA@netrasaathi.org",
            "password": "PasswordStudentA123",
            "role": "student"
        })
        login_res_a = self.client.post("/auth/login", json={
            "email": "studentA@netrasaathi.org",
            "password": "PasswordStudentA123"
        })
        self.token_a = login_res_a.json()["access_token"]
        self.headers_a = {"Authorization": f"Bearer {self.token_a}"}

        # Register and login Student B (to test multi-tenant access controls)
        self.client.post("/auth/signup", json={
            "email": "studentB@netrasaathi.org",
            "password": "PasswordStudentB123",
            "role": "student"
        })
        login_res_b = self.client.post("/auth/login", json={
            "email": "studentB@netrasaathi.org",
            "password": "PasswordStudentB123"
        })
        self.token_b = login_res_b.json()["access_token"]
        self.headers_b = {"Authorization": f"Bearer {self.token_b}"}

    def tearDown(self):
        pass

    def test_upload_pdf_success_and_page_extraction(self):
        """Verifies PDF upload returns quickly with valid document ID, page count, and status."""
        pdf_bytes = create_sample_pdf()
        files = {"file": ("study_material.pdf", pdf_bytes, "application/pdf")}

        response = self.client.post("/documents", headers=self.headers_a, files=files)
        self.assertEqual(response.status_code, 201)
        data = response.json()

        self.assertEqual(data["filename"], "study_material.pdf")
        self.assertIn(data["status"], ["uploaded", "reading", "cleaning", "explaining", "ready", "processed"])
        self.assertEqual(data["page_count"], 2)

    def test_document_status_endpoint(self):
        """Verifies GET /documents/{id}/status returns document and per-page real-time progress."""
        pdf_bytes = create_sample_pdf()
        upload_res = self.client.post(
            "/documents",
            headers=self.headers_a,
            files={"file": ("status_test.pdf", pdf_bytes, "application/pdf")}
        )
        doc_id = upload_res.json()["id"]

        status_res = self.client.get(f"/documents/{doc_id}/status", headers=self.headers_a)
        self.assertEqual(status_res.status_code, 200)
        status_data = status_res.json()

        self.assertEqual(status_data["id"], doc_id)
        self.assertIn("status", status_data)
        self.assertIn("page_count", status_data)
        self.assertIn("pages_ready", status_data)
        self.assertIn("pages", status_data)

    def test_startup_recovery_marks_stale_documents_as_failed(self):
        """Server startup must mark any document left in an in-progress working state as failed."""
        from backend.app.services.pipeline import cleanup_stale_processing_jobs

        db = TestingSessionLocal()
        try:
            stale_doc = Document(
                user_id=1,
                filename="stale_lecture.pdf",
                file_path="mock_path",
                status="reading",
                page_count=3
            )
            db.add(stale_doc)
            db.commit()
            db.refresh(stale_doc)
            stale_id = stale_doc.id

            recovered_count = cleanup_stale_processing_jobs(db)
            self.assertGreaterEqual(recovered_count, 1)

            updated = db.query(Document).filter(Document.id == stale_id).first()
            self.assertEqual(updated.status, "failed")
            self.assertIn("restarted", updated.error_message.lower())
        finally:
            db.close()

    def test_page_count_limit_exceeded_fails_fast(self):
        """Rejects documents exceeding MAX_PAGES with a clear error message."""
        from unittest.mock import patch

        pdf_bytes = create_sample_pdf()
        # Mock MAX_PAGES limit to 1 page
        with patch("backend.app.services.storage.settings.MAX_PAGES", 1):
            response = self.client.post(
                "/documents",
                headers=self.headers_a,
                files={"file": ("too_long.pdf", pdf_bytes, "application/pdf")}
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("exceeds maximum allowed limit", response.json()["detail"])

    def test_upload_png_image_success(self):
        """Verifies single-page image document upload and storage."""
        png_bytes = create_sample_png()
        files = {"file": ("diagram.png", png_bytes, "image/png")}

        response = self.client.post("/documents", headers=self.headers_a, files=files)
        self.assertEqual(response.status_code, 201)
        data = response.json()

        self.assertEqual(data["filename"], "diagram.png")
        self.assertEqual(data["page_count"], 1)

        # After background processing finishes, document detail contains page record
        doc_res = self.client.get(f"/documents/{data['id']}", headers=self.headers_a)
        doc_data = doc_res.json()
        self.assertEqual(len(doc_data["pages"]), 1)
        self.assertTrue(Path(doc_data["pages"][0]["image_path"]).exists())

    def test_upload_disallowed_extension_fails(self):
        """Rejects executable scripts or unsupported file formats with 400."""
        files = {"file": ("exploit.exe", b"MZDummyPayloadContent", "application/octet-stream")}
        response = self.client.post("/documents", headers=self.headers_a, files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported file format", response.json()["detail"])

    def test_upload_extension_spoofing_fails(self):
        """Blocks extension spoofing where a text/binary file is falsely named .pdf."""
        fake_pdf = b"Plain text disguised as a PDF document"
        files = {"file": ("fake.pdf", fake_pdf, "application/pdf")}
        response = self.client.post("/documents", headers=self.headers_a, files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("File content does not match its .pdf extension", response.json()["detail"])

    def test_multi_tenant_document_isolation(self):
        """Confirms that Student B cannot view, list, or download Student A's documents."""
        # 1. Student A uploads a PDF
        pdf_bytes = create_sample_pdf()
        upload_res = self.client.post(
            "/documents",
            headers=self.headers_a,
            files={"file": ("notes_a.pdf", pdf_bytes, "application/pdf")}
        )
        doc_id = upload_res.json()["id"]

        # 2. Student A sees their document in the list
        list_res_a = self.client.get("/documents", headers=self.headers_a)
        self.assertEqual(len(list_res_a.json()), 1)
        self.assertEqual(list_res_a.json()[0]["id"], doc_id)

        # 3. Student B lists documents -> returns empty list
        list_res_b = self.client.get("/documents", headers=self.headers_b)
        self.assertEqual(len(list_res_b.json()), 0)

        # 4. Student B directly attempts to fetch Student A's document -> 404
        get_res_b = self.client.get(f"/documents/{doc_id}", headers=self.headers_b)
        self.assertEqual(get_res_b.status_code, 404)

        # 5. Student B directly attempts to download Student A's page image -> 404
        img_res_b = self.client.get(f"/documents/{doc_id}/pages/1/image", headers=self.headers_b)
        self.assertEqual(img_res_b.status_code, 404)

    def test_secure_page_image_serving_for_owner(self):
        """Verifies that the authenticated document owner can fetch page images."""
        pdf_bytes = create_sample_pdf()
        upload_res = self.client.post(
            "/documents",
            headers=self.headers_a,
            files={"file": ("study.pdf", pdf_bytes, "application/pdf")}
        )
        doc_id = upload_res.json()["id"]

        # Fetch page 1 image
        img_res = self.client.get(f"/documents/{doc_id}/pages/1/image", headers=self.headers_a)
        self.assertEqual(img_res.status_code, 200)
        self.assertEqual(img_res.headers["content-type"], "image/png")

    def test_audit_log_written_on_upload(self):
        """Verifies that uploads record an audit log entry with action and IDs only."""
        pdf_bytes = create_sample_pdf()
        upload_res = self.client.post(
            "/documents",
            headers=self.headers_a,
            files={"file": ("audit_test.pdf", pdf_bytes, "application/pdf")}
        )
        doc_id = upload_res.json()["id"]

        # Query database session to check audit record
        db = TestingSessionLocal()
        audit = db.query(AuditLog).filter(
            AuditLog.document_id == doc_id,
            AuditLog.action == "upload"
        ).first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.action, "upload")
        db.close()


if __name__ == "__main__":
    unittest.main()
