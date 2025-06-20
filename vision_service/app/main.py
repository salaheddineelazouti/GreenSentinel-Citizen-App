import asyncio
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl

from app.model import model
from app.utils import download_image, preprocess_image


class PredictRequest(BaseModel):
    """Request model for image prediction."""
    image_url: HttpUrl


class PredictResponse(BaseModel):
    """Response model for image prediction."""
    is_fire: bool
    confidence: float
    boxes: list


app = FastAPI(
    title="GreenSentinel Vision API",
    description="Fire detection service for GreenSentinel using YOLOv8",
    version="1.0.0",
)


@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    await model.load()


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest) -> Dict[str, Any]:
    """
    Predict fire in an image from URL.
    
    Args:
        request: PredictRequest with image_url
        
    Returns:
        Dict with prediction results
    """
    # Download the image
    image_bytes = await download_image(str(request.image_url))
    
    if image_bytes is None:
        raise HTTPException(
            status_code=400,
            detail="Failed to download image from provided URL"
        )
    
    try:
        # Preprocess the image
        image = preprocess_image(image_bytes)
        
        # Run prediction
        result = await model.predict(image)
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint.
    
    Returns:
        Dict with status
    """
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9001)
