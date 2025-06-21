from datetime import datetime
from typing import List, Optional

from geoalchemy2 import Geometry
from geoalchemy2.shape import to_shape
from sqlalchemy import Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    """User model."""
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), default="")
    hashed_password: Mapped[str]
    is_active: Mapped[bool] = mapped_column(default=True)
    role: Mapped[str] = mapped_column(String(50), default="user")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
    
    # Relationships
    incidents: Mapped[List["Incident"]] = relationship(back_populates="reporter")


class Incident(Base):
    """Environmental incident model with geospatial location."""
    __tablename__ = "incidents"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(String(50))
    severity: Mapped[int]
    description: Mapped[Optional[str]]
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    location: Mapped[Geometry] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326)
    )
    image_url: Mapped[Optional[str]] = mapped_column(String)
    state: Mapped[str] = mapped_column(String(50), default="pending_validation")
    confidence_text: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Relationships
    reporter: Mapped[User] = relationship(back_populates="incidents")
    
    def get_lat_lon(self) -> tuple[float, float]:
        """Get latitude and longitude from the geometric point."""
        point = to_shape(self.location)
        return point.y, point.x  # PostGIS returns (lon, lat) but we want (lat, lon)
