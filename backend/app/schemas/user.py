from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# Defined user roles in Netrasaathi
UserRole = Literal["student", "admin"]


class UserBase(BaseModel):
    """Base user schema containing common attributes."""
    email: EmailStr


class UserCreate(UserBase):
    """
    Schema for user signup.
    Enforces minimum 8-character password length for basic credential security.
    """
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")
    role: UserRole = "student"


class UserLogin(BaseModel):
    """Schema for user authentication request."""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """
    Public user profile response schema.
    Never exposes password_hash.
    """
    id: int
    role: str
    created_at: datetime
    message: str | None = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """Schema for returning JWT access token upon successful authentication."""
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    user: UserResponse | None = None


class TokenData(BaseModel):
    """Schema representing verified claims unpacked from a JWT."""
    email: str | None = None
    role: str | None = None

