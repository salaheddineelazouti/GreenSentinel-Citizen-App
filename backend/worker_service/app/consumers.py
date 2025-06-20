"""
Message consumers for processing RabbitMQ messages.
"""
import asyncio
import json
import sys
from datetime import datetime
from typing import Any, Dict

import aio_pika
import msgspec
from aio_pika.abc import AbstractIncomingMessage
from structlog import get_logger

# Import push notification module
from app import push

# Import WebSocket manager for real-time broadcasting
# Add this in a try-except block to handle import errors gracefully
try:
    from app.services.ws_manager import broadcast_incident
    websocket_available = True
except ImportError:
    websocket_available = False
    print("WebSocket manager not available, broadcasting disabled", file=sys.stderr)

from app.config import settings

logger = get_logger("consumers")


class IncidentConsumer:
    """
    Consumer for incident.validated messages.
    Processes incident validation events and performs downstream actions.
    """
    
    def __init__(self, connection_url: str) -> None:
        """
        Initialize the incident consumer.
        
        Args:
            connection_url: RabbitMQ connection URL
        """
        self.connection_url = connection_url
        self.connection: aio_pika.RobustConnection = None
        self.channel: aio_pika.RobustChannel = None
        self.queue: aio_pika.Queue = None
        self.retry_exchange: aio_pika.RobustExchange = None
        self.should_stop = False
        
    async def setup(self) -> None:
        """Set up RabbitMQ connection, channel, and queues."""
        # Create connection
        self.connection = await aio_pika.connect_robust(self.connection_url)
        
        # Create channel
        self.channel = await self.connection.channel()
        await self.channel.set_qos(prefetch_count=1)  # Process one message at a time
        
        # Declare primary queue
        self.queue = await self.channel.declare_queue(
            "incident.validated",
            durable=True
        )
        
        # Declare retry exchange
        self.retry_exchange = await self.channel.declare_exchange(
            "incident.retry",
            type=aio_pika.ExchangeType.DIRECT,
            durable=True
        )
        
        # Declare dead-letter queue
        self.dlq = await self.channel.declare_queue(
            "incident.validated.dlq",
            durable=True
        )
        
        # Create retry queue with TTL
        retry_queue = await self.channel.declare_queue(
            "incident.validated.retry",
            arguments={
                "x-dead-letter-exchange": "",  # Default exchange
                "x-dead-letter-routing-key": "incident.validated",
                "x-message-ttl": settings.retry_delay,  # TTL in ms
            },
            durable=True
        )
        
        # Bind retry queue to retry exchange
        await retry_queue.bind(self.retry_exchange, routing_key="incident.validated")
        
        logger.info("Consumer setup complete", queue="incident.validated")
    
    async def start_consuming(self) -> None:
        """
        Start consuming messages from the queue.
        This method blocks until stop_consuming() is called.
        """
        await self.setup()
        
        logger.info("Starting to consume messages", queue="incident.validated")
        await self.queue.consume(self.process_message)
        
        # Keep the consumer running until should_stop is set to True
        while not self.should_stop:
            await asyncio.sleep(1)
    
    async def stop_consuming(self) -> None:
        """Stop consuming messages and close connections."""
        self.should_stop = True
        
        if self.connection and not self.connection.is_closed:
            await self.connection.close()
            logger.info("Consumer stopped", queue="incident.validated")
    
    async def process_message(self, message: AbstractIncomingMessage) -> None:
        """
        Process an incoming message from the queue.
        
        Args:
            message: The incoming message to process
        """
        async with message.process(requeue=False):  # Don't auto-requeue if processing fails
            try:
                # Parse message body
                body = json.loads(message.body.decode())
                logger.info(
                    "Received incident validation", 
                    incident_id=body.get("id"), 
                    retry_count=message.headers.get("x-retry-count", 0) if message.headers else 0
                )
                
                # Process the message
                await self._handle_incident_validated(body)
                
                logger.info(
                    "Successfully processed incident", 
                    incident_id=body.get("id")
                )
                
            except Exception as e:
                retry_count = (message.headers or {}).get("x-retry-count", 0)
                
                if retry_count < settings.max_retries:
                    # Send to retry queue with incremented retry count
                    await self._send_to_retry(message.body, retry_count + 1)
                    logger.warning(
                        "Failed to process message, retrying", 
                        error=str(e), 
                        retry_count=retry_count + 1
                    )
                else:
                    # Send to dead-letter queue
                    await self._send_to_dlq(message.body)
                    logger.error(
                        "Failed to process message after max retries", 
                        error=str(e), 
                        retry_count=retry_count
                    )
                    
    async def _send_to_retry(self, body: bytes, retry_count: int) -> None:
        """
        Send a message to the retry queue.
        
        Args:
            body: Original message body
            retry_count: Current retry count
        """
        await self.retry_exchange.publish(
            aio_pika.Message(
                body=body,
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                headers={"x-retry-count": retry_count}
            ),
            routing_key="incident.validated"
        )
    
    async def _send_to_dlq(self, body: bytes) -> None:
        """
        Send a message to the dead-letter queue.
        
        Args:
            body: Original message body
        """
        await self.dlq.channel.default_exchange.publish(
            aio_pika.Message(
                body=body,
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            ),
            routing_key=self.dlq.name
        )
    
    async def _handle_incident_validated(self, data: Dict[str, Any]) -> None:
        """
        Handle an incident.validated event.
        This method simulates sending notifications, logging, and other operations.
        
        Args:
            data: The parsed message data
        """
        incident_id = data.get("id")
        lat = data.get("lat")
        lon = data.get("lon")
        created_at = data.get("created_at")
        severity = data.get("severity", 0)
        
        # Log the incident for analytics
        logger.info(
            "Fire incident validated",
            incident_id=incident_id,
            coordinates=f"{lat},{lon}",
            timestamp=created_at,
            severity=severity
        )
        
        # Simulate push notification to nearby residents
        await self._simulate_push_notification(incident_id, lat, lon, severity)
        
        # Simulate updating analytics metrics
        await self._update_analytics(incident_id, created_at, lat, lon, severity)
        
        # Broadcast to WebSocket clients if available
        if websocket_available:
            try:
                # Use the original message body as it already contains all fields in JSON format
                # The message body is passed to process_message() as bytes and decoded there
                message_str = json.dumps(data)
                logger.info("Broadcasting incident to WebSocket clients", incident_id=incident_id)
                await broadcast_incident(message_str)
            except Exception as e:
                # Log the error but don't fail the message processing
                logger.error("Failed to broadcast to WebSocket", error=str(e))
                
        # Send push notification to firefighters via FCM
        try:
            await push.send_push(
                title="🔥 Incendie détecté",
                body=f"Niv. {severity} – {lat:.3f},{lon:.3f}",
                data={"incident_id": str(incident_id)},
            )
        except Exception as e:
            # Log the error but don't fail the message processing
            logger.error("Failed to send push notification", error=str(e))
    
    async def _simulate_push_notification(
        self, incident_id: int, lat: float, lon: float, severity: int
    ) -> None:
        """
        Simulate sending push notifications to nearby residents.
        
        In a production environment, this would use Firebase Cloud Messaging (FCM)
        or similar service to send actual push notifications.
        
        Args:
            incident_id: The incident ID
            lat: Latitude coordinate
            lon: Longitude coordinate
            severity: Severity level (1-5)
        """
        # Simulate processing time for FCM API call
        await asyncio.sleep(0.5)
        
        # Log the notification
        logger.info(
            "Firebase push notification sent (simulated)",
            incident_id=incident_id,
            coordinates=f"{lat},{lon}",
            severity=severity,
            notification_title="Fire Alert in Your Area",
            notification_body=f"A level {severity} fire has been detected near you."
        )
    
    async def _update_analytics(
        self, incident_id: int, created_at: str, lat: float, lon: float, severity: int
    ) -> None:
        """
        Simulate updating analytics metrics.
        
        In a production environment, this would update a database or
        send events to an analytics service.
        
        Args:
            incident_id: The incident ID
            created_at: Timestamp of incident creation
            lat: Latitude coordinate
            lon: Longitude coordinate
            severity: Severity level (1-5)
        """
        # Simulate processing time
        await asyncio.sleep(0.2)
        
        # Create metrics data
        metrics = {
            "incident_id": incident_id,
            "timestamp": created_at,
            "location": {"lat": lat, "lon": lon},
            "severity": severity,
            "response_time_seconds": 0,  # Would be calculated in production
        }
        
        logger.info(
            "Analytics metrics updated (simulated)",
            **metrics
        )
