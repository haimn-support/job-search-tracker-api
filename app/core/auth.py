"""
Authentication utilities for JWT token handling and password management.
"""
from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from .config import settings


# Password hashing context
# Use pbkdf2_sha256 instead of bcrypt to avoid initialization issues
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"], 
    deprecated="auto",
    pbkdf2_sha256__default_rounds=29000,
    pbkdf2_sha256__min_rounds=10000,
    pbkdf2_sha256__max_rounds=100000
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hash.
    Supports both bcrypt (legacy) and pbkdf2_sha256 (new) hashes.
    
    Args:
        plain_password: The plain text password
        hashed_password: The hashed password to verify against
        
    Returns:
        True if password matches, False otherwise
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Try pbkdf2_sha256 first (new format)
    try:
        if pwd_context.verify(plain_password, hashed_password):
            return True
    except Exception as e:
        logger.debug(f"pbkdf2_sha256 verification failed: {e}")
    
    # Try bcrypt (legacy format) if pbkdf2_sha256 fails
    try:
        from passlib.context import CryptContext
        bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Truncate password for bcrypt if needed
        if len(plain_password.encode('utf-8')) > 72:
            plain_password = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
        
        if bcrypt_context.verify(plain_password, hashed_password):
            logger.info("Successfully verified legacy bcrypt hash, consider rehashing")
            return True
    except Exception as e:
        logger.debug(f"bcrypt verification failed: {e}")
    
    return False


def get_password_hash(password: str) -> str:
    """
    Hash a plain password using pbkdf2_sha256.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        The hashed password
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Log password length for debugging
    password_bytes = password.encode('utf-8')
    password_length = len(password_bytes)
    logger.info(f"Password length: {password_length} bytes, original length: {len(password)} chars")
    
    # pbkdf2_sha256 doesn't have the 72-byte limitation of bcrypt
    # but we'll still log for debugging purposes
    if password_length > 1000:  # Reasonable upper limit
        logger.warning(f"Password is very long ({password_length} bytes), consider shorter passwords")
    
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: The data to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        The encoded JWT token
        
    Raises:
        ValueError: If SECRET_KEY is not configured
    """
    if not settings.SECRET_KEY:
        raise ValueError("SECRET_KEY must be configured for JWT token generation")
    
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: The JWT token to verify
        
    Returns:
        The decoded token payload if valid, None otherwise
    """
    if not settings.SECRET_KEY:
        return None
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user ID from a JWT token.
    
    Args:
        token: The JWT token
        
    Returns:
        The user ID if token is valid, None otherwise
    """
    payload = verify_token(token)
    if payload:
        return payload.get("sub")
    return None