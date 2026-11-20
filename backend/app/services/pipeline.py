import gc
import logging
import threading
from pathlib import Path
from typing import Any
from PIL import Image
import pymupdf
from sqlalchemy.orm import Session

from backend.app.config import get_settings
import backend.app.database as db_module
from backend.app.models.document import Block, Document, Page
from backend.app.services.privacy import PrivacyService
from backend.app.services.reader import extract_ocr_from_image
from backend.app.services.storage import get_pages_dir
from backend.app.services.vision import VisionService

logger = logging.getLogger("netrasaathi.pipeline")
settings = get_settings()

# Enforce strictly 1 background processing pipeline at a time to stay safely within 512MB RAM
_pipeline_lock = threading.Lock()


def cleanup_stale_processing_jobs(db: Session) -> int:
    """
    On server startup, marks any document or page left in an incomplete state
    from a prior server crash/restart as 'failed' so nothing remains stuck in 'processing' forever.
    """
    working_states = ["uploaded", "reading", "cleaning", "explaining", "processing"]
    stale_docs = db.query(Document).filter(Document.status.in_(working_states)).all()
    count = len(stale_docs)

    for doc in stale_docs:
        doc.status = "failed"
        doc.error_message = "Server restarted during processing. Please retry."
        for page in doc.pages:
            if page.status in working_states:
                page.status = "failed"
                page.error_message = "Server restarted before this page could finish."

    if count > 0:
        db.commit()
        logger.info(f"Startup recovery: marked {count} stale in-progress documents as failed.")

    return count


