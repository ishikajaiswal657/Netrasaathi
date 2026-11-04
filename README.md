# Netrasaathi (नेत्रसाथी)
## Universal Voice-First Assistive STEM Learning Platform

Netrasaathi is an accessible, voice-first web platform engineered for visually, hearing, and physically impaired students. It transforms complex visual study materials (diagrams, flowcharts, graphs, formulas, tables) into structured, spoken audio explanations and synchronized live captions in multiple languages, with hands-free voice commands and zero-hallucination grounded Q&A.

---

## Core Capabilities & Architectural Pillars

1. **Universal Accessibility (WCAG 2.1 AAA)**:
   * Futuristic Obsidian Glassmorphism dark theme (`#070714`) providing an ultra-high contrast ratio (>18:1), well beyond the 7:1 AAA standard.
   * Full keyboard navigation without mouse: `Space` (Play/Pause), `N` (Next Card), `P` (Previous Card), `R` (Repeat), `M` (Stop), `C` (Voice Commands), `V` (Direct Voice Ask), `H` (Voice Guide).
   * Skip-to-content bypass link for screen readers, ARIA live regions for audio feedback, and visual frequency waveform meters for deaf or hard-of-hearing students.

2. **Zero-Content Privacy Layer (FR16 & PRD)**:
   * Automatic redaction of sensitive Indian and global PII (Aadhaar numbers, PAN cards, phone numbers, email addresses) using Microsoft Presidio and spaCy NLP before external AI processing.
   * Solid opaque black burn-in image redaction on 150 DPI page scans.
   * Audit trail records timestamps and actions only, strictly omitting raw document text or student question transcripts.

3. **Multi-Modal Visual Understanding (OpenAI Vision AI)**:
   * Intelligent extraction and classification of 6 block types: `diagram`, `flowchart`, `graph`, `table`, `formula`, and `text`.
   * Deterministic offline fallback engine providing step-by-step plain English explanations when external APIs are offline.

4. **Universal Spoken Audio Reader & Multilingual Support**:
   * Client-side Web Speech synthesis supporting Indian English, US English, Hindi, Bengali, Tamil, Telugu, Marathi, and Spanish.
   * Real-time word-boundary tracking with synchronized highlighted captions for deaf and hard-of-hearing learners.

5. **Speech-to-Text & Hands-Free Voice Commands**:
   * Browser microphone speech recognition with real-time audio volume visualizer.
   * Multilingual phonetic command recognition for navigation:
     * Next: *"next"*, *"forward"*, *"aage"*, *"agla"*, *"porer"*
     * Previous: *"previous"*, *"back"*, *"peechhe"*, *"pichla"*, *"agero"*
     * Repeat: *"repeat"*, *"again"*, *"dobara"*, *"phir se"*
     * Play/Pause: *"play"*, *"chalao"*, *"shuru"*, *"stop"*, *"roko"*, *"ruk jao"*
     * Speed: *"slower"*, *"dheere"*, *"faster"*, *"tez"*, *"jaldi"*
     * Assistance: *"help"*, *"madad"*, *"captions"*, *"language"*, *"bhasha"*

6. **Grounded Q&A Engine (Zero Hallucination)**:
   * TF-IDF passage retrieval and cosine similarity ranking strictly constrained to uploaded student study notes.
   * Exact page number citations (*"According to Page 1..."*) with honest out-of-scope rejection for non-syllabus questions.

7. **Direct Concept Explainer (No Upload Required)**:
   * Allows students to verbally ask for any diagram or concept explanation hands-free without needing to find and upload a PDF.

8. **Admin Security & Role-Based Access Control**:
   * Strict separation of `student` and `admin` roles via signed JWT bearer tokens.
   * Restricted administrator audit trail (`require_role("admin")`) displaying platform events with action filters and aggregate metrics.

---

## Repository Structure

