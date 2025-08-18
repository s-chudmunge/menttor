from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from services.ai_service import generate_3d_visualization
from schemas import ThreeDVisualizationRequest
from .auth import get_current_user
from sql_models import User
import hashlib
import json
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Simple in-memory cache for 3D visualizations
_visualization_cache = {}  # Cleared cache for ShaderPass fix
CACHE_SIZE_LIMIT = 100

def clear_visualization_cache():
    """Clear the entire visualization cache"""
    global _visualization_cache
    _visualization_cache = {}
    logger.info("Visualization cache cleared")

def _get_cache_key(description: str, model: str) -> str:
    """Generate a cache key for the visualization request"""
    content = f"{description}_{model}"
    return hashlib.md5(content.encode()).hexdigest()

def _get_cached_visualization(cache_key: str) -> Optional[str]:
    """Retrieve cached visualization if it exists"""
    return _visualization_cache.get(cache_key)

def _cache_visualization(cache_key: str, html_content: str):
    """Cache the visualization with size limit"""
    if len(_visualization_cache) >= CACHE_SIZE_LIMIT:
        # Remove oldest entry (simple FIFO)
        oldest_key = next(iter(_visualization_cache))
        del _visualization_cache[oldest_key]
    
    _visualization_cache[cache_key] = html_content

def _validate_html_content(html_content: str) -> bool:
    """Basic validation of generated HTML content"""
    required_elements = [
        '<!DOCTYPE html>',
        '<html',
        '<head>',
        '<body>',
        'three',  # Changed from 'three.js' to just 'three' for ES6 modules
        '</html>'
    ]
    
    for element in required_elements:
        if element not in html_content:
            logger.warning(f"Generated HTML missing required element: {element}")
            return False
    
    # Check if it's a reasonable length for HTML content
    if len(html_content) < 1000:
        logger.warning(f"Generated HTML too short: {len(html_content)} characters")
        return False
    
    return True

@router.get("/visualize")
async def get_3d_visualization(
    description: str = Query(..., min_length=5, max_length=500),
    model: str = Query("gemini-2.5-flash-lite", description="AI model to use for generation"),
    current_user: User = Depends(get_current_user)
):
    """
    Generate or retrieve a cached 3D visualization based on the description.
    """
    try:
        # Input validation
        if not description.strip():
            raise HTTPException(status_code=400, detail="Description cannot be empty")
        
        # Check cache first
        cache_key = _get_cache_key(description.strip(), model)
        cached_content = _get_cached_visualization(cache_key)
        
        if cached_content:
            logger.info(f"Returning cached 3D visualization for key: {cache_key}")
            return {"html_content": cached_content}
        
        # Generate new visualization
        logger.info(f"Generating new 3D visualization for description: {description[:100]}...")
        request = ThreeDVisualizationRequest(
            description=description.strip(), 
            model=model,
            max_output_tokens=16000  # Increased for complex HTML
        )
        
        visualization_response = await generate_3d_visualization(request)
        
        # Validate generated content
        logger.info(f"Generated HTML content preview: {visualization_response.html_content[:200]}...")
        
        if not _validate_html_content(visualization_response.html_content):
            logger.error(f"Generated HTML content failed validation. Content length: {len(visualization_response.html_content)}")
            logger.error(f"First 1000 chars: {visualization_response.html_content[:1000]}")
            raise HTTPException(
                status_code=500, 
                detail="Generated visualization content is invalid. Please try again."
            )
        
        # Cache the result
        _cache_visualization(cache_key, visualization_response.html_content)
        logger.info(f"Cached new 3D visualization with key: {cache_key}")
        
        return {"html_content": visualization_response.html_content}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error generating 3D visualization: {str(e)}", exc_info=True)
        
        # Provide a working fallback visualization
        fallback_html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Visualization</title>
    <style>
        body { margin: 0; overflow: hidden; font-family: Arial, sans-serif; background: #1a1a1a; color: white; }
        canvas { display: block; }
        #info { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div id="info">
        <h3>3D Visualization</h3>
        <p>Interactive 3D model for: """ + description[:100] + """</p>
        <p>Drag to rotate • Scroll to zoom</p>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.149.0/examples/js/controls/OrbitControls.js"></script>
    
    <script>
        // Simple fallback 3D visualization
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x1a1a1a);
        document.body.appendChild(renderer.domElement);
        
        // Add a simple rotating cube
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        
        // Add lighting
        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(10, 10, 10);
        scene.add(light);
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        
        // Add controls
        if (typeof OrbitControls !== 'undefined') {
            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
        }
        
        camera.position.z = 5;
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        }
        animate();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    </script>
</body>
</html>"""
        
        logger.warning("Using fallback visualization due to generation failure")
        return {"html_content": fallback_html}

@router.delete("/cache")
async def clear_cache(current_user: User = Depends(get_current_user)):
    """Clear the 3D visualization cache"""
    clear_visualization_cache()
    return {"message": "Cache cleared successfully"}
