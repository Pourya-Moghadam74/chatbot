import os
from fastapi import FastAPI
from dotenv import load_dotenv
from app.core.database import engine, Base
from app.models import *   # THIS LINE IS REQUIRED

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


app = FastAPI(
    swagger_ui_parameters={
        "url": "/api/openapi.json"
    }
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_key_loaded": GEMINI_API_KEY is not None
    }
