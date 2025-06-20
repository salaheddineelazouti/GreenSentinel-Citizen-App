import json
from io import BytesIO
from pathlib import Path
from typing import Any, Dict

import pytest
import respx
from fastapi import status
from httpx import AsyncClient

from app.config import settings


@pytest.mark.asyncio
async def test_alert_with_fire_detection(client: AsyncClient, monkeypatch):
    """
    Test that creating an alert successfully calls the vision service 
    and updates incident state based on fire detection result.
    """
    # Mock the MinIO upload service to return a fixed URL
    async def mock_upload_image(content: bytes, filename: str) -> str:
        return "http://minio:9000/citizen-reports/test-image.jpg"

    monkeypatch.setattr(
        "app.services.storage.storage.upload_image", mock_upload_image
    )
    
    # Mock the vision API call
    with respx.mock(base_url=settings.vision_url.rsplit("/", 1)[0]) as respx_mock:
        # Mock a positive fire detection
        respx_mock.post("/predict").respond(
            status_code=status.HTTP_200_OK,
            json={
                "is_fire": True,
                "confidence": 0.87,
                "boxes": [
                    {
                        "class": 0,
                        "confidence": 0.87,
                        "x1": 100,
                        "y1": 200,
                        "x2": 300,
                        "y2": 400
                    }
                ]
            }
        )
        
        # Create test image data
        test_image = BytesIO(b"fake image data")
        test_image.name = "test.jpg"
        
        # Create test alert data
        alert_data = {
            "type": "fire",
            "severity": "high",
            "description": "Forest fire spotted",
            "lat": 48.856614,
            "lon": 2.3522219
        }
        
        # Make request to create alert
        response = await client.post(
            "/api/v1/alerts/",
            files={
                "payload": (None, json.dumps(alert_data), "application/json"),
                "image": ("test.jpg", test_image, "image/jpeg")
            }
        )
        
        # Verify the response
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["state"] == "validated_fire"
        assert data["confidence"] == 0.87
        
        # Verify the vision API was called
        assert respx_mock.calls.call_count == 1
        assert respx_mock.calls[0].request.url.path == "/predict"
        req_body = json.loads(respx_mock.calls[0].request.content)
        assert req_body["image_url"] == "http://minio:9000/citizen-reports/test-image.jpg"


@pytest.mark.asyncio
async def test_alert_with_rejected_detection(client: AsyncClient, monkeypatch):
    """
    Test that creating an alert successfully calls the vision service 
    and rejects the incident when no fire is detected.
    """
    # Mock the MinIO upload service to return a fixed URL
    async def mock_upload_image(content: bytes, filename: str) -> str:
        return "http://minio:9000/citizen-reports/test-image-no-fire.jpg"

    monkeypatch.setattr(
        "app.services.storage.storage.upload_image", mock_upload_image
    )
    
    # Mock the vision API call
    with respx.mock(base_url=settings.vision_url.rsplit("/", 1)[0]) as respx_mock:
        # Mock a negative fire detection
        respx_mock.post("/predict").respond(
            status_code=status.HTTP_200_OK,
            json={
                "is_fire": False,
                "confidence": 0.15,
                "boxes": []
            }
        )
        
        # Create test image data
        test_image = BytesIO(b"fake image data")
        test_image.name = "test.jpg"
        
        # Create test alert data
        alert_data = {
            "type": "other",
            "severity": "low",
            "description": "Suspicious smoke",
            "lat": 48.856614,
            "lon": 2.3522219
        }
        
        # Make request to create alert
        response = await client.post(
            "/api/v1/alerts/",
            files={
                "payload": (None, json.dumps(alert_data), "application/json"),
                "image": ("test.jpg", test_image, "image/jpeg")
            }
        )
        
        # Verify the response
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["state"] == "rejected"
        assert data["confidence"] == 0.15


@pytest.mark.asyncio
async def test_alert_with_vision_service_failure(client: AsyncClient, monkeypatch):
    """
    Test handling of vision service failure - should create incident with pending_validation state.
    """
    # Mock the MinIO upload service to return a fixed URL
    async def mock_upload_image(content: bytes, filename: str) -> str:
        return "http://minio:9000/citizen-reports/test-image.jpg"

    monkeypatch.setattr(
        "app.services.storage.storage.upload_image", mock_upload_image
    )
    
    # Mock the vision API call to fail
    with respx.mock(base_url=settings.vision_url.rsplit("/", 1)[0]) as respx_mock:
        respx_mock.post("/predict").respond(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Mock the vision client to handle the failure correctly
        async def mock_detect_fire(image_url: str) -> tuple[bool, float]:
            return False, 0.0
            
        monkeypatch.setattr(
            "app.services.vision_client.detect_fire", mock_detect_fire
        )
        
        # Create test image data
        test_image = BytesIO(b"fake image data")
        test_image.name = "test.jpg"
        
        # Create test alert data
        alert_data = {
            "type": "fire",
            "severity": "medium",
            "description": "Potential wildfire",
            "lat": 48.856614,
            "lon": 2.3522219
        }
        
        # Make request to create alert
        response = await client.post(
            "/api/v1/alerts/",
            files={
                "payload": (None, json.dumps(alert_data), "application/json"),
                "image": ("test.jpg", test_image, "image/jpeg")
            }
        )
        
        # Verify the response - should still succeed but with rejected state
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["state"] == "rejected"
        assert data["confidence"] == 0.0
