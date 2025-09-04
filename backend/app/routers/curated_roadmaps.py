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
from sql_models import CuratedRoadmap, UserCuratedRoadmap, Roadmap, User
from .optional_auth import get_optional_current_user
from .auth import get_current_user
from services.ai_service import generate_roadmap_content
from typing import List, Optional, Dict
import secrets
import logging
import re
import json
import hashlib
from datetime import datetime

router = APIRouter(prefix="/curated-roadmaps", tags=["curated-roadmaps"])
security = HTTPBasic()
logger = logging.getLogger(__name__)

# Admin credentials
ADMIN_USERNAME = "mountain_snatcher"
ADMIN_PASSWORD = "tyson2012"

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
    }
]

# ==============================================================================
# ADMIN ENDPOINTS
# ==============================================================================

@router.get("/admin/trending-list")
def get_trending_roadmaps_list(admin: str = Depends(verify_admin)):
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
    db: Session = Depends(get_db),
    admin: str = Depends(verify_admin)
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
        logger.info(f"🎯 Admin {admin} generating: {config['title']}")
        
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
def get_admin_status(db: Session = Depends(get_db), admin: str = Depends(verify_admin)):
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

@router.delete("/admin/clear-all")
def clear_all_curated_roadmaps(db: Session = Depends(get_db), admin: str = Depends(verify_admin)):
    """Delete ALL curated roadmaps from database - DANGER ZONE"""
    
    try:
        # Get count before deletion
        count_before = db.exec(select(func.count(CuratedRoadmap.id))).first()
        
        # Delete all UserCuratedRoadmap associations first (foreign key constraint)
        user_adoptions = db.exec(select(UserCuratedRoadmap)).all()
        for adoption in user_adoptions:
            db.delete(adoption)
        
        # Delete all curated roadmaps
        roadmaps = db.exec(select(CuratedRoadmap)).all()
        for roadmap in roadmaps:
            db.delete(roadmap)
        
        db.commit()
        
        logger.info(f"🗑️ Admin {admin} cleared ALL curated roadmaps: {count_before} deleted")
        
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
    db: Session = Depends(get_db), 
    admin: str = Depends(verify_admin)
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
                # Delete associated user adoptions first
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
        
        logger.info(f"🗑️ Admin {admin} deleted {deleted_count} selected curated roadmaps: {', '.join(deleted_titles)}")
        
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
    db: Session = Depends(get_db), 
    admin: str = Depends(verify_admin)
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
        
        logger.info(f"🗑️ Admin {admin} deleted roadmap: {roadmap_title} (ID: {roadmap_id})")
        
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
    per_page: int = Query(12, ge=1, le=200, description="Items per page"),
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