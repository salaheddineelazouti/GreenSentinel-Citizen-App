#!/usr/bin/env python3
"""
GreenSentinel Demo Data Seeding Script

This script creates demo data for the GreenSentinel application:
- 3 users (citizen, firefighter, admin)
- 8 incidents with different statuses and locations
"""

import asyncio
import datetime
import random
from enum import Enum
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_async_session
from app.core.security import get_password_hash
from app.core.models import Incident, User

# Définir UserRole ici
class UserRole:
    CITIZEN = "citizen"
    FIREFIGHTER = "firefighter"
    ADMIN = "admin"

# Définir les énumérations localement plutôt que de les importer
class IncidentType(str, Enum):
    """Types d'incidents environnementaux."""
    FIRE = "fire"
    FLOOD = "flood"
    POLLUTION = "pollution" 
    LANDSLIDE = "landslide"

class IncidentStatus(str, Enum):
    """Statuts possibles d'un incident."""
    REPORTED = "reported"
    VALIDATED = "validated"
    REJECTED = "rejected"
    TRAVELING = "traveling"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"

# Center coordinates for random location generation
CENTER_LAT = 43.6108
CENTER_LON = 3.8767  # Montpellier, France
COORD_VARIATION = 0.02  # ~2km radius


async def create_demo_users(db: AsyncSession) -> List[User]:
    """Create three demo users with different roles."""
    print("Creating demo users...")
    
    # Check if users already exist
    query = await db.execute(select(User).filter(User.email == "citizen@example.com"))
    if query.scalar_one_or_none():
        print("Demo users already exist, skipping creation.")
        return []
    
    users = [
        User(
            email="citizen@example.com",
            hashed_password=get_password_hash("pwd123"),
            is_active=True,
        ),
        User(
            email="firefighter@example.com",
            hashed_password=get_password_hash("pwd123"),
            is_active=True,
        ),
        User(
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            is_active=True,
        ),
    ]
    
    for user in users:
        db.add(user)
    
    await db.commit()
    for user in users:
        await db.refresh(user)
    
    print(f"✓ Created {len(users)} demo users")
    return users


async def create_demo_incidents(db: AsyncSession) -> List[Incident]:
    """Create demo incidents with various statuses."""
    print("Creating demo incidents...")
    
    # Check if incidents already exist
    query = await db.execute(select(Incident).filter(Incident.description.like("This is a demo%")))
    if query.scalar_one():
        print("Demo incidents already exist, skipping creation.")
        return []
    
    # Get the citizen user
    query = await db.execute(select(User).filter(User.email == "citizen@example.com"))
    citizen = query.scalar_one_or_none()
    if not citizen:
        print("Citizen user not found, creating incidents with no reporter.")
        reporter_id = None
    else:
        reporter_id = citizen.id
    
    # Create incidents spread over the past 24 hours
    now = datetime.datetime.now()
    incidents = []
    
    statuses = [
        IncidentStatus.REPORTED,
        IncidentStatus.VALIDATED,
        IncidentStatus.TRAVELING,
        IncidentStatus.IN_PROGRESS,
        IncidentStatus.RESOLVED,
        IncidentStatus.REJECTED,
    ]
    
    incident_types = [
        IncidentType.FIRE,
        IncidentType.FLOOD,
        IncidentType.POLLUTION,
        IncidentType.LANDSLIDE,
    ]
    
    for i in range(8):
        # Random time in the past 24 hours
        hours_ago = random.randint(0, 24)
        minutes_ago = random.randint(0, 59)
        created_at = now - datetime.timedelta(hours=hours_ago, minutes=minutes_ago)
        
        # Random location around center
        latitude = CENTER_LAT + random.uniform(-COORD_VARIATION, COORD_VARIATION)
        longitude = CENTER_LON + random.uniform(-COORD_VARIATION, COORD_VARIATION)
        
        # Pick status and type
        status = statuses[i % len(statuses)]
        incident_type = incident_types[i % len(incident_types)]
        
        # Create incident with the attributes that exist in our model
        # Note: Adapté pour correspondre à la structure de table Incident actuelle
        from sqlalchemy import func
        from geoalchemy2 import WKTElement
        
        # Créer un point PostGIS à partir des coordonnées lat/lon
        point_wkt = f'POINT({longitude} {latitude})'
        
        incident = Incident(
            type=incident_type.value,
            severity=random.randint(1, 5),
            description=f"This is a demo {incident_type.value} incident with {status.value} status.",
            reporter_id=reporter_id,
            created_at=created_at,
            location=WKTElement(point_wkt, srid=4326),
            state=status.value
        )
        
        db.add(incident)
        incidents.append(incident)
    
    await db.commit()
    for incident in incidents:
        await db.refresh(incident)
    
    print(f"✓ Created {len(incidents)} demo incidents")
    return incidents


async def main():
    """Main function to seed demo data."""
    print("🌱 Starting GreenSentinel demo data seeding...")
    
    async for db in get_async_session():
        await create_demo_users(db)
        await create_demo_incidents(db)
        break
    
    print("✅ Demo data seeding complete!")


if __name__ == "__main__":
    asyncio.run(main())
