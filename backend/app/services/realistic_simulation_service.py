import logging
import re
import json
from typing import Dict, List, Optional, Any

from schemas import RealisticSimulationRequest, RealisticSimulationResponse, ComponentAnalysis
from services.ai_service import prompt_env, call_gemini_api
from core.config import settings

logger = logging.getLogger(__name__)

class UniversalComponentAnalyzer:
    """Analyzes any user input to determine required fundamental components"""
    
    COMPONENT_PATTERNS = {
        # Physical components
        'particles': [
            r'\b(atom|molecule|particle|electron|proton|neutron|ion)\b',
            r'\b(ball|sphere|bead|grain|dust|droplet)\b',
            r'\b(gas|plasma|aerosol)\b'
        ],
        'connections': [
            r'\b(bond|link|chain|rope|string|cable|wire)\b',
            r'\b(joint|hinge|pivot|constraint|spring)\b',
            r'\b(network|graph|tree|web|mesh)\b'
        ],
        'forces': [
            r'\b(gravity|force|pressure|tension|compression)\b',
            r'\b(magnetic|electric|electromagnetic|field)\b',
            r'\b(attraction|repulsion|interaction)\b'
        ],
        'flows': [
            r'\b(flow|current|stream|circulation|convection)\b',
            r'\b(fluid|liquid|gas|wind|air|water)\b',
            r'\b(diffusion|osmosis|transport)\b'
        ],
        'structures': [
            r'\b(crystal|lattice|framework|scaffold|architecture)\b',
            r'\b(bridge|building|tower|truss|beam)\b',
            r'\b(membrane|surface|boundary|interface)\b'
        ],
        'oscillations': [
            r'\b(wave|vibration|oscillation|pendulum|swing)\b',
            r'\b(frequency|resonance|amplitude|period)\b',
            r'\b(sound|acoustic|seismic)\b'
        ],
        'rotations': [
            r'\b(rotation|spin|orbit|revolution|gyroscope)\b',
            r'\b(angular|centrifugal|centripetal|torque)\b',
            r'\b(wheel|gear|rotor|turbine)\b'
        ]
    }
    
    LIBRARY_REQUIREMENTS = {
        'physics': {
            'patterns': [
                r'\b(physics|collision|gravity|force|momentum|energy)\b',
                r'\b(rigid body|soft body|constraint|spring)\b',
                r'\b(newton|mechanics|dynamics|kinematics)\b'
            ],
            'libraries': ['cannon-es']
        },
        'molecular': {
            'patterns': [
                r'\b(molecule|atom|protein|dna|rna|chemical)\b',
                r'\b(bond|amino acid|nucleotide|enzyme)\b',
                r'\b(molecular|biochemical|organic|inorganic)\b'
            ],
            'libraries': ['3dmol-js']
        },
        'fluid': {
            'patterns': [
                r'\b(fluid|liquid|gas|flow|turbulence|viscosity)\b',
                r'\b(water|air|plasma|aerodynamics|hydrodynamics)\b',
                r'\b(particle system|sph|computational fluid)\b'
            ],
            'libraries': ['liquidfun-js']
        },
        'electrical': {
            'patterns': [
                r'\b(electric|circuit|current|voltage|resistance)\b',
                r'\b(transistor|capacitor|inductor|diode)\b',
                r'\b(electromagnetic|field|charge|conductor)\b'
            ],
            'libraries': ['cannon-es', 'custom-electrical']
        },
        'quantum': {
            'patterns': [
                r'\b(quantum|wave function|probability|uncertainty)\b',
                r'\b(electron cloud|orbital|spin|entanglement)\b',
                r'\b(superposition|interference|tunneling)\b'
            ],
            'libraries': ['custom-quantum']
        }
    }
    
    def analyze_description(self, description: str) -> ComponentAnalysis:
        """Analyze user description to determine required components and libraries"""
        desc_lower = description.lower()
        
        # Detect primary components
        primary_components = []
        for component, patterns in self.COMPONENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, desc_lower, re.IGNORECASE):
                    primary_components.append(component)
                    break
        
        # Determine library requirements
        required_libraries = []
        physics_required = False
        molecular_structures = False
        fluid_dynamics = False
        electrical_systems = False
        quantum_effects = False
        
        for domain, config in self.LIBRARY_REQUIREMENTS.items():
            domain_match = False
            for pattern in config['patterns']:
                if re.search(pattern, desc_lower, re.IGNORECASE):
                    domain_match = True
                    required_libraries.extend(config['libraries'])
                    break
            
            # Set domain flags
            if domain == 'physics' and domain_match:
                physics_required = True
            elif domain == 'molecular' and domain_match:
                molecular_structures = True
            elif domain == 'fluid' and domain_match:
                fluid_dynamics = True
            elif domain == 'electrical' and domain_match:
                electrical_systems = True
            elif domain == 'quantum' and domain_match:
                quantum_effects = True
        
        # Remove duplicates
        required_libraries = list(set(required_libraries))
        primary_components = list(set(primary_components))
        
        # Fallback strategy for unknown concepts
        fallback_strategy = None
        if not primary_components:
            fallback_strategy = "procedural_abstract"
            primary_components = ["abstract_geometry"]
            required_libraries = ["three-js-only"]
        
        return ComponentAnalysis(
            primary_components=primary_components,
            physics_required=physics_required,
            molecular_structures=molecular_structures,
            fluid_dynamics=fluid_dynamics,
            electrical_systems=electrical_systems,
            quantum_effects=quantum_effects,
            required_libraries=required_libraries,
            fallback_strategy=fallback_strategy
        )

