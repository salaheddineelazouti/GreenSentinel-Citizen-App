from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["System"])
async def health() -> dict[str, str]:
    """Health check endpoint to verify API is running."""
    return {"status": "ok"}
