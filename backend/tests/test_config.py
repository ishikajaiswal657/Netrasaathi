from app.config import get_settings


def test_settings_load_defaults():
    """Verify that default settings load without error."""
    settings = get_settings()
    assert settings.ALGORITHM == "HS256"
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 1440
    assert settings.MODEL_NAME == "claude-3-5-sonnet-20241022"
    assert "pdf" in settings.get_allowed_extensions_list()
