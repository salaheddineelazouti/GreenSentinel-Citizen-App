import os
import uuid
from datetime import timedelta
from typing import BinaryIO, Optional

from fastapi import UploadFile
from minio import Minio
from minio.commonconfig import ComposeSource
from minio.deleteobjects import DeleteObject
from minio.error import S3Error

from app.config import settings


class MinIOStorage:
    """Service for handling file storage in MinIO (S3-compatible)."""

    def __init__(self):
        """Initialize MinIO client from environment variables."""
        self.client = Minio(
            endpoint=settings.minio_endpoint.replace("http://", "").replace("https://", ""),
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_endpoint.startswith("https"),
        )
        self.bucket = settings.minio_bucket

    async def _ensure_bucket_exists(self) -> None:
        """Ensure the configured bucket exists, creating it if needed."""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                print(f"Created bucket '{self.bucket}'")
        except S3Error as e:
            print(f"Error checking/creating bucket: {e}")
            raise

    async def upload_image(self, file: UploadFile) -> str:
        """
        Upload an image file to MinIO storage.
        
        Args:
            file: The uploaded file from FastAPI
            
        Returns:
            The URL to access the uploaded file
        """
        # Ensure bucket exists
        await self._ensure_bucket_exists()
        
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        object_name = f"{uuid.uuid4()}{file_ext}"
        
        try:
            # Read file content
            content = await file.read()
            
            # Upload to MinIO
            self.client.put_object(
                bucket_name=self.bucket,
                object_name=object_name,
                data=content,
                length=len(content),
                content_type=file.content_type or "image/jpeg"
            )
            
            # Generate presigned URL (valid for 7 days)
            url = self.client.presigned_get_object(
                bucket_name=self.bucket,
                object_name=object_name,
                expires=timedelta(days=7)
            )
            
            return url
        
        except Exception as e:
            print(f"Error uploading file to MinIO: {e}")
            raise
        finally:
            # Reset file cursor for potential further use
            await file.seek(0)


# Create a singleton instance
storage = MinIOStorage()
