import csv
import io
import tempfile
from datetime import date
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from geoalchemy2.functions import ST_SetSRID, ST_MakePoint
import aiofiles.tempfile
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.models import Incident, User
from app.core.schemas import IncidentIn, IncidentOut
from app.core.security import get_admin_user

router = APIRouter(tags=["Incidents"])


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


@router.get("/export", tags=["Incidents"])
async def export_incidents(
    format: Annotated[str, Query(regex="^(csv|json)$")],
    current_user: Annotated[User, Depends(get_admin_user)],
    from_: Optional[date] = Query(None, alias="from"),
    to: Optional[date] = None,
    state: Optional[List[str]] = Query(None),
    session: AsyncSession = Depends(get_db),
):
    """
    Stream incidents as CSV or JSON according to filters.
    """
    # Build query with filters
    query = select(Incident).order_by(Incident.created_at.desc())
    
    # Apply date filters if provided
    if from_:
        query = query.where(Incident.created_at >= from_)
    if to:
        query = query.where(Incident.created_at <= to)
    
    # Apply state filter if provided
    if state and len(state) > 0:
        query = query.where(Incident.type.in_(state))
    
    # Execute query
    result = await session.execute(query)
    incidents = result.scalars().all()
    
    # Format date for filename
    today_str = date.today().strftime("%Y%m%d")
    
    # Convert the PostGIS geometry to lat/lon for each incident
    incidents_out = []
    for incident in incidents:
        lat, lon = incident.get_lat_lon()
        incident_dict = {
            "id": incident.id,
            "type": incident.type,
            "severity": incident.severity,
            "description": incident.description,
            "created_at": incident.created_at.isoformat(),
            "reporter_id": incident.reporter_id,
            "lat": lat,
            "lon": lon
        }
        incidents_out.append(incident_dict)
    
    if format == "json":
        # Return JSON directly
        json_content = jsonable_encoder(incidents_out)
        return StreamingResponse(
            content=io.BytesIO(str(json_content).encode("utf-8")),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=\"incidents_{today_str}.json\""
            },
        )
    else:  # CSV format
        # Create a temporary file to write CSV data
        async with aiofiles.tempfile.NamedTemporaryFile("w+", delete=False) as temp_file:
            # Create CSV writer
            # We need to create a StringIO buffer since csv.writer requires a text file-like object
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=["id", "type", "severity", "description", "created_at", "reporter_id", "lat", "lon"])
            
            # Write header and data
            writer.writeheader()
            for incident in incidents_out:
                writer.writerow(incident)
            
            # Get the CSV content from the StringIO buffer
            csv_content = output.getvalue()
            
            # Write CSV content to the temporary file
            await temp_file.write(csv_content)
            await temp_file.flush()
        
        # Create a streaming response with the CSV file
        return StreamingResponse(
            content=io.BytesIO(csv_content.encode("utf-8")),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=\"incidents_{today_str}.csv\""
            },
        )
