from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from app.api.v1.endpoints import auth, health, incidents, alerts, websocket_incidents
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Lifespan events for the FastAPI application.
    Setup database connections, background tasks, etc.
    """
    # Connect to databases on startup
    # In the future, implement asyncpg/PostGIS connection here
    print("Starting up API...")
    
    yield
    
    # Cleanup on shutdown
    # Close database connections, etc.
    print("Shutting down API...")


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title="GreenSentinel API",
        description="Environmental reporting and monitoring API",
        version="0.1.0",
        lifespan=lifespan,
    )
    
    # Include API v1 router
    application.include_router(health.router)
    application.include_router(auth.router, prefix=settings.api_v1_prefix)
    application.include_router(incidents.router, prefix=settings.api_v1_prefix + "/incidents")
    application.include_router(alerts.router, prefix=settings.api_v1_prefix + "/alerts")
    # Include WebSocket router with empty prefix to make it available at /ws/incidents
    application.include_router(websocket_incidents.router, prefix="")
    
    return application


app = create_application()
