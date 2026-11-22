import base64
import json
import logging
import re
from pathlib import Path
from typing import Any, Literal
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.config import get_settings
from backend.app.models.document import Block, Page, PageExplanation

logger = logging.getLogger("netrasaathi.vision")
settings = get_settings()

# Cost per 1M tokens (gpt-4o-mini as of OpenAI official pricing):
# Input: $0.150 per 1M tokens ($0.00000015 / token)
# Output: $0.600 per 1M tokens ($0.00000060 / token)
TOKEN_PRICING = {
    "gpt-4o-mini": {"input": 0.150 / 1_000_000, "output": 0.600 / 1_000_000},
    "gpt-4o": {"input": 2.50 / 1_000_000, "output": 10.00 / 1_000_000},
}


# ==========================================
# STAGE A SCHEMAS: Verbatim, Language-Neutral Extraction
# ==========================================

class StageAItem(BaseModel):
    """An individual verbatim element extracted directly from the page image."""
    id: str = Field(description="Unique identifier, e.g. 'item-1', 'item-2'")
    item_type: Literal[
        "paragraph", "bullet", "definition", "example", "step",
        "formula", "table_row", "diagram_node", "diagram_link", "graph_value"
    ] = Field(description="Type of content element")
    content: str = Field(description="Exact content as visible on the page. If blurry or unclear, state 'unclear'")


class KeyTerm(BaseModel):
    """Key technical or subject term defined on the page."""
    term: str = Field(description="The key term in original language/spelling")
    definition: str = Field(description="The definition or statement about this term as given on the page")


class DiagramElement(BaseModel):
    """Visual diagram component extracted from the page."""
    element_type: Literal["node", "arrow", "label", "container"] = Field(
        description="Type of diagram element"
    )
    label: str = Field(description="Text or symbol label on this element")
    source: str | None = Field(default=None, description="Starting component name if an arrow/connector")
    target: str | None = Field(default=None, description="Target component name if an arrow/connector")
    description: str = Field(description="Where it is positioned and how it connects")


class GraphData(BaseModel):
    """Visual graph extracted from the page."""
    graph_type: str = Field(description="Type of graph (e.g. line, bar, scatter, pie) or 'none'")
    x_axis: str = Field(default="", description="X-axis label and units if visible")
    y_axis: str = Field(default="", description="Y-axis label and units if visible")
    trend: str = Field(default="", description="Trend described strictly from visible data")
    key_values: list[str] = Field(default_factory=list, description="Notable data points, peaks, or values")


class TableData(BaseModel):
    """Tabular data extracted from the page."""
    headers: list[str] = Field(default_factory=list, description="Column headers in visual order")
    rows: list[list[str]] = Field(default_factory=list, description="Row values row by row")


class StageAPageExtraction(BaseModel):
    """Language-neutral structured extraction of all visible content on a single page."""
    page_topic: str = Field(description="Primary topic or heading of the page")
    is_unclear: bool = Field(default=False, description="True if any significant text or diagram is blurry")
    unclear_notes: str = Field(default="", description="Notes detailing any illegible or cropped sections")
    items: list[StageAItem] = Field(description="Ordered list of extracted items verbatim from the page")
    key_terms: list[KeyTerm] = Field(default_factory=list, description="Key terms defined on the page")
    diagrams: list[DiagramElement] = Field(default_factory=list, description="Diagram nodes, arrows, and labels")
    graphs: list[GraphData] = Field(default_factory=list, description="Graph data if present")
    tables: list[TableData] = Field(default_factory=list, description="Table data if present")


# ==========================================
# STAGE B SCHEMAS: Pedagogical Explanation in Target Language
# ==========================================

