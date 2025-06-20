import json
from typing import Any

import geoalchemy2.functions as geo_func
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import ValidationError
from sqlalchemy import insert, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.events import IncidentValidated
from app.core.models import Incident
from app.schemas.alert import AlertIn, AlertOut
from app.services.storage import storage
from app.services.vision_client import detect_fire
from app.services.llm_client import verify_description
from app.services.mq import publish_event

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=AlertOut)
async def create_alert(
    payload: str = Form(..., description="JSON payload with alert metadata"),
    image: UploadFile = File(..., description="Image file of the incident"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create a new citizen alert with an image.
    
    This endpoint accepts multipart/form-data with:
    - A JSON payload containing alert metadata
    - An image file showing the environmental incident
    
    The image will be uploaded to MinIO and the incident created with pending_validation state.
    """
    try:
        # Parse alert data from JSON
        alert_data = AlertIn.parse_raw(payload)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid alert data: {str(e)}",
        )

    # Validate image content type
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type not supported: {image.content_type}. Only images are allowed."
        )
    
    try:
        # Upload image to MinIO
        content = await image.read()
        image_url = await storage.upload_image(content, image.filename)
        
        # Create incident in database 
        geometry = f"SRID=4326;POINT({alert_data.lon} {alert_data.lat})"
        
        # TODO: Replace with real auth
        reporter_id = 1  # Mock user ID
        
        query = insert(Incident).values(
            reporter_id=reporter_id,
            type=alert_data.type, 
            severity=alert_data.severity,
            description=alert_data.description,
            location=geometry,
            image_url=image_url,
            state="pending_validation",
        ).returning(Incident)

        result = await db.execute(query)
        incident = result.scalar_one()
        await db.commit()
        
        # Detect fire in the uploaded image
        is_fire, confidence = await detect_fire(incident.image_url)
        
        # Update incident state based on fire detection
        if is_fire:
            # If fire detected, set to pending_llm state
            new_state = "pending_llm"
            
            # Verify the alert description with LLM
            is_valid, text_confidence = await verify_description(
                alert_data.type, alert_data.description
            )
            
            # Update final state based on LLM verification
            if is_valid:
                new_state = "validated_fire"
                
                # Get point coordinates for publishing event
                point = await db.scalar(
                    geo_func.ST_AsGeoJSON(incident.location)
                )
                point_json = json.loads(point)
                
                # Publish incident validated event to message queue
                event = IncidentValidated(
                    id=incident.id,
                    lat=point_json["coordinates"][1],  # Latitude is Y coordinate
                    lon=point_json["coordinates"][0],  # Longitude is X coordinate
                    created_at=incident.created_at,
                    severity=incident.severity
                )
                await publish_event(event)
            else:
                new_state = "rejected_text"
                
            # Update incident state, confidence and text confidence
            query = (
                update(Incident)
                .where(Incident.id == incident.id)
                .values(
                    state=new_state,
                    confidence=confidence,
                    confidence_text=text_confidence
                )
                .returning(Incident)
            )
        else:
            # If no fire detected, reject immediately
            new_state = "rejected_no_fire"
            
            # Update incident state and confidence
            query = (
                update(Incident)
                .where(Incident.id == incident.id)
                .values(
                    state=new_state,
                    confidence=confidence,
                    confidence_text=None
                )
                .returning(Incident)
            )
            
        result = await db.execute(query)
        updated_incident = result.scalar_one()
        await db.commit()
        
        # Extract point coordinates for the response
        point = await db.scalar(
            geo_func.ST_AsGeoJSON(updated_incident.location)
        )
        point_json = json.loads(point)
        
        return AlertOut(
            id=updated_incident.id,
            reporter_id=updated_incident.reporter_id,
            type=updated_incident.type, 
            severity=updated_incident.severity,
            description=updated_incident.description,
            lat=point_json["coordinates"][1],  # Latitude is Y coordinate
            lon=point_json["coordinates"][0],  # Longitude is X coordinate
            image_url=updated_incident.image_url,
            state=updated_incident.state,
            created_at=updated_incident.created_at,
            updated_at=updated_incident.updated_at,
            confidence=confidence,
            confidence_text=updated_incident.confidence_text,
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating alert: {str(e)}",
        )
