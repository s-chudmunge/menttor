from fastapi import APIRouter, Depends, HTTPException, status, Query, Form
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlmodel import Session, select, desc, func, and_, or_
from database.session import get_db
from database.redis_client import get_redis_client
from schemas import (
    CuratedRoadmapResponse, CuratedRoadmapListResponse, 
    CuratedRoadmapAdoptRequest, CuratedRoadmapAdoptResponse, 
    CuratedRoadmapCategoriesResponse, RoadmapResponse, RoadmapCreateRequest
)
from sql_models import CuratedRoadmap, UserCuratedRoadmap, Roadmap, User, RoadmapResource
from .optional_auth import get_optional_current_user
from .auth import get_current_user
from services.ai_service import generate_roadmap_content
from typing import List, Optional, Dict
import secrets
import logging
import re
import json
import hashlib
import os
from datetime import datetime

router = APIRouter(prefix="/curated-roadmaps", tags=["curated-roadmaps"])
security = HTTPBasic()
logger = logging.getLogger(__name__)

# Admin credentials from Secret Manager
from utils.secret_manager import get_admin_credentials
ADMIN_USERNAME, ADMIN_PASSWORD = get_admin_credentials()

def create_slug(title: str) -> str:
    """Create URL-friendly slug from title"""
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)  # Remove special chars
    slug = re.sub(r'[\s_-]+', '-', slug)  # Replace spaces with hyphens
    slug = slug.strip('-')  # Remove leading/trailing hyphens
    return slug

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials"""
    is_correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    is_correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    
    if not (is_correct_username and is_correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

def generate_cache_key(endpoint: str, **params) -> str:
    """Generate cache key for roadmap data"""
    cache_data = {"endpoint": endpoint, "params": sorted(params.items())}
    cache_string = json.dumps(cache_data, default=str)
    return f"roadmaps:{hashlib.md5(cache_string.encode()).hexdigest()}"

async def get_cached_response(cache_key: str) -> Optional[Dict]:
    """Get cached response from Redis"""
    try:
        with get_redis_client() as redis_client:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
    except Exception as e:
        logger.warning(f"Redis cache read failed: {e}")
    return None

async def set_cached_response(cache_key: str, data, ttl: int = 1800) -> None:
    """Set cached response in Redis with TTL (default 30 minutes)"""
    try:
        with get_redis_client() as redis_client:
            # Convert Pydantic models to dict to avoid serialization issues
            if hasattr(data, 'model_dump'):
                serializable_data = data.model_dump()
            elif isinstance(data, list) and data and hasattr(data[0], 'model_dump'):
                serializable_data = [item.model_dump() for item in data]
            else:
                serializable_data = data
            redis_client.setex(cache_key, ttl, json.dumps(serializable_data, default=str))
    except Exception as e:
        logger.warning(f"Redis cache write failed: {e}")

# ==============================================================================
# TRENDING ROADMAPS CONFIGURATION
# ==============================================================================

TRENDING_ROADMAPS_CONFIG = [
    # FRONTEND DEVELOPMENT
    {
        "title": "Complete React Development with TypeScript",
        "category": "web-development", 
        "subcategory": "frontend",
        "difficulty": "intermediate",
        "target_audience": "Frontend developers wanting to master modern React with TypeScript",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["JavaScript ES6+", "HTML/CSS fundamentals", "Basic React knowledge"],
        "learning_outcomes": [
            "Build scalable React applications with TypeScript",
            "Master React hooks and advanced patterns", 
            "Implement state management with Context API and Redux Toolkit",
            "Create reusable UI component libraries",
            "Test React applications with Jest and React Testing Library"
        ],
        "tags": ["react", "typescript", "frontend", "javascript", "hooks", "testing"],
        "request": {
            "subject": "Modern React Development with TypeScript",
            "goal": "I want to become an expert in building modern, scalable React applications using TypeScript. Teach me advanced React patterns, hooks, state management, component architecture, testing strategies, and performance optimization. Focus on industry best practices and real-world project development.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Next.js 14 Full-Stack Development",
        "category": "web-development",
        "subcategory": "fullstack",
        "difficulty": "intermediate", 
        "target_audience": "Developers wanting to master Next.js for production applications",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["React knowledge", "JavaScript/TypeScript", "Basic web development"],
        "learning_outcomes": [
            "Master Next.js App Router and Server Components",
            "Build full-stack applications with API routes",
            "Implement authentication and middleware",
            "Optimize for performance and SEO",
            "Deploy scalable Next.js applications"
        ],
        "tags": ["nextjs", "react", "fullstack", "server-components", "deployment"],
        "request": {
            "subject": "Next.js 14 Full-Stack Development",
            "goal": "I want to master Next.js 14 for building production-ready full-stack applications. Teach me App Router, Server Components, API routes, authentication, caching, performance optimization, and deployment. Focus on modern Next.js patterns and best practices.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    # DATA SCIENCE & AI
    {
        "title": "Python Data Science and Machine Learning",
        "category": "data-science",
        "subcategory": "machine-learning",
        "difficulty": "beginner",
        "target_audience": "Beginners wanting to start a career in data science and AI",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.6,
        "prerequisites": ["Basic Python programming", "High school mathematics"],
        "learning_outcomes": [
            "Master NumPy, Pandas, and data manipulation",
            "Build machine learning models with scikit-learn",
            "Create data visualizations with Matplotlib and Seaborn",
            "Understand statistics and feature engineering",
            "Deploy ML models to production"
        ],
        "tags": ["python", "data-science", "machine-learning", "pandas", "scikit-learn", "visualization"],
        "request": {
            "subject": "Python Data Science and Machine Learning",
            "goal": "I want to become proficient in data science and machine learning using Python. Start from data manipulation basics and progress to building, evaluating, and deploying ML models. Include hands-on projects with real datasets, statistical concepts, and industry best practices.",
            "time_value": 12,
            "time_unit": "weeks", 
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Generative AI and Large Language Models",
        "category": "artificial-intelligence",
        "subcategory": "generative-ai",
        "difficulty": "intermediate",
        "target_audience": "Developers wanting to build AI-powered applications with LLMs",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.6,
        "prerequisites": ["Python programming", "Basic machine learning", "API development"],
        "learning_outcomes": [
            "Build applications with OpenAI GPT and Claude APIs",
            "Master prompt engineering and fine-tuning techniques",
            "Implement RAG (Retrieval Augmented Generation) systems",
            "Deploy LLM applications at scale",
            "Handle AI safety and ethical considerations"
        ],
        "tags": ["llm", "gpt", "claude", "prompt-engineering", "rag", "ai-safety"],
        "request": {
            "subject": "Generative AI and Large Language Model Development",
            "goal": "I want to master building applications with LLMs like GPT and Claude. Teach me prompt engineering, fine-tuning, RAG systems, vector databases, AI safety, and deploying LLM applications. Include practical projects and ethical considerations.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Computer Vision with Deep Learning",
        "category": "artificial-intelligence",
        "subcategory": "computer-vision",
        "difficulty": "intermediate",
        "target_audience": "Developers building image processing and computer vision applications",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Python programming", "Basic linear algebra", "Machine learning basics"],
        "learning_outcomes": [
            "Master CNN architectures and image preprocessing",
            "Build object detection and image classification models",
            "Implement face recognition and image segmentation",
            "Work with PyTorch and TensorFlow for computer vision",
            "Deploy computer vision models in production"
        ],
        "tags": ["computer-vision", "deep-learning", "pytorch", "opencv", "cnn"],
        "request": {
            "subject": "Computer Vision with Deep Learning",
            "goal": "I want to master computer vision using deep learning. Teach me CNN architectures, image preprocessing, object detection, face recognition, image segmentation, and deployment. Include hands-on projects with real-world datasets and production deployment strategies.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    # CLOUD & DEVOPS
    {
        "title": "AWS Cloud Solutions Architect",
        "category": "cloud-computing",
        "subcategory": "aws",
        "difficulty": "intermediate",
        "target_audience": "IT professionals preparing for AWS certification and cloud careers",
        "estimated_hours": 160,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Basic networking", "Linux fundamentals", "General IT experience"],
        "learning_outcomes": [
            "Design scalable and secure AWS architectures",
            "Master core AWS services (EC2, S3, RDS, Lambda)",
            "Implement CI/CD pipelines and DevOps practices",
            "Pass AWS Solutions Architect Associate exam",
            "Optimize costs and monitor cloud infrastructure"
        ],
        "tags": ["aws", "cloud-computing", "architecture", "certification", "devops", "security"],
        "request": {
            "subject": "AWS Cloud Solutions Architect",
            "goal": "I want to become an AWS Solutions Architect and pass the certification exam. Teach me to design resilient, scalable, and cost-effective cloud architectures. Cover core services, security best practices, monitoring, and real-world implementation scenarios.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Docker and Kubernetes DevOps",
        "category": "devops",
        "subcategory": "containerization",
        "difficulty": "intermediate",
        "target_audience": "DevOps engineers and backend developers learning modern deployment",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Linux command line", "Basic networking", "Application deployment experience"],
        "learning_outcomes": [
            "Master Docker containerization and multi-stage builds",
            "Deploy and manage Kubernetes clusters",
            "Implement CI/CD pipelines with containers",
            "Monitor and troubleshoot containerized applications",
            "Scale applications with orchestration"
        ],
        "tags": ["docker", "kubernetes", "devops", "containerization", "orchestration"],
        "request": {
            "subject": "Docker and Kubernetes DevOps",
            "goal": "I want to master containerization and orchestration for modern application deployment. Teach me Docker best practices, Kubernetes cluster management, service mesh, monitoring, and production deployment strategies. Focus on real-world DevOps scenarios.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    # BACKEND DEVELOPMENT
    {
        "title": "Node.js Backend Development with Express",
        "category": "web-development",
        "subcategory": "backend", 
        "difficulty": "beginner",
        "target_audience": "JavaScript developers transitioning to backend development",
        "estimated_hours": 90,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["JavaScript fundamentals", "Basic understanding of web concepts"],
        "learning_outcomes": [
            "Build REST APIs and GraphQL endpoints",
            "Implement authentication and authorization",
            "Work with databases (MongoDB and PostgreSQL)",
            "Handle file uploads and third-party integrations", 
            "Deploy and monitor Node.js applications"
        ],
        "tags": ["nodejs", "express", "backend", "api", "javascript", "databases"],
        "request": {
            "subject": "Node.js Backend Development",
            "goal": "I want to master backend development with Node.js and Express. Teach me to build secure, scalable APIs, work with databases, implement authentication, handle real-time communication, and deploy production applications. Focus on modern best practices.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Go Programming for Backend Systems",
        "category": "programming-languages",
        "subcategory": "backend",
        "difficulty": "intermediate",
        "target_audience": "Backend developers wanting to learn high-performance systems programming",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Programming experience in any language", "Basic computer science concepts"],
        "learning_outcomes": [
            "Master Go syntax and concurrency patterns",
            "Build high-performance web services and APIs",
            "Implement microservices architecture",
            "Handle database operations and caching",
            "Deploy Go applications at scale"
        ],
        "tags": ["golang", "backend", "microservices", "concurrency", "performance"],
        "request": {
            "subject": "Go Programming for Backend Systems",
            "goal": "I want to master Go for building high-performance backend systems. Teach me Go syntax, goroutines, channels, web frameworks, database integration, microservices patterns, and deployment. Focus on production-ready backend development.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    # MOBILE DEVELOPMENT
    {
        "title": "React Native Cross-Platform Mobile Development",
        "category": "mobile-development",
        "subcategory": "cross-platform",
        "difficulty": "intermediate",
        "target_audience": "React developers building mobile applications",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["React experience", "JavaScript/TypeScript", "Mobile app concepts"],
        "learning_outcomes": [
            "Build native iOS and Android apps with React Native",
            "Implement navigation and state management",
            "Access device APIs and native modules",
            "Optimize performance for mobile platforms",
            "Deploy to App Store and Google Play"
        ],
        "tags": ["react-native", "mobile", "ios", "android", "cross-platform"],
        "request": {
            "subject": "React Native Cross-Platform Mobile Development",
            "goal": "I want to master React Native for building high-quality mobile applications. Teach me navigation, native modules, performance optimization, testing, and app store deployment. Include real-world mobile app development projects.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Flutter App Development with Dart",
        "category": "mobile-development",
        "subcategory": "cross-platform",
        "difficulty": "beginner",
        "target_audience": "Developers wanting to build beautiful mobile apps with Flutter",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Basic programming concepts", "Object-oriented programming"],
        "learning_outcomes": [
            "Master Dart programming and Flutter widgets",
            "Build responsive and beautiful mobile UIs",
            "Implement state management with Provider and Bloc",
            "Integrate with APIs and local databases",
            "Publish apps to mobile app stores"
        ],
        "tags": ["flutter", "dart", "mobile", "ui", "state-management"],
        "request": {
            "subject": "Flutter App Development with Dart",
            "goal": "I want to master Flutter for creating beautiful, high-performance mobile applications. Teach me Dart programming, Flutter widgets, state management, animations, API integration, and app store deployment. Focus on modern mobile development practices.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    # CYBERSECURITY
    {
        "title": "Ethical Hacking and Penetration Testing",
        "category": "cybersecurity",
        "subcategory": "ethical-hacking",
        "difficulty": "intermediate",
        "target_audience": "Security professionals and developers interested in cybersecurity",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Networking fundamentals", "Linux command line", "Basic scripting"],
        "learning_outcomes": [
            "Master penetration testing methodologies",
            "Use professional security tools (Kali Linux, Metasploit)",
            "Identify and exploit web application vulnerabilities",
            "Conduct network security assessments",
            "Write professional security reports"
        ],
        "tags": ["ethical-hacking", "penetration-testing", "cybersecurity", "kali-linux"],
        "request": {
            "subject": "Ethical Hacking and Penetration Testing",
            "goal": "I want to master ethical hacking and penetration testing for cybersecurity. Teach me vulnerability assessment, exploitation techniques, security tools, network testing, and professional reporting. Focus on legal, ethical practices and industry certifications.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    # DATABASE & DATA ENGINEERING
    {
        "title": "PostgreSQL Database Design and Optimization",
        "category": "database",
        "subcategory": "relational",
        "difficulty": "intermediate",
        "target_audience": "Backend developers and database administrators",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["SQL basics", "Database concepts", "Command line familiarity"],
        "learning_outcomes": [
            "Design efficient database schemas and relationships",
            "Master advanced PostgreSQL features and functions",
            "Optimize queries and implement proper indexing",
            "Handle replication and high availability",
            "Monitor and tune database performance"
        ],
        "tags": ["postgresql", "database", "sql", "performance", "optimization"],
        "request": {
            "subject": "PostgreSQL Database Design and Optimization",
            "goal": "I want to master PostgreSQL for building scalable, high-performance database systems. Teach me advanced SQL, schema design, indexing strategies, query optimization, replication, and performance tuning. Include real-world database scenarios.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    # BLOCKCHAIN & WEB3
    {
        "title": "Blockchain Development with Solidity",
        "category": "blockchain",
        "subcategory": "smart-contracts",
        "difficulty": "intermediate",
        "target_audience": "Developers wanting to build decentralized applications and smart contracts",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Programming experience", "JavaScript knowledge", "Basic blockchain concepts"],
        "learning_outcomes": [
            "Master Solidity programming and smart contract development",
            "Build and deploy DApps on Ethereum",
            "Implement token standards (ERC-20, ERC-721)",
            "Integrate smart contracts with web frontends",
            "Understand DeFi protocols and security best practices"
        ],
        "tags": ["blockchain", "solidity", "ethereum", "smart-contracts", "defi"],
        "request": {
            "subject": "Blockchain Development with Solidity",
            "goal": "I want to master blockchain development and smart contract programming with Solidity. Teach me Ethereum development, DApp creation, token standards, Web3 integration, and security best practices. Focus on real-world blockchain projects.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    # SYSTEM DESIGN & ARCHITECTURE
    {
        "title": "System Design for Large-Scale Applications",
        "category": "system-design",
        "subcategory": "architecture",
        "difficulty": "advanced",
        "target_audience": "Senior engineers and architects designing scalable systems",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["Software engineering experience", "Database knowledge", "Distributed systems basics"],
        "learning_outcomes": [
            "Design scalable distributed systems architecture",
            "Master microservices patterns and trade-offs",
            "Implement caching and load balancing strategies",
            "Handle data consistency and replication",
            "Prepare for system design interviews"
        ],
        "tags": ["system-design", "architecture", "scalability", "microservices", "distributed-systems"],
        "request": {
            "subject": "System Design for Large-Scale Applications",
            "goal": "I want to master system design for building large-scale, distributed applications. Teach me architecture patterns, scalability strategies, database design, caching, load balancing, and fault tolerance. Include real-world case studies and interview preparation.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED DEVELOPMENT AREAS
    {
        "title": "IoT Development with Embedded Systems",
        "category": "embedded-systems",
        "subcategory": "iot",
        "difficulty": "intermediate",
        "target_audience": "Developers building IoT solutions and embedded applications",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["C/C++ programming", "Basic electronics knowledge", "Linux fundamentals"],
        "learning_outcomes": [
            "Design and program microcontroller-based systems",
            "Build IoT devices with sensor integration",
            "Implement wireless communication protocols",
            "Develop edge computing applications",
            "Deploy IoT solutions with cloud connectivity"
        ],
        "tags": ["iot", "embedded", "arduino", "raspberry-pi", "sensors", "mqtt"],
        "request": {
            "subject": "IoT Development with Embedded Systems",
            "goal": "I want to master IoT development from hardware to cloud integration. Teach me embedded programming, sensor interfacing, wireless protocols, edge computing, and building complete IoT solutions. Focus on practical projects and real-world applications.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Game Development with Unity and C#",
        "category": "game-development",
        "subcategory": "unity",
        "difficulty": "intermediate",
        "target_audience": "Aspiring game developers and interactive media creators",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Basic programming concepts", "C# fundamentals", "3D mathematics basics"],
        "learning_outcomes": [
            "Master Unity engine and C# scripting",
            "Create 2D and 3D games from concept to deployment",
            "Implement game physics and animation systems",
            "Design user interfaces and game mechanics",
            "Publish games to multiple platforms"
        ],
        "tags": ["unity", "game-development", "csharp", "3d-graphics", "mobile-games"],
        "request": {
            "subject": "Game Development with Unity and C#",
            "goal": "I want to become proficient in game development using Unity and C#. Teach me game design principles, Unity editor, scripting, physics, animation, UI design, and publishing. Include hands-on projects building complete games.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "3D Graphics and WebGL Programming",
        "category": "graphics-programming",
        "subcategory": "webgl",
        "difficulty": "advanced",
        "target_audience": "Developers creating interactive 3D web experiences",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["JavaScript proficiency", "Linear algebra knowledge", "Computer graphics basics"],
        "learning_outcomes": [
            "Master WebGL and Three.js for 3D web graphics",
            "Implement shaders and lighting systems",
            "Create interactive 3D scenes and animations",
            "Optimize 3D performance for web browsers",
            "Build immersive web experiences and visualizations"
        ],
        "tags": ["webgl", "threejs", "3d-graphics", "shaders", "visualization"],
        "request": {
            "subject": "3D Graphics and WebGL Programming",
            "goal": "I want to master 3D graphics programming for the web using WebGL and Three.js. Teach me 3D mathematics, shader programming, lighting, texturing, and performance optimization. Focus on creating interactive 3D experiences and data visualizations.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Rust Systems Programming",
        "category": "programming-languages",
        "subcategory": "systems",
        "difficulty": "intermediate",
        "target_audience": "Developers interested in memory-safe systems programming",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Programming experience", "Understanding of memory management", "Command line familiarity"],
        "learning_outcomes": [
            "Master Rust syntax and ownership model",
            "Build high-performance systems applications",
            "Implement concurrent and parallel programs",
            "Create CLI tools and web services",
            "Contribute to open-source Rust projects"
        ],
        "tags": ["rust", "systems-programming", "memory-safety", "performance", "concurrency"],
        "request": {
            "subject": "Rust Systems Programming",
            "goal": "I want to master Rust for systems programming. Teach me ownership, borrowing, lifetimes, concurrency, error handling, and building high-performance applications. Include practical projects like CLI tools, web servers, and system utilities.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # EMERGING TECHNOLOGIES
    {
        "title": "Quantum Computing with Qiskit",
        "category": "quantum-computing",
        "subcategory": "programming",
        "difficulty": "advanced",
        "target_audience": "Researchers and developers exploring quantum computing applications",
        "estimated_hours": 90,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Linear algebra", "Python programming", "Basic quantum mechanics"],
        "learning_outcomes": [
            "Understand quantum computing principles and algorithms",
            "Program quantum circuits using Qiskit",
            "Implement quantum algorithms like Shor's and Grover's",
            "Work with quantum simulators and real hardware",
            "Explore quantum machine learning applications"
        ],
        "tags": ["quantum-computing", "qiskit", "quantum-algorithms", "python", "research"],
        "request": {
            "subject": "Quantum Computing with Qiskit",
            "goal": "I want to learn quantum computing programming using Qiskit. Teach me quantum mechanics basics, quantum circuits, key algorithms, quantum machine learning, and practical applications. Focus on hands-on programming with simulators and real quantum hardware.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "AR/VR Development with Unity XR",
        "category": "extended-reality",
        "subcategory": "ar-vr",
        "difficulty": "intermediate",
        "target_audience": "Developers building immersive AR/VR applications",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Unity basics", "C# programming", "3D development concepts"],
        "learning_outcomes": [
            "Build AR applications for mobile devices",
            "Create VR experiences for headsets",
            "Implement spatial tracking and hand interactions",
            "Design immersive user interfaces",
            "Deploy to AR/VR platforms and app stores"
        ],
        "tags": ["ar", "vr", "unity-xr", "immersive-tech", "spatial-computing"],
        "request": {
            "subject": "AR/VR Development with Unity XR",
            "goal": "I want to master AR/VR development using Unity XR Toolkit. Teach me spatial tracking, interaction systems, UI design for immersive experiences, performance optimization, and deployment to multiple XR platforms. Include practical AR and VR projects.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED DATA & ANALYTICS
    {
        "title": "Real-time Data Engineering with Apache Kafka",
        "category": "data-engineering",
        "subcategory": "streaming",
        "difficulty": "intermediate",
        "target_audience": "Data engineers building real-time data pipelines",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Distributed systems basics", "Java/Python programming", "Database knowledge"],
        "learning_outcomes": [
            "Design and implement Kafka streaming architectures",
            "Build real-time data pipelines and ETL processes",
            "Integrate with databases and analytics platforms",
            "Monitor and scale streaming applications",
            "Implement event-driven microservices"
        ],
        "tags": ["kafka", "streaming", "real-time", "data-pipelines", "event-driven"],
        "request": {
            "subject": "Real-time Data Engineering with Apache Kafka",
            "goal": "I want to master real-time data engineering using Apache Kafka. Teach me streaming architectures, Kafka Streams, Connect, schema registry, monitoring, and building event-driven systems. Focus on production-ready data pipelines and microservices.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "MLOps and Model Deployment at Scale",
        "category": "machine-learning-ops",
        "subcategory": "deployment",
        "difficulty": "intermediate",
        "target_audience": "ML engineers deploying and maintaining ML systems in production",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Machine learning basics", "Python programming", "Docker knowledge", "Cloud platforms"],
        "learning_outcomes": [
            "Design ML deployment pipelines with CI/CD",
            "Implement model versioning and monitoring",
            "Build scalable inference services",
            "Manage model drift and retraining workflows",
            "Deploy ML models on cloud and edge platforms"
        ],
        "tags": ["mlops", "model-deployment", "kubernetes", "monitoring", "ci-cd"],
        "request": {
            "subject": "MLOps and Model Deployment at Scale",
            "goal": "I want to master MLOps for deploying and maintaining machine learning models in production. Teach me CI/CD for ML, model serving, monitoring, versioning, A/B testing, and scaling inference systems. Include real-world deployment scenarios.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # CREATIVE TECHNOLOGY
    {
        "title": "Creative Coding with p5.js and Generative Art",
        "category": "creative-technology",
        "subcategory": "generative-art",
        "difficulty": "beginner",
        "target_audience": "Artists, designers, and developers interested in creative coding",
        "estimated_hours": 80,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Basic programming concepts", "JavaScript fundamentals", "Visual design interest"],
        "learning_outcomes": [
            "Master p5.js for interactive visual programming",
            "Create generative art and algorithmic designs",
            "Build interactive installations and web experiences",
            "Implement data visualization and creative coding techniques",
            "Develop digital art portfolios and exhibitions"
        ],
        "tags": ["p5js", "creative-coding", "generative-art", "interactive-design", "visualization"],
        "request": {
            "subject": "Creative Coding with p5.js and Generative Art",
            "goal": "I want to learn creative coding and generative art using p5.js. Teach me algorithmic design, interactive visuals, animation techniques, data visualization, and creating digital art installations. Focus on artistic expression through code.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # BUSINESS & ENTREPRENEURSHIP
    {
        "title": "Tech Startup Fundamentals and MVP Development",
        "category": "entrepreneurship",
        "subcategory": "startups",
        "difficulty": "intermediate",
        "target_audience": "Aspiring tech entrepreneurs and startup founders",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Business acumen", "Basic technical understanding", "Problem-solving skills"],
        "learning_outcomes": [
            "Validate startup ideas and identify market opportunities",
            "Build MVP products using lean development principles",
            "Understand funding options and investor pitching",
            "Master growth hacking and customer acquisition",
            "Navigate legal and operational aspects of startups"
        ],
        "tags": ["startup", "mvp", "entrepreneurship", "product-management", "business"],
        "request": {
            "subject": "Tech Startup Fundamentals and MVP Development",
            "goal": "I want to learn how to build and launch a successful tech startup. Teach me idea validation, MVP development, market research, funding strategies, team building, and scaling. Include real startup case studies and practical frameworks.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED TESTING & QUALITY
    {
        "title": "Advanced Test Automation and Quality Engineering",
        "category": "quality-assurance",
        "subcategory": "automation",
        "difficulty": "intermediate",
        "target_audience": "QA engineers and developers focusing on test automation",
        "estimated_hours": 90,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Testing fundamentals", "Programming basics", "Web technologies"],
        "learning_outcomes": [
            "Design comprehensive test automation frameworks",
            "Implement end-to-end testing with Selenium and Playwright",
            "Build API testing and performance testing suites",
            "Master CI/CD integration for automated testing",
            "Establish quality metrics and testing best practices"
        ],
        "tags": ["test-automation", "selenium", "playwright", "api-testing", "quality-assurance"],
        "request": {
            "subject": "Advanced Test Automation and Quality Engineering",
            "goal": "I want to master test automation and quality engineering. Teach me framework design, UI automation, API testing, performance testing, CI/CD integration, and quality metrics. Focus on building robust, maintainable test suites.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ==============================================================================
    # TRENDING PROGRAMMING LANGUAGES FOR 2024-2025
    # ==============================================================================
    
    {
        "title": "Python Mastery for Data Science and AI Development",
        "category": "programming-languages",
        "subcategory": "python",
        "difficulty": "beginner",
        "target_audience": "Beginners and developers wanting to master Python for AI and data science",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.7,
        "prerequisites": ["Basic programming concepts", "High school mathematics"],
        "learning_outcomes": [
            "Master Python syntax and advanced programming concepts",
            "Build data analysis pipelines with pandas and NumPy",
            "Create machine learning models with scikit-learn and TensorFlow",
            "Develop web applications with Django and FastAPI",
            "Write clean, Pythonic code following industry best practices"
        ],
        "tags": ["python", "programming", "data-science", "ai", "web-development", "fundamentals"],
        "request": {
            "subject": "Complete Python Programming Mastery",
            "goal": "I want to master Python programming from fundamentals to advanced applications. Cover syntax, OOP, functional programming, data structures, libraries for data science and AI, web development, testing, and deployment. Build a strong foundation for any Python career path.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "TypeScript Full-Stack Development",
        "category": "programming-languages",
        "subcategory": "typescript",
        "difficulty": "intermediate",
        "target_audience": "JavaScript developers transitioning to type-safe development",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["JavaScript fundamentals", "ES6+ features", "Basic web development"],
        "learning_outcomes": [
            "Master TypeScript syntax and advanced type system",
            "Build type-safe React applications with TypeScript",
            "Develop backend APIs with Node.js and TypeScript",
            "Implement advanced patterns like generics and decorators",
            "Set up comprehensive TypeScript tooling and workflows"
        ],
        "tags": ["typescript", "javascript", "type-safety", "fullstack", "react", "nodejs"],
        "request": {
            "subject": "TypeScript Full-Stack Development",
            "goal": "I want to master TypeScript for full-stack development. Teach me TypeScript fundamentals, advanced types, React with TypeScript, Node.js backend development, tooling configuration, and best practices. Focus on building scalable, type-safe applications.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Swift iOS Development and App Store Success",
        "category": "programming-languages",
        "subcategory": "swift",
        "difficulty": "beginner",
        "target_audience": "Developers wanting to build iOS applications and publish to App Store",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Basic programming concepts", "Object-oriented programming"],
        "learning_outcomes": [
            "Master Swift programming language and iOS development",
            "Build beautiful iOS apps with SwiftUI and UIKit",
            "Implement Core Data for data persistence",
            "Integrate device features and third-party APIs",
            "Deploy apps to App Store and handle app lifecycle"
        ],
        "tags": ["swift", "ios", "mobile", "swiftui", "app-store", "xcode"],
        "request": {
            "subject": "Swift iOS Development",
            "goal": "I want to master Swift and iOS development. Teach me Swift programming, SwiftUI, UIKit, Core Data, networking, device integration, testing, and App Store deployment. Focus on building professional iOS applications from concept to publication.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Kotlin Android Development and Play Store Publishing",
        "category": "programming-languages",
        "subcategory": "kotlin",
        "difficulty": "beginner",
        "target_audience": "Developers building Android applications with modern Kotlin",
        "estimated_hours": 115,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Basic programming concepts", "Object-oriented programming"],
        "learning_outcomes": [
            "Master Kotlin programming and Android development fundamentals",
            "Build modern Android apps with Jetpack Compose",
            "Implement MVVM architecture and dependency injection",
            "Work with Android APIs and third-party libraries",
            "Publish apps to Google Play Store successfully"
        ],
        "tags": ["kotlin", "android", "mobile", "jetpack-compose", "mvvm", "play-store"],
        "request": {
            "subject": "Kotlin Android Development",
            "goal": "I want to master Kotlin for Android development. Teach me Kotlin programming, Jetpack Compose, MVVM architecture, Room database, networking, testing, and Play Store deployment. Focus on modern Android development practices and creating professional apps.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "C++ Modern Systems Programming and Performance",
        "category": "programming-languages",
        "subcategory": "cpp",
        "difficulty": "intermediate",
        "target_audience": "Developers building high-performance systems and game engines",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Programming fundamentals", "Basic understanding of computer architecture"],
        "learning_outcomes": [
            "Master modern C++17/20 features and best practices",
            "Build high-performance applications and game engines",
            "Understand memory management and optimization techniques",
            "Implement concurrent and parallel programming patterns",
            "Develop system-level software and embedded applications"
        ],
        "tags": ["cpp", "systems-programming", "performance", "game-development", "embedded"],
        "request": {
            "subject": "Modern C++ Systems Programming",
            "goal": "I want to master modern C++ for systems programming and high-performance applications. Teach me C++17/20 features, memory management, concurrency, STL, design patterns, debugging, and performance optimization. Focus on building robust, efficient systems.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Java Enterprise Development and Spring Boot",
        "category": "programming-languages",
        "subcategory": "java",
        "difficulty": "intermediate",
        "target_audience": "Developers building enterprise applications and microservices",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Object-oriented programming", "Basic web concepts", "Database fundamentals"],
        "learning_outcomes": [
            "Master Java programming and JVM ecosystem",
            "Build enterprise applications with Spring Boot",
            "Implement microservices architecture and patterns",
            "Work with databases using JPA and Hibernate",
            "Deploy Java applications to cloud platforms"
        ],
        "tags": ["java", "spring-boot", "enterprise", "microservices", "jvm", "backend"],
        "request": {
            "subject": "Java Enterprise Development",
            "goal": "I want to master Java for enterprise application development. Teach me Java fundamentals, Spring Framework, Spring Boot, microservices, database integration, security, testing, and cloud deployment. Focus on building scalable enterprise systems.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "C# .NET Development and Azure Integration",
        "category": "programming-languages",
        "subcategory": "csharp",
        "difficulty": "intermediate",
        "target_audience": "Developers building .NET applications and Microsoft ecosystem solutions",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Object-oriented programming", "Basic web development", "Database concepts"],
        "learning_outcomes": [
            "Master C# programming and .NET ecosystem",
            "Build web applications with ASP.NET Core",
            "Develop desktop applications with WPF or WinUI",
            "Implement cloud solutions with Azure services",
            "Create robust enterprise applications with Entity Framework"
        ],
        "tags": ["csharp", "dotnet", "aspnet-core", "azure", "enterprise", "microsoft"],
        "request": {
            "subject": "C# .NET Development",
            "goal": "I want to master C# and .NET development. Teach me C# programming, ASP.NET Core, Entity Framework, Azure cloud services, desktop development, testing, and deployment. Focus on building professional applications in the Microsoft ecosystem.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Julia Scientific Computing and Data Analysis",
        "category": "programming-languages",
        "subcategory": "julia",
        "difficulty": "intermediate",
        "target_audience": "Scientists, researchers, and engineers needing high-performance computing",
        "estimated_hours": 90,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Programming fundamentals", "Linear algebra", "Statistics basics"],
        "learning_outcomes": [
            "Master Julia syntax and performance optimization",
            "Build scientific computing applications and simulations",
            "Implement parallel and distributed computing solutions",
            "Create data analysis workflows and visualizations",
            "Develop packages for the Julia ecosystem"
        ],
        "tags": ["julia", "scientific-computing", "high-performance", "data-analysis", "research"],
        "request": {
            "subject": "Julia Scientific Computing",
            "goal": "I want to master Julia for scientific computing and high-performance numerical analysis. Teach me Julia programming, package development, parallel computing, scientific libraries, data visualization, and performance optimization. Focus on research and scientific applications.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Zig Systems Programming and Performance Computing",
        "category": "programming-languages",
        "subcategory": "zig",
        "difficulty": "intermediate",
        "target_audience": "Systems programmers interested in next-generation systems languages",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["C programming experience", "Systems programming concepts", "Memory management understanding"],
        "learning_outcomes": [
            "Master Zig syntax and compile-time programming",
            "Build high-performance systems applications",
            "Understand Zig's approach to memory safety without garbage collection",
            "Create efficient cross-platform applications",
            "Contribute to the growing Zig ecosystem"
        ],
        "tags": ["zig", "systems-programming", "performance", "memory-safety", "cross-platform"],
        "request": {
            "subject": "Zig Systems Programming",
            "goal": "I want to master Zig for systems programming. Teach me Zig syntax, compile-time programming, memory management, cross-compilation, performance optimization, and building system tools. Focus on practical systems programming and understanding Zig's unique approach to safety and performance.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Mojo Programming for AI and High-Performance Computing",
        "category": "programming-languages",
        "subcategory": "mojo",
        "difficulty": "intermediate",
        "target_audience": "AI researchers and developers needing Python compatibility with C++ performance",
        "estimated_hours": 95,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Python programming", "AI/ML concepts", "Performance optimization basics"],
        "learning_outcomes": [
            "Master Mojo syntax and performance features",
            "Build high-performance AI applications with Python compatibility",
            "Optimize machine learning workloads for speed",
            "Understand Mojo's approach to parallelization and vectorization",
            "Integrate Mojo with existing Python AI/ML workflows"
        ],
        "tags": ["mojo", "ai", "machine-learning", "performance", "python-compatible", "hpc"],
        "request": {
            "subject": "Mojo Programming for AI",
            "goal": "I want to learn Mojo programming for high-performance AI development. Teach me Mojo syntax, performance optimization, AI model development, parallelization, and integration with Python ecosystems. Focus on building fast AI applications with Mojo's unique capabilities.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Elixir Functional Programming and Distributed Systems",
        "category": "programming-languages",
        "subcategory": "elixir",
        "difficulty": "intermediate",
        "target_audience": "Developers building fault-tolerant and concurrent systems",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Programming fundamentals", "Functional programming concepts", "Distributed systems basics"],
        "learning_outcomes": [
            "Master Elixir syntax and functional programming paradigms",
            "Build fault-tolerant applications with OTP (Open Telecom Platform)",
            "Implement real-time web applications with Phoenix",
            "Handle massive concurrency with Actor model",
            "Deploy distributed Elixir systems at scale"
        ],
        "tags": ["elixir", "functional-programming", "distributed-systems", "phoenix", "concurrency", "fault-tolerance"],
        "request": {
            "subject": "Elixir Functional Programming",
            "goal": "I want to master Elixir for building fault-tolerant, concurrent systems. Teach me functional programming in Elixir, OTP design principles, Phoenix web framework, LiveView, distributed systems patterns, and deployment strategies. Focus on building resilient applications.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "R Programming for Statistical Analysis and Data Science",
        "category": "programming-languages",
        "subcategory": "r",
        "difficulty": "beginner",
        "target_audience": "Statisticians, researchers, and data analysts focusing on statistical computing",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Statistics fundamentals", "Basic programming concepts", "Mathematics background"],
        "learning_outcomes": [
            "Master R programming and statistical computing",
            "Perform advanced statistical analysis and modeling",
            "Create professional data visualizations with ggplot2",
            "Build reproducible research workflows with R Markdown",
            "Develop R packages and contribute to CRAN"
        ],
        "tags": ["r", "statistics", "data-analysis", "visualization", "research", "ggplot2"],
        "request": {
            "subject": "R Programming for Statistical Analysis",
            "goal": "I want to master R for statistical analysis and data science. Teach me R programming, statistical methods, data manipulation with dplyr, visualization with ggplot2, R Markdown, package development, and reproducible research. Focus on statistical rigor and research applications.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "MATLAB Programming for Engineering and Scientific Research",
        "category": "programming-languages",
        "subcategory": "matlab",
        "difficulty": "beginner",
        "target_audience": "Engineers, scientists, and researchers in technical fields",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Engineering mathematics", "Linear algebra", "Basic programming concepts"],
        "learning_outcomes": [
            "Master MATLAB programming and computational methods",
            "Perform advanced mathematical modeling and simulation",
            "Create professional technical visualizations and plots",
            "Build engineering applications with Simulink",
            "Integrate MATLAB with other engineering tools and workflows"
        ],
        "tags": ["matlab", "engineering", "scientific-computing", "simulation", "modeling", "research"],
        "request": {
            "subject": "MATLAB Engineering and Scientific Programming",
            "goal": "I want to master MATLAB for engineering and scientific applications. Teach me MATLAB programming, mathematical modeling, simulation, data analysis, visualization, Simulink, and integration with engineering workflows. Focus on solving real engineering and research problems.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ==============================================================================
    # MBA & BUSINESS SKILLS - COMPREHENSIVE COLLECTION
    # ==============================================================================

    # MARKETING & BRAND MANAGEMENT
    {
        "title": "Digital Marketing Strategy and Analytics",
        "category": "business",
        "subcategory": "marketing",
        "difficulty": "beginner",
        "target_audience": "Anyone looking to master modern marketing across all industries and career paths",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Basic computer skills", "Understanding of social media platforms"],
        "learning_outcomes": [
            "Develop comprehensive digital marketing strategies across channels",
            "Master Google Analytics, Facebook Ads, and marketing automation tools",
            "Create compelling content and brand messaging",
            "Analyze marketing data and optimize campaigns for ROI",
            "Build personal brand and professional marketing skills"
        ],
        "tags": ["digital-marketing", "analytics", "social-media", "content-marketing", "brand-building"],
        "request": {
            "subject": "Complete Digital Marketing Strategy and Analytics",
            "goal": "I want to master digital marketing from strategy to execution. Teach me SEO, social media marketing, Google Ads, email marketing, content creation, analytics, conversion optimization, and building effective marketing campaigns. Make it applicable for any business or personal brand.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Brand Strategy and Customer Psychology",
        "category": "business",
        "subcategory": "branding",
        "difficulty": "intermediate",
        "target_audience": "Professionals, entrepreneurs, and individuals building brands in any field",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Basic marketing knowledge", "Understanding of consumer behavior"],
        "learning_outcomes": [
            "Develop powerful brand strategies and positioning",
            "Understand consumer psychology and decision-making processes",
            "Create brand identity systems and messaging frameworks",
            "Build emotional connections with target audiences",
            "Apply branding principles to personal and professional contexts"
        ],
        "tags": ["brand-strategy", "consumer-psychology", "positioning", "brand-identity", "marketing-psychology"],
        "request": {
            "subject": "Brand Strategy and Consumer Psychology Mastery",
            "goal": "I want to master brand building and consumer psychology. Teach me brand positioning, consumer behavior analysis, emotional branding, visual identity creation, brand storytelling, and how to build memorable brands that connect with people. Include both business and personal branding applications.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # FINANCE & INVESTMENT
    {
        "title": "Financial Analysis and Investment Strategy",
        "category": "business",
        "subcategory": "finance",
        "difficulty": "intermediate",
        "target_audience": "Anyone wanting to master personal finance, investing, and financial decision-making",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["Basic math skills", "Understanding of economic concepts"],
        "learning_outcomes": [
            "Analyze financial statements and company valuations",
            "Build diversified investment portfolios and retirement planning",
            "Understand risk management and insurance strategies",
            "Master personal budgeting and debt management",
            "Make informed financial decisions for life goals"
        ],
        "tags": ["financial-analysis", "investing", "portfolio-management", "personal-finance", "valuation"],
        "request": {
            "subject": "Complete Financial Analysis and Investment Mastery",
            "goal": "I want to master finance from personal money management to investment strategies. Teach me financial statement analysis, stock/bond investing, portfolio theory, risk management, retirement planning, tax strategies, and how to build long-term wealth. Make it practical for anyone regardless of current income level.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Corporate Finance and Business Valuation",
        "category": "business",
        "subcategory": "corporate-finance",
        "difficulty": "intermediate",
        "target_audience": "Business professionals, entrepreneurs, and anyone evaluating business opportunities",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Basic accounting knowledge", "Financial math fundamentals"],
        "learning_outcomes": [
            "Evaluate business opportunities and startup investments",
            "Perform DCF analysis and business valuations",
            "Understand capital structure and funding options",
            "Analyze merger and acquisition opportunities",
            "Make strategic financial decisions for any organization"
        ],
        "tags": ["corporate-finance", "business-valuation", "dcf-analysis", "capital-structure", "financial-modeling"],
        "request": {
            "subject": "Corporate Finance and Business Valuation",
            "goal": "I want to master corporate finance and business valuation. Teach me financial modeling, DCF analysis, business valuation methods, capital budgeting, funding strategies, and how to evaluate investment opportunities. Make it applicable for entrepreneurs, investors, and business decision-makers.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # OPERATIONS & SUPPLY CHAIN
    {
        "title": "Operations Management and Process Optimization",
        "category": "business",
        "subcategory": "operations",
        "difficulty": "intermediate",
        "target_audience": "Managers, entrepreneurs, and professionals optimizing any type of workflow or process",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Basic business understanding", "Analytical thinking"],
        "learning_outcomes": [
            "Design efficient processes and eliminate waste",
            "Implement Lean Six Sigma methodologies",
            "Optimize supply chains and inventory management",
            "Use data analytics for operational decisions",
            "Build scalable systems for any organization"
        ],
        "tags": ["operations-management", "process-optimization", "lean-six-sigma", "supply-chain", "efficiency"],
        "request": {
            "subject": "Operations Management and Process Optimization",
            "goal": "I want to master operations and process optimization. Teach me Lean methodology, Six Sigma, supply chain management, inventory optimization, quality control, and how to build efficient systems. Make it applicable for any business, nonprofit, or personal productivity system.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # LEADERSHIP & MANAGEMENT
    {
        "title": "Leadership Development and Team Management",
        "category": "business",
        "subcategory": "leadership",
        "difficulty": "intermediate",
        "target_audience": "Current and aspiring leaders across all industries and organizational levels",
        "estimated_hours": 90,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Professional experience", "Interest in leadership roles"],
        "learning_outcomes": [
            "Develop authentic leadership style and emotional intelligence",
            "Master team building and conflict resolution",
            "Learn effective communication and delegation skills",
            "Build high-performance teams and organizational culture",
            "Lead through change and uncertainty"
        ],
        "tags": ["leadership", "team-management", "emotional-intelligence", "communication", "organizational-behavior"],
        "request": {
            "subject": "Leadership Development and Team Management",
            "goal": "I want to become an effective leader and team manager. Teach me leadership styles, emotional intelligence, team dynamics, conflict resolution, performance management, and organizational psychology. Make it applicable for any leadership role - from managing a small team to running an organization.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Strategic Management and Business Planning",
        "category": "business",
        "subcategory": "strategy",
        "difficulty": "intermediate",
        "target_audience": "Business professionals, entrepreneurs, and anyone involved in strategic planning",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Business fundamentals", "Analytical thinking"],
        "learning_outcomes": [
            "Develop comprehensive business strategies and competitive analysis",
            "Create effective business plans and strategic roadmaps",
            "Analyze market opportunities and competitive positioning",
            "Implement strategic initiatives and measure success",
            "Lead strategic transformation in any organization"
        ],
        "tags": ["strategic-management", "business-planning", "competitive-analysis", "strategic-thinking", "business-strategy"],
        "request": {
            "subject": "Strategic Management and Business Planning",
            "goal": "I want to master strategic thinking and business planning. Teach me strategic frameworks, competitive analysis, business model design, strategic planning processes, and implementation strategies. Make it valuable for entrepreneurs, business managers, and anyone making strategic decisions.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ENTREPRENEURSHIP & INNOVATION
    {
        "title": "Entrepreneurship and Startup Strategy",
        "category": "business",
        "subcategory": "entrepreneurship",
        "difficulty": "intermediate",
        "target_audience": "Aspiring entrepreneurs, side-hustle creators, and innovation-minded professionals",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["Business interest", "Problem-solving mindset"],
        "learning_outcomes": [
            "Identify and validate business opportunities",
            "Build minimum viable products and test market fit",
            "Understand funding options and investor relations",
            "Master lean startup methodology and agile development",
            "Scale businesses and manage growth challenges"
        ],
        "tags": ["entrepreneurship", "startup", "business-validation", "lean-startup", "innovation"],
        "request": {
            "subject": "Entrepreneurship and Startup Strategy",
            "goal": "I want to master entrepreneurship from idea to scale. Teach me opportunity recognition, business model validation, MVP development, funding strategies, growth hacking, and scaling operations. Include both traditional business and modern startup approaches applicable to any industry.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # DATA ANALYTICS FOR BUSINESS
    {
        "title": "Business Analytics and Data-Driven Decision Making",
        "category": "business",
        "subcategory": "analytics",
        "difficulty": "intermediate",
        "target_audience": "Business professionals wanting to leverage data for better decision-making",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Basic Excel skills", "Statistical thinking"],
        "learning_outcomes": [
            "Master business intelligence tools and dashboards",
            "Perform statistical analysis and predictive modeling",
            "Create data visualizations and storytelling with data",
            "Implement A/B testing and experimental design",
            "Build data-driven cultures and decision frameworks"
        ],
        "tags": ["business-analytics", "data-visualization", "statistical-analysis", "business-intelligence", "decision-making"],
        "request": {
            "subject": "Business Analytics and Data-Driven Decision Making",
            "goal": "I want to master business analytics and data-driven decision making. Teach me Excel advanced functions, SQL, Tableau/Power BI, statistical analysis, A/B testing, and how to translate data insights into business actions. Make it practical for any role that involves decision-making with data.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SALES & NEGOTIATION
    {
        "title": "Sales Mastery and Negotiation Skills",
        "category": "business",
        "subcategory": "sales",
        "difficulty": "beginner",
        "target_audience": "Anyone wanting to improve persuasion, negotiation, and sales skills for career and life",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Communication skills", "Interpersonal interest"],
        "learning_outcomes": [
            "Master consultative selling and relationship building",
            "Develop advanced negotiation and persuasion techniques",
            "Build sales funnels and customer acquisition systems",
            "Handle objections and close deals effectively",
            "Apply sales psychology to career advancement and personal goals"
        ],
        "tags": ["sales", "negotiation", "persuasion", "relationship-building", "communication"],
        "request": {
            "subject": "Sales Mastery and Advanced Negotiation",
            "goal": "I want to master sales and negotiation skills. Teach me consultative selling, relationship building, negotiation psychology, objection handling, closing techniques, and sales process design. Make it valuable for formal sales roles, career advancement, and everyday negotiations.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # PROJECT MANAGEMENT
    {
        "title": "Project Management and Agile Methodologies",
        "category": "business",
        "subcategory": "project-management",
        "difficulty": "intermediate",
        "target_audience": "Professionals managing projects, teams, or complex initiatives in any field",
        "estimated_hours": 90,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Team collaboration experience", "Organizational skills"],
        "learning_outcomes": [
            "Master PMP and Agile project management frameworks",
            "Plan, execute, and deliver projects on time and budget",
            "Lead cross-functional teams and manage stakeholders",
            "Use project management tools and software effectively",
            "Apply project management to personal and professional goals"
        ],
        "tags": ["project-management", "agile", "scrum", "pmp", "team-leadership"],
        "request": {
            "subject": "Project Management and Agile Methodologies",
            "goal": "I want to master project management across different methodologies. Teach me traditional PM (PMP), Agile, Scrum, Kanban, stakeholder management, risk management, and project planning tools. Make it applicable for any type of project from business initiatives to personal goals.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # HUMAN RESOURCES & ORGANIZATIONAL BEHAVIOR
    {
        "title": "Human Resource Management and Organizational Psychology",
        "category": "business",
        "subcategory": "human-resources",
        "difficulty": "intermediate",
        "target_audience": "Managers, HR professionals, and anyone working with people in organizations",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["People management experience", "Psychology interest"],
        "learning_outcomes": [
            "Understand talent acquisition and performance management",
            "Design compensation and benefits strategies",
            "Master employee development and retention strategies",
            "Navigate employment law and workplace compliance",
            "Build positive organizational culture and employee engagement"
        ],
        "tags": ["human-resources", "talent-management", "organizational-psychology", "employee-engagement", "performance-management"],
        "request": {
            "subject": "Human Resource Management and Organizational Psychology",
            "goal": "I want to master HR and organizational psychology. Teach me recruitment, performance management, compensation design, employee development, labor relations, and building great workplace cultures. Make it valuable for HR professionals, managers, and entrepreneurs building teams.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # INDIAN COMPETITIVE EXAMS - JEE/NEET PREPARATION
    {
        "title": "JEE Mathematics Mastery - Calculus and Algebra",
        "category": "competitive-exams",
        "subcategory": "jee-mathematics",
        "difficulty": "advanced",
        "target_audience": "JEE aspirants focusing on mathematics excellence",
        "estimated_hours": 150,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Class 10 mathematics", "Basic algebra", "Coordinate geometry"],
        "learning_outcomes": [
            "Master differential and integral calculus concepts",
            "Solve complex algebraic equations and inequalities",
            "Apply calculus in physics and engineering problems",
            "Develop speed and accuracy for JEE Main and Advanced",
            "Master coordinate geometry and vector algebra"
        ],
        "tags": ["jee", "mathematics", "calculus", "algebra", "competitive-exam"],
        "request": {
            "subject": "JEE Mathematics - Calculus and Algebra Mastery",
            "goal": "I want to master JEE Mathematics focusing on Calculus and Algebra. Teach me differential calculus, integral calculus, limits, continuity, algebraic manipulations, coordinate geometry, and complex numbers. Include JEE-level problem solving techniques and time management strategies.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "JEE Physics Mastery - Mechanics and Electromagnetism",
        "category": "competitive-exams",
        "subcategory": "jee-physics",
        "difficulty": "advanced",
        "target_audience": "JEE aspirants seeking physics excellence",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Class 10 physics", "Basic mathematics", "Vector concepts"],
        "learning_outcomes": [
            "Master classical mechanics and rotational motion",
            "Understand electromagnetic theory and applications",
            "Solve complex physics problems with mathematical rigor",
            "Apply physics concepts to engineering scenarios",
            "Develop problem-solving strategies for JEE Advanced"
        ],
        "tags": ["jee", "physics", "mechanics", "electromagnetism", "competitive-exam"],
        "request": {
            "subject": "JEE Physics - Mechanics and Electromagnetism",
            "goal": "I want to master JEE Physics focusing on Mechanics and Electromagnetism. Teach me kinematics, dynamics, rotational mechanics, waves, electricity, magnetism, and electromagnetic induction. Include advanced problem solving, conceptual understanding, and JEE exam strategies.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "NEET Biology Mastery - Cell Biology and Genetics",
        "category": "competitive-exams",
        "subcategory": "neet-biology",
        "difficulty": "intermediate",
        "target_audience": "NEET aspirants focusing on biology excellence",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Class 10 biology", "Basic chemistry", "Scientific terminology"],
        "learning_outcomes": [
            "Master cell structure and molecular biology concepts",
            "Understand genetics, heredity, and evolution",
            "Apply biological concepts to medical scenarios",
            "Develop diagram-based problem solving skills",
            "Master NCERT concepts for NEET preparation"
        ],
        "tags": ["neet", "biology", "cell-biology", "genetics", "medical-entrance"],
        "request": {
            "subject": "NEET Biology - Cell Biology and Genetics Mastery",
            "goal": "I want to master NEET Biology focusing on Cell Biology and Genetics. Teach me cell structure, biomolecules, cell division, genetics, molecular biology, evolution, and biotechnology. Include NCERT-based learning, diagram practice, and NEET-specific problem solving strategies.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # UPSC CIVIL SERVICES PREPARATION
    {
        "title": "UPSC Geography Mastery - Physical and Human Geography",
        "category": "competitive-exams",
        "subcategory": "upsc-geography",
        "difficulty": "intermediate",
        "target_audience": "UPSC aspirants with Geography as optional or general studies",
        "estimated_hours": 180,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Basic world knowledge", "Map reading skills", "Current affairs awareness"],
        "learning_outcomes": [
            "Master physical geography concepts and processes",
            "Understand human geography and population dynamics",
            "Analyze geographical factors in current affairs",
            "Develop map-based answer writing skills",
            "Apply geographical concepts to policy analysis"
        ],
        "tags": ["upsc", "geography", "civil-services", "physical-geography", "human-geography"],
        "request": {
            "subject": "UPSC Geography - Physical and Human Geography",
            "goal": "I want to master Geography for UPSC Civil Services. Teach me geomorphology, climatology, oceanography, biogeography, population geography, settlement geography, and economic geography. Include answer writing techniques, current affairs integration, and map-based studies.",
            "time_value": 15,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "UPSC History Mastery - Ancient and Medieval India",
        "category": "competitive-exams",
        "subcategory": "upsc-history",
        "difficulty": "intermediate",
        "target_audience": "UPSC aspirants focusing on Indian history",
        "estimated_hours": 160,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Basic Indian history knowledge", "Timeline understanding", "Historical analysis skills"],
        "learning_outcomes": [
            "Master ancient Indian civilizations and empires",
            "Understand medieval Indian history and culture",
            "Analyze historical events and their contemporary relevance",
            "Develop chronological and thematic understanding",
            "Apply historical knowledge to current affairs"
        ],
        "tags": ["upsc", "history", "ancient-india", "medieval-india", "civil-services"],
        "request": {
            "subject": "UPSC History - Ancient and Medieval India",
            "goal": "I want to master Indian History for UPSC preparation. Teach me Indus Valley Civilization, Vedic period, ancient empires, medieval dynasties, cultural developments, and socio-economic changes. Include answer writing, source-based questions, and connecting history with current affairs.",
            "time_value": 13,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "UPSC Polity and Constitution Mastery",
        "category": "competitive-exams",
        "subcategory": "upsc-polity",
        "difficulty": "intermediate",
        "target_audience": "UPSC aspirants focusing on Indian polity and governance",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Basic civics knowledge", "Current affairs awareness", "Legal terminology"],
        "learning_outcomes": [
            "Master Indian Constitution and its key features",
            "Understand governance structures and processes",
            "Analyze contemporary political developments",
            "Apply constitutional knowledge to current affairs",
            "Develop answer writing for polity questions"
        ],
        "tags": ["upsc", "polity", "constitution", "governance", "civil-services"],
        "request": {
            "subject": "UPSC Polity and Constitution Mastery",
            "goal": "I want to master Indian Polity and Constitution for UPSC. Teach me constitutional provisions, fundamental rights, directive principles, government structures, electoral processes, judiciary, federalism, and local governance. Include current affairs integration and answer writing techniques.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # CAT AND MBA ENTRANCE PREPARATION
    {
        "title": "CAT Quantitative Aptitude Mastery",
        "category": "competitive-exams",
        "subcategory": "cat-quant",
        "difficulty": "intermediate",
        "target_audience": "CAT and MBA entrance exam aspirants",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Class 10 mathematics", "Basic algebra", "Logical reasoning"],
        "learning_outcomes": [
            "Master arithmetic and number systems",
            "Solve complex geometry and mensuration problems",
            "Apply advanced algebra and functions",
            "Develop speed calculation techniques",
            "Master time management for CAT exam"
        ],
        "tags": ["cat", "quantitative-aptitude", "mba", "mathematics", "entrance-exam"],
        "request": {
            "subject": "CAT Quantitative Aptitude Mastery",
            "goal": "I want to master Quantitative Aptitude for CAT and MBA entrances. Teach me arithmetic, algebra, geometry, number systems, percentages, profit-loss, time-work, and advanced mathematics. Include shortcut techniques, time management, and mock test strategies.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "CAT Logical Reasoning and Data Interpretation",
        "category": "competitive-exams",
        "subcategory": "cat-reasoning",
        "difficulty": "intermediate",
        "target_audience": "CAT aspirants focusing on reasoning and data analysis",
        "estimated_hours": 90,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Basic mathematics", "Analytical thinking", "Pattern recognition"],
        "learning_outcomes": [
            "Master logical reasoning and critical thinking",
            "Analyze and interpret complex data sets",
            "Solve puzzles and arrangement problems",
            "Develop data interpretation skills for charts and graphs",
            "Apply reasoning techniques to business scenarios"
        ],
        "tags": ["cat", "logical-reasoning", "data-interpretation", "analytical-thinking", "mba"],
        "request": {
            "subject": "CAT Logical Reasoning and Data Interpretation",
            "goal": "I want to master Logical Reasoning and Data Interpretation for CAT. Teach me seating arrangements, blood relations, syllogisms, data sufficiency, charts analysis, table interpretation, and critical reasoning. Include solving techniques and time optimization strategies.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # GATE ENGINEERING PREPARATION
    {
        "title": "GATE Computer Science - Algorithms and Data Structures",
        "category": "competitive-exams",
        "subcategory": "gate-cs",
        "difficulty": "advanced",
        "target_audience": "GATE CS aspirants and computer science students",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Programming fundamentals", "Mathematics for CS", "Basic data structures"],
        "learning_outcomes": [
            "Master advanced algorithms and complexity analysis",
            "Implement and analyze data structures efficiently",
            "Solve GATE-level computational problems",
            "Apply algorithmic thinking to engineering problems",
            "Develop optimization and design strategies"
        ],
        "tags": ["gate", "computer-science", "algorithms", "data-structures", "engineering"],
        "request": {
            "subject": "GATE Computer Science - Algorithms and Data Structures",
            "goal": "I want to master Algorithms and Data Structures for GATE CS. Teach me sorting, searching, graph algorithms, dynamic programming, greedy algorithms, trees, hashing, and complexity analysis. Include GATE previous years problems and optimization techniques.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "GATE Electrical Engineering - Power Systems and Machines",
        "category": "competitive-exams",
        "subcategory": "gate-ee",
        "difficulty": "advanced",
        "target_audience": "GATE EE aspirants and electrical engineering students",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Circuit analysis", "Electromagnetic theory", "Mathematics for engineers"],
        "learning_outcomes": [
            "Master power system analysis and protection",
            "Understand electrical machines and drives",
            "Analyze power electronics and control systems",
            "Apply electrical engineering to practical problems",
            "Solve complex GATE-level numerical problems"
        ],
        "tags": ["gate", "electrical-engineering", "power-systems", "machines", "engineering"],
        "request": {
            "subject": "GATE Electrical Engineering - Power Systems and Machines",
            "goal": "I want to master Power Systems and Electrical Machines for GATE EE. Teach me power generation, transmission, distribution, transformers, induction motors, synchronous machines, power electronics, and control systems. Include numerical problem solving and GATE preparation strategies.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # UPSC CIVIL SERVICES PREPARATION
    {
        "title": "UPSC Prelims Preparation - General Studies and CSAT",
        "category": "competitive-exams",
        "subcategory": "upsc-prelims",
        "difficulty": "advanced",
        "target_audience": "UPSC aspirants preparing for Civil Services Prelims",
        "estimated_hours": 180,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Graduate degree", "Basic knowledge of Indian history and polity", "Current affairs awareness"],
        "learning_outcomes": [
            "Master Indian polity, constitution, and governance",
            "Understand Indian and world history comprehensively",
            "Develop analytical skills for geography and environment",
            "Stay updated with current affairs and government schemes",
            "Excel in quantitative aptitude and logical reasoning (CSAT)"
        ],
        "tags": ["upsc", "prelims", "general-studies", "csat", "civil-services"],
        "request": {
            "subject": "UPSC Prelims - General Studies and CSAT Mastery",
            "goal": "I want to master UPSC Prelims preparation covering General Studies Paper I and CSAT Paper II. Teach me Indian polity, history, geography, economics, environment, science & technology, and current affairs. Include CSAT quantitative aptitude, comprehension, and logical reasoning. Focus on previous year analysis, answer writing techniques, and time management strategies.",
            "time_value": 15,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "UPSC Mains Preparation - Essay and General Studies",
        "category": "competitive-exams",
        "subcategory": "upsc-mains",
        "difficulty": "expert",
        "target_audience": "UPSC aspirants preparing for Civil Services Mains",
        "estimated_hours": 220,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["UPSC Prelims qualification", "Strong foundation in General Studies", "Essay writing basics"],
        "learning_outcomes": [
            "Master essay writing with contemporary themes",
            "Develop analytical answer writing for GS papers",
            "Understand ethics, integrity, and aptitude concepts",
            "Apply critical thinking to governance and public administration",
            "Excel in interdisciplinary problem-solving approach"
        ],
        "tags": ["upsc", "mains", "essay", "general-studies", "answer-writing"],
        "request": {
            "subject": "UPSC Mains - Essay and General Studies Mastery",
            "goal": "I want to master UPSC Mains preparation focusing on Essay Paper and General Studies papers (GS1-GS4). Teach me essay writing techniques, answer structuring, ethics and integrity, governance concepts, security issues, and international relations. Include previous year analysis, answer evaluation criteria, and time management for descriptive papers.",
            "time_value": 18,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # BANKING SECTOR EXAMS
    {
        "title": "SBI PO Preparation - Banking and Financial Awareness",
        "category": "competitive-exams",
        "subcategory": "banking-exams",
        "difficulty": "intermediate",
        "target_audience": "Banking exam aspirants targeting Probationary Officer positions",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Graduate degree", "Basic mathematics", "English proficiency"],
        "learning_outcomes": [
            "Master quantitative aptitude for banking exams",
            "Develop reasoning and analytical skills",
            "Understand banking and financial systems comprehensively",
            "Excel in English language and comprehension",
            "Learn current affairs related to banking and economy"
        ],
        "tags": ["sbi-po", "banking", "quantitative-aptitude", "reasoning", "financial-awareness"],
        "request": {
            "subject": "SBI PO Banking and Financial Awareness Mastery",
            "goal": "I want to master SBI PO preparation covering all sections - Quantitative Aptitude, Reasoning Ability, English Language, General Awareness, and Computer Aptitude. Teach me banking concepts, financial markets, monetary policy, quantitative techniques, logical reasoning, and English comprehension. Include mock test strategies and time management techniques.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "IBPS Clerk and RRB Preparation",
        "category": "competitive-exams",
        "subcategory": "banking-exams",
        "difficulty": "intermediate",
        "target_audience": "Banking exam aspirants for clerical and rural banking positions",
        "estimated_hours": 100,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Graduate degree", "Basic arithmetic", "Hindi/English proficiency"],
        "learning_outcomes": [
            "Master fundamental quantitative aptitude concepts",
            "Develop basic reasoning and computer skills",
            "Understand rural banking and financial inclusion",
            "Excel in language skills (Hindi/English)",
            "Learn banking regulations and customer service"
        ],
        "tags": ["ibps", "clerk", "rrb", "banking", "financial-inclusion"],
        "request": {
            "subject": "IBPS Clerk and RRB Banking Preparation",
            "goal": "I want to master IBPS Clerk and RRB preparation focusing on fundamental banking concepts. Teach me basic quantitative aptitude, reasoning ability, English/Hindi language, computer knowledge, and general awareness. Include rural banking concepts, financial inclusion, and customer service skills. Focus on accuracy and speed building techniques.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SSC EXAMS
    {
        "title": "SSC CGL Preparation - Comprehensive Government Jobs",
        "category": "competitive-exams",
        "subcategory": "ssc-exams",
        "difficulty": "intermediate",
        "target_audience": "SSC Combined Graduate Level exam aspirants",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Graduate degree", "Basic mathematics", "General knowledge"],
        "learning_outcomes": [
            "Master quantitative aptitude and data interpretation",
            "Develop strong general intelligence and reasoning",
            "Excel in English comprehension and grammar",
            "Understand Indian history, polity, and current affairs",
            "Learn statistical analysis and data handling"
        ],
        "tags": ["ssc-cgl", "government-jobs", "quantitative-aptitude", "reasoning", "general-awareness"],
        "request": {
            "subject": "SSC CGL Comprehensive Government Jobs Preparation",
            "goal": "I want to master SSC CGL preparation covering all tiers - General Intelligence & Reasoning, General Awareness, Quantitative Aptitude, and English Comprehension. Teach me statistical investigator concepts, data interpretation, government schemes, Indian geography, and mathematical problem-solving. Include tier-wise preparation strategies and descriptive writing skills.",
            "time_value": 14,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "SSC CHSL Preparation - Higher Secondary Level Posts",
        "category": "competitive-exams",
        "subcategory": "ssc-exams",
        "difficulty": "intermediate",
        "target_audience": "SSC Combined Higher Secondary Level exam aspirants",
        "estimated_hours": 110,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["12th pass", "Basic English", "General awareness"],
        "learning_outcomes": [
            "Master fundamental quantitative aptitude",
            "Develop logical reasoning and analytical skills",
            "Excel in English language and basic grammar",
            "Understand general studies and current affairs",
            "Learn typing skills and computer proficiency"
        ],
        "tags": ["ssc-chsl", "higher-secondary", "data-entry", "postal-assistant", "typing-skills"],
        "request": {
            "subject": "SSC CHSL Higher Secondary Level Preparation",
            "goal": "I want to master SSC CHSL preparation for Data Entry Operator, Lower Division Clerk, and Postal Assistant positions. Teach me quantitative aptitude at 12th level, general intelligence, English language, general awareness, and typing skills. Include speed and accuracy building, descriptive writing, and interview preparation.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ENGINEERING ENTRANCE EXAMS
    {
        "title": "BITSAT Preparation - Birla Institute of Technology",
        "category": "competitive-exams",
        "subcategory": "engineering-entrance",
        "difficulty": "advanced",
        "target_audience": "Engineering aspirants targeting BITS Pilani campuses",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["12th PCM", "Strong foundation in physics, chemistry, mathematics", "English proficiency"],
        "learning_outcomes": [
            "Master BITSAT physics concepts and applications",
            "Excel in chemistry - organic, inorganic, and physical",
            "Develop advanced mathematical problem-solving skills",
            "Improve English proficiency and logical reasoning",
            "Learn computer-based test strategies and time management"
        ],
        "tags": ["bitsat", "bits-pilani", "engineering-entrance", "physics", "chemistry", "mathematics"],
        "request": {
            "subject": "BITSAT Engineering Entrance Mastery",
            "goal": "I want to master BITSAT preparation for admission to BITS Pilani. Teach me advanced physics concepts, chemistry (all branches), mathematics including calculus and coordinate geometry, English proficiency, and logical reasoning. Include computer-based test strategies, negative marking awareness, and speed-accuracy balance techniques.",
            "time_value": 13,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "VITEEE and State Engineering Entrance Preparation",
        "category": "competitive-exams",
        "subcategory": "engineering-entrance",
        "difficulty": "intermediate",
        "target_audience": "Engineering aspirants for VIT and state-level engineering colleges",
        "estimated_hours": 115,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.6,
        "prerequisites": ["12th PCM", "NCERT understanding", "Basic English"],
        "learning_outcomes": [
            "Master NCERT-based physics, chemistry, and mathematics",
            "Develop speed and accuracy for MCQ-based tests",
            "Understand state-specific exam patterns and syllabi",
            "Excel in application-based problem solving",
            "Learn multiple engineering entrance strategies"
        ],
        "tags": ["viteee", "state-engineering", "ncert-based", "mcq-strategy", "engineering-entrance"],
        "request": {
            "subject": "VITEEE and State Engineering Entrance Preparation",
            "goal": "I want to master VITEEE and state engineering entrance preparation. Teach me NCERT-based physics, chemistry, and mathematics with application focus. Include state-specific exam patterns (MHT-CET, KCET, EAMCET), MCQ solving techniques, and multiple exam management strategies. Focus on conceptual clarity and speed building.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # MEDICAL ENTRANCE EXAMS
    {
        "title": "AIIMS Preparation - All India Institute of Medical Sciences",
        "category": "competitive-exams",
        "subcategory": "medical-entrance",
        "difficulty": "expert",
        "target_audience": "Medical aspirants targeting AIIMS and premium medical colleges",
        "estimated_hours": 160,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["NEET qualification", "Strong PCB foundation", "Advanced problem-solving skills"],
        "learning_outcomes": [
            "Master advanced physics concepts for medical applications",
            "Excel in high-level chemistry and biochemistry",
            "Develop comprehensive biology and human physiology understanding",
            "Learn advanced problem-solving and analytical reasoning",
            "Understand medical ethics and healthcare systems"
        ],
        "tags": ["aiims", "medical-entrance", "advanced-physics", "biochemistry", "medical-ethics"],
        "request": {
            "subject": "AIIMS Advanced Medical Entrance Preparation",
            "goal": "I want to master AIIMS preparation for premium medical college admission. Teach me advanced physics applications in medicine, high-level chemistry including biochemistry, comprehensive biology with human anatomy and physiology, and analytical reasoning. Include medical ethics, healthcare awareness, and interview preparation for medical professionals.",
            "time_value": 16,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "JIPMER and Medical PG Entrance Preparation",
        "category": "competitive-exams",
        "subcategory": "medical-entrance",
        "difficulty": "advanced",
        "target_audience": "Medical aspirants and MBBS graduates for postgraduate studies",
        "estimated_hours": 145,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["MBBS degree (for PG)", "Strong medical sciences foundation", "Clinical exposure"],
        "learning_outcomes": [
            "Master clinical medicine and pathophysiology",
            "Excel in pharmacology and therapeutics",
            "Develop diagnostic and treatment planning skills",
            "Understand medical research and evidence-based medicine",
            "Learn specialty-specific medical knowledge"
        ],
        "tags": ["jipmer", "medical-pg", "clinical-medicine", "pharmacology", "evidence-based-medicine"],
        "request": {
            "subject": "JIPMER and Medical PG Entrance Mastery",
            "goal": "I want to master JIPMER and medical PG entrance preparation. Teach me clinical medicine, pathophysiology, pharmacology, community medicine, forensic medicine, and medical research methodology. Include case-based learning, diagnostic reasoning, evidence-based medicine, and specialty selection guidance for postgraduate medical studies.",
            "time_value": 15,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # LAW ENTRANCE EXAMS
    {
        "title": "CLAT Preparation - Common Law Admission Test",
        "category": "competitive-exams",
        "subcategory": "law-entrance",
        "difficulty": "advanced",
        "target_audience": "Law aspirants for National Law Universities",
        "estimated_hours": 135,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["12th pass", "Strong English skills", "Current affairs awareness", "Logical reasoning ability"],
        "learning_outcomes": [
            "Master legal reasoning and constitutional principles",
            "Excel in English comprehension and grammar",
            "Develop strong current affairs and general knowledge",
            "Understand basic mathematics and logical reasoning",
            "Learn legal writing and analytical skills"
        ],
        "tags": ["clat", "law-entrance", "legal-reasoning", "constitution", "nlu-admission"],
        "request": {
            "subject": "CLAT Common Law Admission Test Mastery",
            "goal": "I want to master CLAT preparation for National Law University admission. Teach me legal reasoning, Indian Constitution basics, English language and comprehension, current affairs including legal developments, quantitative techniques, and logical reasoning. Include passage-based questions, legal awareness, and critical thinking skills for law studies.",
            "time_value": 14,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "LSAT India and International Law School Preparation",
        "category": "competitive-exams",
        "subcategory": "law-entrance",
        "difficulty": "expert",
        "target_audience": "Law aspirants targeting international law schools and advanced legal studies",
        "estimated_hours": 150,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Graduate degree", "Advanced English proficiency", "Critical thinking skills", "Research aptitude"],
        "learning_outcomes": [
            "Master analytical reasoning and logic games",
            "Excel in reading comprehension and critical analysis",
            "Develop advanced logical reasoning skills",
            "Understand international legal systems and comparative law",
            "Learn academic writing and research methodology"
        ],
        "tags": ["lsat", "international-law", "analytical-reasoning", "logic-games", "critical-analysis"],
        "request": {
            "subject": "LSAT India and International Law School Preparation",
            "goal": "I want to master LSAT preparation for international law schools and advanced legal studies. Teach me analytical reasoning, logic games, reading comprehension with legal passages, logical reasoning arguments, and comparative legal systems. Include international law concepts, academic legal writing, and preparation for global law school applications.",
            "time_value": 15,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ==============================================================================
    # INTERNATIONAL STANDARDIZED TESTS
    # ==============================================================================

    # COLLEGE ADMISSION TESTS
    {
        "title": "SAT Preparation - College Board Standardized Test",
        "category": "competitive-exams",
        "subcategory": "international-standardized",
        "difficulty": "intermediate",
        "target_audience": "High school students applying to US colleges and universities",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["High school mathematics", "Strong English reading skills", "Basic algebra and geometry"],
        "learning_outcomes": [
            "Master SAT Math concepts including algebra, geometry, and data analysis",
            "Excel in Evidence-Based Reading and Writing sections",
            "Develop test-taking strategies and time management skills",
            "Understand college admission requirements and score interpretation",
            "Learn essay writing techniques for optional SAT Essay"
        ],
        "tags": ["sat", "college-admission", "standardized-test", "us-universities", "college-board"],
        "request": {
            "subject": "SAT College Admission Test Mastery",
            "goal": "I want to master SAT preparation for US college admissions. Teach me SAT Math (algebra, geometry, trigonometry, data analysis), Evidence-Based Reading and Writing (reading comprehension, grammar, vocabulary), and test strategies. Include practice tests, time management, score improvement techniques, and college application guidance.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "ACT Preparation - American College Testing",
        "category": "competitive-exams",
        "subcategory": "international-standardized",
        "difficulty": "intermediate",
        "target_audience": "High school students seeking alternative to SAT for US college admissions",
        "estimated_hours": 95,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["High school curriculum completion", "Basic science knowledge", "English proficiency"],
        "learning_outcomes": [
            "Master ACT English, Math, Reading, and Science sections",
            "Develop speed and accuracy for ACT's faster pace",
            "Understand ACT scoring system and college requirements",
            "Learn science reasoning and data interpretation skills",
            "Excel in optional ACT Writing section"
        ],
        "tags": ["act", "college-admission", "american-college-testing", "science-reasoning", "us-colleges"],
        "request": {
            "subject": "ACT American College Testing Preparation",
            "goal": "I want to master ACT preparation for US college admissions. Teach me ACT English (grammar, rhetoric), Mathematics (algebra through trigonometry), Reading (comprehension strategies), Science (data interpretation, scientific reasoning), and optional Writing. Include timing strategies, score improvement techniques, and comparison with SAT.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # GRADUATE SCHOOL ADMISSION TESTS
    {
        "title": "GRE Preparation - Graduate Record Examination",
        "category": "competitive-exams",
        "subcategory": "international-standardized",
        "difficulty": "advanced",
        "target_audience": "Graduate school applicants for international universities",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Bachelor's degree or final year", "Strong analytical skills", "Advanced English proficiency"],
        "learning_outcomes": [
            "Master GRE Verbal Reasoning with advanced vocabulary",
            "Excel in Quantitative Reasoning and data interpretation",
            "Develop analytical writing skills for complex topics",
            "Learn test-adaptive strategies for computer-based format",
            "Understand graduate school admission requirements globally"
        ],
        "tags": ["gre", "graduate-admission", "ets", "verbal-reasoning", "quantitative-reasoning"],
        "request": {
            "subject": "GRE Graduate Record Examination Mastery",
            "goal": "I want to master GRE preparation for graduate school admissions worldwide. Teach me Verbal Reasoning (reading comprehension, text completion, sentence equivalence), Quantitative Reasoning (arithmetic, algebra, geometry, data analysis), and Analytical Writing (issue and argument essays). Include vocabulary building, test strategies, and score improvement techniques.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "GMAT Preparation - Graduate Management Admission Test",
        "category": "competitive-exams",
        "subcategory": "international-standardized",
        "difficulty": "advanced",
        "target_audience": "MBA and business school applicants worldwide",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Bachelor's degree", "Work experience (preferred)", "Business aptitude", "Strong analytical skills"],
        "learning_outcomes": [
            "Master GMAT Quantitative section with advanced problem solving",
            "Excel in Verbal section with critical reasoning",
            "Develop integrated reasoning for complex data analysis",
            "Learn analytical writing for business scenarios",
            "Understand top business school admission strategies"
        ],
        "tags": ["gmat", "mba-admission", "business-school", "quantitative-reasoning", "critical-reasoning"],
        "request": {
            "subject": "GMAT Graduate Management Admission Test Mastery",
            "goal": "I want to master GMAT preparation for top MBA programs globally. Teach me Quantitative Reasoning (data sufficiency, problem solving), Verbal Reasoning (reading comprehension, critical reasoning, sentence correction), Integrated Reasoning (multi-source reasoning, graphics interpretation), and Analytical Writing Assessment. Include business school selection and application strategies.",
            "time_value": 13,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # PROFESSIONAL CERTIFICATION EXAMS
    {
        "title": "CPA Preparation - Certified Public Accountant",
        "category": "competitive-exams",
        "subcategory": "professional-certification",
        "difficulty": "expert",
        "target_audience": "Accounting professionals seeking CPA certification in US",
        "estimated_hours": 200,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Accounting degree", "150 credit hours", "Work experience in accounting", "Ethics course completion"],
        "learning_outcomes": [
            "Master Financial Accounting and Reporting (FAR)",
            "Excel in Auditing and Attestation (AUD)",
            "Understand Business Environment and Concepts (BEC)",
            "Learn Regulation including tax and business law (REG)",
            "Develop professional judgment and ethical reasoning"
        ],
        "tags": ["cpa", "accounting", "professional-certification", "auditing", "financial-reporting"],
        "request": {
            "subject": "CPA Certified Public Accountant Mastery",
            "goal": "I want to master CPA exam preparation for professional accounting certification. Teach me Financial Accounting and Reporting, Auditing and Attestation, Business Environment and Concepts, and Regulation (taxation and business law). Include professional ethics, GAAP/IFRS standards, audit procedures, and tax regulations. Focus on passing all four sections of the CPA exam.",
            "time_value": 20,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "CFA Preparation - Chartered Financial Analyst",
        "category": "competitive-exams",
        "subcategory": "professional-certification",
        "difficulty": "expert",
        "target_audience": "Finance professionals seeking CFA charter for investment analysis",
        "estimated_hours": 250,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["Bachelor's degree", "4 years work experience", "Strong mathematics background", "Finance knowledge"],
        "learning_outcomes": [
            "Master Ethical and Professional Standards",
            "Excel in Quantitative Methods and Economics",
            "Understand Financial Reporting and Analysis comprehensively",
            "Learn Corporate Finance and Equity Investments",
            "Develop Fixed Income, Derivatives, and Alternative Investments expertise"
        ],
        "tags": ["cfa", "investment-analysis", "finance", "portfolio-management", "financial-modeling"],
        "request": {
            "subject": "CFA Chartered Financial Analyst Mastery",
            "goal": "I want to master CFA Level I, II, and III preparation for the CFA charter. Teach me Ethics and Professional Standards, Quantitative Methods, Economics, Financial Reporting and Analysis, Corporate Finance, Equity Investments, Fixed Income, Derivatives, Alternative Investments, and Portfolio Management. Include investment analysis, valuation techniques, and professional conduct standards.",
            "time_value": 25,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "PMP Preparation - Project Management Professional",
        "category": "competitive-exams",
        "subcategory": "professional-certification",
        "difficulty": "advanced",
        "target_audience": "Project managers seeking PMI certification",
        "estimated_hours": 80,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Bachelor's degree", "3 years project management experience", "35 hours project management education"],
        "learning_outcomes": [
            "Master Project Management Framework and Processes",
            "Excel in Agile and Hybrid project methodologies",
            "Understand People management and team leadership",
            "Learn Business Environment and strategic alignment",
            "Develop risk management and quality assurance skills"
        ],
        "tags": ["pmp", "project-management", "pmi", "agile", "leadership"],
        "request": {
            "subject": "PMP Project Management Professional Mastery",
            "goal": "I want to master PMP certification preparation for project management excellence. Teach me Project Management Framework, Agile and Hybrid approaches, People management, Business Environment, and the PMBOK Guide principles. Include situational questions, leadership scenarios, risk management, and quality assurance practices for successful project delivery.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # LANGUAGE PROFICIENCY TESTS
    {
        "title": "IELTS Preparation - International English Language Testing",
        "category": "competitive-exams",
        "subcategory": "language-proficiency",
        "difficulty": "intermediate",
        "target_audience": "Non-native English speakers for study/work abroad",
        "estimated_hours": 90,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Intermediate English level", "Basic grammar knowledge", "Vocabulary foundation"],
        "learning_outcomes": [
            "Master IELTS Listening with various accents and contexts",
            "Excel in Reading comprehension and scanning techniques",
            "Develop Writing skills for Task 1 and Task 2",
            "Improve Speaking fluency and pronunciation",
            "Achieve target band scores for university/immigration requirements"
        ],
        "tags": ["ielts", "english-proficiency", "study-abroad", "immigration", "british-council"],
        "request": {
            "subject": "IELTS International English Language Testing Mastery",
            "goal": "I want to master IELTS preparation for study abroad and immigration. Teach me Listening (conversations, lectures, various accents), Reading (academic and general texts), Writing (Task 1 data description/letter writing, Task 2 essays), and Speaking (fluency, pronunciation, coherence). Include band score improvement strategies and test-taking techniques.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "TOEFL Preparation - Test of English as Foreign Language",
        "category": "competitive-exams",
        "subcategory": "language-proficiency",
        "difficulty": "intermediate",
        "target_audience": "International students applying to US universities",
        "estimated_hours": 85,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Upper-intermediate English", "Academic vocabulary", "Computer familiarity"],
        "learning_outcomes": [
            "Master TOEFL Reading with academic passages",
            "Excel in Listening with campus and academic contexts",
            "Develop Speaking skills for integrated tasks",
            "Improve Writing for independent and integrated essays",
            "Achieve required scores for US university admission"
        ],
        "tags": ["toefl", "english-proficiency", "us-universities", "academic-english", "ets"],
        "request": {
            "subject": "TOEFL Test of English as Foreign Language Mastery",
            "goal": "I want to master TOEFL iBT preparation for US university admission. Teach me Reading (academic passages, inference skills), Listening (lectures, conversations), Speaking (independent and integrated tasks), and Writing (independent essays, integrated writing). Include note-taking strategies, academic vocabulary, and score improvement techniques for computer-based testing.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "DELE Preparation - Spanish Language Proficiency",
        "category": "competitive-exams",
        "subcategory": "language-proficiency",
        "difficulty": "intermediate",
        "target_audience": "Spanish language learners seeking official certification",
        "estimated_hours": 110,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Basic Spanish knowledge", "Grammar fundamentals", "Cultural awareness"],
        "learning_outcomes": [
            "Master Spanish listening comprehension at target level",
            "Excel in reading complex Spanish texts",
            "Develop writing skills for formal and informal contexts",
            "Improve speaking fluency and cultural competence",
            "Achieve A1-C2 level certification as per CEFR"
        ],
        "tags": ["dele", "spanish-proficiency", "cervantes", "cefr", "language-certification"],
        "request": {
            "subject": "DELE Spanish Language Proficiency Mastery",
            "goal": "I want to master DELE preparation for official Spanish language certification. Teach me listening comprehension, reading comprehension, written expression and interaction, and oral expression and interaction at my target CEFR level (A1-C2). Include Spanish grammar, vocabulary expansion, cultural context, and test-specific strategies for Instituto Cervantes certification.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # INTERNATIONAL CIVIL SERVICE AND GOVERNMENT EXAMS
    {
        "title": "UN Competitive Examinations - United Nations Careers",
        "category": "competitive-exams",
        "subcategory": "international-civil-service",
        "difficulty": "expert",
        "target_audience": "International development professionals seeking UN careers",
        "estimated_hours": 160,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Master's degree", "2+ years relevant experience", "Multilingual abilities", "International experience"],
        "learning_outcomes": [
            "Master UN system knowledge and organizational structure",
            "Excel in international development and policy analysis",
            "Develop multilingual communication skills",
            "Understand global governance and diplomatic relations",
            "Learn competency-based interview techniques"
        ],
        "tags": ["un-careers", "international-development", "diplomacy", "multilingual", "global-governance"],
        "request": {
            "subject": "UN Competitive Examinations Mastery",
            "goal": "I want to master UN competitive examinations for international civil service careers. Teach me UN system knowledge, international development principles, policy analysis, global governance, multilingual communication, and competency-based assessment techniques. Include knowledge of SDGs, humanitarian principles, and international law for various UN agency positions.",
            "time_value": 16,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "EU Competitions - European Union Civil Service",
        "category": "competitive-exams",
        "subcategory": "international-civil-service",
        "difficulty": "expert",
        "target_audience": "European professionals seeking EU institutional careers",
        "estimated_hours": 140,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["EU citizenship", "University degree", "Language requirements", "European affairs knowledge"],
        "learning_outcomes": [
            "Master EU institutional knowledge and procedures",
            "Excel in European law and policy frameworks",
            "Develop multilingual proficiency in EU languages",
            "Understand European integration and governance",
            "Learn assessment center and interview techniques"
        ],
        "tags": ["eu-competitions", "european-union", "institutional-careers", "european-law", "epso"],
        "request": {
            "subject": "EU Competitions European Civil Service Mastery",
            "goal": "I want to master EU competition examinations for European Union careers. Teach me EU institutional framework, European law, policy analysis, multilingual communication, and assessment center techniques. Include knowledge of EU treaties, decision-making processes, and competency-based evaluation methods for various EU institution positions through EPSO.",
            "time_value": 14,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "UK Civil Service Fast Stream and Graduate Programs",
        "category": "competitive-exams",
        "subcategory": "international-civil-service",
        "difficulty": "advanced",
        "target_audience": "UK graduates seeking government and public sector careers",
        "estimated_hours": 100,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["UK degree", "British citizenship/eligible nationality", "Leadership potential", "Public service motivation"],
        "learning_outcomes": [
            "Master UK government structure and civil service values",
            "Excel in policy analysis and public administration",
            "Develop leadership and management competencies",
            "Understand British political system and governance",
            "Learn assessment center and competency-based interviews"
        ],
        "tags": ["uk-civil-service", "fast-stream", "public-administration", "government-careers", "leadership"],
        "request": {
            "subject": "UK Civil Service Fast Stream Mastery",
            "goal": "I want to master UK Civil Service Fast Stream preparation for government careers. Teach me UK government structure, policy analysis, public administration, leadership competencies, and civil service values. Include assessment center techniques, competency-based interviews, and understanding of British political system for various government department positions.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ==============================================================================
    # NICHE AND SPECIALIZED COMPETITIVE EXAMS
    # ==============================================================================

    # ACTUARIAL SCIENCE CERTIFICATIONS
    {
        "title": "SOA Actuarial Exams - Society of Actuaries",
        "category": "competitive-exams",
        "subcategory": "actuarial-science",
        "difficulty": "expert",
        "target_audience": "Actuarial professionals and mathematics graduates seeking SOA Fellowship",
        "estimated_hours": 300,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Strong mathematics background", "Statistics knowledge", "Probability theory", "Bachelor's degree in mathematics/statistics"],
        "learning_outcomes": [
            "Master probability theory and mathematical statistics",
            "Excel in financial mathematics and interest theory",
            "Understand life contingencies and survival models",
            "Learn advanced risk modeling and quantitative methods",
            "Develop expertise in insurance and pension mathematics"
        ],
        "tags": ["soa", "actuarial-science", "probability", "financial-mathematics", "risk-modeling"],
        "request": {
            "subject": "SOA Actuarial Science Certification Mastery",
            "goal": "I want to master SOA actuarial examinations for professional actuarial certification. Teach me probability theory, financial mathematics, actuarial modeling, life contingencies, risk theory, and advanced statistics. Include exam-specific problem solving techniques, statistical software usage, and professional actuarial practices for insurance and pension industries.",
            "time_value": 30,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "CAS Actuarial Exams - Casualty Actuarial Society",
        "category": "competitive-exams",
        "subcategory": "actuarial-science",
        "difficulty": "expert",
        "target_audience": "Property and casualty insurance actuarial professionals",
        "estimated_hours": 280,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Mathematics degree", "Statistical analysis skills", "Insurance industry knowledge", "Programming skills (R/Python)"],
        "learning_outcomes": [
            "Master casualty actuarial methods and reserving techniques",
            "Excel in ratemaking and pricing strategies",
            "Understand predictive modeling and machine learning applications",
            "Learn regulatory requirements and insurance law",
            "Develop expertise in catastrophe modeling and reinsurance"
        ],
        "tags": ["cas", "casualty-actuarial", "insurance", "ratemaking", "predictive-modeling"],
        "request": {
            "subject": "CAS Casualty Actuarial Science Mastery",
            "goal": "I want to master CAS actuarial examinations for casualty insurance expertise. Teach me reserving methods, ratemaking techniques, predictive modeling, catastrophe analysis, and regulatory frameworks. Include practical applications in property and casualty insurance, statistical programming, and advanced analytical techniques for insurance pricing and risk assessment.",
            "time_value": 28,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # AVIATION CERTIFICATIONS
    {
        "title": "ATPL Preparation - Airline Transport Pilot License",
        "category": "competitive-exams",
        "subcategory": "aviation",
        "difficulty": "expert",
        "target_audience": "Professional pilots seeking airline captain qualifications",
        "estimated_hours": 200,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Commercial Pilot License", "1500+ flight hours", "Instrument Rating", "Medical certificate", "Aviation English proficiency"],
        "learning_outcomes": [
            "Master advanced aerodynamics and aircraft systems",
            "Excel in airline operations and crew resource management",
            "Understand complex meteorology and navigation systems",
            "Learn aviation law and international regulations",
            "Develop leadership skills for airline operations"
        ],
        "tags": ["atpl", "airline-pilot", "aviation", "aerodynamics", "crew-resource-management"],
        "request": {
            "subject": "ATPL Airline Transport Pilot License Mastery",
            "goal": "I want to master ATPL preparation for airline pilot certification. Teach me advanced aerodynamics, aircraft systems, meteorology, navigation, aviation law, crew resource management, and airline operations procedures. Include multi-crew cooperation, emergency procedures, and leadership skills required for airline captain responsibilities.",
            "time_value": 20,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Remote Pilot Certificate - Commercial Drone Operations",
        "category": "competitive-exams",
        "subcategory": "aviation",
        "difficulty": "intermediate",
        "target_audience": "Commercial drone operators and aerial photography professionals",
        "estimated_hours": 60,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Basic aviation knowledge", "English proficiency", "Understanding of regulations", "Technical aptitude"],
        "learning_outcomes": [
            "Master FAA regulations for commercial drone operations",
            "Understand airspace classifications and restrictions",
            "Learn weather interpretation for safe drone operations",
            "Develop flight planning and risk assessment skills",
            "Excel in radio communication and emergency procedures"
        ],
        "tags": ["drone-pilot", "uas", "commercial-aviation", "faa-regulations", "aerial-photography"],
        "request": {
            "subject": "Remote Pilot Certificate Drone Operations Mastery",
            "goal": "I want to master Remote Pilot Certificate preparation for commercial drone operations. Teach me FAA regulations, airspace requirements, weather interpretation, flight planning, radio communications, and emergency procedures. Include practical applications for aerial photography, surveying, inspection, and delivery operations within regulatory frameworks.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # MARITIME CERTIFICATIONS
    {
        "title": "Master Mariner Certification - Ship Command",
        "category": "competitive-exams",
        "subcategory": "maritime",
        "difficulty": "expert",
        "target_audience": "Merchant marine officers seeking ship command authority",
        "estimated_hours": 250,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Chief Mate license", "Sea service requirements", "STCW certifications", "Medical fitness", "Security clearance"],
        "learning_outcomes": [
            "Master advanced ship navigation and bridge management",
            "Excel in maritime law and international regulations",
            "Understand cargo operations and port procedures",
            "Learn crisis management and emergency response",
            "Develop leadership skills for maritime operations"
        ],
        "tags": ["master-mariner", "ship-command", "maritime", "navigation", "maritime-law"],
        "request": {
            "subject": "Master Mariner Ship Command Certification Mastery",
            "goal": "I want to master Master Mariner certification for ship command authority. Teach me advanced navigation, bridge resource management, maritime law, cargo operations, port procedures, crisis management, and international maritime regulations. Include leadership skills, safety management, and environmental compliance for commercial vessel operations.",
            "time_value": 25,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Chief Engineer Marine License - Ship Engineering",
        "category": "competitive-exams",
        "subcategory": "maritime",
        "difficulty": "expert",
        "target_audience": "Marine engineers seeking chief engineer positions on commercial vessels",
        "estimated_hours": 220,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Marine engineering degree", "Sea service as engineer", "STCW engineering certifications", "Technical competency"],
        "learning_outcomes": [
            "Master marine propulsion systems and machinery",
            "Excel in electrical and automation systems",
            "Understand fuel systems and environmental compliance",
            "Learn maintenance planning and safety procedures",
            "Develop technical leadership and crew management skills"
        ],
        "tags": ["chief-engineer", "marine-engineering", "propulsion-systems", "maritime-safety", "machinery"],
        "request": {
            "subject": "Chief Engineer Marine License Mastery",
            "goal": "I want to master Chief Engineer marine license for ship engineering leadership. Teach me marine propulsion systems, electrical systems, automation, fuel management, environmental regulations, maintenance planning, and safety procedures. Include technical leadership, crew management, and troubleshooting skills for commercial vessel engineering operations.",
            "time_value": 22,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED IT SECURITY CERTIFICATIONS
    {
        "title": "CISSP Certification - Information Systems Security",
        "category": "competitive-exams",
        "subcategory": "cybersecurity",
        "difficulty": "expert",
        "target_audience": "Senior cybersecurity professionals and information security managers",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["5 years security experience", "Bachelor's degree (preferred)", "Understanding of security frameworks", "Professional work experience"],
        "learning_outcomes": [
            "Master security and risk management frameworks",
            "Excel in asset security and data classification",
            "Understand security architecture and engineering",
            "Learn identity and access management systems",
            "Develop expertise in security operations and incident response"
        ],
        "tags": ["cissp", "cybersecurity", "information-security", "risk-management", "security-architecture"],
        "request": {
            "subject": "CISSP Information Systems Security Mastery",
            "goal": "I want to master CISSP certification for senior cybersecurity roles. Teach me security and risk management, asset security, security architecture, communication and network security, identity and access management, security assessment, security operations, and software development security. Include management-level security concepts and strategic security planning.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "OSCP Certification - Offensive Security Certified Professional",
        "category": "competitive-exams",
        "subcategory": "cybersecurity",
        "difficulty": "expert",
        "target_audience": "Penetration testers and ethical hackers seeking advanced practical skills",
        "estimated_hours": 180,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["Linux command line proficiency", "Basic networking knowledge", "Programming skills", "Cybersecurity fundamentals"],
        "learning_outcomes": [
            "Master advanced penetration testing methodologies",
            "Excel in manual exploit development and techniques",
            "Understand buffer overflow exploitation",
            "Learn privilege escalation on Windows and Linux",
            "Develop hands-on ethical hacking skills"
        ],
        "tags": ["oscp", "penetration-testing", "ethical-hacking", "exploit-development", "offensive-security"],
        "request": {
            "subject": "OSCP Offensive Security Penetration Testing Mastery",
            "goal": "I want to master OSCP certification for advanced penetration testing. Teach me manual exploitation techniques, buffer overflow development, privilege escalation, post-exploitation techniques, and advanced penetration testing methodologies. Include hands-on labs, real-world scenarios, and practical ethical hacking skills for professional security testing.",
            "time_value": 18,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # MEDICAL SPECIALTY BOARDS
    {
        "title": "USMLE Preparation - United States Medical Licensing",
        "category": "competitive-exams",
        "subcategory": "medical-licensing",
        "difficulty": "expert",
        "target_audience": "International medical graduates seeking US medical practice",
        "estimated_hours": 400,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Medical degree", "Clinical experience", "Strong English proficiency", "ECFMG certification eligibility"],
        "learning_outcomes": [
            "Master basic medical sciences for Step 1",
            "Excel in clinical knowledge for Step 2 CK",
            "Develop clinical skills for Step 2 CS",
            "Understand US healthcare system and medical ethics",
            "Learn standardized patient interaction techniques"
        ],
        "tags": ["usmle", "medical-licensing", "clinical-medicine", "medical-ethics", "standardized-patients"],
        "request": {
            "subject": "USMLE United States Medical Licensing Mastery",
            "goal": "I want to master USMLE preparation for US medical practice. Teach me basic medical sciences (anatomy, physiology, pathology, pharmacology), clinical medicine, diagnostic reasoning, treatment protocols, medical ethics, and standardized patient communication. Include Step 1, Step 2 CK, and Step 2 CS preparation with US healthcare system knowledge.",
            "time_value": 40,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "PLAB Preparation - Professional and Linguistic Assessment Board",
        "category": "competitive-exams",
        "subcategory": "medical-licensing",
        "difficulty": "advanced",
        "target_audience": "International medical graduates seeking UK medical practice",
        "estimated_hours": 300,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Medical degree", "IELTS qualification", "GMC eligibility", "Clinical experience"],
        "learning_outcomes": [
            "Master UK clinical guidelines and NICE protocols",
            "Excel in clinical reasoning and differential diagnosis",
            "Understand NHS structure and UK healthcare system",
            "Learn professional communication and patient safety",
            "Develop OSCE skills for practical assessment"
        ],
        "tags": ["plab", "uk-medical-licensing", "nhs", "clinical-guidelines", "osce"],
        "request": {
            "subject": "PLAB UK Medical Licensing Preparation Mastery",
            "goal": "I want to master PLAB preparation for UK medical practice. Teach me PLAB 1 clinical knowledge, UK clinical guidelines, NICE protocols, NHS procedures, and PLAB 2 OSCE skills. Include UK medical ethics, patient safety, clinical reasoning, and professional communication standards for General Medical Council registration.",
            "time_value": 30,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # FINANCIAL RISK AND COMPLIANCE
    {
        "title": "FRM Certification - Financial Risk Manager",
        "category": "competitive-exams",
        "subcategory": "financial-risk",
        "difficulty": "expert",
        "target_audience": "Risk management professionals in banking and finance",
        "estimated_hours": 200,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Finance background", "Quantitative skills", "Risk management experience", "Statistical knowledge"],
        "learning_outcomes": [
            "Master quantitative risk analysis and modeling",
            "Excel in market risk measurement and management",
            "Understand credit risk and operational risk frameworks",
            "Learn regulatory requirements and Basel frameworks",
            "Develop expertise in risk management tools and techniques"
        ],
        "tags": ["frm", "financial-risk", "risk-management", "basel", "quantitative-analysis"],
        "request": {
            "subject": "FRM Financial Risk Manager Certification Mastery",
            "goal": "I want to master FRM certification for financial risk management expertise. Teach me quantitative analysis, market risk, credit risk, operational risk, liquidity risk, investment risk, current issues in financial markets, and risk management tools. Include Basel frameworks, regulatory requirements, and advanced risk modeling techniques.",
            "time_value": 20,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "CAMS Certification - Certified Anti-Money Laundering Specialist",
        "category": "competitive-exams",
        "subcategory": "financial-compliance",
        "difficulty": "advanced",
        "target_audience": "Compliance professionals and anti-money laundering specialists",
        "estimated_hours": 100,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Compliance experience", "AML knowledge", "Financial services background", "Regulatory awareness"],
        "learning_outcomes": [
            "Master AML regulations and compliance frameworks",
            "Excel in suspicious activity monitoring and reporting",
            "Understand customer due diligence procedures",
            "Learn investigation techniques and case management",
            "Develop expertise in international AML standards"
        ],
        "tags": ["cams", "anti-money-laundering", "compliance", "financial-crimes", "regulatory"],
        "request": {
            "subject": "CAMS Anti-Money Laundering Specialist Mastery",
            "goal": "I want to master CAMS certification for anti-money laundering expertise. Teach me AML regulations, compliance programs, customer due diligence, suspicious activity monitoring, investigation techniques, and international AML standards. Include practical applications in financial institutions and regulatory compliance frameworks.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # LINGUISTICS AND TRANSLATION
    {
        "title": "ATA Certification - American Translators Association",
        "category": "competitive-exams",
        "subcategory": "translation-linguistics",
        "difficulty": "advanced",
        "target_audience": "Professional translators seeking industry certification",
        "estimated_hours": 150,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Bilingual proficiency", "Translation experience", "Cultural knowledge", "Subject matter expertise"],
        "learning_outcomes": [
            "Master professional translation techniques and methodologies",
            "Excel in specialized translation domains (medical, legal, technical)",
            "Understand translation ethics and professional standards",
            "Learn computer-assisted translation tools",
            "Develop quality assurance and editing skills"
        ],
        "tags": ["ata", "translation", "linguistics", "bilingual", "professional-certification"],
        "request": {
            "subject": "ATA Professional Translation Certification Mastery",
            "goal": "I want to master ATA certification for professional translation services. Teach me translation techniques, specialized domain knowledge (medical, legal, technical), translation ethics, quality assurance, computer-assisted translation tools, and professional practices. Include cultural competency and subject matter specialization for certified translation work.",
            "time_value": 15,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "IOL Olympiad - International Linguistics Olympiad",
        "category": "competitive-exams",
        "subcategory": "translation-linguistics",
        "difficulty": "expert",
        "target_audience": "High school students and linguistics enthusiasts",
        "estimated_hours": 80,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Strong analytical thinking", "Pattern recognition skills", "Logic and reasoning ability", "No prior linguistics knowledge required"],
        "learning_outcomes": [
            "Master linguistic analysis and problem-solving techniques",
            "Excel in phonological and morphological analysis",
            "Understand syntax and semantic structures",
            "Learn writing system decipherment",
            "Develop expertise in comparative linguistics"
        ],
        "tags": ["iol", "linguistics-olympiad", "linguistic-analysis", "phonology", "morphology"],
        "request": {
            "subject": "IOL International Linguistics Olympiad Mastery",
            "goal": "I want to master IOL preparation for competitive linguistics. Teach me linguistic analysis techniques, phonological systems, morphological structures, syntactic patterns, semantic relationships, and writing system analysis. Include problem-solving strategies for unknown languages and comparative linguistic methods for olympiad competitions.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # FORENSIC AND INVESTIGATIVE SCIENCES
    {
        "title": "CCE Certification - Certified Computer Examiner",
        "category": "competitive-exams",
        "subcategory": "forensic-science",
        "difficulty": "expert",
        "target_audience": "Digital forensics professionals and law enforcement investigators",
        "estimated_hours": 160,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Computer science background", "Digital forensics experience", "Law enforcement or legal knowledge", "Technical investigation skills"],
        "learning_outcomes": [
            "Master digital evidence acquisition and preservation",
            "Excel in forensic analysis of computer systems",
            "Understand legal frameworks for digital evidence",
            "Learn advanced forensic tools and techniques",
            "Develop courtroom testimony and expert witness skills"
        ],
        "tags": ["cce", "digital-forensics", "computer-examination", "legal-evidence", "cyber-investigation"],
        "request": {
            "subject": "CCE Certified Computer Examiner Mastery",
            "goal": "I want to master CCE certification for digital forensics expertise. Teach me digital evidence acquisition, forensic analysis techniques, file system analysis, network forensics, mobile device examination, legal procedures, and expert testimony skills. Include hands-on forensic tools usage and legal compliance for computer examination.",
            "time_value": 16,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "CFE Certification - Certified Fraud Examiner",
        "category": "competitive-exams",
        "subcategory": "forensic-investigation",
        "difficulty": "advanced",
        "target_audience": "Fraud investigators, auditors, and financial crime specialists",
        "estimated_hours": 120,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Investigative experience", "Accounting knowledge", "Legal understanding", "Professional work experience"],
        "learning_outcomes": [
            "Master fraud prevention and detection techniques",
            "Excel in financial investigation and analysis",
            "Understand legal elements of fraud and interviewing",
            "Learn fraud risk assessment and controls",
            "Develop expertise in white-collar crime investigation"
        ],
        "tags": ["cfe", "fraud-examination", "financial-investigation", "white-collar-crime", "forensic-accounting"],
        "request": {
            "subject": "CFE Certified Fraud Examiner Mastery",
            "goal": "I want to master CFE certification for fraud examination expertise. Teach me fraud prevention, financial transactions analysis, legal elements of fraud, interviewing techniques, fraud investigation methods, and forensic accounting principles. Include practical investigation skills and professional ethics for fraud examination.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    # ==============================================================================
    # RESEARCH-FOCUSED ROADMAPS FOR GRADUATE STUDENTS
    # ==============================================================================
    
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
            "model": "vertexai:gemini-exp-1206"
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
            "model": "vertexai:gemini-exp-1206"
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
            "model": "vertexai:gemini-exp-1206"
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
            "model": "vertexai:gemini-exp-1206"
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
            "model": "vertexai:gemini-exp-1206"
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
            "model": "vertexai:gemini-exp-1206"
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
            "model": "vertexai:gemini-exp-1206"
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
            "model": "vertexai:gemini-exp-1206"
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
            "model": "vertexai:gemini-exp-1206"
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
            "model": "vertexai:gemini-exp-1206"
        }
    },
    
    # ADDITIONAL TECH ROADMAPS
    {
        "title": "GraphQL API Development and Federation",
        "category": "backend-development",
        "subcategory": "apis",
        "difficulty": "intermediate",
        "target_audience": "Backend developers wanting to master modern API development with GraphQL",
        "estimated_hours": 80,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["REST API basics", "JavaScript/TypeScript", "Database fundamentals"],
        "learning_outcomes": [
            "Design and implement GraphQL schemas and resolvers",
            "Build federated GraphQL architectures for microservices",
            "Implement authentication and authorization in GraphQL",
            "Optimize GraphQL performance with DataLoader and caching",
            "Test GraphQL APIs comprehensively"
        ],
        "tags": ["graphql", "api", "backend", "microservices", "federation", "apollo"],
        "request": {
            "subject": "GraphQL API Development and Federation",
            "goal": "I want to become proficient in building modern GraphQL APIs and implementing federated architectures. Teach me schema design, resolver implementation, performance optimization, security, testing, and how to build scalable GraphQL microservices using Apollo Federation.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    {
        "title": "Apache Spark and Big Data Processing",
        "category": "data-engineering",
        "subcategory": "big-data",
        "difficulty": "advanced",
        "target_audience": "Data engineers and scientists working with large-scale data processing",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Python or Scala basics", "SQL knowledge", "Distributed systems concepts"],
        "learning_outcomes": [
            "Process large datasets with Apache Spark and PySpark",
            "Implement ETL pipelines for batch and streaming data",
            "Optimize Spark jobs for performance and cost efficiency",
            "Work with Spark SQL, DataFrames, and RDDs",
            "Deploy Spark applications on cloud platforms"
        ],
        "tags": ["spark", "pyspark", "big-data", "etl", "streaming", "scala"],
        "request": {
            "subject": "Apache Spark and Big Data Processing",
            "goal": "I want to master Apache Spark for large-scale data processing. Teach me PySpark, Spark SQL, streaming analytics, performance optimization, cluster management, and how to build production-ready ETL pipelines for big data workloads.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    {
        "title": "Edge Computing and IoT Architecture",
        "category": "infrastructure",
        "subcategory": "edge-computing",
        "difficulty": "advanced",
        "target_audience": "Engineers building distributed edge computing and IoT solutions",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Networking basics", "Cloud computing knowledge", "Programming in C++ or Python"],
        "learning_outcomes": [
            "Design edge computing architectures for IoT systems",
            "Implement real-time data processing at the edge",
            "Build secure IoT device communication protocols",
            "Optimize for low-latency and bandwidth constraints",
            "Deploy and manage edge computing infrastructure"
        ],
        "tags": ["edge-computing", "iot", "real-time", "distributed-systems", "networking"],
        "request": {
            "subject": "Edge Computing and IoT Architecture",
            "goal": "I want to become an expert in edge computing and IoT architecture. Teach me about distributed edge systems, real-time data processing, IoT protocols, security, latency optimization, and how to build scalable edge computing solutions.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    {
        "title": "WebAssembly (WASM) Development",
        "category": "web-development",
        "subcategory": "performance",
        "difficulty": "intermediate",
        "target_audience": "Developers wanting to build high-performance web applications with WebAssembly",
        "estimated_hours": 75,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["JavaScript fundamentals", "C/C++ or Rust basics", "Web development experience"],
        "learning_outcomes": [
            "Compile C/C++/Rust code to WebAssembly modules",
            "Integrate WASM with JavaScript applications",
            "Optimize performance-critical web applications",
            "Build cross-platform applications with WASM",
            "Debug and profile WebAssembly applications"
        ],
        "tags": ["webassembly", "wasm", "performance", "rust", "c++", "javascript"],
        "request": {
            "subject": "WebAssembly (WASM) Development",
            "goal": "I want to master WebAssembly for building high-performance web applications. Teach me how to compile native code to WASM, integrate with JavaScript, optimize performance, build cross-platform apps, and leverage WASM for compute-intensive web applications.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    {
        "title": "Serverless Architecture with AWS Lambda",
        "category": "cloud-computing",
        "subcategory": "serverless",
        "difficulty": "intermediate",
        "target_audience": "Developers building scalable serverless applications on AWS",
        "estimated_hours": 90,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["AWS basics", "JavaScript/Python", "API development experience"],
        "learning_outcomes": [
            "Build serverless applications with AWS Lambda",
            "Design event-driven architectures using AWS services",
            "Implement serverless APIs with API Gateway",
            "Manage state with DynamoDB and S3",
            "Monitor and debug serverless applications"
        ],
        "tags": ["aws", "lambda", "serverless", "api-gateway", "dynamodb", "event-driven"],
        "request": {
            "subject": "Serverless Architecture with AWS Lambda",
            "goal": "I want to become proficient in building serverless applications on AWS. Teach me Lambda functions, API Gateway, DynamoDB, event-driven architectures, serverless patterns, cost optimization, monitoring, and how to build production-ready serverless systems.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    {
        "title": "Microservices with Service Mesh (Istio)",
        "category": "infrastructure",
        "subcategory": "microservices",
        "difficulty": "advanced",
        "target_audience": "DevOps engineers and architects building complex microservices systems",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Kubernetes knowledge", "Microservices concepts", "Networking basics"],
        "learning_outcomes": [
            "Implement service mesh architecture with Istio",
            "Manage microservices communication and security",
            "Implement advanced traffic management and load balancing",
            "Monitor and observe distributed systems",
            "Handle service mesh operations and troubleshooting"
        ],
        "tags": ["istio", "service-mesh", "microservices", "kubernetes", "observability"],
        "request": {
            "subject": "Microservices with Service Mesh (Istio)",
            "goal": "I want to master service mesh architecture using Istio. Teach me about service mesh patterns, traffic management, security policies, observability, distributed tracing, and how to operate complex microservices systems at scale.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    {
        "title": "Terraform Infrastructure as Code Mastery",
        "category": "infrastructure",
        "subcategory": "iac",
        "difficulty": "intermediate",
        "target_audience": "DevOps engineers and cloud architects managing infrastructure as code",
        "estimated_hours": 85,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Cloud platform basics", "Command line proficiency", "Infrastructure concepts"],
        "learning_outcomes": [
            "Design and implement Terraform modules and configurations",
            "Manage multi-environment infrastructure deployments",
            "Implement Terraform best practices and patterns",
            "Handle state management and remote backends",
            "Build CI/CD pipelines for infrastructure automation"
        ],
        "tags": ["terraform", "iac", "infrastructure", "devops", "automation", "cloud"],
        "request": {
            "subject": "Terraform Infrastructure as Code Mastery",
            "goal": "I want to become an expert in Terraform for infrastructure as code. Teach me advanced Terraform patterns, module development, state management, workspace strategies, CI/CD integration, and how to manage complex multi-cloud infrastructure at scale.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    {
        "title": "Redis Caching and Data Structures",
        "category": "database",
        "subcategory": "caching",
        "difficulty": "intermediate",
        "target_audience": "Backend developers optimizing application performance with Redis",
        "estimated_hours": 70,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Database basics", "Backend development experience", "Basic networking"],
        "learning_outcomes": [
            "Implement advanced Redis data structures and patterns",
            "Design efficient caching strategies for web applications",
            "Build real-time features with Redis pub/sub",
            "Optimize Redis performance and memory usage",
            "Handle Redis clustering and high availability"
        ],
        "tags": ["redis", "caching", "performance", "data-structures", "real-time"],
        "request": {
            "subject": "Redis Caching and Data Structures",
            "goal": "I want to master Redis for caching and real-time applications. Teach me advanced Redis data structures, caching patterns, pub/sub messaging, Lua scripting, performance optimization, clustering, and how to build high-performance applications with Redis.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    {
        "title": "Elasticsearch and Search Engineering",
        "category": "backend-development",
        "subcategory": "search",
        "difficulty": "intermediate",
        "target_audience": "Developers building advanced search and analytics applications",
        "estimated_hours": 95,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["JSON and REST API knowledge", "Database concepts", "Basic programming skills"],
        "learning_outcomes": [
            "Design and implement Elasticsearch indices and mappings",
            "Build advanced search queries and aggregations",
            "Implement real-time analytics and monitoring",
            "Optimize Elasticsearch performance and scaling",
            "Build search applications with the Elastic Stack"
        ],
        "tags": ["elasticsearch", "search", "analytics", "elk-stack", "lucene"],
        "request": {
            "subject": "Elasticsearch and Search Engineering",
            "goal": "I want to become proficient in Elasticsearch for search and analytics. Teach me index design, query DSL, aggregations, performance tuning, cluster management, and how to build powerful search applications using the Elastic Stack.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    
    {
        "title": "Protocol Buffers and gRPC Development",
        "category": "backend-development",
        "subcategory": "apis",
        "difficulty": "intermediate",
        "target_audience": "Backend developers building high-performance distributed systems",
        "estimated_hours": 75,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.6,
        "prerequisites": ["API development experience", "Basic networking", "Go, Java, or Python knowledge"],
        "learning_outcomes": [
            "Design efficient Protocol Buffer schemas",
            "Build high-performance gRPC services",
            "Implement streaming APIs and bidirectional communication",
            "Handle gRPC authentication and security",
            "Deploy and monitor gRPC services in production"
        ],
        "tags": ["grpc", "protobuf", "microservices", "performance", "streaming"],
        "request": {
            "subject": "Protocol Buffers and gRPC Development",
            "goal": "I want to master gRPC and Protocol Buffers for high-performance APIs. Teach me schema design, service implementation, streaming patterns, load balancing, security, monitoring, and how to build efficient microservices with gRPC.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ==============================================================================
    # TRENDING 2025 TECH ROADMAPS - HIGHLY DEMANDED
    # ==============================================================================
    
    # AGENTIC AI DEVELOPMENT
    {
        "title": "Agentic AI Development and Multi-Agent Systems",
        "category": "artificial-intelligence",
        "subcategory": "agentic-ai",
        "difficulty": "advanced",
        "target_audience": "AI engineers and researchers building autonomous AI systems",
        "estimated_hours": 160,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.8,
        "prerequisites": ["Machine learning fundamentals", "Python programming", "Deep learning experience"],
        "learning_outcomes": [
            "Design and implement autonomous AI agents",
            "Build multi-agent coordination systems",
            "Master agent-environment interaction patterns",
            "Implement reinforcement learning for agent training",
            "Deploy agentic AI systems in production environments"
        ],
        "tags": ["agentic-ai", "multi-agent", "autonomous-systems", "reinforcement-learning", "ai-agents"],
        "request": {
            "subject": "Agentic AI Development and Multi-Agent Systems",
            "goal": "I want to master building autonomous AI agents and multi-agent systems. Teach me agent architectures, decision-making frameworks, multi-agent coordination, reinforcement learning for agents, environment simulation, and deploying agentic AI systems that can act independently to achieve goals.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # POST-QUANTUM CRYPTOGRAPHY
    {
        "title": "Post-Quantum Cryptography and Future-Proof Security",
        "category": "cybersecurity",
        "subcategory": "post-quantum-crypto",
        "difficulty": "advanced",
        "target_audience": "Security engineers and cryptographers preparing for quantum threats",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.7,
        "prerequisites": ["Mathematics background", "Classical cryptography knowledge", "Programming experience"],
        "learning_outcomes": [
            "Understand quantum computing threats to current cryptography",
            "Implement NIST-approved post-quantum algorithms",
            "Design quantum-resistant security architectures",
            "Migrate existing systems to post-quantum cryptography",
            "Evaluate and implement hybrid cryptographic solutions"
        ],
        "tags": ["post-quantum", "cryptography", "quantum-resistance", "NIST", "security-migration"],
        "request": {
            "subject": "Post-Quantum Cryptography and Future-Proof Security",
            "goal": "I want to master post-quantum cryptography to protect against future quantum computing threats. Teach me quantum threats to encryption, NIST post-quantum standards, implementing quantum-resistant algorithms, migration strategies, and building future-proof security systems.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # EDGE AI AND TINYML
    {
        "title": "Edge AI and TinyML for IoT Devices",
        "category": "artificial-intelligence",
        "subcategory": "edge-ai",
        "difficulty": "intermediate",
        "target_audience": "Developers building AI solutions for edge devices and IoT",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Machine learning basics", "Embedded systems knowledge", "C/C++ or Python"],
        "learning_outcomes": [
            "Optimize AI models for resource-constrained devices",
            "Implement TinyML frameworks and libraries",
            "Deploy neural networks on microcontrollers",
            "Handle real-time inference at the edge",
            "Build complete edge AI applications and systems"
        ],
        "tags": ["edge-ai", "tinyml", "iot", "embedded-ml", "model-optimization"],
        "request": {
            "subject": "Edge AI and TinyML for IoT Devices",
            "goal": "I want to master deploying AI on edge devices and IoT systems. Teach me model quantization and optimization, TinyML frameworks, embedded AI deployment, real-time inference, power optimization, and building complete edge AI solutions for resource-constrained environments.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # VECTOR DATABASES AND RAG
    {
        "title": "Vector Databases and RAG Systems Architecture",
        "category": "artificial-intelligence",
        "subcategory": "vector-databases",
        "difficulty": "intermediate",
        "target_audience": "AI engineers building modern RAG and semantic search systems",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["Python programming", "Basic machine learning", "Database fundamentals"],
        "learning_outcomes": [
            "Design and implement vector database architectures",
            "Build production-ready RAG (Retrieval-Augmented Generation) systems",
            "Optimize semantic search and similarity matching",
            "Handle large-scale vector indexing and retrieval",
            "Deploy scalable RAG applications with LLMs"
        ],
        "tags": ["vector-databases", "rag", "semantic-search", "llm", "embeddings"],
        "request": {
            "subject": "Vector Databases and RAG Systems Architecture",
            "goal": "I want to master vector databases and RAG systems for modern AI applications. Teach me vector embeddings, similarity search, database design (Pinecone, Weaviate, Chroma), RAG architectures, retrieval optimization, and building production RAG systems with LLMs.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # AI SAFETY AND ALIGNMENT
    {
        "title": "AI Safety and Alignment Engineering",
        "category": "artificial-intelligence",
        "subcategory": "ai-safety",
        "difficulty": "advanced",
        "target_audience": "AI researchers and engineers focused on responsible AI development",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.6,
        "prerequisites": ["Deep learning experience", "Ethics background", "Research methodology"],
        "learning_outcomes": [
            "Understand AI alignment challenges and solutions",
            "Implement safety measures in AI systems",
            "Design interpretable and explainable AI models",
            "Handle AI bias detection and mitigation",
            "Build governance frameworks for responsible AI"
        ],
        "tags": ["ai-safety", "alignment", "responsible-ai", "explainable-ai", "ai-governance"],
        "request": {
            "subject": "AI Safety and Alignment Engineering",
            "goal": "I want to master AI safety and alignment for responsible AI development. Teach me alignment problems, safety measures, interpretability techniques, bias detection, robustness testing, governance frameworks, and building AI systems that are safe, reliable, and beneficial.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # WEB3 AND DECENTRALIZED APPS
    {
        "title": "Web3 and Decentralized Application Development",
        "category": "blockchain",
        "subcategory": "web3-dapps",
        "difficulty": "intermediate",
        "target_audience": "Developers building the next generation of decentralized applications",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["JavaScript/TypeScript", "Basic blockchain knowledge", "Frontend development"],
        "learning_outcomes": [
            "Build complete decentralized applications (DApps)",
            "Implement Web3 wallet integration and authentication",
            "Design decentralized storage and IPFS solutions",
            "Create DAO governance and token economics",
            "Deploy multi-chain DApps and cross-chain solutions"
        ],
        "tags": ["web3", "dapps", "defi", "dao", "ipfs", "multi-chain"],
        "request": {
            "subject": "Web3 and Decentralized Application Development",
            "goal": "I want to master Web3 and decentralized app development. Teach me DApp architecture, wallet integration, IPFS and decentralized storage, smart contract interaction, DAO creation, token economics, cross-chain development, and building complete Web3 ecosystems.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # DIGITAL TWIN DEVELOPMENT
    {
        "title": "Digital Twin Development and IoT Integration",
        "category": "emerging-technology",
        "subcategory": "digital-twins",
        "difficulty": "advanced",
        "target_audience": "Engineers building virtual replicas of physical systems",
        "estimated_hours": 150,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Programming skills", "IoT knowledge", "3D modeling basics", "Data analysis"],
        "learning_outcomes": [
            "Design and implement digital twin architectures",
            "Integrate real-time IoT data streams",
            "Build predictive maintenance systems",
            "Create 3D visualization and simulation environments",
            "Deploy scalable digital twin platforms"
        ],
        "tags": ["digital-twins", "iot", "simulation", "predictive-maintenance", "3d-modeling"],
        "request": {
            "subject": "Digital Twin Development and IoT Integration",
            "goal": "I want to master digital twin technology for creating virtual replicas of physical systems. Teach me digital twin architecture, IoT integration, real-time data synchronization, predictive analytics, 3D visualization, simulation modeling, and building complete digital twin platforms.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # 5G/6G NETWORK PROGRAMMING
    {
        "title": "5G/6G Network Programming and Edge Computing",
        "category": "networking",
        "subcategory": "next-gen-networks",
        "difficulty": "advanced",
        "target_audience": "Network engineers and developers working with next-generation networks",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Networking fundamentals", "Programming experience", "Distributed systems"],
        "learning_outcomes": [
            "Develop applications leveraging 5G network capabilities",
            "Implement ultra-low latency communication systems",
            "Build network slicing and quality-of-service solutions",
            "Create edge computing and MEC applications",
            "Design network function virtualization (NFV) solutions"
        ],
        "tags": ["5g", "6g", "edge-computing", "network-slicing", "mec", "nfv"],
        "request": {
            "subject": "5G/6G Network Programming and Edge Computing",
            "goal": "I want to master next-generation network programming for 5G and emerging 6G technologies. Teach me 5G architecture, network slicing, edge computing integration, ultra-low latency applications, network function virtualization, and building applications that leverage advanced network capabilities.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SUSTAINABLE COMPUTING
    {
        "title": "Sustainable Computing and Green Software Development",
        "category": "sustainable-technology",
        "subcategory": "green-computing",
        "difficulty": "intermediate",
        "target_audience": "Developers and engineers building environmentally responsible technology",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Programming fundamentals", "System architecture knowledge", "Environmental awareness"],
        "learning_outcomes": [
            "Measure and optimize software energy consumption",
            "Design carbon-efficient algorithms and architectures",
            "Implement sustainable cloud computing practices",
            "Build renewable energy-aware applications",
            "Create environmental impact assessment tools"
        ],
        "tags": ["sustainable-computing", "green-software", "carbon-efficiency", "renewable-energy", "environmental-impact"],
        "request": {
            "subject": "Sustainable Computing and Green Software Development",
            "goal": "I want to master sustainable computing and green software development. Teach me energy-efficient programming, carbon footprint measurement, sustainable architecture design, renewable energy integration, green cloud practices, and building environmentally responsible technology solutions.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # NEUROMORPHIC COMPUTING
    {
        "title": "Neuromorphic Computing and Brain-Inspired AI",
        "category": "emerging-technology",
        "subcategory": "neuromorphic",
        "difficulty": "advanced",
        "target_audience": "Researchers and engineers exploring brain-inspired computing architectures",
        "estimated_hours": 160,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["Neuroscience basics", "Machine learning", "Hardware understanding", "Mathematics"],
        "learning_outcomes": [
            "Understand neuromorphic computing principles and architectures",
            "Implement spiking neural networks (SNNs)",
            "Design energy-efficient brain-inspired algorithms",
            "Work with neuromorphic hardware platforms",
            "Build adaptive and learning-based computing systems"
        ],
        "tags": ["neuromorphic", "spiking-neural-networks", "brain-inspired", "adaptive-computing", "low-power-ai"],
        "request": {
            "subject": "Neuromorphic Computing and Brain-Inspired AI",
            "goal": "I want to master neuromorphic computing and brain-inspired AI systems. Teach me neuromorphic principles, spiking neural networks, event-driven processing, adaptive algorithms, neuromorphic hardware (Intel Loihi, SpiNNaker), and building ultra-low-power intelligent systems inspired by the brain.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ==============================================================================
    # HIGH-DEMAND CROSS-DOMAIN ROADMAPS 2025
    # ==============================================================================

    # HEALTHCARE & MEDICAL TECHNOLOGY
    {
        "title": "Healthcare AI and Medical Technology Development",
        "category": "healthcare-technology",
        "subcategory": "medical-ai",
        "difficulty": "advanced",
        "target_audience": "Healthcare professionals and technologists building AI-powered medical solutions",
        "estimated_hours": 160,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.6,
        "prerequisites": ["Healthcare domain knowledge", "Programming fundamentals", "Basic AI/ML understanding"],
        "learning_outcomes": [
            "Develop AI-powered diagnostic and therapeutic systems",
            "Implement medical imaging and computer vision solutions",
            "Build electronic health record (EHR) integration systems",
            "Design clinical decision support systems",
            "Handle healthcare data privacy and regulatory compliance"
        ],
        "tags": ["healthcare-ai", "medical-imaging", "clinical-decision-support", "hipaa", "fda-compliance"],
        "request": {
            "subject": "Healthcare AI and Medical Technology Development",
            "goal": "I want to master AI applications in healthcare and medical technology. Teach me medical AI algorithms, diagnostic imaging, clinical decision support, EHR systems, regulatory compliance (HIPAA, FDA), telemedicine platforms, and building safe, effective healthcare technology solutions.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # TELEMEDICINE AND REMOTE HEALTHCARE
    {
        "title": "Telemedicine Platform Development and Remote Patient Monitoring",
        "category": "healthcare-technology",
        "subcategory": "telemedicine",
        "difficulty": "intermediate",
        "target_audience": "Developers building telehealth and remote patient monitoring solutions",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Web development", "Healthcare basics", "Database knowledge"],
        "learning_outcomes": [
            "Build secure telemedicine consultation platforms",
            "Implement remote patient monitoring (RPM) systems",
            "Design real-time video and communication solutions",
            "Create patient data dashboards and analytics",
            "Handle healthcare interoperability standards (HL7, FHIR)"
        ],
        "tags": ["telemedicine", "remote-monitoring", "video-conferencing", "hl7-fhir", "patient-analytics"],
        "request": {
            "subject": "Telemedicine Platform Development and Remote Patient Monitoring",
            "goal": "I want to master building telemedicine and remote healthcare solutions. Teach me telehealth platforms, video consultation systems, remote patient monitoring, wearable device integration, healthcare APIs, real-time data processing, and creating comprehensive digital health ecosystems.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # CREATIVE DESIGN & UX/UI
    {
        "title": "Advanced UI/UX Design and Design Systems",
        "category": "design",
        "subcategory": "ui-ux",
        "difficulty": "intermediate",
        "target_audience": "Designers creating modern user experiences and design systems",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Basic design principles", "Design tools familiarity", "Understanding of web/mobile"],
        "learning_outcomes": [
            "Master modern UI/UX design principles and methodologies",
            "Build comprehensive design systems and component libraries",
            "Conduct user research and usability testing",
            "Create accessible and inclusive design solutions",
            "Design for emerging platforms (AR/VR, voice interfaces)"
        ],
        "tags": ["ui-ux", "design-systems", "user-research", "accessibility", "prototyping"],
        "request": {
            "subject": "Advanced UI/UX Design and Design Systems",
            "goal": "I want to master modern UI/UX design and design systems. Teach me design thinking, user research methods, wireframing and prototyping, design systems creation, accessibility standards, mobile-first design, and using tools like Figma, Adobe XD, and modern design workflows.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # CONTENT CREATION & DIGITAL MARKETING
    {
        "title": "Content Creation and Multimedia Production",
        "category": "creative-technology",
        "subcategory": "content-creation",
        "difficulty": "beginner",
        "target_audience": "Content creators and marketers building multimedia content strategies",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Basic computer skills", "Creative mindset", "Communication skills"],
        "learning_outcomes": [
            "Master video editing and motion graphics production",
            "Create engaging social media content across platforms",
            "Develop podcast and audio content workflows",
            "Build photography and visual storytelling skills",
            "Implement content strategy and analytics"
        ],
        "tags": ["video-editing", "social-media", "podcasting", "photography", "content-strategy"],
        "request": {
            "subject": "Content Creation and Multimedia Production",
            "goal": "I want to master content creation and multimedia production. Teach me video editing (Premiere Pro, Final Cut), photography, graphic design, social media strategy, podcast production, YouTube optimization, content planning, and building a personal brand through multimedia content.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # DATA ANALYTICS FOR BUSINESS
    {
        "title": "Business Intelligence and Advanced Data Analytics",
        "category": "data-analytics",
        "subcategory": "business-intelligence",
        "difficulty": "intermediate",
        "target_audience": "Business analysts and data professionals driving data-driven decisions",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["Excel proficiency", "Basic statistics", "SQL knowledge"],
        "learning_outcomes": [
            "Build comprehensive business intelligence dashboards",
            "Master advanced analytics tools (Tableau, Power BI, Looker)",
            "Implement predictive analytics and forecasting models",
            "Design data warehouse and ETL pipelines",
            "Create automated reporting and alerting systems"
        ],
        "tags": ["business-intelligence", "tableau", "power-bi", "predictive-analytics", "data-warehousing"],
        "request": {
            "subject": "Business Intelligence and Advanced Data Analytics",
            "goal": "I want to master business intelligence and data analytics for decision-making. Teach me BI tools (Tableau, Power BI), dashboard design, predictive modeling, data warehousing, ETL processes, statistical analysis, KPI development, and creating data-driven business strategies.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # BIOTECHNOLOGY AND BIOINFORMATICS
    {
        "title": "Bioinformatics and Computational Biology",
        "category": "biotechnology",
        "subcategory": "bioinformatics",
        "difficulty": "advanced",
        "target_audience": "Researchers and scientists working with biological data and computational methods",
        "estimated_hours": 150,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Biology background", "Programming skills", "Statistics knowledge"],
        "learning_outcomes": [
            "Analyze genomic and proteomic data using computational tools",
            "Implement sequence alignment and phylogenetic analysis",
            "Build machine learning models for biological predictions",
            "Work with biological databases and APIs",
            "Develop bioinformatics pipelines and workflows"
        ],
        "tags": ["bioinformatics", "genomics", "proteomics", "sequence-analysis", "computational-biology"],
        "request": {
            "subject": "Bioinformatics and Computational Biology",
            "goal": "I want to master bioinformatics and computational biology. Teach me genomic data analysis, sequence alignment, phylogenetics, protein structure prediction, biological databases (NCBI, Ensembl), Python/R for bioinformatics, machine learning in biology, and building computational pipelines for biological research.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # FINTECH AND DIGITAL FINANCE
    {
        "title": "FinTech Development and Digital Banking Solutions",
        "category": "fintech",
        "subcategory": "digital-banking",
        "difficulty": "intermediate",
        "target_audience": "Developers and financial professionals building modern financial technology",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Programming skills", "Finance basics", "API development knowledge"],
        "learning_outcomes": [
            "Build secure payment processing and digital wallet systems",
            "Implement regulatory compliance (PCI DSS, PSD2, GDPR)",
            "Create robo-advisors and algorithmic trading platforms",
            "Design peer-to-peer lending and crowdfunding solutions",
            "Develop cryptocurrency and DeFi integrations"
        ],
        "tags": ["fintech", "digital-payments", "robo-advisors", "regulatory-compliance", "defi"],
        "request": {
            "subject": "FinTech Development and Digital Banking Solutions",
            "goal": "I want to master FinTech development and digital banking solutions. Teach me payment processing, digital wallets, regulatory compliance, robo-advisors, algorithmic trading, lending platforms, cryptocurrency integration, and building secure, scalable financial technology products.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # RENEWABLE ENERGY AND SMART GRID
    {
        "title": "Smart Grid Technology and Renewable Energy Systems",
        "category": "energy-technology",
        "subcategory": "smart-grid",
        "difficulty": "advanced",
        "target_audience": "Engineers working on sustainable energy and smart grid technologies",
        "estimated_hours": 160,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Engineering background", "Programming skills", "Understanding of electrical systems"],
        "learning_outcomes": [
            "Design smart grid infrastructure and communication systems",
            "Implement renewable energy integration and storage solutions",
            "Build energy management and optimization algorithms",
            "Create IoT-based energy monitoring systems",
            "Develop predictive maintenance for energy infrastructure"
        ],
        "tags": ["smart-grid", "renewable-energy", "energy-storage", "iot-energy", "grid-optimization"],
        "request": {
            "subject": "Smart Grid Technology and Renewable Energy Systems",
            "goal": "I want to master smart grid and renewable energy technologies. Teach me smart grid architecture, renewable energy integration, energy storage systems, grid optimization algorithms, IoT for energy monitoring, demand response systems, and building sustainable energy solutions.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPACE TECHNOLOGY AND AEROSPACE
    {
        "title": "Space Technology and Satellite Systems Development",
        "category": "aerospace-technology",
        "subcategory": "space-systems",
        "difficulty": "advanced",
        "target_audience": "Engineers and researchers working on space and satellite technologies",
        "estimated_hours": 170,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Engineering background", "Physics knowledge", "Programming skills"],
        "learning_outcomes": [
            "Design satellite systems and orbital mechanics solutions",
            "Implement space communication and navigation systems",
            "Build ground station software and mission control systems",
            "Create space data processing and analysis pipelines",
            "Develop CubeSat and small satellite technologies"
        ],
        "tags": ["satellite-systems", "orbital-mechanics", "space-communication", "cubesat", "mission-control"],
        "request": {
            "subject": "Space Technology and Satellite Systems Development",
            "goal": "I want to master space technology and satellite systems. Teach me satellite design, orbital mechanics, space communications, ground station operations, mission planning, CubeSat development, space data analysis, and building systems for space exploration and Earth observation.",
            "time_value": 14,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ADVANCED ROBOTICS AND AUTOMATION
    {
        "title": "Advanced Robotics and Industrial Automation",
        "category": "robotics",
        "subcategory": "industrial-automation",
        "difficulty": "advanced",
        "target_audience": "Engineers building robotic systems and automation solutions",
        "estimated_hours": 150,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Engineering background", "Programming skills", "Control systems knowledge"],
        "learning_outcomes": [
            "Design and implement autonomous robotic systems",
            "Build computer vision and sensor fusion solutions",
            "Create motion planning and control algorithms",
            "Implement human-robot interaction interfaces",
            "Develop industrial automation and manufacturing systems"
        ],
        "tags": ["robotics", "computer-vision", "motion-planning", "industrial-automation", "sensor-fusion"],
        "request": {
            "subject": "Advanced Robotics and Industrial Automation",
            "goal": "I want to master advanced robotics and automation systems. Teach me robotic control systems, computer vision, motion planning, sensor fusion, ROS (Robot Operating System), industrial automation, collaborative robots, and building autonomous systems for manufacturing and service applications.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ==============================================================================
    # RESEARCH AND LIFE SCIENCES ROADMAPS
    # ==============================================================================

    # RESEARCH METHODOLOGY AND EXPERIMENTAL DESIGN
    {
        "title": "Research Methodology and Experimental Design for Life Sciences",
        "category": "research",
        "subcategory": "methodology",
        "difficulty": "intermediate",
        "target_audience": "Graduate students, postdocs, and early-career researchers",
        "estimated_hours": 80,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Basic statistics", "Scientific background", "Critical thinking skills"],
        "learning_outcomes": [
            "Master experimental design principles and controls",
            "Understand hypothesis formulation and testing",
            "Learn sampling methods and statistical power analysis",
            "Excel in research ethics and reproducibility",
            "Develop skills in literature review and meta-analysis"
        ],
        "tags": ["research-methodology", "experimental-design", "statistics", "reproducibility", "ethics"],
        "request": {
            "subject": "Research Methodology and Experimental Design Mastery",
            "goal": "I want to master research methodology for life sciences research. Teach me experimental design, hypothesis testing, controls, sampling methods, statistical analysis, research ethics, reproducibility, literature review techniques, and meta-analysis. Include best practices for planning and executing rigorous scientific studies.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Biostatistics and Data Analysis for Researchers",
        "category": "research",
        "subcategory": "data-analysis",
        "difficulty": "intermediate",
        "target_audience": "Life sciences researchers and graduate students",
        "estimated_hours": 90,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Basic mathematics", "Research background", "Computer literacy"],
        "learning_outcomes": [
            "Master descriptive and inferential statistics",
            "Excel in hypothesis testing and confidence intervals",
            "Learn regression analysis and ANOVA",
            "Understand survival analysis and clinical trial statistics",
            "Develop skills in R, Python, and statistical software"
        ],
        "tags": ["biostatistics", "data-analysis", "r-programming", "python", "clinical-trials"],
        "request": {
            "subject": "Biostatistics and Data Analysis Expertise",
            "goal": "I want to master biostatistics for life sciences research. Teach me descriptive statistics, inferential statistics, hypothesis testing, regression analysis, ANOVA, survival analysis, clinical trial design, and statistical software (R, Python, SPSS). Include practical applications in biological and medical research.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # BIOINFORMATICS AND COMPUTATIONAL BIOLOGY
    {
        "title": "Bioinformatics Fundamentals for Life Sciences Researchers",
        "category": "research",
        "subcategory": "bioinformatics",
        "difficulty": "intermediate",
        "target_audience": "Biologists transitioning to computational analysis",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Basic biology", "Computer literacy", "Mathematics background"],
        "learning_outcomes": [
            "Master sequence analysis and alignment algorithms",
            "Excel in genomics and transcriptomics data analysis",
            "Learn protein structure analysis and prediction",
            "Understand phylogenetic analysis and evolution",
            "Develop skills in bioinformatics databases and tools"
        ],
        "tags": ["bioinformatics", "genomics", "sequence-analysis", "computational-biology", "python"],
        "request": {
            "subject": "Bioinformatics and Computational Biology Mastery",
            "goal": "I want to master bioinformatics for biological research. Teach me sequence analysis, genome assembly, transcriptomics, proteomics, phylogenetics, structural biology, and bioinformatics tools. Include Python programming, R for bioinformatics, database usage (NCBI, UniProt), and pipeline development.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Genomics and Next-Generation Sequencing Analysis",
        "category": "research",
        "subcategory": "genomics",
        "difficulty": "advanced",
        "target_audience": "Researchers working with NGS data",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Bioinformatics basics", "Programming skills", "Molecular biology knowledge"],
        "learning_outcomes": [
            "Master NGS data preprocessing and quality control",
            "Excel in variant calling and genome assembly",
            "Learn RNA-seq and ChIP-seq analysis workflows",
            "Understand single-cell sequencing analysis",
            "Develop expertise in genomics pipelines and cloud computing"
        ],
        "tags": ["genomics", "ngs", "sequencing", "variant-calling", "rna-seq"],
        "request": {
            "subject": "Genomics and NGS Analysis Expertise",
            "goal": "I want to master genomics and next-generation sequencing analysis. Teach me NGS data processing, quality control, read alignment, variant calling, genome assembly, RNA-seq analysis, ChIP-seq, single-cell sequencing, and pipeline development. Include tools like BWA, GATK, Samtools, and cloud computing platforms.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # LABORATORY TECHNIQUES AND INSTRUMENTATION
    {
        "title": "Advanced Laboratory Techniques in Molecular Biology",
        "category": "research",
        "subcategory": "laboratory-techniques",
        "difficulty": "intermediate",
        "target_audience": "Lab researchers and graduate students",
        "estimated_hours": 85,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Basic molecular biology", "Lab safety training", "Hands-on lab experience"],
        "learning_outcomes": [
            "Master PCR, qPCR, and advanced amplification techniques",
            "Excel in protein expression and purification",
            "Learn cell culture and transfection methods",
            "Understand microscopy and imaging techniques",
            "Develop expertise in western blotting and ELISA"
        ],
        "tags": ["molecular-biology", "pcr", "protein-expression", "cell-culture", "microscopy"],
        "request": {
            "subject": "Advanced Molecular Biology Laboratory Techniques",
            "goal": "I want to master advanced laboratory techniques in molecular biology. Teach me PCR and qPCR, protein expression and purification, cell culture techniques, transfection methods, western blotting, ELISA, immunofluorescence, microscopy, and troubleshooting lab protocols. Include best practices for reproducible research.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Mass Spectrometry and Analytical Instrumentation",
        "category": "research",
        "subcategory": "instrumentation",
        "difficulty": "advanced",
        "target_audience": "Analytical researchers and instrument specialists",
        "estimated_hours": 95,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Analytical chemistry", "Physics background", "Instrument experience"],
        "learning_outcomes": [
            "Master mass spectrometry principles and applications",
            "Excel in LC-MS, GC-MS, and tandem MS techniques",
            "Learn proteomics and metabolomics workflows",
            "Understand ion sources and mass analyzers",
            "Develop expertise in data analysis and interpretation"
        ],
        "tags": ["mass-spectrometry", "lc-ms", "proteomics", "metabolomics", "analytical-chemistry"],
        "request": {
            "subject": "Mass Spectrometry and Analytical Instrumentation Mastery",
            "goal": "I want to master mass spectrometry for research applications. Teach me MS principles, ionization methods, mass analyzers, LC-MS and GC-MS techniques, proteomics workflows, metabolomics analysis, quantitative methods, and data interpretation. Include instrument maintenance and troubleshooting.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # CLINICAL RESEARCH AND TRIALS
    {
        "title": "Clinical Research and Good Clinical Practice (GCP)",
        "category": "research",
        "subcategory": "clinical-research",
        "difficulty": "intermediate",
        "target_audience": "Clinical researchers and trial coordinators",
        "estimated_hours": 75,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Healthcare background", "Research ethics training", "Clinical experience"],
        "learning_outcomes": [
            "Master GCP guidelines and regulatory compliance",
            "Excel in clinical trial design and protocol development",
            "Learn patient recruitment and informed consent",
            "Understand data management and monitoring",
            "Develop expertise in adverse event reporting"
        ],
        "tags": ["clinical-research", "gcp", "clinical-trials", "regulatory-compliance", "patient-safety"],
        "request": {
            "subject": "Clinical Research and GCP Mastery",
            "goal": "I want to master clinical research and Good Clinical Practice. Teach me GCP guidelines, clinical trial design, protocol development, patient recruitment, informed consent, data management, monitoring, adverse event reporting, and regulatory compliance. Include ICH guidelines and FDA regulations.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Translational Medicine and Drug Development",
        "category": "research",
        "subcategory": "translational-medicine",
        "difficulty": "advanced",
        "target_audience": "Translational researchers and pharmaceutical scientists",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Molecular biology", "Pharmacology", "Clinical research knowledge"],
        "learning_outcomes": [
            "Master bench-to-bedside research principles",
            "Excel in biomarker discovery and validation",
            "Learn drug discovery and development pathways",
            "Understand regulatory pathways and FDA approval",
            "Develop expertise in personalized medicine approaches"
        ],
        "tags": ["translational-medicine", "drug-development", "biomarkers", "personalized-medicine", "fda"],
        "request": {
            "subject": "Translational Medicine and Drug Development Expertise",
            "goal": "I want to master translational medicine and drug development. Teach me bench-to-bedside research, biomarker discovery, drug discovery pipelines, preclinical studies, clinical development, regulatory affairs, personalized medicine, and commercialization strategies. Include FDA regulations and industry best practices.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # GRANT WRITING AND SCIENTIFIC COMMUNICATION
    {
        "title": "Grant Writing and Research Funding Mastery",
        "category": "research",
        "subcategory": "funding",
        "difficulty": "intermediate",
        "target_audience": "Academic researchers and principal investigators",
        "estimated_hours": 60,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Research experience", "Scientific writing", "Project management"],
        "learning_outcomes": [
            "Master grant proposal structure and components",
            "Excel in specific aims and hypothesis development",
            "Learn budget preparation and justification",
            "Understand funding agency requirements (NIH, NSF)",
            "Develop expertise in peer review and revision strategies"
        ],
        "tags": ["grant-writing", "research-funding", "nih", "nsf", "proposal-writing"],
        "request": {
            "subject": "Grant Writing and Research Funding Mastery",
            "goal": "I want to master grant writing for research funding. Teach me proposal structure, specific aims development, significance and innovation sections, approach and methods, budget preparation, NIH and NSF guidelines, peer review process, and revision strategies. Include successful grant examples and common pitfalls.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Scientific Writing and Publication Strategy",
        "category": "research",
        "subcategory": "communication",
        "difficulty": "intermediate",
        "target_audience": "Researchers preparing manuscripts for publication",
        "estimated_hours": 70,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Research experience", "Basic writing skills", "Scientific background"],
        "learning_outcomes": [
            "Master scientific manuscript structure and flow",
            "Excel in figure design and data visualization",
            "Learn journal selection and submission process",
            "Understand peer review and revision handling",
            "Develop expertise in impact factor and citation strategies"
        ],
        "tags": ["scientific-writing", "publication", "manuscript", "peer-review", "data-visualization"],
        "request": {
            "subject": "Scientific Writing and Publication Excellence",
            "goal": "I want to master scientific writing and publication strategy. Teach me manuscript structure, abstract writing, figure design, data presentation, journal selection, submission process, peer review responses, and citation strategies. Include best practices for high-impact publications and career advancement.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED RESEARCH AREAS
    {
        "title": "Proteomics and Protein Analysis Techniques",
        "category": "research",
        "subcategory": "proteomics",
        "difficulty": "advanced",
        "target_audience": "Protein researchers and structural biologists",
        "estimated_hours": 95,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Biochemistry", "Protein chemistry", "Analytical techniques"],
        "learning_outcomes": [
            "Master protein separation and purification techniques",
            "Excel in mass spectrometry for protein analysis",
            "Learn protein-protein interaction studies",
            "Understand structural proteomics and X-ray crystallography",
            "Develop expertise in quantitative proteomics workflows"
        ],
        "tags": ["proteomics", "protein-analysis", "mass-spectrometry", "structural-biology", "biochemistry"],
        "request": {
            "subject": "Proteomics and Protein Analysis Mastery",
            "goal": "I want to master proteomics and protein analysis techniques. Teach me protein purification, mass spectrometry proteomics, protein-protein interactions, structural proteomics, quantitative proteomics, post-translational modifications, and bioinformatics analysis. Include both experimental and computational approaches.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Cell Biology and Microscopy Techniques",
        "category": "research",
        "subcategory": "cell-biology",
        "difficulty": "intermediate",
        "target_audience": "Cell biologists and imaging specialists",
        "estimated_hours": 85,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Cell biology basics", "Microscopy experience", "Lab techniques"],
        "learning_outcomes": [
            "Master advanced microscopy techniques (confocal, super-resolution)",
            "Excel in live cell imaging and time-lapse microscopy",
            "Learn fluorescence techniques and probe development",
            "Understand image analysis and quantification",
            "Develop expertise in cellular assays and functional studies"
        ],
        "tags": ["cell-biology", "microscopy", "imaging", "fluorescence", "live-cell"],
        "request": {
            "subject": "Advanced Cell Biology and Microscopy Mastery",
            "goal": "I want to master advanced cell biology and microscopy techniques. Teach me confocal microscopy, super-resolution imaging, live cell imaging, fluorescence techniques, image analysis, quantification methods, cellular assays, and functional studies. Include best practices for high-quality imaging and data interpretation.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # REGULATORY AFFAIRS AND COMPLIANCE
    {
        "title": "Regulatory Affairs for Biotech and Pharma",
        "category": "research",
        "subcategory": "regulatory-affairs",
        "difficulty": "advanced",
        "target_audience": "Regulatory professionals and biotech researchers",
        "estimated_hours": 90,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Life sciences background", "Regulatory knowledge", "Industry experience"],
        "learning_outcomes": [
            "Master FDA regulations and submission processes",
            "Excel in IND and NDA preparation",
            "Learn global regulatory requirements (EMA, ICH)",
            "Understand quality systems and GxP compliance",
            "Develop expertise in regulatory strategy and planning"
        ],
        "tags": ["regulatory-affairs", "fda", "gxp", "compliance", "biotech"],
        "request": {
            "subject": "Regulatory Affairs for Biotech and Pharma Mastery",
            "goal": "I want to master regulatory affairs for biotechnology and pharmaceutical industries. Teach me FDA regulations, IND/NDA submissions, clinical trial regulations, quality systems, GxP compliance, global regulatory requirements, and regulatory strategy. Include practical applications in drug development.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # DIAGNOSTIC AND MEDICAL RESEARCH
    {
        "title": "Diagnostic Test Development and Validation",
        "category": "research",
        "subcategory": "diagnostics",
        "difficulty": "advanced",
        "target_audience": "Diagnostic researchers and clinical laboratory scientists",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Laboratory experience", "Statistics", "Analytical chemistry"],
        "learning_outcomes": [
            "Master diagnostic assay design and optimization",
            "Excel in analytical validation and performance testing",
            "Learn clinical validation and utility studies",
            "Understand regulatory requirements for diagnostics",
            "Develop expertise in biomarker discovery and validation"
        ],
        "tags": ["diagnostics", "assay-development", "validation", "biomarkers", "clinical-laboratory"],
        "request": {
            "subject": "Diagnostic Test Development and Validation Mastery",
            "goal": "I want to master diagnostic test development and validation. Teach me assay design, analytical validation, clinical validation, biomarker discovery, regulatory requirements, quality control, and performance testing. Include FDA guidelines for in vitro diagnostics and laboratory standards.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Epidemiology and Public Health Research Methods",
        "category": "research",
        "subcategory": "epidemiology",
        "difficulty": "intermediate",
        "target_audience": "Public health researchers and epidemiologists",
        "estimated_hours": 80,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Statistics", "Public health background", "Research methods"],
        "learning_outcomes": [
            "Master study design (cohort, case-control, cross-sectional)",
            "Excel in disease surveillance and outbreak investigation",
            "Learn causal inference and confounding control",
            "Understand systematic reviews and meta-analysis",
            "Develop expertise in health policy and intervention evaluation"
        ],
        "tags": ["epidemiology", "public-health", "study-design", "surveillance", "causal-inference"],
        "request": {
            "subject": "Epidemiology and Public Health Research Mastery",
            "goal": "I want to master epidemiology and public health research methods. Teach me study design, disease surveillance, outbreak investigation, statistical analysis, causal inference, systematic reviews, meta-analysis, and health policy evaluation. Include practical applications in population health research.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # RESEARCH TECHNOLOGY AND INNOVATION
    {
        "title": "Research Data Management and FAIR Principles",
        "category": "research",
        "subcategory": "data-management",
        "difficulty": "intermediate",
        "target_audience": "Researchers handling large datasets",
        "estimated_hours": 55,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.6,
        "prerequisites": ["Research experience", "Basic programming", "Database concepts"],
        "learning_outcomes": [
            "Master FAIR data principles (Findable, Accessible, Interoperable, Reusable)",
            "Excel in data management planning and documentation",
            "Learn metadata standards and data repositories",
            "Understand version control for research data",
            "Develop expertise in data sharing and collaboration"
        ],
        "tags": ["data-management", "fair-principles", "metadata", "repositories", "collaboration"],
        "request": {
            "subject": "Research Data Management and FAIR Principles Mastery",
            "goal": "I want to master research data management and FAIR principles. Teach me data management planning, metadata standards, data repositories, version control, data sharing protocols, and collaborative research practices. Include best practices for reproducible research and data stewardship.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Machine Learning Applications in Life Sciences",
        "category": "research",
        "subcategory": "machine-learning",
        "difficulty": "advanced",
        "target_audience": "Computational biologists and data scientists",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Programming skills", "Statistics", "Machine learning basics", "Biology background"],
        "learning_outcomes": [
            "Master supervised learning for biological classification",
            "Excel in unsupervised learning for pattern discovery",
            "Learn deep learning applications in genomics and imaging",
            "Understand feature selection and model validation",
            "Develop expertise in biological network analysis"
        ],
        "tags": ["machine-learning", "computational-biology", "deep-learning", "genomics", "bioinformatics"],
        "request": {
            "subject": "Machine Learning in Life Sciences Mastery",
            "goal": "I want to master machine learning applications in life sciences. Teach me supervised and unsupervised learning, deep learning for genomics and medical imaging, feature selection, model validation, network analysis, and biological data interpretation. Include Python, TensorFlow, and domain-specific applications.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # QUALITY ASSURANCE AND LABORATORY MANAGEMENT
    {
        "title": "Laboratory Quality Management and ISO Standards",
        "category": "research",
        "subcategory": "quality-management",
        "difficulty": "intermediate",
        "target_audience": "Lab managers and quality assurance professionals",
        "estimated_hours": 65,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.5,
        "prerequisites": ["Laboratory experience", "Management background", "Quality concepts"],
        "learning_outcomes": [
            "Master ISO 15189 and laboratory accreditation standards",
            "Excel in quality control and quality assurance systems",
            "Learn documentation and record keeping best practices",
            "Understand method validation and verification",
            "Develop expertise in audit preparation and management"
        ],
        "tags": ["quality-management", "iso-standards", "laboratory-accreditation", "quality-control", "auditing"],
        "request": {
            "subject": "Laboratory Quality Management and ISO Standards Mastery",
            "goal": "I want to master laboratory quality management and ISO standards. Teach me ISO 15189, quality management systems, method validation, documentation control, internal auditing, corrective actions, and accreditation processes. Include practical implementation in research and clinical laboratories.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ==============================================================================
    # LEGAL EDUCATION AND PRACTICE ROADMAPS
    # ==============================================================================

    # LEGAL RESEARCH AND WRITING
    {
        "title": "Advanced Legal Research and Citation Mastery",
        "category": "legal",
        "subcategory": "research-writing",
        "difficulty": "intermediate",
        "target_audience": "Law students and junior associates",
        "estimated_hours": 45,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Basic legal knowledge", "Law school coursework", "Writing skills"],
        "learning_outcomes": [
            "Master advanced legal databases (Westlaw, Lexis, Bloomberg Law)",
            "Excel in Boolean search strategies and case law analysis",
            "Learn secondary source utilization and validation",
            "Understand citation formats (Bluebook, ALWD) and shepardizing",
            "Develop efficient research methodologies and fact-checking"
        ],
        "tags": ["legal-research", "westlaw", "lexis", "bluebook", "case-law"],
        "request": {
            "subject": "Advanced Legal Research and Citation Excellence",
            "goal": "I want to master advanced legal research techniques and citation. Teach me sophisticated database searching, case law analysis, secondary source evaluation, proper citation formats, shepardizing, and efficient research workflows. Include practical exercises with real legal problems and time management strategies.",
            "time_value": 5,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Legal Brief Writing and Persuasive Advocacy",
        "category": "legal",
        "subcategory": "advocacy-writing",
        "difficulty": "intermediate",
        "target_audience": "Law students and litigation attorneys",
        "estimated_hours": 55,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Legal writing basics", "Case law understanding", "Research skills"],
        "learning_outcomes": [
            "Master persuasive brief structure and argumentation",
            "Excel in motion practice and procedural briefing",
            "Learn appellate brief writing and oral argument preparation",
            "Understand judicial writing styles and audience analysis",
            "Develop compelling fact presentation and legal storytelling"
        ],
        "tags": ["brief-writing", "persuasive-writing", "motion-practice", "appellate-advocacy", "litigation"],
        "request": {
            "subject": "Legal Brief Writing and Persuasive Advocacy Mastery",
            "goal": "I want to master legal brief writing and persuasive advocacy. Teach me brief structure, argument development, motion practice, appellate writing, fact presentation, and legal storytelling. Include analysis of winning briefs, judicial preferences, and practical drafting exercises.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # CONTRACT DRAFTING AND NEGOTIATION
    {
        "title": "Contract Drafting and Risk Allocation",
        "category": "legal",
        "subcategory": "transactional",
        "difficulty": "advanced",
        "target_audience": "Transactional attorneys and business lawyers",
        "estimated_hours": 65,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Contract law knowledge", "Business understanding", "Legal drafting experience"],
        "learning_outcomes": [
            "Master sophisticated contract drafting techniques",
            "Excel in risk allocation and liability management",
            "Learn indemnification, insurance, and warranty provisions",
            "Understand force majeure and termination clauses",
            "Develop expertise in contract negotiation strategies"
        ],
        "tags": ["contract-drafting", "risk-allocation", "indemnification", "negotiation", "transactional"],
        "request": {
            "subject": "Advanced Contract Drafting and Risk Management",
            "goal": "I want to master sophisticated contract drafting and risk allocation. Teach me advanced drafting techniques, liability management, indemnification provisions, insurance requirements, force majeure clauses, and negotiation strategies. Include real-world examples and industry-specific considerations.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "M&A Due Diligence and Transaction Documentation",
        "category": "legal",
        "subcategory": "corporate-ma",
        "difficulty": "advanced",
        "target_audience": "Corporate attorneys and M&A specialists",
        "estimated_hours": 75,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Corporate law", "Securities knowledge", "Transaction experience"],
        "learning_outcomes": [
            "Master due diligence process and document review",
            "Excel in purchase agreement drafting and negotiation",
            "Learn disclosure schedules and representation warranties",
            "Understand closing conditions and post-closing adjustments",
            "Develop expertise in deal structure and tax considerations"
        ],
        "tags": ["mergers-acquisitions", "due-diligence", "purchase-agreements", "corporate-law", "securities"],
        "request": {
            "subject": "M&A Due Diligence and Transaction Excellence",
            "goal": "I want to master M&A due diligence and transaction documentation. Teach me due diligence processes, purchase agreement drafting, disclosure schedules, closing conditions, deal structures, and tax considerations. Include practical transaction management and client counseling skills.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # LITIGATION AND TRIAL ADVOCACY
    {
        "title": "Deposition Strategy and Witness Examination",
        "category": "legal",
        "subcategory": "litigation",
        "difficulty": "advanced",
        "target_audience": "Litigation attorneys and trial lawyers",
        "estimated_hours": 50,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Civil procedure", "Evidence law", "Litigation experience"],
        "learning_outcomes": [
            "Master deposition planning and question development",
            "Excel in witness examination techniques",
            "Learn impeachment strategies and document handling",
            "Understand objection practice and preservation of record",
            "Develop skills in hostile witness management"
        ],
        "tags": ["depositions", "witness-examination", "litigation-strategy", "impeachment", "trial-advocacy"],
        "request": {
            "subject": "Deposition Strategy and Witness Examination Mastery",
            "goal": "I want to master deposition strategy and witness examination. Teach me deposition planning, question development, examination techniques, impeachment strategies, objection practice, and hostile witness management. Include practical exercises and courtroom psychology insights.",
            "time_value": 5,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "E-Discovery and Digital Evidence Management",
        "category": "legal",
        "subcategory": "ediscovery",
        "difficulty": "intermediate",
        "target_audience": "Litigation attorneys and legal technology specialists",
        "estimated_hours": 60,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Civil procedure", "Evidence law", "Technology familiarity"],
        "learning_outcomes": [
            "Master e-discovery protocols and preservation duties",
            "Excel in search methodologies and review platforms",
            "Learn privilege protection and clawback procedures",
            "Understand metadata and digital forensics basics",
            "Develop expertise in e-discovery project management"
        ],
        "tags": ["ediscovery", "digital-evidence", "litigation-support", "privilege", "metadata"],
        "request": {
            "subject": "E-Discovery and Digital Evidence Excellence",
            "goal": "I want to master e-discovery and digital evidence management. Teach me preservation protocols, search methodologies, review platforms, privilege protection, metadata handling, and digital forensics. Include cost management and vendor coordination strategies.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED PRACTICE AREAS
    {
        "title": "Employment Law Compliance and Investigation",
        "category": "legal",
        "subcategory": "employment",
        "difficulty": "intermediate",
        "target_audience": "Employment attorneys and HR legal counsel",
        "estimated_hours": 55,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Employment law basics", "HR knowledge", "Compliance background"],
        "learning_outcomes": [
            "Master workplace investigation techniques",
            "Excel in discrimination and harassment claim analysis",
            "Learn wage and hour compliance strategies",
            "Understand NLRA and union-related issues",
            "Develop expertise in policy drafting and training"
        ],
        "tags": ["employment-law", "workplace-investigations", "discrimination", "wage-hour", "compliance"],
        "request": {
            "subject": "Employment Law Compliance and Investigation Mastery",
            "goal": "I want to master employment law compliance and workplace investigations. Teach me investigation techniques, discrimination analysis, wage and hour compliance, union issues, policy development, and training programs. Include practical case management and client counseling skills.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Intellectual Property Portfolio Management",
        "category": "legal",
        "subcategory": "intellectual-property",
        "difficulty": "advanced",
        "target_audience": "IP attorneys and technology lawyers",
        "estimated_hours": 70,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["IP law knowledge", "Patent/trademark basics", "Technology understanding"],
        "learning_outcomes": [
            "Master patent prosecution and portfolio strategy",
            "Excel in trademark clearance and enforcement",
            "Learn trade secret protection and licensing",
            "Understand IP due diligence and valuation",
            "Develop expertise in global IP filing strategies"
        ],
        "tags": ["intellectual-property", "patents", "trademarks", "trade-secrets", "licensing"],
        "request": {
            "subject": "Intellectual Property Portfolio Management Excellence",
            "goal": "I want to master IP portfolio management and strategy. Teach me patent prosecution, trademark clearance, trade secret protection, licensing negotiations, IP due diligence, valuation methods, and global filing strategies. Include enforcement and litigation considerations.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # LEGAL TECHNOLOGY AND PRACTICE MANAGEMENT
    {
        "title": "Legal Technology and AI Implementation",
        "category": "legal",
        "subcategory": "legal-tech",
        "difficulty": "intermediate",
        "target_audience": "Law firm administrators and tech-savvy attorneys",
        "estimated_hours": 40,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Legal practice experience", "Technology familiarity", "Project management"],
        "learning_outcomes": [
            "Master legal AI tools and document automation",
            "Excel in practice management software implementation",
            "Learn cybersecurity and data protection protocols",
            "Understand cloud computing and remote work solutions",
            "Develop expertise in technology vendor evaluation"
        ],
        "tags": ["legal-technology", "ai-tools", "practice-management", "cybersecurity", "automation"],
        "request": {
            "subject": "Legal Technology and AI Implementation Mastery",
            "goal": "I want to master legal technology and AI implementation in law practice. Teach me AI-powered legal tools, document automation, practice management systems, cybersecurity protocols, cloud solutions, and vendor evaluation. Include ROI analysis and change management strategies.",
            "time_value": 4,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Law Firm Business Development and Client Relations",
        "category": "legal",
        "subcategory": "business-development",
        "difficulty": "intermediate",
        "target_audience": "Partners and senior associates seeking business growth",
        "estimated_hours": 45,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.6,
        "prerequisites": ["Legal practice experience", "Client interaction", "Business acumen"],
        "learning_outcomes": [
            "Master client development and relationship management",
            "Excel in legal marketing and networking strategies",
            "Learn proposal writing and pitch presentations",
            "Understand fee structures and billing optimization",
            "Develop expertise in referral network building"
        ],
        "tags": ["business-development", "client-relations", "legal-marketing", "networking", "proposals"],
        "request": {
            "subject": "Law Firm Business Development and Client Relations Excellence",
            "goal": "I want to master law firm business development and client relations. Teach me client development, relationship management, marketing strategies, networking, proposal writing, pitch presentations, fee optimization, and referral building. Include personal branding and thought leadership strategies.",
            "time_value": 5,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # REGULATORY COMPLIANCE AND ETHICS
    {
        "title": "Securities Law Compliance and Disclosure",
        "category": "legal",
        "subcategory": "securities-compliance",
        "difficulty": "advanced",
        "target_audience": "Securities attorneys and compliance professionals",
        "estimated_hours": 65,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Securities law knowledge", "Corporate law", "Regulatory experience"],
        "learning_outcomes": [
            "Master SEC reporting and disclosure requirements",
            "Excel in proxy statement and 10-K preparation",
            "Learn insider trading and Section 16 compliance",
            "Understand Sarbanes-Oxley and corporate governance",
            "Develop expertise in securities offering documentation"
        ],
        "tags": ["securities-law", "sec-compliance", "disclosure", "corporate-governance", "offerings"],
        "request": {
            "subject": "Securities Law Compliance and Disclosure Mastery",
            "goal": "I want to master securities law compliance and disclosure requirements. Teach me SEC reporting, proxy statements, 10-K filings, insider trading rules, Sarbanes-Oxley compliance, corporate governance, and securities offerings. Include practical compliance program development.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Professional Responsibility and Ethics in Practice",
        "category": "legal",
        "subcategory": "professional-ethics",
        "difficulty": "intermediate",
        "target_audience": "All practicing attorneys and law students",
        "estimated_hours": 35,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Legal education", "Professional responsibility course", "Practice awareness"],
        "learning_outcomes": [
            "Master conflict of interest analysis and management",
            "Excel in client confidentiality and privilege issues",
            "Learn fee arrangement ethics and billing practices",
            "Understand advertising and solicitation rules",
            "Develop expertise in professional liability prevention"
        ],
        "tags": ["professional-responsibility", "ethics", "conflicts", "confidentiality", "malpractice"],
        "request": {
            "subject": "Professional Responsibility and Legal Ethics Excellence",
            "goal": "I want to master professional responsibility and legal ethics in practice. Teach me conflict analysis, confidentiality rules, fee ethics, advertising regulations, professional liability prevention, and disciplinary procedures. Include practical decision-making frameworks and real-world scenarios.",
            "time_value": 4,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED SKILLS FOR MODERN PRACTICE
    {
        "title": "Alternative Dispute Resolution and Mediation",
        "category": "legal",
        "subcategory": "adr",
        "difficulty": "intermediate",
        "target_audience": "Attorneys interested in ADR and mediation practice",
        "estimated_hours": 50,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Legal practice experience", "Dispute resolution basics", "Communication skills"],
        "learning_outcomes": [
            "Master mediation techniques and facilitation skills",
            "Excel in arbitration procedures and advocacy",
            "Learn negotiation psychology and strategy",
            "Understand ADR clause drafting and enforcement",
            "Develop expertise in multi-party dispute resolution"
        ],
        "tags": ["adr", "mediation", "arbitration", "negotiation", "dispute-resolution"],
        "request": {
            "subject": "Alternative Dispute Resolution and Mediation Mastery",
            "goal": "I want to master alternative dispute resolution and mediation. Teach me mediation techniques, arbitration procedures, negotiation psychology, ADR clause drafting, and multi-party dispute resolution. Include practical skills for building an ADR practice and certification requirements.",
            "time_value": 5,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Cross-Border Transactions and International Law",
        "category": "legal",
        "subcategory": "international",
        "difficulty": "advanced",
        "target_audience": "International lawyers and cross-border transaction attorneys",
        "estimated_hours": 80,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Corporate law", "International business", "Foreign language helpful"],
        "learning_outcomes": [
            "Master international contract law and choice of law",
            "Excel in cross-border M&A and joint ventures",
            "Learn foreign investment regulations and compliance",
            "Understand international arbitration and dispute resolution",
            "Develop expertise in tax treaty and transfer pricing issues"
        ],
        "tags": ["international-law", "cross-border", "choice-of-law", "foreign-investment", "tax-treaties"],
        "request": {
            "subject": "Cross-Border Transactions and International Law Mastery",
            "goal": "I want to master cross-border transactions and international law. Teach me international contract law, choice of law analysis, cross-border M&A, foreign investment regulations, international arbitration, and tax treaty considerations. Include practical jurisdiction and enforcement issues.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ==============================================================================
    # INDIAN LEGAL PRACTICE ROADMAPS
    # ==============================================================================

    # CONSTITUTIONAL AND FUNDAMENTAL RIGHTS
    {
        "title": "Constitutional Law Litigation and PIL Practice",
        "category": "legal",
        "subcategory": "constitutional-law",
        "difficulty": "advanced",
        "target_audience": "Constitutional lawyers and public interest advocates",
        "estimated_hours": 70,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Constitutional law basics", "Court procedure", "Legal research skills"],
        "learning_outcomes": [
            "Master PIL drafting and constitutional remedy procedures",
            "Excel in fundamental rights jurisprudence and Article 32/226 practice",
            "Learn Supreme Court and High Court constitutional litigation",
            "Understand locus standi, maintainability, and constitutional interpretation",
            "Develop expertise in constitutional bench arguments and precedent analysis"
        ],
        "tags": ["constitutional-law", "pil", "fundamental-rights", "supreme-court", "article-32"],
        "request": {
            "subject": "Constitutional Law Litigation and PIL Mastery",
            "goal": "I want to master constitutional law litigation and PIL practice in India. Teach me PIL drafting, Article 32 and 226 procedures, fundamental rights jurisprudence, Supreme Court practice, constitutional interpretation, and precedent analysis. Include practical pleading techniques and constitutional bench advocacy.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Criminal Law Practice and CRPC Mastery",
        "category": "legal",
        "subcategory": "criminal-law",
        "difficulty": "intermediate",
        "target_audience": "Criminal lawyers and public prosecutors",
        "estimated_hours": 65,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["IPC basics", "CRPC fundamentals", "Evidence Act knowledge"],
        "learning_outcomes": [
            "Master bail applications and anticipatory bail practice",
            "Excel in charge sheet analysis and trial strategy",
            "Learn cross-examination techniques in criminal trials",
            "Understand plea bargaining and compounding procedures",
            "Develop expertise in appellate criminal practice and sentence mitigation"
        ],
        "tags": ["criminal-law", "crpc", "bail-applications", "cross-examination", "criminal-trials"],
        "request": {
            "subject": "Criminal Law Practice and CRPC Excellence",
            "goal": "I want to master criminal law practice and CRPC procedures in India. Teach me bail applications, anticipatory bail, charge sheet analysis, trial strategy, cross-examination, plea bargaining, and appellate practice. Include practical courtroom advocacy and case management skills.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # CORPORATE AND COMMERCIAL LAW
    {
        "title": "Companies Act 2013 Compliance and Corporate Governance",
        "category": "legal",
        "subcategory": "corporate-law",
        "difficulty": "advanced",
        "target_audience": "Corporate lawyers and company secretaries",
        "estimated_hours": 80,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Companies Act basics", "Corporate law", "Secretarial practice"],
        "learning_outcomes": [
            "Master board resolutions, AGM/EGM procedures, and regulatory filings",
            "Excel in NCLT proceedings and corporate restructuring",
            "Learn due diligence for acquisitions and compliance audits",
            "Understand related party transactions and insider trading regulations",
            "Develop expertise in corporate governance and board advisory"
        ],
        "tags": ["companies-act", "nclt", "corporate-governance", "compliance", "board-resolutions"],
        "request": {
            "subject": "Companies Act 2013 and Corporate Governance Mastery",
            "goal": "I want to master Companies Act 2013 compliance and corporate governance. Teach me board procedures, NCLT practice, regulatory filings, due diligence, related party transactions, and corporate restructuring. Include practical compliance strategies and governance advisory skills.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "GST Law and Indirect Tax Practice",
        "category": "legal",
        "subcategory": "tax-law",
        "difficulty": "intermediate",
        "target_audience": "Tax lawyers and GST practitioners",
        "estimated_hours": 60,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Taxation basics", "GST Act knowledge", "Commercial law"],
        "learning_outcomes": [
            "Master GST return filing, input tax credit, and compliance procedures",
            "Excel in GST assessment, audit, and appellate proceedings",
            "Learn place of supply rules and interstate transactions",
            "Understand advance ruling procedures and refund mechanisms",
            "Develop expertise in GST litigation and settlement procedures"
        ],
        "tags": ["gst-law", "indirect-tax", "input-tax-credit", "gst-appellate", "advance-ruling"],
        "request": {
            "subject": "GST Law and Indirect Tax Practice Mastery",
            "goal": "I want to master GST law and indirect tax practice in India. Teach me GST compliance, return filing, input tax credit, assessment procedures, appellate practice, advance rulings, and litigation strategies. Include practical case management and client advisory skills.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED COMMERCIAL PRACTICE
    {
        "title": "Insolvency and Bankruptcy Code (IBC) Practice",
        "category": "legal",
        "subcategory": "insolvency",
        "difficulty": "advanced",
        "target_audience": "Insolvency lawyers and resolution professionals",
        "estimated_hours": 75,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["IBC knowledge", "Corporate law", "NCLT procedure"],
        "learning_outcomes": [
            "Master CIRP initiation and resolution plan preparation",
            "Excel in NCLT/NCLAT practice and creditor representation",
            "Learn liquidation procedures and asset monetization",
            "Understand resolution professional duties and stakeholder management",
            "Develop expertise in cross-border insolvency and group insolvency"
        ],
        "tags": ["ibc", "insolvency", "cirp", "nclt", "resolution-professional"],
        "request": {
            "subject": "Insolvency and Bankruptcy Code (IBC) Mastery",
            "goal": "I want to master IBC practice and insolvency law in India. Teach me CIRP procedures, resolution plans, NCLT practice, liquidation processes, creditor rights, and resolution professional duties. Include practical case management and stakeholder coordination skills.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Real Estate and RERA Compliance Practice",
        "category": "legal",
        "subcategory": "real-estate",
        "difficulty": "intermediate",
        "target_audience": "Real estate lawyers and property developers",
        "estimated_hours": 55,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Property law", "Contract law", "Registration procedures"],
        "learning_outcomes": [
            "Master RERA registration and compliance procedures",
            "Excel in sale deed drafting and title verification",
            "Learn development agreement structuring and joint ventures",
            "Understand land acquisition and approval procedures",
            "Develop expertise in real estate dispute resolution and RERA appellate practice"
        ],
        "tags": ["rera", "real-estate", "property-law", "title-verification", "development-agreements"],
        "request": {
            "subject": "Real Estate and RERA Compliance Mastery",
            "goal": "I want to master real estate law and RERA compliance in India. Teach me RERA procedures, title verification, sale deed drafting, development agreements, land acquisition, and dispute resolution. Include practical due diligence and compliance strategies.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # LITIGATION AND PROCEDURE
    {
        "title": "Civil Procedure Code and Court Practice Mastery",
        "category": "legal",
        "subcategory": "civil-procedure",
        "difficulty": "intermediate",
        "target_audience": "Civil litigation lawyers and court practitioners",
        "estimated_hours": 65,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["CPC basics", "Pleading fundamentals", "Court procedure"],
        "learning_outcomes": [
            "Master plaint drafting, written statement, and interim applications",
            "Excel in examination-in-chief and cross-examination techniques",
            "Learn execution procedures and recovery mechanisms",
            "Understand appeal and revision procedures in civil courts",
            "Develop expertise in summary suit procedures and commercial court practice"
        ],
        "tags": ["cpc", "civil-procedure", "plaint-drafting", "execution", "commercial-courts"],
        "request": {
            "subject": "Civil Procedure Code and Court Practice Excellence",
            "goal": "I want to master CPC and civil court practice in India. Teach me plaint drafting, written statements, interim applications, examination techniques, execution procedures, and appellate practice. Include commercial court procedures and case management strategies.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Arbitration and Alternative Dispute Resolution in India",
        "category": "legal",
        "subcategory": "arbitration",
        "difficulty": "advanced",
        "target_audience": "Arbitration lawyers and commercial dispute specialists",
        "estimated_hours": 70,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Arbitration Act knowledge", "Contract law", "Commercial law"],
        "learning_outcomes": [
            "Master arbitration clause drafting and appointment procedures",
            "Excel in arbitration proceedings and award enforcement",
            "Learn mediation and conciliation under various acts",
            "Understand international commercial arbitration and enforcement",
            "Develop expertise in arbitration-related court proceedings and challenges"
        ],
        "tags": ["arbitration", "adr", "mediation", "award-enforcement", "commercial-disputes"],
        "request": {
            "subject": "Arbitration and ADR Excellence in India",
            "goal": "I want to master arbitration and ADR practice in India. Teach me arbitration procedures, clause drafting, award enforcement, mediation techniques, international arbitration, and court proceedings. Include practical advocacy and case management skills.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # REGULATORY AND COMPLIANCE
    {
        "title": "SEBI Regulations and Securities Law Practice",
        "category": "legal",
        "subcategory": "securities-law",
        "difficulty": "advanced",
        "target_audience": "Securities lawyers and compliance professionals",
        "estimated_hours": 75,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Securities law", "SEBI regulations", "Capital markets"],
        "learning_outcomes": [
            "Master IPO procedures and listing compliance requirements",
            "Excel in insider trading investigations and SEBI proceedings",
            "Learn mutual fund and AIF regulatory compliance",
            "Understand takeover regulations and delisting procedures",
            "Develop expertise in SAT appeals and securities litigation"
        ],
        "tags": ["sebi", "securities-law", "ipo", "insider-trading", "takeover-regulations"],
        "request": {
            "subject": "SEBI Regulations and Securities Law Mastery",
            "goal": "I want to master SEBI regulations and securities law practice in India. Teach me IPO procedures, listing compliance, insider trading rules, mutual fund regulations, takeover procedures, and SAT practice. Include practical compliance strategies and litigation skills.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Labor Law and Industrial Relations Practice",
        "category": "legal",
        "subcategory": "labor-law",
        "difficulty": "intermediate",
        "target_audience": "Labor lawyers and industrial relations specialists",
        "estimated_hours": 60,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Labor law basics", "Industrial law", "Employment regulations"],
        "learning_outcomes": [
            "Master Industrial Disputes Act and labor court proceedings",
            "Excel in trade union matters and collective bargaining",
            "Learn workmen compensation and social security compliance",
            "Understand factory law and safety regulations",
            "Develop expertise in labor tribunal practice and settlement negotiations"
        ],
        "tags": ["labor-law", "industrial-disputes", "trade-unions", "workmen-compensation", "labor-tribunal"],
        "request": {
            "subject": "Labor Law and Industrial Relations Mastery",
            "goal": "I want to master labor law and industrial relations practice in India. Teach me Industrial Disputes Act, labor court procedures, trade union matters, workmen compensation, factory law, and tribunal practice. Include practical negotiation and settlement strategies.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # MODERN LEGAL PRACTICE IN INDIA
    {
        "title": "Legal Technology and Digital Court Practice in India",
        "category": "legal",
        "subcategory": "legal-tech-india",
        "difficulty": "intermediate",
        "target_audience": "Indian lawyers adapting to digital court systems",
        "estimated_hours": 45,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.6,
        "prerequisites": ["Court practice", "Technology familiarity", "E-filing knowledge"],
        "learning_outcomes": [
            "Master e-filing systems across High Courts and Supreme Court",
            "Excel in virtual court proceedings and online advocacy",
            "Learn digital case management and client communication tools",
            "Understand AI tools for legal research and document drafting",
            "Develop expertise in cybersecurity and data protection for law firms"
        ],
        "tags": ["legal-tech-india", "e-filing", "virtual-courts", "digital-advocacy", "ai-legal-research"],
        "request": {
            "subject": "Legal Technology and Digital Court Practice in India",
            "goal": "I want to master legal technology and digital court practice in India. Teach me e-filing systems, virtual court proceedings, digital case management, AI legal research tools, and cybersecurity for law firms. Include practical tips for online advocacy and client management.",
            "time_value": 5,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Cyber Law and IT Act Practice in India",
        "category": "legal",
        "subcategory": "cyber-law",
        "difficulty": "intermediate",
        "target_audience": "Cyber law specialists and technology lawyers",
        "estimated_hours": 55,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["IT Act knowledge", "Technology understanding", "Criminal law basics"],
        "learning_outcomes": [
            "Master cyber crime investigation and digital evidence handling",
            "Excel in data protection and privacy law compliance",
            "Learn e-commerce regulations and digital contract law",
            "Understand blockchain, cryptocurrency, and fintech regulations",
            "Develop expertise in cyber tribunal practice and online dispute resolution"
        ],
        "tags": ["cyber-law", "it-act", "data-protection", "digital-evidence", "fintech-regulations"],
        "request": {
            "subject": "Cyber Law and IT Act Practice Mastery",
            "goal": "I want to master cyber law and IT Act practice in India. Teach me cyber crime procedures, digital evidence, data protection compliance, e-commerce regulations, fintech law, and cyber tribunal practice. Include practical investigation techniques and technology law advisory skills.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED INDIAN PRACTICE AREAS
    {
        "title": "Family Law and Personal Laws Practice in India",
        "category": "legal",
        "subcategory": "family-law",
        "difficulty": "intermediate",
        "target_audience": "Family court lawyers and matrimonial law specialists",
        "estimated_hours": 50,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Personal laws knowledge", "Family court procedure", "Mediation skills"],
        "learning_outcomes": [
            "Master divorce proceedings under various personal laws",
            "Excel in maintenance and custody dispute resolution",
            "Learn domestic violence protection and family court advocacy",
            "Understand adoption procedures and guardianship laws",
            "Develop expertise in family mediation and counseling integration"
        ],
        "tags": ["family-law", "personal-laws", "divorce-proceedings", "custody-disputes", "family-mediation"],
        "request": {
            "subject": "Family Law and Personal Laws Practice Excellence",
            "goal": "I want to master family law and personal laws practice in India. Teach me divorce procedures, maintenance laws, custody disputes, domestic violence protection, adoption procedures, and family mediation. Include practical courtroom advocacy and client counseling skills.",
            "time_value": 5,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Environmental Law and NGT Practice in India",
        "category": "legal",
        "subcategory": "environmental-law",
        "difficulty": "intermediate",
        "target_audience": "Environmental lawyers and green compliance specialists",
        "estimated_hours": 60,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Environmental law basics", "Administrative law", "Public interest litigation"],
        "learning_outcomes": [
            "Master environmental clearance and compliance procedures",
            "Excel in NGT proceedings and environmental litigation",
            "Learn pollution control and waste management regulations",
            "Understand forest law and wildlife protection regulations",
            "Develop expertise in environmental impact assessment and green tribunal advocacy"
        ],
        "tags": ["environmental-law", "ngt", "environmental-clearance", "pollution-control", "forest-law"],
        "request": {
            "subject": "Environmental Law and NGT Practice Mastery",
            "goal": "I want to master environmental law and NGT practice in India. Teach me environmental clearances, NGT procedures, pollution control laws, forest regulations, EIA processes, and green tribunal advocacy. Include practical compliance strategies and environmental litigation skills.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ==============================================================================
    # NICHE INDIAN LEGAL SPECIALIZATIONS
    # ==============================================================================

    # SPECIALIZED TRIBUNALS AND REGULATORY BODIES
    {
        "title": "Income Tax and ITAT Practice Mastery",
        "category": "legal",
        "subcategory": "tax-tribunal",
        "difficulty": "advanced",
        "target_audience": "Tax lawyers and chartered accountants in litigation",
        "estimated_hours": 70,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Income Tax Act knowledge", "Tax planning", "Appellate procedure"],
        "learning_outcomes": [
            "Master ITAT proceedings and appeal drafting techniques",
            "Excel in assessment order challenges and penalty proceedings",
            "Learn search and seizure case representation",
            "Understand international taxation and transfer pricing disputes",
            "Develop expertise in advance ruling procedures and settlement commission"
        ],
        "tags": ["income-tax", "itat", "assessment-orders", "transfer-pricing", "advance-ruling"],
        "request": {
            "subject": "Income Tax and ITAT Practice Excellence",
            "goal": "I want to master income tax litigation and ITAT practice in India. Teach me ITAT procedures, appeal drafting, assessment challenges, search and seizure cases, transfer pricing disputes, and advance ruling applications. Include practical advocacy and case strategy development.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "PMLA and ED Investigation Defense",
        "category": "legal",
        "subcategory": "financial-crimes",
        "difficulty": "advanced",
        "target_audience": "White-collar crime lawyers and ED investigation specialists",
        "estimated_hours": 65,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["PMLA knowledge", "Criminal law", "Financial regulations"],
        "learning_outcomes": [
            "Master PMLA proceedings and provisional attachment challenges",
            "Excel in ED investigation representation and ECIR responses",
            "Learn money laundering case defense strategies",
            "Understand SAFEMA and asset forfeiture proceedings",
            "Develop expertise in international mutual legal assistance (MLAT) cases"
        ],
        "tags": ["pmla", "enforcement-directorate", "money-laundering", "provisional-attachment", "mlat"],
        "request": {
            "subject": "PMLA and ED Investigation Defense Mastery",
            "goal": "I want to master PMLA defense and ED investigation representation. Teach me PMLA procedures, provisional attachment challenges, ED investigation tactics, money laundering defense, SAFEMA proceedings, and MLAT cases. Include practical investigation response and defense strategies.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Competition Law and CCI Practice",
        "category": "legal",
        "subcategory": "competition-law",
        "difficulty": "advanced",
        "target_audience": "Competition lawyers and antitrust specialists",
        "estimated_hours": 60,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Competition Act knowledge", "Economics understanding", "Corporate law"],
        "learning_outcomes": [
            "Master CCI investigation procedures and leniency applications",
            "Excel in merger notification and combination approvals",
            "Learn dominant position abuse and cartel investigation defense",
            "Understand market definition and economic analysis",
            "Develop expertise in NCLAT appeals and settlement procedures"
        ],
        "tags": ["competition-law", "cci", "merger-control", "cartel-defense", "leniency"],
        "request": {
            "subject": "Competition Law and CCI Practice Excellence",
            "goal": "I want to master competition law and CCI practice in India. Teach me CCI procedures, merger notifications, cartel investigations, leniency applications, dominance cases, and NCLAT appeals. Include economic analysis and practical advocacy strategies.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # EMERGING TECHNOLOGY AND FINTECH
    {
        "title": "Cryptocurrency and Digital Assets Law in India",
        "category": "legal",
        "subcategory": "crypto-law",
        "difficulty": "advanced",
        "target_audience": "Fintech lawyers and cryptocurrency compliance specialists",
        "estimated_hours": 55,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["IT Act knowledge", "Financial regulations", "Blockchain understanding"],
        "learning_outcomes": [
            "Master cryptocurrency taxation and TDS compliance",
            "Excel in digital asset exchange regulatory requirements",
            "Learn blockchain technology legal frameworks",
            "Understand RBI guidelines and banking restrictions",
            "Develop expertise in ICO/STO regulatory compliance and enforcement"
        ],
        "tags": ["cryptocurrency", "blockchain", "digital-assets", "rbi-guidelines", "fintech-compliance"],
        "request": {
            "subject": "Cryptocurrency and Digital Assets Law Mastery",
            "goal": "I want to master cryptocurrency and digital assets law in India. Teach me crypto taxation, TDS compliance, exchange regulations, blockchain legal frameworks, RBI guidelines, ICO regulations, and enforcement issues. Include practical compliance strategies for fintech businesses.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Data Protection and Privacy Law (DPDP Act) Practice",
        "category": "legal",
        "subcategory": "data-protection",
        "difficulty": "intermediate",
        "target_audience": "Privacy lawyers and data protection officers",
        "estimated_hours": 50,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["IT Act knowledge", "DPDP Act familiarity", "Technology understanding"],
        "learning_outcomes": [
            "Master DPDP Act compliance and consent management",
            "Excel in data breach notification and penalty defense",
            "Learn cross-border data transfer regulations",
            "Understand data protection impact assessments",
            "Develop expertise in DPA proceedings and appellate practice"
        ],
        "tags": ["dpdp-act", "data-protection", "privacy-law", "consent-management", "data-breach"],
        "request": {
            "subject": "Data Protection and Privacy Law (DPDP Act) Excellence",
            "goal": "I want to master data protection and privacy law under DPDP Act. Teach me compliance requirements, consent management, breach notifications, cross-border transfers, impact assessments, and DPA proceedings. Include practical implementation for businesses and defense strategies.",
            "time_value": 5,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SECTOR-SPECIFIC SPECIALIZATIONS
    {
        "title": "Banking and Financial Services Regulation",
        "category": "legal",
        "subcategory": "banking-law",
        "difficulty": "advanced",
        "target_audience": "Banking lawyers and financial services compliance professionals",
        "estimated_hours": 75,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Banking law", "RBI regulations", "Financial markets knowledge"],
        "learning_outcomes": [
            "Master RBI compliance and banking license procedures",
            "Excel in NBFC regulations and fintech compliance",
            "Learn loan recovery and SARFAESI Act proceedings",
            "Understand payment system regulations and UPI compliance",
            "Develop expertise in banking ombudsman and RBI enforcement actions"
        ],
        "tags": ["banking-law", "rbi-compliance", "sarfaesi", "nbfc", "payment-systems"],
        "request": {
            "subject": "Banking and Financial Services Regulation Mastery",
            "goal": "I want to master banking and financial services regulation in India. Teach me RBI compliance, banking licenses, NBFC regulations, SARFAESI proceedings, payment systems, fintech compliance, and enforcement defense. Include practical regulatory strategy and compliance implementation.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Aviation Law and DGCA Compliance",
        "category": "legal",
        "subcategory": "aviation-law",
        "difficulty": "intermediate",
        "target_audience": "Aviation lawyers and airline compliance professionals",
        "estimated_hours": 45,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.5,
        "prerequisites": ["Aviation regulations", "Contract law", "International law"],
        "learning_outcomes": [
            "Master DGCA licensing and aircraft registration procedures",
            "Excel in airline operational compliance and safety regulations",
            "Learn aircraft leasing and financing structures",
            "Understand passenger rights and aviation consumer protection",
            "Develop expertise in aviation accident investigation and liability"
        ],
        "tags": ["aviation-law", "dgca", "aircraft-leasing", "passenger-rights", "aviation-safety"],
        "request": {
            "subject": "Aviation Law and DGCA Compliance Excellence",
            "goal": "I want to master aviation law and DGCA compliance in India. Teach me DGCA procedures, aircraft registration, operational compliance, leasing structures, passenger rights, safety regulations, and accident investigation. Include practical aviation business advisory skills.",
            "time_value": 5,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Pharmaceutical and Drug Regulatory Law",
        "category": "legal",
        "subcategory": "pharma-law",
        "difficulty": "intermediate",
        "target_audience": "Pharmaceutical lawyers and regulatory affairs professionals",
        "estimated_hours": 55,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Drug regulations", "IP law", "Healthcare law"],
        "learning_outcomes": [
            "Master drug licensing and CDSCO approval procedures",
            "Excel in clinical trial regulations and ethics committee compliance",
            "Learn pharmaceutical patent challenges and ANDA filings",
            "Understand price control and DPCO compliance",
            "Develop expertise in drug recall procedures and regulatory enforcement"
        ],
        "tags": ["pharmaceutical-law", "cdsco", "clinical-trials", "drug-pricing", "patent-challenges"],
        "request": {
            "subject": "Pharmaceutical and Drug Regulatory Law Mastery",
            "goal": "I want to master pharmaceutical and drug regulatory law in India. Teach me CDSCO procedures, drug licensing, clinical trial regulations, patent challenges, price control, DPCO compliance, and enforcement defense. Include practical regulatory strategy for pharmaceutical companies.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED ENFORCEMENT AND RECOVERY
    {
        "title": "SARFAESI and Asset Reconstruction Practice",
        "category": "legal",
        "subcategory": "asset-recovery",
        "difficulty": "advanced",
        "target_audience": "Recovery lawyers and asset reconstruction specialists",
        "estimated_hours": 60,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["SARFAESI Act", "Banking law", "Security interest"],
        "learning_outcomes": [
            "Master SARFAESI notice procedures and enforcement mechanisms",
            "Excel in DRT proceedings and asset reconstruction company operations",
            "Learn security interest creation and perfection",
            "Understand asset reconstruction and securitization transactions",
            "Develop expertise in borrower defense and settlement negotiations"
        ],
        "tags": ["sarfaesi", "drt", "asset-reconstruction", "security-interest", "loan-recovery"],
        "request": {
            "subject": "SARFAESI and Asset Reconstruction Excellence",
            "goal": "I want to master SARFAESI and asset reconstruction practice. Teach me SARFAESI procedures, DRT practice, security interest enforcement, ARC operations, securitization transactions, and borrower defense strategies. Include practical recovery and restructuring techniques.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Customs and Foreign Trade Policy Practice",
        "category": "legal",
        "subcategory": "customs-law",
        "difficulty": "intermediate",
        "target_audience": "Customs lawyers and international trade specialists",
        "estimated_hours": 65,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Customs Act", "EXIM policy", "International trade"],
        "learning_outcomes": [
            "Master customs valuation and classification disputes",
            "Excel in CESTAT proceedings and customs appeal practice",
            "Learn export-import policy compliance and licensing",
            "Understand advance authorization and duty drawback schemes",
            "Develop expertise in customs audit defense and settlement procedures"
        ],
        "tags": ["customs-law", "cestat", "exim-policy", "customs-valuation", "duty-drawback"],
        "request": {
            "subject": "Customs and Foreign Trade Policy Excellence",
            "goal": "I want to master customs and foreign trade policy practice. Teach me customs procedures, CESTAT appeals, valuation disputes, EXIM policy compliance, licensing requirements, and audit defense. Include practical international trade advisory and compliance strategies.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # NICHE REGULATORY COMPLIANCE
    {
        "title": "FEMA and Foreign Exchange Compliance",
        "category": "legal",
        "subcategory": "fema-compliance",
        "difficulty": "advanced",
        "target_audience": "FEMA lawyers and foreign investment specialists",
        "estimated_hours": 55,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["FEMA knowledge", "Foreign investment", "RBI regulations"],
        "learning_outcomes": [
            "Master FDI compliance and FIPB/DPIIT approval procedures",
            "Excel in ECB regulations and external borrowing compliance",
            "Learn ODI procedures and overseas investment structures",
            "Understand FEMA violation defense and penalty proceedings",
            "Develop expertise in foreign exchange derivative transactions"
        ],
        "tags": ["fema", "fdi-compliance", "ecb", "odi", "foreign-exchange"],
        "request": {
            "subject": "FEMA and Foreign Exchange Compliance Mastery",
            "goal": "I want to master FEMA and foreign exchange compliance. Teach me FDI procedures, ECB regulations, ODI compliance, FEMA violation defense, derivative transactions, and RBI enforcement. Include practical foreign investment structuring and compliance strategies.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Cooperative Law and Society Registration Practice",
        "category": "legal",
        "subcategory": "cooperative-law",
        "difficulty": "intermediate",
        "target_audience": "Cooperative lawyers and society formation specialists",
        "estimated_hours": 40,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.4,
        "prerequisites": ["Cooperative law", "Society formation", "Governance"],
        "learning_outcomes": [
            "Master cooperative society registration and amendment procedures",
            "Excel in housing society legal compliance and dispute resolution",
            "Learn multi-state cooperative society formation and operations",
            "Understand cooperative bank licensing and RBI compliance",
            "Develop expertise in society dissolution and asset distribution"
        ],
        "tags": ["cooperative-law", "housing-societies", "multi-state-cooperative", "cooperative-banks", "society-registration"],
        "request": {
            "subject": "Cooperative Law and Society Registration Excellence",
            "goal": "I want to master cooperative law and society registration practice. Teach me society formation, housing society compliance, multi-state cooperatives, cooperative banking, dispute resolution, and dissolution procedures. Include practical governance and legal advisory for cooperative institutions.",
            "time_value": 4,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # EMERGING PRACTICE AREAS
    {
        "title": "ESG Compliance and Sustainability Law",
        "category": "legal",
        "subcategory": "esg-compliance",
        "difficulty": "intermediate",
        "target_audience": "ESG lawyers and sustainability compliance professionals",
        "estimated_hours": 50,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.6,
        "prerequisites": ["Corporate law", "Environmental law", "Securities regulations"],
        "learning_outcomes": [
            "Master ESG reporting and disclosure requirements",
            "Excel in sustainability-linked financing and green bonds",
            "Learn carbon credit trading and renewable energy compliance",
            "Understand social impact assessment and stakeholder engagement",
            "Develop expertise in ESG due diligence and risk assessment"
        ],
        "tags": ["esg-compliance", "sustainability", "green-bonds", "carbon-credits", "social-impact"],
        "request": {
            "subject": "ESG Compliance and Sustainability Law Excellence",
            "goal": "I want to master ESG compliance and sustainability law in India. Teach me ESG reporting, disclosure requirements, green financing, carbon trading, renewable energy compliance, and social impact assessment. Include practical ESG advisory and implementation strategies for businesses.",
            "time_value": 5,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Gaming and Gambling Law Compliance",
        "category": "legal",
        "subcategory": "gaming-law",
        "difficulty": "intermediate",
        "target_audience": "Gaming lawyers and online betting compliance specialists",
        "estimated_hours": 45,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.3,
        "prerequisites": ["Criminal law", "State gambling laws", "IT regulations"],
        "learning_outcomes": [
            "Master online gaming regulations and state law compliance",
            "Excel in skill vs. chance game classification",
            "Learn fantasy sports and rummy legal frameworks",
            "Understand advertising regulations and responsible gaming",
            "Develop expertise in gaming license applications and enforcement defense"
        ],
        "tags": ["gaming-law", "online-gambling", "fantasy-sports", "skill-games", "gaming-licenses"],
        "request": {
            "subject": "Gaming and Gambling Law Compliance Mastery",
            "goal": "I want to master gaming and gambling law compliance in India. Teach me online gaming regulations, skill vs. chance classification, fantasy sports compliance, state licensing requirements, advertising regulations, and enforcement defense. Include practical compliance strategies for gaming businesses.",
            "time_value": 5,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ==============================================================================
    # USA LEGAL PRACTICE SPECIALIZATIONS
    # ==============================================================================

    # FEDERAL PRACTICE AND REGULATORY AGENCIES
    {
        "title": "Federal Court Practice and Appellate Advocacy",
        "category": "legal",
        "subcategory": "federal-practice",
        "difficulty": "advanced",
        "target_audience": "Federal practitioners and appellate attorneys",
        "estimated_hours": 70,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Federal Rules of Civil Procedure", "Constitutional law", "Appellate procedure"],
        "learning_outcomes": [
            "Master federal court jurisdiction and removal procedures",
            "Excel in circuit court brief writing and oral argument",
            "Learn Supreme Court petition practice and merits briefing",
            "Understand federal sentencing guidelines and criminal appeals",
            "Develop expertise in emergency relief and injunctive practice"
        ],
        "tags": ["federal-courts", "appellate-practice", "supreme-court", "circuit-courts", "federal-jurisdiction"],
        "request": {
            "subject": "Federal Court Practice and Appellate Advocacy Mastery",
            "goal": "I want to master federal court practice and appellate advocacy in the US. Teach me federal jurisdiction, removal procedures, circuit court practice, Supreme Court petitions, appellate brief writing, oral argument techniques, and emergency relief. Include practical federal litigation strategy and appellate advocacy skills.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "SEC Enforcement Defense and Securities Litigation",
        "category": "legal",
        "subcategory": "sec-enforcement",
        "difficulty": "advanced",
        "target_audience": "Securities defense lawyers and white-collar specialists",
        "estimated_hours": 75,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Securities law", "Federal procedure", "White-collar defense"],
        "learning_outcomes": [
            "Master SEC investigation response and Wells submission strategies",
            "Excel in insider trading and market manipulation defense",
            "Learn disclosure violations and accounting fraud representation",
            "Understand parallel proceedings coordination and privilege issues",
            "Develop expertise in settlement negotiations and administrative proceedings"
        ],
        "tags": ["sec-enforcement", "securities-litigation", "wells-submissions", "insider-trading", "market-manipulation"],
        "request": {
            "subject": "SEC Enforcement Defense and Securities Litigation Excellence",
            "goal": "I want to master SEC enforcement defense and securities litigation. Teach me SEC investigation procedures, Wells submissions, insider trading defense, disclosure violations, parallel proceedings, settlement strategies, and administrative hearings. Include practical white-collar defense and client counseling techniques.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "FDA Regulatory Practice and Healthcare Law",
        "category": "legal",
        "subcategory": "fda-regulatory",
        "difficulty": "advanced",
        "target_audience": "FDA lawyers and healthcare regulatory specialists",
        "estimated_hours": 65,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Administrative law", "Healthcare regulations", "FDA procedures"],
        "learning_outcomes": [
            "Master drug approval processes and 510(k) medical device submissions",
            "Excel in FDA inspection response and warning letter defense",
            "Learn clinical trial regulations and IRB compliance",
            "Understand food safety regulations and dietary supplement law",
            "Develop expertise in FDA enforcement actions and consent decrees"
        ],
        "tags": ["fda-regulatory", "drug-approval", "medical-devices", "clinical-trials", "fda-enforcement"],
        "request": {
            "subject": "FDA Regulatory Practice and Healthcare Law Mastery",
            "goal": "I want to master FDA regulatory practice and healthcare law. Teach me drug approval processes, medical device submissions, FDA inspections, warning letter responses, clinical trial regulations, food safety law, and enforcement defense. Include practical regulatory strategy and compliance implementation.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED LITIGATION AND DISPUTE RESOLUTION
    {
        "title": "Class Action Litigation and Mass Tort Practice",
        "category": "legal",
        "subcategory": "class-action",
        "difficulty": "advanced",
        "target_audience": "Class action lawyers and mass tort specialists",
        "estimated_hours": 80,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Complex litigation", "Federal procedure", "Trial advocacy"],
        "learning_outcomes": [
            "Master Rule 23 class certification and notice requirements",
            "Excel in MDL proceedings and bellwether trial strategy",
            "Learn settlement class administration and distribution",
            "Understand opt-out procedures and objector practice",
            "Develop expertise in fee award litigation and court approval processes"
        ],
        "tags": ["class-action", "mass-tort", "rule-23", "mdl", "bellwether-trials"],
        "request": {
            "subject": "Class Action Litigation and Mass Tort Excellence",
            "goal": "I want to master class action litigation and mass tort practice. Teach me Rule 23 certification, MDL procedures, bellwether trials, settlement administration, opt-out processes, fee litigation, and court approval mechanisms. Include practical case management and trial strategy for complex litigation.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Patent Litigation and PTAB Proceedings",
        "category": "legal",
        "subcategory": "patent-litigation",
        "difficulty": "advanced",
        "target_audience": "Patent litigators and IP trial specialists",
        "estimated_hours": 70,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Patent law", "Federal court procedure", "Technical background helpful"],
        "learning_outcomes": [
            "Master Markman hearings and claim construction strategy",
            "Excel in IPR and PGR proceedings before PTAB",
            "Learn invalidity and non-infringement defense strategies",
            "Understand damages calculations and reasonable royalty analysis",
            "Develop expertise in ITC Section 337 investigations"
        ],
        "tags": ["patent-litigation", "ptab", "markman-hearings", "ipr", "itc-337"],
        "request": {
            "subject": "Patent Litigation and PTAB Proceedings Mastery",
            "goal": "I want to master patent litigation and PTAB proceedings. Teach me claim construction, Markman hearings, IPR/PGR practice, invalidity defenses, damages analysis, ITC investigations, and PTAB advocacy. Include practical patent trial strategy and technical case management.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # REGULATORY COMPLIANCE AND ENFORCEMENT
    {
        "title": "FCPA and International Anti-Corruption Compliance",
        "category": "legal",
        "subcategory": "fcpa-compliance",
        "difficulty": "advanced",
        "target_audience": "FCPA lawyers and international compliance specialists",
        "estimated_hours": 60,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["White-collar defense", "International law", "Compliance programs"],
        "learning_outcomes": [
            "Master FCPA investigation response and DOJ cooperation",
            "Excel in due diligence for international acquisitions",
            "Learn third-party risk assessment and vendor compliance",
            "Understand voluntary disclosure strategies and settlement negotiations",
            "Develop expertise in compliance program design and monitoring"
        ],
        "tags": ["fcpa", "anti-corruption", "doj-cooperation", "international-compliance", "third-party-risk"],
        "request": {
            "subject": "FCPA and International Anti-Corruption Excellence",
            "goal": "I want to master FCPA and international anti-corruption compliance. Teach me FCPA investigations, DOJ cooperation, due diligence procedures, third-party risk management, voluntary disclosure, settlement strategies, and compliance program design. Include practical international business advisory skills.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "OFAC Sanctions and Export Controls Practice",
        "category": "legal",
        "subcategory": "sanctions-export",
        "difficulty": "advanced",
        "target_audience": "Sanctions lawyers and export control specialists",
        "estimated_hours": 65,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["International trade law", "National security law", "Regulatory compliance"],
        "learning_outcomes": [
            "Master OFAC sanctions programs and blocking procedures",
            "Excel in EAR and ITAR licensing and compliance",
            "Learn voluntary self-disclosure and penalty mitigation",
            "Understand interdiction procedures and enforcement actions",
            "Develop expertise in sanctions due diligence and screening systems"
        ],
        "tags": ["ofac-sanctions", "export-controls", "ear", "itar", "voluntary-disclosure"],
        "request": {
            "subject": "OFAC Sanctions and Export Controls Mastery",
            "goal": "I want to master OFAC sanctions and export controls practice. Teach me sanctions programs, blocking procedures, EAR/ITAR compliance, licensing requirements, voluntary disclosure, penalty mitigation, and screening systems. Include practical international trade compliance and enforcement defense.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # EMERGING TECHNOLOGY AND FINTECH
    {
        "title": "Cryptocurrency and Digital Assets Regulation (US)",
        "category": "legal",
        "subcategory": "crypto-regulation-us",
        "difficulty": "advanced",
        "target_audience": "Fintech lawyers and digital asset specialists",
        "estimated_hours": 60,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Securities law", "Banking regulations", "Technology understanding"],
        "learning_outcomes": [
            "Master SEC and CFTC cryptocurrency enforcement and guidance",
            "Excel in digital asset securities analysis and Howey test application",
            "Learn stablecoin regulations and banking charter requirements",
            "Understand DeFi protocols and smart contract legal issues",
            "Develop expertise in cryptocurrency exchange compliance and licensing"
        ],
        "tags": ["cryptocurrency-us", "sec-guidance", "howey-test", "stablecoins", "defi-protocols"],
        "request": {
            "subject": "Cryptocurrency and Digital Assets Regulation (US) Excellence",
            "goal": "I want to master cryptocurrency and digital assets regulation in the US. Teach me SEC/CFTC guidance, securities analysis, Howey test application, stablecoin regulations, DeFi protocols, exchange licensing, and enforcement defense. Include practical fintech compliance and regulatory strategy.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "AI and Technology Law Practice",
        "category": "legal",
        "subcategory": "ai-technology-law",
        "difficulty": "intermediate",
        "target_audience": "Technology lawyers and AI governance specialists",
        "estimated_hours": 55,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.6,
        "prerequisites": ["Technology contracts", "IP law", "Data privacy"],
        "learning_outcomes": [
            "Master AI bias auditing and algorithmic accountability requirements",
            "Excel in machine learning IP protection and trade secret strategies",
            "Learn autonomous systems liability and regulatory frameworks",
            "Understand AI ethics compliance and governance frameworks",
            "Develop expertise in AI contract drafting and risk allocation"
        ],
        "tags": ["ai-law", "algorithmic-accountability", "machine-learning-ip", "autonomous-systems", "ai-ethics"],
        "request": {
            "subject": "AI and Technology Law Practice Excellence",
            "goal": "I want to master AI and technology law practice. Teach me AI bias auditing, algorithmic accountability, ML IP protection, autonomous systems liability, AI ethics compliance, and technology contract drafting. Include practical AI governance and risk management strategies.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED BUSINESS AND CORPORATE TRANSACTIONS
    {
        "title": "Private Equity and Venture Capital Transactions",
        "category": "legal",
        "subcategory": "pe-vc-transactions",
        "difficulty": "advanced",
        "target_audience": "Corporate lawyers and investment fund specialists",
        "estimated_hours": 75,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Corporate law", "Securities regulations", "M&A experience"],
        "learning_outcomes": [
            "Master fund formation and LP/GP agreement negotiation",
            "Excel in Series A through growth equity transaction structuring",
            "Learn management buyout and leveraged buyout documentation",
            "Understand carried interest taxation and ERISA compliance",
            "Develop expertise in portfolio company governance and exit strategies"
        ],
        "tags": ["private-equity", "venture-capital", "fund-formation", "lbo", "carried-interest"],
        "request": {
            "subject": "Private Equity and Venture Capital Transactions Excellence",
            "goal": "I want to master private equity and venture capital transactions. Teach me fund formation, LP/GP agreements, Series A-growth equity deals, LBO structuring, carried interest taxation, ERISA compliance, and exit strategies. Include practical investment fund legal advisory and transaction management.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "SPAC Transactions and Public Company Practice",
        "category": "legal",
        "subcategory": "spac-transactions",
        "difficulty": "advanced",
        "target_audience": "Capital markets lawyers and public company specialists",
        "estimated_hours": 65,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Securities law", "Public offerings", "M&A"],
        "learning_outcomes": [
            "Master SPAC IPO process and sponsor arrangement structuring",
            "Excel in de-SPAC transaction negotiation and shareholder approval",
            "Learn PIPE financing and backstop arrangements",
            "Understand earnout structures and working capital adjustments",
            "Develop expertise in proxy/registration statement drafting and SEC comments"
        ],
        "tags": ["spac-transactions", "de-spac", "pipe-financing", "earnout-structures", "sec-comments"],
        "request": {
            "subject": "SPAC Transactions and Public Company Practice Excellence",
            "goal": "I want to master SPAC transactions and public company practice. Teach me SPAC IPOs, sponsor structures, de-SPAC negotiations, PIPE financing, earnout arrangements, proxy statements, and SEC comment responses. Include practical capital markets and public company advisory skills.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED ENFORCEMENT AND INVESTIGATIONS
    {
        "title": "DOJ Criminal Tax and Financial Crimes Defense",
        "category": "legal",
        "subcategory": "criminal-tax-defense",
        "difficulty": "advanced",
        "target_audience": "White-collar defense lawyers and tax crime specialists",
        "estimated_hours": 70,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Criminal law", "Tax law", "Federal procedure"],
        "learning_outcomes": [
            "Master tax evasion and fraud investigation defense strategies",
            "Excel in grand jury practice and cooperation negotiations",
            "Learn FBAR and offshore account disclosure defense",
            "Understand sentencing guidelines and downward departure arguments",
            "Develop expertise in parallel civil and criminal tax proceedings"
        ],
        "tags": ["criminal-tax", "tax-evasion", "fbar", "grand-jury", "sentencing-guidelines"],
        "request": {
            "subject": "DOJ Criminal Tax and Financial Crimes Defense Excellence",
            "goal": "I want to master DOJ criminal tax and financial crimes defense. Teach me tax evasion defense, grand jury practice, FBAR violations, cooperation strategies, sentencing arguments, and parallel proceedings. Include practical white-collar defense and client counseling in tax crime cases.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Employment Law Compliance and Workplace Investigations",
        "category": "legal",
        "subcategory": "employment-compliance-us",
        "difficulty": "intermediate",
        "target_audience": "Employment lawyers and HR legal counsel",
        "estimated_hours": 60,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Employment law", "Federal regulations", "Investigation techniques"],
        "learning_outcomes": [
            "Master EEOC investigation response and position statements",
            "Excel in workplace harassment and discrimination investigations",
            "Learn wage and hour class action defense and DOL audits",
            "Understand NLRA compliance and union avoidance strategies",
            "Develop expertise in executive compensation and severance negotiations"
        ],
        "tags": ["employment-compliance", "eeoc-investigations", "workplace-harassment", "wage-hour", "nlra-compliance"],
        "request": {
            "subject": "Employment Law Compliance and Workplace Investigations Excellence",
            "goal": "I want to master employment law compliance and workplace investigations. Teach me EEOC responses, harassment investigations, wage and hour defense, DOL audits, NLRA compliance, and executive compensation. Include practical workplace investigation techniques and compliance program development.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # NICHE REGULATORY PRACTICE AREAS
    {
        "title": "Environmental Law and Superfund Litigation",
        "category": "legal",
        "subcategory": "environmental-superfund",
        "difficulty": "advanced",
        "target_audience": "Environmental lawyers and Superfund specialists",
        "estimated_hours": 65,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Environmental law", "Administrative law", "Complex litigation"],
        "learning_outcomes": [
            "Master CERCLA liability allocation and contribution claims",
            "Excel in EPA enforcement defense and consent decree negotiation",
            "Learn RCRA corrective action and permit compliance",
            "Understand natural resource damages and restoration planning",
            "Develop expertise in environmental due diligence and transaction support"
        ],
        "tags": ["environmental-law", "superfund", "cercla", "epa-enforcement", "natural-resource-damages"],
        "request": {
            "subject": "Environmental Law and Superfund Litigation Excellence",
            "goal": "I want to master environmental law and Superfund litigation. Teach me CERCLA liability, EPA enforcement defense, consent decrees, RCRA compliance, natural resource damages, and environmental due diligence. Include practical environmental litigation and regulatory compliance strategies.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Healthcare Fraud and Stark Law Compliance",
        "category": "legal",
        "subcategory": "healthcare-fraud",
        "difficulty": "advanced",
        "target_audience": "Healthcare lawyers and compliance specialists",
        "estimated_hours": 70,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Healthcare law", "False Claims Act", "Compliance programs"],
        "learning_outcomes": [
            "Master Stark Law and Anti-Kickback Statute compliance analysis",
            "Excel in False Claims Act investigation defense and qui tam litigation",
            "Learn OIG exclusion defense and corporate integrity agreements",
            "Understand Medicare/Medicaid billing compliance and audits",
            "Develop expertise in healthcare M&A regulatory due diligence"
        ],
        "tags": ["healthcare-fraud", "stark-law", "false-claims-act", "oig-exclusion", "medicare-compliance"],
        "request": {
            "subject": "Healthcare Fraud and Stark Law Compliance Excellence",
            "goal": "I want to master healthcare fraud and Stark Law compliance. Teach me Stark/AKS analysis, False Claims Act defense, qui tam litigation, OIG exclusions, Medicare audits, and healthcare M&A due diligence. Include practical healthcare compliance and fraud defense strategies.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ==============================================================================
    # NICHE PROFESSIONAL CERTIFICATIONS
    # ==============================================================================

    # SPECIALIZED IT AND CYBERSECURITY CERTIFICATIONS
    {
        "title": "SANS GIAC Security Expert (GSE) Certification",
        "category": "competitive-exams",
        "subcategory": "cybersecurity-advanced",
        "difficulty": "expert",
        "target_audience": "Elite cybersecurity professionals and security architects",
        "estimated_hours": 400,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["Multiple GIAC certifications", "5+ years security experience", "Advanced technical skills"],
        "learning_outcomes": [
            "Master advanced penetration testing and red team operations",
            "Excel in digital forensics and incident response leadership",
            "Learn security architecture design and threat modeling",
            "Understand advanced malware analysis and reverse engineering",
            "Develop expertise in security program management and strategic planning"
        ],
        "tags": ["gse", "sans", "elite-cybersecurity", "penetration-testing", "digital-forensics"],
        "request": {
            "subject": "SANS GIAC Security Expert (GSE) Mastery",
            "goal": "I want to achieve the elite SANS GSE certification. Teach me advanced penetration testing, red team operations, digital forensics, incident response, security architecture, threat modeling, malware analysis, and security program management. Include hands-on labs and practical security leadership skills.",
            "time_value": 40,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Certified Information Systems Auditor (CISA) Excellence",
        "category": "competitive-exams",
        "subcategory": "information-audit",
        "difficulty": "advanced",
        "target_audience": "IT auditors and information assurance professionals",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["IT experience", "Audit fundamentals", "Risk management knowledge"],
        "learning_outcomes": [
            "Master information systems audit processes and methodologies",
            "Excel in IT governance and risk assessment frameworks",
            "Learn business continuity and disaster recovery auditing",
            "Understand regulatory compliance and control testing",
            "Develop expertise in audit report writing and stakeholder communication"
        ],
        "tags": ["cisa", "it-audit", "governance", "risk-assessment", "compliance"],
        "request": {
            "subject": "CISA Certification Excellence",
            "goal": "I want to master CISA certification for information systems auditing. Teach me audit processes, IT governance, risk assessment, control testing, compliance frameworks, business continuity, and audit reporting. Include practical auditing techniques and professional audit management skills.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Certified Cloud Security Professional (CCSP) Mastery",
        "category": "competitive-exams",
        "subcategory": "cloud-security",
        "difficulty": "advanced",
        "target_audience": "Cloud security architects and engineers",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Cloud computing experience", "Security fundamentals", "CISSP knowledge helpful"],
        "learning_outcomes": [
            "Master cloud architecture and design security principles",
            "Excel in cloud data security and privacy protection",
            "Learn cloud platform and infrastructure security",
            "Understand cloud application security and DevSecOps",
            "Develop expertise in cloud security operations and incident response"
        ],
        "tags": ["ccsp", "cloud-security", "aws-security", "azure-security", "devsecops"],
        "request": {
            "subject": "CCSP Cloud Security Professional Mastery",
            "goal": "I want to master CCSP certification for cloud security. Teach me cloud architecture security, data protection, platform security, application security, DevSecOps, incident response, and compliance in cloud environments. Include hands-on cloud security implementation and management.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # NICHE FINANCIAL AND RISK MANAGEMENT CERTIFICATIONS
    {
        "title": "Financial Risk Manager (FRM) Part II Advanced",
        "category": "competitive-exams",
        "subcategory": "advanced-risk-management",
        "difficulty": "expert",
        "target_audience": "Senior risk managers and quantitative analysts",
        "estimated_hours": 150,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["FRM Part I", "Risk management experience", "Quantitative background"],
        "learning_outcomes": [
            "Master advanced market risk measurement and management",
            "Excel in credit risk modeling and portfolio management",
            "Learn operational risk and resilience frameworks",
            "Understand liquidity and funding risk management",
            "Develop expertise in current issues and emerging risks"
        ],
        "tags": ["frm-part-ii", "market-risk", "credit-risk", "operational-risk", "liquidity-risk"],
        "request": {
            "subject": "FRM Part II Advanced Risk Management Excellence",
            "goal": "I want to master FRM Part II for advanced risk management. Teach me market risk measurement, credit risk modeling, operational risk frameworks, liquidity management, stress testing, and emerging risk topics. Include practical risk management applications and quantitative techniques.",
            "time_value": 15,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Certified Treasury Professional (CTP) Mastery",
        "category": "competitive-exams",
        "subcategory": "treasury-management",
        "difficulty": "advanced",
        "target_audience": "Treasury professionals and cash management specialists",
        "estimated_hours": 90,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Finance background", "Treasury experience", "Banking knowledge"],
        "learning_outcomes": [
            "Master cash and liquidity management strategies",
            "Excel in working capital optimization and forecasting",
            "Learn financial risk management and hedging techniques",
            "Understand capital structure and funding strategies",
            "Develop expertise in treasury technology and operations"
        ],
        "tags": ["ctp", "treasury-management", "cash-management", "working-capital", "hedging"],
        "request": {
            "subject": "CTP Treasury Professional Excellence",
            "goal": "I want to master CTP certification for treasury management. Teach me cash management, liquidity optimization, working capital strategies, financial risk hedging, capital structure, funding techniques, and treasury operations. Include practical treasury management and corporate finance applications.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Certified Credit Professional (CCP) Specialization",
        "category": "competitive-exams",
        "subcategory": "credit-risk",
        "difficulty": "intermediate",
        "target_audience": "Credit analysts and commercial lending professionals",
        "estimated_hours": 80,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.6,
        "prerequisites": ["Credit analysis experience", "Financial statement analysis", "Banking knowledge"],
        "learning_outcomes": [
            "Master commercial credit analysis and underwriting",
            "Excel in financial statement analysis and cash flow modeling",
            "Learn loan structuring and documentation techniques",
            "Understand credit risk rating and portfolio management",
            "Develop expertise in workout and restructuring strategies"
        ],
        "tags": ["ccp", "credit-analysis", "commercial-lending", "underwriting", "loan-structuring"],
        "request": {
            "subject": "CCP Credit Professional Excellence",
            "goal": "I want to master CCP certification for credit analysis and commercial lending. Teach me credit underwriting, financial analysis, cash flow modeling, loan structuring, risk rating, portfolio management, and workout strategies. Include practical credit decision-making and relationship management.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED HEALTHCARE AND MEDICAL CERTIFICATIONS
    {
        "title": "Certified Clinical Research Professional (CCRP) Mastery",
        "category": "competitive-exams",
        "subcategory": "clinical-research",
        "difficulty": "advanced",
        "target_audience": "Clinical research coordinators and CRA professionals",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Clinical research experience", "GCP training", "Healthcare background"],
        "learning_outcomes": [
            "Master clinical trial design and protocol development",
            "Excel in regulatory compliance and GCP implementation",
            "Learn clinical data management and biostatistics",
            "Understand pharmacovigilance and safety reporting",
            "Develop expertise in site management and monitoring"
        ],
        "tags": ["ccrp", "clinical-research", "clinical-trials", "gcp", "pharmacovigilance"],
        "request": {
            "subject": "CCRP Clinical Research Professional Excellence",
            "goal": "I want to master CCRP certification for clinical research. Teach me clinical trial design, protocol development, GCP compliance, data management, biostatistics, pharmacovigilance, safety reporting, and site monitoring. Include practical clinical research management and regulatory expertise.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Certified Professional in Healthcare Quality (CPHQ) Excellence",
        "category": "competitive-exams",
        "subcategory": "healthcare-quality",
        "difficulty": "advanced",
        "target_audience": "Healthcare quality professionals and patient safety specialists",
        "estimated_hours": 85,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Healthcare experience", "Quality improvement knowledge", "Patient safety background"],
        "learning_outcomes": [
            "Master healthcare quality management systems and methodologies",
            "Excel in patient safety and risk management programs",
            "Learn performance improvement and data analysis techniques",
            "Understand regulatory compliance and accreditation standards",
            "Develop expertise in leadership and organizational development"
        ],
        "tags": ["cphq", "healthcare-quality", "patient-safety", "performance-improvement", "accreditation"],
        "request": {
            "subject": "CPHQ Healthcare Quality Professional Excellence",
            "goal": "I want to master CPHQ certification for healthcare quality management. Teach me quality systems, patient safety programs, performance improvement, data analysis, regulatory compliance, accreditation standards, and healthcare leadership. Include practical quality improvement and patient safety implementation.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # PROJECT MANAGEMENT AND BUSINESS ANALYSIS CERTIFICATIONS
    {
        "title": "PMI Agile Certified Practitioner (PMI-ACP) Mastery",
        "category": "competitive-exams",
        "subcategory": "agile-project-management",
        "difficulty": "intermediate",
        "target_audience": "Agile practitioners and scrum masters",
        "estimated_hours": 75,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Project management experience", "Agile methodology knowledge", "Team leadership"],
        "learning_outcomes": [
            "Master multiple agile methodologies and frameworks",
            "Excel in agile project planning and estimation techniques",
            "Learn servant leadership and team facilitation skills",
            "Understand agile metrics and continuous improvement",
            "Develop expertise in stakeholder engagement and communication"
        ],
        "tags": ["pmi-acp", "agile", "scrum", "kanban", "servant-leadership"],
        "request": {
            "subject": "PMI-ACP Agile Certified Practitioner Excellence",
            "goal": "I want to master PMI-ACP certification for agile project management. Teach me agile methodologies, scrum, kanban, planning techniques, estimation, servant leadership, team facilitation, metrics, and stakeholder engagement. Include practical agile implementation and coaching skills.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Certified Business Analysis Professional (CBAP) Excellence",
        "category": "competitive-exams",
        "subcategory": "business-analysis",
        "difficulty": "advanced",
        "target_audience": "Senior business analysts and requirements specialists",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Business analysis experience", "Requirements management", "Stakeholder engagement"],
        "learning_outcomes": [
            "Master business analysis planning and monitoring techniques",
            "Excel in elicitation and collaboration methodologies",
            "Learn requirements life cycle management",
            "Understand strategy analysis and solution assessment",
            "Develop expertise in business analysis governance and leadership"
        ],
        "tags": ["cbap", "business-analysis", "requirements-management", "elicitation", "strategy-analysis"],
        "request": {
            "subject": "CBAP Business Analysis Professional Excellence",
            "goal": "I want to master CBAP certification for business analysis. Teach me business analysis planning, elicitation techniques, collaboration methods, requirements management, strategy analysis, solution assessment, and governance. Include practical business analysis leadership and stakeholder management.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED TECHNICAL AND INDUSTRY-SPECIFIC CERTIFICATIONS
    {
        "title": "Certified Energy Manager (CEM) Professional Certification",
        "category": "competitive-exams",
        "subcategory": "energy-management",
        "difficulty": "advanced",
        "target_audience": "Energy managers and sustainability professionals",
        "estimated_hours": 95,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Engineering background", "Energy systems knowledge", "Project management"],
        "learning_outcomes": [
            "Master energy auditing and assessment methodologies",
            "Excel in energy efficiency project development and financing",
            "Learn renewable energy systems and integration",
            "Understand energy procurement and utility management",
            "Develop expertise in energy policy and regulatory compliance"
        ],
        "tags": ["cem", "energy-management", "energy-auditing", "renewable-energy", "sustainability"],
        "request": {
            "subject": "CEM Energy Manager Professional Excellence",
            "goal": "I want to master CEM certification for energy management. Teach me energy auditing, efficiency projects, renewable systems, utility management, energy procurement, financing, policy compliance, and sustainability strategies. Include practical energy management and cost optimization techniques.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Certified Professional in Erosion and Sediment Control (CPESC)",
        "category": "competitive-exams",
        "subcategory": "environmental-engineering",
        "difficulty": "intermediate",
        "target_audience": "Environmental engineers and stormwater specialists",
        "estimated_hours": 70,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.5,
        "prerequisites": ["Environmental engineering", "Civil engineering", "Stormwater management"],
        "learning_outcomes": [
            "Master erosion and sediment control design principles",
            "Excel in stormwater management and BMP implementation",
            "Learn soil mechanics and hydrology applications",
            "Understand regulatory compliance and permitting processes",
            "Develop expertise in construction site management and inspection"
        ],
        "tags": ["cpesc", "erosion-control", "stormwater", "environmental-engineering", "bmp"],
        "request": {
            "subject": "CPESC Erosion and Sediment Control Excellence",
            "goal": "I want to master CPESC certification for erosion and sediment control. Teach me erosion control design, stormwater management, BMP implementation, soil mechanics, hydrology, regulatory compliance, and construction site management. Include practical environmental engineering and inspection techniques.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Certified Professional in Supply Management (CPSM) Excellence",
        "category": "competitive-exams",
        "subcategory": "supply-chain",
        "difficulty": "advanced",
        "target_audience": "Supply chain professionals and procurement managers",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Supply chain experience", "Procurement knowledge", "Business operations"],
        "learning_outcomes": [
            "Master strategic sourcing and supplier relationship management",
            "Excel in contract negotiation and risk management",
            "Learn supply chain analytics and performance measurement",
            "Understand global supply chain and logistics optimization",
            "Develop expertise in supply chain leadership and transformation"
        ],
        "tags": ["cpsm", "supply-chain", "strategic-sourcing", "procurement", "supplier-management"],
        "request": {
            "subject": "CPSM Supply Management Professional Excellence",
            "goal": "I want to master CPSM certification for supply management. Teach me strategic sourcing, supplier relationship management, contract negotiation, risk management, supply chain analytics, logistics optimization, and leadership. Include practical procurement and supply chain transformation strategies.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Certified Regulatory Compliance Manager (CRCM) Mastery",
        "category": "competitive-exams",
        "subcategory": "regulatory-compliance",
        "difficulty": "advanced",
        "target_audience": "Banking compliance officers and regulatory specialists",
        "estimated_hours": 100,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Banking experience", "Regulatory knowledge", "Compliance background"],
        "learning_outcomes": [
            "Master federal banking regulations and compliance requirements",
            "Excel in consumer protection and fair lending practices",
            "Learn anti-money laundering and BSA compliance",
            "Understand examination procedures and regulatory relationships",
            "Develop expertise in compliance program management and governance"
        ],
        "tags": ["crcm", "banking-compliance", "consumer-protection", "aml", "bsa"],
        "request": {
            "subject": "CRCM Regulatory Compliance Manager Excellence",
            "goal": "I want to master CRCM certification for banking compliance. Teach me federal banking regulations, consumer protection, fair lending, anti-money laundering, BSA compliance, examination procedures, and compliance program management. Include practical regulatory compliance and risk management strategies.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Certified Professional in Learning and Performance (CPLP) Excellence",
        "category": "competitive-exams",
        "subcategory": "learning-development",
        "difficulty": "advanced",
        "target_audience": "Learning and development professionals and training managers",
        "estimated_hours": 90,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.6,
        "prerequisites": ["L&D experience", "Training design", "Adult learning principles"],
        "learning_outcomes": [
            "Master instructional design and curriculum development",
            "Excel in training delivery and facilitation techniques",
            "Learn performance improvement and needs assessment",
            "Understand learning technologies and e-learning development",
            "Develop expertise in learning measurement and evaluation"
        ],
        "tags": ["cplp", "learning-development", "instructional-design", "training", "performance-improvement"],
        "request": {
            "subject": "CPLP Learning and Performance Professional Excellence",
            "goal": "I want to master CPLP certification for learning and performance. Teach me instructional design, curriculum development, training delivery, facilitation, performance improvement, needs assessment, learning technologies, and evaluation methods. Include practical L&D leadership and organizational development skills.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # ==============================================================================
    # ADVANCED MACHINE LEARNING AND AI ENGINEERING
    # ==============================================================================

    # ADVANCED ML ENGINEERING AND MLOPS
    {
        "title": "Production MLOps and Model Lifecycle Management",
        "category": "technology",
        "subcategory": "mlops-engineering",
        "difficulty": "advanced",
        "target_audience": "ML engineers and MLOps specialists",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Machine learning fundamentals", "Software engineering", "DevOps experience"],
        "learning_outcomes": [
            "Master end-to-end ML pipeline automation and orchestration",
            "Excel in model versioning, experiment tracking, and reproducibility",
            "Learn continuous integration and deployment for ML systems",
            "Understand model monitoring, drift detection, and retraining strategies",
            "Develop expertise in MLOps tools and infrastructure management"
        ],
        "tags": ["mlops", "model-deployment", "ml-pipelines", "kubeflow", "model-monitoring"],
        "request": {
            "subject": "Production MLOps and Model Lifecycle Management Mastery",
            "goal": "I want to master production MLOps and model lifecycle management. Teach me ML pipeline automation, model versioning, experiment tracking, CI/CD for ML, model monitoring, drift detection, retraining strategies, and MLOps infrastructure. Include practical MLOps tools like Kubeflow, MLflow, and cloud ML platforms.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Distributed Machine Learning and Model Parallelism",
        "category": "technology",
        "subcategory": "distributed-ml",
        "difficulty": "expert",
        "target_audience": "Senior ML engineers and distributed systems specialists",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Advanced ML knowledge", "Distributed systems", "High-performance computing"],
        "learning_outcomes": [
            "Master data parallelism and model parallelism techniques",
            "Excel in federated learning and privacy-preserving ML",
            "Learn distributed training optimization and scaling strategies",
            "Understand gradient compression and communication efficiency",
            "Develop expertise in distributed ML frameworks and cluster management"
        ],
        "tags": ["distributed-ml", "model-parallelism", "federated-learning", "distributed-training", "horovod"],
        "request": {
            "subject": "Distributed Machine Learning and Model Parallelism Excellence",
            "goal": "I want to master distributed machine learning and model parallelism. Teach me data/model parallelism, federated learning, distributed training optimization, gradient compression, communication efficiency, and distributed ML frameworks. Include practical implementation with PyTorch Distributed, Horovod, and cloud ML clusters.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Real-time ML Inference and Edge AI Optimization",
        "category": "technology",
        "subcategory": "edge-ai",
        "difficulty": "advanced",
        "target_audience": "Edge AI engineers and mobile ML developers",
        "estimated_hours": 95,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["ML model development", "Mobile development", "Embedded systems knowledge"],
        "learning_outcomes": [
            "Master model quantization and pruning for edge deployment",
            "Excel in neural architecture search for efficient models",
            "Learn hardware-specific optimization and acceleration",
            "Understand real-time inference pipelines and latency optimization",
            "Develop expertise in edge AI frameworks and mobile deployment"
        ],
        "tags": ["edge-ai", "model-quantization", "mobile-ml", "tensorrt", "onnx"],
        "request": {
            "subject": "Real-time ML Inference and Edge AI Optimization Mastery",
            "goal": "I want to master real-time ML inference and edge AI optimization. Teach me model quantization, pruning, neural architecture search, hardware optimization, real-time pipelines, latency optimization, and edge deployment. Include practical tools like TensorRT, ONNX, Core ML, and TensorFlow Lite.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # SPECIALIZED AI RESEARCH AND DEVELOPMENT
    {
        "title": "Advanced Neural Architecture Design and AutoML",
        "category": "technology",
        "subcategory": "neural-architecture",
        "difficulty": "expert",
        "target_audience": "AI researchers and neural network architects",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Deep learning expertise", "Research experience", "Mathematical foundations"],
        "learning_outcomes": [
            "Master neural architecture search (NAS) algorithms and techniques",
            "Excel in transformer architecture design and optimization",
            "Learn attention mechanisms and advanced architectural patterns",
            "Understand hyperparameter optimization and automated ML pipelines",
            "Develop expertise in novel architecture development and research"
        ],
        "tags": ["neural-architecture-search", "transformer-design", "attention-mechanisms", "automl", "architecture-optimization"],
        "request": {
            "subject": "Advanced Neural Architecture Design and AutoML Excellence",
            "goal": "I want to master advanced neural architecture design and AutoML. Teach me neural architecture search, transformer design, attention mechanisms, architectural patterns, hyperparameter optimization, and automated ML. Include cutting-edge research in efficient architectures and novel design principles.",
            "time_value": 13,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Multimodal AI and Cross-Modal Learning Systems",
        "category": "technology",
        "subcategory": "multimodal-ai",
        "difficulty": "advanced",
        "target_audience": "AI researchers and multimodal system developers",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Computer vision", "NLP", "Deep learning", "Research background"],
        "learning_outcomes": [
            "Master vision-language models and cross-modal understanding",
            "Excel in multimodal fusion techniques and joint embeddings",
            "Learn audio-visual learning and speech-vision integration",
            "Understand cross-modal retrieval and generation systems",
            "Develop expertise in multimodal transformer architectures"
        ],
        "tags": ["multimodal-ai", "vision-language", "cross-modal", "multimodal-fusion", "clip"],
        "request": {
            "subject": "Multimodal AI and Cross-Modal Learning Excellence",
            "goal": "I want to master multimodal AI and cross-modal learning systems. Teach me vision-language models, multimodal fusion, joint embeddings, audio-visual learning, cross-modal retrieval, generation systems, and multimodal transformers. Include practical applications with CLIP, DALL-E, and latest multimodal architectures.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Reinforcement Learning for Real-World Applications",
        "category": "technology",
        "subcategory": "applied-rl",
        "difficulty": "advanced",
        "target_audience": "RL researchers and applied AI engineers",
        "estimated_hours": 115,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["RL fundamentals", "Deep learning", "Mathematical optimization"],
        "learning_outcomes": [
            "Master deep reinforcement learning algorithms and implementations",
            "Excel in multi-agent RL and cooperative learning systems",
            "Learn offline RL and batch reinforcement learning techniques",
            "Understand RL for robotics and autonomous systems",
            "Develop expertise in safe RL and constrained optimization"
        ],
        "tags": ["reinforcement-learning", "deep-rl", "multi-agent", "offline-rl", "safe-rl"],
        "request": {
            "subject": "Reinforcement Learning for Real-World Applications Excellence",
            "goal": "I want to master reinforcement learning for real-world applications. Teach me deep RL algorithms, multi-agent systems, offline RL, RL for robotics, safe RL, constrained optimization, and practical deployment strategies. Include hands-on implementation with modern RL frameworks and real-world case studies.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # DOMAIN-SPECIFIC AI APPLICATIONS
    {
        "title": "AI for Scientific Computing and Research Acceleration",
        "category": "technology",
        "subcategory": "scientific-ai",
        "difficulty": "advanced",
        "target_audience": "Scientific AI researchers and computational scientists",
        "estimated_hours": 105,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Scientific computing", "ML fundamentals", "Domain expertise helpful"],
        "learning_outcomes": [
            "Master physics-informed neural networks and scientific ML",
            "Excel in AI for drug discovery and molecular modeling",
            "Learn neural differential equations and scientific simulation",
            "Understand AI for materials science and protein folding",
            "Develop expertise in scientific data analysis and hypothesis generation"
        ],
        "tags": ["scientific-ml", "physics-informed", "drug-discovery", "molecular-modeling", "neural-ode"],
        "request": {
            "subject": "AI for Scientific Computing and Research Acceleration Excellence",
            "goal": "I want to master AI for scientific computing and research acceleration. Teach me physics-informed neural networks, AI for drug discovery, molecular modeling, neural differential equations, scientific simulation, materials science applications, and scientific data analysis. Include practical applications in research domains.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Advanced Computer Vision and 3D Scene Understanding",
        "category": "technology",
        "subcategory": "advanced-cv",
        "difficulty": "advanced",
        "target_audience": "Computer vision engineers and 3D AI specialists",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Computer vision basics", "3D geometry", "Deep learning"],
        "learning_outcomes": [
            "Master 3D object detection and scene reconstruction",
            "Excel in neural radiance fields (NeRF) and novel view synthesis",
            "Learn depth estimation and stereo vision techniques",
            "Understand SLAM and visual odometry with deep learning",
            "Develop expertise in 3D generative models and point cloud processing"
        ],
        "tags": ["3d-vision", "nerf", "scene-reconstruction", "slam", "point-clouds"],
        "request": {
            "subject": "Advanced Computer Vision and 3D Scene Understanding Excellence",
            "goal": "I want to master advanced computer vision and 3D scene understanding. Teach me 3D object detection, scene reconstruction, neural radiance fields, novel view synthesis, depth estimation, stereo vision, SLAM, visual odometry, 3D generative models, and point cloud processing. Include practical applications in AR/VR and robotics.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Natural Language Processing for Code and Software Engineering",
        "category": "technology",
        "subcategory": "code-nlp",
        "difficulty": "advanced",
        "target_audience": "NLP engineers and AI-assisted programming specialists",
        "estimated_hours": 90,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["NLP fundamentals", "Software engineering", "Programming languages"],
        "learning_outcomes": [
            "Master code generation and program synthesis techniques",
            "Excel in code understanding and semantic analysis",
            "Learn automated debugging and vulnerability detection",
            "Understand code translation and refactoring automation",
            "Develop expertise in AI-powered development tools and IDEs"
        ],
        "tags": ["code-generation", "program-synthesis", "code-understanding", "automated-debugging", "codex"],
        "request": {
            "subject": "NLP for Code and Software Engineering Excellence",
            "goal": "I want to master NLP for code and software engineering. Teach me code generation, program synthesis, code understanding, semantic analysis, automated debugging, vulnerability detection, code translation, refactoring automation, and AI-powered development tools. Include practical applications with Codex, CodeT5, and code LLMs.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # EMERGING AI TECHNOLOGIES AND TECHNIQUES
    {
        "title": "Neural Information Retrieval and Semantic Search Systems",
        "category": "technology",
        "subcategory": "neural-search",
        "difficulty": "advanced",
        "target_audience": "Search engineers and information retrieval specialists",
        "estimated_hours": 85,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["NLP", "Information retrieval", "Vector databases"],
        "learning_outcomes": [
            "Master dense retrieval and neural ranking models",
            "Excel in embedding-based search and semantic matching",
            "Learn query understanding and intent recognition",
            "Understand retrieval-augmented generation (RAG) systems",
            "Develop expertise in large-scale search infrastructure and optimization"
        ],
        "tags": ["neural-search", "dense-retrieval", "semantic-search", "rag", "vector-databases"],
        "request": {
            "subject": "Neural Information Retrieval and Semantic Search Excellence",
            "goal": "I want to master neural information retrieval and semantic search systems. Teach me dense retrieval, neural ranking, embedding-based search, semantic matching, query understanding, RAG systems, and large-scale search infrastructure. Include practical implementation with modern search stacks and vector databases.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Efficient AI and Green Machine Learning",
        "category": "technology",
        "subcategory": "efficient-ai",
        "difficulty": "intermediate",
        "target_audience": "Sustainable AI engineers and efficiency specialists",
        "estimated_hours": 80,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.6,
        "prerequisites": ["ML fundamentals", "Systems optimization", "Environmental awareness"],
        "learning_outcomes": [
            "Master energy-efficient model architectures and training",
            "Excel in carbon footprint measurement and optimization",
            "Learn knowledge distillation and model compression techniques",
            "Understand sustainable AI practices and green computing",
            "Develop expertise in efficiency metrics and environmental impact assessment"
        ],
        "tags": ["efficient-ai", "green-ml", "energy-optimization", "model-compression", "sustainable-ai"],
        "request": {
            "subject": "Efficient AI and Green Machine Learning Excellence",
            "goal": "I want to master efficient AI and green machine learning practices. Teach me energy-efficient architectures, carbon footprint optimization, knowledge distillation, model compression, sustainable AI practices, green computing, and environmental impact assessment. Include practical strategies for reducing AI's environmental impact.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },

    # AI SAFETY AND ETHICS SPECIALIZATIONS
    {
        "title": "AI Safety and Alignment Engineering",
        "category": "technology",
        "subcategory": "ai-safety",
        "difficulty": "advanced",
        "target_audience": "AI safety researchers and alignment engineers",
        "estimated_hours": 95,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["ML expertise", "Ethics background", "Research experience"],
        "learning_outcomes": [
            "Master AI alignment theory and value learning techniques",
            "Excel in robustness testing and adversarial defense",
            "Learn interpretability methods and explainable AI",
            "Understand failure detection and safe deployment strategies",
            "Develop expertise in AI governance and safety frameworks"
        ],
        "tags": ["ai-safety", "ai-alignment", "interpretability", "robustness", "ai-governance"],
        "request": {
            "subject": "AI Safety and Alignment Engineering Excellence",
            "goal": "I want to master AI safety and alignment engineering. Teach me AI alignment theory, value learning, robustness testing, adversarial defense, interpretability methods, explainable AI, failure detection, safe deployment, and AI governance frameworks. Include practical safety evaluation and risk mitigation strategies.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Fairness and Bias Mitigation in AI Systems",
        "category": "technology",
        "subcategory": "ai-fairness",
        "difficulty": "intermediate",
        "target_audience": "AI ethics specialists and responsible AI engineers",
        "estimated_hours": 75,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["ML fundamentals", "Statistics", "Ethics awareness"],
        "learning_outcomes": [
            "Master bias detection and measurement techniques",
            "Excel in fairness metrics and evaluation frameworks",
            "Learn bias mitigation strategies in data and algorithms",
            "Understand demographic parity and equalized opportunity",
            "Develop expertise in responsible AI deployment and monitoring"
        ],
        "tags": ["ai-fairness", "bias-mitigation", "responsible-ai", "algorithmic-fairness", "ethics"],
        "request": {
            "subject": "Fairness and Bias Mitigation in AI Systems Excellence",
            "goal": "I want to master fairness and bias mitigation in AI systems. Teach me bias detection, measurement techniques, fairness metrics, evaluation frameworks, bias mitigation strategies, demographic parity, equalized opportunity, and responsible AI deployment. Include practical tools for building fair and inclusive AI systems.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Privacy-Preserving Machine Learning and Differential Privacy",
        "category": "technology",
        "subcategory": "privacy-ml",
        "difficulty": "advanced",
        "target_audience": "Privacy engineers and secure ML specialists",
        "estimated_hours": 100,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["ML fundamentals", "Cryptography basics", "Privacy concepts"],
        "learning_outcomes": [
            "Master differential privacy theory and implementation",
            "Excel in federated learning and secure aggregation",
            "Learn homomorphic encryption for ML applications",
            "Understand secure multi-party computation for AI",
            "Develop expertise in privacy-preserving data analysis and deployment"
        ],
        "tags": ["differential-privacy", "federated-learning", "homomorphic-encryption", "secure-ml", "privacy-preserving"],
        "request": {
            "subject": "Privacy-Preserving ML and Differential Privacy Excellence",
            "goal": "I want to master privacy-preserving machine learning and differential privacy. Teach me differential privacy theory, federated learning, secure aggregation, homomorphic encryption, secure multi-party computation, and privacy-preserving data analysis. Include practical implementation of privacy-preserving AI systems.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    }
]

# ==============================================================================
# ADMIN ENDPOINTS
# ==============================================================================

@router.get("/admin/trending-list")
def get_trending_roadmaps_list():
    """Get list of available trending roadmaps for admin selection"""
    return {
        "total_available": len(TRENDING_ROADMAPS_CONFIG),
        "roadmaps": [
            {
                "title": config["title"],
                "category": config["category"],
                "subcategory": config["subcategory"],
                "difficulty": config["difficulty"],
                "estimated_hours": config["estimated_hours"],
                "target_audience": config["target_audience"]
            }
            for config in TRENDING_ROADMAPS_CONFIG
        ]
    }

@router.post("/admin/generate/{roadmap_index}")
async def generate_curated_roadmap(
    roadmap_index: int,
    db: Session = Depends(get_db)
):
    """Generate and save a curated roadmap by index"""
    
    if roadmap_index < 0 or roadmap_index >= len(TRENDING_ROADMAPS_CONFIG):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid roadmap index. Must be between 0 and {len(TRENDING_ROADMAPS_CONFIG) - 1}"
        )
    
    config = TRENDING_ROADMAPS_CONFIG[roadmap_index]
    
    # Check if already exists
    existing = db.exec(
        select(CuratedRoadmap).where(CuratedRoadmap.title == config["title"])
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Roadmap '{config['title']}' already exists in database"
        )
    
    try:
        logger.info(f"🎯 Admin generating: {config['title']}")
        
        # Create AI request
        request = RoadmapCreateRequest(**config['request'])
        
        # Generate content using AI service
        ai_response = await generate_roadmap_content(request)
        
        # Create curated roadmap
        curated_roadmap = CuratedRoadmap(
            title=config['title'],
            description=ai_response.description,
            category=config['category'],
            subcategory=config.get('subcategory'),
            difficulty=config['difficulty'],
            is_featured=config['is_featured'],
            is_verified=config['is_verified'], 
            quality_score=config['quality_score'],
            view_count=0,
            adoption_count=0,
            completion_rate=0.0,
            average_rating=0.0,
            roadmap_plan=ai_response.roadmap_plan.model_dump()["modules"],
            estimated_hours=config['estimated_hours'],
            prerequisites=config['prerequisites'],
            learning_outcomes=config['learning_outcomes'],
            tags=config['tags'],
            target_audience=config['target_audience'],
            slug=create_slug(config['title']),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Save to database
        db.add(curated_roadmap)
        db.commit()
        db.refresh(curated_roadmap)
        
        logger.info(f"✅ Successfully generated and saved: {config['title']} (ID: {curated_roadmap.id})")
        
        return {
            "success": True,
            "message": f"Successfully generated '{config['title']}'",
            "roadmap_id": curated_roadmap.id,
            "slug": curated_roadmap.slug
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to generate {config['title']}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate roadmap: {str(e)}"
        )

@router.get("/admin/status")
def get_admin_status(db: Session = Depends(get_db)):
    """Get status of generated vs available roadmaps"""
    
    # Get existing roadmap titles
    existing_titles = set(db.exec(select(CuratedRoadmap.title)).all())
    total_existing = len(existing_titles)
    total_available = len(TRENDING_ROADMAPS_CONFIG)
    
    # Check which ones exist
    generated_status = []
    for i, config in enumerate(TRENDING_ROADMAPS_CONFIG):
        generated_status.append({
            "index": i,
            "title": config["title"],
            "category": config["category"],
            "generated": config["title"] in existing_titles
        })
    
    return {
        "total_available": total_available,
        "total_generated": total_existing,
        "remaining": total_available - total_existing,
        "roadmaps": generated_status
    }

@router.get("/admin/all-roadmaps")
def get_all_roadmaps_admin(db: Session = Depends(get_db)):
    """Get ALL roadmaps in database for admin view"""
    
    # Get all roadmaps with basic info for admin
    query = select(
        CuratedRoadmap.id,
        CuratedRoadmap.title,
        CuratedRoadmap.category,
        CuratedRoadmap.subcategory,
        CuratedRoadmap.difficulty,
        CuratedRoadmap.is_featured,
        CuratedRoadmap.is_verified,
        CuratedRoadmap.view_count,
        CuratedRoadmap.adoption_count,
        CuratedRoadmap.average_rating,
        CuratedRoadmap.created_at
    ).order_by(desc(CuratedRoadmap.created_at))
    
    roadmaps = db.exec(query).all()
    
    return {
        "total_roadmaps": len(roadmaps),
        "roadmaps": [
            {
                "id": rm.id,
                "title": rm.title,
                "category": rm.category,
                "subcategory": rm.subcategory,
                "difficulty": rm.difficulty,
                "is_featured": rm.is_featured,
                "is_verified": rm.is_verified,
                "view_count": rm.view_count,
                "adoption_count": rm.adoption_count,
                "average_rating": rm.average_rating,
                "created_at": rm.created_at
            }
            for rm in roadmaps
        ]
    }

@router.delete("/admin/clear-all")
def clear_all_curated_roadmaps(db: Session = Depends(get_db)):
    """Delete ALL curated roadmaps from database - DANGER ZONE"""
    
    try:
        # Get count before deletion
        count_before = db.exec(select(func.count(CuratedRoadmap.id))).first()
        
        # Delete all RoadmapResource associations first (foreign key constraint)
        resources = db.exec(select(RoadmapResource)).all()
        for resource in resources:
            db.delete(resource)
        
        # Delete all UserCuratedRoadmap associations (foreign key constraint)
        user_adoptions = db.exec(select(UserCuratedRoadmap)).all()
        for adoption in user_adoptions:
            db.delete(adoption)
        
        # Delete all curated roadmaps
        roadmaps = db.exec(select(CuratedRoadmap)).all()
        for roadmap in roadmaps:
            db.delete(roadmap)
        
        db.commit()
        
        logger.info(f"🗑️ Cleared ALL curated roadmaps: {count_before} deleted")
        
        return {
            "success": True,
            "message": f"Successfully deleted {count_before} curated roadmaps",
            "deleted_count": count_before
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to clear roadmaps: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear roadmaps: {str(e)}"
        )

@router.delete("/admin/delete-selected")
def delete_selected_curated_roadmaps(
    request: dict,
    db: Session = Depends(get_db)
):
    """Delete selected curated roadmaps by their trending roadmap indexes"""
    
    indexes = request.get("indexes", [])
    if not indexes:
        raise HTTPException(status_code=400, detail="No indexes provided")
    
    if not isinstance(indexes, list):
        raise HTTPException(status_code=400, detail="Indexes must be a list")
    
    # Validate indexes
    for index in indexes:
        if not isinstance(index, int) or index < 0 or index >= len(TRENDING_ROADMAPS_CONFIG):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid index {index}. Must be between 0 and {len(TRENDING_ROADMAPS_CONFIG) - 1}"
            )
    
    try:
        deleted_count = 0
        deleted_titles = []
        
        # Get roadmaps by titles from the trending config
        for index in indexes:
            config = TRENDING_ROADMAPS_CONFIG[index]
            title = config["title"]
            
            # Find the roadmap by title
            roadmap = db.exec(select(CuratedRoadmap).where(CuratedRoadmap.title == title)).first()
            
            if roadmap:
                # Delete associated learning resources first
                resources = db.exec(
                    select(RoadmapResource).where(RoadmapResource.curated_roadmap_id == roadmap.id)
                ).all()
                
                for resource in resources:
                    db.delete(resource)
                
                # Delete associated user adoptions
                adoptions = db.exec(
                    select(UserCuratedRoadmap).where(UserCuratedRoadmap.curated_roadmap_id == roadmap.id)
                ).all()
                
                for adoption in adoptions:
                    db.delete(adoption)
                
                # Delete the roadmap
                db.delete(roadmap)
                deleted_count += 1
                deleted_titles.append(title)
        
        db.commit()
        
        logger.info(f"🗑️ Deleted {deleted_count} selected curated roadmaps: {', '.join(deleted_titles)}")
        
        return {
            "success": True,
            "message": f"Successfully deleted {deleted_count} curated roadmap(s)",
            "deleted_count": deleted_count,
            "deleted_titles": deleted_titles
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to delete selected roadmaps: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete selected roadmaps: {str(e)}"
        )

@router.delete("/admin/delete/{roadmap_id}")
def delete_single_curated_roadmap(
    roadmap_id: int, 
    db: Session = Depends(get_db)
):
    """Delete a single curated roadmap by ID"""
    
    # Find the roadmap
    roadmap = db.exec(select(CuratedRoadmap).where(CuratedRoadmap.id == roadmap_id)).first()
    
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    try:
        # Delete associated user adoptions first
        adoptions = db.exec(
            select(UserCuratedRoadmap).where(UserCuratedRoadmap.curated_roadmap_id == roadmap_id)
        ).all()
        
        for adoption in adoptions:
            db.delete(adoption)
        
        # Delete the roadmap
        roadmap_title = roadmap.title
        db.delete(roadmap)
        db.commit()
        
        logger.info(f"🗑️ Admin deleted roadmap: {roadmap_title} (ID: {roadmap_id})")
        
        return {
            "success": True,
            "message": f"Successfully deleted '{roadmap_title}'",
            "deleted_id": roadmap_id
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to delete roadmap {roadmap_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete roadmap: {str(e)}"
        )

# ==============================================================================
# PUBLIC ENDPOINTS FOR USERS
# ==============================================================================

@router.get("/categories/all")
def get_curated_roadmap_categories(db: Session = Depends(get_db)):
    """Get all available categories for curated roadmaps - public endpoint"""
    
    # Get distinct categories from curated roadmaps
    categories_query = db.exec(
        select(CuratedRoadmap.category, CuratedRoadmap.subcategory)
        .distinct()
    ).all()
    
    # Organize categories and subcategories
    categories = {}
    for category, subcategory in categories_query:
        if category not in categories:
            categories[category] = []
        if subcategory and subcategory not in categories[category]:
            categories[category].append(subcategory)
    
    return {"categories": categories}

@router.get("/", response_model=List[CuratedRoadmapListResponse])
async def browse_curated_roadmaps(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(200, ge=1, le=1000, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    subcategory: Optional[str] = Query(None, description="Filter by subcategory"), 
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    featured_only: bool = Query(False, description="Show only featured roadmaps"),
    search: Optional[str] = Query(None, description="Search query"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Browse curated roadmaps - public endpoint"""
    
    # Generate cache key for this request
    cache_key = generate_cache_key(
        "browse", 
        page=page, 
        per_page=per_page, 
        category=category,
        subcategory=subcategory, 
        difficulty=difficulty, 
        featured_only=featured_only, 
        search=search
    )
    
    # Try to get from cache first
    cached_response = await get_cached_response(cache_key)
    if cached_response:
        return cached_response
    
    query = select(CuratedRoadmap)
    
    # Apply filters
    filters = []
    if category:
        filters.append(CuratedRoadmap.category == category)
    if subcategory:
        filters.append(CuratedRoadmap.subcategory == subcategory)
    if difficulty:
        filters.append(CuratedRoadmap.difficulty == difficulty)
    if featured_only:
        filters.append(CuratedRoadmap.is_featured == True)
    if search:
        search_filter = or_(
            CuratedRoadmap.title.icontains(search),
            CuratedRoadmap.description.icontains(search)
        )
        filters.append(search_filter)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Apply sorting by quality score and popularity
    query = query.order_by(desc(CuratedRoadmap.quality_score), desc(CuratedRoadmap.adoption_count))
    
    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
    roadmaps = db.exec(query).all()
    
    response_data = [
        CuratedRoadmapListResponse(
            id=roadmap.id,
            title=roadmap.title,
            description=roadmap.description,
            category=roadmap.category,
            subcategory=roadmap.subcategory,
            difficulty=roadmap.difficulty,
            is_featured=roadmap.is_featured,
            is_verified=roadmap.is_verified,
            view_count=roadmap.view_count,
            adoption_count=roadmap.adoption_count,
            average_rating=roadmap.average_rating,
            estimated_hours=roadmap.estimated_hours,
            tags=roadmap.tags,
            target_audience=roadmap.target_audience,
            slug=roadmap.slug
        ) for roadmap in roadmaps
    ]
    
    # Cache the response (30 minutes TTL)
    await set_cached_response(cache_key, response_data, ttl=1800)
    
    return response_data

