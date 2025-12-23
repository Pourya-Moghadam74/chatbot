from uuid import uuid4
from sqlalchemy.orm import Session
from app.schemas.conversation import ConversationCreate
from app.crud import conversation

def create_conversation(
    db: Session,
    payload: ConversationCreate,
):
    # business logic
    session_id = uuid4().hex

    data = payload.model_dump()
    data["session_id"] = session_id

    return conversation.create_conversation(db, data)

def list_conversations(
    db: Session,
    user_id: int,
):
    return conversation.list_by_user(db, user_id)
