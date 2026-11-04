import os
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
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.audit import AuditLog
from backend.app.models.document import Document
from backend.app.models.user import User
from backend.app.security.passwords import hash_password
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


app.dependency_overrides[get_db] = override_get_db


class TestAdminSecurityAndAuditLogs(unittest.TestCase):
    """
    Test suite for Phase 8: Role-based access control (RBAC),
    audit trail inspection, operational statistics, and zero-content privacy guarantees.
    """

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=test_engine)

    def setUp(self):
        app.dependency_overrides[get_db] = override_get_db
        db = TestingSessionLocal()
        try:
            db.query(AuditLog).delete()
            db.query(Document).delete()
            db.query(User).delete()
            db.commit()

            # Seed Admin User
            self.admin = User(
                email="admin@netrasaathi.org",
                password_hash=hash_password("AdminSecurePassword123!"),
                role="admin"
            )
            # Seed Student User
            self.student = User(
                email="student@netrasaathi.org",
                password_hash=hash_password("StudentPassword123!"),
                role="student"
            )
            db.add_all([self.admin, self.student])
            db.commit()
            db.refresh(self.admin)
            db.refresh(self.student)

            # Seed sample documents
            self.doc1 = Document(
                user_id=self.student.id,
                filename="Computer_Networks.pdf",
                file_path="/tmp/cn.pdf",
                status="completed",
                page_count=3
            )
            db.add(self.doc1)
            db.commit()
            db.refresh(self.doc1)

            # Seed sample audit logs
            db.add_all([
                AuditLog(user_id=self.student.id, action="upload", document_id=self.doc1.id, ip_address="127.0.0.1"),
                AuditLog(user_id=self.student.id, action="process", document_id=self.doc1.id, ip_address="127.0.0.1"),
                AuditLog(user_id=self.student.id, action="ask", document_id=self.doc1.id, ip_address="127.0.0.1"),
                AuditLog(user_id=self.student.id, action="view", document_id=self.doc1.id, ip_address="127.0.0.1"),
            ])
            db.commit()

            # Create tokens
            self.admin_token = create_access_token({"sub": self.admin.email, "role": "admin"})
            self.student_token = create_access_token({"sub": self.student.email, "role": "student"})
        finally:
            db.close()

    def test_admin_can_retrieve_all_audit_logs(self):
        """Administrator role can access the audit trail with 200 OK (FR13, FR16)."""
        response = self.client.get(
            "/admin/audit-logs",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(response.status_code, 200)
        logs = response.json()
        self.assertGreaterEqual(len(logs), 4)

        actions = [l["action"] for l in logs]
        self.assertIn("upload", actions)
        self.assertIn("process", actions)
        self.assertIn("ask", actions)
        self.assertIn("view", actions)

    def test_admin_can_filter_audit_logs_by_action(self):
        """Administrator can filter audit logs by action category."""
        response = self.client.get(
            "/admin/audit-logs?action=upload",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(response.status_code, 200)
        logs = response.json()
        self.assertGreaterEqual(len(logs), 1)
        for log in logs:
            self.assertEqual(log["action"], "upload")

    def test_admin_can_retrieve_system_stats(self):
        """Administrator can retrieve aggregate platform metrics."""
        response = self.client.get(
            "/admin/stats",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(response.status_code, 200)
        stats = response.json()
        self.assertEqual(stats["total_users"], 2)
        self.assertEqual(stats["total_documents"], 1)
        self.assertEqual(stats["total_audit_events"], 4)
        self.assertEqual(stats["action_breakdown"]["upload"], 1)
        self.assertEqual(stats["action_breakdown"]["process"], 1)
        self.assertEqual(stats["action_breakdown"]["ask"], 1)

    def test_student_forbidden_from_admin_audit_logs(self):
        """Standard student role is blocked with 403 Forbidden from accessing admin audit logs."""
        response = self.client.get(
            "/admin/audit-logs",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn("Access denied", response.json()["detail"])

    def test_student_forbidden_from_admin_stats(self):
        """Standard student role is blocked with 403 Forbidden from accessing admin stats."""
        response = self.client.get(
            "/admin/stats",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn("Access denied", response.json()["detail"])

    def test_unauthenticated_requests_blocked(self):
        """Unauthenticated requests without token receive 401 Unauthorized."""
        res1 = self.client.get("/admin/audit-logs")
        self.assertEqual(res1.status_code, 401)

        res2 = self.client.get("/admin/stats")
        self.assertEqual(res2.status_code, 401)

    def test_audit_logs_zero_content_privacy(self):
        """Audit trail records strictly omit raw document text, OCR text, and question strings (FR16)."""
        response = self.client.get(
            "/admin/audit-logs",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(response.status_code, 200)
        logs = response.json()
        for log in logs:
            self.assertNotIn("raw_text", log)
            self.assertNotIn("ocr_text", log)
            self.assertNotIn("question_text", log)
            self.assertNotIn("content", log)
            self.assertNotIn("password_hash", log)


if __name__ == "__main__":
    unittest.main()

