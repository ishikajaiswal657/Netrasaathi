from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Document(Base):
    """
    Uploaded study material belonging strictly to an authenticated student.
    Enforces multi-tenant isolation via user_id foreign key.
    """
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    status = Column(String(50), default="uploaded", nullable=False)  # uploaded, processing, completed, failed
    page_count = Column(Integer, default=0, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="documents")
    pages = relationship("Page", back_populates="document", cascade="all, delete-orphan", order_by="Page.page_number")


class Page(Base):
    """
    Represents an extracted page from a document.
    Stores cleaned image location, OCR text, and count of redacted PII items.
    """
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    image_path = Column(String(500), nullable=False)
    ocr_text = Column(Text, nullable=True)
    pii_items_found = Column(Integer, default=0, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="pages")
    blocks = relationship("Block", back_populates="page", cascade="all, delete-orphan", order_by="Block.order_index")


class Block(Base):
    """
    Individual structured visual or text block explained by OpenAI Vision.
    Ordered by reading sequence (order_index) for text-to-speech audio playback.
    """
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    page_id = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True)
    order_index = Column(Integer, nullable=False)
    block_type = Column(String(50), nullable=False)  # text, diagram, flowchart, graph, table, formula
    title = Column(String(255), nullable=True)
    explanation_text = Column(Text, nullable=False)

    # Relationships
    page = relationship("Page", back_populates="blocks")

