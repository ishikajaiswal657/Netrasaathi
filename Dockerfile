# Production Dockerfile for Netrasaathi Backend on Render / Railway
FROM python:3.11-slim

# Install system dependencies for Tesseract OCR and PDF rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-hin \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements from root or backend/ directory
COPY requirements.txt* backend/requirements.txt* /tmp/
RUN cp /tmp/requirements.txt /app/requirements.txt 2>/dev/null || cp /tmp/backend/requirements.txt /app/requirements.txt 2>/dev/null || true
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt && \
    python -m spacy download en_core_web_sm || true

# Copy entire repository source
COPY . /app/

# Normalize directory layout so both 'from backend.app...' and 'from app...' resolve
RUN if [ -d /app/backend/app ]; then \
        mkdir -p /app/app && cp -r /app/backend/app/* /app/app/ 2>/dev/null || true; \
    elif [ -d /app/app ]; then \
        mkdir -p /app/backend && cp -r /app/app /app/backend/app 2>/dev/null || true; \
    fi

# Set environment variables for Python
ENV PYTHONPATH="/app:/app/backend:${PYTHONPATH}"
ENV PYTHONUNBUFFERED=1

# Expose default port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Start FastAPI with single Uvicorn worker to stay safely within 512MB RAM on Render
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 || uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
