import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Ensure project root and backend dir are in sys.path
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))
_BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database import get_db, init_db
from backend.app.routers.auth import router as auth_router
from backend.app.routers.documents import router as documents_router
from backend.app.routers.admin import router as admin_router
from backend.app.routers.audio import router as audio_router


app = FastAPI(
    title="Netrasaathi API",
    description="Voice-first study assistant backend for visually impaired students.",
    version="1.0.0"
)

# Initialize database tables on server import if not running under unit tests
if not os.environ.get("TESTING"):
    init_db()

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route controllers
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(admin_router)
app.include_router(audio_router)


@app.get("/health", tags=["Health"])
def health_check():
    """Simple endpoint to verify server status and responsiveness."""
    return {"status": "ok", "service": "Netrasaathi API", "version": "1.0.0"}
