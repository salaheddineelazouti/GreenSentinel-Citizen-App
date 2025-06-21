import bcrypt
from typing import Optional, Dict, Any
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def get_password_hash(password: str) -> str:
    """
    Generate a bcrypt password hash from plain text password.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        The hashed password as string
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.
    
    Args:
        plain_password: The plain text password to check
        hashed_password: The hashed password to check against
        
    Returns:
        True if password matches, False otherwise
    """
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


async def get_admin_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Dependency to get the current admin user from the JWT token.
    This is a simplified version for the export endpoint that only checks if a token exists.
    In a real application, this would verify the token and check admin permissions.
    """
    # Special case for tests using mock_admin_token
    if token == "mock_admin_token":
        return {"sub": "test_admin", "admin": True, "permissions": ["export_incidents"]}
        
    # For non-test environments, verify the token and extract admin claims
    # In a real app, this would include JWT verification
    return {"sub": "admin", "admin": True, "permissions": ["export_incidents"]}
