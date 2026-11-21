import os
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models.audit import AuditLog
from backend.app.models.document import Block, Document, Page
from backend.app.models.user import User
from backend.app.routers.documents import (
    get_document,
    get_document_status,
    get_page_blocks,
    get_page_image,
    retry_page_processing,
    ask_question,
    list_documents,
    AskQuestionRequest,
)


class TestSecurityAuditAndIsolation(unittest.TestCase):
    """
    Security verification tests for Netrasaathi backend:
    1. Production secret key rejection to prevent predictable JWT forgery.
    2. Strict multi-tenant isolation across all document and Q&A endpoints.
    3. Zero raw content logging in persistent audit trails.
    """

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.test_path = Path(self.test_dir)

        # In-memory SQLite database
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db = self.SessionLocal()

        # Seed Student User A
        self.user_a = User(
            email="student_a@college.edu",
            password_hash="hash_a",
            role="student",
        )
        self.db.add(self.user_a)

        # Seed Student User B (Attacker / Different Tenant)
        self.user_b = User(
            email="student_b@college.edu",
            password_hash="hash_b",
            role="student",
        )
        self.db.add(self.user_b)
        self.db.commit()

        # Seed confidential document owned by User A
        self.doc_a = Document(
            user_id=self.user_a.id,
            filename="confidential_exam_notes.pdf",
            file_path=str(self.test_path / "exam.pdf"),
            status="completed",
            page_count=1,
        )
        self.db.add(self.doc_a)
        self.db.commit()
        self.db.refresh(self.doc_a)

        # Seed Page and Block for User A
        page_img = self.test_path / "page_1.png"
        page_img.write_bytes(b"\x89PNG\r\n\x1a\nfake_image")

        self.page_a = Page(
            document_id=self.doc_a.id,
            page_number=1,
            image_path=str(page_img),
            ocr_text="Confidential cybersecurity notes regarding RSA cryptography.",
            pii_items_found=0,
            status="ready",
        )
        self.db.add(self.page_a)
        self.db.commit()

        self.block_a = Block(
            page_id=self.page_a.id,
            order_index=1,
            block_type="text",
            title="RSA Cryptography Explanation",
            explanation_text="RSA uses prime factor difficulty for asymmetric key generation.",
        )
        self.db.add(self.block_a)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_production_rejects_insecure_default_secret_key(self):
        """Production startup must raise RuntimeError if SECRET_KEY is the insecure dev default."""
        from backend.app.main import validate_production_security

        mock_cfg = MagicMock()
        mock_cfg.SECRET_KEY = "temporary_dev_secret_key_change_in_production_32chars"

        with patch.dict(os.environ, {"ENVIRONMENT": "production"}):
            with self.assertRaises(RuntimeError) as ctx:
                validate_production_security(mock_cfg)

            self.assertIn("default development SECRET_KEY is not permitted in production", str(ctx.exception))

    def test_production_allows_strong_custom_secret_key(self):
        """Production startup must succeed when a secure, non-default SECRET_KEY is provided."""
        from backend.app.main import validate_production_security

        mock_cfg = MagicMock()
        mock_cfg.SECRET_KEY = "c8f1e94a82d043b28f731a54b9d0e2c6f1a8b3d5e7c90a1b2c3d4e5f6a7b8c9d"

        with patch.dict(os.environ, {"ENVIRONMENT": "production"}):
            # Must execute cleanly without raising any exception
            validate_production_security(mock_cfg)

    def test_tenant_isolation_get_document(self):
        """User B must not be able to retrieve User A's document details."""
        with self.assertRaises(HTTPException) as ctx:
            get_document(document_id=self.doc_a.id, db=self.db, current_user=self.user_b)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_tenant_isolation_get_document_status(self):
        """User B must not be able to query progress of User A's document."""
        with self.assertRaises(HTTPException) as ctx:
            get_document_status(document_id=self.doc_a.id, db=self.db, current_user=self.user_b)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_tenant_isolation_get_page_blocks(self):
        """User B must not be able to read study blocks belonging to User A."""
        with self.assertRaises(HTTPException) as ctx:
            get_page_blocks(document_id=self.doc_a.id, page_number=1, db=self.db, current_user=self.user_b)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_tenant_isolation_get_page_image(self):
        """User B must not be able to fetch page rendered images belonging to User A."""
        with self.assertRaises(HTTPException) as ctx:
            get_page_image(document_id=self.doc_a.id, page_number=1, db=self.db, current_user=self.user_b)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_tenant_isolation_ask_question(self):
        """User B must not be able to submit Q&A queries against User A's document."""
        query = AskQuestionRequest(question="What is RSA?")
        with self.assertRaises(HTTPException) as ctx:
            ask_question(document_id=self.doc_a.id, query=query, db=self.db, current_user=self.user_b)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_tenant_isolation_document_listing(self):
        """Document list must only contain documents owned by the calling student."""
        docs_a = list_documents(db=self.db, current_user=self.user_a)
        docs_b = list_documents(db=self.db, current_user=self.user_b)

        self.assertEqual(len(docs_a), 1)
        self.assertEqual(docs_a[0].id, self.doc_a.id)
        self.assertEqual(len(docs_b), 0)

    def test_audit_log_contains_no_raw_student_text(self):
        """Audit trail must record metadata only and never persist sensitive student input."""
        audit = AuditLog(
            user_id=self.user_a.id,
            action="ask",
            document_id=self.doc_a.id,
        )
        self.db.add(audit)
        self.db.commit()

        # Verify columns in SQLite table schema
        columns = [c.name for c in AuditLog.__table__.columns]
        self.assertNotIn("question", columns)
        self.assertNotIn("question_text", columns)
        self.assertNotIn("prompt", columns)
        self.assertNotIn("raw_text", columns)
        self.assertNotIn("ocr_text", columns)


if __name__ == "__main__":
    unittest.main()
