import logging
import re
import uuid
import os
import tempfile

# --- Setup Logging ---
# Fixed OpenRouter API key trailing newline issue in Secret Manager - 2025-09-06
# Updated OpenRouter API key secret to remove trailing newline - 2025-09-11
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import asyncio
import json
from typing import Any, Dict, List, Optional, Type, TypeVar, Union

import httpx
from json_repair import repair_json
from pydantic import BaseModel, ValidationError
from core.config import settings
from fastapi import HTTPException, status
from jinja2 import Environment, FunctionLoader, TemplateNotFound, TemplateSyntaxError
import importlib.resources as pkg_resources
import prompts as tmpl_pkg
import litellm
from litellm.exceptions import APIError

from utils.huggingface_fetcher import HuggingFaceModelFetcher, get_fallback_models

def load_template(name):
    return pkg_resources.read_text(tmpl_pkg, name)

prompt_env = Environment(loader=FunctionLoader(load_template), autoescape=False)

# Log visible templates for validation
try:
    logger.info(f"Visible templates: {prompt_env.list_templates()}")
except Exception as e:
    logger.warning(f"Could not list templates: {e}")

from schemas import (LearningContentRequest, QuizAIResponse, QuizGenerateRequest,
                     RoadmapAIResponse, RoadmapCreateRequest, RoadmapPlan, LearningContentResponse,
                     LearningContentOutlineRequest, LearningContentOutlineResponse,
                     LearningContentChunkRequest, LearningContentChunkResponse, QuestionBase, ThreeDVisualizationRequest, ThreeDVisualizationResponse,
                     GenerateFeedbackRequest, GenerateFeedbackResponse, PracticeQuestionResponse,
                     LearningResourceRequest, LearningResourceBase, GenerateResourcesResponse)

# Define a TypeVar for BaseModel subclasses
T = TypeVar('T', bound=BaseModel)

# --- AI Execution Logic ---

def _correct_ai_response_keys(data: Any) -> Any:
    """Recursively corrects common AI response key deviations (e.g., 'subtopics' to 'sub_topics')."""
    if isinstance(data, dict):
        # Recursively process nested dictionaries
        for key, value in data.items():
            data[key] = _correct_ai_response_keys(value)
    elif isinstance(data, list):
        # Recursively process items in lists
        return [_correct_ai_response_keys(item) for item in data]
    return data

def _sanitize_content_blocks(data: Any) -> Any:
    """Sanitizes content blocks to ensure they have proper type discriminators."""
    if isinstance(data, dict):
        # Check if this is a content response with content array
        if 'content' in data and isinstance(data['content'], list):
            sanitized_content = []
            for item in data['content']:
                if isinstance(item, dict):
                    # Skip items that don't have a 'type' field or have invalid structure
                    if 'type' not in item:
                        logger.warning(f"Skipping content block without 'type' field: {item}")
                        continue
                    
                    # Ensure 'data' field exists
                    if 'data' not in item:
                        logger.warning(f"Skipping content block without 'data' field: {item}")
                        continue
                    
                    # Validate known types
                    valid_types = [
                        'heading', 'paragraph', 'progressive_disclosure', 'active_recall',
                        'dual_coding', 'comparison_table', 'callout', 'mermaid_diagram', '3d_visualization'
                    ]
                    
                    if item['type'] not in valid_types:
                        logger.warning(f"Skipping content block with unknown type '{item['type']}': {item}")
                        continue
                    
                    sanitized_content.append(item)
                else:
                    logger.warning(f"Skipping non-dict content block: {item}")
            
            data['content'] = sanitized_content
        
        # Recursively process nested dictionaries
        for key, value in data.items():
            data[key] = _sanitize_content_blocks(value)
    elif isinstance(data, list):
        # Recursively process items in lists
        return [_sanitize_content_blocks(item) for item in data]
    return data

