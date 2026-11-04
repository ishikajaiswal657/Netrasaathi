import re
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.audit import AuditLog
from backend.app.models.document import Document, Page, Block
from backend.app.models.user import User
from backend.app.schemas.document import (
    DocumentListItem,
    DocumentResponse,
    PageResponse,
    ExplanationBlockItem,
    PageBlocksResponse,
    ProcessDocumentResponse,
    AskQuestionRequest,
    AskQuestionResponse
)
from backend.app.security.dependencies import get_current_user
from backend.app.services.reader import process_document_pages
from backend.app.services.vision import VisionService
from backend.app.services.qa import QAService
from backend.app.services.storage import (
    sanitize_filename,
    save_original_file,
    validate_file_content
)

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and process study material (PDF, JPG, PNG)"
)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validates uploaded file size and magic bytes, extracts pages, and reads text/OCR.
    Strictly associates the document with the authenticated student ID.
    """
    content = await file.read()
    raw_filename = file.filename or "uploaded_document"

    # 1. Security validation: extension, size, and binary magic bytes
    validate_file_content(raw_filename, content)
    clean_filename = sanitize_filename(raw_filename)

    # 2. Register document record in database
    document = Document(
        user_id=current_user.id,
        filename=clean_filename,
        file_path="pending",
        status="uploaded",
        page_count=0
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # 3. Save original file in student's isolated folder
    saved_path = save_original_file(
        user_id=current_user.id,
        document_id=document.id,
        filename=clean_filename,
        content=content
    )
    document.file_path = str(saved_path)
    db.commit()

    # 4. Split document into pages, render images, extract text/OCR, and generate AI vision blocks
    pages = process_document_pages(document, db)
    for p in pages:
        VisionService.process_page_blocks(p, db)
    db.refresh(document)

    # 5. Security audit logging (FR16: action and IDs only, never raw text)
    audit = AuditLog(
        user_id=current_user.id,
        action="upload",
        document_id=document.id
    )
    db.add(audit)
    db.commit()

    return document


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
    if not page or not Path(page.image_path).exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page image not found"
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

    # If blocks don't exist yet, auto-create them so audio reader works immediately
    if not blocks:
        raw_text = (page.ocr_text or "").strip()
        if not raw_text:
            raw_text = f"Study worksheet page {page_number}. Visual explanation is ready."

        paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
        if not paragraphs:
            paragraphs = [raw_text]

        new_blocks = []
        for idx, para in enumerate(paragraphs, start=1):
            b_type = "text"
            lower = para.lower()
            if any(k in lower for k in ["diagram", "figure", "illustration"]):
                b_type = "diagram"
            elif any(k in lower for k in ["formula", "equation", "="]):
                b_type = "formula"
            elif any(k in lower for k in ["flowchart", "step"]):
                b_type = "flowchart"
            elif any(k in lower for k in ["table", "column"]):
                b_type = "table"

            blk = Block(
                page_id=page.id,
                order_index=idx,
                block_type=b_type,
                explanation_text=para
            )
            db.add(blk)
            new_blocks.append(blk)
        db.commit()
        for b in new_blocks:
            db.refresh(b)
        blocks = new_blocks

    block_items = [
        ExplanationBlockItem(
            id=b.id,
            page_id=b.page_id,
            order_index=b.order_index,
            block_type=b.block_type,
            explanation_text=b.explanation_text,
            title=f"{b.block_type.capitalize()} Section {b.order_index}"
        )
        for b in blocks
    ]

    return PageBlocksResponse(
        document_id=doc.id,
        page_number=page.page_number,
        total_pages=doc.page_count,
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

