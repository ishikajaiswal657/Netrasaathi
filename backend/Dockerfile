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

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    python -m spacy download en_core_web_sm || true

# Copy application source code into both /app and /app/backend to guarantee all import paths resolve
COPY . /app/
RUN mkdir -p /app/backend && cp -r /app/app /app/backend/app 2>/dev/null || true

# Set environment variables for Python
ENV PYTHONPATH="/app:/app/backend:${PYTHONPATH}"
ENV PYTHONUNBUFFERED=1

# Create storage directory for uploaded files and SQLite DB
RUN mkdir -p /app/storage /app/data /app/backend/storage /app/backend/data

# Expose default port
EXPOSE 8000

# Start FastAPI with Uvicorn, dynamically binding to Render's $PORT or 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