async def generate_realistic_simulation(request: RealisticSimulationRequest) -> RealisticSimulationResponse:
    """Generate realistic 3D simulation with smart library selection"""
    try:
        # Analyze the description to determine components and libraries
        analyzer = UniversalComponentAnalyzer()
        component_analysis = analyzer.analyze_description(request.description)
        
        logger.info(f"Component analysis for '{request.description[:50]}...': {component_analysis}")
        
        # Auto-detect category if not provided
        category = request.category
        if not category:
            if component_analysis.molecular_structures:
                category = 'molecular'
            elif component_analysis.physics_required:
                category = 'physics'
            elif component_analysis.fluid_dynamics:
                category = 'fluid'
            elif component_analysis.electrical_systems:
                category = 'electrical'
            elif component_analysis.quantum_effects:
                category = 'quantum'
            else:
                category = 'general'
        
        # Load appropriate template based on category
        try:
            template_name = f"realistic_simulation_{category}.j2"
            template = prompt_env.get_template(template_name)
        except:
            # Fallback to general template
            template_name = "realistic_simulation_general.j2"
            template = prompt_env.get_template(template_name)
            logger.warning(f"Using fallback template: {template_name}")
        
        # Prepare context for template
        context = {
            'description': request.description,
            'category': category,
            'complexity': request.complexity,
            'interactivity': request.interactivity,
            'realism_level': request.realism_level,
            'component_analysis': component_analysis.dict(),
            'required_libraries': component_analysis.required_libraries,
            'primary_components': component_analysis.primary_components,
            'physics_required': component_analysis.physics_required,
            'molecular_structures': component_analysis.molecular_structures,
            'fluid_dynamics': component_analysis.fluid_dynamics,
            'electrical_systems': component_analysis.electrical_systems,
            'quantum_effects': component_analysis.quantum_effects,
            'fallback_strategy': component_analysis.fallback_strategy
        }
        
        # Generate the prompt
        prompt = template.render(**context)
        
        logger.info(f"Using template: {template_name}")
        logger.info(f"Required libraries: {component_analysis.required_libraries}")
        
        # Call AI service
        html_content = await call_gemini_api(
            prompt=prompt,
            model=request.model,
            max_tokens=request.max_output_tokens or 20000
        )
        
        return RealisticSimulationResponse(
            html_content=html_content,
            model=request.model,
            category=category,
            libraries_used=component_analysis.required_libraries,
            component_analysis=component_analysis.dict()
        )
        
    except Exception as e:
        logger.error(f"Error generating realistic simulation: {str(e)}", exc_info=True)
        
        # Return a basic fallback
        fallback_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Realistic 3D Simulation</title>
    <style>
        body {{ margin: 0; overflow: hidden; font-family: Arial, sans-serif; background: #1a1a1a; color: white; }}
        #info {{ position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 8px; }}
    </style>
</head>
<body>
    <div id="info">
        <h3>Realistic 3D Simulation</h3>
        <p>Simulation for: {request.description}</p>
        <p>Category: {category or 'Auto-detected'}</p>
        <p>System is initializing advanced simulation...</p>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js"></script>
    <script>
        // Basic fallback scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x1a1a1a);
        document.body.appendChild(renderer.domElement);
        
        // Add a placeholder object
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({{ color: 0x00ff00, wireframe: true }});
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        
        camera.position.z = 5;
        
        function animate() {{
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        }}
        animate();
    </script>
</body>
</html>"""
        
        return RealisticSimulationResponse(
            html_content=fallback_html,
            model=request.model,
            category=category or "fallback",
            libraries_used=["three-js"],
            component_analysis={"error": str(e)}
        )