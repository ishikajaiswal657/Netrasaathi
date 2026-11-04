import os
from functools import lru_cache
from pathlib import Path

# Look for .env in backend/, project root, or current directory
def _resolve_env_path() -> Path:
    candidates = [
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent / ".env",
        Path.cwd() / ".env"
    ]
    for p in candidates:
        if p.exists():
            return p
    return candidates[1]

ENV_PATH = _resolve_env_path()

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict

    class Settings(BaseSettings):
        """
        Application configuration loaded from environment variables or .env file.
        Validates all critical system parameters on startup.
        """
        # Database (defaults to SQLite if PostgreSQL not configured)
        DATABASE_URL: str = "sqlite:///./netrasaathi.db"

        # Security & JWT Tokens
        SECRET_KEY: str = "temporary_dev_secret_key_change_in_production_32chars"
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

        # AI Vision & Reasoning (OpenAI API)
        OPENAI_API_KEY: str = ""
        MODEL_NAME: str = "gpt-4o"
        OPENAI_VISION_MODEL: str = "gpt-4o"
        OPENAI_TTS_MODEL: str = "tts-1-hd"
        OPENAI_TTS_VOICE: str = "nova"

        # Upload & Storage constraints
        UPLOAD_DIR: str = "uploads"
        MAX_FILE_SIZE_MB: int = 10
        ALLOWED_EXTENSIONS: str = "pdf,jpg,jpeg,png"

        # OCR configuration
        TESSERACT_CMD: str = "tesseract"

        # Read .env file from project root if it exists
        model_config = SettingsConfigDict(
            env_file=str(ENV_PATH),
            env_file_encoding="utf-8",
            extra="ignore"
        )

        def get_allowed_extensions_list(self) -> list[str]:
            """Returns allowed file extensions as a lower-case list."""
            return [ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",") if ext.strip()]

        @property
        def max_file_size_bytes(self) -> int:
            """Calculates maximum allowed upload size in bytes."""
            return self.MAX_FILE_SIZE_MB * 1024 * 1024

except ImportError:
    # Graceful fallback when pydantic-settings is not yet installed
    from pydantic import BaseModel
    from dotenv import load_dotenv

    if ENV_PATH.exists():
        load_dotenv(dotenv_path=ENV_PATH)

    class Settings(BaseModel):  # type: ignore[no-redef]
        """
        Fallback configuration loader using standard Pydantic and python-dotenv.
        """
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./netrasaathi.db")
        SECRET_KEY: str = os.getenv("SECRET_KEY", "temporary_dev_secret_key_change_in_production_32chars")
        ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
        ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

        OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
        MODEL_NAME: str = os.getenv("MODEL_NAME", "gpt-4o")
        OPENAI_VISION_MODEL: str = os.getenv("OPENAI_VISION_MODEL", "gpt-4o")
        OPENAI_TTS_MODEL: str = os.getenv("OPENAI_TTS_MODEL", "tts-1-hd")
        OPENAI_TTS_VOICE: str = os.getenv("OPENAI_TTS_VOICE", "nova")

        UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
        MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
        ALLOWED_EXTENSIONS: str = os.getenv("ALLOWED_EXTENSIONS", "pdf,jpg,jpeg,png")

        TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "tesseract")

        def get_allowed_extensions_list(self) -> list[str]:
            """Returns allowed file extensions as a lower-case list."""
            return [ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",") if ext.strip()]

        @property
        def max_file_size_bytes(self) -> int:
            """Calculates maximum allowed upload size in bytes."""
            return self.MAX_FILE_SIZE_MB * 1024 * 1024


@lru_cache()
def get_settings() -> Settings:
    """Returns a cached instance of application settings to avoid re-reading disk."""
    return Settings()

