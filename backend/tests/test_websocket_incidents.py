"""
Tests for WebSocket incident updates functionality.
"""
import asyncio
import json
import logging
import pytest
from datetime import datetime
from typing import Any, AsyncGenerator, Dict

from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import AsyncClient
from starlette.routing import WebSocketRoute
from websockets.exceptions import ConnectionClosed

from app.main import app as main_app
from app.api.v1.endpoints import websocket_incidents
from app.services.ws_manager import broadcast_incident, INCIDENT_VALIDATED

# Configure logging to see detailed test output
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@pytest.fixture
def app() -> FastAPI:
    """Return the FastAPI app instance."""
    return main_app


@pytest.fixture
async def client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    """Async client for testing."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.mark.timeout(3)
def test_websocket_route_in_router() -> None:
    """Test that WebSocket route is correctly registered in the router."""
    # Check that the router has our WebSocket route
    ws_routes = [
        route for route in websocket_incidents.router.routes 
        if isinstance(route, WebSocketRoute) and "/ws/incidents" in route.path
    ]
    assert len(ws_routes) > 0, "WebSocket route /ws/incidents not found in router"
    logger.info(f"Found {len(ws_routes)} WebSocket routes in the router")


@pytest.mark.timeout(3)
def test_websocket_route_in_app(app: FastAPI) -> None:
    """Test that the WebSocket route exists in the application."""
    routes = [route for route in app.routes if isinstance(route, WebSocketRoute)]
    ws_routes = [route for route in routes if route.path == "/ws/incidents"]
    assert len(ws_routes) > 0, "WebSocket route not found in application"
    logger.info(f"Found {len(ws_routes)} WebSocket routes in the app with path /ws/incidents")


@pytest.mark.timeout(3)
@pytest.mark.asyncio
async def test_broadcast_functionality() -> None:
    """Test that broadcast_incident function works correctly."""
    # Sample incident data
    incident_data = {
        "id": 123,
        "lat": 48.8566,
        "lon": 2.3522,
        "created_at": datetime.now().isoformat(),
        "confidence": 0.95,
        "severity": 3,
        "status": "validated_fire"
    }
    
    # Convert to JSON and attempt to broadcast
    incident_json = json.dumps(incident_data)
    
    try:
        # Test that the function can be called without errors
        await broadcast_incident(incident_json)
        logger.info("Successfully called broadcast_incident without exceptions")
        
        # In a more comprehensive test, we would connect a WebSocket client
        # and verify that it receives the broadcast message
    except Exception as e:
        pytest.fail(f"broadcast_incident raised an exception: {str(e)}")