class AIExecutor:
    def __init__(self):
        logger.info("AIExecutor initialized. Using OpenRouter and HuggingFace models.")

    async def execute(
        self,
        task_type: str,
        request_data: Union[QuizGenerateRequest, RoadmapCreateRequest, LearningContentRequest, GenerateFeedbackRequest, LearningResourceRequest],
        response_schema: Type[T],
        is_json: bool = True
    ) -> Dict[str, Any]:
        if task_type == "roadmap":
            is_json = False

        prompt = self._render_prompt(task_type, request_data)
        model_id = request_data.model

        # Ensure the model string has a provider prefix
        if ':' not in model_id:
            # Default to openrouter provider if no explicit provider is given
            model_id = f"openrouter:{model_id}"

        raw_response = None

        try:
            provider, model_name = model_id.split(":", 1)

            if provider == "vertexai":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Vertex AI models are no longer supported. Please use OpenRouter or HuggingFace models."
                )
            else:
                api_key = None
                litellm_model_name = model_id.replace(":", "/", 1)

                if provider == "huggingface" and settings.HF_API_TOKEN:
                    api_key = settings.HF_API_TOKEN
                elif provider == "openrouter" and settings.OPENROUTER_API_KEY:
                    api_key = settings.OPENROUTER_API_KEY
                elif provider == "openai" and settings.OPENAI_API_KEY:
                    api_key = settings.OPENAI_API_KEY

                if not api_key:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Access to the selected model ({model_id}) is currently unavailable. Please choose a free model."
                    )

                logger.info(f"Using API Key (first 5 chars): {api_key[:5]} for model: {model_id}")

                logger.info(f"Sending prompt to LiteLLM model {litellm_model_name}: {prompt}")
                try:
                    # LiteLLM completion with proper OpenRouter configuration
                    completion_params = {
                        "model": litellm_model_name,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "api_key": api_key.strip() if api_key else None
                    }
                    
                    # Add OpenRouter-specific headers if using OpenRouter
                    if provider == "openrouter":
                        completion_params["extra_headers"] = {
                            "HTTP-Referer": "https://menttor.live",  # Your site URL
                            "X-Title": "Menttor Labs"  # Your app name
                        }
                    
                    response = litellm.completion(**completion_params)
                    logger.info(f"Full LiteLLM Response Object: {response}")

                    if not response.choices or not response.choices[0].message or not response.choices[0].message.content:
                        logger.error(f"Malformed LiteLLM response: {response}")
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="AI model returned an unexpected response format."
                        )
                    raw_response = response.choices[0].message.content
                    print(f"Raw LiteLLM AI Response: {raw_response}")
                except APIError as litellm_e:
                    # Check if the error has a status code and if it's 402 from OpenRouter
                    if (isinstance(litellm_e, litellm.exceptions.APIStatusError) or isinstance(litellm_e, litellm.exceptions.APIConnectionError)) and litellm_e.status_code == 402 and provider == "openrouter":
                        logger.warning(f"OpenRouter model {model_id} failed due to insufficient credits (402).")
                        raise HTTPException(
                            status_code=status.HTTP_402_PAYMENT_REQUIRED,
                            detail="Paid models are currently unavailable. We are working to secure additional resources. Please select a free model."
                        ) from litellm_e
                    else:
                        logger.error(f"LiteLLM completion failed for model {model_id}: {litellm_e}", exc_info=True)
                        raise HTTPException(
                            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail=f"AI model {model_id} failed to respond: {litellm_e}"
                        ) from litellm_e
                except Exception as litellm_e:
                    logger.error(f"LiteLLM completion failed for model {model_id}: {litellm_e}", exc_info=True)
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"AI model {model_id} failed to respond: {litellm_e}"
                    ) from litellm_e

            if is_json:
                validated_response = self._validate_and_parse_json(raw_response, response_schema, model_id)
                # For most schemas, the model is added during validation.
                # For LearningContentResponse, the model is part of the validated object.
                # GenerateResourcesResponse doesn't have a model field, so skip setting it
                if response_schema.__name__ != 'GenerateResourcesResponse' and (not hasattr(validated_response, 'model') or not validated_response.model):
                     validated_response.model = model_id
                return {"response": validated_response, "model": model_id}
            else:
                # Special handling for GenerateFeedbackResponse and ThreeDVisualizationResponse
                if response_schema is GenerateFeedbackResponse:
                    if isinstance(raw_response, dict) and "content" in raw_response:
                        feedback_text = raw_response["content"]
                    else:
                        feedback_text = raw_response
                    return {"response": response_schema(feedback_text=feedback_text), "model": model_id}
                elif response_schema is ThreeDVisualizationResponse:
                    return {"response": response_schema(html_content=raw_response, model=model_id), "model": model_id}
                elif response_schema is RoadmapAIResponse:
                    return {"response": raw_response, "model": model_id}
                else:
                    return {"response": response_schema(content=raw_response), "model": model_id}

        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"An unexpected error occurred calling AI model {model_id}: {type(e).__name__} - {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"AI model {model_id} failed to respond: {e}"
            ) from e

    def _render_prompt(self, task_type: str, request_data: BaseModel) -> str:
        try:
            logger.info(f"Rendering prompt template '{task_type}.j2' with context: {request_data}") # DEBUG
            template = prompt_env.get_template(f"{task_type}.j2")
            
            # Special handling for feedback_generation context
            if task_type == "feedback_generation":
                # The context for feedback generation is nested under 'performance_details'
                # when passed from the GenerateFeedbackRequest model.
                render_context = request_data.performance_details
            else:
                render_context = request_data.model_dump()

            return template.render(render_context)
        except (TemplateNotFound, TemplateSyntaxError) as e:
            logger.error(f"Error rendering prompt template for task '{task_type}': {e}", exc_info=True) # Added exc_info=True
            raise HTTPException(status_code=500, detail="Could not render prompt template.")
        finally:
            pass

    def _validate_and_parse_json(self, raw_response: str, response_schema: Type[T], model_name: str) -> T:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.info(f"--- JSON Processing Attempt {attempt + 1}/{max_retries} ---")
                logger.info(f"Raw AI Response: {raw_response}")

                if raw_response is None:
                    raise ValueError("Raw response is None, cannot parse JSON.")

                # Find the first occurrence of '{'
                first_brace_index = raw_response.find('{')
                if first_brace_index == -1:
                    raise ValueError("No opening brace '{' found in the AI response.")

                # Extract the substring from the first brace onwards
                potential_json_str = raw_response[first_brace_index:]
                logger.info(f"Step 1: Extracted Potential JSON: {potential_json_str}")

                # Attempt to repair the JSON string
                repaired_json_str = repair_json(potential_json_str)
                logger.info(f"Step 2: Repaired JSON: {repaired_json_str}")

                # Parse the repaired JSON
                parsed_json = json.loads(repaired_json_str)
                logger.info(f"Step 3: Parsed JSON: {parsed_json}")

                # Apply post-processing to correct common AI response deviations
                parsed_json = _correct_ai_response_keys(parsed_json)
                logger.info(f"Step 4: Post-processed JSON: {parsed_json}")

                # Sanitize content blocks for LearningContentResponse
                if response_schema.__name__ == 'LearningContentResponse':
                    parsed_json = _sanitize_content_blocks(parsed_json)
                    logger.info(f"Step 4.5: Sanitized content blocks: {parsed_json}")

                # Add model name to the parsed JSON
                parsed_json['model'] = model_name
                logger.info(f"Step 5: Final JSON before validation: {parsed_json}")

                return response_schema.model_validate(parsed_json)

            except (ValueError, json.JSONDecodeError, ValidationError) as e:
                logger.warning(f"Attempt {attempt + 1} of {max_retries} failed: {e}")
                if isinstance(e, ValidationError):
                    logger.error(f"Validation error details: {e.errors()}")
                if attempt + 1 == max_retries:
                    logger.error(f"Failed after {max_retries} attempts. Raw response: {raw_response}")
                    logger.error(f"Final error type: {type(e).__name__}, message: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"AI response validation failed: {str(e)}"
                    )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI response validation failed after all retries."
        )

