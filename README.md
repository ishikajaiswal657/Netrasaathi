# Netrasaathi (नेत्रसाथी)
## Universal Voice-First Assistive STEM Learning Platform

Netrasaathi is an accessible, voice-first web platform engineered for visually, hearing, and physically impaired students. It transforms complex visual study materials (diagrams, flowcharts, graphs, formulas, tables) into structured, spoken audio explanations and synchronized live captions in multiple languages, with hands-free voice commands and grounded Q&A.

---

## Core Capabilities & Architectural Pillars

1. **Accessibility & Usability**:
   * Obsidian high-contrast dark theme providing compliant visual contrast ratios for readability.
   * Full keyboard navigation without mouse: `Space` (Play/Pause), `N` (Next Card), `P` (Previous Card), `R` (Repeat), `M` (Stop), `C` (Voice Commands), `V` (Direct Voice Ask), `H` (Voice Guide).
   * Skip-to-content bypass link for screen readers, ARIA live regions for audio feedback, and visual frequency waveform meters for deaf or hard-of-hearing students.

2. **Privacy Layer (FR16 & PRD)**:
   * Automatic redaction of sensitive Indian and global PII (Aadhaar numbers, PAN cards, phone numbers, email addresses) using Microsoft Presidio and spaCy NLP before external AI processing.
   * Lazy loading of heavy NLP models to preserve memory on cloud container runtimes.
   * Solid opaque black burn-in image redaction on 150 DPI page scans.
   * Audit trail records timestamps and actions only, strictly omitting raw document text or student question transcripts.

3. **Multi-Modal Visual Understanding (OpenAI Vision AI)**:
   * Extraction and classification of 6 block types: `diagram`, `flowchart`, `graph`, `table`, `formula`, and `text`.
   * Temperature bounded at 0.1 for high factual accuracy.
   * Clear error handling and fallback to raw extracted OCR text when external AI services are offline.

4. **Spoken Audio Reader & Multilingual Support**:
   * Client-side Web Speech synthesis supporting Indian English, US English, Hindi, Bengali, Tamil, Telugu, Marathi, and Spanish.
   * Low-latency sentence chunking: sentences are spoken incrementally, starting audio in under 50ms rather than buffering entire paragraphs.
   * Script-aware voice selection: automatically routes English text to Indian English (`en-IN`) even if the student's interface is set to Hindi, avoiding phonetic distortion.
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

6. **Grounded Q&A Engine**:
   * Answers come only from your uploaded material using TF-IDF passage retrieval and cosine similarity ranking.
   * Exact page number citations (*"According to Page 1..."*) with honest rejection (*"I cannot find that information in your uploaded document."*) for out-of-scope questions.

7. **Production Cloud Resilience (Render & Vercel)**:
   * Background asynchronous processing pipeline: uploads return immediately (`uploaded`), while pages are parsed, redacted, and analyzed sequentially in the background.
   * Database URL normalization: automatically translates `postgres://` to `postgresql://` for modern SQLAlchemy drivers.
   * Ephemeral disk resilience: if a container restart removes temporary scans, the API serves persistent text blocks and structured cards without crashing.
   * Concurrency locks and explicit garbage collection (`gc.collect()`) to operate stably within a 512 MB RAM limit.

---

## Repository Structure

```text
Netrasaathi/
|-- backend/
|   |-- alembic/             (Database migration scripts and version history)
|   |-- app/
|   |   |-- models/          (User, Document, Page, Block, AuditLog)
|   |   |-- routers/         (auth, documents, admin)
|   |   |-- schemas/         (Pydantic validation schemas)
|   |   |-- security/        (JWT tokens, bcrypt password hashing, RBAC dependencies)
|   |   |-- services/        (reader, storage, privacy, vision, qa, pipeline)
|   |   |-- config.py        (Pydantic settings with .env validation)
|   |   |-- database.py      (SQLAlchemy engine, connection pool, and migrations)
|   |   `-- main.py          (FastAPI entrypoint with CORS and route mounting)
|   |-- tests/               (41+ automated backend unit tests)
|   |-- Dockerfile           (Hardened container build with curl healthcheck)
|   `-- requirements.txt     (Python dependencies)
|-- frontend/
|   |-- src/
|   |   |-- app/             (Next.js App Router: landing, dashboard, reader, upload, admin, auth)
|   |   |-- components/      (accessibility, player, reader, ui, voice)
|   |   |-- lib/             (api client, auth, types, utils, speech engine, mock data)
|   |   `-- tests/           (25 automated client and accessibility unit tests)
|   |-- package.json
|   `-- tsconfig.json
|-- Netrasaathi_PRD.md        (Product Requirements Document)
|-- Netrasaathi_Architecture.md (System Architecture & Security Specification)
`-- README.md
```

---

## Installation & Setup Guide

### Prerequisites
* Python 3.11+
* Node.js 18+ (tested on Node.js 20+)
* Optional: Tesseract OCR (if local OCR is required)

### 1. Environment Configuration
Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

Ensure the following variables are defined:
```ini
ENVIRONMENT=development
SECRET_KEY=change-me-to-a-secure-random-32-byte-hex-string-for-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=sqlite:///./netrasaathi.db
UPLOAD_DIR=uploads
OPENAI_API_KEY=your-openai-api-key-here
MODEL_NAME=gpt-4o-mini
MAX_FILE_SIZE_MB=10
MAX_PAGES=30
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

### Backend Unit Tests (41+ Tests)
Validates configuration, bcrypt hashing, JWT authentication, multi-tenant document isolation, PII redaction, Presidio Indian recognizers, Vision AI block structuring, TF-IDF grounded Q&A, Alembic migrations, database persistence, and production security hardening:

```powershell
$env:PYTHONPATH="."
.\.venv\Scripts\pytest backend/tests/test_config.py backend/tests/test_privacy.py backend/tests/test_qa.py backend/tests/test_vision.py backend/tests/test_hardening.py backend/tests/test_database.py backend/tests/test_security_audit.py -v
```

*Expected output*: `41 passed in ~35s ... OK`

### Frontend Unit Tests (25 Tests)
Validates formatting utilities, screen-reader ARIA labels, zero-latency sentence chunking, script-aware voice selection, multi-lingual voice commands, audit log privacy verification, contrast ratio calculation, and production UI guards:

```powershell
npm test --prefix frontend
```

*Expected output*: `25 tests, 8 suites, 25 pass, 0 fail`

### Production Build Verification
Verifies TypeScript type safety, static page generation, and webpack asset bundling:

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

* **Multi-Tenant Isolation**: Every database query on `/documents` strictly filters by the authenticated `user_id`. Students can never view, download, or query another student's courseware.
* **Production Secret Key Enforcement**: On startup in production mode, the server rejects default development secret keys to protect against JWT forgery.
* **Privacy-Preserving Audit Trails**: Audit tables store `id`, `user_id`, `action`, `document_id`, `ip_address`, and `created_at`. No raw document text, OCR transcript, or student question string is ever logged.
* **PII Defense-in-Depth**: Indian national IDs (Aadhaar, PAN), phone numbers, and emails are identified using Microsoft Presidio and permanently redacted on disk with solid opaque black Pillow rectangles prior to multi-modal analysis.
* **Groundedness Guardrails**: Answers come only from your uploaded material. Document Q&A queries are ranked via TF-IDF cosine similarity against document pages. Questions exceeding the out-of-scope similarity threshold are rejected with an honest statement (*"I cannot find that information in your uploaded document."*) rather than making up facts.
