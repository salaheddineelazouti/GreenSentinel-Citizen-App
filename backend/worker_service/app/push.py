"""
Firebase Cloud Messaging (FCM) integration for push notifications.
"""
import asyncio
import os
from pathlib import Path
from typing import Dict, Any, Optional

import firebase_admin
from firebase_admin import messaging, credentials
from structlog import get_logger

logger = get_logger("fcm_push")

# Configuration from environment variables
cred_path = os.getenv("FCM_CREDENTIALS_JSON")
_topic = os.getenv("FCM_TOPIC", "firefighters")

# Initialize Firebase Admin SDK if credentials are available
if cred_path and Path(cred_path).exists():
    try:
        firebase_admin.initialize_app(credentials.Certificate(cred_path))
        logger.info("FCM initialized successfully", topic=_topic)
    except Exception as e:
        logger.error("FCM initialization failed", error=str(e))
else:
    logger.warning("FCM disabled: credentials file missing", path=cred_path)


async def send_push(title: str, body: str, data: Dict[str, Any]) -> Optional[str]:
    """
    Send push notification to firefighters topic via Firebase Cloud Messaging.
    
    Args:
        title: Title of the notification
        body: Body text of the notification
        data: Additional data to send with the notification
    
    Returns:
        Message ID if sent successfully, None otherwise
    """
    # Skip if Firebase Admin SDK is not initialized
    if not firebase_admin._apps:
        logger.warning("Skipping push notification - FCM not initialized")
        return None
    
    # Create message object
    msg = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        data={k: str(v) for k, v in data.items()},  # FCM requires string values
        topic=_topic,
    )
    
    try:
        # Run blocking FCM send in executor to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        message_id = await loop.run_in_executor(None, messaging.send, msg)
        
        logger.info(
            "Push notification sent successfully",
            topic=_topic,
            title=title,
            message_id=message_id
        )
        return message_id
    except Exception as e:
        logger.error("Failed to send push notification", error=str(e))
        return None
