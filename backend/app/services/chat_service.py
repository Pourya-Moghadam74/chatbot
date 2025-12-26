import os
from typing import AsyncGenerator, List

from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
MAX_INPUT_LENGTH = int(os.getenv("MAX_INPUT_LENGTH", "2000"))
MAX_HISTORY_MESSAGES = int(os.getenv("MAX_HISTORY_MESSAGES", "10"))

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


def _build_messages(prompt: str, history: List[dict]) -> list[dict]:
  messages: list[dict] = []

  for msg in history[-MAX_HISTORY_MESSAGES:]:
    messages.append({
      "role": str(msg.get("role", "")),
      "content": str(msg.get("content", "")),
    })

  messages.append({
    "role": "user",
    "content": str(prompt[:MAX_INPUT_LENGTH]),
  })

  return messages


def generate_assistant_reply(prompt: str, history: list[dict]) -> str:
  if not client:
    return "Model is not configured."

  completion = client.chat.completions.create(
      model=GROQ_MODEL,
      messages=_build_messages(prompt, history),
      temperature=0.7,
      max_tokens=400,
  )

  return completion.choices[0].message.content


async def stream_assistant_reply(prompt: str, history: list[dict]) -> AsyncGenerator[str, None]:
    if not client:
        yield "Model is not configured."
        return

    buffer = ""

    try:
        stream = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=_build_messages(prompt, history),
            temperature=0.7,
            max_tokens=400,
            stream=True,
        )

        for chunk in stream:
            delta = chunk.choices[0].delta
            text = getattr(delta, "content", None)

            if not text:
                continue

            buffer += text

            # Flush buffer when it ends cleanly
            if buffer.endswith((" ", "\n", ".", ",", "!", "?", ":", ";")):
                yield buffer
                buffer = ""

        if buffer:
            yield buffer

    except Exception as exc:
        print("Groq stream error:", exc)
        yield "I couldn't generate a reply right now."