class StageBBlock(BaseModel):
    """One section or visual element explained for accessible audio and visual reading."""
    order_index: int = Field(description="1-based reading sequence order")
    block_type: Literal["text", "diagram", "flowchart", "graph", "table", "formula"] = Field(
        description="Classification of content element"
    )
    title: str = Field(description="Descriptive title of this section in the chosen language")
    one_line_summary: str = Field(
        description="A real 1-line conceptual takeaway/summary for this section in the chosen language (not raw text)"
    )
    from_notes_text: str = Field(
        description="Explanation strictly faithful to what is in the student's notes, written in simple, clear teaching language."
    )
    extra_help_text: str | None = Field(
        default=None,
        description="Helpful intuitive analogy, simple real-world example, or intuitive explanation not directly from notes. Set to null if none needed."
    )
    original_text: str | None = Field(
        default=None,
        description="Verbatim text from the page for this section (optional reference)."
    )
    covered_item_ids: list[str] = Field(
        default_factory=list,
        description="List of Stage A item IDs covered in this block"
    )


class StageBExplanation(BaseModel):
    """Complete accessible explanation for a single page at a specific language and detail level."""
    page_topic: str = Field(description="Page topic translated/rendered in chosen language")
    one_line_summary: str = Field(
        description="A crisp, punchy one-line takeaway for the entire page in the chosen language"
    )
    blocks: list[StageBBlock] = Field(description="Ordered list of explanation blocks for the page")
    all_covered_item_ids: list[str] = Field(
        description="All Stage A item IDs covered across all blocks"
    )


# Backward-compatible schemas for existing endpoints and unit tests
class VisualBlockSchema(BaseModel):
    order_index: int
    block_type: Literal["text", "diagram", "flowchart", "graph", "table", "formula"]
    title: str
    explanation_text: str


class PageAnalysisSchema(BaseModel):
    page_summary: str
    blocks: list[VisualBlockSchema]


# ==========================================
# LOCALIZED LABELS FOR SPOKEN AUDIO
# ==========================================

EXTRA_HELP_LABELS = {
    "en": "Extra help (not from your notes)",
    "en-IN": "Extra help (not from your notes)",
    "en-US": "Extra help (not from your notes)",
    "hi": "अतिरिक्त सहायता (आपके नोट्स से बाहर)",
    "hi-IN": "अतिरिक्त सहायता (आपके नोट्स से बाहर)",
    "es": "Ayuda adicional (fuera de tus notas)",
    "es-ES": "Ayuda adicional (fuera de tus notas)",
    "ta": "கூடுதல் உதவி (உங்கள் குறிப்புகளில் இல்லை)",
    "ta-IN": "கூடுதல் உதவி (உங்கள் குறிப்புகளில் இல்லை)",
    "te": "అదనపు సహాయం (మీ నోట్స్ నుండి కాదు)",
    "te-IN": "అదనపు సహాయం (మీ నోట్స్ నుండి కాదు)",
    "mr": "अतिरिक्त मदत (तुमच्या नोट्समधून नाही)",
    "mr-IN": "अतिरिक्त मदत (तुमच्या नोट्समधून नाही)",
    "bn": "অতিরিক্ত সাহায্য (আপনার নোটের বাইরে)",
    "bn-IN": "অতিরিক্ত সাহায্য (আপনার নোটের বাইরে)",
    "gu": "વધારાની મદદ (તમારી નોંધો બહારથી)",
    "gu-IN": "વધારાની મદદ (તમારી નોંધો બહારથી)",
}


def get_extra_help_label(lang_code: str) -> str:
    """Returns spoken disclaimer label for extra outside knowledge in target language."""
    clean = (lang_code or "en-IN").strip()
    return EXTRA_HELP_LABELS.get(clean) or EXTRA_HELP_LABELS.get(clean.split("-")[0]) or "Extra help (not from your notes)"


def format_block_spoken_text(block: StageBBlock, lang_code: str) -> str:
    """Combines notes explanation and extra help with an explicit auditory disclaimer."""
    spoken = block.from_notes_text.strip()
    if block.extra_help_text and block.extra_help_text.strip():
        label = get_extra_help_label(lang_code)
        spoken += f"\n\n{label}: {block.extra_help_text.strip()}"
    return spoken


# ==========================================
# SERVICE IMPLEMENTATION
# ==========================================

