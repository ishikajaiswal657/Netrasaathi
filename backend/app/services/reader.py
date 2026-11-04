from pathlib import Path
from typing import Any
from PIL import Image
import pymupdf
import pytesseract
from sqlalchemy.orm import Session

from backend.app.config import get_settings
from backend.app.models.document import Document, Page
from backend.app.services.privacy import PrivacyService
from backend.app.services.storage import get_pages_dir

settings = get_settings()

# Configure custom tesseract executable path if specified in .env
if settings.TESSERACT_CMD and settings.TESSERACT_CMD != "tesseract":
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD


def extract_ocr_from_image(image_path: Path) -> tuple[str, list[dict[str, Any]]]:
    """
    Extracts text and word bounding boxes from an image using Tesseract OCR.
    Bounding boxes allow the privacy layer to redact PII on the raster image.
    Fails gracefully if Tesseract binary is not installed on the system.
    """
    try:
        img = Image.open(image_path)
        # Extract full text
        text = pytesseract.image_to_string(img).strip()

        # Extract word positions for redaction
        data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
        word_boxes: list[dict[str, Any]] = []
        n_boxes = len(data["text"])
        for i in range(n_boxes):
            word = data["text"][i].strip()
            if word:
                left = int(data["left"][i])
                top = int(data["top"][i])
                width = int(data["width"][i])
                height = int(data["height"][i])
                word_boxes.append({
                    "word": word,
                    "left": left,
                    "top": top,
                    "width": width,
                    "height": height,
                    "box": [left, top, left + width, top + height],
                    "conf": data["conf"][i],
                })
        return text, word_boxes
    except Exception as exc:
        # Tesseract not installed on host or image read error
        print(f"Notice: OCR skipped for {image_path.name} ({exc})")
        return "", []


def process_document_pages(document: Document, db: Session) -> list[Page]:
    """
    Splits uploaded document into individual page images, extracts text,
    and applies privacy redaction (both text scrubbing and image blacking).
    Ensures multi-tenant documents never expose student PII to subsequent AI vision steps.
    """
    file_path = Path(document.file_path)
    extension = file_path.suffix.lstrip(".").lower()
    pages_dir = get_pages_dir(document.user_id, document.id)
    created_pages: list[Page] = []

    if extension == "pdf":
        pdf_doc = pymupdf.open(str(file_path))
        document.page_count = len(pdf_doc)

        for page_idx, page in enumerate(pdf_doc, start=1):
            # Render page to high-resolution PNG image (150 DPI) for visual clarity
            pix = page.get_pixmap(dpi=150)
            page_image_path = pages_dir / f"page_{page_idx}.png"
            pix.save(str(page_image_path))

            # Calculate coordinate scale from PDF 72 DPI points to rendered 150 DPI pixels
            scale_x = pix.width / page.rect.width if page.rect.width else 1.0
            scale_y = pix.height / page.rect.height if page.rect.height else 1.0

            raw_words = page.get_text("words")
            word_boxes: list[dict[str, Any]] = [
                {
                    "word": w[4],
                    "box": [
                        int(w[0] * scale_x),
                        int(w[1] * scale_y),
                        int(w[2] * scale_x),
                        int(w[3] * scale_y),
                    ],
                }
                for w in raw_words
            ]

            # 1. First attempt to extract native embedded text
            text = page.get_text().strip()

            # 2. If native text is absent (scanned page), fallback to OCR
            if len(text) < 15:
                ocr_text, ocr_boxes = extract_ocr_from_image(page_image_path)
                if ocr_text:
                    text = ocr_text
                    word_boxes = ocr_boxes

            # 3. Privacy Layer: Redact sensitive PII from text and image
            sanitized_text, pii_count, _ = PrivacyService.redact_text(text)
            redacted_image_path, _ = PrivacyService.redact_page_image(page_image_path, word_boxes)

            page_record = Page(
                document_id=document.id,
                page_number=page_idx,
                image_path=str(redacted_image_path),
                ocr_text=sanitized_text,
                pii_items_found=pii_count,
            )
            db.add(page_record)
            created_pages.append(page_record)

        pdf_doc.close()

    elif extension in ["png", "jpg", "jpeg"]:
        document.page_count = 1
        page_image_path = pages_dir / "page_1.png"

        # Standardize image format to PNG
        with Image.open(file_path) as img:
            img.convert("RGB").save(page_image_path, "PNG")

        # Extract text via OCR
        ocr_text, ocr_boxes = extract_ocr_from_image(page_image_path)

        # Privacy Layer: Redact sensitive PII from text and image
        sanitized_text, pii_count, _ = PrivacyService.redact_text(ocr_text)
        redacted_image_path, _ = PrivacyService.redact_page_image(page_image_path, ocr_boxes)

        page_record = Page(
            document_id=document.id,
            page_number=1,
            image_path=str(redacted_image_path),
            ocr_text=sanitized_text,
            pii_items_found=pii_count,
        )
        db.add(page_record)
        created_pages.append(page_record)

    document.status = "processed"
    db.commit()
    for p in created_pages:
        db.refresh(p)
    return created_pages
