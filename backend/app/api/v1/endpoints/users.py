from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_async_session
from app.core.models import User
from app.core.security import get_password_hash
from app.schemas.users import User as UserSchema, UserCreate, UserUpdate

router = APIRouter()


@router.get("/", response_model=List[UserSchema])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session),
):
    """
    Retrieve users.
    """
    query = select(User).offset(skip).limit(limit)
    result = await session.execute(query)
    users = result.scalars().all()
    return users


@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    session: AsyncSession = Depends(get_async_session),
):
    """
    Create new user.
    """
    # Check if user with this email already exists
    query = select(User).filter(User.email == user_in.email)
    result = await session.execute(query)
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create new user
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=hashed_password,
        is_active=user_in.is_active,
        role=user_in.role,
    )
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user


@router.get("/{user_id}", response_model=UserSchema)
async def read_user(
    user_id: int,
    session: AsyncSession = Depends(get_async_session),
):
    """
    Get a specific user by id.
    """
    query = select(User).filter(User.id == user_id)
    result = await session.execute(query)
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    session: AsyncSession = Depends(get_async_session),
):
    """
    Update a user.
    """
    query = select(User).filter(User.id == user_id)
    result = await session.execute(query)
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Update user fields
    user_data = user_in.model_dump(exclude_unset=True)
    if "password" in user_data:
        hashed_password = get_password_hash(user_data["password"])
        user_data["hashed_password"] = hashed_password
        del user_data["password"]
    
    for field, value in user_data.items():
        setattr(user, field, value)

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_async_session),
):
    """
    Delete a user.
    """
    query = select(User).filter(User.id == user_id)
    result = await session.execute(query)
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    await session.delete(user)
    await session.commit()
    return None
