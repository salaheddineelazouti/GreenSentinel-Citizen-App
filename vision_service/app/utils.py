import io
from typing import Any, Optional

import aiohttp
import cv2
import numpy as np
from PIL import Image


async def download_image(url: str) -> Optional[bytes]:
    """
    Download an image from a URL asynchronously.
    
    Args:
        url: URL of the image to download
        
    Returns:
        Image content as bytes or None if download fails
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.read()
                else:
                    print(f"Error downloading image: {response.status}")
                    return None
    except Exception as e:
        print(f"Exception downloading image: {str(e)}")
        return None


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Convert image bytes to a format suitable for the model.
    
    Args:
        image_bytes: Raw image data as bytes
        
    Returns:
        Preprocessed image as numpy array
    """
    # Read image with OpenCV
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # Decode the image
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert BGR to RGB (YOLOv8 expects RGB)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        return image
    except Exception as e:
        print(f"Error preprocessing image: {str(e)}")
        raise
