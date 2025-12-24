from sqlalchemy.orm import Session
from app.models.refresh_token import RefreshToken


def get_active_refresh_token(db: Session, token: str):
    return (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token == token,
            RefreshToken.revoked == False
        )
        .first()
    )


def revoke_refresh_token(db: Session, token: str):
    rt = db.query(RefreshToken).filter(RefreshToken.token == token).first()
    if rt:
        rt.revoked = True
        db.commit()
        return {"details": "Logged out"}
    if not rt:
        return {"error": "Invalid Credintials"}


def create_refresh_token(db: Session, user_id: int, token: str):
    rt = RefreshToken(
        user_id=user_id,
        token=token,
        revoked=False,
    )
    db.add(rt)
    db.commit()
    db.refresh(rt)
    return rt
