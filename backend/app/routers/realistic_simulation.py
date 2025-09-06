from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from services.realistic_simulation_service import generate_realistic_simulation
from schemas import RealisticSimulationRequest
from .auth import get_current_user
from sql_models import User
from core.config import settings
import hashlib
import json
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Simple in-memory cache for realistic simulations
_realistic_simulation_cache = {}
CACHE_SIZE_LIMIT = 50  # Smaller cache since these are more complex

def clear_realistic_simulation_cache():
    """Clear the entire realistic simulation cache"""
    global _realistic_simulation_cache
    _realistic_simulation_cache = {}
    logger.info("Realistic simulation cache cleared")

def _get_cache_key(description: str, category: str, complexity: str, model: str) -> str:
    """Generate a cache key for the realistic simulation request"""
    content = f"{description}_{category}_{complexity}_{model}"
    return hashlib.md5(content.encode()).hexdigest()

def _get_cached_simulation(cache_key: str) -> Optional[str]:
    """Retrieve cached simulation if it exists"""
    return _realistic_simulation_cache.get(cache_key)

def _cache_simulation(cache_key: str, html_content: str):
    """Cache the simulation with size limit"""
    if len(_realistic_simulation_cache) >= CACHE_SIZE_LIMIT:
        # Remove oldest entry (simple FIFO)
        oldest_key = next(iter(_realistic_simulation_cache))
        del _realistic_simulation_cache[oldest_key]
    
    _realistic_simulation_cache[cache_key] = html_content

def _validate_realistic_html_content(html_content: str) -> bool:
    """Validate generated HTML content for realistic simulations"""
    required_elements = [
        '<!DOCTYPE html>',
        '<html',
        '<head>',
        '<body>',
        'three',  # Three.js reference
        '</html>'
    ]
    
    for element in required_elements:
        if element not in html_content:
            logger.warning(f"Generated HTML missing required element: {element}")
            return False
    
    # Check if it's a reasonable length for HTML content
    if len(html_content) < 2000:  # Higher threshold for realistic simulations
        logger.warning(f"Generated HTML too short: {len(html_content)} characters")
        return False
    
    return True

