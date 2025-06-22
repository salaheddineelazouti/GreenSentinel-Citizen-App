"""
WebSocket manager for real-time incident updates.

Uses native FastAPI WebSocket for better stability and compatibility.
"""
import asyncio
import json
import logging
from typing import Any, Dict, List, Set
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

# Configure logging
logger = logging.getLogger(__name__)

# Create a router to host our WebSocket endpoint
router = APIRouter()

# Store active WebSocket connections
active_connections: Set[WebSocket] = set()


@router.websocket("/ws/incidents")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time incident updates.
    
    This endpoint handles client connections and broadcasts incident validated events.
    """
    logger.info("New WebSocket connection attempt")
    
    # Safe accept to handle various connection errors
    try:
        await websocket.accept()
        logger.info("WebSocket connection accepted")
        active_connections.add(websocket)
    except Exception as e:
        logger.error(f"Failed to accept WebSocket connection: {str(e)}")
        return
    
    try:
        # Keep the connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client (heartbeat, subscription requests, etc.)
                data = await websocket.receive_text()
                logger.debug(f"Received message: {data}")
                
                # Echo back a connection confirmation
                if data == "ping":
                    response = json.dumps({
                        "type": "pong", 
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    await websocket.send_text(response)
                    logger.debug("Sent pong response")
                    
            except WebSocketDisconnect:
                logger.info("WebSocket disconnected normally")
                break
            except Exception as e:
                logger.error(f"WebSocket message error: {str(e)}")
                break
                
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket connection error: {str(e)}")
    finally:
        # Clean up when connection closes
        active_connections.discard(websocket)
        try:
            await websocket.close()
        except Exception:
            pass
        logger.info("WebSocket connection cleanup complete")


async def broadcast_incident(incident_data: Dict[str, Any]) -> None:
    """
    Broadcast an incident validated event to all connected WebSocket clients.
    
    Args:
        incident_data: Dictionary containing incident information
    """
    if not active_connections:
        logger.info("No active connections, skipping broadcast")
        return
    
    logger.info(f"Broadcasting incident {incident_data.get('id', 'unknown')} to {len(active_connections)} clients")
    
    # Serialize message once for all clients
    try:
        message = json.dumps({
            "type": "incident_validated",
            "data": incident_data,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.error(f"Failed to serialize incident data: {str(e)}")
        return
    
    # Create a copy of connections to avoid modification during iteration
    connections_to_remove = set()
    
    for connection in active_connections.copy():
        try:
            # Make sure connection is a WebSocket object, not a string or URL
            if not isinstance(connection, WebSocket):
                logger.error(f"Invalid connection object type: {type(connection)}")
                connections_to_remove.add(connection)
                continue
                
            await connection.send_text(message)
        except Exception as e:
            logger.error(f"Failed to send message to WebSocket client: {str(e)}")
            connections_to_remove.add(connection)
    
    # Remove failed connections
    for connection in connections_to_remove:
        active_connections.discard(connection)


def get_router() -> APIRouter:
    """
    Get the WebSocket router for the incident updates endpoint.
    
    Returns:
        FastAPI APIRouter with WebSocket endpoints
    """
    return router


def get_active_connections_count() -> int:
    """
    Get the number of active WebSocket connections.
    
    Returns:
        Number of active connections
    """
    return len(active_connections)
