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
import re

router = APIRouter()


def generate_subtopic_id(roadmap_title, module_title, topic_title, subtopic_title):
    return str(
        uuid.uuid5(
            uuid.NAMESPACE_DNS,
            f"{roadmap_title}-{module_title}-{topic_title}-{subtopic_title}",
        )
    )


@router.post("/roadmaps/generate", response_model=RoadmapRead)
async def generate_roadmap(
    roadmap_create: RoadmapCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    prompt = f"""
You are an expert curriculum designer.

Generate a learning roadmap in STRICT JSON.
Do NOT include markdown, explanations, or extra text.

Schema:
{{
  "title": string,
  "description": string,
  "roadmap_plan": {{
    "modules": [
      {{
        "title": string,
        "timeline": string,
        "topics": [
          {{
            "title": string,
            "subtopics": [
              {{ "title": string }}
            ]
          }}
        ]
      }}
    ]
  }}
}}

Subject: "{roadmap_create.subject}"
Goal: "{roadmap_create.goal}"
Duration: {roadmap_create.time_value} {roadmap_create.time_unit}

Return ONLY valid JSON.
"""

    try:
        generated_text = await generate_text(prompt, model=roadmap_create.model)

        # DEBUG LOG — REQUIRED
        print("\n===== RAW GEMINI OUTPUT =====\n")
        print(generated_text)
        print("\n============================\n")

        # Robust JSON extraction
        match = re.search(r"\{.*\}", generated_text, re.DOTALL)
        if not match:
            raise HTTPException(
                status_code=500,
                detail="Gemini did not return valid JSON",
            )

        roadmap_data = json.loads(match.group())

        if "roadmap_plan" not in roadmap_data or "modules" not in roadmap_data["roadmap_plan"]:
            raise HTTPException(
                status_code=500,
                detail="Invalid roadmap structure from AI",
            )

        # Inject deterministic IDs
        for m_idx, module in enumerate(roadmap_data["roadmap_plan"]["modules"]):
            module["id"] = f"module_{m_idx + 1}"

            for t_idx, topic in enumerate(module.get("topics", [])):
                topic["id"] = f"topic_{m_idx + 1}_{t_idx + 1}"

                for s_idx, subtopic in enumerate(topic.get("subtopics", [])):
                    subtopic["id"] = generate_subtopic_id(
                        roadmap_data.get("title", roadmap_create.subject),
                        module.get("title", ""),
                        topic.get("title", ""),
                        subtopic.get("title", ""),
                    )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Roadmap generation failed: {str(e)}",
        )

    if current_user:
        new_roadmap = Roadmap(
            user_id=current_user.id,
            title=roadmap_data.get("title", f"Roadmap for {roadmap_create.subject}"),
            description=roadmap_data.get(
                "description", f"A plan to achieve {roadmap_create.goal}"
            ),
            roadmap_plan=roadmap_data["roadmap_plan"],
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

    return RoadmapRead(
        id=-1,
        user_id=-1,
        title=roadmap_data.get("title", f"Roadmap for {roadmap_create.subject}"),
        description=roadmap_data.get(
            "description", f"A plan to achieve {roadmap_create.goal}"
        ),
        roadmap_plan=roadmap_data["roadmap_plan"],
        subject=roadmap_create.subject,
        goal=roadmap_create.goal,
        time_value=roadmap_create.time_value,
        time_unit=roadmap_create.time_unit,
        model=roadmap_create.model,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

