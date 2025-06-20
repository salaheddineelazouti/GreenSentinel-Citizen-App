from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, validator


class AlertBase(BaseModel):
    """Base schema for alert data with validation."""
    type: str = Field(..., min_length=3, max_length=50, 
                     description="Type of environmental incident")
    severity: int = Field(..., ge=1, le=5, 
                         description="Severity level from 1 (minor) to 5 (critical)")
    description: Optional[str] = Field(None, 
                                      description="Detailed description of the incident")
    lat: float = Field(..., ge=-90, le=90, 
                      description="Latitude coordinate")
    lon: float = Field(..., ge=-180, le=180, 
                      description="Longitude coordinate")


class AlertIn(AlertBase):
    """Schema for citizen alert submission."""
    # No additional fields, just the base ones
    # The image will be sent as a separate part in multipart/form-data
    pass


class AlertOut(AlertBase):
    """Schema for citizen alert response."""
    id: int
    created_at: datetime
    image_url: Optional[str] = None
    state: str = "pending_validation"
    reporter_id: int
    confidence: Optional[float] = None
    confidence_text: Optional[float] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True
