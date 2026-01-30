from fastapi import APIRouter, Depends, HTTPException
from app.schemas import RoadmapCreate, RoadmapRead
from app.utils.gemini_client import generate_text
import json
import uuid
import random
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
):
    prior_experience_text = (
        f"- **Prior Experience:** \"{roadmap_create.prior_experience}\"\n"
        if roadmap_create.prior_experience
        else ""
    )

    prompt = f"""
You are an expert curriculum designer. Your task is to generate a structured learning roadmap in a specific JSON format.

**Strict Instructions:**
1.  **Output JSON ONLY:** The entire response must be a single, valid JSON object. Do not include any text, explanations, or markdown formatting before or after the JSON.
2.  **Adhere to the Schema:** The JSON structure must follow this exact schema:

    ```json
    {{
      "title": "string",
      "description": "string",
      "roadmap_plan": {{
        "modules": [
          {{
            "title": "string",
            "timeline": "string",
            "topics": [
              {{
                "title": "string",
                "subtopics": [
                  {{ "title": "string" }}
                ]
              }}
            ]
          }}
        ]
      }}
    }}
    ```

**Roadmap Details:**
- **Subject:** "{roadmap_create.subject}"
- **Primary Goal:** "{roadmap_create.goal}"
{prior_experience_text}- **Target Duration:** {roadmap_create.time_value} {roadmap_create.time_unit}

Begin the JSON output immediately.
"""

    try:
        if roadmap_create.model:
            generated_text = await generate_text(prompt, model=roadmap_create.model)
        else:
            generated_text = await generate_text(prompt)

        # DEBUG LOG — REQUIRED
        print("\n===== RAW GEMINI OUTPUT =====\n")
        print(generated_text)
        print("\n============================\n")

        # More robust JSON extraction
        roadmap_data = None
        try:
            # First, try to parse the whole string
            roadmap_data = json.loads(generated_text)
        except json.JSONDecodeError:
            # If that fails, find the first '{' and last '}'
            match = re.search(r"\{.*\}", generated_text, re.DOTALL)
            if match:
                try:
                    roadmap_data = json.loads(match.group(0))
                except json.JSONDecodeError as e:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to parse extracted JSON: {e}",
                    )
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Gemini response did not contain a valid JSON object.",
                )

        if not roadmap_data:
             raise HTTPException(
                    status_code=500,
                    detail="Could not extract roadmap data from Gemini response.",
                )


        if "roadmap_plan" not in roadmap_data or "modules" not in roadmap_data.get("roadmap_plan", {}):
            raise HTTPException(
                status_code=500,
                detail="Invalid roadmap structure from AI. 'roadmap_plan' or 'modules' is missing.",
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
        # Log the exception for debugging
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during roadmap generation.",
        )

    # Return the roadmap data directly without saving to DB
    return RoadmapRead(
        id=random.randint(10000, 99999),  # Generate a temporary ID
        user_id=None,
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
        updated_at=datetime.utcnow()
    )

