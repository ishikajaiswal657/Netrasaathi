import os
import re
from pathlib import Path
from fastapi import HTTPException, UploadFile, status
from backend.app.config import get_settings

settings = get_settings()

# Known file signature magic bytes for strict MIME verification
MAGIC_SIGNATURES = {
    "pdf": [b"%PDF-"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "jpg": [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"]
}


def sanitize_filename(filename: str) -> str:
    """
    Sanitizes user-provided filenames to prevent path traversal attacks.
    Removes path separators, parent directory markers (..), and unsafe shell characters.
    """
    clean_name = os.path.basename(filename).strip()
    # Replace whitespace and unsafe characters with underscores
    clean_name = re.sub(r"[^\w.\-]", "_", clean_name)
    if not clean_name or clean_name.startswith("."):
        clean_name = f"upload_{clean_name.lstrip('.')}"
    return clean_name


def validate_file_content(filename: str, content: bytes) -> str:
    """
    Validates file extension, payload size, and binary magic bytes.
    Blocks extension spoofing (e.g. an .exe file renamed to .pdf).
    """
    # 1. Check size limit
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
        )

    # 2. Check extension
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    allowed_extensions = settings.get_allowed_extensions_list()
    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{extension}'. Allowed: {', '.join(allowed_extensions)}"
        )

    # 3. Check magic bytes
    expected_signatures = MAGIC_SIGNATURES.get(extension, [])
    if expected_signatures:
        has_valid_signature = any(content.startswith(sig) for sig in expected_signatures)
        if not has_valid_signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File content does not match its .{extension} extension header"
            )

    return extension


def get_document_dir(user_id: int, document_id: int) -> Path:
    """Returns the dedicated directory path for a student document."""
    doc_dir = Path(settings.UPLOAD_DIR) / str(user_id) / str(document_id)
    doc_dir.mkdir(parents=True, exist_ok=True)
    return doc_dir


def get_pages_dir(user_id: int, document_id: int) -> Path:
    """Returns the dedicated directory for storing rendered page images."""
    pages_dir = get_document_dir(user_id, document_id) / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)
    return pages_dir


def save_original_file(user_id: int, document_id: int, filename: str, content: bytes) -> Path:
    """Saves the raw uploaded document in the student's isolated document directory."""
    doc_dir = get_document_dir(user_id, document_id)
    safe_name = sanitize_filename(filename)
    file_path = doc_dir / f"original_{safe_name}"
    file_path.write_bytes(content)
    return file_path

