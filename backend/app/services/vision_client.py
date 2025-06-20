import json
from typing import Tuple, Dict, Any

import aiohttp
from fastapi import HTTPException

from app.config import settings


async def detect_fire(image_url: str) -> Tuple[bool, float]:
    """
    Detect fire in an image by calling the vision service.
    
    Args:
        image_url: URL of the image to analyze
        
    Returns:
        Tuple of (is_fire, confidence)
        - is_fire: Boolean indicating if fire was detected
        - confidence: Confidence level of the detection (0-1)
    """
    # Prepare request payload
    payload = {
        "image_url": image_url
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                settings.vision_url,
                json=payload,
                timeout=30  # Timeout after 30 seconds
            ) as response:
                if response.status == 200:
                    # Parse response
                    data = await response.json()
                    return data.get("is_fire", False), data.get("confidence", 0.0)
                else:
                    # Handle error response
                    error_text = await response.text()
                    print(f"Vision service error: {response.status} - {error_text}")
                    # Return default values on error (not fire, 0 confidence)
                    return False, 0.0
                    
    except aiohttp.ClientError as e:
        print(f"Connection error to vision service: {str(e)}")
        # Return default values on connection error
        return False, 0.0
    except Exception as e:
        print(f"Unexpected error calling vision service: {str(e)}")
        # Return default values on general error
        return False, 0.0