# --- Public-Facing Service Functions ---

ai_executor = AIExecutor()

async def generate_quiz_content(request: QuizGenerateRequest) -> QuizAIResponse:
    """Generates a quiz using the AI executor, with a fallback to Vertex AI."""
    try:
        result = await ai_executor.execute(
            task_type="quiz_generation",
            request_data=request,
            response_schema=QuizAIResponse
        )
        response = result["response"]
        response.model = result["model"]
        response.session_token = str(uuid.uuid4())
        return response
    except Exception as e:
        logger.warning(f"Initial quiz generation failed with model {request.model}: {e}. Attempting fallback to free OpenRouter model.")
        # Create a new request for fallback, explicitly setting the model to a free OpenRouter model
        fallback_request = QuizGenerateRequest(
            sub_topic_title=request.sub_topic_title,
            subject=request.subject,
            goal=request.goal,
            time_value=request.time_value,
            time_unit=request.time_unit,
            model="openrouter:meta-llama/llama-3.2-3b-instruct:free", # Force free model
            module_title=request.module_title,
            topic_title=request.topic_title,
            num_questions=request.num_questions,
        )
        try:
            fallback_result = await ai_executor.execute(
                task_type="quiz_generation",
                request_data=fallback_request,
                response_schema=QuizAIResponse
            )
            fallback_response = fallback_result["response"]
            fallback_response.model = fallback_result["model"]
            logger.info(f"Successfully generated quiz using fallback OpenRouter model: {fallback_response.model}")
            return fallback_response
        except Exception as fallback_e:
            logger.error(f"Fallback quiz generation with OpenRouter also failed: {fallback_e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate quiz content with both primary and fallback models. Primary error: {e}. Fallback error: {fallback_e}"
            ) from fallback_e



