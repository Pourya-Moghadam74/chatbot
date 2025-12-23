from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import AsyncSessionLocal
from app.schemas.conversation import (
    ConversationCreate,
    ConversationOut,
)
from app.services import conversation_service

router = APIRouter(prefix="/conversations")

def get_db():
    db = AsyncSessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("",response_model=ConversationOut,)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
):
    return conversation_service.create_conversation(db, payload)

@router.get("", response_model=list[ConversationOut],)
def list_conversations(
    user_id: int,
    db: Session = Depends(get_db),
):
    return conversation_service.list_conversations(db, user_id)
