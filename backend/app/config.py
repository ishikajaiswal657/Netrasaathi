from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables or .env file.
    Validates all critical system parameters on startup.
    """
    # Database
    DATABASE_URL: str = "postgresql://netra_user:netra_password@localhost:5432/netrasaathi"

    # Security & Tokens
    SECRET_KEY: str = "temporary_dev_secret_key_change_in_production_32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # AI Vision & Reasoning
    ANTHROPIC_API_KEY: str = ""
    MODEL_NAME: str = "claude-3-5-sonnet-20241022"

    # Upload & Storage constraints
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: str = "pdf,jpg,jpeg,png"

    # OCR configuration
    TESSERACT_CMD: str = "tesseract"

    # Read .env file from the project root if it exists
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_allowed_extensions_list(self) -> list[str]:
        """Returns allowed file extensions as a lower-case list."""
        return [ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",") if ext.strip()]


@lru_cache()
def get_settings() -> Settings:
    """Returns a cached instance of application settings to avoid re-reading disk."""
    return Settings()