async def generate_roadmap_content(request: RoadmapCreateRequest) -> RoadmapAIResponse:
    """Generates a roadmap using the AI executor and injects UUIDs."""
    result = await ai_executor.execute(
        task_type="roadmap",
        request_data=request,
        response_schema=RoadmapAIResponse
    )
    raw_text = result["response"] # This is now the raw string

    # Parse the raw text to extract the roadmap structure
    title_match = re.search(r"\*\*Roadmap Title:\*\*\s*(.*)", raw_text)
    description_match = re.search(r"\*\*Roadmap Description:\*\*\s*(.*)", raw_text)

    title = title_match.group(1).strip() if title_match else "AI-Generated Roadmap"
    description = description_match.group(1).strip() if description_match else "A roadmap generated by the AI."

    modules_data = []
    
    # Log basic info about the parsing process
    logger.info(f"Parsing AI response for roadmap generation...")

    # Split by module headers - the actual format is ### Module X: Title
    module_sections = re.split(r"###\s*Module \d+:.*?(?:\n|\r)", raw_text)[1:]

    # Find all module headers to extract titles
    module_headers = re.findall(r"###\s*Module (\d+):\s*(.*?)(?:\n|\r)", raw_text)
    
    logger.info(f"Found {len(module_sections)} module sections")
    logger.info(f"Found {len(module_headers)} module headers")

    for i, module_text in enumerate(module_sections):
        if i < len(module_headers):
            module_title = module_headers[i][1].strip()
        else:
            module_title = f"Module {i+1}"
            
        # Extract timeline - the actual format is "*Timeline: Weeks 1-2*"
        timeline_match = re.search(r"\*\s*Timeline:\s*(.*?)(?:\*|$)", module_text)
        timeline = timeline_match.group(1).strip() if timeline_match else "N/A"

        topics_data = []
        # Split by topic headers - the actual format is "  * **Topic X: Title**"
        topic_sections = re.split(r"\*\s*\*\*Topic \d+:.*?\*\*", module_text)[1:]
        topic_headers = re.findall(r"\*\s*\*\*Topic (\d+):\s*(.*?)\*\*", module_text)

        logger.info(f"Module {i+1} ({module_title}): Found {len(topic_sections)} topic sections and {len(topic_headers)} topic headers")

        for j, topic_text in enumerate(topic_sections):
            if j < len(topic_headers):
                topic_title = topic_headers[j][1].strip()
            else:
                topic_title = f"Topic {j+1}"

            subtopics_data = []
            # Find subtopic lines - the actual format is "    * Sub-topic X: Title (tags)"
            # We want to extract just the title, removing the "Sub-topic X:" prefix
            subtopic_matches = re.finditer(r"^\s*\*\s+(?:Sub[‑-]topic \d+:\s*)?(.*?)\s+(\(.*?\))\s*$", topic_text, re.MULTILINE)

            subtopic_count = 0
            for match in subtopic_matches:
                subtopic_title = match.group(1).strip()
                tags = match.group(2) if match.group(2) else ""
                subtopic_count += 1

                subtopics_data.append({
                    "id": str(uuid.uuid4()),
                    "title": subtopic_title,
                    "has_learn": "learn" in tags.lower(),
                    "has_quiz": "quiz" in tags.lower(),
                    "has_code_challenge": "code challenge" in tags.lower()
                })

            logger.info(f"  Topic {j+1} ({topic_title}): Found {subtopic_count} subtopics")

            if topic_title and subtopics_data:
                topics_data.append({
                    "id": str(uuid.uuid4()),
                    "title": topic_title,
                    "subtopics": subtopics_data
                })
                
        if module_title and topics_data:
            modules_data.append({
                "id": str(uuid.uuid4()),
                "title": module_title,
                "timeline": timeline,
                "topics": topics_data
            })
            
    logger.info(f"Successfully parsed {len(modules_data)} modules from AI response")

    # Construct the final response object
    roadmap_plan = RoadmapPlan(modules=modules_data)
    
    response = RoadmapAIResponse(
        title=title,
        description=description,
        roadmap_plan=roadmap_plan,
        model=result["model"]
    )

    return response

