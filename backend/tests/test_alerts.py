import json
import pytest
from io import BytesIO
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import UploadFile
from httpx import AsyncClient

from app.main import app
from app.core.models import Incident


@pytest.fixture
def mock_storage():
    """Mock the MinIO storage service."""
    with patch("app.api.v1.endpoints.alerts.storage") as mock:
        mock.upload_image = AsyncMock(return_value="https://minio-host/test-bucket/mock-image.jpg")
        yield mock


@pytest.mark.asyncio
async def test_create_alert(client: AsyncClient, mock_storage):
    """Test creating an alert with an image."""
    # Create test image
    test_image = BytesIO(b"fake image content")
    test_image.name = "test.jpg"
    
    # Create test payload
    alert_data = {
        "type": "water_pollution",
        "severity": 3,
        "description": "Test pollution alert",
        "lat": 48.8566,
        "lon": 2.3522
    }
    
    # Create multipart form data
    files = {
        "image": ("test.jpg", test_image, "image/jpeg"),
        "payload": (None, json.dumps(alert_data)),
    }
    
    # Make request
    response = await client.post("/api/v1/alerts", files=files)
    
    # Verify response
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == alert_data["type"]
    assert data["severity"] == alert_data["severity"]
    assert data["lat"] == pytest.approx(alert_data["lat"])
    assert data["lon"] == pytest.approx(alert_data["lon"])
    assert data["image_url"] == "https://minio-host/test-bucket/mock-image.jpg"
    assert data["state"] == "pending_validation"
    assert "id" in data
    assert "created_at" in data
    
    # Verify that storage.upload_image was called
    mock_storage.upload_image.assert_called_once()


@pytest.mark.asyncio
async def test_create_alert_invalid_payload(client: AsyncClient, mock_storage):
    """Test creating an alert with invalid payload data."""
    # Create test image
    test_image = BytesIO(b"fake image content")
    
    # Create invalid test payload (missing required fields)
    alert_data = {
        "type": "water_pollution",
        # missing severity
        "description": "Test pollution alert"
        # missing coordinates
    }
    
    # Create multipart form data
    files = {
        "image": ("test.jpg", test_image, "image/jpeg"),
        "payload": (None, json.dumps(alert_data)),
    }
    
    # Make request
    response = await client.post("/api/v1/alerts", files=files)
    
    # Verify response
    assert response.status_code == 422
    
    # Verify that storage.upload_image was NOT called
    mock_storage.upload_image.assert_not_called()


@pytest.mark.asyncio
async def test_create_alert_invalid_file_type(client: AsyncClient, mock_storage):
    """Test creating an alert with invalid file type."""
    # Create test file that's not an image
    test_file = BytesIO(b"not an image")
    
    # Create test payload
    alert_data = {
        "type": "water_pollution",
        "severity": 3,
        "description": "Test pollution alert",
        "lat": 48.8566,
        "lon": 2.3522
    }
    
    # Create multipart form data
    files = {
        "image": ("test.txt", test_file, "text/plain"),
        "payload": (None, json.dumps(alert_data)),
    }
    
    # Make request
    response = await client.post("/api/v1/alerts", files=files)
    
    # Verify response
    assert response.status_code == 400
    assert "must be an image" in response.json()["detail"]
    
    # Verify that storage.upload_image was NOT called
    mock_storage.upload_image.assert_not_called()
