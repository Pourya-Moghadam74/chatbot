from pydantic import BaseModel
from datetime import datetime

class ConversationCreate(BaseModel):
    user_id: int | None = None
    title: str | None = None

class ConversationOut(BaseModel):
    id: int
    user_id: int
    session_id: str
    title: str | None
    created_at: datetime

    class Config:
        from_attributes = True
