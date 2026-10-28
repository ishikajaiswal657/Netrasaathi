# Netrasaathi: Product Requirements Document (MVP)

## 1. Summary
- Netrasaathi is a voice-first web app that explains study material to visually impaired students.
- The student uploads a file, and the app reads it aloud in very simple, plain English, including diagrams, flowcharts, graphs and tables.
- The student can ask follow-up questions by voice.
- Goal: remove the need for a sighted person to describe visual content.

## 2. Problem
- Screen readers read text but cannot explain diagrams, flowcharts, graphs or handwritten notes.
- Visually impaired students depend on another person to describe these parts.
- This makes independent study slow and not always possible.

## 3. Goals
- Let a student upload study material and hear all of it explained, including visuals.
- Keep every explanation in very simple English, easy to follow on the first listen.
- Let the student control playback and ask questions using voice.
- Protect personal data before any content goes to an external AI service.

## 4. Non-goals (future scope)
- Personalized AI tutor and learner profiles
- Adaptive learning recommendations
- Quiz and assessment generation
- Knowledge graph of topics
- Multiple languages
- Learning management system integration
- Offline mode

## 5. Users
- Primary: a visually impaired student who studies on a laptop or phone using a screen reader and voice.
- Secondary: an admin who manages accounts and reviews the audit log.

## 6. User stories
- As a student, I can sign up and log in so my files stay private.
- As a student, I can upload a PDF or image so the app can read it.
- As a student, I can hear each page explained in simple English so I understand it quickly.
- As a student, I can hear diagrams and flowcharts explained step by step so I do not need help.
- As a student, I can pause, repeat, skip, and change speed using the keyboard or my voice.
- As a student, I can ask a question by voice and hear an answer from my own material.
- As a student, I can trust that my personal details are hidden before AI processing.
- As an admin, I can view the audit log to see who uploaded and processed what.

## 7. Functional requirements

| ID | Requirement |
|----|-------------|
| FR1 | Accept PDF, JPG and PNG uploads, with file type and size checks |
| FR2 | Split PDFs into pages and extract text (built-in text first, OCR for scanned pages) |
| FR3 | Detect personal data (names, emails, phone numbers, Aadhaar, PAN) in extracted text |
| FR4 | Hide detected personal data on the page image before sending it to the AI model |
| FR5 | Send each cleaned page to a vision-capable AI model and receive ordered blocks (text, diagram, flowchart, graph, table, formula) |
| FR6 | Every explanation must use short sentences, simple words, and define any needed technical term right away |
| FR7 | Explain diagrams and flowcharts as a walk through parts and connections |
| FR8 | Explain graphs with type, axes, main trend, highest and lowest values |
| FR9 | Read explanations aloud with play, pause, next block, previous block, repeat, slower, faster |
| FR10 | Accept spoken questions and answer them using only the student's uploaded material |
| FR11 | Support voice commands: next, repeat, slower, faster, stop |
| FR12 | Support full keyboard navigation and screen reader labels on every control |
| FR13 | Sign up and log in with two roles: student and admin |
| FR14 | A student can only access their own documents |
| FR15 | Save explanations so a page is not processed twice |
| FR16 | Record an audit log entry for uploads, processing, views and questions |
| FR17 | If something in an image is unclear, the explanation says it is unclear instead of guessing |

## 8. Non-functional requirements
- Accessibility: the whole app must be usable without a mouse and without sight.
- Privacy: raw document text is never written to logs. Secrets live in environment files only.
- Security: passwords are hashed, sessions use signed tokens, uploads are validated.
- Performance: no fixed speed promise. Measure time per page during testing and report the real numbers.
- Cost: cache results so the same page never calls the AI model twice.
- Scope of files: built for notes and chapters of a few MB, not full textbooks.

## 9. Success measures
All numbers below come from your own testing. Do not state results you have not measured.
- Visual elements explained correctly, out of all visual elements in the test pages (checked by a person).
- Same test pages run through a baseline of plain OCR plus text-to-speech, for comparison.
- Personal data found versus missed on test pages that contain fake personal data.
- Average time from upload to first spoken sentence.
- Feedback from real users, reported in their own words.

## 10. Risks and honest limits
- The AI model can describe a diagram wrongly. Mitigation: prompt rule to say when unsure, and test on known diagrams.
- Personal data detection will miss some cases. Mitigation: report the miss rate and keep a manual warning on upload.
- Page images are sent to an external AI service. Mitigation: redact first, tell the user clearly.
- Browser speech works best in Chrome. Mitigation: use Chrome for the demo and note this in the report.
- Vision API calls cost money. Mitigation: caching and testing on short files.
- Hand-written notes may be read poorly. Mitigation: treat handwriting as best effort in the MVP.

## 11. Milestones

| Phase | Result |
|-------|--------|
| 0 | Project folders and tools ready |
| 1 | Backend running with database, login and roles |
| 2 | Upload works, pages and text extracted |
| 3 | Personal data detected and hidden on page images |
| 4 | Plain-English explanation of text and visuals saved per page |
| 5 | Frontend with upload, reading screen, audio playback |
| 6 | Voice questions and voice commands |
| 7 | Audit log and file access checks |
| 8 | Testing and comparison with baseline |
| 9 | Docker setup and demo ready |

## 12. Future scope
- Tutor, quizzes, adaptive learning and knowledge graph from the original concept
- More Indian languages
- Offline processing for privacy-sensitive use
- Better handling of handwriting and complex math
