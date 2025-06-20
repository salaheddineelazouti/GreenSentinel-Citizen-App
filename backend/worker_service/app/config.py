"""
Worker service configuration.
"""
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Worker service configuration settings."""
    
    # RabbitMQ
    rabbitmq_url: str = Field(
        "amqp://rabbit:rabbit@rabbitmq:5672/",
        env="RABBITMQ_URL",
        description="RabbitMQ connection URL"
    )
    
    # Database
    database_url: str = Field(
        "postgresql+asyncpg://gs_user:gs_pass@db:5432/greensentinel",
        env="DATABASE_URL",
        description="PostgreSQL connection URL"
    )
    
    # Worker settings
    worker_name: str = Field(
        "greensentinel-worker",
        env="WORKER_NAME",
        description="Worker name for identification in logs"
    )
    
    # Retry settings
    max_retries: int = Field(
        3, 
        env="MAX_RETRIES",
        description="Maximum number of retry attempts for failed message processing"
    )
    retry_delay: int = Field(
        5000, 
        env="RETRY_DELAY_MS",
        description="Delay between retry attempts in milliseconds"
    )
    
    class Config:
        """Pydantic model configuration."""
        env_file = ".env"


settings = Settings()
