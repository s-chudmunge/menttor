
import httpx
import os
import json

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("GEMINI_API_KEY environment variable not set.")
    exit(1)

# Assuming your FastAPI app is running on http://localhost:8000
# For testing purposes, we can use TestClient directly if running within a test suite,
# but since you asked to make a direct API call, I'll use httpx.
# If your backend is not running, this will fail.

# NOTE: If your backend isn't running, you'll need to start it first.
# e.g., in the backend directory: uvicorn app.main:app --reload

BASE_URL = "http://localhost:8000" # You might need to adjust this if your backend runs on a different port or host

async def generate_roadmap_test():
    headers = {
        "Content-Type": "application/json",
        # Assuming your API key is used for authentication by your FastAPI backend,
        # or it's passed directly to the Gemini client from environment variables on the backend.
        # If your backend uses the API key in the Authorization header, you'd add:
        # "Authorization": f"Bearer {api_key}"
    }

    request_data = {
        "subject": "Generative AI",
        "goal": "Build a simple image generation model",
        "time_value": 4,
        "time_unit": "weeks",
        "model": "models/gemini-2.5-flash" # Explicitly use a known good model
    }

    print(f"Attempting to generate roadmap with data: {request_data}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{BASE_URL}/roadmaps/generate", json=request_data, headers=headers, timeout=60)
            response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)

        roadmap = response.json()
        print("\nSuccessfully generated roadmap:")
        print(json.dumps(roadmap, indent=2))
        print("\nRoadmap generation test PASSED.")
    except httpx.HTTPStatusError as e:
        print(f"Roadmap generation test FAILED: HTTP error occurred: {e}")
        print(f"Response body: {e.response.text}")
    except httpx.RequestError as e:
        print(f"Roadmap generation test FAILED: Request error occurred: {e}")
    except Exception as e:
        print(f"Roadmap generation test FAILED: An unexpected error occurred: {e}")

if __name__ == "__main__":
    import asyncio
    import time
    time.sleep(15)
    asyncio.run(generate_roadmap_test())
