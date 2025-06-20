from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2.functions import ST_SetSRID, ST_MakePoint
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.models import Incident
from app.core.schemas import IncidentIn, IncidentOut

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("", response_model=List[IncidentOut])
async def get_incidents(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db)
) -> List[IncidentOut]:
    """
    Get a list of environmental incidents.
    
    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        db: Database session dependency
        
    Returns:
        List of incidents with location data
    """
    result = await db.execute(
        select(Incident).order_by(Incident.created_at.desc()).offset(skip).limit(limit)
    )
    
    incidents = result.scalars().all()
    
    # Convert the PostGIS geometry to lat/lon for each incident
    incidents_out = []
    for incident in incidents:
        lat, lon = incident.get_lat_lon()
        incident_dict = {
            "id": incident.id,
            "type": incident.type,
            "severity": incident.severity,
            "description": incident.description,
            "created_at": incident.created_at,
            "reporter_id": incident.reporter_id,
            "lat": lat,
            "lon": lon
        }
        incidents_out.append(incident_dict)
    
    return incidents_out


@router.post("", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
async def create_incident(
    incident_in: IncidentIn, 
    db: AsyncSession = Depends(get_db)
) -> IncidentOut:
    """
    Create a new environmental incident.
    
    Args:
        incident_in: Incident data including location coordinates
        db: Database session dependency
        
    Returns:
        Created incident with complete data
    """
    # Create a PostGIS Point from lat/lon
    # Note: PostGIS uses (longitude, latitude) order
    point = ST_SetSRID(ST_MakePoint(incident_in.lon, incident_in.lat), 4326)
    
    # In a real app, we would get the reporter_id from the current user
    # For now, use a mock user ID = 1
    reporter_id = 1
    
    # Create new incident
    incident = Incident(
        type=incident_in.type,
        severity=incident_in.severity,
        description=incident_in.description,
        reporter_id=reporter_id,
        location=point
    )
    
    db.add(incident)
    await db.commit()
    await db.refresh(incident)
    
    # Get lat/lon from the geometry for the response
    lat, lon = incident.get_lat_lon()
    
    # Construct response manually since we need to include lat/lon
    return {
        "id": incident.id,
        "type": incident.type,
        "severity": incident.severity,
        "description": incident.description,
        "created_at": incident.created_at,
        "reporter_id": incident.reporter_id,
        "lat": lat,
        "lon": lon
    }