@router.get("/slug/{slug}", response_model=CuratedRoadmapResponse)
async def get_curated_roadmap_by_slug(
    slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Get detailed curated roadmap by slug - public endpoint"""
    
    # Generate cache key for this roadmap detail
    cache_key = generate_cache_key("detail", slug=slug)
    
    # Try to get from cache first (excluding view count for caching)
    cached_response = await get_cached_response(cache_key)
    if cached_response:
        # Still increment view count for analytics but return cached data
        try:
            roadmap = db.exec(select(CuratedRoadmap).where(CuratedRoadmap.slug == slug)).first()
            if roadmap:
                roadmap.view_count += 1
                db.add(roadmap)
                db.commit()
        except Exception as e:
            logger.warning(f"Failed to increment view count: {e}")
        return cached_response
    
    roadmap = db.exec(select(CuratedRoadmap).where(CuratedRoadmap.slug == slug)).first()
    
    if not roadmap:
        raise HTTPException(status_code=404, detail="Curated roadmap not found")
    
    # Increment view count
    roadmap.view_count += 1
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    
    response_data = CuratedRoadmapResponse(
        id=roadmap.id,
        title=roadmap.title,
        description=roadmap.description,
        category=roadmap.category,
        subcategory=roadmap.subcategory,
        difficulty=roadmap.difficulty,
        is_featured=roadmap.is_featured,
        is_verified=roadmap.is_verified,
        view_count=roadmap.view_count,
        adoption_count=roadmap.adoption_count,
        average_rating=roadmap.average_rating,
        roadmap_plan=roadmap.roadmap_plan,
        estimated_hours=roadmap.estimated_hours,
        prerequisites=roadmap.prerequisites,
        learning_outcomes=roadmap.learning_outcomes,
        tags=roadmap.tags,
        target_audience=roadmap.target_audience,
        slug=roadmap.slug,
        created_at=roadmap.created_at,
        updated_at=roadmap.updated_at
    )
    
    # Cache the response (1 hour TTL for detailed content)
    await set_cached_response(cache_key, response_data, ttl=3600)
    
    return response_data

# Include the adopt functionality
from .curated_roadmaps_adopt import router as adopt_router
router.include_router(adopt_router)

@router.get("/{roadmap_id}", response_model=CuratedRoadmapResponse)
def get_curated_roadmap(
    roadmap_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Get detailed curated roadmap by ID - public endpoint"""
    
    roadmap = db.exec(select(CuratedRoadmap).where(CuratedRoadmap.id == roadmap_id)).first()
    
    if not roadmap:
        raise HTTPException(status_code=404, detail="Curated roadmap not found")
    
    # Increment view count
    roadmap.view_count += 1
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    
    return CuratedRoadmapResponse(
        id=roadmap.id,
        title=roadmap.title,
        description=roadmap.description,
        category=roadmap.category,
        subcategory=roadmap.subcategory,
        difficulty=roadmap.difficulty,
        is_featured=roadmap.is_featured,
        is_verified=roadmap.is_verified,
        view_count=roadmap.view_count,
        adoption_count=roadmap.adoption_count,
        average_rating=roadmap.average_rating,
        roadmap_plan=roadmap.roadmap_plan,
        estimated_hours=roadmap.estimated_hours,
        prerequisites=roadmap.prerequisites,
        learning_outcomes=roadmap.learning_outcomes,
        tags=roadmap.tags,
        target_audience=roadmap.target_audience,
        slug=roadmap.slug,
        created_at=roadmap.created_at,
        updated_at=roadmap.updated_at
    )

# Include the adopt functionality
from .curated_roadmaps_adopt import router as adopt_router
router.include_router(adopt_router)