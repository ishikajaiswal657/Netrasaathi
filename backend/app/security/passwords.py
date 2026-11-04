import bcrypt


def hash_password(plain_password: str) -> str:
    """
    Hashes a plain text password using bcrypt with automated unique salt generation.
    Bcrypt is intentionally computationally intensive to resist offline dictionary attacks.
    """
    # Enforce bcrypt's 72-byte max length limit
    password_bytes = plain_password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a stored bcrypt hash in constant time.
    Constant time comparison prevents timing attacks.
    """
    password_bytes = plain_password.encode("utf-8")[:72]
    hash_bytes = hashed_password.encode("utf-8")
    try:
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        # Invalid hash format or corrupt data
        return False

