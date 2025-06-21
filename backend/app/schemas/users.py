from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base schema for user data."""
    email: EmailStr
    name: str = ""
    is_active: bool = True
    role: str = "user"  # 'admin' or 'user'


class UserCreate(UserBase):
    """Schema for user creation with password."""
    password: str


class UserUpdate(BaseModel):
    """Schema for user updates."""
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None
    password: Optional[str] = None


class User(UserBase):
    """Schema for user responses."""
    id: int
    
    class Config:
        from_attributes = True
