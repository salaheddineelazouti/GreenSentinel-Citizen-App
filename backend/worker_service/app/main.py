"""
Main entry point for the GreenSentinel Worker Service.
"""
import asyncio
import signal
import sys
from typing import Dict, Set

from structlog import get_logger

from app.config import settings
from app.consumers import IncidentConsumer
from app.log_config import configure_logging


# Configure structured logging
configure_logging()
logger = get_logger("main")


class WorkerService:
    """
    Main worker service class that coordinates all consumers.
    Handles graceful startup and shutdown.
    """

    def __init__(self) -> None:
        """Initialize the worker service."""
        self.incident_consumer = IncidentConsumer(settings.rabbitmq_url)
        self.shutdown_event = asyncio.Event()
        
    async def start(self) -> None:
        """Start all consumers and wait for shutdown signal."""
        try:
            # Start the incident consumer
            logger.info("Starting GreenSentinel Worker Service", worker_name=settings.worker_name)
            
            consumer_task = asyncio.create_task(self.incident_consumer.start_consuming())
            
            # Wait for shutdown signal
            await self.shutdown_event.wait()
            
            # Stop the incident consumer
            logger.info("Shutting down consumers")
            await self.incident_consumer.stop_consuming()
            
            # Wait for consumer task to complete
            await consumer_task
            
            logger.info("Worker service shutdown complete")
            
        except Exception as e:
            logger.error("Error in worker service", error=str(e))
            sys.exit(1)
    
    def signal_shutdown(self) -> None:
        """Signal the worker to shut down gracefully."""
        logger.info("Shutdown signal received")
        self.shutdown_event.set()


async def main() -> None:
    """Main entry point for the worker service."""
    worker = WorkerService()
    
    # Set up signal handlers
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, worker.signal_shutdown)
    
    logger.info(
        "Worker service initializing", 
        rabbitmq_url=settings.rabbitmq_url.replace(
            # Mask credentials in logs
            settings.rabbitmq_url.split("@")[0], 
            "amqp://***:***"
        ) if "@" in settings.rabbitmq_url else settings.rabbitmq_url
    )
    
    await worker.start()


if __name__ == "__main__":
    asyncio.run(main())
