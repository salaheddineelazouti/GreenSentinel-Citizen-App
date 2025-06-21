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

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.security import get_password_hash

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

# Center coordinates for random location generation
CENTER_LAT = 43.6108
CENTER_LON = 3.8767  # Montpellier, France
COORD_VARIATION = 0.02  # ~2km radius


async def create_demo_users(db: AsyncSession) -> List[int]:
    """Create three demo users with different roles."""
    print("Creating demo users...")
    
    # Check if users already exist using raw SQL to avoid model dependencies
    result = await db.execute(text("SELECT id FROM users WHERE email = 'citizen@example.com'"))
    if result.scalar_one_or_none():
        print("Demo users already exist, skipping creation.")
        return []
    
    # Utiliser des insertions SQL brutes pour éviter les dépendances de modèle
    user_ids = []
    
    for email, password in [
        ("citizen@example.com", "pwd123"),
        ("firefighter@example.com", "pwd123"),
        ("admin@example.com", "admin123")
    ]:
        result = await db.execute(
            text("INSERT INTO users (email, hashed_password, is_active) VALUES (:email, :pwd, :active) RETURNING id"),
            {"email": email, "pwd": get_password_hash(password), "active": True}
        )
        user_id = result.scalar_one()
        user_ids.append(user_id)
    
    await db.commit()
    print(f"✓ Created {len(user_ids)} demo users")
    return user_ids


async def create_demo_incidents(db: AsyncSession) -> List[int]:
    """Create demo incidents with various statuses."""
    print("Creating demo incidents...")
    
    # Check if incidents already exist using raw SQL
    result = await db.execute(text("SELECT id FROM incidents WHERE description LIKE 'This is a demo%'"))
    if result.scalar_one_or_none():
        print("Demo incidents already exist, skipping creation.")
        return []
    
    # Get the citizen user
    result = await db.execute(text("SELECT id FROM users WHERE email = 'citizen@example.com'"))
    citizen_id = result.scalar_one_or_none()
    if not citizen_id:
        print("Citizen user not found, creating incidents with no reporter.")
        reporter_id = None
    else:
        reporter_id = citizen_id
    
    # Create incidents spread over the past 24 hours
    now = datetime.datetime.now()
    incident_ids = []
    
    incident_types = [
        IncidentType.FIRE.value,
        IncidentType.FLOOD.value,
        IncidentType.POLLUTION.value,
        IncidentType.LANDSLIDE.value,
    ]
    
    for i in range(8):
        # Random time in the past 24 hours
        hours_ago = random.randint(0, 24)
        minutes_ago = random.randint(0, 59)
        created_at = now - datetime.timedelta(hours=hours_ago, minutes=minutes_ago)
        
        # Random location around center
        latitude = CENTER_LAT + random.uniform(-COORD_VARIATION, COORD_VARIATION)
        longitude = CENTER_LON + random.uniform(-COORD_VARIATION, COORD_VARIATION)
        
        # Pick type
        incident_type = incident_types[i % len(incident_types)]
        
        # Créer un point PostGIS à partir des coordonnées
        point_wkt = f'POINT({longitude} {latitude})'
        
        # Insérer l'incident avec SQL brut en utilisant les colonnes existantes
        # (id, type, severity, description, reporter_id, created_at, location, confidence_text)
        sql = text("""
            INSERT INTO incidents 
            (type, severity, description, reporter_id, created_at, location, confidence_text) 
            VALUES 
            (:type, :severity, :description, :reporter_id, :created_at, ST_GeomFromText(:point_wkt, 4326), :confidence)
            RETURNING id
        """)
        
        result = await db.execute(sql, {
            "type": incident_type,
            "severity": random.randint(1, 5),
            "description": f"This is a demo {incident_type} incident.",
            "reporter_id": reporter_id,
            "created_at": created_at,
            "point_wkt": point_wkt,
            "confidence": random.uniform(0.65, 0.95)  # Valeur aléatoire de confiance entre 65% et 95%
        })
        
        incident_id = result.scalar_one()
        incident_ids.append(incident_id)
    
    await db.commit()
    print(f"✓ Created {len(incident_ids)} demo incidents")
    return incident_ids


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
