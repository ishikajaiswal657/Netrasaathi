import os
import unittest
from backend.app.config import Settings, get_settings


class TestConfig(unittest.TestCase):
    """Tests for application configuration loading and validation."""

    def test_default_settings(self):
        """Verifies default settings when no overrides are passed."""
        settings = Settings()
        self.assertEqual(settings.MODEL_NAME, "gpt-4o-mini")
        self.assertEqual(settings.ALGORITHM, "HS256")
        self.assertEqual(settings.MAX_FILE_SIZE_MB, 10)
        self.assertEqual(settings.max_file_size_bytes, 10 * 1024 * 1024)
        self.assertIn("pdf", settings.get_allowed_extensions_list())
        self.assertIn("png", settings.get_allowed_extensions_list())

    def test_allowed_extensions_parsing(self):
        """Verifies parsing and trimming of allowed extension strings."""
        settings = Settings(ALLOWED_EXTENSIONS=" pdf , JPG , png , docx ")
        exts = settings.get_allowed_extensions_list()
        self.assertEqual(exts, ["pdf", "jpg", "png", "docx"])

    def test_get_settings_cached(self):
        """Verifies that get_settings returns a consistent singleton instance."""
        s1 = get_settings()
        s2 = get_settings()
        self.assertIs(s1, s2)


if __name__ == "__main__":
    unittest.main()

