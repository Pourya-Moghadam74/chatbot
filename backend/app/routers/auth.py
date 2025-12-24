from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest
from app.crud.user import get_user_by_email, create_user
from app.core.security import verify_password, create_access_token
from app.core.security import create_refresh_token as generate_refresh_token
from app.crud.refresh_token import create_refresh_token, get_active_refresh_token, revoke_refresh_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = create_user(db, data.email, data.password)
    return {"id": user.id, "email": user.email}


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, data.email)

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(user.id)})

    refresh_token = generate_refresh_token()
    create_refresh_token(db, user.id, refresh_token)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }



@router.post("/refresh")
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    old_rt = get_active_refresh_token(db, data.refresh_token)

    if not old_rt:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    old_rt.revoked = True

    new_refresh_token = generate_refresh_token()
    create_refresh_token(db, old_rt.user_id, new_refresh_token)

    access_token = create_access_token(
        {"sub": str(old_rt.user_id)}
    )

    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }



@router.post("/logout")
def logout(data: RefreshRequest, db: Session = Depends(get_db)):
    res = revoke_refresh_token(db, data.refresh_token)
    return res

