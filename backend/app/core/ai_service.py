import requests
import os
import json
from app.schemas import RoadmapCreateRequest, RoadmapAIResponse, RoadmapPlan
from app.core.config import settings

async def generate_roadmap_from_gemini(request: RoadmapCreateRequest) -> RoadmapAIResponse:
    """
    Generates a roadmap by calling the Gemini API directly.
    """
    GEMINI_API_KEY = settings.GEMINI_API_KEY
    MODEL_NAME = "gemini-1.5-flash"  # Using the model that worked
    URL = f"https://generativelanguage.googleapis.com/v1/models/{MODEL_NAME}:generateContent?key={GEMINI_API_KEY}"

    prompt_text = (
        f"Generate a learning roadmap for '{request.subject}' with the goal of "
        f"'{request.goal}' over '{request.time_value} {request.time_unit}'. "
        "The roadmap should be structured into modules, each with topics and subtopics. "
        "Provide a title, description, and the roadmap plan in a JSON format. "
        "The roadmap_plan should be a list of modules, where each module has a title, timeline, and a list of topics. "
        "Each topic should have a title and a list of subtopics, and each subtopic should have a title."
        "Example format: {'title': 'Your Title', 'description': '...', 'roadmap_plan': {'modules': [{'id': 'm1', 'title': 'Module 1', 'timeline': '1 week', 'topics': [{'id': 't1', 'title': 'Topic 1', 'subtopics': [{'id': 's1', 'title': 'Subtopic 1', 'has_learn': True, 'has_quiz': False, 'has_code_challenge': False}]}]}]}}"
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt_text}
                ]
            }
        ]
    }

    headers = {
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(URL, headers=headers, data=json.dumps(payload))
        response.raise_for_status()  # Raise an exception for bad status codes

        response_json = response.json()
        generated_content_str = response_json['candidates'][0]['content']['parts'][0]['text']

        if generated_content_str.startswith("```json"):
            generated_content_str = generated_content_str.strip("```json").strip("```").strip()

        roadmap_data = json.loads(generated_content_str)

        # Ensure the response matches the RoadmapAIResponse schema
        return RoadmapAIResponse(
            title=roadmap_data.get("title", "Generated Roadmap"),
            description=roadmap_data.get("description", ""),
            roadmap_plan=RoadmapPlan(**roadmap_data.get("roadmap_plan")),
            model=MODEL_NAME
        )

    except requests.exceptions.RequestException as e:
        # Handle network-related errors
        raise Exception(f"Failed to connect to Gemini API: {e}")
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        # Handle errors in parsing the response
        raise Exception(f"Failed to parse response from Gemini API: {e}")