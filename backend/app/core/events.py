"""
Event models for the GreenSentinel system.
These models are serialized/deserialized for message queue communications.
"""
from datetime import datetime
from typing import Optional

import msgspec
from pydantic import BaseModel, Field


class IncidentValidated(BaseModel):
    """
    Event emitted when an incident is validated as a fire.
    This event is published to RabbitMQ for asynchronous processing.
    """
    id: int = Field(..., description="Incident ID")
    lat: float = Field(..., description="Latitude coordinate")
    lon: float = Field(..., description="Longitude coordinate")
    created_at: datetime = Field(..., description="Incident creation timestamp")
    severity: Optional[int] = Field(None, description="Severity level (1-5)")
    
    class Config:
        """Pydantic model configuration."""
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
        
    def model_dump_msgspec(self) -> bytes:
        """
        Serialize the event using msgspec for high-performance serialization.
        
        Returns:
            bytes: Serialized event data
        """
        # Convert to dict and then serialize
        data = self.model_dump(mode="json")
        encoder = msgspec.json.Encoder()
        return encoder.encode(data)