```text
Netrasaathi/
|-- backend/
|   |-- app/
|   |   |-- models/          (User, Document, Page, Block, AuditLog)
|   |   |-- routers/         (auth, documents, admin)
|   |   |-- schemas/         (Pydantic validation schemas)
|   |   |-- security/        (JWT tokens, bcrypt password hashing, RBAC dependencies)
|   |   |-- services/        (reader, storage, privacy, vision, qa)
|   |   |-- config.py        (Pydantic settings with .env validation)
|   |   |-- database.py      (SQLAlchemy engine and session maker)
|   |   `-- main.py          (FastAPI entrypoint with CORS and route mounting)
|   |-- tests/               (44 automated unit tests)
|   `-- requirements.txt     (Python dependencies)
|-- frontend/
|   |-- src/
|   |   |-- app/             (Next.js App Router: landing, dashboard, reader, upload, admin, auth)
|   |   |-- components/      (accessibility, player, reader, ui, voice)
|   |   |-- lib/             (api client, auth, types, utils, speech engine, mock data)
|   |   `-- tests/           (19 automated client and accessibility unit tests)
|   |-- package.json
|   `-- tsconfig.json
|-- Netrasaathi_PRD.md        (Product Requirements Document)
|-- Netrasaathi_Architecture.md (System Architecture & Security Specification)
`-- README.md
```

---

## Installation & Setup Guide

### Prerequisites
* Python 3.11+ (tested on Python 3.14)
* Node.js 18+ (tested on Node.js 20+)
* Optional: Tesseract OCR (if local OCR is required)

### 1. Environment Configuration
Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

Ensure the following variables are defined:
```ini
APP_ENV=development
SECRET_KEY=change-me-to-a-secure-random-32-byte-hex-string-for-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=sqlite:///./netrasaathi.db
STORAGE_PATH=./uploads
OPENAI_API_KEY=your-openai-api-key-here
MODEL_NAME=gpt-4o
MAX_UPLOAD_SIZE_MB=25
```

### 2. Backend Setup & Run

```powershell
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Linux/macOS

# Install dependencies
pip install -r backend/requirements.txt
python -m spacy download en_core_web_sm

# Run FastAPI server
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

The interactive OpenAPI documentation will be available at: `http://localhost:8000/docs`

### 3. Frontend Setup & Run

```powershell
cd frontend
npm install

# Start development server
npm run dev
```

The accessible web application will be available at: `http://localhost:3000`

---

## Running the Automated Test Suite

### Backend Unit Tests (44 Tests)
Validates configuration, bcrypt hashing, JWT authentication, multi-tenant document isolation, PII redaction, Presidio Indian recognizers, Vision AI block structuring, TF-IDF grounded Q&A, and admin role authorization:

```powershell
.venv\Scripts\python.exe -u -m unittest discover -s backend/tests
```

*Expected output*: `Ran 44 tests in ~21s ... OK`

### Frontend Unit Tests (19 Tests)
Validates formatting utilities, screen-reader ARIA labels, voice command recognition in English and regional languages, multi-language voice support, zero-content audit validation, WCAG AAA contrast ratio calculation, and unique single-key keyboard bindings:

```powershell
npm test --prefix frontend
```

*Expected output*: `19 tests, 6 suites, 19 pass, 0 fail`

### Production Build Verification
Verifies TypeScript type safety, static page generation, and Turbopack asset bundling:

```powershell
npm run build --prefix frontend
```

*Expected output*: `Compiled successfully, Finished TypeScript, Generating static pages (9/9) ... Done`

---

## Accessibility Keyboard Quick-Reference

| Key | Action | Context |
| :--- | :--- | :--- |
| `Space` | Play / Pause narration | Talking Reader |
| `N` | Move to next card | Talking Reader |
| `P` | Move to previous card | Talking Reader |
| `R` | Repeat current card | Talking Reader |
| `M` | Stop audio playback | Talking Reader |
| `C` | Toggle hands-free voice commands | Talking Reader |
| `V` | Open Direct Voice Concept Explainer | Global |
| `H` | Open Voice Commands spoken reference guide | Talking Reader |
| `Tab` | Sequentially navigate interactive controls | Global |

---

## Security Compliance & Privacy Invariants

* **FR14 - Multi-Tenant Isolation**: Every database query on `/documents` strictly filters by the authenticated `user_id`. Students can never view, download, or query another student's courseware.
* **FR16 - Zero-Content Audit Trails**: Audit tables store `id`, `user_id`, `action`, `document_id`, `ip_address`, and `created_at`. No raw document text, OCR transcript, or student question string is ever logged.
* **PII Defense-in-Depth**: Indian national IDs (Aadhaar, PAN), phone numbers, and emails are identified using Microsoft Presidio and permanently redacted on disk with solid opaque black Pillow rectangles prior to multi-modal analysis.
* **Zero Hallucination Guardrails**: Document Q&A queries are ranked via TF-IDF cosine similarity against document pages. Questions exceeding the out-of-scope similarity threshold are rejected with an honest statement rather than making up facts.