class VisionService:
    """
    Two-stage explanation pipeline for Netrasaathi:
    Stage A (once per page): Language-neutral structured extraction using Vision model.
    Stage B (per page, per language, per detail level): Pedagogical explanation using Text model.
    """

    @staticmethod
    def encode_image_to_base64(image_path: Path) -> str:
        """Reads image binary from disk and converts to base64 string."""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

    @classmethod
    def generate_fallback_stage_a(cls, ocr_text: str, page_number: int = 1) -> StageAPageExtraction:
        """
        Grounded fallback Stage A generator when OpenAI Vision is unavailable.
        Strict rule: Never invent synthetic diagrams or data.
        """
        raw_text = (ocr_text or "").strip()
        if not raw_text:
            return StageAPageExtraction(
                page_topic=f"Page {page_number}",
                is_unclear=True,
                unclear_notes="No text or visual elements could be extracted.",
                items=[],
            )

        paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
        items = [
            StageAItem(
                id=f"item-{idx}",
                item_type="paragraph",
                content=para,
            )
            for idx, para in enumerate(paragraphs, start=1)
        ]

        return StageAPageExtraction(
            page_topic=paragraphs[0][:60] if paragraphs else f"Page {page_number}",
            is_unclear=False,
            unclear_notes="",
            items=items,
            key_terms=[],
            diagrams=[],
            graphs=[],
            tables=[],
        )

    @classmethod
    def generate_fallback_blocks(cls, ocr_text: str, page_number: int = 1) -> PageAnalysisSchema:
        """
        Legacy fallback helper returning PageAnalysisSchema for backwards compatibility.
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

    # ----------------------------------------------------------------------
    # STAGE A: Language-Neutral Extraction via Vision AI
    # ----------------------------------------------------------------------
    @classmethod
    def extract_stage_a(
        cls,
        image_path: Path,
        ocr_text: str = "",
        page_number: int = 1,
    ) -> tuple[StageAPageExtraction, bool, str | None]:
        """
        Stage A: Analyzes the page image once using OPENAI_VISION_MODEL.
        Extracts verbatim text, key terms, diagrams, graphs, and tables into language-neutral JSON.
        Returns: (stage_a_extraction, is_success, error_reason).
        """
        api_key = settings.OPENAI_API_KEY
        if not api_key or api_key in ["mock", "test", ""] or api_key.startswith("your_openai"):
            reason = "OpenAI API key is not configured on the server."
            logger.warning(f"Page {page_number} Stage A: {reason}")
            return cls.generate_fallback_stage_a(ocr_text=ocr_text, page_number=page_number), False, reason

        try:
            from openai import OpenAI

            client = OpenAI(api_key=api_key)
            b64_image = cls.encode_image_to_base64(image_path)

            system_prompt = (
                "You are Netrasaathi's visual extraction engine (Stage A).\n"
                "Extract all content from this study page image into structured, language-neutral JSON.\n"
                "STRICT GROUNDING RULES:\n"
                "1. Describe ONLY what is visibly present on this page image. Add NO outside knowledge or unstated facts.\n"
                "2. Mark unclear, blurry, or cropped items explicitly as 'unclear' in content.\n"
                "3. Extract all text passages as items with verbatim content and an item_type from:\n"
                "   ['paragraph', 'bullet', 'definition', 'example', 'step', 'formula', 'table_row', 'diagram_node', 'diagram_link', 'graph_value'].\n"
                "4. For diagrams: extract every node, arrow, and label with their connections.\n"
                "5. For graphs: extract graph type, axes labels, general trend, and key values.\n"
                "6. For tables: extract column headers and row values.\n"
                "7. For key terms: list the exact terms and what the page states about them.\n"
                "Output strictly matches the StageAPageExtraction schema."
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
                                    f"Extract all visual and textual elements from Page {page_number}.\n"
                                    f"Extracted OCR text for reference:\n{ocr_text}\n"
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
                response_format=StageAPageExtraction,
                temperature=0.1,
                max_tokens=4000,
            )

            # Log token usage and cost
            usage = getattr(completion, "usage", None)
            if usage:
                pricing = TOKEN_PRICING.get(settings.OPENAI_VISION_MODEL, TOKEN_PRICING["gpt-4o-mini"])
                cost = (usage.prompt_tokens * pricing["input"]) + (usage.completion_tokens * pricing["output"])
                logger.info(
                    f"Page {page_number} Stage A Usage: {usage.prompt_tokens} prompt tokens, "
                    f"{usage.completion_tokens} completion tokens ({usage.total_tokens} total). "
                    f"Cost: ${cost:.6f}"
                )

            parsed_result = completion.choices[0].message.parsed
            if parsed_result and parsed_result.items:
                return parsed_result, True, None

            reason = "OpenAI Vision returned an empty extraction for this page."
            return cls.generate_fallback_stage_a(ocr_text=ocr_text, page_number=page_number), False, reason

        except Exception as exc:
            reason = f"OpenAI Vision API call failed: {str(exc)}"
            logger.warning(f"Page {page_number} Stage A: {reason}")
            return cls.generate_fallback_stage_a(ocr_text=ocr_text, page_number=page_number), False, reason

    # ----------------------------------------------------------------------
    # STAGE B: Pedagogical Explanation via Text Model
    # ----------------------------------------------------------------------
    @classmethod
    def generate_stage_b_explanation(
        cls,
        stage_a: StageAPageExtraction,
        language: str = "en-IN",
        detail_level: str = "detailed",
        page_number: int = 1,
    ) -> tuple[StageBExplanation, bool, str | None]:
        """
        Stage B: Converts language-neutral Stage A JSON into accessible spoken explanations.
        Uses TEXT_MODEL (text only, never the image) for low latency and minimal cost.
        Applies coverage check (at Detailed level) and copy check (rejects verbatim copy).
        """
        api_key = settings.OPENAI_API_KEY
        if not api_key or api_key in ["mock", "test", ""] or api_key.startswith("your_openai"):
            # Offline fallback Stage B
            blocks = []
            for idx, item in enumerate(stage_a.items, start=1):
                blocks.append(
                    StageBBlock(
                        order_index=idx,
                        block_type=cls._map_item_to_block_type(item.item_type),
                        title=f"Section {idx} (Page {page_number})",
                        one_line_summary=item.content[:80] if len(item.content) > 10 else "Section notes",
                        from_notes_text=item.content,
                        extra_help_text=None,
                        original_text=item.content,
                        covered_item_ids=[item.id],
                    )
                )
            fallback = StageBExplanation(
                page_topic=stage_a.page_topic,
                one_line_summary=f"Notes for page {page_number}",
                blocks=blocks,
                all_covered_item_ids=[item.id for item in stage_a.items],
            )
            return fallback, False, "OpenAI API key is not configured on the server."

        try:
            from openai import OpenAI

            client = OpenAI(api_key=api_key)
            model_name = getattr(settings, "TEXT_MODEL", "gpt-4o-mini")

            # Detail level guidelines
            level_instructions = {
                "short": (
                    "Detail Level: SHORT.\n"
                    "Provide a concise overview in a few sentences for the entire page. "
                    "Focus only on the high-level concepts and main takeaway. 1-2 blocks maximum."
                ),
                "standard": (
                    "Detail Level: STANDARD.\n"
                    "Explain each section or visual element in one clear, self-contained paragraph. "
                    "Cover major points without overwhelming detail."
                ),
                "detailed": (
                    "Detail Level: DETAILED (Default).\n"
                    "Explain EVERY item step-by-step in simple, accessible language. "
                    "Nothing may be skipped. For each difficult or abstract idea, provide a simple, intuitive example. "
                    "Every Stage A item id MUST be covered in the covered_item_ids field."
                ),
            }
            level_text = level_instructions.get(detail_level.lower(), level_instructions["detailed"])

            system_prompt = (
                "You are Netrasaathi, an educational accessibility teacher for visually impaired students.\n"
                f"Your goal is to explain Page {page_number} study material clearly in target language: '{language}'.\n\n"
                f"{level_text}\n\n"
                "PEDAGOGICAL & ACCESSIBILITY RULES:\n"
                "1. Natural Language: Write directly in the requested language in a natural, friendly, conversational teaching tone. "
                "Do NOT produce a robotic or word-by-word translation.\n"
                "2. Technical Terms: Keep important technical terms in English in brackets alongside their explanation, "
                "e.g. in Hindi: 'कंप्यूटर नेटवर्क (Computer Network)' so the student can use them in exams.\n"
                "3. Faithful 'from_notes_text': The 'from_notes_text' field must ONLY explain concepts that are present in the provided Stage A notes. "
                "Do not copy sentences word-for-word; teach and explain them in clear, simple words.\n"
                "4. 'extra_help_text': If an analogy, real-world metaphor, or outside mental model would help the student understand, "
                "place it in 'extra_help_text'. If not needed, set it to null.\n"
                "5. 'one_line_summary': Provide a genuine 1-line conceptual takeaway for each block. NEVER just slice or repeat the first few words.\n"
                "6. Coverage: In covered_item_ids, list the Stage A item IDs explained in each block. "
                "In all_covered_item_ids, list all covered item IDs.\n"
                "7. Reading Order: Output blocks in natural reading order (1-based order_index), one block per section or visual element. "
                "Include the page number in titles where appropriate."
            )

            stage_a_payload = json.dumps(stage_a.model_dump(), indent=2)

            def _call_stage_b(additional_instruction: str = "") -> tuple[StageBExplanation, Any]:
                user_msg = (
                    f"Here is the Stage A structured extraction for Page {page_number}:\n\n"
                    f"{stage_a_payload}\n\n"
                    f"Explain this page in language '{language}' at detail level '{detail_level}'.\n"
                )
                if additional_instruction:
                    user_msg += f"\nATTENTION:\n{additional_instruction}\n"

                res = client.beta.chat.completions.parse(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg},
                    ],
                    response_format=StageBExplanation,
                    temperature=0.2,
                    max_tokens=4000,
                )
                return res.choices[0].message.parsed, getattr(res, "usage", None)

            explanation, usage = _call_stage_b()

            if usage:
                pricing = TOKEN_PRICING.get(model_name, TOKEN_PRICING["gpt-4o-mini"])
                cost = (usage.prompt_tokens * pricing["input"]) + (usage.completion_tokens * pricing["output"])
                logger.info(
                    f"Page {page_number} Stage B ({language}, {detail_level}) Usage: {usage.prompt_tokens} prompt, "
                    f"{usage.completion_tokens} completion ({usage.total_tokens} total). Cost: ${cost:.6f}"
                )

            # 1. COPY CHECK: Ensure model didn't just copy raw text verbatim
            if cls._is_mostly_copied(explanation, stage_a):
                logger.warning(f"Page {page_number} Stage B copy check triggered. Retrying with anti-copy prompt.")
                explanation, usage = _call_stage_b(
                    additional_instruction=(
                        "CRITICAL: Your previous response copied sentences verbatim from the notes. "
                        "You must TEACH and EXPLAIN the ideas in your own clear words, not copy original text. "
                        "Original text may only appear in the optional 'original_text' field."
                    )
                )

            # 2. COVERAGE CHECK (At Detailed level): Ensure 100% item coverage
            if detail_level.lower() == "detailed" and stage_a.items:
                all_stage_a_ids = {item.id for item in stage_a.items}
                covered_ids = set(explanation.all_covered_item_ids)
                missing_ids = all_stage_a_ids - covered_ids

                if missing_ids:
                    logger.info(f"Page {page_number} Stage B coverage check: missing {len(missing_ids)} items. Fetching gap fill.")
                    missing_items = [item for item in stage_a.items if item.id in missing_ids]
                    gap_explanation = cls._fill_missing_stage_b_items(
                        client=client,
                        model_name=model_name,
                        missing_items=missing_items,
                        language=language,
                        page_number=page_number,
                        start_order_index=len(explanation.blocks) + 1,
                    )
                    if gap_explanation and gap_explanation.blocks:
                        explanation.blocks.extend(gap_explanation.blocks)
                        explanation.all_covered_item_ids.extend(gap_explanation.all_covered_item_ids)

            return explanation, True, None

        except Exception as exc:
            reason = f"OpenAI Stage B explanation failed: {str(exc)}"
            logger.warning(f"Page {page_number} Stage B: {reason}")
            blocks = [
                StageBBlock(
                    order_index=idx,
                    block_type=cls._map_item_to_block_type(item.item_type),
                    title=f"Section {idx} (Page {page_number})",
                    one_line_summary=item.content[:80] if len(item.content) > 10 else "Section notes",
                    from_notes_text=item.content,
                    extra_help_text=None,
                    original_text=item.content,
                    covered_item_ids=[item.id],
                )
                for idx, item in enumerate(stage_a.items, start=1)
            ]
            fallback = StageBExplanation(
                page_topic=stage_a.page_topic,
                one_line_summary=f"Notes for page {page_number}",
                blocks=blocks,
                all_covered_item_ids=[item.id for item in stage_a.items],
            )
            return fallback, False, reason

    @classmethod
    def _is_mostly_copied(cls, explanation: StageBExplanation, stage_a: StageAPageExtraction) -> bool:
        """
        Calculates whether >60% of sentences in from_notes_text are verbatim copies of page text.
        """
        all_raw_text = " ".join(item.content.lower() for item in stage_a.items)
        if not all_raw_text.strip():
            return False

        total_sentences = 0
        copied_sentences = 0

        for block in explanation.blocks:
            sentences = re.split(r"[.!?।]\s+", block.from_notes_text)
            for s in sentences:
                clean_s = s.strip().lower()
                if len(clean_s) >= 30:
                    total_sentences += 1
                    if clean_s in all_raw_text:
                        copied_sentences += 1

        if total_sentences > 0 and (copied_sentences / total_sentences) > 0.60:
            return True
        return False

    @classmethod
    def _fill_missing_stage_b_items(
        cls,
        client: Any,
        model_name: str,
        missing_items: list[StageAItem],
        language: str,
        page_number: int,
        start_order_index: int,
    ) -> StageBExplanation | None:
        """Prompts Stage B model once to generate explanations for uncovered Stage A items."""
        try:
            missing_payload = json.dumps([i.model_dump() for i in missing_items], indent=2)
            prompt = (
                f"The following Stage A items from Page {page_number} were omitted from the previous detailed explanation:\n\n"
                f"{missing_payload}\n\n"
                f"Explain these specific items in language '{language}' in simple, clear teaching language. "
                f"Start order_index at {start_order_index}."
            )
            res = client.beta.chat.completions.parse(
                model=model_name,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are Netrasaathi's coverage recovery engine. "
                            "Explain the missing items completely so visually impaired students do not miss any notes."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format=StageBExplanation,
                temperature=0.2,
                max_tokens=2000,
            )
            return res.choices[0].message.parsed
        except Exception as exc:
            logger.warning(f"Failed to fill missing Stage B items: {exc}")
            return None

    @staticmethod
    def _map_item_to_block_type(
        item_type: str,
    ) -> Literal["text", "diagram", "flowchart", "graph", "table", "formula"]:
        """Maps Stage A item type to high-level reading block type."""
        mapping = {
            "formula": "formula",
            "table_row": "table",
            "diagram_node": "diagram",
            "diagram_link": "diagram",
            "graph_value": "graph",
        }
        return mapping.get(item_type, "text")

    # ----------------------------------------------------------------------
    # FULL PAGE PROCESSING & DATABASE CACHE MANAGEMENT
    # ----------------------------------------------------------------------
    @classmethod
    def process_page_blocks(
        cls,
        page: Page,
        db: Session,
        language: str = "en-IN",
        detail_level: str = "detailed",
    ) -> list[Block]:
        """
        Executes or retrieves the two-stage explanation for a page:
        1. Stage A: Checked from page.stage_a_json; if missing, extracted with Vision and saved.
        2. Stage B: Checked from page_explanations table for (page_id, language, detail_level).
           If missing, generated with Text model and cached in page_explanations.
        3. Synchronizes Block records for audio player and reading screen.
        """
        # Step 1: Stage A Language-Neutral Extraction (Never rerun if already cached)
        stage_a: StageAPageExtraction
        if page.stage_a_json:
            try:
                stage_a = StageAPageExtraction.model_validate_json(page.stage_a_json)
            except Exception:
                stage_a, is_success, reason = cls.extract_stage_a(
                    image_path=Path(page.image_path),
                    ocr_text=page.ocr_text or "",
                    page_number=page.page_number,
                )
                if is_success:
                    page.stage_a_json = stage_a.model_dump_json()
                    db.commit()
        else:
            stage_a, is_success, reason = cls.extract_stage_a(
                image_path=Path(page.image_path),
                ocr_text=page.ocr_text or "",
                page_number=page.page_number,
            )
            if is_success:
                page.stage_a_json = stage_a.model_dump_json()
                page.status = "ready"
                page.error_message = None
            else:
                page.status = "failed"
                page.error_message = reason
            db.commit()

        # Step 2: Stage B Explanation (Check cache per page, language, detail_level)
        cached_exp = db.query(PageExplanation).filter(
            PageExplanation.page_id == page.id,
            PageExplanation.language == language,
            PageExplanation.detail_level == detail_level,
        ).first()

        explanation: StageBExplanation
        if cached_exp:
            try:
                blocks_data = json.loads(cached_exp.blocks_json)
                explanation = StageBExplanation(
                    page_topic=cached_exp.page_topic or stage_a.page_topic,
                    one_line_summary=cached_exp.one_line_summary or "",
                    blocks=[StageBBlock.model_validate(b) for b in blocks_data],
                    all_covered_item_ids=[],
                )
            except Exception:
                explanation, b_success, b_reason = cls.generate_stage_b_explanation(
                    stage_a=stage_a,
                    language=language,
                    detail_level=detail_level,
                    page_number=page.page_number,
                )
                cached_exp.blocks_json = json.dumps([b.model_dump() for b in explanation.blocks])
                cached_exp.one_line_summary = explanation.one_line_summary
                db.commit()
        else:
            explanation, b_success, b_reason = cls.generate_stage_b_explanation(
                stage_a=stage_a,
                language=language,
                detail_level=detail_level,
                page_number=page.page_number,
            )
            new_exp = PageExplanation(
                page_id=page.id,
                language=language,
                detail_level=detail_level,
                one_line_summary=explanation.one_line_summary,
                page_topic=explanation.page_topic,
                blocks_json=json.dumps([b.model_dump() for b in explanation.blocks]),
            )
            db.add(new_exp)
            db.commit()

        # Step 3: Populate / Refresh Block records for this page
        db.query(Block).filter(Block.page_id == page.id).delete()
        db.commit()

        created_blocks: list[Block] = []
        for b in explanation.blocks:
            spoken_text = format_block_spoken_text(b, language)
            block_record = Block(
                page_id=page.id,
                order_index=b.order_index,
                block_type=b.block_type,
                title=b.title,
                one_line_summary=b.one_line_summary,
                explanation_text=spoken_text,
            )
            db.add(block_record)
            created_blocks.append(block_record)

        db.commit()
        db.refresh(page)
        for blk in created_blocks:
            db.refresh(blk)

        return created_blocks

    @classmethod
    def explain_page_image(
        cls,
        image_path: Path,
        ocr_text: str = "",
        page_number: int = 1,
    ) -> tuple[PageAnalysisSchema, bool, str | None]:
        """
        Backwards-compatible wrapper returning PageAnalysisSchema.
        Runs Stage A then default Stage B and adapts into PageAnalysisSchema.
        """
        stage_a, is_success, reason = cls.extract_stage_a(
            image_path=image_path,
            ocr_text=ocr_text,
            page_number=page_number,
        )
        if not is_success:
            return cls.generate_fallback_blocks(ocr_text=ocr_text, page_number=page_number), False, reason

        explanation, b_success, b_reason = cls.generate_stage_b_explanation(
            stage_a=stage_a,
            language="en-IN",
            detail_level="detailed",
            page_number=page_number,
        )

        blocks = [
            VisualBlockSchema(
                order_index=b.order_index,
                block_type=b.block_type,
                title=b.title,
                explanation_text=format_block_spoken_text(b, "en-IN"),
            )
            for b in explanation.blocks
        ]

        return PageAnalysisSchema(
            page_summary=explanation.one_line_summary,
            blocks=blocks,
        ), True, None
