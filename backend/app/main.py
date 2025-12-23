import os
from fastapi import FastAPI
from dotenv import load_dotenv
from app.models import *   # THIS LINE IS REQUIRED
from app.routers import conversations, users

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


app = FastAPI(
    swagger_ui_parameters={
        "url": "/api/openapi.json"
    }
)

app.include_router(conversations.router)
app.include_router(users.router)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_key_loaded": GEMINI_API_KEY is not None
    }
