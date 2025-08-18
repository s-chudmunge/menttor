import asyncio
import aiohttp
from typing import List, Dict, Any, Optional
import logging
from huggingface_hub import HfApi

logger = logging.getLogger(__name__)

class HuggingFaceModelFetcher:
    """Fetch top reasoning + instruction-tuned text-generation models from HuggingFace Hub."""

    def __init__(self):
        self.base_url = "https://huggingface.co/api"
        self.session = None
        self.hf_api = HfApi()

        # Free/open licenses
        self.free_licenses = {
            'apache-2.0', 'mit', 'bsd-3-clause', 'bsd-2-clause',
            'cc0-1.0', 'unlicense', 'wtfpl', 'cc-by-4.0',
            'cc-by-sa-4.0', 'openrail', 'bigscience-openrail-m',
            'openrail++', 'llama2', 'llama3'
        }

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def _fetch_models_from_hub(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch top reasoning + text-generation models from HuggingFace Hub."""
        try:
            tags_to_fetch = ["text-generation", "causal-lm"]
            seen_ids = set()
            all_models = []

            for tag in tags_to_fetch:
                models = self.hf_api.list_models(
                    pipeline_tag=tag,
                    sort="downloads",
                    direction=-1,
                    limit=limit * 2  # over-fetch to allow filtering
                )
                for m in models:
                    lower_id = m.id.lower()

                    # Skip encoder-only models
                    if any(skip in lower_id for skip in [
                        "bert", "roberta", "deberta", "xlm", "albert"
                    ]):
                        continue

                    # Require instruction/chat/assistant tuning
                    if not any(keyword in lower_id for keyword in [
                        "instruct", "chat", "it", "assistant"
                    ]):
                        continue

                    m_dict = {
                        "id": m.id,
                        "description": (m.cardData.get("description") if getattr(m, "cardData", None) else None),
                        "tags": getattr(m, "tags", []) or [],
                        "license": (m.cardData.get("license") if getattr(m, "cardData", None) else "unknown"),
                        "downloads": getattr(m, "downloads", 0),
                        "likes": getattr(m, "likes", 0),
                        "config": getattr(m, "config", {}) or {}
                    }
                    if m_dict["id"] not in seen_ids:
                        seen_ids.add(m_dict["id"])
                        all_models.append(m_dict)

            # Sort by downloads and return top N
            all_models.sort(key=lambda x: x.get("downloads", 0), reverse=True)
            return all_models[:limit]

        except Exception as e:
            logger.error(f"Error fetching models from HuggingFace Hub: {e}")
            return []

    def _is_model_free_and_commercially_usable(self, model_info: Dict[str, Any]) -> bool:
        """Check if model has free/commercially usable license."""
        license_tag = model_info.get('license', '').lower()

        if license_tag in self.free_licenses:
            return True
        if not license_tag or any(k in license_tag for k in ['open', 'permissive', 'free']):
            return True

        model_id = model_info.get('id', '').lower()
        if any(k in model_id for k in ['gemma', 'llama', 'mistral', 'mixtral', 'phi']):
            return True

        return False

    def _extract_model_details(self, model_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract relevant model details."""
        try:
            model_id = model_info.get('id', '')
            if not model_id:
                return None

            config = model_info.get('config', {}) or {}
            context_window = config.get('max_position_embeddings', 4096)

            return {
                "id": f"huggingface:{model_id}",
                "name": model_id.split('/')[-1],
                "description": model_info.get('description', f"HuggingFace model: {model_id}"),
                "context_window": context_window,
                "per_token_cost": 0,
                "per_image_cost": 0,
                "per_completion_cost": 0,
                "max_tokens": context_window,
                "top_provider": "HuggingFace",
                "free_trial": True,
                "downloads": model_info.get('downloads', 0),
                "likes": model_info.get('likes', 0),
                "license": model_info.get('license', 'unknown'),
                "tags": model_info.get('tags', [])
            }
        except Exception as e:
            logger.warning(f"Error extracting details for model {model_info.get('id', 'unknown')}: {e}")
            return None

    async def fetch_models(self, limit: int = 100, free_only: bool = False) -> List[Dict[str, Any]]:
        """Fetch models, optionally filtering only free-to-use ones."""
        models_data = await self._fetch_models_from_hub(limit=limit)
        if not models_data:
            logger.warning("No models fetched from HuggingFace Hub. Using fallback list.")
            return get_fallback_models()

        extracted_models = []
        for model_info in models_data:
            if not free_only or self._is_model_free_and_commercially_usable(model_info):
                details = self._extract_model_details(model_info)
                if details:
                    extracted_models.append(details)

        if not extracted_models:
            logger.warning("No matching models found. Using fallback list.")
            return get_fallback_models()

        return extracted_models

    async def get_model_info(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed info for a specific model."""
        try:
            m = self.hf_api.model_info(model_id.replace("huggingface:", ""))
            model_info = {
                "id": m.id,
                "description": (m.cardData.get("description") if getattr(m, "cardData", None) else None),
                "tags": getattr(m, "tags", []) or [],
                "license": (m.cardData.get("license") if getattr(m, "cardData", None) else "unknown"),
                "downloads": getattr(m, "downloads", 0),
                "likes": getattr(m, "likes", 0),
                "config": getattr(m, "config", {}) or {}
            }
            return self._extract_model_details(model_info)
        except Exception as e:
            logger.error(f"Error fetching model {model_id}: {e}")
            return None


def get_fallback_models() -> List[Dict[str, Any]]:
    """Fallback list of strong open LLMs."""
    return [
        {
            "id": "huggingface:google/gemma-7b-it",
            "name": "Gemma 7B (Google)",
            "description": "Google's powerful and lightweight open model, instruction-tuned.",
            "context_window": 8192,
            "per_token_cost": 0,
            "per_image_cost": 0,
            "per_completion_cost": 0,
            "max_tokens": 8192,
            "top_provider": "HuggingFace",
            "free_trial": True,
            "downloads": 0,
            "license": "apache-2.0"
        },
        {
            "id": "huggingface:meta-llama/Meta-Llama-3-8B-Instruct",
            "name": "Llama 3 8B (Meta)",
            "description": "Meta's highly capable instruction-following model.",
            "context_window": 8192,
            "per_token_cost": 0,
            "per_image_cost": 0,
            "per_completion_cost": 0,
            "max_tokens": 8192,
            "top_provider": "HuggingFace",
            "free_trial": True,
            "downloads": 0,
            "license": "llama3"
        },
        {
            "id": "huggingface:mistralai/Mistral-7B-Instruct-v0.2",
            "name": "Mistral 7B Instruct",
            "description": "A popular and powerful instruction-tuned model from Mistral AI.",
            "context_window": 32768,
            "per_token_cost": 0,
            "per_image_cost": 0,
            "per_completion_cost": 0,
            "max_tokens": 32768,
            "top_provider": "HuggingFace",
            "free_trial": True,
            "downloads": 0,
            "license": "apache-2.0"
        }
    ]

