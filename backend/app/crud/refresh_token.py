from sqlalchemy.orm import Session
from app.models.refresh_token import RefreshToken


def create_refresh_token(db: Session, user_id: int, token: str):
    rt = RefreshToken(user_id=user_id, token=token)
    db.add(rt)
    db.commit()
    db.refresh(rt)
    return rt


def get_refresh_token(db: Session, token: str):
    return db.query(RefreshToken).filter(
        RefreshToken.token == token,
        RefreshToken.revoked == False
    ).first()


def revoke_refresh_token(db: Session, token: str):
    rt = db.query(RefreshToken).filter(RefreshToken.token == token).first()
    if rt:
        rt.revoked = True
        db.commit()
