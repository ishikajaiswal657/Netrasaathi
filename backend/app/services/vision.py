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
        Intelligent deterministic fallback generator.
        Used when OPENAI_API_KEY is not configured or during offline testing/dev mode.
        Extracts semantic blocks from OCR text, classifying equations, diagrams, and paragraphs.
        """
        raw_text = (ocr_text or "").strip()
        if not raw_text:
            return PageAnalysisSchema(
                page_summary=f"Page {page_number} visual study worksheet.",
                blocks=[
                    VisualBlockSchema(
                        order_index=1,
                        block_type="text",
                        title=f"Page {page_number} Overview",
                        explanation_text=(
                            f"This is page {page_number} of your study material. "
                            "No distinct text was detected on this page image."
                        ),
                    )
                ],
            )

        paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
        if not paragraphs:
            paragraphs = [raw_text]

        blocks: list[VisualBlockSchema] = []
        for idx, para in enumerate(paragraphs, start=1):
            lower_para = para.lower()

            # Content element classification heuristics
            if any(term in lower_para for term in ["flowchart", "step 1", "decision", "start ->", "process:"]):
                b_type: Literal["text", "diagram", "flowchart", "graph", "table", "formula"] = "flowchart"
                title = f"Flowchart: Step-by-Step Path {idx}"
                desc = f"Flowchart process path: {para}"
            elif any(term in lower_para for term in ["diagram", "architecture", "figure", "illustration", "circuit", "node"]):
                b_type = "diagram"
                title = f"Visual Diagram {idx}"
                desc = f"Visual layout and component structure: {para}"
            elif any(term in lower_para for term in ["graph", "plot", "x-axis", "y-axis", "chart", "trend"]):
                b_type = "graph"
                title = f"Data Chart / Graph {idx}"
                desc = f"Data visualization and metric trends: {para}"
            elif any(term in lower_para for term in ["table", "column", "row", "|", "tabular"]):
                b_type = "table"
                title = f"Structured Data Table {idx}"
                desc = f"Data table contents: {para}"
            elif any(term in lower_para for term in ["=", "∫", "∑", "formula", "equation", "sqrt", "^", "+", "-"] ) and len(para.split()) < 20:
                b_type = "formula"
                title = f"Mathematical Formula {idx}"
                desc = f"Spoken equation: {para.replace('=', ' equals ').replace('+', ' plus ').replace('-', ' minus ')}"
            else:
                b_type = "text"
                title = f"Reading Passage {idx}"
                desc = para

            blocks.append(
                VisualBlockSchema(
                    order_index=idx,
                    block_type=b_type,
                    title=title,
                    explanation_text=desc,
                )
            )

        summary = f"Page {page_number} containing {len(blocks)} structured study elements."
        return PageAnalysisSchema(page_summary=summary, blocks=blocks)

    @classmethod
    def explain_page_image(
        cls,
        image_path: Path,
        ocr_text: str = "",
        page_number: int = 1,
    ) -> PageAnalysisSchema:
        """
        Sends the redacted page PNG to OpenAI Vision API with Pydantic structured output formatting.
        Gracefully falls back to deterministic analysis if the API key is not configured or errors out.
        """
        api_key = settings.OPENAI_API_KEY

        # Check if OpenAI API key is missing or set to placeholder/mock value
        if not api_key or api_key in ["mock", "test", ""] or api_key.startswith("your_openai"):
            logger.info("Using local deterministic vision analyzer (no OpenAI API key configured).")
            return cls.generate_fallback_blocks(ocr_text=ocr_text, page_number=page_number)

        try:
            from openai import OpenAI

            client = OpenAI(api_key=api_key)
            b64_image = cls.encode_image_to_base64(image_path)

            system_prompt = (
                "You are Netrasaathi, an accessibility AI that translates visual study materials "
                "(diagrams, flowcharts, graphs, tables, formulas) into clear, structured spoken English "
                "for visually impaired computer science and engineering students.\n"
                "Break down the provided page image into distinct explanation blocks ordered strictly "
                "in top-to-bottom reading sequence.\n"
                "Rules:\n"
                "- For diagrams: describe main components, layout, and arrow directions.\n"
                "- For flowcharts: describe starting state, conditional branches ('if yes, do X; if no, jump to Y'), and terminal states.\n"
                "- For graphs: identify axes, units, peaks, troughs, and overall trend.\n"
                "- For formulas: translate symbols into clear spoken words (e.g. 'a squared plus b squared equals c squared').\n"
                "- For tables: read row-by-row with header associations.\n"
                "- Provide clear, concise titles for each block."
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
                                    "Analyze every visual and textual element on this page image."
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
                max_tokens=4000,
            )

            parsed_result = completion.choices[0].message.parsed
            if parsed_result and parsed_result.blocks:
                return parsed_result

            # If response was empty, use fallback
            return cls.generate_fallback_blocks(ocr_text=ocr_text, page_number=page_number)

        except Exception as exc:
            logger.warning(
                f"OpenAI Vision API call failed ({exc}); falling back to local deterministic generator."
            )
            return cls.generate_fallback_blocks(ocr_text=ocr_text, page_number=page_number)

    @classmethod
    def process_page_blocks(cls, page: Page, db: Session) -> list[Block]:
        """
        Analyzes a single page and stores the structured explanation blocks in the database.
        Clears any pre-existing blocks for the page to prevent duplicate entries on re-processing.
        """
        # Delete any existing blocks for this page
        db.query(Block).filter(Block.page_id == page.id).delete()
        db.commit()

        analysis = cls.explain_page_image(
            image_path=Path(page.image_path),
            ocr_text=page.ocr_text or "",
            page_number=page.page_number,
        )

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
        for b in created_blocks:
            db.refresh(b)

        return created_blocks

