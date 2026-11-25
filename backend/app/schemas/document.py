from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PageResponse(BaseModel):
    """Schema representing an extracted page of study material."""
    id: int
    document_id: int
    page_number: int
    image_path: str
    ocr_text: str | None
    pii_items_found: int
    status: str = "ready"
    error_message: str | None = None

    model_config = ConfigDict(from_attributes=True)


class DocumentListItem(BaseModel):
    """Summary schema for listing a student's documents."""
    id: int
    filename: str
    status: str
    page_count: int
    created_at: datetime
    error_message: str | None = None

    model_config = ConfigDict(from_attributes=True)


class DocumentResponse(DocumentListItem):
    """Detailed schema for a document including its extracted pages."""
    user_id: int
    file_path: str
    pages: list[PageResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ExplanationBlockItem(BaseModel):
    """Structured reading block (diagram, flowchart, text, formula)."""
    id: int
    page_id: int
    order_index: int
    block_type: str
    explanation_text: str
    title: str | None = None
    one_line_summary: str | None = None
    page_number: int | None = None

    model_config = ConfigDict(from_attributes=True)


class PageBlocksResponse(BaseModel):
    """Response containing all explanation blocks for a given page."""
    document_id: int
    page_number: int
    total_pages: int
    page_status: str = "ready"
    error_message: str | None = None
    blocks: list[ExplanationBlockItem]


class PageExplanationResponse(BaseModel):
    """Localized, pedagogical explanation response for a specific page, language, and detail level."""
    document_id: int
    page_number: int
    total_pages: int
    language: str
    detail_level: str
    page_topic: str | None = None
    one_line_summary: str | None = None
    page_status: str = "ready"
    error_message: str | None = None
    blocks: list[ExplanationBlockItem]

    model_config = ConfigDict(from_attributes=True)


class DocumentStatusResponse(BaseModel):
    """Real-time processing status of a document and its pages."""
    id: int
    status: str
    page_count: int
    pages_ready: int
    error_message: str | None = None
    pages: list[PageResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProcessDocumentResponse(BaseModel):
    """Result of triggering document OCR and AI diagram explanation."""
    id: int
    status: str
    page_count: int


class AskQuestionRequest(BaseModel):
    """Student query about a specific uploaded study material."""
    question: str


class AskQuestionResponse(BaseModel):
    """Plain-English answer derived from document content."""
    question: str
    answer: str
    relevant_pages: list[int] = []


class AuditLogItem(BaseModel):
    """Audit log entry for admin inspection."""
    id: int
    user_id: int | None
    user_email: str | None = None
    action: str
    document_id: int | None = None
    ip_address: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminStatsResponse(BaseModel):
    """Aggregate security and operational metrics for administrator console."""
    total_users: int
    total_documents: int
    total_audit_events: int
    action_breakdown: dict[str, int]
