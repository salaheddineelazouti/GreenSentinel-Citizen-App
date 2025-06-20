from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, EmailStr


class UserBase(BaseModel):
    """Base user schema."""
    
    email: EmailStr


class UserCreate(UserBase):
    """Schema for creating a new user."""
    
    password: str


class UserOut(UserBase):
    """Schema for user data returned to clients."""
    
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True


class IncidentBase(BaseModel):
    """Base incident schema."""
    
    type: str
    severity: int = Field(ge=1, le=5)
    description: Optional[str] = None


class IncidentIn(IncidentBase):
    """Schema for creating a new incident."""
    
    lat: float = Field(ge=-90, le=90, description="Latitude in WGS84")
    lon: float = Field(ge=-180, le=180, description="Longitude in WGS84")
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "water_pollution",
                "severity": 3,
                "description": "Oil spill in river",
                "lat": 48.856613,
                "lon": 2.352222,
            }
        }


class IncidentOut(IncidentBase):
    """Schema for incident data returned to clients."""
    
    id: int
    created_at: datetime
    reporter_id: int
    lat: float
    lon: float
    
    class Config:
        from_attributes = True
