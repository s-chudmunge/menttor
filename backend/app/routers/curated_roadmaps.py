from fastapi import APIRouter, Depends, HTTPException, status, Query, Form
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlmodel import Session, select, desc, func, and_, or_
from database.session import get_db
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
def browse_curated_roadmaps(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(12, ge=1, le=50, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    subcategory: Optional[str] = Query(None, description="Filter by subcategory"), 
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    featured_only: bool = Query(False, description="Show only featured roadmaps"),
    search: Optional[str] = Query(None, description="Search query"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Browse curated roadmaps - public endpoint"""
    
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
    
    return [
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

@router.get("/slug/{slug}", response_model=CuratedRoadmapResponse)
def get_curated_roadmap_by_slug(
    slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Get detailed curated roadmap by slug - public endpoint"""
    
    roadmap = db.exec(select(CuratedRoadmap).where(CuratedRoadmap.slug == slug)).first()
    
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