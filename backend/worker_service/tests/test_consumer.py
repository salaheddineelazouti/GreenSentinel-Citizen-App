"""
Tests for the RabbitMQ message consumers in the worker service.
"""
import asyncio
import json
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import aio_pika
from aio_pika.abc import AbstractIncomingMessage

from app.consumers import IncidentConsumer


@pytest.fixture
def mock_message():
    """Create a mock RabbitMQ message fixture."""
    message_body = {
        "id": 123,
        "lat": 48.8566,
        "lon": 2.3522,
        "created_at": datetime.utcnow().isoformat(),
        "severity": 3
    }
    
    # Create a mock message
    mock = MagicMock(spec=AbstractIncomingMessage)
    mock.body = json.dumps(message_body).encode()
    mock.headers = {"x-retry-count": 0}
    
    # Mock the process context manager
    process_context = AsyncMock()
    process_context.__aenter__ = AsyncMock()
    process_context.__aexit__ = AsyncMock()
    mock.process.return_value = process_context
    
    return mock


@pytest.mark.asyncio
async def test_incident_consumer_setup():
    """Test that the incident consumer sets up RabbitMQ connections correctly."""
    # Create a mock consumer
    consumer = IncidentConsumer("amqp://localhost")
    
    # Mock RabbitMQ client dependencies
    mock_connection = AsyncMock()
    mock_channel = AsyncMock()
    mock_queue = AsyncMock()
    mock_exchange = AsyncMock()
    mock_retry_queue = AsyncMock()
    mock_dlq = AsyncMock()
    
    # Configure mocks
    mock_connection.channel.return_value = mock_channel
    mock_channel.declare_queue.side_effect = [mock_queue, mock_dlq, mock_retry_queue]
    mock_channel.declare_exchange.return_value = mock_exchange
    
    # Patch the aio_pika.connect_robust function
    with patch("aio_pika.connect_robust", return_value=mock_connection):
        # Call the setup method
        await consumer.setup()
        
        # Verify that connections were created
        assert consumer.connection == mock_connection
        assert consumer.channel == mock_channel
        assert consumer.queue == mock_queue
        
        # Verify queue declarations
        mock_channel.declare_queue.assert_any_call(
            "incident.validated",
            durable=True
        )
        
        # Verify exchange declarations
        mock_channel.declare_exchange.assert_called_once()


@pytest.mark.asyncio
async def test_process_message_success(mock_message):
    """Test that messages are processed successfully."""
    # Create a mock consumer
    consumer = IncidentConsumer("amqp://localhost")
    
    # Mock the _handle_incident_validated method
    consumer._handle_incident_validated = AsyncMock()
    
    # Call the process_message method
    await consumer.process_message(mock_message)
    
    # Verify that _handle_incident_validated was called
    consumer._handle_incident_validated.assert_called_once()
    
    # Verify that the message was acknowledged (by calling process)
    mock_message.process.assert_called_once()


@pytest.mark.asyncio
async def test_process_message_retry(mock_message):
    """Test that failed messages are sent to the retry queue."""
    # Create a mock consumer
    consumer = IncidentConsumer("amqp://localhost")
    consumer.retry_exchange = AsyncMock()
    
    # Make _handle_incident_validated raise an exception
    consumer._handle_incident_validated = AsyncMock(side_effect=Exception("Test error"))
    
    # Mock the _send_to_retry method
    consumer._send_to_retry = AsyncMock()
    
    # Call the process_message method
    await consumer.process_message(mock_message)
    
    # Verify that _send_to_retry was called
    consumer._send_to_retry.assert_called_once_with(mock_message.body, 1)


@pytest.mark.asyncio
async def test_process_message_dlq_after_max_retries():
    """Test that messages are sent to DLQ after max retries."""
    # Create a mock consumer
    consumer = IncidentConsumer("amqp://localhost")
    consumer.dlq = AsyncMock()
    
    # Create a message with retry count at max
    message_body = {
        "id": 123,
        "lat": 48.8566,
        "lon": 2.3522,
        "created_at": datetime.utcnow().isoformat(),
        "severity": 3
    }
    
    mock_message = MagicMock(spec=AbstractIncomingMessage)
    mock_message.body = json.dumps(message_body).encode()
    mock_message.headers = {"x-retry-count": 3}  # Max retries
    
    # Mock the process context manager
    process_context = AsyncMock()
    process_context.__aenter__ = AsyncMock()
    process_context.__aexit__ = AsyncMock()
    mock_message.process.return_value = process_context
    
    # Make _handle_incident_validated raise an exception
    consumer._handle_incident_validated = AsyncMock(side_effect=Exception("Test error"))
    
    # Mock the _send_to_dlq method
    consumer._send_to_dlq = AsyncMock()
    
    # Patch the settings max_retries
    with patch("app.config.settings.max_retries", 3):
        # Call the process_message method
        await consumer.process_message(mock_message)
        
        # Verify that _send_to_dlq was called
        consumer._send_to_dlq.assert_called_once_with(mock_message.body)


@pytest.mark.asyncio
async def test_simulate_push_notification():
    """Test that push notifications are simulated correctly."""
    # Create a mock consumer
    consumer = IncidentConsumer("amqp://localhost")
    
    # Mock asyncio.sleep to avoid waiting
    with patch("asyncio.sleep", AsyncMock()) as mock_sleep:
        # Call the simulate push notification method
        await consumer._simulate_push_notification(123, 48.8566, 2.3522, 3)
        
        # Verify that sleep was called
        mock_sleep.assert_called_once_with(0.5)
