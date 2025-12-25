from sqlalchemy.orm import Session
from app.models.conversation import Conversation


def create_conversation(
    db: Session,
    user_id: int,
    session_id: str,
    title: str | None,
):
    convo = Conversation(
        user_id=user_id,
        session_id=session_id,
        title=title,
    )
    db.add(convo)
    db.commit()
    db.refresh(convo)
    return convo


def get_user_conversations(
    db: Session,
    user_id: int,
    session_id: str | None = None,
):
    q = db.query(Conversation).filter(Conversation.user_id == user_id)

    if session_id:
        q = q.filter(Conversation.session_id == session_id)

    return q.order_by(Conversation.created_at.desc()).all()


def get_conversation(
    db: Session,
    convo_id: int,
    user_id: int,
    session_id: str,
):
    return (
        db.query(Conversation)
        .filter(
            Conversation.id == convo_id,
            Conversation.user_id == user_id,
            Conversation.session_id == session_id,
        )
        .first()
    )


def delete_conversation(db: Session, convo_id: int, user_id: int, session_id: str):
    convo = get_conversation(db, convo_id, user_id, session_id)
    if not convo:
        return False
    db.delete(convo)
    db.commit()
    return True
