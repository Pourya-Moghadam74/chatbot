import os
from fastapi import FastAPI
from dotenv import load_dotenv
from app.database import engine, Base
from app.models import *   # THIS LINE IS REQUIRED


load_dotenv()

app = FastAPI()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

from fastapi import FastAPI
from app.database import engine, Base
from app.models import *

app = FastAPI()

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_key_loaded": GEMINI_API_KEY is not None
    }