async def generate_3d_visualization(request: ThreeDVisualizationRequest) -> ThreeDVisualizationResponse:
    """Generates a 3D visualization using the AI executor."""
    result = await ai_executor.execute(
        task_type="visual_card_3d",
        request_data=request,
        response_schema=ThreeDVisualizationResponse,
        is_json=False
    )
    # The AI executor now directly returns the correct schema instance
    response = result["response"]
    response.model = result["model"]
    
    # Clean up markdown code blocks if present
    html_content = response.html_content
    if html_content.startswith("```html"):
        # Remove ```html from start and ``` from end
        html_content = html_content[7:]  # Remove ```html
        if html_content.endswith("```"):
            html_content = html_content[:-3]  # Remove ```
        html_content = html_content.strip()
    
    # Fix OrbitControls CDN URL - replace r149 with r140 for compatibility
    html_content = html_content.replace(
        "https://cdn.jsdelivr.net/npm/three@0.149.0/examples/js/controls/OrbitControls.js",
        "https://cdn.jsdelivr.net/npm/three@0.140.0/examples/js/controls/OrbitControls.js"
    )
    
    # Fix other Three.js r149 URLs to r140
    html_content = html_content.replace(
        "https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js",
        "https://cdn.jsdelivr.net/npm/three@0.140.0/build/three.min.js"
    )
    
    html_content = html_content.replace(
        "https://cdn.jsdelivr.net/npm/three@0.149.0/examples/js/postprocessing/",
        "https://cdn.jsdelivr.net/npm/three@0.140.0/examples/js/postprocessing/"
    )
    
    html_content = html_content.replace(
        "https://cdn.jsdelivr.net/npm/three@0.149.0/examples/js/shaders/",
        "https://cdn.jsdelivr.net/npm/three@0.140.0/examples/js/shaders/"
    )
    
    # Fix specific post-processing script URLs
    for script_name in ["EffectComposer.js", "RenderPass.js", "CopyShader.js", 
                        "LuminosityHighPassShader.js", "UnrealBloomPass.js"]:
        html_content = html_content.replace(
            f"https://cdn.jsdelivr.net/npm/three@0.149.0/examples/js/postprocessing/{script_name}",
            f"https://cdn.jsdelivr.net/npm/three@0.140.0/examples/js/postprocessing/{script_name}"
        )
        html_content = html_content.replace(
            f"https://cdn.jsdelivr.net/npm/three@0.149.0/examples/js/shaders/{script_name}",
            f"https://cdn.jsdelivr.net/npm/three@0.140.0/examples/js/shaders/{script_name}"
        )
    
    # Fix constructor patterns for Three.js r140 compatibility
    html_content = html_content.replace(
        "new OrbitControls(",
        "new THREE.OrbitControls("
    )
    
    html_content = html_content.replace(
        "new EffectComposer(",
        "new THREE.EffectComposer("
    )
    
    html_content = html_content.replace(
        "new RenderPass(",
        "new THREE.RenderPass("
    )
    
    html_content = html_content.replace(
        "new UnrealBloomPass(",
        "new THREE.UnrealBloomPass("
    )
    
    # Fix dependency checks
    html_content = html_content.replace(
        "typeof OrbitControls !== 'undefined'",
        "typeof THREE !== 'undefined' && THREE.OrbitControls"
    )
    
    html_content = html_content.replace(
        "typeof EffectComposer !== 'undefined'",
        "typeof THREE !== 'undefined' && THREE.EffectComposer"
    )
    
    html_content = html_content.replace(
        "typeof RenderPass !== 'undefined'",
        "typeof THREE !== 'undefined' && THREE.RenderPass"
    )
    
    response.html_content = html_content
    
    return response

async def generate_learning_content(request: LearningContentRequest) -> LearningContentResponse:
    """Generates learning content as a structured JSON object using the AI executor."""
    logger.info(f"Generating structured content for subtopic: {request.subtopic}")

    # Ensure the model string has a provider prefix
    model_with_provider = request.model
    if ':' not in model_with_provider:
        model_with_provider = f"openrouter:{model_with_provider}"  # Default to openrouter provider

    # Create a request for the full content
    structured_content_request = LearningContentChunkRequest(
        subtopic=request.subtopic,
        subject=request.subject,
        goal=request.goal,
        model=model_with_provider,
        chunk_title="Full Content",  # This might be less relevant now but kept for consistency
        context=f"Generate comprehensive, structured learning content for {request.subtopic} within {request.subject} related to {request.goal}.",
        max_output_tokens=8000  # Increased token limit for complex JSON
    )

    # Execute the AI call to get the structured content
    result = await ai_executor.execute(
        task_type="learn_chunk",
        request_data=structured_content_request,
        response_schema=LearningContentResponse, # The new schema that expects the JSON structure
        is_json=True # We now expect a JSON response
    )

    # The result["response"] is already a validated LearningContentResponse object
    return result["response"]

async def generate_performance_feedback(request: GenerateFeedbackRequest) -> GenerateFeedbackResponse:
    """Generates personalized feedback using the AI executor."""
    # Ensure the model string has a provider prefix
    model_with_provider = request.model
    if ':' not in model_with_provider:
        model_with_provider = f"openrouter:{model_with_provider}"  # Default to openrouter provider

    # Create a new request object with the prefixed model
    feedback_request_with_model = GenerateFeedbackRequest(
        user_id=request.user_id,
        performance_details=request.performance_details,
        model=model_with_provider
    )

    result = await ai_executor.execute(
        task_type="feedback_generation",
        request_data=feedback_request_with_model, # Pass the new request object
        response_schema=GenerateFeedbackResponse,
        is_json=False
    )
    return result["response"]

