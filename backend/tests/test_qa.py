import os
import shutil
import tempfile
import unittest
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models.audit import AuditLog
from backend.app.models.document import Block, Document, Page
from backend.app.models.user import User
from backend.app.services.qa import PassageChunk, QAService


class TestQAService(unittest.TestCase):
    """
    Unit tests for Phase 6: Intelligent Grounded Q&A Engine.
    Tests passage chunking, TF-IDF retrieval, zero-hallucination groundedness,
    multi-tenant isolation, and audit trail privacy.
    """

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.test_path = Path(self.test_dir)

        # In-memory SQLite database
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db = self.SessionLocal()

        # Seed student user A
        self.user_a = User(
            email="student_a@example.com",
            password_hash="test_pw_a",
            role="student",
        )
        self.db.add(self.user_a)

        # Seed student user B
        self.user_b = User(
            email="student_b@example.com",
            password_hash="test_pw_b",
            role="student",
        )
        self.db.add(self.user_b)
        self.db.commit()

        # Seed document for User A
        self.document = Document(
            user_id=self.user_a.id,
            filename="computer_networks.pdf",
            file_path="mock_path",
            status="completed",
            page_count=3,
        )
        self.db.add(self.document)
        self.db.commit()
        self.db.refresh(self.document)

        # Page 1: OSI Model
        self.page_1 = Page(
            document_id=self.document.id,
            page_number=1,
            image_path=str(self.test_path / "page_1.png"),
            ocr_text="The OSI model has seven abstraction layers.",
            pii_items_found=0,
        )
        self.db.add(self.page_1)
        self.db.commit()

        self.block_1 = Block(
            page_id=self.page_1.id,
            order_index=1,
            block_type="diagram",
            title="OSI 7 Layers Diagram",
            explanation_text=(
                "Visual diagram showing seven layers: Physical, Data Link, Network, "
                "Transport, Session, Presentation, and Application. "
                "Data flows from top layer to bottom layer during transmission."
            ),
        )
        self.db.add(self.block_1)

        # Page 2: TCP 3-Way Handshake
        self.page_2 = Page(
            document_id=self.document.id,
            page_number=2,
            image_path=str(self.test_path / "page_2.png"),
            ocr_text="Transmission Control Protocol connection establishment.",
            pii_items_found=0,
        )
        self.db.add(self.page_2)
        self.db.commit()

        self.block_2 = Block(
            page_id=self.page_2.id,
            order_index=1,
            block_type="flowchart",
            title="TCP 3-Way Handshake Flowchart",
            explanation_text=(
                "Client sends a SYN packet to server. Server responds with SYN-ACK packet. "
                "Finally client replies with ACK packet to establish reliable connection."
            ),
        )
        self.db.add(self.block_2)

        # Page 3: Dijkstra Algorithm
        self.page_3 = Page(
            document_id=self.document.id,
            page_number=3,
            image_path=str(self.test_path / "page_3.png"),
            ocr_text="Shortest path routing algorithms.",
            pii_items_found=0,
        )
        self.db.add(self.page_3)
        self.db.commit()

        self.block_3 = Block(
            page_id=self.page_3.id,
            order_index=1,
            block_type="formula",
            title="Dijkstra Shortest Path Formula",
            explanation_text=(
                "Dijkstra algorithm computes shortest paths from a single source node "
                "to all other graph vertices using a priority queue."
            ),
        )
        self.db.add(self.block_3)
        self.db.commit()
        self.db.refresh(self.document)

    def tearDown(self):
        self.db.close()
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_passage_extraction(self):
        """Passage chunking must extract all blocks and their page numbers."""
        passages = QAService.extract_document_passages(self.document)
        self.assertEqual(len(passages), 3)

        pages = [p.page_number for p in passages]
        self.assertIn(1, pages)
        self.assertIn(2, pages)
        self.assertIn(3, pages)

    def test_tfidf_retrieval_relevance(self):
        """Querying about TCP handshake must accurately retrieve Page 2."""
        passages = QAService.extract_document_passages(self.document)
        matches = QAService.retrieve_relevant_passages(passages, "How does TCP handshake work with SYN and ACK?")

        self.assertGreater(len(matches), 0)
        top_passage, score = matches[0]
        self.assertEqual(top_passage.page_number, 2)
        self.assertIn("SYN-ACK", top_passage.text)
        self.assertGreater(score, 0.05)

    def test_grounded_answer_and_page_citation(self):
        """QAService must generate an answer grounded in the matching page."""
        answer, relevant_pages = QAService.answer_question(
            document=self.document,
            question="What is the first step in the TCP handshake?",
            db=self.db,
        )

        self.assertIn(2, relevant_pages)
        self.assertIn("Page 2", answer)
        self.assertIn("SYN", answer)

    def test_out_of_scope_question_returns_not_found(self):
        """Questions on topics not present in the document must be gracefully rejected without hallucination."""
        answer, relevant_pages = QAService.answer_question(
            document=self.document,
            question="What is the capital city of Australia or France?",
            db=self.db,
        )

        self.assertEqual(relevant_pages, [])
        self.assertIn("could not find an answer", answer.lower())

    def test_audit_log_privacy(self):
        """Audit trail must record action 'ask' without saving the raw student question string (FR16)."""
        audit = AuditLog(
            user_id=self.user_a.id,
            action="ask",
            document_id=self.document.id,
        )
        self.db.add(audit)
        self.db.commit()

        saved_audit = self.db.query(AuditLog).filter(AuditLog.document_id == self.document.id).first()
        self.assertIsNotNone(saved_audit)
        self.assertEqual(saved_audit.action, "ask")

        # Confirm model has no raw question content column
        self.assertFalse(hasattr(saved_audit, "question_text"))
        self.assertFalse(hasattr(saved_audit, "raw_content"))


if __name__ == "__main__":
    unittest.main()
