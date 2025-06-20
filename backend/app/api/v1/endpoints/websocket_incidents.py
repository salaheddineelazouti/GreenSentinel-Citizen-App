"""
WebSocket endpoint for real-time incident updates.
"""
from fastapi import APIRouter

from app.services.ws_manager import get_router

# Get the WebSocket router from the manager
router = get_router()

# The router will be included in app.main.py with prefix="", 
# making the endpoint available at /ws/incidents
