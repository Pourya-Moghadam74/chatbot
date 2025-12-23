from sqlalchemy.orm import declarative_base

Base = declarative_base()


from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.refresh_token import RefreshToken
