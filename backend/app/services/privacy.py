from pathlib import Path
from typing import Any
import os
from PIL import Image, ImageDraw

# Configure tldextract to operate offline without network checks or elevated OS cache permissions
import tldextract
tldextract.tldextract.TLD_EXTRACTOR = tldextract.TLDExtract(suffix_list_urls=(), cache_dir=None)

from presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern, RecognizerResult
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

from backend.app.config import get_settings

settings = get_settings()

# Target entities to recognize and scrub from educational study materials
TARGET_ENTITIES = [
    "PERSON",
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "IN_AADHAAR",
    "IN_PAN",
    "IN_PHONE",
]


class PrivacyService:
    """
    Privacy & Redaction Service for Netrasaathi.
    Detects Personally Identifiable Information (PII) using Microsoft Presidio and
    custom Indian regex recognizers, permanently scrubbing sensitive tokens from
    both text passages and rendered raster images before LLM vision ingestion.
    """

    _analyzer_instance: AnalyzerEngine | None = None
    _anonymizer_instance: AnonymizerEngine | None = None

    @classmethod
    def get_analyzer(cls) -> AnalyzerEngine:
        if cls._analyzer_instance is None:
            # Configure spaCy en_core_web_sm offline NLP engine
            nlp_configuration = {
                "nlp_engine_name": "spacy",
                "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
            }
            provider = NlpEngineProvider(nlp_configuration=nlp_configuration)
            analyzer = AnalyzerEngine(nlp_engine=provider.create_engine())

            # 1. Custom Indian Aadhaar Recognizer (12 digits, optional space separators)
            aadhaar_pattern = Pattern(
                name="in_aadhaar_pattern",
                regex=r"\b\d{4}\s?\d{4}\s?\d{4}\b",
                score=0.90,
            )
            aadhaar_recognizer = PatternRecognizer(
                supported_entity="IN_AADHAAR",
                patterns=[aadhaar_pattern],
                context=["aadhaar", "uid", "aadhar", "uidai", "identity"],
            )
            analyzer.registry.add_recognizer(aadhaar_recognizer)

            # 2. Custom Indian PAN Card Recognizer (5 letters, 4 digits, 1 letter)
            pan_pattern = Pattern(
                name="in_pan_pattern",
                regex=r"\b[A-Z]{5}[0-9]{4}[A-Z]\b",
                score=0.90,
            )
            pan_recognizer = PatternRecognizer(
                supported_entity="IN_PAN",
                patterns=[pan_pattern],
                context=["pan", "card", "permanent account", "income tax", "pan no"],
            )
            analyzer.registry.add_recognizer(pan_recognizer)

            # 3. Custom Indian Mobile Number Recognizer (+91 / 0 prefix followed by 10 digits starting 6-9)
            phone_pattern = Pattern(
                name="in_phone_pattern",
                regex=r"(?:(?:\+91|0091|0)[\s\-]?)?[6-9]\d{9}\b",
                score=0.85,
            )
            phone_recognizer = PatternRecognizer(
                supported_entity="IN_PHONE",
                patterns=[phone_pattern],
                context=["phone", "mobile", "cell", "contact", "call", "whatsapp", "tel"],
            )
            analyzer.registry.add_recognizer(phone_recognizer)

            cls._analyzer_instance = analyzer

        return cls._analyzer_instance

    @classmethod
    def get_anonymizer(cls) -> AnonymizerEngine:
        if cls._anonymizer_instance is None:
            cls._anonymizer_instance = AnonymizerEngine()
        return cls._anonymizer_instance

    @classmethod
    def analyze_text(cls, text: str) -> list[RecognizerResult]:
        """Runs entity detection against the provided text."""
        if not text or not text.strip():
            return []
        analyzer = cls.get_analyzer()
        results = analyzer.analyze(
            text=text,
            entities=TARGET_ENTITIES,
            language="en",
        )
        return results

    @classmethod
    def redact_text(cls, text: str) -> tuple[str, int, dict[str, int]]:
        """
        Anonymizes detected PII entities in the text by replacing them with descriptive tags.
        Returns:
            - sanitized_text: Text with PII replaced by <REDACTED_ENTITY>
            - pii_count: Total number of sensitive entities redacted
            - entity_summary: Safe dictionary of redacted entity types and counts (NO raw PII)
        """
        if not text or not text.strip():
            return text, 0, {}

        results = cls.analyze_text(text)
        if not results:
            return text, 0, {}

        anonymizer = cls.get_anonymizer()

        # Build custom replacement tags per entity type
        operators = {
            entity: OperatorConfig("replace", {"new_value": f"<{entity}>"})
            for entity in TARGET_ENTITIES
        }

        anonymized_result = anonymizer.anonymize(
            text=text,
            analyzer_results=results,
            operators=operators,
        )

        # Audit summary: count entities by type without retaining raw text
        entity_summary: dict[str, int] = {}
        for r in results:
            entity_summary[r.entity_type] = entity_summary.get(r.entity_type, 0) + 1

        return anonymized_result.text, len(results), entity_summary

    @classmethod
    def redact_page_image(
        cls,
        image_path: Path,
        word_boxes: list[dict[str, Any]],
        output_path: Path | None = None,
    ) -> tuple[Path, int]:
        """
        Burns opaque black solid rectangles directly over detected PII coordinates on the image raster.
        
        Parameters:
            - image_path: Path to the original rendered page PNG.
            - word_boxes: List of dicts containing words and their bounding boxes:
                          [{"word": str, "box": [x0, y0, x1, y1]}]
            - output_path: Destination path for redacted PNG. Defaults to *_redacted.png.

        Returns:
            - destination_path: Path to the sanitized image file.
            - boxes_redacted_count: Number of rectangular word patches blacked out.
        """
        if output_path is None:
            output_path = image_path.parent / f"{image_path.stem}_redacted.png"

        if not image_path.exists():
            return output_path, 0

        # If no word boxes extracted, copy image as-is
        if not word_boxes:
            with Image.open(image_path) as img:
                img.save(output_path, "PNG")
            return output_path, 0

        # Reconstruct full string with exact character offset boundaries
        box_offsets: list[tuple[int, int, dict[str, Any]]] = []
        words_list: list[str] = []
        current_offset = 0

        for b in word_boxes:
            word = str(b.get("word", "")).strip()
            if not word:
                continue
            start_char = current_offset
            end_char = start_char + len(word)
            box_offsets.append((start_char, end_char, b))
            words_list.append(word)
            current_offset = end_char + 1

        combined_text = " ".join(words_list)
        results = cls.analyze_text(combined_text)

        # Identify all word boxes that overlap with any detected PII span
        boxes_to_blackout: list[list[int]] = []
        for res in results:
            for s, e, b in box_offsets:
                # Interval overlap: max(s1, s2) < min(e1, e2)
                if max(s, res.start) < min(e, res.end):
                    boxes_to_blackout.append(b["box"])

        # Open image and apply burn-in pixel redaction
        with Image.open(image_path) as img:
            rgb_img = img.convert("RGB")
            draw = ImageDraw.Draw(rgb_img)

            for box in boxes_to_blackout:
                x0, y0, x1, y1 = box
                # Expand box by 2 pixels to completely obscure anti-aliased character edges
                draw.rectangle(
                    [max(0, x0 - 2), max(0, y0 - 2), min(rgb_img.width, x1 + 2), min(rgb_img.height, y1 + 2)],
                    fill=(0, 0, 0),
                )

            rgb_img.save(output_path, "PNG")

        return output_path, len(boxes_to_blackout)