@router.get("/realistic-simulation")
async def get_realistic_simulation(
    description: str = Query(..., min_length=5, max_length=500),
    category: Optional[str] = Query(None, description="Simulation category: physics, molecular, fluid, biology, astronomy, engineering"),
    complexity: str = Query("intermediate", description="Complexity level: basic, intermediate, advanced, research"),
    interactivity: str = Query("interactive", description="Interactivity level: observational, interactive, controllable"),
    realism_level: str = Query("realistic", description="Realism level: educational, realistic, photorealistic"),
    model: str = Query("gemini-2.5-flash-lite", description="AI model to use for generation"),
    current_user: User = Depends(get_current_user)
):
    """
    Generate or retrieve a cached realistic 3D simulation based on the description.
    This endpoint provides advanced physics-based simulations with specialized libraries.
    """
    try:
        # Input validation
        if not description.strip():
            raise HTTPException(status_code=400, detail="Description cannot be empty")
        
        valid_categories = ['physics', 'molecular', 'fluid', 'biology', 'astronomy', 'engineering', 'quantum', 'electrical']
        if category and category not in valid_categories:
            raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {valid_categories}")
        
        valid_complexity = ['basic', 'intermediate', 'advanced', 'research']
        if complexity not in valid_complexity:
            raise HTTPException(status_code=400, detail=f"Invalid complexity. Must be one of: {valid_complexity}")
        
        valid_interactivity = ['observational', 'interactive', 'controllable']
        if interactivity not in valid_interactivity:
            raise HTTPException(status_code=400, detail=f"Invalid interactivity. Must be one of: {valid_interactivity}")
        
        valid_realism = ['educational', 'realistic', 'photorealistic']
        if realism_level not in valid_realism:
            raise HTTPException(status_code=400, detail=f"Invalid realism level. Must be one of: {valid_realism}")
        
        # Check cache first
        cache_key = _get_cache_key(description.strip(), category or "auto", complexity, model)
        cached_content = _get_cached_simulation(cache_key)
        
        if cached_content:
            logger.info(f"Returning cached realistic simulation for key: {cache_key}")
            return {"html_content": cached_content, "cached": True}
        
        # Generate new realistic simulation
        logger.info(f"Generating new realistic simulation for: {description[:100]}...")
        logger.info(f"Parameters - Category: {category}, Complexity: {complexity}, Realism: {realism_level}")
        
        request = RealisticSimulationRequest(
            description=description.strip(),
            category=category,
            complexity=complexity,
            interactivity=interactivity,
            realism_level=realism_level,
            model=model,
            max_output_tokens=20000  # Higher limit for complex simulations
        )
        
        simulation_response = await generate_realistic_simulation(request)
        
        # Validate generated content
        logger.info(f"Generated HTML content preview: {simulation_response.html_content[:200]}...")
        logger.info(f"Libraries used: {simulation_response.libraries_used}")
        logger.info(f"Detected category: {simulation_response.category}")
        
        if not _validate_realistic_html_content(simulation_response.html_content):
            logger.error(f"Generated HTML content failed validation. Content length: {len(simulation_response.html_content)}")
            logger.error(f"First 1000 chars: {simulation_response.html_content[:1000]}")
            raise HTTPException(
                status_code=500, 
                detail="Generated simulation content is invalid. Please try again with different parameters."
            )
        
        # Cache the result
        _cache_simulation(cache_key, simulation_response.html_content)
        logger.info(f"Cached new realistic simulation with key: {cache_key}")
        
        return {
            "html_content": simulation_response.html_content,
            "category": simulation_response.category,
            "libraries_used": simulation_response.libraries_used,
            "component_analysis": simulation_response.component_analysis,
            "cached": False
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error generating realistic simulation: {str(e)}", exc_info=True)
        
        # Provide a more advanced fallback for realistic simulations
        fallback_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Realistic 3D Simulation - {description[:50]}</title>
    <style>
        body {{ 
            margin: 0; 
            overflow: hidden; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); 
            color: white; 
        }}
        #info {{ 
            position: absolute; 
            top: 20px; 
            left: 20px; 
            background: rgba(0,0,0,0.85); 
            padding: 20px; 
            border-radius: 12px; 
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            max-width: 300px;
        }}
        #error {{ 
            position: absolute; 
            bottom: 20px; 
            right: 20px; 
            background: rgba(255,69,0,0.8); 
            padding: 15px; 
            border-radius: 8px; 
            font-size: 14px;
        }}
        .loading {{ animation: pulse 2s ease-in-out infinite alternate; }}
        @keyframes pulse {{ from {{ opacity: 0.6; }} to {{ opacity: 1; }} }}
    </style>
