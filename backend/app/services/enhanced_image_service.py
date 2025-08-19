import asyncio
import aiohttp
import logging
from typing import Optional, Dict, Any, List
from core.config import settings
import base64
import hashlib
import re
from vertexai import init
from vertexai.preview.vision_models import ImageGenerationModel

logger = logging.getLogger(__name__)

class UniversalImageGenerator:
    """Fast, universal educational image generator - no subject rules, optimized for speed and tokens."""
    
    def __init__(self):
        self.session = None
        self._vertex_initialized = False
        self._imagen_model = None
        
        # Initialize Vertex AI
        if settings.VERTEX_AI_PROJECT_ID and settings.VERTEX_AI_REGION:
            try:
                init(project=settings.VERTEX_AI_PROJECT_ID, location=settings.VERTEX_AI_REGION)
                self._imagen_model = ImageGenerationModel.from_pretrained("imagegeneration@006")
                self._vertex_initialized = True
                logger.info("Universal image generator ready")
            except Exception as e:
                logger.error(f"Failed to initialize Vertex AI: {e}")
                self._vertex_initialized = False
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def _extract_core_concepts(self, content: str, limit: int = 3) -> List[str]:
        """Fast extraction of key concepts without subject rules."""
        # Remove common words and extract meaningful terms
        text = re.sub(r'[^\w\s]', ' ', content.lower())
        words = text.split()
        
        # Filter meaningful words (4+ chars, not common words)
        stop_words = {
            'this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 
            'each', 'which', 'their', 'time', 'will', 'about', 'would', 'there',
            'could', 'other', 'after', 'first', 'well', 'also', 'many', 'some'
        }
        
        meaningful_words = [
            word for word in words 
            if len(word) >= 4 and word not in stop_words
        ]
        
        # Count frequency and get top terms
        word_freq = {}
        for word in meaningful_words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency and take top concepts
        top_concepts = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:limit]
        return [concept[0] for concept in top_concepts]
    
    def _detect_content_type(self, content: str) -> str:
        """Fast detection of content type for appropriate visualization."""
        content_lower = content.lower()
        
        # Pattern matching for visualization types
        if any(word in content_lower for word in ['process', 'step', 'first', 'then', 'next', 'finally']):
            return 'process'
        elif any(word in content_lower for word in ['compare', 'difference', 'versus', 'vs', 'between']):
            return 'comparison'
        elif any(word in content_lower for word in ['structure', 'component', 'part', 'consists', 'contains']):
            return 'structure'
        elif any(word in content_lower for word in ['relationship', 'connect', 'link', 'related', 'causes']):
            return 'relationship'
        elif any(word in content_lower for word in ['formula', 'equation', 'calculate', '=', '+', '-', '*', '/']):
            return 'formula'
        else:
            return 'concept'
    
    def _create_learning_prompt(self, concept: str, content: str) -> tuple[str, str]:
        """Generate minimal, effective prompt optimized for learning and speed."""
        
        # Extract 2-3 key concepts for focus
        key_concepts = self._extract_core_concepts(content, limit=2)
        content_type = self._detect_content_type(content)
        
        # Build focused, minimal prompt
        main_concept = concept if concept else (key_concepts[0] if key_concepts else "concept")
        
        # Type-specific prompt templates (minimal for speed)
        prompt_templates = {
            'process': f"Step-by-step diagram: {main_concept}, clear numbered steps, arrows showing flow",
            'comparison': f"Comparison chart: {main_concept}, side-by-side layout, clear differences",
            'structure': f"Structure diagram: {main_concept}, labeled components, clear organization",
            'relationship': f"Relationship diagram: {main_concept}, connected elements, clear connections",
            'formula': f"Formula illustration: {main_concept}, clear mathematical representation",
            'concept': f"Concept diagram: {main_concept}, visual explanation, clear elements"
        }
        
        base_prompt = prompt_templates.get(content_type, prompt_templates['concept'])
        
        # Add key concepts if different from main concept
        if key_concepts and key_concepts[0] != main_concept:
            additional_concepts = ", ".join(key_concepts[:2])
            base_prompt += f", showing {additional_concepts}"
        
        # Universal educational style (minimal tokens)
        style = "educational diagram, clean white background, clear labels, simple professional style"
        
        final_prompt = f"{base_prompt}, {style}"
        
        # Negative prompt (keep short for speed)
        negative_prompt = "blurry, cluttered, decorative, photographic, cartoon, wrong labels"
        
        return final_prompt, negative_prompt
    
    async def _generate_with_vertex_ai(self, concept: str, content: str) -> Dict[str, Any]:
        """Fast Vertex AI generation with minimal processing."""
        
        # Generate optimized prompt
        prompt, negative_prompt = self._create_learning_prompt(concept, content)
        
        logger.info(f"Generating with prompt: {prompt}")
        
        try:
            # Generate with optimized settings for speed
            response = self._imagen_model.generate_images(
                prompt=prompt,
                negative_prompt=negative_prompt,
                number_of_images=1,
                aspect_ratio="1:1",
                safety_filter_level="block_few",  # Faster than block_some
                person_generation="dont_allow"
            )
            
            if response.images:
                image = response.images[0]
                
                # Fast image processing
                if hasattr(image, '_image_bytes'):
                    image_bytes = image._image_bytes
                else:
                    import io
                    img_buffer = io.BytesIO()
                    image.save(img_buffer)
                    image_bytes = img_buffer.getvalue()
                
                # Encode to base64
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                image_data_url = f"data:image/png;base64,{image_base64}"
                
                return {
                    "url": image_data_url,
                    "prompt": prompt,
                    "model": "vertex-ai-imagen-optimized",
                    "concept": concept,
                    "type": self._detect_content_type(content)
                }
            else:
                raise Exception("No images generated")
                
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            raise e
    
    def _create_fallback_svg(self, concept: str, content: str) -> Dict[str, Any]:
        """Fast SVG fallback based on content analysis."""
        content_type = self._detect_content_type(content)
        key_concepts = self._extract_core_concepts(content, limit=2)
        
        # Simple SVG templates for different content types
        svg_templates = {
            'process': self._create_process_svg(concept, key_concepts),
            'comparison': self._create_comparison_svg(concept, key_concepts),
            'structure': self._create_structure_svg(concept, key_concepts),
            'relationship': self._create_relationship_svg(concept, key_concepts),
            'formula': self._create_formula_svg(concept, key_concepts),
            'concept': self._create_concept_svg(concept, key_concepts)
        }
        
        svg_content = svg_templates.get(content_type, svg_templates['concept'])
        svg_base64 = base64.b64encode(svg_content.encode()).decode()
        
        return {
            "url": f"data:image/svg+xml;base64,{svg_base64}",
            "prompt": f"Fallback diagram for {concept}",
            "model": "svg-fallback",
            "concept": concept,
            "type": content_type
        }
    
    def _create_process_svg(self, concept: str, concepts: List[str]) -> str:
        """Create process flow SVG."""
        steps = concepts[:3] if concepts else ["Step 1", "Step 2", "Step 3"]
        return f'''<svg width="512" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="256" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">{concept}</text>
  
  <rect x="50" y="80" width="120" height="40" fill="#e3f2fd" stroke="#1976d2" stroke-width="2" rx="5"/>
  <text x="110" y="105" text-anchor="middle" font-family="Arial" font-size="12">{steps[0] if len(steps) > 0 else "Start"}</text>
  
  <line x1="170" y1="100" x2="200" y2="100" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  
  <rect x="220" y="80" width="120" height="40" fill="#e8f5e8" stroke="#2e7d32" stroke-width="2" rx="5"/>
  <text x="280" y="105" text-anchor="middle" font-family="Arial" font-size="12">{steps[1] if len(steps) > 1 else "Process"}</text>
  
  <line x1="340" y1="100" x2="370" y2="100" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  
  <rect x="390" y="80" width="120" height="40" fill="#fff3e0" stroke="#f57c00" stroke-width="2" rx="5"/>
  <text x="450" y="105" text-anchor="middle" font-family="Arial" font-size="12">{steps[2] if len(steps) > 2 else "Result"}</text>
  
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#666"/>
    </marker>
  </defs>
</svg>'''
    
    def _create_comparison_svg(self, concept: str, concepts: List[str]) -> str:
        """Create comparison chart SVG."""
        item1 = concepts[0] if len(concepts) > 0 else "Option A"
        item2 = concepts[1] if len(concepts) > 1 else "Option B"
        
        return f'''<svg width="512" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="256" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">{concept} Comparison</text>
  
  <rect x="50" y="80" width="180" height="150" fill="#e3f2fd" stroke="#1976d2" stroke-width="2" rx="5"/>
  <text x="140" y="105" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">{item1}</text>
  
  <text x="140" y="130" text-anchor="middle" font-family="Arial" font-size="11">Key features</text>
  <text x="140" y="150" text-anchor="middle" font-family="Arial" font-size="11">and properties</text>
  
  <rect x="280" y="80" width="180" height="150" fill="#e8f5e8" stroke="#2e7d32" stroke-width="2" rx="5"/>
  <text x="370" y="105" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">{item2}</text>
  
  <text x="370" y="130" text-anchor="middle" font-family="Arial" font-size="11">Key features</text>
  <text x="370" y="150" text-anchor="middle" font-family="Arial" font-size="11">and properties</text>
  
  <line x1="256" y1="60" x2="256" y2="250" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
</svg>'''
    
    def _create_structure_svg(self, concept: str, concepts: List[str]) -> str:
        """Create structure diagram SVG."""
        return f'''<svg width="512" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="256" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">{concept} Structure</text>
  
  <rect x="180" y="60" width="150" height="40" fill="#e3f2fd" stroke="#1976d2" stroke-width="2" rx="5"/>
  <text x="255" y="85" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">Main Component</text>
  
  <line x1="255" y1="100" x2="255" y2="130" stroke="#666" stroke-width="2"/>
  <line x1="180" y1="130" x2="330" y2="130" stroke="#666" stroke-width="2"/>
  
  <line x1="210" y1="130" x2="210" y2="160" stroke="#666" stroke-width="2"/>
  <line x1="300" y1="130" x2="300" y2="160" stroke="#666" stroke-width="2"/>
  
  <rect x="140" y="160" width="140" height="35" fill="#e8f5e8" stroke="#2e7d32" stroke-width="2" rx="5"/>
  <text x="210" y="182" text-anchor="middle" font-family="Arial" font-size="11">{concepts[0] if len(concepts) > 0 else "Component 1"}</text>
  
  <rect x="300" y="160" width="140" height="35" fill="#fff3e0" stroke="#f57c00" stroke-width="2" rx="5"/>
  <text x="370" y="182" text-anchor="middle" font-family="Arial" font-size="11">{concepts[1] if len(concepts) > 1 else "Component 2"}</text>
</svg>'''
    
    def _create_relationship_svg(self, concept: str, concepts: List[str]) -> str:
        """Create relationship diagram SVG."""
        item1 = concepts[0] if len(concepts) > 0 else "Element A"
        item2 = concepts[1] if len(concepts) > 1 else "Element B"
        
        return f'''<svg width="512" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="256" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">{concept} Relationship</text>
  
  <circle cx="150" cy="150" r="60" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>
  <text x="150" y="155" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">{item1}</text>
  
  <circle cx="350" cy="150" r="60" fill="#e8f5e8" stroke="#2e7d32" stroke-width="2"/>
  <text x="350" y="155" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">{item2}</text>
  
  <line x1="210" y1="150" x2="290" y2="150" stroke="#666" stroke-width="3" marker-end="url(#arrow)"/>
  <text x="250" y="140" text-anchor="middle" font-family="Arial" font-size="11">affects</text>
  
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#666"/>
    </marker>
  </defs>
</svg>'''
    
    def _create_formula_svg(self, concept: str, concepts: List[str]) -> str:
        """Create formula visualization SVG."""
        return f'''<svg width="512" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="256" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">{concept}</text>
  
  <rect x="150" y="80" width="212" height="60" fill="#f5f5f5" stroke="#666" stroke-width="2" rx="5"/>
  <text x="256" y="115" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold">Formula/Equation</text>
  
  <text x="100" y="180" font-family="Arial" font-size="12">Where:</text>
  <text x="120" y="200" font-family="Arial" font-size="11">{concepts[0] if len(concepts) > 0 else "Variable 1"} = explanation</text>
  <text x="120" y="220" font-family="Arial" font-size="11">{concepts[1] if len(concepts) > 1 else "Variable 2"} = explanation</text>
</svg>'''
    
    def _create_concept_svg(self, concept: str, concepts: List[str]) -> str:
        """Create general concept diagram SVG."""
        return f'''<svg width="512" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="256" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">{concept}</text>
  
  <circle cx="256" cy="150" r="80" fill="#e3f2fd" stroke="#1976d2" stroke-width="3"/>
  <text x="256" y="155" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">Core Concept</text>
  
  {f'<rect x="100" y="220" width="120" height="30" fill="#e8f5e8" stroke="#2e7d32" stroke-width="2" rx="3"/><text x="160" y="240" text-anchor="middle" font-family="Arial" font-size="11">{concepts[0]}</text>' if len(concepts) > 0 else ''}
  
  {f'<rect x="300" y="220" width="120" height="30" fill="#fff3e0" stroke="#f57c00" stroke-width="2" rx="3"/><text x="360" y="240" text-anchor="middle" font-family="Arial" font-size="11">{concepts[1]}</text>' if len(concepts) > 1 else ''}
</svg>'''
    
    async def generate_learning_image(
        self, 
        concept: str, 
        content: str,
        width: int = 512,
        height: int = 512
    ) -> Optional[Dict[str, Any]]:
        """Generate educational image optimized for learning, speed, and cost."""
        
        try:
            # Try Vertex AI first (with timeout for speed)
            if self._vertex_initialized and self._imagen_model:
                return await asyncio.wait_for(
                    self._generate_with_vertex_ai(concept, content),
                    timeout=15.0  # 15 second timeout for speed
                )
        except asyncio.TimeoutError:
            logger.warning("AI generation timeout, using fallback")
        except Exception as e:
            logger.error(f"AI generation failed: {e}")
        
        # Fast SVG fallback
        return self._create_fallback_svg(concept, content)


# Singleton instance
universal_generator = UniversalImageGenerator()

async def generate_learning_visual(
    concept: str,
    content: str,
    width: int = 512,
    height: int = 512
) -> Optional[Dict[str, Any]]:
    """Public interface for fast, universal educational image generation."""
    
    async with universal_generator as generator:
        return await generator.generate_learning_image(
            concept=concept,
            content=content,
            width=width,
            height=height
        )