import os
from typing import Dict, Any, List, Optional, Tuple

import numpy as np
from ultralytics import YOLO


class FireDetectionModel:
    """
    YOLOv8 model for fire detection.
    Loads and manages the model for inference.
    """
    
    def __init__(self):
        """Initialize the fire detection model."""
        self.model = None
        self.variant = os.environ.get("MODEL_VARIANT", "fire")
        self.threshold = float(os.environ.get("DETECTION_THRESHOLD", "0.4"))
        
    async def load(self) -> None:
        """Load the YOLOv8 model asynchronously."""
        # In a production environment, you would download or have the model pre-installed
        # For this demo, we're using a pretrained YOLOv8n model
        try:
            print(f"Loading YOLOv8 model variant: {self.variant}")
            self.model = YOLO("yolov8n.pt")  # Use YOLOv8 nano for demonstration
            print("Model loaded successfully")
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            raise
    
    async def predict(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Run inference on the input image.
        
        Args:
            image: A numpy array representing the image
            
        Returns:
            Dictionary with detection results
        """
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load() first.")
        
        # Run inference
        results = self.model(image, conf=self.threshold)
        
        # Process results
        return self._process_results(results)
    
    def _process_results(self, results) -> Dict[str, Any]:
        """
        Process YOLOv8 results into a standardized output format.
        
        Args:
            results: YOLOv8 results object
            
        Returns:
            Dictionary with detection results:
            {
                "is_fire": bool,
                "confidence": float,
                "boxes": List[Dict[str, Any]]
            }
        """
        boxes = []
        max_confidence = 0.0
        
        if len(results) > 0:
            # Get first result (assumes batch size 1)
            result = results[0]
            
            # Check fire detection (class 0: fire)
            # For this demo we're using pretrained YOLO and treating class 0 as fire
            # In a real implementation, use a fire-specific model or filter classes
            for box in result.boxes:
                cls_id = int(box.cls.item())
                conf = float(box.conf.item())
                
                # Only interested in fire detections (class 0 in our demo)
                if cls_id == 0 and conf > max_confidence:
                    max_confidence = conf
                
                # Convert box to dictionary
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                boxes.append({
                    "class": cls_id,
                    "confidence": conf,
                    "x1": int(x1),
                    "y1": int(y1),
                    "x2": int(x2),
                    "y2": int(y2)
                })
        
        # Determine if fire is detected based on confidence threshold
        is_fire = max_confidence >= self.threshold
        
        return {
            "is_fire": is_fire,
            "confidence": max_confidence,
            "boxes": boxes
        }


# Create a singleton instance
model = FireDetectionModel()
