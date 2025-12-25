from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.conversation import ConversationCreate, ConversationOut
from app.db.session import get_db
from app.deps import get_current_user
from app.models.user import User
from app.crud import conversation as convo_crud
from app.crud import message as msg_crud
from fastapi import HTTPException



router = APIRouter(prefix="/conversations")

@router.post("", response_model=ConversationOut)
def create_conversation(
    data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return convo_crud.create_conversation(
        db,
        user_id=current_user.id,
        session_id=data.session_id,
        title=data.title,
    )



@router.get("", response_model=list[ConversationOut])
def list_conversations(
    session_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return convo_crud.get_user_conversations(
        db,
        user_id=current_user.id,
        session_id=session_id,
    )


@router.get("/{conversation_id}")
def get_conversation(
    conversation_id: int,
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    convo = convo_crud.get_conversation(
        db,
        convo_id=conversation_id,
        user_id=current_user.id,
        session_id=session_id,
    )

    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = msg_crud.get_messages(db, conversation_id)

    return {
        "id": convo.id,
        "session_id": convo.session_id,
        "title": convo.title,
        "created_at": convo.created_at,
        "messages": messages,
    }


@router.delete("/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: int,
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    convo = convo_crud.get_conversation(
        db,
        convo_id=conversation_id,
        user_id=current_user.id,
        session_id=session_id,
    )
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg_crud.delete_messages_for_conversation(db, conversation_id)
    deleted = convo_crud.delete_conversation(db, conversation_id, current_user.id, session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return
