import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def generate_text(prompt: str, model: str = "models/gemini-2.5-flash"):
    try:
        gen_model = genai.GenerativeModel(model)
        response = gen_model.generate_content(
            prompt,
            generation_config={
                "temperature": 0,
                "top_p": 1,
                "top_k": 1,
            },
        )

        if not response or not response.text:
            raise RuntimeError("Empty response from Gemini")

        return response.text

    except Exception as e:
        # HARD FAIL — never return fake text
        raise RuntimeError(f"Gemini generation failed: {str(e)}")

