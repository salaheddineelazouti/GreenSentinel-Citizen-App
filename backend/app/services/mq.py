"""
Message queue client for RabbitMQ using aio_pika.
This module provides functions to publish events to RabbitMQ.
"""
from typing import Optional

import aio_pika
from aio_pika.abc import AbstractRobustConnection

from app.config import settings
from app.core.events import IncidentValidated


# Global connection instance (lazy initialized)
connection: Optional[aio_pika.RobustConnection] = None


async def get_connection() -> aio_pika.RobustConnection:
    """
    Get or create a robust connection to RabbitMQ.
    Uses a singleton pattern to reuse the connection.
    
    Returns:
        aio_pika.RobustConnection: Connection to RabbitMQ
    """
    global connection
    
    # If connection does not exist or is closed, create a new one
    if connection is None or connection.is_closed:
        # Use RobustConnection for automatic reconnection
        connection = await aio_pika.connect_robust(
            settings.rabbitmq_url,
            client_properties={
                "connection_name": "greensentinel_backend",
            },
        )
    
    return connection


async def publish_event(event: IncidentValidated) -> None:
    """
    Publish an IncidentValidated event to RabbitMQ.
    The event is published to the default exchange with routing key "incident.validated".
    
    Args:
        event: The IncidentValidated event to publish
    """
    # Get connection
    conn = await get_connection()
    
    # Create channel
    channel = await conn.channel()
    
    # Declare queue (ensure it exists)
    queue = await channel.declare_queue(
        "incident.validated",
        durable=True,  # Queue survives broker restart
    )
    
    # Publish message
    await channel.default_exchange.publish(
        aio_pika.Message(
            body=event.model_dump_json().encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,  # Message survives broker restart
        ),
        routing_key="incident.validated",
    )
