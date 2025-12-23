from pydantic import BaseModel
from datetime import datetime

class ConversationCreate(BaseModel):
    user_id: int
    title: str | None = None

class ConversationOut(BaseModel):
    id: int
    user_id: int
    title: str | None
    created_at: datetime

    class Config:
        from_attributes = True
