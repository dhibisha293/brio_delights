import os
import httpx
from fastapi import HTTPException, status
import logging

logger = logging.getLogger("brio")

async def get_ai_response(user_message: str, context: str) -> str:
    api_key = os.getenv("AI_API_KEY")
    model = os.getenv("AI_MODEL", "gpt-4o-mini")

    base_url = "https://api.openai.com/v1/chat/completions"
    if api_key and api_key.startswith("gsk_"):
        base_url = "https://api.groq.com/openai/v1/chat/completions"
        if "gpt" in model:
            model = "openai/gpt-oss-20b"

    if not api_key:
        logger.error("AI API key is not configured.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI API key is not configured."
        )

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": f"You are Brio AI, a helpful bakery assistant for Brio Delights Bakery. Use the following context to answer the user's questions about their bakery data. Do not invent numbers or business data. If data is missing or unknown, say so.\n\nContext:\n{context}"
            },
            {
                "role": "user",
                "content": user_message
            }
        ],
        "temperature": 0.7
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                base_url,
                json=payload,
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as e:
        logger.error(f"AI API HTTP error: {e.response.text}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Sorry, I couldn't connect to Brio AI right now. Please try again."
        )
    except Exception as e:
        logger.error(f"AI API error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sorry, I couldn't connect to Brio AI right now. Please try again."
        )
