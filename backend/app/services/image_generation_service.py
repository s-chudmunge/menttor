import asyncio
import aiohttp
import logging
from typing import Optional, Dict, Any
from core.config import settings
import base64
import hashlib
import json
from vertexai import init
from vertexai.preview.vision_models import ImageGenerationModel

logger = logging.getLogger(__name__)

class ImageGenerator:
    """Generate educational diagrams using Vertex AI Imagen."""
    
    def __init__(self):
        self.session = None
        self._vertex_initialized = False
        self._imagen_model = None
        
        # Initialize Vertex AI if not already done
        if settings.VERTEX_AI_PROJECT_ID and settings.VERTEX_AI_REGION:
            try:
                init(project=settings.VERTEX_AI_PROJECT_ID, location=settings.VERTEX_AI_REGION)
                self._imagen_model = ImageGenerationModel.from_pretrained("imagegeneration@006")
                self._vertex_initialized = True
                logger.info("Successfully initialized Vertex AI Imagen model")
            except Exception as e:
                logger.error(f"Failed to initialize Vertex AI Imagen: {e}")
                self._vertex_initialized = False
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def _create_educational_prompt(self, concept: str, subject: str, specific_content: str) -> str:
        """Create a specific prompt for educational diagram generation."""
        
        # Extract key technical terms and context
        content_lower = specific_content.lower()
        
        # Base educational style
        base_style = "educational diagram, clean white background, technical illustration, clear labels, professional textbook style"
        
        # Subject-specific enhancements
        subject_styles = {
            "physics": "physics diagram, scientific illustration, clear vectors and forces, labeled components, technical drawing",
            "electrical": "electrical circuit diagram, schematic diagram, electronic components, clean lines, engineering drawing", 
            "mechanical": "mechanical engineering diagram, cross-section view, technical blueprint, engineering drawing",
            "computer science": "system architecture diagram, flow chart, network diagram, clean technical illustration",
            "chemistry": "molecular structure, chemical diagram, laboratory illustration, scientific drawing",
            "biology": "anatomical diagram, biological illustration, scientific drawing, clear cellular structures",
            "mathematics": "mathematical graph, geometric diagram, clean mathematical illustration",
            "engineering": "engineering diagram, technical schematic, blueprint style, professional drawing"
        }
        
        # Determine subject category
        subject_key = None
        for key in subject_styles:
            if key in subject.lower():
                subject_key = key
                break
        
        if not subject_key:
            # Try to infer from content
            if any(term in content_lower for term in ["circuit", "voltage", "current", "resistance", "capacitor", "inductor"]):
                subject_key = "electrical"
            elif any(term in content_lower for term in ["force", "velocity", "acceleration", "energy", "momentum"]):
                subject_key = "physics"
            elif any(term in content_lower for term in ["algorithm", "network", "api", "database", "server"]):
                subject_key = "computer science"
            elif any(term in content_lower for term in ["molecule", "atom", "reaction", "chemical"]):
                subject_key = "chemistry"
        
        # Build specific prompt
        style = subject_styles.get(subject_key, "technical diagram, educational illustration")
        
        # Create specific prompt based on content analysis
        specific_elements = self._extract_diagram_elements(specific_content, subject_key)
        
        prompt = f"{concept}, {specific_elements}, {style}, {base_style}, high quality, detailed, clear, educational"
        
        # Validate and enhance prompt accuracy
        prompt = self._validate_prompt_accuracy(prompt, concept, specific_content)
        
        # Add negative prompt elements for better quality
        negative_elements = "blurry, low quality, cartoon, anime, photographic, realistic people, cluttered, messy, handwritten text, incorrect labels, wrong anatomy, unrelated content"
        
        return prompt, negative_elements
    
    def _extract_diagram_elements(self, content: str, subject: str) -> str:
        """Extract specific elements that should be in the diagram based on content."""
        content_lower = content.lower()
        elements = []
        
        if subject == "electrical":
            if "circuit" in content_lower:
                elements.append("electrical circuit")
            if "resistor" in content_lower:
                elements.append("resistors")
            if "capacitor" in content_lower:
                elements.append("capacitors")
            if "voltage" in content_lower:
                elements.append("voltage sources")
            if "current" in content_lower:
                elements.append("current flow arrows")
            if "ohm" in content_lower:
                elements.append("ohm's law diagram")
        
        elif subject == "physics":
            if "force" in content_lower:
                elements.append("force vectors with arrows")
            if "velocity" in content_lower:
                elements.append("velocity vectors")
            if "energy" in content_lower:
                elements.append("energy level diagram")
            if "wave" in content_lower:
                elements.append("wave diagram with wavelength and amplitude")
            if "motion" in content_lower:
                elements.append("motion trajectory")
        
        elif subject == "computer science":
            if "api" in content_lower:
                elements.append("API architecture diagram")
            if "database" in content_lower:
                elements.append("database schema")
            if "network" in content_lower:
                elements.append("network topology")
            if "algorithm" in content_lower:
                elements.append("flowchart diagram")
        
        elif subject == "chemistry":
            if "molecule" in content_lower:
                elements.append("molecular structure")
            if "bond" in content_lower:
                elements.append("chemical bonds")
            if "reaction" in content_lower:
                elements.append("chemical reaction pathway")
        
        
        # If no specific elements found, use the concept itself
        if not elements:
            # Extract the first few meaningful words
            words = content.split()[:10]
            meaningful_words = [w for w in words if len(w) > 3 and w.lower() not in ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'this', 'that', 'with', 'from']][:3]
            elements = meaningful_words
        
        return ", ".join(elements) if elements else "technical diagram"
    
    def _clean_concept_name(self, concept: str, content: str) -> str:
        """Extract the most relevant concept from content."""
        content_lower = content.lower()
        concept_lower = concept.lower()
        
        # If concept appears in content, use it as-is
        if concept_lower in content_lower:
            return concept
        
        # Extract the first significant noun/concept from content
        words = content.split()
        for word in words[:20]:  # Check first 20 words
            clean_word = word.strip('.,!?":()[]{}').lower()
            if len(clean_word) > 4 and clean_word != concept_lower:
                # Check if this word appears multiple times (likely important)
                if content_lower.count(clean_word) >= 2:
                    return clean_word.title()
        
        return concept
    
    def _validate_prompt_accuracy(self, prompt: str, concept: str, content: str) -> str:
        """Dynamically enhance prompt with key terms from content."""
        content_lower = content.lower()
        
        # Extract key terms that appear frequently in content
        words = content.split()
        word_counts = {}
        
        for word in words:
            clean_word = word.strip('.,!?":()[]{}').lower()
            if len(clean_word) > 4:  # Significant words only
                word_counts[clean_word] = word_counts.get(clean_word, 0) + 1
        
        # Get top 3 most frequent meaningful terms
        frequent_terms = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        # Add these terms to prompt if not already present
        for term, count in frequent_terms:
            if count >= 2 and term.lower() not in prompt.lower():
                prompt += f", {term}"
                
        return prompt
    
    async def _generate_with_vertex_ai(self, concept: str, subject: str, specific_content: str) -> Dict[str, Any]:
        """Generate image using Vertex AI Imagen."""
        # Create enhanced educational prompt for better accuracy
        enhanced_prompt, negative_prompt = self._create_educational_prompt(concept, subject, specific_content)
        
        # Clean and validate the concept name for consistency
        clean_concept = self._clean_concept_name(concept, specific_content)
        
        logger.info(f"Generating image with Vertex AI Imagen: {enhanced_prompt}")
        logger.info(f"Negative prompt: {negative_prompt}")
        
        try:
            # Generate image with Imagen using enhanced prompts
            response = self._imagen_model.generate_images(
                prompt=enhanced_prompt,
                negative_prompt=negative_prompt,
                number_of_images=1,
                aspect_ratio="1:1",
                safety_filter_level="block_some",
                person_generation="dont_allow"
            )
            
            if response.images:
                # Get the first generated image
                image = response.images[0]
                
                # Convert Vertex AI Image to base64
                import io
                
                # Vertex AI images have _image_bytes attribute
                if hasattr(image, '_image_bytes'):
                    image_bytes = image._image_bytes
                else:
                    # Alternative: save to buffer and read
                    img_buffer = io.BytesIO()
                    image.save(img_buffer)
                    image_bytes = img_buffer.getvalue()
                
                # Encode to base64
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                image_data_url = f"data:image/png;base64,{image_base64}"
                
                content_hash = hashlib.md5(f"{concept}_{subject}_{specific_content}".encode()).hexdigest()[:8]
                
                return {
                    "url": image_data_url,
                    "prompt": enhanced_prompt,
                    "model": "vertex-ai-imagen",
                    "concept": clean_concept,
                    "subject": subject,
                    "hash": content_hash
                }
            else:
                raise Exception("No images generated by Vertex AI Imagen")
                
        except Exception as e:
            logger.error(f"Vertex AI Imagen generation failed: {e}")
            raise e
    
    async def generate_educational_image(
        self, 
        concept: str, 
        subject: str, 
        specific_content: str,
        width: int = 512,
        height: int = 512
    ) -> Optional[Dict[str, Any]]:
        """Generate an educational image for the specific concept and content."""
        
        # Use Vertex AI Imagen for image generation
        if self._vertex_initialized and self._imagen_model:
            try:
                return await self._generate_with_vertex_ai(concept, subject, specific_content)
            except Exception as e:
                logger.error(f"Vertex AI Imagen generation failed: {e}")
                # Fall through to placeholder generation
        
        if settings.DISABLE_IMAGE_GENERATION:
            logger.info("Image generation disabled via DISABLE_IMAGE_GENERATION setting.")
            # Create disabled SVG
            disabled_svg = f'''<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f9ff" stroke="#0284c7" stroke-width="2"/>
  <text x="50%" y="35%" font-family="Arial" font-size="16" fill="#0369a1" text-anchor="middle" dy=".3em">📊 {concept}</text>
  <text x="50%" y="50%" font-family="Arial" font-size="12" fill="#0284c7" text-anchor="middle" dy=".3em">{subject}</text>
  <text x="50%" y="65%" font-family="Arial" font-size="10" fill="#64748b" text-anchor="middle" dy=".3em">Diagram placeholder</text>
</svg>'''
            disabled_svg_b64 = base64.b64encode(disabled_svg.encode()).decode()
            
            return {
                "url": f"data:image/svg+xml;base64,{disabled_svg_b64}",
                "prompt": f"Disabled: {concept} in {subject}",
                "model": "disabled",
                "concept": concept,
                "subject": subject,
                "hash": "disabled"
            }
        
        if not self._vertex_initialized:
            logger.error("Vertex AI Imagen not initialized. Check VERTEX_AI_PROJECT_ID and VERTEX_AI_REGION.")
            # Create not configured SVG
            config_svg = '''<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffebee" stroke="#f55555" stroke-width="2"/>
  <text x="50%" y="40%" font-family="Arial" font-size="14" fill="#dc2626" text-anchor="middle" dy=".3em">Image Generation</text>
  <text x="50%" y="55%" font-family="Arial" font-size="12" fill="#dc2626" text-anchor="middle" dy=".3em">Not Configured</text>
</svg>'''
            config_svg_b64 = base64.b64encode(config_svg.encode()).decode()
            
            return {
                "url": f"data:image/svg+xml;base64,{config_svg_b64}",
                "prompt": f"Not configured for {concept} in {subject}",
                "model": "not-configured",
                "concept": concept,
                "subject": subject,
                "hash": "not-configured"
            }
        
        # Fallback to a placeholder if Vertex AI failed
        logger.warning("Falling back to placeholder image")
        placeholder_svg = f'''<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f9ff" stroke="#0284c7" stroke-width="2"/>
  <text x="50%" y="35%" font-family="Arial" font-size="16" fill="#0369a1" text-anchor="middle" dy=".3em">📊 {concept}</text>
  <text x="50%" y="50%" font-family="Arial" font-size="12" fill="#0284c7" text-anchor="middle" dy=".3em">{subject}</text>
  <text x="50%" y="65%" font-family="Arial" font-size="10" fill="#64748b" text-anchor="middle" dy=".3em">Diagram placeholder</text>
</svg>'''
        placeholder_svg_b64 = base64.b64encode(placeholder_svg.encode()).decode()
        
        return {
            "url": f"data:image/svg+xml;base64,{placeholder_svg_b64}",
            "prompt": f"Placeholder for {concept} in {subject}",
            "model": "placeholder",
            "concept": concept,
            "subject": subject,
            "hash": "placeholder"
        }
    
    async def generate_multiple_options(
        self, 
        concept: str, 
        subject: str, 
        specific_content: str
    ) -> Dict[str, Any]:
        """Generate multiple image options and return the best one."""
        
        tasks = []
        for model_key, model_name in self.models.items():
            task = self.generate_educational_image(concept, subject, specific_content)
            tasks.append(task)
        
        try:
            # Try to generate with primary model first
            result = await self.generate_educational_image(concept, subject, specific_content)
            if result:
                return result
            else:
                logger.warning(f"Failed to generate image for concept: {concept}")
                return None
                
        except Exception as e:
            logger.error(f"Error in multiple generation: {e}")
            return None


# Singleton instance
image_generator = ImageGenerator()

async def generate_diagram_for_content(
    concept: str,
    subject: str, 
    specific_content: str,
    width: int = 512,
    height: int = 512
) -> Optional[Dict[str, Any]]:
    """Public interface for generating educational diagrams."""
    
    async with image_generator as generator:
        return await generator.generate_educational_image(
            concept=concept,
            subject=subject, 
            specific_content=specific_content,
            width=width,
            height=height
        )