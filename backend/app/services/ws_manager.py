"""
WebSocket manager for real-time incident updates.

Uses fastapi-websocket-pubsub for WebSocket PubSub functionality.
"""
from typing import Any, Dict, List

from fastapi import APIRouter, WebSocket
from fastapi_websocket_pubsub import EventNotifier, PubSubClient

# PubSub topic for incident validated events
INCIDENT_VALIDATED = "INCIDENT_VALIDATED"

# Create an event notifier for broadcasting
event_notifier = EventNotifier()

# Create a router to host our WebSocket endpoint
router = APIRouter()


@router.websocket("/ws/incidents")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time incident updates.
    
    This endpoint handles client connections, subscriptions, and
    message broadcasting for incident validated events.
    """
    # Accept the WebSocket connection
    await websocket.accept()
    
    # Create a client connected to our event notifier
    client = PubSubClient(notifier=event_notifier)
    
    # Process client messages (subscribe/unsubscribe)
    try:
        await client.run(websocket)
    except Exception as e:
        # Handle disconnection or errors
        print(f"WebSocket error: {str(e)}")
    finally:
        # Clean up when connection closes
        await websocket.close()


async def broadcast_incident(event_json: str) -> None:
    """
    Broadcast an incident validated event to all connected WebSocket clients.
    
    Args:
        event_json: The JSON string representation of the incident event
    """
    await event_notifier.notify(
        INCIDENT_VALIDATED, 
        {"payload": event_json}
    )


def get_router() -> APIRouter:
    """
    Get the WebSocket router for the incident updates endpoint.
    
    Returns:
        FastAPI APIRouter with WebSocket endpoints
    """
    return router
