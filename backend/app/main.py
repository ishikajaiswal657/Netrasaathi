import os
import sys
import types
from pathlib import Path
from contextlib import asynccontextmanager

# Ensure project root, backend dir, and app dir are in sys.path
_FILE_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _FILE_DIR.parent
_PROJECT_ROOT = _BACKEND_DIR.parent

for _p in [_PROJECT_ROOT, _BACKEND_DIR, _FILE_DIR]:
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

# Ensure 'backend' module alias exists even if running directly inside /app or backend/
if "backend" not in sys.modules:
    try:
        import app as _app_pkg
        _b_mod = types.ModuleType("backend")
        _b_mod.app = _app_pkg
        sys.modules["backend"] = _b_mod
        sys.modules["backend.app"] = _app_pkg
    except Exception:
        pass

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

# Enable CORS for the Next.js frontend (local dev, Vercel deployments, and custom domains)
cors_origins_env = os.environ.get("CORS_ORIGINS", "")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if cors_origins_env:
    for origin in cors_origins_env.split(","):
        clean_origin = origin.strip()
        if clean_origin and clean_origin not in allowed_origins:
            allowed_origins.append(clean_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
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
    """Service health probe for load balancers and deployment verification."""
    return {"status": "ok", "service": "Netrasaathi API"}
