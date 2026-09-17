import asyncio
from dotenv import load_dotenv
import os

load_dotenv()

from services.ai_service import get_ai_response

async def test():
    try:
        response = await get_ai_response("What is the most popular pastry?", "Context: We sell Croissants and Muffins. Croissants are our best seller.")
        print("AI Response:", response)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test())
