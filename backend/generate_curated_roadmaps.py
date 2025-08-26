#!/usr/bin/env python3
"""
High-Quality Curated Roadmaps Generator
Generates 5-6 premium roadmaps for the public catalog using existing AI service
"""

import asyncio
import sys
import os
from datetime import datetime
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / 'app'))

from database.session import get_db, engine
from sqlmodel import Session
from sql_models import CuratedRoadmap
from services.ai_service import generate_roadmap_content
from schemas import RoadmapCreateRequest
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_slug(title: str) -> str:
    """Create URL-friendly slug from title"""
    return title.lower().replace(' ', '-').replace('&', 'and').replace('/', '-')

# 5-6 Premium Quality Curated Roadmaps
PREMIUM_ROADMAPS = [
    {
        "title": "Complete Python Web Development with Django",
        "category": "web-development", 
        "subcategory": "backend",
        "difficulty": "intermediate",
        "target_audience": "Developers with basic Python knowledge wanting to build web applications",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["Basic Python programming", "HTML/CSS fundamentals", "Command line basics"],
        "learning_outcomes": [
            "Build full-stack web applications with Django",
            "Implement user authentication and authorization",
            "Design and work with databases using Django ORM",
            "Deploy Django applications to production",
            "Follow Django best practices and security guidelines"
        ],
        "tags": ["python", "django", "web-development", "backend", "database", "deployment"],
        "request": {
            "subject": "Django Web Development",
            "goal": "I want to become proficient in building web applications with Django. I have basic Python knowledge and want to learn how to create full-stack web applications, handle user authentication, work with databases, and deploy to production. Focus on practical projects and industry best practices.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Machine Learning for Data Science Beginners",
        "category": "data-science",
        "subcategory": "machine-learning", 
        "difficulty": "beginner",
        "target_audience": "Complete beginners wanting to start a career in data science and ML",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["High school mathematics", "Basic computer skills"],
        "learning_outcomes": [
            "Understand fundamental ML concepts and algorithms",
            "Work with Python, pandas, and scikit-learn",
            "Build and evaluate predictive models",
            "Visualize data and communicate insights",
            "Complete real-world ML projects"
        ],
        "tags": ["machine-learning", "python", "data-science", "pandas", "scikit-learn", "beginner"],
        "request": {
            "subject": "Machine Learning for Beginners",
            "goal": "I'm completely new to machine learning and data science. I want to learn the fundamentals, understand different ML algorithms, and be able to build predictive models using Python. Include hands-on projects with real datasets and focus on practical application over theory.",
            "time_value": 10,
            "time_unit": "weeks", 
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Modern React Development with TypeScript",
        "category": "web-development",
        "subcategory": "frontend",
        "difficulty": "intermediate", 
        "target_audience": "Frontend developers wanting to master React with TypeScript",
        "estimated_hours": 80,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["JavaScript ES6+", "HTML/CSS", "Basic React knowledge"],
        "learning_outcomes": [
            "Build scalable React applications with TypeScript",
            "Master React hooks and state management",
            "Implement modern UI patterns and component architecture",
            "Handle API integration and data fetching",
            "Test React components and optimize performance"
        ],
        "tags": ["react", "typescript", "frontend", "javascript", "hooks", "components"],
        "request": {
            "subject": "React with TypeScript",
            "goal": "I know basic React and JavaScript, but I want to become an expert in modern React development using TypeScript. Teach me hooks, state management, component patterns, testing, and performance optimization. Focus on building production-ready applications.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "AWS Cloud Practitioner to Solutions Architect",
        "category": "cloud-computing",
        "subcategory": "aws",
        "difficulty": "intermediate",
        "target_audience": "IT professionals preparing for AWS certifications and cloud careers",
        "estimated_hours": 150,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Basic networking knowledge", "Linux command line", "General IT experience"],
        "learning_outcomes": [
            "Pass AWS Cloud Practitioner and Solutions Architect Associate exams",
            "Design scalable and secure AWS architectures",
            "Implement AWS services for compute, storage, and networking",
            "Understand AWS pricing and cost optimization",
            "Build and deploy cloud-native applications"
        ],
        "tags": ["aws", "cloud-computing", "certification", "architecture", "devops"],
        "request": {
            "subject": "AWS Cloud Architecture",
            "goal": "I want to become an AWS Solutions Architect. Start with Cloud Practitioner fundamentals and advance to Solutions Architect Associate level. Include hands-on labs, real-world scenarios, and exam preparation. Focus on practical cloud architecture design and implementation.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Complete Node.js Backend Development",
        "category": "web-development", 
        "subcategory": "backend",
        "difficulty": "beginner",
        "target_audience": "JavaScript developers transitioning to backend development",
        "estimated_hours": 90,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["JavaScript fundamentals", "Basic understanding of web concepts"],
        "learning_outcomes": [
            "Build REST APIs with Node.js and Express",
            "Work with databases (MongoDB and SQL)",
            "Implement authentication and security",
            "Handle file uploads and API integration",
            "Deploy Node.js applications to production"
        ],
        "tags": ["nodejs", "express", "backend", "api", "javascript", "mongodb"],
        "request": {
            "subject": "Node.js Backend Development",
            "goal": "I know JavaScript frontend but want to learn backend development with Node.js. Teach me to build REST APIs, work with databases, handle authentication, and deploy applications. Focus on practical projects and industry standards.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Data Structures & Algorithms for Coding Interviews",
        "category": "computer-science",
        "subcategory": "algorithms",
        "difficulty": "intermediate",
        "target_audience": "Software developers preparing for technical interviews at top companies",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.6,
        "prerequisites": ["Programming in Python/Java/C++", "Basic problem-solving skills"],
        "learning_outcomes": [
            "Master essential data structures (arrays, trees, graphs, etc.)",
            "Solve complex algorithmic problems efficiently",
            "Understand time and space complexity analysis",
            "Excel in coding interviews at top tech companies",
            "Practice with 100+ LeetCode-style problems"
        ],
        "tags": ["algorithms", "data-structures", "interviews", "leetcode", "problem-solving"],
        "request": {
            "subject": "Data Structures and Algorithms for Interviews",
            "goal": "I want to excel in coding interviews at top tech companies like Google, Amazon, and Facebook. Teach me essential data structures, algorithms, and problem-solving patterns. Include lots of practice problems with detailed explanations and interview tips.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    # Research-focused roadmaps for graduate students
    {
        "title": "Deep Learning Research and Large Language Models",
        "category": "artificial-intelligence",
        "subcategory": "deep-learning",
        "difficulty": "advanced",
        "target_audience": "Graduate students and researchers in AI/ML focusing on current deep learning research",
        "estimated_hours": 200,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.8,
        "prerequisites": ["Advanced mathematics (linear algebra, calculus, statistics)", "Machine learning fundamentals", "Python programming", "Research methodology"],
        "learning_outcomes": [
            "Understand transformer architectures and attention mechanisms in depth",
            "Implement and fine-tune large language models (GPT, BERT, T5)",
            "Master advanced optimization techniques and distributed training",
            "Conduct reproducible research with proper experimental design",
            "Publish research papers in top-tier conferences (NeurIPS, ICLR, ICML)"
        ],
        "tags": ["deep-learning", "transformers", "llm", "research", "neural-networks", "attention", "pytorch"],
        "request": {
            "subject": "Advanced Deep Learning Research",
            "goal": "I am a graduate student wanting to conduct cutting-edge research in deep learning, particularly focusing on large language models and transformer architectures. Cover latest research papers, implementation details, advanced optimization, distributed training, research methodology, and how to contribute to the field through publications.",
            "time_value": 16,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Computational Biology and Bioinformatics Research",
        "category": "data-science",
        "subcategory": "bioinformatics",
        "difficulty": "advanced",
        "target_audience": "Graduate students in computational biology, bioinformatics, and related fields",
        "estimated_hours": 180,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["Biology fundamentals", "Statistics and probability", "Programming (Python/R)", "Basic genetics knowledge"],
        "learning_outcomes": [
            "Analyze genomic and transcriptomic data using state-of-the-art tools",
            "Implement machine learning for biological data analysis",
            "Understand single-cell sequencing analysis pipelines",
            "Conduct phylogenetic and evolutionary analyses",
            "Develop novel computational methods for biological problems"
        ],
        "tags": ["bioinformatics", "genomics", "computational-biology", "single-cell", "phylogenetics", "research"],
        "request": {
            "subject": "Computational Biology Research",
            "goal": "I want to master computational biology and bioinformatics for graduate-level research. Cover genomic data analysis, single-cell sequencing, machine learning applications in biology, phylogenetics, and how to develop novel computational methods. Focus on current research trends and publication-ready analysis.",
            "time_value": 14,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Quantum Computing Research and Algorithm Development",
        "category": "quantum-computing",
        "subcategory": "algorithms",
        "difficulty": "advanced",
        "target_audience": "Graduate students and researchers in quantum computing, physics, and computer science",
        "estimated_hours": 160,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Linear algebra", "Complex analysis", "Quantum mechanics fundamentals", "Programming experience"],
        "learning_outcomes": [
            "Implement quantum algorithms (Shor's, Grover's, VQE, QAOA)",
            "Design quantum circuits using Qiskit, Cirq, and PennyLane",
            "Understand quantum error correction and fault tolerance",
            "Conduct research in quantum machine learning and optimization",
            "Contribute to quantum computing research publications"
        ],
        "tags": ["quantum-computing", "quantum-algorithms", "qiskit", "quantum-machine-learning", "research"],
        "request": {
            "subject": "Quantum Computing Research",
            "goal": "I am pursuing graduate research in quantum computing. Teach me advanced quantum algorithms, quantum circuit design, error correction, quantum machine learning, and current research frontiers. Include hands-on implementation and preparation for research contributions in the field.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Advanced Materials Science and Computational Chemistry",
        "category": "materials-science",
        "subcategory": "computational",
        "difficulty": "advanced",
        "target_audience": "Graduate students in materials science, chemistry, and physics doing computational research",
        "estimated_hours": 170,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Physical chemistry", "Quantum mechanics", "Solid state physics", "Programming skills"],
        "learning_outcomes": [
            "Master density functional theory (DFT) calculations using VASP, Quantum ESPRESSO",
            "Perform molecular dynamics simulations with LAMMPS, GROMACS",
            "Analyze electronic structure and material properties",
            "Design novel materials using high-throughput computational screening",
            "Integrate machine learning with materials discovery"
        ],
        "tags": ["materials-science", "dft", "molecular-dynamics", "computational-chemistry", "vasp", "research"],
        "request": {
            "subject": "Computational Materials Science Research",
            "goal": "I need to master computational methods in materials science for my graduate research. Cover DFT calculations, molecular dynamics simulations, electronic structure analysis, high-throughput screening, and machine learning applications in materials discovery. Focus on current research methodologies and tools.",
            "time_value": 14,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Climate Science and Earth System Modeling",
        "category": "earth-sciences",
        "subcategory": "climate-modeling",
        "difficulty": "advanced",
        "target_audience": "Graduate students in climate science, atmospheric science, and environmental modeling",
        "estimated_hours": 190,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.6,
        "prerequisites": ["Atmospheric physics", "Fluid dynamics", "Statistics", "Programming (Python/Fortran)", "Calculus and differential equations"],
        "learning_outcomes": [
            "Understand climate system components and feedback mechanisms",
            "Run and analyze global climate models (CESM, GISS)",
            "Process and analyze large climate datasets using xarray and pandas",
            "Conduct statistical downscaling and bias correction",
            "Research climate change impacts and publish findings"
        ],
        "tags": ["climate-science", "climate-modeling", "earth-system", "atmospheric-science", "research"],
        "request": {
            "subject": "Climate Science and Earth System Modeling",
            "goal": "I am a graduate student focusing on climate science research. Teach me climate system dynamics, global climate modeling, data analysis techniques, statistical methods for climate data, and current research in climate change. Focus on hands-on modeling and analysis for research publications.",
            "time_value": 15,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Advanced Neuroscience Research and Computational Modeling",
        "category": "neuroscience",
        "subcategory": "computational",
        "difficulty": "advanced",
        "target_audience": "Graduate students in neuroscience, cognitive science, and computational biology",
        "estimated_hours": 175,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Neurobiology fundamentals", "Statistics", "Programming (Python/MATLAB)", "Linear algebra"],
        "learning_outcomes": [
            "Analyze neural data from fMRI, EEG, and single-cell recordings",
            "Implement computational models of neural networks and brain dynamics",
            "Use machine learning for decoding neural signals and behavior",
            "Conduct connectivity analysis and network neuroscience",
            "Design and analyze neuroscience experiments for publication"
        ],
        "tags": ["neuroscience", "computational-neuroscience", "fmri", "neural-networks", "brain-modeling", "research"],
        "request": {
            "subject": "Computational Neuroscience Research",
            "goal": "I am pursuing graduate research in neuroscience with a computational focus. Cover neural data analysis, brain imaging techniques, computational modeling of neural systems, machine learning applications, and current research methodologies. Prepare me to conduct and publish neuroscience research.",
            "time_value": 14,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Advanced Mathematical Physics and Theoretical Research",
        "category": "physics",
        "subcategory": "theoretical",
        "difficulty": "advanced",
        "target_audience": "Graduate students in theoretical physics and applied mathematics",
        "estimated_hours": 200,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.7,
        "prerequisites": ["Advanced calculus", "Linear algebra", "Complex analysis", "Classical mechanics", "Quantum mechanics"],
        "learning_outcomes": [
            "Master advanced mathematical methods in theoretical physics",
            "Understand quantum field theory and particle physics",
            "Work with differential geometry and general relativity",
            "Conduct research in condensed matter theory",
            "Develop new theoretical models and publish in physics journals"
        ],
        "tags": ["theoretical-physics", "quantum-field-theory", "mathematical-physics", "research", "particle-physics"],
        "request": {
            "subject": "Theoretical Physics Research",
            "goal": "I want to pursue advanced theoretical physics research at the graduate level. Cover quantum field theory, general relativity, condensed matter theory, mathematical methods, and current research frontiers. Focus on developing theoretical models and preparing for research publications in top physics journals.",
            "time_value": 16,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Behavioral Economics and Experimental Design",
        "category": "economics",
        "subcategory": "behavioral",
        "difficulty": "advanced",
        "target_audience": "Graduate students in economics, psychology, and behavioral science research",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Microeconomics", "Statistics", "Research methods", "Psychology fundamentals"],
        "learning_outcomes": [
            "Design and conduct behavioral economics experiments",
            "Analyze decision-making under uncertainty and behavioral biases",
            "Use advanced econometric methods for causal inference",
            "Understand neuroeconomics and computational models of choice",
            "Publish research in economics and psychology journals"
        ],
        "tags": ["behavioral-economics", "experimental-design", "decision-theory", "econometrics", "research"],
        "request": {
            "subject": "Behavioral Economics Research",
            "goal": "I am a graduate student interested in behavioral economics research. Teach me experimental design, behavioral theory, econometric analysis, neuroeconomics, and current research methods. Focus on conducting rigorous experiments and preparing publications for top economics journals.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Advanced Data Science for Social Science Research",
        "category": "data-science",
        "subcategory": "social-science",
        "difficulty": "advanced",
        "target_audience": "Graduate students in sociology, political science, and social science research",
        "estimated_hours": 150,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Statistics", "Research methods", "Programming (R/Python)", "Social science theory"],
        "learning_outcomes": [
            "Apply machine learning to social science questions",
            "Conduct network analysis and computational social science",
            "Use natural language processing for text analysis",
            "Implement causal inference methods and quasi-experiments",
            "Publish computational social science research"
        ],
        "tags": ["computational-social-science", "network-analysis", "causal-inference", "nlp", "research"],
        "request": {
            "subject": "Computational Social Science Research",
            "goal": "I want to apply advanced data science methods to social science research. Cover machine learning for social data, network analysis, text mining, causal inference, and computational methods. Focus on current research practices and publishing in social science journals.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Advanced Biomedical Engineering and Medical Device Research",
        "category": "biomedical-engineering",
        "subcategory": "medical-devices",
        "difficulty": "advanced",
        "target_audience": "Graduate students in biomedical engineering and medical technology research",
        "estimated_hours": 165,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Engineering mathematics", "Biology/physiology", "Materials science", "Programming", "Signal processing"],
        "learning_outcomes": [
            "Design and prototype medical devices and instruments",
            "Understand biomedical signal processing and imaging",
            "Conduct biomaterials research and tissue engineering",
            "Navigate medical device regulations and FDA approval",
            "Publish biomedical engineering research and develop patents"
        ],
        "tags": ["biomedical-engineering", "medical-devices", "tissue-engineering", "biomaterials", "research"],
        "request": {
            "subject": "Biomedical Engineering Research",
            "goal": "I am pursuing graduate research in biomedical engineering focusing on medical device development. Cover device design, biomedical signal processing, biomaterials, tissue engineering, regulatory aspects, and current research trends. Prepare me for industry and academic research careers.",
            "time_value": 13,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    }
]

async def generate_premium_roadmap(roadmap_config: dict) -> CuratedRoadmap:
    """Generate a high-quality curated roadmap"""
    logger.info(f"Generating roadmap: {roadmap_config['title']}")
    
    # Create the AI request
    request = RoadmapCreateRequest(**roadmap_config['request'])
    
    # Generate roadmap content using existing AI service
    ai_response = await generate_roadmap_content(request)
    
    # Create curated roadmap object
    curated_roadmap = CuratedRoadmap(
        title=roadmap_config['title'],
        description=ai_response.description,
        category=roadmap_config['category'],
        subcategory=roadmap_config.get('subcategory'),
        difficulty=roadmap_config['difficulty'],
        
        # Quality metrics
        is_featured=roadmap_config['is_featured'],
        is_verified=roadmap_config['is_verified'], 
        quality_score=roadmap_config['quality_score'],
        
        # Content
        roadmap_plan=ai_response.roadmap_plan.model_dump()["modules"],
        estimated_hours=roadmap_config['estimated_hours'],
        prerequisites=roadmap_config['prerequisites'],
        learning_outcomes=roadmap_config['learning_outcomes'],
        tags=roadmap_config['tags'],
        target_audience=roadmap_config['target_audience'],
        slug=create_slug(roadmap_config['title']),
        
        # Initialize metrics
        view_count=0,
        adoption_count=0,
        completion_rate=0.0,
        average_rating=0.0
    )
    
    logger.info(f"✅ Generated: {roadmap_config['title']} ({len(ai_response.roadmap_plan.modules)} modules)")
    return curated_roadmap

async def main():
    """Generate and save all premium curated roadmaps"""
    logger.info("🚀 Starting generation of premium curated roadmaps...")
    
    # Create database tables if they don't exist
    # Note: In production, this should be done via Alembic migrations
    from sqlmodel import SQLModel
    SQLModel.metadata.create_all(engine)
    
    generated_roadmaps = []
    
    for roadmap_config in PREMIUM_ROADMAPS:
        try:
            curated_roadmap = await generate_premium_roadmap(roadmap_config)
            generated_roadmaps.append(curated_roadmap)
            
            # Add a small delay to avoid hitting API limits
            await asyncio.sleep(2)
            
        except Exception as e:
            logger.error(f"❌ Failed to generate {roadmap_config['title']}: {e}")
            continue
    
    # Save to database
    if generated_roadmaps:
        with Session(engine) as db:
            # Check if roadmaps already exist
            existing_count = len(db.query(CuratedRoadmap).all()) if hasattr(db, 'query') else 0
            
            for roadmap in generated_roadmaps:
                db.add(roadmap)
            
            db.commit()
            
            logger.info(f"💾 Saved {len(generated_roadmaps)} curated roadmaps to database")
            
            # Print summary
            for roadmap in generated_roadmaps:
                logger.info(f"   • {roadmap.title} ({roadmap.difficulty}) - {roadmap.category}")
    
    logger.info("🎉 Premium curated roadmaps generation completed!")
    
    print("\n" + "="*60)
    print("CURATED ROADMAPS GENERATED SUCCESSFULLY!")
    print("="*60)
    print(f"Generated: {len(generated_roadmaps)} premium roadmaps")
    print("Categories covered:")
    categories = set(r.category for r in generated_roadmaps)
    for category in categories:
        count = sum(1 for r in generated_roadmaps if r.category == category)
        print(f"  • {category}: {count} roadmap(s)")
    print("\nReady for public catalog! 🚀")

if __name__ == "__main__":
    asyncio.run(main())