async def generate_learning_resources(request: LearningResourceRequest) -> GenerateResourcesResponse:
    """Generate external learning resources for a roadmap topic using AI."""
    try:
        logger.info(f"Generating learning resources for topic: {request.topic}")
        
        # Use dedicated learning resources model (free OpenRouter model)
        model = settings.DEFAULT_LEARNING_RESOURCES_MODEL
        model_with_provider = f"openrouter:{model}" if ':' not in model else model
        
        # Create a modified request with the correct model
        learning_request = LearningResourceRequest(
            roadmap_id=request.roadmap_id,
            topic=request.topic,
            category=request.category,
            max_resources=request.max_resources,
            model=model_with_provider,  # Ensure model is set
            roadmap_title=getattr(request, 'roadmap_title', ''),
            roadmap_description=getattr(request, 'roadmap_description', ''),
            max_output_tokens=3000  # Set token limit for resources generation
        )
        
        # Use ai_executor for consistency with other AI services
        result = await ai_executor.execute(
            task_type="learning_resources",
            request_data=learning_request,
            response_schema=GenerateResourcesResponse,
            is_json=True
        )
        
        return result["response"]
        
    except Exception as e:
        logger.error(f"Failed to generate learning resources: {str(e)}")
        return GenerateResourcesResponse(
            success=False,
            resources=[],
            total_generated=0,
            error=str(e)
        )

async def _fetch_openrouter_models() -> List[Dict[str, Any]]:
    """Fetches models from OpenRouter API and filters for free ones."""
    if not settings.OPENROUTER_API_KEY:
        logger.warning("OPENROUTER_API_KEY not set. Skipping OpenRouter model fetch.")
        return []

    headers = {"Authorization": f"Bearer {settings.OPENROUTER_API_KEY}"}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("https://openrouter.ai/api/v1/models", headers=headers)
            response.raise_for_status()
            models_data = response.json().get("data", [])
            
            free_models = []
            for model in models_data:
                if model.get("id") and model.get("name"):
                    free_models.append({
                        "id": f'openrouter:{model["id"]}',
                        "name": model["name"],
                        "description": model.get("description", ""),
                        "context_window": model.get("context_window"),
                        "per_token_cost": float(model.get("pricing", {}).get("prompt", 0)),
                        "per_image_cost": float(model.get("pricing", {}).get("image", 0)),
                        "per_completion_cost": float(model.get("pricing", {}).get("completion", 0)),
                        "max_tokens": model.get("max_tokens"),
                        "top_provider": model.get("top_provider", {}).get("name", "OpenRouter"),
                        "free_trial": True
                    })
            return free_models
        except httpx.RequestError as e:
            logger.error(f"Could not fetch OpenRouter models: {e}")
            return []

async def _fetch_huggingface_models() -> List[Dict[str, Any]]:
    """Dynamic version of your existing function."""
    try:
        async with HuggingFaceModelFetcher() as fetcher:
            models = await fetcher.fetch_models(limit=100, free_only=False)
            
            # If API fails, fall back to static list
            if not models:
                logger.warning("Dynamic fetch failed, using fallback static list")
                return get_fallback_models()
            
            return models
    except Exception as e:
        logger.error(f"Error in dynamic model fetch: {e}")
        return get_fallback_models()

# Vertex AI models removed - application now uses OpenRouter and HuggingFace only

async def get_available_models() -> List[Dict[str, Any]]:
    """
    Fetches and combines available models from all configured providers.
    This function now dynamically builds the list of available models.
    Currently supports OpenRouter and HuggingFace only.
    """
    # Use asyncio.gather to fetch models from all providers concurrently
    all_model_lists = await asyncio.gather(
        _fetch_openrouter_models(),
        _fetch_huggingface_models()
    )

    # Flatten the list of lists into a single list of models
    combined_models = [model for model_list in all_model_lists for model in model_list]

    if not combined_models:
        logger.warning("No models were found from any provider. The model list will be empty.")
        # Optionally, raise an exception if no models are available, as the frontend depends on this list.
        # raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No AI models are available.")

    return combined_models

# --- Practice Question Generation Functions ---

class PracticeQuestionRequest(BaseModel):
    """Request model for practice question generation"""
    question_type: str  # mcq, numerical, caseStudy, codeCompletion, debugging
    subtopic_title: str
    context: str
    subject: str
    goal: str
    count: int
    hints_enabled: bool = True
    model: str = "openrouter:meta-llama/llama-3.2-3b-instruct:free"
    max_output_tokens: int = 8192

class PracticeQuestionAIResponse(BaseModel):
    """AI response model for practice questions"""
    questions: List[Dict[str, Any]]
    model: str

