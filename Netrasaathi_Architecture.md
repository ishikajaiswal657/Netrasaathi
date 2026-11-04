# Netrasaathi: Architecture (MVP)

## 1. Big picture

```
  Student (keyboard + voice)
            |
   Next.js frontend (browser)
   - upload, reading screen, controls
   - Web Speech API: text-to-speech + speech-to-text
            |  HTTPS + JWT
            v
   FastAPI backend
   |-- Auth + roles (student / admin)
   |-- Upload service  --> file storage (per-user folders)
   |-- Page reader     --> PyMuPDF + Tesseract OCR
   |-- Privacy layer   --> Presidio + regex + image redaction
   |-- Explainer       --> Vision AI model (OpenAI API)
   |-- Q&A service     --> TF-IDF page search + AI model
   |-- Audit logger
            |
            v
   PostgreSQL (users, documents, pages, blocks, audit_logs)
```

## 2. Components and why each exists

| Component | Tool | Why |
|-----------|------|-----|
| Frontend | Next.js, TypeScript, Tailwind | Fast to build, good base for accessible pages |
| Speech | Browser Web Speech API | Free, no extra server, works for both speaking and listening |
| Backend | FastAPI | Quick to write, async, easy AI library support |
| Database | PostgreSQL | Structured data, free, reliable |
| PDF to pages | PyMuPDF | Splits pages, renders images, reads built-in text |
| OCR | Tesseract (pytesseract) | Free, runs locally, gives word positions for redaction |
| PII detection | Presidio + custom regex | Presidio finds common personal data, regex covers Aadhaar, PAN, Indian phones |
| Image redaction | Pillow | Draws black boxes over personal data on the page image |
| Visual understanding | Vision-capable OpenAI model via OpenAI API | Handles diagrams, flowcharts, graphs, tables without training your own model |
| Question search | scikit-learn TF-IDF | Simple way to pick the most relevant pages before asking the AI |
| Auth | JWT + bcrypt | Standard session tokens and safe password storage |
| Packaging | Docker, docker-compose | One command to run everything |

## 3. Main data flow: upload to spoken explanation

1. Student uploads a file. Backend checks type and size, then saves it in that student's folder.
2. Backend splits the file into pages and saves one image per page.
3. For each page, backend reads built-in text. If there is none, it runs OCR.
4. Privacy layer scans the text for personal data.
5. Detected items are covered with black boxes on the page image. The cleaned image is what gets sent out.
6. Cleaned page image goes to the vision model with the plain-English prompt.
7. Model returns ordered blocks as JSON (text, diagram, flowchart, graph, table, formula).
8. Backend saves the blocks and writes an audit log entry.
9. Frontend loads the blocks and speaks them one by one using text-to-speech.

## 4. Follow-up question flow

1. Student speaks a question. The browser turns it into text.
2. Backend picks the most relevant pages from the saved explanations using TF-IDF.
3. Backend sends the question and those pages to the AI model.
4. The prompt says: answer only from this material, and say so if the answer is not there.
5. Answer comes back in plain English and the browser speaks it.
6. The question is logged in the audit log (action only, not the content).

## 5. Database tables

| Table | Main columns |
|-------|--------------|
| users | id, email, password_hash, role, created_at |
| documents | id, user_id, filename, file_path, status, page_count, created_at |
| pages | id, document_id, page_number, image_path, ocr_text, pii_items_found |
| blocks | id, page_id, order_index, block_type, explanation_text |
| audit_logs | id, user_id, action, document_id, ip_address, created_at |

- Audit logs store action names and IDs only, never document text.

## 6. API endpoints

| Method | Path | Who | Purpose |
|--------|------|-----|---------|
| POST | /auth/signup | anyone | Create account |
| POST | /auth/login | anyone | Get JWT token |
| GET | /me | logged in | Current user |
| POST | /documents | student | Upload a file |
| GET | /documents | student | List own documents |
| POST | /documents/{id}/process | student | Run reading, privacy and explanation |
| GET | /documents/{id}/pages/{n}/blocks | student | Get explanation blocks for a page |
| POST | /documents/{id}/ask | student | Ask a follow-up question |
| GET | /admin/audit-logs | admin | View audit log |

## 7. Security design

| Area | Control |
|------|---------|
| Passwords | bcrypt hashes, never stored in plain text |
| Sessions | Signed JWT with expiry |
| Access | Every document query filters by the logged-in user's ID |
| Roles | Student and admin checked on each route |
| Uploads | Type check, size limit, safe file names, stored outside public folders |
| Personal data | Detected and blacked out on the image before it leaves the system |
| Logging | No raw document text in logs |
| Secrets | API keys in .env only, never in Git |
| Audit | Uploads, processing, views and questions recorded |

- Known limit: personal data detection is not perfect. Measure and report the miss rate.

## 8. Plain-English explanation rules (enforced in the AI prompt)

- Short sentences and simple words.
- Explain any technical term the moment it appears.
- Describe in reading order.
- Diagrams and flowcharts: walk through the parts and their connections.
- Graphs: type, axes, main trend, highest and lowest values.
- Tables: what it is about, then rows in a natural way.
- Formulas: say them in words, then one line on the meaning.
- Unclear content: say it is unclear.

## 9. Folder structure

```
netrasaathi/
  backend/
    app/
      main.py
      config.py
      database.py
      models/
      schemas/
      routers/        (auth, documents, admin)
      services/       (reader, privacy, explainer, qa, audit)
      security/       (jwt, passwords, permissions)
    alembic/
    tests/
    requirements.txt
    Dockerfile
  frontend/
    src/
      app/            (login, upload, reader)
      components/     (player, controls, voice)
      lib/            (api client, speech helpers)
    Dockerfile
  docker-compose.yml
  .env.example
  README.md
```

## 10. Build order

| Phase | What gets built |
|-------|-----------------|
| 0 | Folders, tools, Git |
| 1 | FastAPI, database, signup, login, roles |
| 2 | Upload, PDF to pages, OCR |
| 3 | PII detection and image redaction |
| 4 | Vision model explanation and saved blocks |
| 5 | Frontend upload, reading screen, audio |
| 6 | Voice questions and voice commands |
| 7 | Audit log and access checks |
| 8 | Testing against plain OCR + text-to-speech baseline |
| 9 | Docker and demo |

## 11. Things to decide early
- Which OpenAI vision model to use. Keep the name in MODEL_NAME and the key in OPENAI_API_KEY, both in .env, so the model is easy to change.
- Where uploaded files are stored. Start with a local folder, move to cloud storage later if needed.
- How many pages to process at once. Start with one page at a time to keep costs down.

