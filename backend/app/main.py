import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, conversations, messages, stream, users

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]


app = FastAPI(
    swagger_ui_parameters={
        "url": "/api/openapi.json"
    }
)

# CORS for frontend dev (SSE needs headers exposed)
if ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

app.include_router(conversations.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(stream.router)
app.include_router(messages.router)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_key_loaded": GEMINI_API_KEY is not None
    }
