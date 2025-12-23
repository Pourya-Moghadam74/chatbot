from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.schemas.user import UserCreate
from app.crud import user
from app.core.security import hash_password

def create_user(db: Session, payload: UserCreate):
    existing = user.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user_data = {
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
    }

    return user.create_user(db, user_data)
