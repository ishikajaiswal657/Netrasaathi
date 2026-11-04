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
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
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
        """Verifies PDF upload, page extraction into images, and digital text extraction."""
        pdf_bytes = create_sample_pdf()
        files = {"file": ("study_material.pdf", pdf_bytes, "application/pdf")}

        response = self.client.post("/documents", headers=self.headers_a, files=files)
        self.assertEqual(response.status_code, 201)
        data = response.json()

        self.assertEqual(data["filename"], "study_material.pdf")
        self.assertEqual(data["status"], "processed")
        self.assertEqual(data["page_count"], 2)
        self.assertEqual(len(data["pages"]), 2)

        # Check page 1
        page1 = data["pages"][0]
        self.assertEqual(page1["page_number"], 1)
        self.assertIn("Page 1: Accessible AI", page1["ocr_text"])
        self.assertTrue(Path(page1["image_path"]).exists())

        # Check page 2
        page2 = data["pages"][1]
        self.assertEqual(page2["page_number"], 2)
        self.assertIn("Page 2: Cybersecurity", page2["ocr_text"])
        self.assertTrue(Path(page2["image_path"]).exists())

    def test_upload_png_image_success(self):
        """Verifies single-page image document upload and storage."""
        png_bytes = create_sample_png()
        files = {"file": ("diagram.png", png_bytes, "image/png")}

        response = self.client.post("/documents", headers=self.headers_a, files=files)
        self.assertEqual(response.status_code, 201)
        data = response.json()

        self.assertEqual(data["filename"], "diagram.png")
        self.assertEqual(data["page_count"], 1)
        self.assertEqual(len(data["pages"]), 1)
        self.assertTrue(Path(data["pages"][0]["image_path"]).exists())

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
