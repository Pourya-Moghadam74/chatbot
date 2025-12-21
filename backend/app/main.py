import os
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_key_loaded": GEMINI_API_KEY is not None
    }