</head>
<body>
    <div id="info">
        <h3>🔬 Realistic 3D Simulation</h3>
        <p><strong>Subject:</strong> {description[:100]}{"..." if len(description) > 100 else ""}</p>
        <p><strong>Category:</strong> {category or "Auto-detect"}</p>
        <p><strong>Complexity:</strong> {complexity.title()}</p>
        <p><strong>Status:</strong> <span class="loading">Initializing advanced physics engine...</span></p>
        <hr style="border-color: rgba(255,255,255,0.2);">
        <p><small>This simulation uses cutting-edge libraries for realistic physics, molecular visualization, and fluid dynamics.</small></p>
    </div>
    
    <div id="error">
        <strong>⚠️ Generation Error</strong><br>
        The system encountered an issue generating the advanced simulation. 
        A fallback visualization is being prepared.
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.150.0/examples/js/controls/OrbitControls.js"></script>
    
    <script>
        // Enhanced fallback with better visuals
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x1e3c72, 10, 50);
        
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({{ antialias: true }});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x1e3c72);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);
        
        // Enhanced lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        scene.add(directionalLight);
        
        // Create a more interesting placeholder
        const geometry = new THREE.IcosahedronGeometry(1, 1);
        const material = new THREE.MeshPhongMaterial({{ 
            color: 0x00ff88,
            shininess: 100,
            transparent: true,
            opacity: 0.8
        }});
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        
        // Add orbit controls if available
        if (typeof THREE.OrbitControls !== 'undefined') {{
            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.1;
        }}
        
        camera.position.set(3, 3, 5);
        camera.lookAt(0, 0, 0);
        
        // Animation with more sophisticated movement
        const clock = new THREE.Clock();
        function animate() {{
            requestAnimationFrame(animate);
            
            const elapsed = clock.getElapsedTime();
            mesh.rotation.x = Math.sin(elapsed * 0.5) * 0.5;
            mesh.rotation.y = elapsed * 0.3;
            mesh.position.y = Math.sin(elapsed * 2) * 0.2;
            
            if (typeof controls !== 'undefined') {{
                controls.update();
            }}
            
            renderer.render(scene, camera);
        }}
        animate();
        
        // Handle window resize
        window.addEventListener('resize', () => {{
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }});
        
        // Hide error message after 5 seconds
        setTimeout(() => {{
            document.getElementById('error').style.display = 'none';
        }}, 5000);
    </script>
</body>
</html>"""
        
        logger.warning("Using enhanced fallback visualization due to generation failure")
        return {
            "html_content": fallback_html,
            "category": category or "fallback",
            "libraries_used": ["three-js"],
            "component_analysis": {"error": str(e)},
            "cached": False
        }

@router.delete("/realistic-simulation/cache")
async def clear_cache(current_user: User = Depends(get_current_user)):
    """Clear the realistic simulation cache"""
    clear_realistic_simulation_cache()
    return {"message": "Realistic simulation cache cleared successfully"}

@router.get("/realistic-simulation/categories")
async def get_simulation_categories():
    """Get available simulation categories and their descriptions"""
    categories = {
        "physics": {
            "name": "Physics & Mechanics",
            "description": "Realistic physics simulations with collision detection, gravity, forces, and constraints",
            "examples": ["Newton's cradle", "pendulum systems", "collision dynamics", "spring oscillations"]
        },
        "molecular": {
            "name": "Molecular & Chemistry", 
            "description": "Professional molecular visualization with accurate chemical structures",
            "examples": ["DNA double helix", "protein structures", "chemical reactions", "molecular bonds"]
        },
        "fluid": {
            "name": "Fluid Dynamics",
            "description": "Particle-based fluid simulations for liquids and gases",
            "examples": ["water flow", "gas diffusion", "turbulence", "aerodynamics"]
        },
        "biology": {
            "name": "Biology & Anatomy",
            "description": "Biological systems and anatomical structures",
            "examples": ["cell division", "neural networks", "circulatory system", "ecosystem interactions"]
        },
        "astronomy": {
            "name": "Astronomy & Space",
            "description": "Celestial mechanics and space phenomena",
            "examples": ["planetary orbits", "galaxy formation", "star lifecycle", "gravitational waves"]
        },
        "engineering": {
            "name": "Engineering Systems",
            "description": "Complex engineering structures and systems",
            "examples": ["bridge mechanics", "circuit analysis", "mechanical systems", "structural dynamics"]
        },
        "quantum": {
            "name": "Quantum Physics",
            "description": "Quantum phenomena and atomic-scale physics",
            "examples": ["electron orbitals", "wave functions", "quantum tunneling", "particle interactions"]
        },
        "electrical": {
            "name": "Electrical Systems",
            "description": "Electrical circuits and electromagnetic phenomena", 
            "examples": ["circuit simulation", "electromagnetic fields", "power systems", "electronic components"]
        }
    }
    
    return {"categories": categories}