"""
Tests for the RabbitMQ message publishing functionality.
"""
import json
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.events import IncidentValidated
from app.services.mq import publish_event


@pytest.mark.asyncio
async def test_incident_validated_serialization():
    """Test that IncidentValidated events serialize correctly."""
    # Create a test incident event
    now = datetime.utcnow()
    event = IncidentValidated(
        id=123,
        lat=48.8566,
        lon=2.3522,
        created_at=now,
        severity=3
    )
    
    # Serialize to JSON
    json_data = event.model_dump_json()
    
    # Parse back to dict
    parsed = json.loads(json_data)
    
    # Verify fields
    assert parsed["id"] == 123
    assert parsed["lat"] == 48.8566
    assert parsed["lon"] == 2.3522
    assert parsed["severity"] == 3
    assert parsed["created_at"] == now.isoformat()


@pytest.mark.asyncio
async def test_msgspec_serialization():
    """Test that msgspec serialization works correctly."""
    # Create a test incident event
    now = datetime.utcnow()
    event = IncidentValidated(
        id=123,
        lat=48.8566,
        lon=2.3522,
        created_at=now,
        severity=3
    )
    
    # Serialize using msgspec
    binary_data = event.model_dump_msgspec()
    
    # Verify it's bytes
    assert isinstance(binary_data, bytes)
    
    # Verify we can parse it back
    parsed = json.loads(binary_data)
    assert parsed["id"] == 123


@pytest.mark.asyncio
async def test_publish_event():
    """Test that events are published to RabbitMQ."""
    # Create a test incident event
    event = IncidentValidated(
        id=123,
        lat=48.8566,
        lon=2.3522,
        created_at=datetime.utcnow(),
        severity=3
    )
    
    # Mock the RabbitMQ connection and channel
    mock_connection = AsyncMock()
    mock_channel = AsyncMock()
    mock_queue = AsyncMock()
    mock_exchange = AsyncMock()
    
    # Configure mocks
    mock_connection.channel.return_value = mock_channel
    mock_channel.declare_queue.return_value = mock_queue
    mock_channel.default_exchange = mock_exchange
    
    # Patch the get_connection function
    with patch("app.services.mq.get_connection", return_value=mock_connection):
        # Call the function under test
        await publish_event(event)
        
        # Verify the exchange.publish was called
        mock_exchange.publish.assert_called_once()
        
        # Extract the Message object from the call
        call_args = mock_exchange.publish.call_args
        message = call_args[0][0]
        routing_key = call_args[1]["routing_key"]
        
        # Verify message content
        message_body = json.loads(message.body.decode())
        assert message_body["id"] == 123
        assert message_body["lat"] == 48.8566
        assert message_body["lon"] == 2.3522
        assert message_body["severity"] == 3
        
        # Verify routing key
        assert routing_key == "incident.validated"
