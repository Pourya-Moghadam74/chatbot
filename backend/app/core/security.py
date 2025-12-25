import hashlib
import os
import secrets
from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext


# Configurable secrets/timing via environment
SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_urlsafe(48)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    # Normalize password length before bcrypt to avoid password length truncation
    password_bytes = password.encode("utf-8")
    sha256 = hashlib.sha256(password_bytes).hexdigest()
    return pwd_context.hash(sha256)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    sha256 = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    return pwd_context.verify(sha256, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token() -> str:
    return secrets.token_urlsafe(48)
