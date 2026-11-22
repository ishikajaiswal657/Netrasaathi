import base64
import json
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
from backend.app.models.document import Block, Document, Page, PageExplanation
from backend.app.models.user import User
from backend.app.services.vision import (
    PageAnalysisSchema,
    StageAItem,
    StageAPageExtraction,
    StageBBlock,
    StageBExplanation,
    VisionService,
    VisualBlockSchema,
    format_block_spoken_text,
)


class TestVisionService(unittest.TestCase):
    """
    Unit tests for FIX A: Two-stage visual explanation pipeline.
    Stage A: Language-neutral verbatim extraction via Vision model.
    Stage B: Pedagogical explanation in target language via Text model.
    Includes coverage checking, copy checking, caching, and grounded fallbacks.
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

    # ----------------------------------------------------------------------
    # 1. SCHEMA VALIDATION TESTS
    # ----------------------------------------------------------------------
    def test_stage_a_schema_valid_and_invalid(self):
        """Stage A schema must accept valid item types and reject invalid types."""
        valid_item = StageAItem(
            id="item-1",
            item_type="diagram_node",
            content="Primary database node with replication factor 3.",
        )
        self.assertEqual(valid_item.item_type, "diagram_node")

        # Invalid item type should raise ValidationError
        with self.assertRaises(ValidationError):
            StageAItem(
                id="item-2",
                item_type="unsupported_type",  # type: ignore
                content="Invalid element",
            )

    def test_stage_b_spoken_text_formatting_with_extra_help(self):
        """Spoken text must clearly announce the Extra Help disclaimer label."""
        block = StageBBlock(
            order_index=1,
            block_type="text",
            title="Database Sharding",
            one_line_summary="Splits large databases horizontally across multiple servers.",
            from_notes_text="Sharding divides rows into distinct partition ranges.",
            extra_help_text="Think of dividing a large library encyclopedia into separate volumes A-M and N-Z.",
            covered_item_ids=["item-1"],
        )
        spoken_en = format_block_spoken_text(block, "en-IN")
        self.assertIn("Extra help (not from your notes):", spoken_en)
        self.assertIn("library encyclopedia", spoken_en)

        spoken_hi = format_block_spoken_text(block, "hi-IN")
        self.assertIn("अतिरिक्त सहायता (आपके नोट्स से बाहर):", spoken_hi)

    # ----------------------------------------------------------------------
    # 2. STAGE A ONCE PER PAGE (NEVER RERUN IF SAVED)
    # ----------------------------------------------------------------------
    def test_stage_a_runs_once_and_reuses_saved_json(self):
        """Stage A must save to page.stage_a_json and never call vision API again for the same page."""
        cached_stage_a = StageAPageExtraction(
            page_topic="Precomputed Stage A Topic",
            items=[
                StageAItem(id="item-10", item_type="paragraph", content="Saved Stage A Content.")
            ],
        )
        self.page.stage_a_json = cached_stage_a.model_dump_json()
        self.db.commit()

        # Calling process_page_blocks should not call OpenAI Vision because stage_a_json is populated
        with patch("backend.app.services.vision.VisionService.extract_stage_a") as mock_extract:
            blocks = VisionService.process_page_blocks(self.page, self.db)
            mock_extract.assert_not_called()
            self.assertGreaterEqual(len(blocks), 1)

    # ----------------------------------------------------------------------
    # 3. STAGE B COVERAGE CHECK
    # ----------------------------------------------------------------------
    def test_stage_b_coverage_check_detects_and_fills_missing_items(self):
        """At Detailed level, every Stage A item must be covered. Omitted items must be recovered."""
        stage_a = StageAPageExtraction(
            page_topic="Networking",
            items=[
                StageAItem(id="item-1", item_type="paragraph", content="Concept 1"),
                StageAItem(id="item-2", item_type="paragraph", content="Concept 2"),
                StageAItem(id="item-3", item_type="paragraph", content="Concept 3"),
            ],
        )

        # Simulate first call omitting item-3
        partial_explanation = StageBExplanation(
            page_topic="Networking",
            one_line_summary="Overview of networking",
            blocks=[
                StageBBlock(
                    order_index=1,
                    block_type="text",
                    title="Concept 1 and 2",
                    one_line_summary="Basics of network communication.",
                    from_notes_text="Explains concepts 1 and 2.",
                    extra_help_text=None,
                    covered_item_ids=["item-1", "item-2"],
                )
            ],
            all_covered_item_ids=["item-1", "item-2"],
        )

        # Gap fill response covering item-3
        gap_fill = StageBExplanation(
            page_topic="Networking",
            one_line_summary="Concept 3 summary",
            blocks=[
                StageBBlock(
                    order_index=2,
                    block_type="text",
                    title="Concept 3",
                    one_line_summary="Advanced routing details.",
                    from_notes_text="Explains concept 3.",
                    extra_help_text=None,
                    covered_item_ids=["item-3"],
                )
            ],
            all_covered_item_ids=["item-3"],
        )

        with patch("backend.app.services.vision.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = "sk-valid-key"
            mock_settings.TEXT_MODEL = "gpt-4o-mini"
            with patch("openai.OpenAI") as mock_openai_cls:
                mock_client = MagicMock()
                mock_openai_cls.return_value = mock_client

                # First call returns partial, second returns gap fill
                first_completion = MagicMock()
                first_completion.choices = [MagicMock(message=MagicMock(parsed=partial_explanation))]
                first_completion.usage = MagicMock(prompt_tokens=100, completion_tokens=50, total_tokens=150)

                second_completion = MagicMock()
                second_completion.choices = [MagicMock(message=MagicMock(parsed=gap_fill))]
                second_completion.usage = MagicMock(prompt_tokens=50, completion_tokens=30, total_tokens=80)

                mock_client.beta.chat.completions.parse.side_effect = [first_completion, second_completion]

                result, is_success, reason = VisionService.generate_stage_b_explanation(
                    stage_a=stage_a,
                    language="en-IN",
                    detail_level="detailed",
                    page_number=1,
                )

                self.assertTrue(is_success)
                self.assertEqual(len(result.blocks), 2)
                self.assertIn("item-3", result.all_covered_item_ids)

    # ----------------------------------------------------------------------
    # 4. STAGE B COPY CHECK
    # ----------------------------------------------------------------------
    def test_stage_b_copy_check_rejects_mostly_copied_text(self):
        """If >60% of sentences are verbatim copied from page text, copy check must trigger a retry."""
        raw_text = "This is a very long sentence that was copied verbatim from the student's handwritten study notes."
        stage_a = StageAPageExtraction(
            page_topic="Copy Test",
            items=[StageAItem(id="item-1", item_type="paragraph", content=raw_text)],
        )

        copied_explanation = StageBExplanation(
            page_topic="Copy Test",
            one_line_summary="Copy Test",
            blocks=[
                StageBBlock(
                    order_index=1,
                    block_type="text",
                    title="Section 1",
                    one_line_summary="Copied summary",
                    from_notes_text=raw_text,  # Verbatim copy
                    extra_help_text=None,
                    covered_item_ids=["item-1"],
                )
            ],
            all_covered_item_ids=["item-1"],
        )

        is_copied = VisionService._is_mostly_copied(copied_explanation, stage_a)
        self.assertTrue(is_copied)

    # ----------------------------------------------------------------------
    # 5. CACHING IN PAGE_EXPLANATIONS TABLE
    # ----------------------------------------------------------------------
    def test_stage_b_caching_in_database(self):
        """Repeated requests for same (page, language, detail_level) must read from DB cache without calling OpenAI."""
        stage_a = StageAPageExtraction(
            page_topic="Cache Test",
            items=[StageAItem(id="item-1", item_type="paragraph", content="Sample content.")],
        )
        self.page.stage_a_json = stage_a.model_dump_json()

        # Seed pre-existing explanation cache
        cached_record = PageExplanation(
            page_id=self.page.id,
            language="hi-IN",
            detail_level="standard",
            one_line_summary="हिंदी संक्षेप",
            page_topic="हिंदी विषय",
            blocks_json=json.dumps([
                {
                    "order_index": 1,
                    "block_type": "text",
                    "title": "हिंदी शीर्षक",
                    "one_line_summary": "हिंदी संक्षेप",
                    "from_notes_text": "हिंदी में व्याख्या।",
                    "extra_help_text": None,
                    "original_text": "Sample content.",
                    "covered_item_ids": ["item-1"],
                }
            ]),
        )
        self.db.add(cached_record)
        self.db.commit()

        # Calling process_page_blocks with hi-IN and standard should hit cache directly
        with patch("backend.app.services.vision.VisionService.generate_stage_b_explanation") as mock_stage_b:
            blocks = VisionService.process_page_blocks(
                self.page,
                self.db,
                language="hi-IN",
                detail_level="standard",
            )
            mock_stage_b.assert_not_called()
            self.assertEqual(len(blocks), 1)
            self.assertEqual(blocks[0].title, "हिंदी शीर्षक")
            self.assertEqual(blocks[0].one_line_summary, "हिंदी संक्षेप")

    # ----------------------------------------------------------------------
    # 6. GROUNDED FALLBACK ON OPENAI FAILURE
    # ----------------------------------------------------------------------
    def test_failed_openai_call_produces_raw_text_only(self):
        """A failed OpenAI call with OCR text must set page to failed and produce raw text labeled block."""
        with patch("backend.app.services.vision.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = ""
            created_blocks = VisionService.process_page_blocks(self.page, self.db)

        self.assertEqual(self.page.status, "failed")
        self.assertIsNotNone(self.page.error_message)
        self.assertGreaterEqual(len(created_blocks), 1)
        self.assertIn("Page 1", created_blocks[0].title)

    def test_encode_image_to_base64(self):
        """Image encoding must return valid base64 decodable to the original bytes."""
        b64_str = VisionService.encode_image_to_base64(self.image_path)
        self.assertIsInstance(b64_str, str)
        self.assertGreater(len(b64_str), 50)

        decoded_bytes = base64.b64decode(b64_str)
        with open(self.image_path, "rb") as f:
            original_bytes = f.read()
        self.assertEqual(decoded_bytes, original_bytes)


if __name__ == "__main__":
    unittest.main()