def process_document_background(document_id: int) -> None:
    """
    Background worker that executes the entire heavy pipeline asynchronously:
    1. Reads pages (status: 'reading')
    2. Cleans sensitive PII (status: 'cleaning')
    3. Analyzes visuals with OpenAI Vision (status: 'explaining')
    4. Marks ready for reading (status: 'ready')
    Frees memory after every page with gc.collect().
    """
    with _pipeline_lock:
        db: Session = db_module.SessionLocal()
        try:
            doc = db.query(Document).filter(Document.id == document_id).first()
            if not doc:
                logger.error(f"Background pipeline: document {document_id} not found.")
                return

            file_path = Path(doc.file_path)
            if not file_path.exists():
                doc.status = "failed"
                doc.error_message = f"Uploaded file not found on disk at {file_path}"
                db.commit()
                return

            extension = file_path.suffix.lstrip(".").lower()
            pages_dir = get_pages_dir(doc.user_id, doc.id)
            pages_dir.mkdir(parents=True, exist_ok=True)

            # Step 1: Update status to 'reading'
            doc.status = "reading"
            db.commit()

            if extension == "pdf":
                pdf_doc = pymupdf.open(str(file_path))
                total_pages = len(pdf_doc)
                doc.page_count = total_pages
                db.commit()

                for page_idx, page in enumerate(pdf_doc, start=1):
                    # Check cache: never process the same page twice if already ready
                    existing_page = db.query(Page).filter(
                        Page.document_id == doc.id,
                        Page.page_number == page_idx
                    ).first()

                    if existing_page and existing_page.status == "ready":
                        existing_blocks = db.query(Block).filter(Block.page_id == existing_page.id).count()
                        if existing_blocks > 0:
                            logger.info(f"Doc {doc.id} Page {page_idx}: already ready, skipping.")
                            continue

                    # Step 2: Cleaning (render, OCR, redact PII)
                    doc.status = "cleaning"
                    db.commit()

                    if not existing_page:
                        page_record = Page(
                            document_id=doc.id,
                            page_number=page_idx,
                            image_path="",
                            status="cleaning",
                        )
                        db.add(page_record)
                        db.commit()
                        db.refresh(page_record)
                    else:
                        page_record = existing_page
                        page_record.status = "cleaning"
                        db.commit()

                    # Render page at 150 DPI
                    pix = page.get_pixmap(dpi=150)
                    raw_page_path = pages_dir / f"page_{page_idx}_raw.png"
                    pix.save(str(raw_page_path))

                    # Scale down if exceeds MAX_IMAGE_DIM to reduce memory and token cost
                    max_dim = settings.MAX_IMAGE_DIM
                    with Image.open(raw_page_path) as img:
                        if img.width > max_dim or img.height > max_dim:
                            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                            img.save(raw_page_path, "PNG")

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

                    # Extract text: native text first, OCR if absent
                    text = page.get_text().strip()
                    if len(text) < 15:
                        ocr_text, ocr_boxes = extract_ocr_from_image(raw_page_path)
                        if ocr_text:
                            text = ocr_text
                            word_boxes = ocr_boxes

                    # Redact PII
                    sanitized_text, pii_count, _ = PrivacyService.redact_text(text)
                    redacted_img_path = pages_dir / f"page_{page_idx}.png"
                    PrivacyService.redact_page_image(raw_page_path, word_boxes)
                    if raw_page_path.exists():
                        raw_page_path.replace(redacted_img_path)

                    page_record.image_path = str(redacted_img_path)
                    page_record.ocr_text = sanitized_text
                    page_record.pii_items_found = pii_count
                    page_record.status = "explaining"
                    doc.status = "explaining"
                    db.commit()

                    # Step 3: Call OpenAI Vision to generate structured visual explanation blocks
                    VisionService.process_page_blocks(page_record, db)

                    # Free memory for this page
                    del pix
                    gc.collect()

                pdf_doc.close()
                gc.collect()

            elif extension in ["png", "jpg", "jpeg"]:
                doc.page_count = 1
                doc.status = "cleaning"
                db.commit()

                page_record = db.query(Page).filter(
                    Page.document_id == doc.id,
                    Page.page_number == 1
                ).first()

                if not page_record:
                    page_record = Page(
                        document_id=doc.id,
                        page_number=1,
                        image_path="",
                        status="cleaning",
                    )
                    db.add(page_record)
                    db.commit()
                    db.refresh(page_record)

                target_page_path = pages_dir / "page_1.png"
                max_dim = settings.MAX_IMAGE_DIM
                with Image.open(file_path) as img:
                    rgb_img = img.convert("RGB")
                    if rgb_img.width > max_dim or rgb_img.height > max_dim:
                        rgb_img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                    rgb_img.save(target_page_path, "PNG")

                ocr_text, ocr_boxes = extract_ocr_from_image(target_page_path)
                sanitized_text, pii_count, _ = PrivacyService.redact_text(ocr_text)
                PrivacyService.redact_page_image(target_page_path, ocr_boxes)

                page_record.image_path = str(target_page_path)
                page_record.ocr_text = sanitized_text
                page_record.pii_items_found = pii_count
                page_record.status = "explaining"
                doc.status = "explaining"
                db.commit()

                VisionService.process_page_blocks(page_record, db)
                gc.collect()

            # Final evaluation of document status
            db.refresh(doc)
            pages = db.query(Page).filter(Page.document_id == doc.id).all()
            failed_pages = [p for p in pages if p.status == "failed"]
            ready_pages = [p for p in pages if p.status == "ready"]

            if ready_pages:
                doc.status = "ready"
                if failed_pages:
                    doc.error_message = f"{len(failed_pages)} of {len(pages)} pages had processing issues."
                else:
                    doc.error_message = None
            elif failed_pages:
                doc.status = "failed"
                doc.error_message = "All pages failed processing."
            else:
                doc.status = "ready"

            db.commit()
            logger.info(f"Doc {doc.id} background pipeline finished with status '{doc.status}'.")

        except Exception as exc:
            logger.error(f"Doc {document_id} background pipeline encountered fatal error: {exc}", exc_info=True)
            try:
                doc = db.query(Document).filter(Document.id == document_id).first()
                if doc:
                    doc.status = "failed"
                    doc.error_message = f"Processing error: {str(exc)}"
                    db.commit()
            except Exception:
                pass
        finally:
            db.close()
            gc.collect()
