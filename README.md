# Netrasaathi

Netrasaathi is a voice-first web application designed for visually impaired students. It transforms complex study material (PDFs, images, notes with diagrams, flowcharts, graphs, and tables) into plain-English spoken explanations and allows spoken follow-up Q&A.

## Architecture Overview
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, PostgreSQL, Alembic.
- **Document Processing:** PyMuPDF (PDF parsing & page rendering), Tesseract (OCR and word coordinates).
- **Privacy & Security:** Microsoft Presidio & regex redaction of Indian PII (Aadhaar, PAN, phone numbers) with Pillow image blackouts prior to external AI processing.
- **Visual Understanding & Q&A:** Anthropic Vision API model (`MODEL_NAME`), scikit-learn TF-IDF page retrieval.
- **Frontend:** Next.js (React, TypeScript, Tailwind CSS), Browser Web Speech API for voice synthesis and voice recognition.
- **Auth:** JWT authentication with bcrypt password hashing and role-based access (student and admin).

## Getting Started (Phase 0)

### 1. Initialize Virtual Environment
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
```

### 2. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env` in the root and fill in your values.
```bash
cp .env.example .env
```
