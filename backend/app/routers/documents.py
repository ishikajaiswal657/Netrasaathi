import re
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.audit import AuditLog
from backend.app.models.document import Document, Page, Block, PageExplanation
from backend.app.models.user import User
from backend.app.schemas.document import (
    DocumentListItem,
    DocumentResponse,
    DocumentStatusResponse,
    PageResponse,
    ExplanationBlockItem,
    PageBlocksResponse,
    PageExplanationResponse,
    ProcessDocumentResponse,
    AskQuestionRequest,
    AskQuestionResponse
)
from backend.app.security.dependencies import get_current_user
from backend.app.services.pipeline import process_document_background
from backend.app.services.reader import process_document_pages
from backend.app.services.vision import VisionService
from backend.app.services.qa import QAService
from backend.app.services.storage import (
    sanitize_filename,
    save_original_file,
    validate_file_content,
    validate_document_page_count,
)

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload study material and schedule reliable background processing"
)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validates uploaded file size, magic bytes, and page count limit.
    Saves the file and immediately returns document record with status 'uploaded'.
    Schedules heavy OCR, PII redaction, and Vision AI explanation in the background.
    """
    content = await file.read()
    raw_filename = file.filename or "uploaded_document"

    # 1. Security validation: extension, size, and binary magic bytes
    extension = validate_file_content(raw_filename, content)
    clean_filename = sanitize_filename(raw_filename)

    # 2. Page count limit check (default MAX_PAGES = 30)
    page_count = validate_document_page_count(extension, content)

    # 3. Register document record in database with initial status 'uploaded'
    document = Document(
        user_id=current_user.id,
        filename=clean_filename,
        file_path="pending",
        status="uploaded",
        page_count=page_count
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # 4. Save original file in student's isolated folder
    saved_path = save_original_file(
        user_id=current_user.id,
        document_id=document.id,
        filename=clean_filename,
        content=content
    )
    document.file_path = str(saved_path)
    db.commit()

    # 5. Security audit logging (FR16: action and IDs only, never raw text)
    audit = AuditLog(
        user_id=current_user.id,
        action="upload",
        document_id=document.id
    )
    db.add(audit)
    db.commit()

    # 6. Enqueue background processing so the client gets an immediate HTTP 201 response
    background_tasks.add_task(process_document_background, document.id)

    return document


@router.get(
    "/{document_id}/status",
    response_model=DocumentStatusResponse,
    summary="Get real-time document and per-page processing status"
)
def get_document_status(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enables frontend progress tracking (e.g. 'Page 2 of 5 ready').
    Students can open and listen to early pages as soon as their status is 'ready'.
    """
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    pages = db.query(Page).filter(Page.document_id == document_id).order_by(Page.page_number).all()
    pages_ready = len([p for p in pages if p.status == "ready"])

    return DocumentStatusResponse(
        id=doc.id,
        status=doc.status,
        page_count=doc.page_count,
        pages_ready=pages_ready,
        error_message=doc.error_message,
        pages=pages
    )


@router.get(
    "",
    response_model=list[DocumentListItem],
    summary="List all study materials owned by the authenticated student"
)
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enforces multi-tenant isolation: students can only view their own documents.
    """
    return db.query(Document).filter(
        Document.user_id == current_user.id
    ).order_by(Document.created_at.desc()).all()


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Retrieve details and pages of a specific document"
)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves document details. Rejects access if the document belongs to another student.
    """
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return doc


@router.get(
    "/{document_id}/pages",
    response_model=list[PageResponse],
    summary="Retrieve extracted pages and OCR text for a document"
)
def get_document_pages(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns ordered pages for audio player and reading screen.
    """
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return doc.pages


@router.get(
    "/{document_id}/pages/{page_number}/image",
    summary="Securely serve page image for authorized student"
)
def get_page_image(
    document_id: int,
    page_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Protects document images behind authentication.
    Prevents public web crawlers or unauthorized users from viewing study material.
    """
    page = db.query(Page).join(Document).filter(
        Page.document_id == document_id,
        Page.page_number == page_number,
        Document.user_id == current_user.id
    ).first()
    if not page or not page.image_path or not Path(page.image_path).exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document image expired, reading from saved text"
        )
    return FileResponse(page.image_path, media_type="image/png")


