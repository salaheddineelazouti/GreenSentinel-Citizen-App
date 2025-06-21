from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.v1.endpoints import auth, health, incidents, alerts, websocket_incidents, users
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
    
    # Add CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3001", "http://localhost:3000", "http://localhost:5173", "https://admin.greensentinel.dev"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include API v1 router
    application.include_router(health.router)
    application.include_router(auth.router, prefix=settings.api_v1_prefix)
    application.include_router(incidents.router, prefix=settings.api_v1_prefix + "/incidents")
    application.include_router(alerts.router, prefix=settings.api_v1_prefix + "/alerts")
    application.include_router(users.router, prefix=settings.api_v1_prefix + "/users")
    # Include WebSocket router with empty prefix to make it available at /ws/incidents
    application.include_router(websocket_incidents.router, prefix="")
    
    return application


app = create_application()

# Setup Prometheus instrumentation
Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
