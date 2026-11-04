from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import get_settings

settings = get_settings()

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif settings.DATABASE_URL.startswith("postgresql"):
    # Timeout quickly (3s) if PostgreSQL server is unreachable rather than hanging
    connect_args["connect_timeout"] = 3

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db(target_engine=None):
    """
    Creates all database tables defined in models if database is reachable.
    Automatically falls back to SQLite if PostgreSQL connection fails.
    """
    global engine, SessionLocal
    # Import all models to ensure they are registered with Base.metadata before create_all
    from backend.app.models.user import User  # noqa: F401
    from backend.app.models.document import Document, Page, Block  # noqa: F401
    from backend.app.models.audit import AuditLog  # noqa: F401

    eng = target_engine or engine
    try:
        with eng.connect():
            pass
        Base.metadata.create_all(bind=eng)
    except Exception as exc:
        print(f"Notice: Configured database connection failed ({exc}).")
        print("Falling back to local SQLite database (netrasaathi.db) for reliable execution.")
        fallback_engine = create_engine(
            "sqlite:///./netrasaathi.db",
            connect_args={"check_same_thread": False}
        )
        engine = fallback_engine
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=fallback_engine)
        Base.metadata.create_all(bind=fallback_engine)


def get_db():
    """
    FastAPI dependency yielding an isolated database session per request.
    Always cleans up and closes the session upon request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