async def generate_practice_questions_ai(
    question_type: str,
    subtopic_id: str,
    subtopic_details: Dict[str, Any],
    count: int,
    subject: str,
    goal: str,
    hints_enabled: bool = True,
    model: str = "openrouter:meta-llama/llama-3.2-3b-instruct:free"
) -> List[PracticeQuestionResponse]:
    """
    Generate practice questions using AI for different question types.
    This is the main function called by the practice service.
    """
    logger.info(f"Generating {count} {question_type} questions for subtopic: {subtopic_details.get('title', subtopic_id)}")
    
    # Ensure model has provider prefix
    if ':' not in model:
        model = f"openrouter:{model}"
    
    # Create request for AI generation
    request = PracticeQuestionRequest(
        question_type=question_type,
        subtopic_title=subtopic_details.get('title', 'Unknown Subtopic'),
        context=f"Module: {subtopic_details.get('module_title', 'N/A')}, Topic: {subtopic_details.get('topic_title', 'N/A')}",
        subject=subject,
        goal=goal,
        count=count,
        hints_enabled=hints_enabled,
        model=model
    )
    
    try:
        # Map question types to correct template names
        template_mapping = {
            "mcq": "practice_mcq",
            "numerical": "practice_numerical", 
            "caseStudy": "practice_case_study",
            "codeCompletion": "practice_code_completion",
            "debugging": "practice_debugging"
        }
        
        template_name = template_mapping.get(question_type, f"practice_{question_type}")
        
        # Generate questions using the appropriate template
        result = await ai_executor.execute(
            task_type=template_name,
            request_data=request,
            response_schema=PracticeQuestionAIResponse,
            is_json=True
        )
        
        ai_response = result["response"]
        
        # Convert AI response to PracticeQuestionResponse objects
        practice_questions = []
        for i, question_data in enumerate(ai_response.questions):
            try:
                # Create standardized question response
                question_response = _create_practice_question_response(
                    question_data=question_data,
                    question_type=question_type,
                    subtopic_id=subtopic_id,
                    index=i,
                    model_used=result["model"]
                )
                practice_questions.append(question_response)
                
            except Exception as e:
                logger.warning(f"Failed to process question {i+1}: {e}")
                continue
        
        logger.info(f"Successfully generated {len(practice_questions)} {question_type} questions")
        return practice_questions
        
    except Exception as e:
        logger.error(f"Failed to generate {question_type} questions: {e}")
        # Return fallback questions if AI generation fails
        return _generate_fallback_questions(question_type, count, subtopic_id, subtopic_details, model)

def _create_practice_question_response(
    question_data: Dict[str, Any], 
    question_type: str, 
    subtopic_id: str, 
    index: int,
    model_used: str
) -> PracticeQuestionResponse:
    """Convert AI question data to standardized PracticeQuestionResponse"""
    
    # Extract common fields
    question_id = question_data.get('id', index + 1)
    question_text = question_data.get('question_text', question_data.get('question', ''))
    difficulty = question_data.get('difficulty', 'medium')
    hint = question_data.get('hint') if question_data.get('hint') else None
    explanation = question_data.get('explanation', '')
    
    # Handle different question types
    if question_type == 'mcq':
        options = question_data.get('options', [])
        # Convert options to simple list of strings for frontend
        option_texts = []
        if isinstance(options, list) and len(options) > 0:
            if isinstance(options[0], dict):
                option_texts = [opt.get('text', str(opt)) for opt in options]
            else:
                option_texts = [str(opt) for opt in options]
        
        correct_answer = question_data.get('correct_answer_id', 'A')
        
        return PracticeQuestionResponse(
            id=question_id,
            question_type=question_type,
            question=question_text,
            options=option_texts,
            hint=hint,
            code_snippet=None,
            difficulty=difficulty,
            subtopic_id=subtopic_id,
            order_index=index
        )
    
    elif question_type == 'numerical':
        return PracticeQuestionResponse(
            id=question_id,
            question_type=question_type,
            question=question_text,
            options=None,
            hint=hint,
            code_snippet=None,
            difficulty=difficulty,
            subtopic_id=subtopic_id,
            order_index=index
        )
    
    elif question_type == 'caseStudy':
        options = question_data.get('options', [])
        option_texts = []
        if isinstance(options, list) and len(options) > 0:
            if isinstance(options[0], dict):
                option_texts = [opt.get('text', str(opt)) for opt in options]
            else:
                option_texts = [str(opt) for opt in options]
        
        return PracticeQuestionResponse(
            id=question_id,
            question_type=question_type,
            question=question_text,
            options=option_texts,
            hint=hint,
            code_snippet=None,
            difficulty=difficulty,
            subtopic_id=subtopic_id,
            order_index=index
        )
    
    elif question_type in ['codeCompletion', 'debugging']:
        code_snippet = question_data.get('code_snippet', '')
        
        return PracticeQuestionResponse(
            id=question_id,
            question_type=question_type,
            question=question_text,
            options=None,
            hint=hint,
            code_snippet=code_snippet,
            difficulty=difficulty,
            subtopic_id=subtopic_id,
            order_index=index
        )
    
    else:
        # Default case
        return PracticeQuestionResponse(
            id=question_id,
            question_type=question_type,
            question=question_text,
            options=None,
            hint=hint,
            code_snippet=None,
            difficulty=difficulty,
            subtopic_id=subtopic_id,
            order_index=index
        )

