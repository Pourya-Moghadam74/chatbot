import asyncio
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

router = APIRouter(prefix="/stream", tags=["stream"])


async def fake_text_generator():
    text = "This is a fake streaming response from the server."
    for word in text.split():
        yield {
            "event": "message",
            "data": word + " "
        }
        await asyncio.sleep(0.4)  # simulate generation delay


@router.get("/test")
async def stream_test():
    return EventSourceResponse(fake_text_generator())
