import os
import sys
from pathlib import Path
import unittest

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Use SQLite in-memory for testing to avoid requiring PostgreSQL during test execution
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["TESTING"] = "true"

from fastapi import Depends, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.user import User
from backend.app.security.dependencies import get_current_user, require_role
from backend.app.security.passwords import hash_password, verify_password

# Setup an isolated in-memory SQLite database for test execution
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Add a test-only route to explicitly verify require_role dependency
@app.get("/test/admin-only", tags=["Test"])
def admin_only_endpoint(current_user: User = Depends(require_role("admin"))):
    return {"message": f"Welcome Admin {current_user.email}"}


class TestAuthAndRoles(unittest.TestCase):
    """Test suite for authentication, JWT lifecycle, and role enforcement."""

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=test_engine)

    def setUp(self):
        # Bind this test's database override to the app
        app.dependency_overrides[get_db] = override_get_db
        db = TestingSessionLocal()
        try:
            db.query(User).delete()
            db.commit()
        finally:
            db.close()

    def tearDown(self):
        pass

    def test_health_check(self):
        """Checks that the server health endpoint responds successfully."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_signup_student_success(self):
        """Verifies successful registration of a student user."""
        payload = {
            "email": "student1@netrasaathi.org",
            "password": "SecureStudentPass123",
            "role": "student"
        }
        response = self.client.post("/auth/signup", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["email"], "student1@netrasaathi.org")
        self.assertEqual(data["role"], "student")
        self.assertNotIn("password", data)
        self.assertNotIn("password_hash", data)

    def test_signup_duplicate_email_fails(self):
        """Prevents multiple registrations with the exact same email."""
        payload = {
            "email": "student_dup@netrasaathi.org",
            "password": "SecureStudentPass123",
            "role": "student"
        }
        res1 = self.client.post("/auth/signup", json=payload)
        self.assertEqual(res1.status_code, 201)

        res2 = self.client.post("/auth/signup", json=payload)
        self.assertEqual(res2.status_code, 400)
        self.assertIn("already exists", res2.json()["detail"])

    def test_signup_short_password_fails(self):
        """Enforces minimum 8-character password policy at the schema validation layer."""
        payload = {
            "email": "short@netrasaathi.org",
            "password": "short",
            "role": "student"
        }
        response = self.client.post("/auth/signup", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_login_success_and_jwt_issuance(self):
        """Verifies that valid credentials produce an access token with expected claims."""
        signup_payload = {
            "email": "login_test@netrasaathi.org",
            "password": "MyPassword1234",
            "role": "student"
        }
        self.client.post("/auth/signup", json=signup_payload)

        login_payload = {
            "email": "login_test@netrasaathi.org",
            "password": "MyPassword1234"
        }
        response = self.client.post("/auth/login", json=login_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["role"], "student")
        self.assertEqual(data["email"], "login_test@netrasaathi.org")
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], "login_test@netrasaathi.org")
        self.assertEqual(data["user"]["role"], "student")

    def test_login_invalid_password_fails(self):
        """Rejects authentication when the password does not match the stored hash."""
        signup_payload = {
            "email": "wrong_pwd@netrasaathi.org",
            "password": "CorrectPassword123",
            "role": "student"
        }
        self.client.post("/auth/signup", json=signup_payload)

        login_payload = {
            "email": "wrong_pwd@netrasaathi.org",
            "password": "IncorrectPassword999"
        }
        response = self.client.post("/auth/login", json=login_payload)
        self.assertEqual(response.status_code, 401)

    def test_get_me_with_valid_token(self):
        """Checks that /me endpoint returns the authenticated user profile."""
        signup_payload = {
            "email": "me_test@netrasaathi.org",
            "password": "ValidPassword123",
            "role": "student"
        }
        self.client.post("/auth/signup", json=signup_payload)

        login_response = self.client.post("/auth/login", json={
            "email": "me_test@netrasaathi.org",
            "password": "ValidPassword123"
        })
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        me_response = self.client.get("/me", headers=headers)
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.json()["email"], "me_test@netrasaathi.org")
        self.assertEqual(me_response.json()["role"], "student")

    def test_get_me_unauthorized_without_token(self):
        """Rejects unauthenticated requests to protected profile route with 401."""
        response = self.client.get("/me")
        self.assertEqual(response.status_code, 401)

    def test_role_based_access_control(self):
        """Verifies that require_role grants admin access to admin and denies student."""
        # 1. Create a student and an admin
        self.client.post("/auth/signup", json={
            "email": "student_rbac@netrasaathi.org",
            "password": "PassWordStudent123",
            "role": "student"
        })
        self.client.post("/auth/signup", json={
            "email": "admin_rbac@netrasaathi.org",
            "password": "PassWordAdmin123",
            "role": "admin"
        })

        # 2. Login both
        student_token = self.client.post("/auth/login", json={
            "email": "student_rbac@netrasaathi.org",
            "password": "PassWordStudent123"
        }).json()["access_token"]

        admin_token = self.client.post("/auth/login", json={
            "email": "admin_rbac@netrasaathi.org",
            "password": "PassWordAdmin123"
        }).json()["access_token"]

        # 3. Student tries accessing admin route -> 403 Forbidden
        student_res = self.client.get(
            "/test/admin-only",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        self.assertEqual(student_res.status_code, 403)
        self.assertIn("requires 'admin' role", student_res.json()["detail"])

        # 4. Admin accesses admin route -> 200 OK
        admin_res = self.client.get(
            "/test/admin-only",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        self.assertEqual(admin_res.status_code, 200)
        self.assertIn("Welcome Admin", admin_res.json()["message"])

    def test_password_hashing_utilities(self):
        """Verifies direct bcrypt hashing and constant-time verification."""
        raw_pw = "TeacherStudentPassword999"
        hashed = hash_password(raw_pw)
        self.assertNotEqual(raw_pw, hashed)
        self.assertTrue(verify_password(raw_pw, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))


if __name__ == "__main__":
    unittest.main()
