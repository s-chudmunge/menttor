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
        """Enhanced extraction of key educational concepts with domain awareness."""
        # Clean and prepare text
        text = re.sub(r'[^\w\s]', ' ', content.lower())
        words = text.split()
        
        # Comprehensive stop words for educational content
        stop_words = {
            'this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 
            'each', 'which', 'their', 'time', 'will', 'about', 'would', 'there',
            'could', 'other', 'after', 'first', 'well', 'also', 'many', 'some',
            'what', 'when', 'where', 'while', 'because', 'during', 'before',
            'example', 'examples', 'such', 'like', 'including', 'used', 'using'
        }
        
        # Extract meaningful terms with better filtering
        meaningful_words = []
        for word in words:
            if (len(word) >= 3 and 
                word not in stop_words and 
                not word.isdigit() and 
                not re.match(r'^[a-z]{1,2}$', word)):  # Skip single/double letters
                meaningful_words.append(word)
        
        # Enhanced concept scoring considering educational importance
        word_scores = {}
        for word in meaningful_words:
            score = meaningful_words.count(word)
            
            # Boost technical/educational terms
            if any(indicator in word for indicator in ['tion', 'ing', 'ment', 'ness', 'ity']):
                score *= 1.3
            
            # Boost programming/technical terms
            if any(indicator in word for indicator in ['code', 'function', 'variable', 'method', 'class']):
                score *= 1.5
                
            # Boost scientific/mathematical terms
            if any(indicator in word for indicator in ['formula', 'equation', 'theory', 'principle', 'law']):
                score *= 1.4
                
            word_scores[word] = score
        
        # Get top concepts with minimum score threshold
        sorted_concepts = sorted(word_scores.items(), key=lambda x: x[1], reverse=True)
        valid_concepts = [concept[0] for concept in sorted_concepts if concept[1] >= 1]
        
        return valid_concepts[:limit] if valid_concepts else ['concept']
    
    def _detect_content_type(self, content: str) -> str:
        """Enhanced detection of content type with domain-specific patterns."""
        content_lower = content.lower()
        
        # Check for programming/code content
        programming_indicators = [
            'operator', 'variable', 'function', 'class', 'method', 'loop', 'conditional',
            'array', 'object', 'string', 'integer', 'boolean', 'syntax', '+=', '-=', '*=',
            'def ', 'int ', 'str ', 'list', 'dict', 'import', 'return', 'print'
        ]
        if any(indicator in content_lower for indicator in programming_indicators):
            return 'programming'
            
        # Check for mathematical/scientific content
        math_indicators = [
            'formula', 'equation', 'theorem', 'proof', 'derivative', 'integral',
            'calculate', 'solve', 'variable', '=', '+', '-', '*', '/', '^',
            'mathematics', 'algebra', 'geometry', 'calculus', 'statistics'
        ]
        if any(indicator in content_lower for indicator in math_indicators):
            return 'mathematics'
            
        # Check for scientific content
        science_indicators = [
            'molecule', 'atom', 'cell', 'DNA', 'protein', 'reaction', 'experiment',
            'hypothesis', 'theory', 'law', 'physics', 'chemistry', 'biology',
            'force', 'energy', 'mass', 'velocity', 'acceleration', 'electron'
        ]
        if any(indicator in content_lower for indicator in science_indicators):
            return 'science'
            
        # Check for business/economics content
        business_indicators = [
            'market', 'profit', 'revenue', 'customer', 'strategy', 'analysis',
            'management', 'finance', 'economics', 'supply', 'demand', 'price'
        ]
        if any(indicator in content_lower for indicator in business_indicators):
            return 'business'
            
        # Check for process/workflow content
        process_indicators = [
            'step', 'first', 'then', 'next', 'finally', 'process', 'procedure',
            'workflow', 'methodology', 'sequence', 'order', 'phase'
        ]
        if any(indicator in content_lower for indicator in process_indicators):
            return 'process'
            
        # Check for comparison content
        comparison_indicators = [
            'compare', 'contrast', 'difference', 'similar', 'versus', 'vs',
            'between', 'unlike', 'whereas', 'however', 'on the other hand'
        ]
        if any(indicator in content_lower for indicator in comparison_indicators):
            return 'comparison'
            
        # Check for structural/hierarchical content
        structure_indicators = [
            'structure', 'component', 'part', 'consists', 'contains', 'hierarchy',
            'organization', 'architecture', 'framework', 'system', 'model'
        ]
        if any(indicator in content_lower for indicator in structure_indicators):
            return 'structure'
            
        # Check for relationship/network content
        relationship_indicators = [
            'relationship', 'connect', 'link', 'related', 'causes', 'affects',
            'influence', 'interaction', 'correlation', 'network', 'dependency'
        ]
        if any(indicator in content_lower for indicator in relationship_indicators):
            return 'relationship'
            
        # Default to concept visualization
        return 'concept'
    
    def _create_learning_prompt(self, concept: str, content: str) -> tuple[str, str]:
        """Generate simple, effective educational prompt using just the subtopic name."""
        
        # Use the subtopic name directly - let the AI figure out what's educational
        main_concept = concept if concept and concept.strip() else "learning concept"
        
        # Simple, direct prompt that lets AI use its knowledge
        prompt = f"Create an educational diagram that explains '{main_concept}'. Make it clear, informative, and helpful for learning. Include relevant labels, examples, and visual elements that would help a student understand this topic better. Use clean design with good contrast and readable text."
        
        # Simple negative prompt to avoid common issues
        negative_prompt = "blurry, low quality, unclear text, cluttered, decorative only, cartoon, photorealistic, poor contrast"
        
        return prompt, negative_prompt
    
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
        """Simple SVG fallback for the concept."""
        # Just create a simple, clean concept visualization
        main_concept = concept if concept and concept.strip() else "Learning Concept"
        
        svg_content = f'''<svg width="512" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="256" y="50" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="#2563eb">{main_concept}</text>
  
  <!-- Main concept circle -->
  <circle cx="256" cy="150" r="60" fill="#dbeafe" stroke="#2563eb" stroke-width="3"/>
  <text x="256" y="155" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">Key Concept</text>
  
  <!-- Educational note -->
  <rect x="150" y="240" width="212" height="40" fill="#f1f5f9" stroke="#64748b" stroke-width="1" rx="5"/>
  <text x="256" y="258" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">Educational visualization for:</text>
  <text x="256" y="272" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#1e293b">{main_concept}</text>
</svg>'''
        
        svg_base64 = base64.b64encode(svg_content.encode()).decode()
        
        return {
            "url": f"data:image/svg+xml;base64,{svg_base64}",
            "prompt": f"Simple educational diagram for {concept}",
            "model": "svg-fallback",
            "concept": concept,
            "type": "educational"
        }
    
    def _create_programming_svg(self, concept: str, concepts: List[str]) -> str:
        """Create programming concept SVG with code examples."""
        code_example = concepts[0] if concepts else "example"
        variable = concepts[1] if len(concepts) > 1 else "variable"
        
        return f'''<svg width="512" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="256" y="25" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">{concept}</text>
  
  <!-- Code Block -->
  <rect x="50" y="50" width="400" height="120" fill="#f8f9fa" stroke="#e9ecef" stroke-width="2" rx="8"/>
  <rect x="50" y="50" width="400" height="30" fill="#343a40" rx="8"/>
  <rect x="50" y="80" width="400" height="90" fill="#f8f9fa"/>
  
  <!-- Code header -->
  <text x="70" y="70" font-family="monospace" font-size="12" fill="white">Code Example</text>
  
  <!-- Code content -->
  <text x="70" y="105" font-family="monospace" font-size="14" fill="#d73502"># {concept} example</text>
  <text x="70" y="125" font-family="monospace" font-size="14" fill="#000">{variable} = "{code_example}"</text>
  <text x="70" y="145" font-family="monospace" font-size="14" fill="#007020">print</text>
  <text x="108" y="145" font-family="monospace" font-size="14" fill="#000">({variable})</text>
  
  <!-- Explanation -->
  <text x="256" y="200" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">Programming Concept Visualization</text>
  <text x="256" y="220" text-anchor="middle" font-family="Arial" font-size="11" fill="#666">Shows: {code_example} implementation</text>
</svg>'''
    
    def _create_mathematics_svg(self, concept: str, concepts: List[str]) -> str:
        """Create mathematics concept SVG with equations."""
        var1 = concepts[0] if concepts else "x"
        var2 = concepts[1] if len(concepts) > 1 else "y"
        
        return f'''<svg width="512" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="256" y="25" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">{concept}</text>
  
  <!-- Main equation box -->
  <rect x="100" y="60" width="300" height="80" fill="#f8f9ff" stroke="#4dabf7" stroke-width="2" rx="8"/>
  <text x="250" y="85" text-anchor="middle" font-family="Times New Roman" font-size="18" font-weight="bold">Mathematical Formula</text>
  <text x="250" y="110" text-anchor="middle" font-family="Times New Roman" font-size="16">{var1} = f({var2})</text>
  <text x="250" y="130" text-anchor="middle" font-family="Times New Roman" font-size="14">where {var1}, {var2} are variables</text>
  
  <!-- Variables explanation -->
  <rect x="80" y="170" width="150" height="60" fill="#e7f5ff" stroke="#339af0" stroke-width="1" rx="5"/>
  <text x="155" y="190" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">Variables:</text>
  <text x="155" y="210" text-anchor="middle" font-family="Arial" font-size="11">{var1}: input value</text>
  <text x="155" y="225" text-anchor="middle" font-family="Arial" font-size="11">{var2}: result value</text>
  
  <!-- Solution steps -->
  <rect x="280" y="170" width="150" height="60" fill="#fff3bf" stroke="#ffd43b" stroke-width="1" rx="5"/>
  <text x="355" y="190" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">Solution:</text>
  <text x="355" y="210" text-anchor="middle" font-family="Arial" font-size="11">Step-by-step</text>
  <text x="355" y="225" text-anchor="middle" font-family="Arial" font-size="11">calculation</text>
</svg>'''
    
    def _create_science_svg(self, concept: str, concepts: List[str]) -> str:
        """Create science concept SVG with scientific elements."""
        element1 = concepts[0] if concepts else "Element A"
        element2 = concepts[1] if len(concepts) > 1 else "Element B"
        
        return f'''<svg width="512" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="256" y="25" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">{concept}</text>
  
  <!-- Scientific diagram -->
  <circle cx="150" cy="120" r="40" fill="#e3f2fd" stroke="#1976d2" stroke-width="3"/>
  <text x="150" y="127" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold">{element1}</text>
  
  <circle cx="350" cy="120" r="40" fill="#e8f5e8" stroke="#388e3c" stroke-width="3"/>
  <text x="350" y="127" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold">{element2}</text>
  
  <!-- Interaction arrow -->
  <line x1="190" y1="120" x2="310" y2="120" stroke="#ff6f00" stroke-width="3" marker-end="url(#arrow)"/>
  <text x="250" y="110" text-anchor="middle" font-family="Arial" font-size="10" fill="#d84315">interaction</text>
  
  <!-- Result -->
  <rect x="200" y="180" width="100" height="40" fill="#fff3e0" stroke="#f57c00" stroke-width="2" rx="5"/>
  <text x="250" y="205" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold">Result/Product</text>
  
  <!-- Properties boxes -->
  <rect x="50" y="200" width="100" height="60" fill="#f3e5f5" stroke="#7b1fa2" stroke-width="1" rx="3"/>
  <text x="100" y="220" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold">Properties:</text>
  <text x="100" y="235" text-anchor="middle" font-family="Arial" font-size="9">Observable</text>
  <text x="100" y="250" text-anchor="middle" font-family="Arial" font-size="9">Measurable</text>
  
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#ff6f00"/>
    </marker>
  </defs>
</svg>'''
    
    def _create_business_svg(self, concept: str, concepts: List[str]) -> str:
        """Create business concept SVG with professional elements."""
        element1 = concepts[0] if concepts else "Input"
        element2 = concepts[1] if len(concepts) > 1 else "Output"
        
        return f'''<svg width="512" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="256" y="25" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">{concept}</text>
  
  <!-- Business process flow -->
  <rect x="50" y="80" width="120" height="50" fill="#e8f5e8" stroke="#2e7d32" stroke-width="2" rx="5"/>
  <text x="110" y="100" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold">Input</text>
  <text x="110" y="115" text-anchor="middle" font-family="Arial" font-size="10">{element1}</text>
  
  <rect x="220" y="80" width="120" height="50" fill="#e3f2fd" stroke="#1976d2" stroke-width="2" rx="5"/>
  <text x="280" y="100" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold">Process</text>
  <text x="280" y="115" text-anchor="middle" font-family="Arial" font-size="10">Transformation</text>
  
  <rect x="390" y="80" width="120" height="50" fill="#fff3e0" stroke="#f57c00" stroke-width="2" rx="5"/>
  <text x="450" y="100" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold">Output</text>
  <text x="450" y="115" text-anchor="middle" font-family="Arial" font-size="10">{element2}</text>
  
  <!-- Flow arrows -->
  <line x1="170" y1="105" x2="220" y2="105" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="340" y1="105" x2="390" y2="105" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  
  <!-- KPIs/Metrics -->
  <rect x="150" y="180" width="200" height="80" fill="#f5f5f5" stroke="#bdbdbd" stroke-width="1" rx="5"/>
  <text x="250" y="200" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">Key Metrics</text>
  <text x="200" y="220" text-anchor="middle" font-family="Arial" font-size="10">• Efficiency</text>
  <text x="200" y="235" text-anchor="middle" font-family="Arial" font-size="10">• Quality</text>
  <text x="300" y="220" text-anchor="middle" font-family="Arial" font-size="10">• Cost</text>
  <text x="300" y="235" text-anchor="middle" font-family="Arial" font-size="10">• Time</text>
  
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#666"/>
    </marker>
  </defs>
</svg>'''
    
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