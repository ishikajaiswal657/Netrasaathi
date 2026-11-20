import base64
import logging
from pathlib import Path
from typing import Literal
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.config import get_settings
from backend.app.models.document import Block, Page

logger = logging.getLogger("netrasaathi.vision")
settings = get_settings()


class VisualBlockSchema(BaseModel):
    """Structured reading block representing a visual element or text passage."""
    order_index: int = Field(
        description="1-based natural reading order (top-to-bottom, left-to-right)"
    )
    block_type: Literal["text", "diagram", "flowchart", "graph", "table", "formula"] = Field(
        description="Classification of the content element"
    )
    title: str = Field(
        description="Concise descriptive title (e.g. 'Database Schema Diagram', 'Newton's Second Law')"
    )
    explanation_text: str = Field(
        description=(
            "Accessible spoken-English explanation designed for visually impaired students. "
            "Diagrams: describe layout, components, and arrows. "
            "Flowcharts: describe start, branches ('if yes, do X; if no, jump to Y'), and end. "
            "Graphs: describe axes, trends, and peaks. "
            "Formulas: translate symbols into clear spoken words (e.g. 'a squared plus b squared'). "
            "Tables: read row-by-row associating column headers."
        )
    )


class PageAnalysisSchema(BaseModel):
    """Complete structured visual breakdown of an uploaded study page."""
    page_summary: str = Field(
        description="High-level 1-2 sentence summary of what this page covers"
    )
    blocks: list[VisualBlockSchema] = Field(
        description="Ordered list of visual and text explanation blocks"
    )


class VisionService:
    """
    OpenAI Vision AI service for Netrasaathi.
    Transforms redacted page raster PNGs and OCR text into structured, accessible
    explanation blocks ready for browser speech synthesis.
    """

    @staticmethod
    def encode_image_to_base64(image_path: Path) -> str:
        """Reads image binary from disk and converts to base64 string."""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

    @classmethod
    def generate_fallback_blocks(cls, ocr_text: str, page_number: int = 1) -> PageAnalysisSchema:
        """
        Grounded fallback generator when OpenAI Vision is unavailable.
        Strict rule: Never invent synthetic diagrams, flowcharts, or explanations.
        Serves only exact OCR text labeled 'Raw text, no AI explanation'.
        If no text is detected, returns an empty block list.
        """
        raw_text = (ocr_text or "").strip()
        if not raw_text:
            return PageAnalysisSchema(
                page_summary=f"Page {page_number}: No visual or textual content could be verified.",
                blocks=[],
            )

        return PageAnalysisSchema(
            page_summary=f"Page {page_number} raw extracted text without AI visual explanation.",
            blocks=[
                VisualBlockSchema(
                    order_index=1,
                    block_type="text",
                    title="Raw text, no AI explanation",
                    explanation_text=raw_text,
                )
            ],
        )

    @classmethod
    def explain_page_image(
        cls,
        image_path: Path,
        ocr_text: str = "",
        page_number: int = 1,
    ) -> tuple[PageAnalysisSchema, bool, str | None]:
        """
        Sends the redacted page PNG to OpenAI Vision API with strict grounding instructions.
        Returns a tuple: (analysis_schema, is_success, error_reason).
        """
        api_key = settings.OPENAI_API_KEY

        # Check if OpenAI API key is missing or set to placeholder/mock value
        if not api_key or api_key in ["mock", "test", ""] or api_key.startswith("your_openai"):
            reason = "OpenAI API key is not configured on the server."
            logger.warning(f"Page {page_number}: {reason}")
            return cls.generate_fallback_blocks(ocr_text=ocr_text, page_number=page_number), False, reason

        try:
            from openai import OpenAI

            client = OpenAI(api_key=api_key)
            b64_image = cls.encode_image_to_base64(image_path)

            system_prompt = (
                "You are Netrasaathi, an educational accessibility assistant that converts study material images "
                "into clear, accessible spoken descriptions for visually impaired students.\n"
                "Strict Rules:\n"
                "1. Grounding: Describe ONLY what is visible in this page image. Add NO outside knowledge or unstated assumptions.\n"
                "2. Clarity: If any visual part, word, or symbol is blurry, partially cropped, or unclear, explicitly state that it is unclear.\n"
                "3. Language: Use very simple English with short, direct sentences. Define any technical term in plain words.\n"
                "4. Reading Order: Break down the page strictly in top-to-bottom, left-to-right natural reading sequence.\n"
                "5. Diagrams and Flowcharts: Walk through the parts, nodes, labels, and arrow directions step-by-step.\n"
                "6. Graphs: State the graph type, axes labels and units, general trend, and the highest and lowest values.\n"
                "7. Tables: First state what the table is about, then read rows in a natural narrative way connecting column headers to values.\n"
                "8. Formulas: Pronounce every symbol in spoken words, followed by one line explaining its meaning.\n"
                "9. Output Format: Produce structured JSON matching the provided schema with block types strictly chosen from: "
                "'text', 'diagram', 'flowchart', 'graph', 'table', 'formula'."
            )

            completion = client.beta.chat.completions.parse(
                model=settings.OPENAI_VISION_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    f"Here is page {page_number}. Extracted OCR text for reference:\n\n"
                                    f"{ocr_text}\n\n"
                                    "Analyze only the elements visibly present on this page image."
                                ),
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{b64_image}",
                                    "detail": "high",
                                },
                            },
                        ],
                    },
                ],
                response_format=PageAnalysisSchema,
                temperature=0.1,
                max_tokens=4000,
            )

            parsed_result = completion.choices[0].message.parsed
            if parsed_result and parsed_result.blocks:
                return parsed_result, True, None

            reason = "OpenAI Vision returned an empty analysis for this page."
            return cls.generate_fallback_blocks(ocr_text=ocr_text, page_number=page_number), False, reason

        except Exception as exc:
            reason = f"OpenAI Vision API call failed: {str(exc)}"
            logger.warning(f"Page {page_number}: {reason}")
            return cls.generate_fallback_blocks(ocr_text=ocr_text, page_number=page_number), False, reason

    @classmethod
    def process_page_blocks(cls, page: Page, db: Session) -> list[Block]:
        """
        Analyzes a single page and stores the structured explanation blocks in the database.
        If Vision API succeeds, marks page status as 'ready'.
        If Vision API fails, marks page status as 'failed' with error_message and saves only raw text if available.
        Clears any pre-existing blocks for the page to prevent duplicate entries on re-processing.
        """
        # Delete any existing blocks for this page
        db.query(Block).filter(Block.page_id == page.id).delete()
        db.commit()

        analysis, is_success, reason = cls.explain_page_image(
            image_path=Path(page.image_path),
            ocr_text=page.ocr_text or "",
            page_number=page.page_number,
        )

        if is_success:
            page.status = "ready"
            page.error_message = None
        else:
            page.status = "failed"
            page.error_message = reason

        created_blocks: list[Block] = []
        for item in analysis.blocks:
            block_record = Block(
                page_id=page.id,
                order_index=item.order_index,
                block_type=item.block_type,
                title=item.title,
                explanation_text=item.explanation_text,
            )
            db.add(block_record)
            created_blocks.append(block_record)

        db.commit()
        db.refresh(page)
        for b in created_blocks:
            db.refresh(b)

        return created_blocks

