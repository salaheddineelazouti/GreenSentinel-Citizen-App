from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.config import settings
from app.core.security import get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


class Token(BaseModel):
    """Token schema returned after successful login."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token payload schema."""
    username: Optional[str] = None


class UserLogin(BaseModel):
    """Login request schema."""
    username: str
    password: str


# Mock user database - Would be replaced with real DB in production
mock_users = {
    "admin": {
        "username": "admin",
        "hashed_password": get_password_hash("admin123"),
        "email": "admin@greensentinel.org",
        "is_active": True,
    }
}


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin) -> Any:
    """
    Authenticate user and return a JWT token.
    This is a mock implementation - would use a proper JWT in production.
    """
    user = mock_users.get(user_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate mock token (would use JWT in production)
    token_expires = datetime.utcnow() + timedelta(minutes=30)
    mock_token = f"{user_data.username}.{token_expires.timestamp()}.mock-signature"
    
    return {
        "access_token": mock_token,
        "token_type": "bearer"
    }