@router.post(
    "/{document_id}/process",
    response_model=ProcessDocumentResponse,
    summary="Trigger document OCR and AI block generation"
)
def process_document_endpoint(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers OCR and structured explanation block generation for reading.
    Enforces multi-tenant ownership.
    """
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Generate structured visual explanation blocks via Vision AI
    for page in doc.pages:
        VisionService.process_page_blocks(page, db)

    doc.status = "completed"
    db.commit()

    # Record audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="process",
        document_id=doc.id
    )
    db.add(audit)
    db.commit()

    return ProcessDocumentResponse(
        id=doc.id,
        status=doc.status,
        page_count=doc.page_count
    )


@router.get(
    "/{document_id}/pages/{page_number}/blocks",
    response_model=PageBlocksResponse,
    summary="Get structured explanation blocks for audio reading"
)
def get_page_blocks(
    document_id: int,
    page_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns ordered explanation blocks for the text-to-speech audio reader.
    """
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    page = db.query(Page).filter(
        Page.document_id == document_id,
        Page.page_number == page_number
    ).first()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    blocks = db.query(Block).filter(Block.page_id == page.id).order_by(Block.order_index).all()

    # If blocks have not been generated yet, process this page directly
    if not blocks and page.status != "failed":
        blocks = VisionService.process_page_blocks(page, db)
        db.refresh(page)

    block_items = [
        ExplanationBlockItem(
            id=b.id,
            page_id=b.page_id,
            order_index=b.order_index,
            block_type=b.block_type,
            explanation_text=b.explanation_text,
            title=b.title or f"{b.block_type.capitalize()} Section {b.order_index}",
            one_line_summary=getattr(b, "one_line_summary", None),
            page_number=page.page_number,
        )
        for b in blocks
    ]

    return PageBlocksResponse(
        document_id=doc.id,
        page_number=page.page_number,
        total_pages=doc.page_count,
        page_status=page.status,
        error_message=page.error_message,
        blocks=block_items
    )


@router.get(
    "/{document_id}/pages/{page_number}/explanation",
    response_model=PageExplanationResponse,
    summary="Get localized pedagogical explanation of a page for a language and detail level"
)
def get_page_explanation(
    document_id: int,
    page_number: int,
    lang: str = Query("en-IN", description="Language code, e.g. hi-IN, en-IN, es-ES"),
    level: str = Query("detailed", description="Detail level: short, standard, detailed"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns localized, pedagogical explanation blocks for the reader.
    Uses Stage B extraction and database caching.
    Enforces multi-tenant ownership: students can only access their own documents.
    """
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    page = db.query(Page).filter(
        Page.document_id == document_id,
        Page.page_number == page_number
    ).first()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    clean_lang = lang.strip() if lang else "en-IN"
    clean_level = level.strip().lower() if level else "detailed"
    if clean_level not in ["short", "standard", "detailed"]:
        clean_level = "detailed"

    # Generate or retrieve Stage B explanation from cache
    blocks = VisionService.process_page_blocks(
        page=page,
        db=db,
        language=clean_lang,
        detail_level=clean_level
    )
    db.refresh(page)

    cached_exp = db.query(PageExplanation).filter(
        PageExplanation.page_id == page.id,
        PageExplanation.language == clean_lang,
        PageExplanation.detail_level == clean_level
    ).first()

    one_line_summary = cached_exp.one_line_summary if cached_exp else None
    page_topic = cached_exp.page_topic if cached_exp else None

    block_items = [
        ExplanationBlockItem(
            id=b.id,
            page_id=b.page_id,
            order_index=b.order_index,
            block_type=b.block_type,
            explanation_text=b.explanation_text,
            title=b.title or f"{b.block_type.capitalize()} Section {b.order_index}",
            one_line_summary=getattr(b, "one_line_summary", None),
            page_number=page.page_number,
        )
        for b in blocks
    ]

    return PageExplanationResponse(
        document_id=doc.id,
        page_number=page.page_number,
        total_pages=doc.page_count,
        language=clean_lang,
        detail_level=clean_level,
        page_topic=page_topic,
        one_line_summary=one_line_summary,
        page_status=page.status,
        error_message=page.error_message,
        blocks=block_items
    )


@router.post(
    "/{document_id}/pages/{page_number}/retry",
    response_model=PageBlocksResponse,
    summary="Retry Vision AI analysis for a failed page"
)
def retry_page_processing(
    document_id: int,
    page_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows the student to retry an AI explanation if a prior call failed due to a transient error.
    """
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    page = db.query(Page).filter(
        Page.document_id == document_id,
        Page.page_number == page_number
    ).first()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    blocks = VisionService.process_page_blocks(page, db)
    db.refresh(page)

    block_items = [
        ExplanationBlockItem(
            id=b.id,
            page_id=b.page_id,
            order_index=b.order_index,
            block_type=b.block_type,
            explanation_text=b.explanation_text,
            title=b.title or f"{b.block_type.capitalize()} Section {b.order_index}",
            one_line_summary=getattr(b, "one_line_summary", None),
            page_number=page.page_number,
        )
        for b in blocks
    ]

    return PageBlocksResponse(
        document_id=doc.id,
        page_number=page.page_number,
        total_pages=doc.page_count,
        page_status=page.status,
        error_message=page.error_message,
        blocks=block_items
    )


@router.post(
    "/{document_id}/ask",
    response_model=AskQuestionResponse,
    summary="Ask a follow-up question about the study document"
)
def ask_question(
    document_id: int,
    query: AskQuestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Answers questions based on extracted study material.
    Never logs raw user questions to preserve privacy (FR16).
    """
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    user_q = query.question.strip()
    if not user_q:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question cannot be empty")

    # Call Grounded Q&A Service
    answer, relevant_pages = QAService.answer_question(document=doc, question=user_q, db=db)

    # Audit log (action only, never log question text)
    audit = AuditLog(
        user_id=current_user.id,
        action="ask",
        document_id=doc.id
    )
    db.add(audit)
    db.commit()

    return AskQuestionResponse(
        question=user_q,
        answer=answer,
        relevant_pages=relevant_pages
    )

