from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.database import get_db
from app.core.models import User
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
    email: str
    password: str


# No more mock users - using real database now


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Authenticate user and return a JWT token.
    Uses real database users instead of mock users.
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token (would use proper JWT signing in production)
    token_expires = datetime.utcnow() + timedelta(minutes=30)
    payload = {
        "sub": user.email,
        "exp": token_expires.timestamp(),
        "id": user.id
    }
    # Simple token for dev purposes
    mock_token = f"{user.email}.{token_expires.timestamp()}.{user.id}"
    
    return {
        "access_token": mock_token,
        "token_type": "bearer"
    }
