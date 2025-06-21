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
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_async_session
from app.core.security import get_password_hash
from app.models.incident import Incident
from app.models.user import User, UserRole
from app.schemas.incident import IncidentStatus, IncidentType


# Center coordinates for random location generation
CENTER_LAT = 43.6108
CENTER_LON = 3.8767  # Montpellier, France
COORD_VARIATION = 0.02  # ~2km radius


async def create_demo_users(db: AsyncSession) -> List[User]:
    """Create three demo users with different roles."""
    print("Creating demo users...")
    
    # Check if users already exist
    query = await db.execute(select(User).filter(User.email == "citizen@greensentinel.org"))
    if query.scalar_one_or_none():
        print("Demo users already exist, skipping creation.")
        return []
    
    users = [
        User(
            email="citizen@greensentinel.org",
            hashed_password=get_password_hash("citizen123"),
            full_name="Citizen Demo",
            role=UserRole.CITIZEN,
            is_active=True,
        ),
        User(
            email="firefighter@greensentinel.org",
            hashed_password=get_password_hash("firefighter123"),
            full_name="Firefighter Demo",
            role=UserRole.FIREFIGHTER,
            is_active=True,
        ),
        User(
            email="admin@greensentinel.org",
            hashed_password=get_password_hash("admin123"),
            full_name="Admin Demo",
            role=UserRole.ADMIN,
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
    query = await db.execute(select(Incident).filter(Incident.title.like("Demo%")))
    if query.scalar_one():
        print("Demo incidents already exist, skipping creation.")
        return []
    
    # Get the citizen user
    query = await db.execute(select(User).filter(User.email == "citizen@greensentinel.org"))
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
        
        # Create incident
        incident = Incident(
            title=f"Demo Incident {i+1}",
            description=f"This is a demo {incident_type.value} incident with {status.value} status.",
            latitude=latitude,
            longitude=longitude,
            status=status,
            type=incident_type,
            reporter_id=reporter_id,
            created_at=created_at,
            updated_at=created_at,
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
