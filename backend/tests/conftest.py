import pytest
from datetime import datetime
from typing import List, AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
import sqlalchemy as sa
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.models import Incident, User
from app.core.database import Base, get_db


# Mock implementation for Incident model# Create a mock Incident class for testing
class MockIncident:
    def __init__(self, id, type, severity, description, created_at, reporter_id, lat, lon, state="validated_fire", image_url=None):
        self.id = id
        self.type = type
        self.severity = severity
        self.description = description
        self.created_at = created_at
        self.reporter_id = reporter_id
        self.lat = lat
        self.lon = lon
        self.state = state
        self.image_url = image_url
        # Simulated location field that would come from PostGIS
        self._location = None
    
    @property
    def location(self):
        # Mock the spatial field
        return self._location
        
    def get_lat_lon(self):
        return (self.lat, self.lon)
        
    def __dict__(self):
        """Make the incident JSON serializable"""
        return {
            'id': self.id,
            'type': self.type,
            'severity': self.severity,
            'description': self.description,
            'created_at': str(self.created_at),
            'reporter_id': self.reporter_id,
            'lat': self.lat,
            'lon': self.lon,
            'state': self.state,
            'image_url': self.image_url
        }

# Mock async database session to avoid real database connections
@pytest.fixture
def mock_db_session():
    """Create a mock AsyncSession for tests"""
    mock_session = AsyncMock(spec=AsyncSession)
    mock_result = MagicMock()
    mock_session.execute.return_value = mock_result
    mock_session.commit.return_value = None
    mock_session.__aenter__.return_value = mock_session
    mock_session.__aexit__.return_value = None
    return mock_session

@pytest.fixture
def mock_get_db(mock_db_session):
    """Mock the get_db dependency"""
    async def _get_db() -> AsyncGenerator[AsyncSession, None]:
        try:
            yield mock_db_session
        finally:
            pass
    return _get_db

@pytest.fixture
def client(mock_get_db) -> TestClient:
    """
    Create a test client for the FastAPI application with mocked DB session.
    This fixture can be used in all tests.
    """
    # Override the get_db dependency to use our mock database session
    app.dependency_overrides[get_db] = mock_get_db
    
    # Create and return test client
    test_client = TestClient(app)
    
    yield test_client
    
    # Clear dependency overrides after test
    app.dependency_overrides.clear()

@pytest.fixture
def mock_admin_token():
    """
    Create a mock admin token for test authentication.
    This is used by the get_admin_user dependency.
    """
    return "mock_admin_token"

@pytest.fixture
def mock_incidents() -> List[MockIncident]:
    """
    Create mock incidents for tests without using the database.
    """
    incidents = []
    # Create 5 test incidents
    for i in range(5):
        incident = MockIncident(
            id=i+1,
            type=f"incident_type_{i}", 
            severity=i+1,
            description=f"Test incident {i}",
            reporter_id=1,  # Mock user ID
            created_at=datetime.now(),
            lat=50.0 + i * 0.1,
            lon=10.0 + i * 0.1,
            image_url=f"https://example.com/image{i}.jpg",
            state="validated_fire" if i % 2 == 0 else "travelling"
        )
        incidents.append(incident)
    
    return incidents
