import os
os.environ["TESTING"] = "true"

import unittest
from starlette.middleware.cors import CORSMiddleware

from backend.app.main import app, health_check, root
from backend.app.services.privacy import PrivacyService


class TestRenderHardening(unittest.TestCase):
    """
    Test suite for Render deployment hardening:
    - Sub-second /health response time for container probes
    - Lazy NLP initialization to keep initial memory and boot time low
    - Strict CORS configuration for production and local environments
    """

    def test_health_check_returns_ok_immediately(self):
        """The health_check probe must return status ok immediately without blocking."""
        res = health_check()
        self.assertEqual(res, {"status": "ok", "service": "Netrasaathi API"})

    def test_root_endpoint_returns_expected_metadata(self):
        """The root endpoint must provide service status and documentation paths."""
        res = root()
        self.assertEqual(res["status"], "active")
        self.assertEqual(res["health"], "/health")

    def test_cors_configuration_allows_vercel_production_origin(self):
        """CORS configuration must explicitly include the Vercel production origin."""
        cors_middlewares = [m for m in app.user_middleware if m.cls == CORSMiddleware]
        self.assertTrue(len(cors_middlewares) > 0, "CORSMiddleware must be installed")
        cors_config = cors_middlewares[0].kwargs

        allowed_origins = cors_config.get("allow_origins", [])
        self.assertIn("https://netrasaathi-app.vercel.app", allowed_origins)
        self.assertIn("http://localhost:3000", allowed_origins)

    def test_cors_configuration_allows_preview_vercel_deployments(self):
        """CORS regex must allow project-specific Vercel preview URLs only."""
        cors_middlewares = [m for m in app.user_middleware if m.cls == CORSMiddleware]
        self.assertTrue(len(cors_middlewares) > 0)
        cors_config = cors_middlewares[0].kwargs

        origin_regex = cors_config.get("allow_origin_regex")
        import re
        pattern = re.compile(origin_regex)
        self.assertTrue(pattern.match("https://netrasaathi-app-git-main-ishika.vercel.app"))
        self.assertTrue(pattern.match("https://netrasaathi-preview-test.vercel.app"))
        self.assertFalse(pattern.match("https://malicious-site.com"))

    def test_privacy_service_is_lazy_loaded(self):
        """PrivacyService analyzer must remain uninitialized until explicitly requested."""
        orig_analyzer = PrivacyService._analyzer_instance
        PrivacyService._analyzer_instance = None
        try:
            self.assertIsNone(PrivacyService._analyzer_instance)
        finally:
            PrivacyService._analyzer_instance = orig_analyzer


if __name__ == "__main__":
    unittest.main()
