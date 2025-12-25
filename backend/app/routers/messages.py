import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from app.crud import conversation as convo_crud
from app.crud import message as msg_crud
from app.db.session import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.message import MessageCreate, MessagePairOut
from app.services.chat_service import generate_assistant_reply, stream_assistant_reply

router = APIRouter(prefix="/conversations", tags=["messages"])

MAX_INPUT_LENGTH = int(os.getenv("MAX_INPUT_LENGTH", "2000"))
MAX_HISTORY_MESSAGES = int(os.getenv("MAX_HISTORY_MESSAGES", "10"))


def _build_history_context(messages):
    """Trim and map history into the shape expected by the model layer."""
    return [
        {"role": m.role, "content": m.content}
        for m in messages[-MAX_HISTORY_MESSAGES:]
    ]


@router.post(
    "/{conversation_id}/messages",
    response_model=MessagePairOut,
)
def add_user_message_and_reply(
    conversation_id: int,
    session_id: str,
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if len(data.content) > MAX_INPUT_LENGTH:
        raise HTTPException(status_code=400, detail="Message too long")

    convo = convo_crud.get_conversation(
        db,
        convo_id=conversation_id,
        user_id=current_user.id,
        session_id=session_id,
    )
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if not convo.title:
        convo.title = data.content[:60]
        db.add(convo)
        db.commit()
        db.refresh(convo)

    history = msg_crud.get_messages(db, conversation_id)
    history_context = _build_history_context(history)

    user_msg = msg_crud.create_message(
        db,
        conversation_id=conversation_id,
        role="user",
        content=data.content,
    )

    assistant_text = generate_assistant_reply(data.content, history_context)

    assistant_msg = msg_crud.create_message(
        db,
        conversation_id=conversation_id,
        role="assistant",
        content=assistant_text,
    )

    return {
        "user_message": user_msg,
        "assistant_message": assistant_msg,
    }


@router.post(
    "/{conversation_id}/messages/stream",
)
async def stream_user_message_and_reply(
    conversation_id: int,
    session_id: str,
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if len(data.content) > MAX_INPUT_LENGTH:
        raise HTTPException(status_code=400, detail="Message too long")
    convo = convo_crud.get_conversation(
        db,
        convo_id=conversation_id,
        user_id=current_user.id,
        session_id=session_id,
    )
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if not convo.title:
        convo.title = data.content[:60]
        db.add(convo)
        db.commit()
        db.refresh(convo)

    history = msg_crud.get_messages(db, conversation_id)
    history_context = _build_history_context(history)

    user_msg = msg_crud.create_message(
        db,
        conversation_id=conversation_id,
        role="user",
        content=data.content,
    )
    history_context.append({"role": "user", "content": data.content})
    async def event_generator():
        chunks = []
        async for chunk in stream_assistant_reply(data.content, history_context):
            chunks.append(chunk)
            yield {"event": "message", "data": chunk}

        assistant_text = "".join(chunks).strip()

        # If streaming produced nothing, fall back to a single reply so the frontend sees something.
        if not assistant_text:
            assistant_text = generate_assistant_reply(data.content, history_context)
            yield {"event": "message", "data": assistant_text}

        msg_crud.create_message(
            db,
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_text or "[empty response]",
        )
        yield {"event": "done", "data": "complete"}

    return EventSourceResponse(event_generator())


@router.get(
    "/{conversation_id}/messages",
    response_model=List[MessagePairOut],
)
def list_messages(
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

    return msg_crud.get_messages(db, conversation_id)
