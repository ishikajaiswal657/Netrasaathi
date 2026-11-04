from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from backend.app.security.dependencies import get_current_user
from backend.app.security.passwords import hash_password, verify_password
from backend.app.security.tokens import create_access_token

router = APIRouter(prefix="", tags=["Authentication"])


@router.post(
    "/auth/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student or admin account"
)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Creates a new user profile with a securely salted bcrypt password.
    Blocks registration if the email is already in use.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )

    # Hash the password before saving
    hashed = hash_password(user_in.password)

    new_user = User(
        email=user_in.email.lower(),
        password_hash=hashed,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post(
    "/auth/login",
    response_model=Token,
    summary="Authenticate with email and password to receive a JWT access token"
)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Validates user credentials and returns a signed JWT token containing email and role.
    """
    user = db.query(User).filter(User.email == credentials.email.lower()).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    user_dto = UserResponse.model_validate(user)
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        email=user.email,
        user=user_dto
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Retrieve profile details for currently authenticated user"
)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns profile information for the user identified by the Bearer token.
    """
    return current_user

