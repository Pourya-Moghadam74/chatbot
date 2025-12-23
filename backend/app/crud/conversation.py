from sqlalchemy.orm import Session
from app.models.conversation import Conversation

def create_conversation(db: Session, data: dict) -> Conversation:
    conversation = Conversation(**data)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation

def list_by_user(db: Session, user_id: int):
    return db.query(Conversation).filter(
        Conversation.user_id == user_id
    ).all()
