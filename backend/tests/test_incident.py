import asyncio
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.models import User
from app.main import app


@pytest.fixture
async def test_user(db: AsyncSession) -> User:
    """Create a test user for testing incidents."""
    user = User(
        email="test@greensentinel.org",
        hashed_password="$2b$12$test_hash",
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
async def db_session(monkeypatch) -> AsyncSession:
    """Get a test database session that automatically rolls back."""
    # Replace the get_db dependency with our test session
    async def _get_test_db():
        test_session_factory = AsyncSession
        async with test_session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    # Apply monkeypatch to get_db
    monkeypatch.setattr("app.core.database.get_db", _get_test_db)
    return _get_test_db


@pytest.mark.asyncio
async def test_create_incident(client: AsyncClient, test_user: User):
    """Test creating an incident with valid coordinates."""
    incident_data = {
        "type": "water_pollution",
        "severity": 3,
        "description": "Test pollution incident",
        "lat": 48.8566,
        "lon": 2.3522
    }

    response = await client.post("/api/v1/incidents", json=incident_data)
    
    # Verify the response
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == incident_data["type"]
    assert data["severity"] == incident_data["severity"]
    assert data["lat"] == pytest.approx(incident_data["lat"])
    assert data["lon"] == pytest.approx(incident_data["lon"])
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_get_incidents(client: AsyncClient, test_user: User):
    """Test retrieving incidents."""
    # First create an incident
    incident_data = {
        "type": "air_pollution",
        "severity": 2,
        "description": "Test air pollution",
        "lat": 51.5074,
        "lon": -0.1278
    }
    await client.post("/api/v1/incidents", json=incident_data)
    
    # Now get the incidents list
    response = await client.get("/api/v1/incidents")
    
    # Verify the response
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    
    # Check that our created incident is in the list
    found = False
    for incident in data:
        if (incident["type"] == incident_data["type"] and
            incident["severity"] == incident_data["severity"] and
            pytest.approx(incident["lat"]) == incident_data["lat"] and
            pytest.approx(incident["lon"]) == incident_data["lon"]):
            found = True
            break
    
    assert found, "Created incident was not found in response"


@pytest.mark.asyncio
async def test_invalid_coordinates(client: AsyncClient):
    """Test creating an incident with invalid coordinates."""
    # Test with latitude out of range
    incident_data = {
        "type": "water_pollution",
        "severity": 3,
        "description": "Invalid coordinates",
        "lat": 95.0,  # Invalid: must be between -90 and 90
        "lon": 2.3522
    }
    
    response = await client.post("/api/v1/incidents", json=incident_data)
    assert response.status_code == 422  # Validation error
    
    # Test with longitude out of range
    incident_data["lat"] = 48.8566
    incident_data["lon"] = 200.0  # Invalid: must be between -180 and 180
    
    response = await client.post("/api/v1/incidents", json=incident_data)
    assert response.status_code == 422  # Validation error
