import json
from io import BytesIO
from typing import Any, Dict, Tuple

import pytest
import respx
from fastapi import status
from httpx import AsyncClient

from app.config import settings


@pytest.mark.asyncio
async def test_alert_with_llm_validation(client: AsyncClient, monkeypatch):
    """
    Test that creating a fire alert calls both the vision service and the LLM service,
    and validates the incident when both checks pass.
    """
    # Mock the MinIO upload service
    async def mock_upload_image(content: bytes, filename: str) -> str:
        return "http://minio:9000/citizen-reports/test-image-fire.jpg"

    monkeypatch.setattr(
        "app.services.storage.storage.upload_image", mock_upload_image
    )
    
    # Mock the vision API call for fire detection
    with respx.mock(base_url=settings.vision_url.rsplit("/", 1)[0]) as respx_mock:
        # Mock a positive fire detection
        respx_mock.post("/predict").respond(
            status_code=status.HTTP_200_OK,
            json={
                "is_fire": True,
                "confidence": 0.92,
                "boxes": [
                    {
                        "class": 0,
                        "confidence": 0.92,
                        "x1": 100,
                        "y1": 200,
                        "x2": 300,
                        "y2": 400
                    }
                ]
            }
        )
        
        # Mock the LLM verification to return valid with high confidence
        async def mock_verify_description(type_: str, description: str) -> Tuple[bool, float]:
            assert type_ == "fire"  # Verify correct type is passed
            assert "forest fire" in description.lower()  # Verify description is passed
            return True, 0.95  # Valid description with high confidence
            
        monkeypatch.setattr(
            "app.services.llm_client.verify_description", mock_verify_description
        )
        
        # Create test image data
        test_image = BytesIO(b"fake image data")
        test_image.name = "test.jpg"
        
        # Create test alert data with a legitimate description
        alert_data = {
            "type": "fire",
            "severity": 5,
            "description": "I can see a major forest fire spreading rapidly near the national park",
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
        assert data["confidence"] == 0.92  # Vision confidence
        assert data["confidence_text"] == 0.95  # LLM confidence
        
        # Verify the vision API was called
        assert respx_mock.calls.call_count == 1


@pytest.mark.asyncio
async def test_alert_with_llm_rejection(client: AsyncClient, monkeypatch):
    """
    Test that creating a fire alert is rejected by LLM when the description is suspicious,
    even when the vision service detects fire.
    """
    # Mock the MinIO upload service
    async def mock_upload_image(content: bytes, filename: str) -> str:
        return "http://minio:9000/citizen-reports/test-image-fire.jpg"

    monkeypatch.setattr(
        "app.services.storage.storage.upload_image", mock_upload_image
    )
    
    # Mock the vision API call for fire detection
    with respx.mock(base_url=settings.vision_url.rsplit("/", 1)[0]) as respx_mock:
        # Mock a positive fire detection
        respx_mock.post("/predict").respond(
            status_code=status.HTTP_200_OK,
            json={
                "is_fire": True,
                "confidence": 0.85,
                "boxes": [
                    {
                        "class": 0,
                        "confidence": 0.85,
                        "x1": 100,
                        "y1": 200,
                        "x2": 300,
                        "y2": 400
                    }
                ]
            }
        )
        
        # Mock the LLM verification to reject the description
        async def mock_verify_description(type_: str, description: str) -> Tuple[bool, float]:
            assert "suspicious spam" in description.lower()  # Verify description is passed
            return False, 0.15  # Invalid description (low confidence)
            
        monkeypatch.setattr(
            "app.services.llm_client.verify_description", mock_verify_description
        )
        
        # Create test image data
        test_image = BytesIO(b"fake image data")
        test_image.name = "test.jpg"
        
        # Create test alert data with a suspicious description
        alert_data = {
            "type": "fire",
            "severity": 3,
            "description": "This is suspicious spam content not related to any real fire",
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
        assert data["state"] == "rejected_text"  # Rejected by LLM
        assert data["confidence"] == 0.85  # Vision confidence
        assert data["confidence_text"] == 0.15  # LLM confidence


@pytest.mark.asyncio
async def test_alert_with_llm_service_failure(client: AsyncClient, monkeypatch):
    """
    Test handling of LLM service failure - should still validate if vision detected fire.
    """
    # Mock the MinIO upload service
    async def mock_upload_image(content: bytes, filename: str) -> str:
        return "http://minio:9000/citizen-reports/test-image-fire.jpg"

    monkeypatch.setattr(
        "app.services.storage.storage.upload_image", mock_upload_image
    )
    
    # Mock the vision API call for fire detection
    with respx.mock(base_url=settings.vision_url.rsplit("/", 1)[0]) as respx_mock:
        # Mock a positive fire detection
        respx_mock.post("/predict").respond(
            status_code=status.HTTP_200_OK,
            json={
                "is_fire": True,
                "confidence": 0.78,
                "boxes": [
                    {
                        "class": 0,
                        "confidence": 0.78,
                        "x1": 100,
                        "y1": 200,
                        "x2": 300,
                        "y2": 400
                    }
                ]
            }
        )
        
        # Mock the LLM verification to simulate an error
        async def mock_verify_description(type_: str, description: str) -> Tuple[bool, float]:
            # Simulate OpenAI API failure
            raise Exception("OpenAI API error")
            
        monkeypatch.setattr(
            "app.services.llm_client.verify_description", mock_verify_description
        )
        
        # Create test image data
        test_image = BytesIO(b"fake image data")
        test_image.name = "test.jpg"
        
        # Create test alert data
        alert_data = {
            "type": "fire",
            "severity": 4,
            "description": "I see a large wildfire in the hills",
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
        
        # Verify the response - should reject due to LLM failure
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["state"] == "rejected_text"  # Rejected due to LLM failure
        assert data["confidence"] == 0.78  # Vision confidence
        assert data["confidence_text"] == 0.0  # Default confidence on failure


@pytest.mark.asyncio
async def test_alert_with_no_fire_bypasses_llm(client: AsyncClient, monkeypatch):
    """
    Test that when no fire is detected by vision, LLM validation is bypassed.
    """
    # Mock the MinIO upload service
    async def mock_upload_image(content: bytes, filename: str) -> str:
        return "http://minio:9000/citizen-reports/test-image-no-fire.jpg"

    monkeypatch.setattr(
        "app.services.storage.storage.upload_image", mock_upload_image
    )
    
    # Mock the vision API call for no fire detection
    with respx.mock(base_url=settings.vision_url.rsplit("/", 1)[0]) as respx_mock:
        # Mock a negative fire detection
        respx_mock.post("/predict").respond(
            status_code=status.HTTP_200_OK,
            json={
                "is_fire": False,
                "confidence": 0.05,
                "boxes": []
            }
        )
        
        # Mock the LLM verification that should never be called
        async def mock_verify_description(type_: str, description: str) -> Tuple[bool, float]:
            # This function should not be called when no fire is detected
            pytest.fail("LLM verification should not be called when no fire is detected")
            
        monkeypatch.setattr(
            "app.services.llm_client.verify_description", mock_verify_description
        )
        
        # Create test image data
        test_image = BytesIO(b"fake image data")
        test_image.name = "test.jpg"
        
        # Create test alert data
        alert_data = {
            "type": "other",
            "severity": 2,
            "description": "Just some smoke from a barbecue",
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
        assert data["state"] == "rejected_no_fire"  # Rejected by vision, no LLM check
        assert data["confidence"] == 0.05  # Vision confidence
        assert data["confidence_text"] is None  # No LLM confidence
