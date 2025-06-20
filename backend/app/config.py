from typing import Optional

from pydantic import Field, HttpUrl
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""
    
    # Security
    secret_key: str = Field("dev-secret-key-change-in-production", env="SECRET_KEY")
    
    # API configuration
    api_v1_prefix: str = "/api/v1"
    
    
    # Database
    db_url: str = "postgresql+asyncpg://user:pass@localhost:5432/greensentinel"
    
    # Vision service settings
    vision_url: HttpUrl = Field(
        "http://vision:9001/predict", env="VISION_URL"
    )
    
    # OpenAI settings
    openai_api_key: str = Field("", env="OPENAI_API_KEY")
    openai_api_base: HttpUrl = Field(
        "https://api.openai.com/v1", env="OPENAI_API_BASE"
    )
    openai_model: str = Field("gpt-4o-mini", env="OPENAI_MODEL")
    
    # MinIO Storage
    minio_endpoint: str = "http://minio:9000"
    minio_access_key: str = "minio"
    minio_secret_key: str = "minio123"
    minio_bucket: str = "citizen-reports"
    
    # RabbitMQ settings
    rabbitmq_url: str = Field("amqp://rabbit:rabbit@rabbitmq:5672/", env="RABBITMQ_URL")
    
    class Config:
        env_file = ".env"


settings = Settings()
