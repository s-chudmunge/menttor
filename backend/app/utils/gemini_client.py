import google.generativeai as genai
from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

async def generate_text(prompt: str, model: str = "gemini-1.5-flash") -> str:
    """
    Generates text using the Gemini API.
    """
    try:
        model = genai.GenerativeModel(model)
        response = await model.generate_content_async(prompt)
        return response.text
    except Exception as e:
        # Handle API errors gracefully
        print(f"Error generating text with Gemini: {e}")
        # Fallback to a simpler response or raise a specific exception
        return "Error: Could not generate content."
