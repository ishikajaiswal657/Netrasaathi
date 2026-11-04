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

    def test_deterministic_fallback_generator(self):
        """
        Fallback generator must classify different content elements
        (diagrams, flowcharts, formulas, text) into appropriate block types.
        """
        sample_text = (
            "System Architecture Diagram with microservices and API gateway.\n\n"
            "Flowchart Step 1: User submits request. Decision: If authorized, continue; else reject.\n\n"
            "E = m * c^2\n\n"
            "Standard introductory textbook text explaining background principles."
        )

        analysis = VisionService.generate_fallback_blocks(ocr_text=sample_text, page_number=1)

        self.assertIsInstance(analysis, PageAnalysisSchema)
        self.assertEqual(len(analysis.blocks), 4)

        # Check types
        block_types = [b.block_type for b in analysis.blocks]
        self.assertIn("diagram", block_types)
        self.assertIn("flowchart", block_types)
        self.assertIn("formula", block_types)
        self.assertIn("text", block_types)

        # Check ordering
        self.assertEqual([b.order_index for b in analysis.blocks], [1, 2, 3, 4])

    @patch("backend.app.services.vision.settings")
    def test_mocked_openai_vision_call(self, mock_settings):
        """Simulate real OpenAI Vision structured API completion and ensure parser handles it."""
        mock_settings.OPENAI_API_KEY = "sk-test-live-key"
        mock_settings.OPENAI_VISION_MODEL = "gpt-4o"

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

            result = VisionService.explain_page_image(
                image_path=self.image_path,
                ocr_text="BST diagram",
                page_number=1,
            )

            self.assertEqual(len(result.blocks), 2)
            self.assertEqual(result.blocks[0].title, "Binary Search Tree Diagram")
            self.assertEqual(result.blocks[1].block_type, "formula")

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

