from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database.session import get_db
from app.sql_models import User, Roadmap
from app.schemas import RoadmapCreate, RoadmapRead
from app.core.auth import get_optional_current_user
from app.utils.gemini_client import generate_text
import json
import uuid
from typing import Optional
from datetime import datetime

router = APIRouter()

def generate_subtopic_id(roadmap_title, module_title, topic_title, subtopic_title):
    """Generate a unique ID for a subtopic."""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{roadmap_title}-{module_title}-{topic_title}-{subtopic_title}"))

@router.post("/roadmaps/generate", response_model=RoadmapRead)
async def generate_roadmap(
    roadmap_create: RoadmapCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Generate a new roadmap. If user is authenticated, save it to the database.
    Otherwise, return the generated roadmap without saving.
    """
    prompt = f"""
    Generate a detailed learning roadmap for the subject: "{roadmap_create.subject}".
    The user's goal is: "{roadmap_create.goal}".
    The user wants to complete this in {roadmap_create.time_value} {roadmap_create.time_unit}.

    The output should be a JSON object with the following structure:
    {{
        "title": "Roadmap Title",
        "description": "Roadmap Description",
        "roadmap_plan": {{
            "modules": [
                {{
                    "id": "module_1",
                    "title": "Module Title",
                    "timeline": "Estimated time for the module",
                    "topics": [
                        {{
                            "id": "topic_1_1",
                            "title": "Topic Title",
                            "subtopics": [
                                {{"id": "subtopic_1_1_1", "title": "Subtopic Title"}},
                                ...
                            ]
                        }},
                        ...
                    ]
                }},
                ...
            ]
        }}
    }}
    Provide a detailed, structured, and comprehensive learning plan.
    """
    
    try:
        generated_json_string = await generate_text(prompt, model=roadmap_create.model)
        # Clean the response to ensure it is valid JSON
        if generated_json_string.strip().startswith("```json"):
            generated_json_string = generated_json_string.strip()[7:-3]

        roadmap_data = json.loads(generated_json_string)

        # Add unique IDs to the roadmap plan
        for module_idx, module in enumerate(roadmap_data.get("roadmap_plan", {}).get("modules", [])):
            module['id'] = f"module_{module_idx + 1}"
            for topic_idx, topic in enumerate(module.get("topics", [])):
                topic['id'] = f"topic_{module_idx + 1}_{topic_idx + 1}"
                for subtopic_idx, subtopic in enumerate(topic.get("subtopics", [])):
                    subtopic['id'] = generate_subtopic_id(
                        roadmap_data.get("title", roadmap_create.subject),
                        module.get("title"),
                        topic.get("title"),
                        subtopic.get("title")
                    )

    except (json.JSONDecodeError, KeyError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI-generated roadmap: {e}")

    if current_user:
        new_roadmap = Roadmap(
            user_id=current_user.id,
            title=roadmap_data.get("title", f"Roadmap for {roadmap_create.subject}"),
            description=roadmap_data.get("description", f"A plan to achieve {roadmap_create.goal}"),
            roadmap_plan=roadmap_data.get("roadmap_plan", {}),
            subject=roadmap_create.subject,
            goal=roadmap_create.goal,
            time_value=roadmap_create.time_value,
            time_unit=roadmap_create.time_unit,
            model=roadmap_create.model,
        )
        db.add(new_roadmap)
        db.commit()
        db.refresh(new_roadmap)
        return new_roadmap
    else:
        # For unauthenticated users, just return the generated data without saving
        return RoadmapRead(
            id=-1,
            user_id=-1,
            title=roadmap_data.get("title", f"Roadmap for {roadmap_create.subject}"),
            description=roadmap_data.get("description", f"A plan to achieve {roadmap_create.goal}"),
            roadmap_plan=roadmap_data.get("roadmap_plan", {}),
            subject=roadmap_create.subject,
            goal=roadmap_create.goal,
            time_value=roadmap_create.time_value,
            time_unit=roadmap_create.time_unit,
            model=roadmap_create.model,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )