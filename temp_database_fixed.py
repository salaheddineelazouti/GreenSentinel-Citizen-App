from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass

# Create async engine for connecting to PostgreSQL
async_engine = create_async_engine(settings.db_url, echo=True)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    async_engine, 
    expire_on_commit=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting an async db session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

# Alias for compatibility with seed_demo.py
get_async_session = get_db
