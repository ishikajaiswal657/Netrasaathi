import base64
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch
from PIL import Image
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models.document import Block, Document, Page
from backend.app.models.user import User
from backend.app.services.vision import (
    PageAnalysisSchema,
    VisionService,
    VisualBlockSchema,
)


class TestVisionService(unittest.TestCase):
    """
    Unit tests for Phase 4: OpenAI Vision AI (Diagram & Visual Reading).
    Tests schema validation, base64 encoding, intelligent deterministic fallback,
    OpenAI structured output parsing, and database persistence.
    """

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.test_path = Path(self.test_dir)

        # In-memory SQLite database
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db = self.SessionLocal()

        # Seed student user
        self.user = User(
            email="vision_student@example.com",
            password_hash="test_hash",
            role="student",
        )
        self.db.add(self.user)
        self.db.commit()
        self.db.refresh(self.user)

        # Seed document
        self.document = Document(
            user_id=self.user.id,
            filename="diagrams.pdf",
            file_path="mock_path",
            status="processed",
            page_count=1,
        )
        self.db.add(self.document)
        self.db.commit()
        self.db.refresh(self.document)

        # Seed test page with raster PNG
        self.image_path = self.test_path / "page_1_redacted.png"
        img = Image.new("RGB", (300, 200), color=(240, 240, 240))
        img.save(self.image_path, "PNG")

        self.page = Page(
            document_id=self.document.id,
            page_number=1,
            image_path=str(self.image_path),
            ocr_text="System Architecture Diagram\n\nFlowchart: Start -> Decision -> End\n\nF = m * a",
            pii_items_found=0,
        )
        self.db.add(self.page)
        self.db.commit()
        self.db.refresh(self.page)

    def tearDown(self):
        self.db.close()
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_schema_valid_and_invalid_block_types(self):
        """Pydantic schema must accept valid block types and reject invalid types."""
        valid_block = VisualBlockSchema(
            order_index=1,
            block_type="diagram",
            title="Database Architecture",
            explanation_text="A visual representation of primary and secondary nodes.",
        )
        self.assertEqual(valid_block.block_type, "diagram")

        # Invalid type should raise ValidationError
        with self.assertRaises(ValidationError):
            VisualBlockSchema(
                order_index=2,
                block_type="invalid_type",  # type: ignore
                title="Unknown",
                explanation_text="Invalid block.",
            )

    def test_encode_image_to_base64(self):
        """Image encoding must return valid base64 decodable to the original bytes."""
        b64_str = VisionService.encode_image_to_base64(self.image_path)
        self.assertIsInstance(b64_str, str)
        self.assertGreater(len(b64_str), 50)

        # Decoding back must match original bytes
        decoded_bytes = base64.b64decode(b64_str)
        with open(self.image_path, "rb") as f:
            original_bytes = f.read()
        self.assertEqual(decoded_bytes, original_bytes)

    def test_grounded_fallback_returns_raw_text_only(self):
        """
        Fallback generator must NEVER invent synthetic diagrams or explanations.
        It must strictly return raw OCR text labeled 'Raw text, no AI explanation'.
        """
        sample_text = "Quantum Key Distribution using BB84 protocol with polarized photons."

        analysis = VisionService.generate_fallback_blocks(ocr_text=sample_text, page_number=1)

        self.assertIsInstance(analysis, PageAnalysisSchema)
        self.assertEqual(len(analysis.blocks), 1)
        self.assertEqual(analysis.blocks[0].block_type, "text")
        self.assertEqual(analysis.blocks[0].title, "Raw text, no AI explanation")
        self.assertEqual(analysis.blocks[0].explanation_text, sample_text)

    def test_grounded_fallback_empty_when_no_ocr_text(self):
        """When no OCR text is available, fallback must return 0 blocks instead of inventing content."""
        analysis = VisionService.generate_fallback_blocks(ocr_text="", page_number=1)
        self.assertEqual(len(analysis.blocks), 0)

    @patch("backend.app.services.vision.settings")
    def test_mocked_openai_vision_call(self, mock_settings):
        """Simulate real OpenAI Vision structured API completion and ensure parser handles it."""
        mock_settings.OPENAI_API_KEY = "sk-test-live-key"
        mock_settings.OPENAI_VISION_MODEL = "gpt-4o-mini"

        mock_parsed_response = PageAnalysisSchema(
            page_summary="Page containing a binary search tree diagram and pseudocode.",
            blocks=[
                VisualBlockSchema(
                    order_index=1,
                    block_type="diagram",
                    title="Binary Search Tree Diagram",
                    explanation_text="Root node contains 50, left child is 30, right child is 70.",
                ),
                VisualBlockSchema(
                    order_index=2,
                    block_type="formula",
                    title="Time Complexity Formula",
                    explanation_text="Time complexity is big O of log n.",
                ),
            ],
        )

        mock_choice = MagicMock()
        mock_choice.message.parsed = mock_parsed_response
        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        with patch("openai.OpenAI") as mock_openai_cls:
            mock_client = MagicMock()
            mock_openai_cls.return_value = mock_client
            mock_client.beta.chat.completions.parse.return_value = mock_completion

            result, is_success, reason = VisionService.explain_page_image(
                image_path=self.image_path,
                ocr_text="BST diagram",
                page_number=1,
            )

            self.assertTrue(is_success)
            self.assertIsNone(reason)
            self.assertEqual(len(result.blocks), 2)
            self.assertEqual(result.blocks[0].title, "Binary Search Tree Diagram")
            self.assertEqual(result.blocks[1].block_type, "formula")

    def test_failed_openai_call_without_ocr_produces_failed_page_and_no_blocks(self):
        """A failed OpenAI call with no OCR text must set page to failed and generate NO synthetic blocks."""
        blank_page = Page(
            document_id=self.document.id,
            page_number=2,
            image_path=str(self.image_path),
            ocr_text="",
            pii_items_found=0,
        )
        self.db.add(blank_page)
        self.db.commit()
        self.db.refresh(blank_page)

        # Force failure via invalid key
        with patch("backend.app.services.vision.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = ""
            created_blocks = VisionService.process_page_blocks(blank_page, self.db)

        self.assertEqual(blank_page.status, "failed")
        self.assertIsNotNone(blank_page.error_message)
        self.assertEqual(len(created_blocks), 0)

    def test_failed_openai_call_with_ocr_produces_raw_text_only(self):
        """A failed OpenAI call with OCR text must set page to failed and produce raw text labeled block."""
        with patch("backend.app.services.vision.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = ""
            created_blocks = VisionService.process_page_blocks(self.page, self.db)

        self.assertEqual(self.page.status, "failed")
        self.assertIsNotNone(self.page.error_message)
        self.assertEqual(len(created_blocks), 1)
        self.assertEqual(created_blocks[0].title, "Raw text, no AI explanation")
        self.assertEqual(created_blocks[0].explanation_text, self.page.ocr_text)

    def test_unique_document_content_strictly_isolated(self):
        """Unique words from a student's document must strictly belong to that document and page."""
        unique_text = "UniqueStudentProofBB84ProtocolVerification"
        mock_parsed = PageAnalysisSchema(
            page_summary="Proof of protocol",
            blocks=[
                VisualBlockSchema(
                    order_index=1,
                    block_type="text",
                    title="Student Proof",
                    explanation_text=f"The proof states: {unique_text}",
                )
            ],
        )

        with patch("backend.app.services.vision.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = "sk-valid-key"
            mock_settings.OPENAI_VISION_MODEL = "gpt-4o-mini"
            with patch("openai.OpenAI") as mock_openai_cls:
                mock_choice = MagicMock()
                mock_choice.message.parsed = mock_parsed
                mock_completion = MagicMock()
                mock_completion.choices = [mock_choice]
                mock_client = MagicMock()
                mock_openai_cls.return_value = mock_client
                mock_client.beta.chat.completions.parse.return_value = mock_completion

                blocks = VisionService.process_page_blocks(self.page, self.db)

        self.assertEqual(self.page.status, "ready")
        self.assertEqual(len(blocks), 1)
        self.assertIn(unique_text, blocks[0].explanation_text)
        self.assertEqual(blocks[0].page_id, self.page.id)

    def test_process_page_blocks_persists_to_database(self):
        """process_page_blocks must persist structured Block records to the DB."""
        created_blocks = VisionService.process_page_blocks(self.page, self.db)

        self.assertGreaterEqual(len(created_blocks), 1)

        # Verify records exist in DB
        db_blocks = self.db.query(Block).filter(Block.page_id == self.page.id).all()
        self.assertEqual(len(db_blocks), len(created_blocks))

        first_block = db_blocks[0]
        self.assertEqual(first_block.order_index, 1)
        self.assertIsNotNone(first_block.title)
        self.assertIsNotNone(first_block.explanation_text)

        # Re-running process_page_blocks should replace, not duplicate
        re_created = VisionService.process_page_blocks(self.page, self.db)
        re_db_blocks = self.db.query(Block).filter(Block.page_id == self.page.id).all()
        self.assertEqual(len(re_db_blocks), len(re_created))


if __name__ == "__main__":
    unittest.main()

