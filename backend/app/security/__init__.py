"""Authentication and security utilities."""
from backend.app.security.passwords import hash_password, verify_password
from backend.app.security.tokens import create_access_token, decode_access_token
from backend.app.security.dependencies import oauth2_scheme, get_current_user, require_role

__all__ = [
    "hash_password",
    "verify_password",
    "create_access_token",
    "decode_access_token",
    "oauth2_scheme",
    "get_current_user",
    "require_role"
]