def _generate_fallback_questions(
    question_type: str, 
    count: int, 
    subtopic_id: str, 
    subtopic_details: Dict[str, Any],
    model: str
) -> List[PracticeQuestionResponse]:
    """Generate fallback questions when AI generation fails"""
    logger.info(f"Generating {count} fallback {question_type} questions")
    
    fallback_questions = []
    subtopic_title = subtopic_details.get('title', 'Unknown Subtopic')
    
    for i in range(count):
        if question_type == 'mcq':
            fallback_questions.append(PracticeQuestionResponse(
                id=i + 1,
                question_type=question_type,
                question=f"Which of the following best describes {subtopic_title}?",
                options=[
                    "A fundamental concept in this area",
                    "An advanced technique requiring expertise", 
                    "A basic principle every learner should know",
                    "A specialized application with limited use"
                ],
                hint="Consider the foundational importance of this concept",
                code_snippet=None,
                difficulty="medium",
                subtopic_id=subtopic_id,
                order_index=i
            ))
        
        elif question_type == 'numerical':
            fallback_questions.append(PracticeQuestionResponse(
                id=i + 1,
                question_type=question_type,
                question=f"Calculate the result for this {subtopic_title} problem: If x = 10 and y = 5, what is x + y?",
                options=None,
                hint="Add the two numbers together",
                code_snippet=None,
                difficulty="easy",
                subtopic_id=subtopic_id,
                order_index=i
            ))
        
        elif question_type == 'caseStudy':
            fallback_questions.append(PracticeQuestionResponse(
                id=i + 1,
                question_type=question_type,
                question=f"In a real-world scenario involving {subtopic_title}, what would be the most effective approach?",
                options=[
                    "Apply standard industry practices",
                    "Use a customized solution based on specific requirements",
                    "Follow established protocols exactly",
                    "Adapt the approach based on available resources"
                ],
                hint="Consider the balance between standardization and customization",
                code_snippet=None,
                difficulty="hard",
                subtopic_id=subtopic_id,
                order_index=i
            ))
        
        elif question_type == 'codeCompletion':
            fallback_questions.append(PracticeQuestionResponse(
                id=i + 1,
                question_type=question_type,
                question=f"Complete the following code related to {subtopic_title}:",
                options=None,
                hint="Think about the basic syntax and logic required",
                code_snippet="def example_function(x):\n    # Complete this function\n    return _____",
                difficulty="medium",
                subtopic_id=subtopic_id,
                order_index=i
            ))
        
        elif question_type == 'debugging':
            fallback_questions.append(PracticeQuestionResponse(
                id=i + 1,
                question_type=question_type,
                question=f"Find the error in this {subtopic_title} related code:",
                options=None,
                hint="Look for common syntax or logical errors",
                code_snippet="if x = 5:\n    print('x equals five')",
                difficulty="easy",
                subtopic_id=subtopic_id,
                order_index=i
            ))
    
    return fallback_questions

class AnswerEvaluationRequest(BaseModel):
    """Request model for AI answer evaluation"""
    question: str
    question_type: str  # mcq, numerical, caseStudy, codeCompletion, debugging
    correct_answer: str
    user_answer: str
    context: Optional[str] = None
    code_snippet: Optional[str] = None
    model: str = "openrouter:meta-llama/llama-3.2-3b-instruct:free"

class AnswerEvaluationResponse(BaseModel):
    """Response model for AI answer evaluation"""
    is_correct: bool
    feedback: str
    score: float  # 0.0 to 1.0
    explanation: str

async def evaluate_answer_with_ai(
    question: str,
    question_type: str,
    correct_answer: str,
    user_answer: str,
    context: Optional[str] = None,
    code_snippet: Optional[str] = None,
    model: str = "openrouter:meta-llama/llama-3.2-3b-instruct:free"
) -> AnswerEvaluationResponse:
    """Evaluate a practice answer using AI for intelligent assessment"""
    
    request = AnswerEvaluationRequest(
        question=question,
        question_type=question_type,
        correct_answer=correct_answer,
        user_answer=user_answer,
        context=context,
        code_snippet=code_snippet,
        model=model
    )
    
    try:
        # Use AI to evaluate the answer
        result = await ai_executor.execute(
            task_type="answer_evaluation",
            request_data=request,
            response_schema=AnswerEvaluationResponse,
            is_json=True
        )
        
        return result["response"]
        
    except Exception as e:
        logger.error(f"AI answer evaluation failed: {e}")
        
        # Fallback to simple evaluation if AI fails
        simple_correct = user_answer.strip().lower() == correct_answer.strip().lower()
        return AnswerEvaluationResponse(
            is_correct=simple_correct,
            feedback="Answer evaluated using simple matching due to AI unavailability",
            score=1.0 if simple_correct else 0.0,
            explanation="Basic string comparison was used for evaluation"
        )