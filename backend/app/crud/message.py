# app/crud/message.py
from sqlalchemy.orm import Session
from app.models.message import Message

def create_message(db: Session, conversation_id: int, role: str, content: str):
    msg = Message(
        conversation_id=conversation_id,
        role=role,
        content=content
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

def get_messages(db: Session, conversation_id: int):
    return (
        db.query(Message)
        .filter_by(conversation_id=conversation_id)
        .order_by(Message.created_at)
        .all()
    )
