"""FastAPI route controllers."""
from backend.app.routers.auth import router as auth_router
from backend.app.routers.documents import router as documents_router

__all__ = ["auth_router", "documents_router"]
