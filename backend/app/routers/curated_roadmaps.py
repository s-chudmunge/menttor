from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlmodel import Session, select, desc, func, and_, or_
from database.session import get_db
from schemas import (
    CuratedRoadmapResponse, CuratedRoadmapListResponse, 
    CuratedRoadmapSearchRequest, CuratedRoadmapAdoptRequest, 
    CuratedRoadmapAdoptResponse, CuratedRoadmapCategoriesResponse,
    RoadmapResponse, RoadmapCreateRequest
)
from sql_models import CuratedRoadmap, UserCuratedRoadmap, Roadmap, User
from .optional_auth import get_optional_current_user
from .auth import get_current_user
from services.ai_service import generate_roadmap_content
from typing import List, Optional, Dict
import uuid
import logging
import asyncio
import re
from datetime import datetime

router = APIRouter(prefix="/curated-roadmaps", tags=["curated-roadmaps"])

logger = logging.getLogger(__name__)

def create_slug(title: str) -> str:
    """Create URL-friendly slug from title"""
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)  # Remove special chars
    slug = re.sub(r'[\s_-]+', '-', slug)  # Replace spaces with hyphens
    slug = slug.strip('-')  # Remove leading/trailing hyphens
    return slug

# Premium curated roadmaps configuration
PREMIUM_ROADMAPS_CONFIG = [
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
        "title": "Node.js Backend Development with Express",
        "category": "web-development",
        "subcategory": "backend", 
        "difficulty": "beginner",
        "target_audience": "JavaScript developers transitioning to backend development",
        "estimated_hours": 90,
        "is_featured": False,
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
        "title": "Algorithms and Data Structures for Coding Interviews",
        "category": "computer-science",
        "subcategory": "algorithms", 
        "difficulty": "intermediate",
        "target_audience": "Software engineers preparing for technical interviews at top tech companies",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.7,
        "prerequisites": ["Programming experience in Python/Java/C++", "Basic problem-solving skills"],
        "learning_outcomes": [
            "Master fundamental data structures and algorithms",
            "Solve complex coding problems efficiently",
            "Understand time and space complexity analysis",
            "Excel in technical interviews at FAANG companies",
            "Practice 150+ LeetCode-style problems with solutions"
        ],
        "tags": ["algorithms", "data-structures", "interviews", "leetcode", "problem-solving", "faang"],
        "request": {
            "subject": "Algorithms and Data Structures for Technical Interviews",
            "goal": "I want to excel in coding interviews at top tech companies like Google, Meta, Amazon, and Apple. Teach me essential algorithms, data structures, problem-solving patterns, and interview strategies. Include extensive practice with explanations and optimization techniques.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    }
]

# 30 Additional Premium Roadmaps for Trending Topics, Skills, Certifications & Tech Stacks
ADDITIONAL_PREMIUM_ROADMAPS = [
    {
        "title": "TensorFlow and Keras Deep Learning",
        "category": "artificial-intelligence",
        "subcategory": "deep-learning",
        "difficulty": "intermediate",
        "target_audience": "ML engineers wanting to master TensorFlow for production AI systems",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Python programming", "Basic machine learning", "Linear algebra"],
        "learning_outcomes": [
            "Build and deploy neural networks with TensorFlow",
            "Master Keras API for rapid prototyping",
            "Implement computer vision and NLP models",
            "Optimize models for production deployment",
            "Use TensorFlow Serving and TFX for MLOps"
        ],
        "tags": ["tensorflow", "keras", "deep-learning", "ai", "neural-networks", "mlops"],
        "request": {
            "subject": "TensorFlow and Keras Deep Learning Development",
            "goal": "I want to master TensorFlow and Keras for building production-ready deep learning systems. Teach me neural network architectures, model optimization, deployment strategies, and MLOps practices. Include computer vision, NLP, and scalable AI system design.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Kubernetes Certified Administrator (CKA)",
        "category": "devops",
        "subcategory": "certification",
        "difficulty": "advanced",
        "target_audience": "DevOps engineers preparing for Kubernetes certification",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Linux administration", "Docker containers", "Basic networking"],
        "learning_outcomes": [
            "Pass the Kubernetes CKA certification exam",
            "Master cluster architecture and components",
            "Implement networking, storage, and security",
            "Troubleshoot production Kubernetes issues",
            "Manage multi-node cluster deployments"
        ],
        "tags": ["kubernetes", "cka", "certification", "devops", "containers", "orchestration"],
        "request": {
            "subject": "Kubernetes Certified Administrator (CKA) Exam Preparation",
            "goal": "I want to pass the CKA certification exam and become an expert Kubernetes administrator. Teach me cluster management, networking, storage, security, troubleshooting, and hands-on practical skills needed for the exam and real-world scenarios.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Vue.js 3 with Composition API",
        "category": "web-development",
        "subcategory": "frontend",
        "difficulty": "intermediate",
        "target_audience": "Frontend developers wanting to master modern Vue.js development",
        "estimated_hours": 85,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["JavaScript ES6+", "HTML/CSS", "Basic frontend framework experience"],
        "learning_outcomes": [
            "Master Vue.js 3 Composition API and reactivity",
            "Build scalable single-page applications",
            "Implement state management with Pinia",
            "Create reusable Vue components and composables",
            "Deploy Vue applications with optimal performance"
        ],
        "tags": ["vuejs", "composition-api", "frontend", "javascript", "pinia", "spa"],
        "request": {
            "subject": "Vue.js 3 Modern Frontend Development",
            "goal": "I want to master Vue.js 3 with the Composition API for building modern, reactive web applications. Teach me component architecture, state management, routing, testing, and performance optimization. Focus on real-world project development.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Google Cloud Professional Architect",
        "category": "cloud-computing",
        "subcategory": "gcp",
        "difficulty": "advanced",
        "target_audience": "Cloud architects preparing for Google Cloud certification",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Cloud computing basics", "Networking fundamentals", "System design experience"],
        "learning_outcomes": [
            "Design scalable Google Cloud architectures",
            "Pass Google Cloud Professional Architect exam",
            "Master GCP services and best practices",
            "Implement security and compliance frameworks",
            "Optimize costs and performance on GCP"
        ],
        "tags": ["gcp", "google-cloud", "certification", "architecture", "cloud-computing"],
        "request": {
            "subject": "Google Cloud Professional Cloud Architect Certification",
            "goal": "I want to become a Google Cloud Professional Cloud Architect and pass the certification. Teach me GCP services, architecture patterns, security, networking, data management, and cost optimization. Include hands-on labs and real-world scenarios.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Competitive Programming and Contests",
        "category": "competitive-programming",
        "subcategory": "contests",
        "difficulty": "advanced",
        "target_audience": "Programmers wanting to excel in competitive programming contests",
        "estimated_hours": 150,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["Strong programming skills", "Basic algorithms knowledge", "Mathematical thinking"],
        "learning_outcomes": [
            "Excel in Codeforces, AtCoder, and LeetCode contests",
            "Master advanced algorithms and data structures",
            "Develop speed and accuracy in problem solving",
            "Understand mathematical concepts for programming",
            "Achieve high ratings in competitive platforms"
        ],
        "tags": ["competitive-programming", "contests", "algorithms", "codeforces", "leetcode", "mathematics"],
        "request": {
            "subject": "Competitive Programming Mastery for Contests",
            "goal": "I want to excel in competitive programming contests like Codeforces, AtCoder, and Google Code Jam. Teach me advanced algorithms, mathematical problem solving, optimization techniques, and contest strategies. Include extensive practice problems.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Django REST API Development",
        "category": "web-development",
        "subcategory": "backend",
        "difficulty": "intermediate",
        "target_audience": "Python developers building scalable web APIs",
        "estimated_hours": 95,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Python programming", "Basic web development", "Database concepts"],
        "learning_outcomes": [
            "Build robust REST APIs with Django",
            "Implement authentication and permissions",
            "Design scalable database schemas",
            "Deploy and monitor Django applications",
            "Integrate with third-party services and APIs"
        ],
        "tags": ["django", "python", "rest-api", "backend", "web-development", "postgresql"],
        "request": {
            "subject": "Django REST API Development and Deployment",
            "goal": "I want to master Django for building production-ready REST APIs. Teach me Django REST framework, database design, authentication, testing, deployment, and scaling strategies. Focus on enterprise-level development practices.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "React Native Mobile Development",
        "category": "mobile-development",
        "subcategory": "cross-platform",
        "difficulty": "intermediate",
        "target_audience": "React developers transitioning to mobile app development",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["React experience", "JavaScript/TypeScript", "Mobile development basics"],
        "learning_outcomes": [
            "Build native mobile apps with React Native",
            "Implement navigation and state management",
            "Integrate with device APIs and sensors",
            "Optimize performance for mobile platforms",
            "Deploy apps to App Store and Google Play"
        ],
        "tags": ["react-native", "mobile-development", "react", "ios", "android", "cross-platform"],
        "request": {
            "subject": "React Native Cross-Platform Mobile Development",
            "goal": "I want to master React Native for building high-performance mobile applications for iOS and Android. Teach me navigation, native modules, performance optimization, testing, and app store deployment. Include real-world app development.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "System Design for Senior Engineers",
        "category": "system-design",
        "subcategory": "architecture",
        "difficulty": "advanced",
        "target_audience": "Senior engineers and architects designing large-scale systems",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.6,
        "prerequisites": ["Software engineering experience", "Database knowledge", "Distributed systems basics"],
        "learning_outcomes": [
            "Design scalable distributed systems",
            "Master microservices architecture patterns",
            "Implement caching and load balancing strategies",
            "Handle data consistency and replication",
            "Prepare for system design interviews"
        ],
        "tags": ["system-design", "architecture", "scalability", "microservices", "distributed-systems"],
        "request": {
            "subject": "Large-Scale System Design and Architecture",
            "goal": "I want to master system design for building large-scale, distributed systems. Teach me architecture patterns, scalability strategies, database design, caching, load balancing, and fault tolerance. Include real-world case studies and interview preparation.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "FastAPI Modern Python Web Framework",
        "category": "web-development",
        "subcategory": "backend",
        "difficulty": "beginner",
        "target_audience": "Python developers wanting to build high-performance APIs",
        "estimated_hours": 75,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Python programming", "Basic web concepts", "Type hints knowledge"],
        "learning_outcomes": [
            "Build lightning-fast APIs with FastAPI",
            "Implement automatic API documentation",
            "Handle async programming and concurrency",
            "Integrate with databases and ORMs",
            "Deploy FastAPI applications at scale"
        ],
        "tags": ["fastapi", "python", "api", "async", "backend", "performance"],
        "request": {
            "subject": "FastAPI High-Performance Python Web Development",
            "goal": "I want to master FastAPI for building modern, high-performance web APIs. Teach me async programming, automatic documentation, testing, database integration, and deployment. Focus on building production-ready applications with best practices.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Apache Kafka Streaming Architecture",
        "category": "data-engineering",
        "subcategory": "streaming",
        "difficulty": "advanced",
        "target_audience": "Data engineers building real-time streaming systems",
        "estimated_hours": 115,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Distributed systems knowledge", "Java or Python", "Database experience"],
        "learning_outcomes": [
            "Design real-time streaming architectures with Kafka",
            "Implement Kafka Streams and Connect",
            "Build fault-tolerant data pipelines",
            "Monitor and optimize Kafka clusters",
            "Integrate with various data sources and sinks"
        ],
        "tags": ["kafka", "streaming", "data-engineering", "real-time", "distributed-systems"],
        "request": {
            "subject": "Apache Kafka Real-Time Streaming Data Architecture",
            "goal": "I want to master Apache Kafka for building real-time streaming data systems. Teach me Kafka architecture, Streams API, Connect framework, cluster management, monitoring, and integration patterns. Include hands-on streaming projects.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Svelte and SvelteKit Modern Frontend",
        "category": "web-development",
        "subcategory": "frontend",
        "difficulty": "beginner",
        "target_audience": "Frontend developers exploring modern, lightweight frameworks",
        "estimated_hours": 80,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["JavaScript fundamentals", "HTML/CSS", "Basic component concepts"],
        "learning_outcomes": [
            "Build reactive UIs with Svelte",
            "Create full-stack apps with SvelteKit",
            "Implement server-side rendering",
            "Optimize for performance and bundle size",
            "Deploy Svelte applications efficiently"
        ],
        "tags": ["svelte", "sveltekit", "frontend", "javascript", "reactive", "performance"],
        "request": {
            "subject": "Svelte and SvelteKit Modern Web Development",
            "goal": "I want to master Svelte and SvelteKit for building fast, reactive web applications. Teach me component creation, state management, routing, server-side rendering, and deployment. Focus on performance optimization and modern development practices.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Figma to Code Design Implementation",
        "category": "design",
        "subcategory": "design-to-code",
        "difficulty": "intermediate",
        "target_audience": "Designers and developers bridging design-development gap",
        "estimated_hours": 90,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Basic design knowledge", "HTML/CSS", "JavaScript fundamentals"],
        "learning_outcomes": [
            "Convert Figma designs to pixel-perfect code",
            "Implement responsive design systems",
            "Create reusable component libraries",
            "Master CSS Grid, Flexbox, and animations",
            "Collaborate effectively between design and development"
        ],
        "tags": ["figma", "design-to-code", "css", "responsive-design", "component-libraries"],
        "request": {
            "subject": "Figma to Code Implementation and Design Systems",
            "goal": "I want to master converting Figma designs into high-quality, maintainable code. Teach me design system implementation, responsive layouts, CSS best practices, component architecture, and design-development collaboration workflows.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "PostgreSQL Database Mastery",
        "category": "database",
        "subcategory": "sql",
        "difficulty": "intermediate",
        "target_audience": "Backend developers and database administrators",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["SQL basics", "Database concepts", "Command line familiarity"],
        "learning_outcomes": [
            "Master advanced PostgreSQL features",
            "Design optimal database schemas",
            "Implement indexing and query optimization",
            "Handle replication and high availability",
            "Monitor and tune database performance"
        ],
        "tags": ["postgresql", "database", "sql", "performance", "administration"],
        "request": {
            "subject": "PostgreSQL Advanced Database Development and Administration",
            "goal": "I want to master PostgreSQL for building scalable, high-performance database systems. Teach me advanced SQL, indexing strategies, query optimization, replication, backup strategies, and performance tuning. Include real-world scenarios.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Unity Game Development with C#",
        "category": "game-development",
        "subcategory": "unity",
        "difficulty": "beginner",
        "target_audience": "Aspiring game developers and C# programmers",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Basic programming concepts", "C# fundamentals", "Creative thinking"],
        "learning_outcomes": [
            "Build 2D and 3D games with Unity",
            "Master Unity's component system",
            "Implement game physics and animations",
            "Create user interfaces and game menus",
            "Publish games to multiple platforms"
        ],
        "tags": ["unity", "game-development", "csharp", "2d", "3d", "mobile-games"],
        "request": {
            "subject": "Unity Game Development with C# Programming",
            "goal": "I want to master Unity for creating engaging 2D and 3D games. Teach me Unity engine, C# scripting, physics, animations, UI design, sound integration, and multi-platform deployment. Include complete game development projects.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "GraphQL API Design and Implementation",
        "category": "web-development",
        "subcategory": "api",
        "difficulty": "intermediate",
        "target_audience": "Backend developers modernizing API architecture",
        "estimated_hours": 85,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["API development experience", "JavaScript or Python", "Database knowledge"],
        "learning_outcomes": [
            "Design efficient GraphQL schemas",
            "Implement resolvers and data loaders",
            "Handle authentication and authorization",
            "Optimize queries and prevent N+1 problems",
            "Build real-time subscriptions"
        ],
        "tags": ["graphql", "api", "backend", "schema-design", "resolvers", "subscriptions"],
        "request": {
            "subject": "GraphQL API Development and Best Practices",
            "goal": "I want to master GraphQL for building flexible, efficient APIs. Teach me schema design, resolver implementation, query optimization, authentication, testing, and real-time features. Focus on production-ready GraphQL services.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Terraform Infrastructure as Code",
        "category": "devops",
        "subcategory": "infrastructure",
        "difficulty": "intermediate",
        "target_audience": "DevOps engineers automating infrastructure management",
        "estimated_hours": 95,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Cloud computing basics", "Command line proficiency", "Infrastructure concepts"],
        "learning_outcomes": [
            "Automate infrastructure with Terraform",
            "Design reusable infrastructure modules",
            "Implement infrastructure CI/CD pipelines",
            "Manage state and handle dependencies",
            "Apply security and compliance best practices"
        ],
        "tags": ["terraform", "infrastructure-as-code", "devops", "aws", "azure", "automation"],
        "request": {
            "subject": "Terraform Infrastructure as Code Automation",
            "goal": "I want to master Terraform for automating cloud infrastructure deployment and management. Teach me infrastructure design, module creation, state management, CI/CD integration, and multi-cloud deployments. Include security and best practices.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Spring Boot Java Enterprise Development",
        "category": "web-development",
        "subcategory": "backend",
        "difficulty": "intermediate",
        "target_audience": "Java developers building enterprise applications",
        "estimated_hours": 110,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Java programming", "Object-oriented design", "Database concepts"],
        "learning_outcomes": [
            "Build enterprise applications with Spring Boot",
            "Implement security with Spring Security",
            "Create RESTful APIs and microservices",
            "Handle data with Spring Data JPA",
            "Deploy and monitor Spring applications"
        ],
        "tags": ["spring-boot", "java", "enterprise", "microservices", "rest-api", "jpa"],
        "request": {
            "subject": "Spring Boot Enterprise Java Development",
            "goal": "I want to master Spring Boot for building robust enterprise Java applications. Teach me Spring framework, security, data persistence, testing, microservices architecture, and deployment strategies. Focus on production-ready development.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "MongoDB NoSQL Database Development",
        "category": "database",
        "subcategory": "nosql",
        "difficulty": "beginner",
        "target_audience": "Developers working with document-based databases",
        "estimated_hours": 80,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Basic database concepts", "JSON understanding", "Programming experience"],
        "learning_outcomes": [
            "Design efficient MongoDB schemas",
            "Master aggregation pipelines",
            "Implement indexing and performance optimization",
            "Handle replication and sharding",
            "Integrate MongoDB with applications"
        ],
        "tags": ["mongodb", "nosql", "database", "aggregation", "indexing", "document-database"],
        "request": {
            "subject": "MongoDB NoSQL Database Development and Operations",
            "goal": "I want to master MongoDB for building scalable document-based applications. Teach me schema design, aggregation framework, indexing strategies, replication, sharding, and integration with modern applications. Include performance optimization.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Angular Enterprise Application Development",
        "category": "web-development",
        "subcategory": "frontend",
        "difficulty": "intermediate",
        "target_audience": "Enterprise developers building large-scale Angular applications",
        "estimated_hours": 105,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["TypeScript", "JavaScript ES6+", "Web development basics"],
        "learning_outcomes": [
            "Build scalable Angular applications",
            "Master Angular architecture and patterns",
            "Implement state management with NgRx",
            "Create reusable component libraries",
            "Optimize performance and bundle sizes"
        ],
        "tags": ["angular", "typescript", "enterprise", "ngrx", "components", "frontend"],
        "request": {
            "subject": "Angular Enterprise Application Development",
            "goal": "I want to master Angular for building large-scale enterprise applications. Teach me Angular architecture, component design, state management, testing, performance optimization, and enterprise patterns. Focus on maintainable, scalable applications.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Redis Caching and Data Structures",
        "category": "database",
        "subcategory": "caching",
        "difficulty": "intermediate",
        "target_audience": "Backend developers optimizing application performance",
        "estimated_hours": 70,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.6,
        "prerequisites": ["Backend development experience", "Database knowledge", "Performance concepts"],
        "learning_outcomes": [
            "Implement caching strategies with Redis",
            "Master Redis data structures and commands",
            "Build real-time features with pub/sub",
            "Handle session management and queues",
            "Monitor and optimize Redis performance"
        ],
        "tags": ["redis", "caching", "performance", "data-structures", "session-management"],
        "request": {
            "subject": "Redis Caching and High-Performance Data Structures",
            "goal": "I want to master Redis for building high-performance, scalable applications. Teach me caching strategies, data structures, pub/sub messaging, session management, and performance optimization. Include real-world use cases and patterns.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Swift iOS App Development",
        "category": "mobile-development",
        "subcategory": "ios",
        "difficulty": "beginner",
        "target_audience": "Developers wanting to create native iOS applications",
        "estimated_hours": 115,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Programming fundamentals", "Object-oriented concepts", "Mac development environment"],
        "learning_outcomes": [
            "Build native iOS apps with Swift",
            "Master UIKit and SwiftUI frameworks",
            "Implement Core Data and networking",
            "Handle app lifecycle and performance",
            "Publish apps to the App Store"
        ],
        "tags": ["swift", "ios", "mobile-development", "uikit", "swiftui", "app-store"],
        "request": {
            "subject": "Swift iOS Native App Development",
            "goal": "I want to master Swift for building high-quality iOS applications. Teach me Swift language, UIKit, SwiftUI, Core Data, networking, testing, and App Store deployment. Include complete app development projects and best practices.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Elasticsearch Search and Analytics",
        "category": "data-engineering",
        "subcategory": "search",
        "difficulty": "intermediate",
        "target_audience": "Developers building search and analytics systems",
        "estimated_hours": 90,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Database concepts", "JSON understanding", "Basic networking"],
        "learning_outcomes": [
            "Build powerful search engines with Elasticsearch",
            "Implement full-text search and analytics",
            "Design optimal index mappings",
            "Create complex aggregations and visualizations",
            "Monitor and scale Elasticsearch clusters"
        ],
        "tags": ["elasticsearch", "search", "analytics", "full-text-search", "aggregations"],
        "request": {
            "subject": "Elasticsearch Search Engine and Analytics Platform",
            "goal": "I want to master Elasticsearch for building sophisticated search and analytics systems. Teach me indexing, querying, aggregations, cluster management, performance optimization, and integration with applications. Include real-world search scenarios.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Kotlin Android Development",
        "category": "mobile-development",
        "subcategory": "android",
        "difficulty": "beginner",
        "target_audience": "Developers creating native Android applications",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Programming basics", "Object-oriented programming", "Android Studio setup"],
        "learning_outcomes": [
            "Build native Android apps with Kotlin",
            "Master Android architecture components",
            "Implement Material Design principles",
            "Handle data persistence and networking",
            "Publish apps to Google Play Store"
        ],
        "tags": ["kotlin", "android", "mobile-development", "material-design", "architecture-components"],
        "request": {
            "subject": "Kotlin Android Native App Development",
            "goal": "I want to master Kotlin for building modern Android applications. Teach me Kotlin language, Android architecture, UI design, data management, testing, and Play Store deployment. Focus on modern development practices and user experience.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Docker Containerization Mastery",
        "category": "devops",
        "subcategory": "containerization",
        "difficulty": "beginner",
        "target_audience": "Developers and DevOps engineers adopting containerization",
        "estimated_hours": 75,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Command line basics", "Software development experience", "Linux fundamentals"],
        "learning_outcomes": [
            "Master Docker containers and images",
            "Create optimized Dockerfiles",
            "Implement multi-container applications",
            "Handle networking and volumes",
            "Deploy containers in production"
        ],
        "tags": ["docker", "containerization", "devops", "deployment", "microservices"],
        "request": {
            "subject": "Docker Containerization for Modern Applications",
            "goal": "I want to master Docker for containerizing and deploying modern applications. Teach me container creation, image optimization, docker-compose, networking, storage, security, and production deployment strategies. Include best practices.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "TypeScript Advanced Programming",
        "category": "programming-languages",
        "subcategory": "javascript",
        "difficulty": "intermediate",
        "target_audience": "JavaScript developers wanting to master TypeScript",
        "estimated_hours": 85,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Strong JavaScript knowledge", "ES6+ features", "Object-oriented programming"],
        "learning_outcomes": [
            "Master advanced TypeScript features",
            "Design type-safe applications",
            "Implement generic programming patterns",
            "Create declaration files and type definitions",
            "Migrate JavaScript projects to TypeScript"
        ],
        "tags": ["typescript", "javascript", "type-safety", "generics", "advanced-programming"],
        "request": {
            "subject": "TypeScript Advanced Programming and Type Safety",
            "goal": "I want to master advanced TypeScript for building robust, type-safe applications. Teach me advanced types, generics, decorators, modules, compilation, tooling, and migration strategies. Focus on enterprise-level TypeScript development.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "MERN Stack Full Development",
        "category": "web-development",
        "subcategory": "fullstack",
        "difficulty": "intermediate",
        "target_audience": "Full-stack developers mastering the MERN technology stack",
        "estimated_hours": 125,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["JavaScript/ES6+", "React basics", "Node.js fundamentals"],
        "learning_outcomes": [
            "Build complete MERN stack applications",
            "Master MongoDB, Express, React, and Node.js",
            "Implement authentication and authorization",
            "Create real-time features and deployment",
            "Handle state management and API integration"
        ],
        "tags": ["mern", "mongodb", "express", "react", "nodejs", "fullstack"],
        "request": {
            "subject": "MERN Stack Complete Full-Stack Development",
            "goal": "I want to master the MERN stack for building modern full-stack web applications. Teach me MongoDB, Express.js, React, Node.js integration, authentication, real-time features, testing, and deployment. Include complete project development.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Jenkins CI/CD Pipeline Automation",
        "category": "devops",
        "subcategory": "ci-cd",
        "difficulty": "intermediate",
        "target_audience": "DevOps engineers implementing continuous integration",
        "estimated_hours": 85,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Software development lifecycle", "Version control (Git)", "Basic scripting"],
        "learning_outcomes": [
            "Design automated CI/CD pipelines",
            "Master Jenkins configuration and plugins",
            "Implement testing and deployment automation",
            "Handle pipeline security and monitoring",
            "Integrate with various development tools"
        ],
        "tags": ["jenkins", "ci-cd", "automation", "devops", "pipelines", "deployment"],
        "request": {
            "subject": "Jenkins CI/CD Pipeline Automation and DevOps",
            "goal": "I want to master Jenkins for creating robust CI/CD pipelines and automation workflows. Teach me Jenkins setup, pipeline creation, plugin management, testing integration, deployment automation, and best practices for DevOps workflows.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Microservices Architecture Patterns",
        "category": "system-design",
        "subcategory": "microservices",
        "difficulty": "advanced",
        "target_audience": "Senior developers designing distributed microservice systems",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Distributed systems knowledge", "API design experience", "Container technology"],
        "learning_outcomes": [
            "Design microservices architectures",
            "Implement service communication patterns",
            "Handle distributed data management",
            "Apply monitoring and observability",
            "Manage service deployment and scaling"
        ],
        "tags": ["microservices", "architecture", "distributed-systems", "api-design", "observability"],
        "request": {
            "subject": "Microservices Architecture Design and Implementation",
            "goal": "I want to master microservices architecture for building scalable, distributed systems. Teach me service design, communication patterns, data management, deployment strategies, monitoring, and fault tolerance. Include real-world architecture patterns.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Data Science with R Programming",
        "category": "data-science",
        "subcategory": "r-programming",
        "difficulty": "beginner",
        "target_audience": "Analysts and researchers using R for data science",
        "estimated_hours": 100,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Basic statistics", "Mathematical thinking", "Programming concepts"],
        "learning_outcomes": [
            "Master R programming for data analysis",
            "Create statistical models and visualizations",
            "Handle data manipulation with dplyr and tidyr",
            "Build interactive dashboards with Shiny",
            "Conduct reproducible research workflows"
        ],
        "tags": ["r-programming", "data-science", "statistics", "visualization", "shiny"],
        "request": {
            "subject": "R Programming for Data Science and Statistical Analysis",
            "goal": "I want to master R for data science, statistical analysis, and visualization. Teach me R fundamentals, data manipulation, statistical modeling, visualization with ggplot2, and interactive applications with Shiny. Include real-world data projects.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Tailwind CSS Utility-First Design",
        "category": "web-development",
        "subcategory": "css",
        "difficulty": "beginner",
        "target_audience": "Frontend developers adopting utility-first CSS approach",
        "estimated_hours": 60,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.5,
        "prerequisites": ["HTML/CSS basics", "Responsive design concepts", "Component thinking"],
        "learning_outcomes": [
            "Master Tailwind CSS utility classes",
            "Build responsive designs efficiently",
            "Create custom design systems",
            "Optimize for production bundle sizes",
            "Integrate with modern frameworks"
        ],
        "tags": ["tailwind-css", "css", "utility-first", "responsive-design", "frontend"],
        "request": {
            "subject": "Tailwind CSS Utility-First Design System",
            "goal": "I want to master Tailwind CSS for building beautiful, responsive web interfaces efficiently. Teach me utility classes, responsive design, customization, component extraction, and integration with React/Vue. Focus on modern design workflows.",
            "time_value": 5,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    }
]

# 37 Advanced & Emerging Technology Roadmaps - Third Batch
ADVANCED_PREMIUM_ROADMAPS = [
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
        "title": "Computer Vision with OpenCV and Deep Learning",
        "category": "artificial-intelligence",
        "subcategory": "computer-vision",
        "difficulty": "intermediate",
        "target_audience": "Developers building image processing and computer vision applications",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Python programming", "Basic linear algebra", "Image processing concepts"],
        "learning_outcomes": [
            "Process and analyze images with OpenCV",
            "Build object detection and facial recognition systems",
            "Implement deep learning for computer vision",
            "Create real-time video processing applications",
            "Deploy computer vision models in production"
        ],
        "tags": ["opencv", "computer-vision", "deep-learning", "image-processing", "object-detection"],
        "request": {
            "subject": "Computer Vision with OpenCV and Deep Learning",
            "goal": "I want to master computer vision using OpenCV and deep learning. Teach me image processing, object detection, facial recognition, video analysis, and deploying computer vision applications. Include hands-on projects with real-world datasets.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "MLOps and Machine Learning Deployment",
        "category": "artificial-intelligence",
        "subcategory": "mlops",
        "difficulty": "advanced",
        "target_audience": "ML engineers wanting to deploy and maintain ML systems in production",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["Machine learning experience", "Docker", "CI/CD basics", "Cloud platforms"],
        "learning_outcomes": [
            "Design end-to-end MLOps pipelines",
            "Implement model monitoring and drift detection",
            "Automate ML workflows with MLflow and Kubeflow",
            "Deploy models with Docker and Kubernetes",
            "Manage model versioning and A/B testing"
        ],
        "tags": ["mlops", "mlflow", "kubeflow", "model-deployment", "monitoring", "automation"],
        "request": {
            "subject": "MLOps and Production Machine Learning Systems",
            "goal": "I want to master MLOps for deploying ML systems in production. Teach me CI/CD for ML, model monitoring, drift detection, automated retraining, containerization, and scaling ML infrastructure. Focus on enterprise-level practices.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Microsoft Azure Solutions Architect Expert",
        "category": "cloud-computing",
        "subcategory": "azure",
        "difficulty": "advanced",
        "target_audience": "Cloud architects preparing for Azure certification and enterprise solutions",
        "estimated_hours": 150,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Cloud computing basics", "Azure fundamentals", "System design experience"],
        "learning_outcomes": [
            "Design enterprise Azure architectures",
            "Pass Azure Solutions Architect Expert certification",
            "Implement hybrid and multi-cloud solutions",
            "Master Azure security and governance",
            "Optimize costs and performance in Azure"
        ],
        "tags": ["azure", "microsoft-cloud", "certification", "enterprise-architecture", "hybrid-cloud"],
        "request": {
            "subject": "Microsoft Azure Solutions Architect Expert Certification",
            "goal": "I want to become an Azure Solutions Architect Expert and pass the certification. Teach me advanced Azure services, enterprise architecture patterns, hybrid cloud, security, governance, and cost optimization. Include hands-on labs and real scenarios.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Multi-Cloud Architecture and Strategy",
        "category": "cloud-computing",
        "subcategory": "multi-cloud",
        "difficulty": "advanced",
        "target_audience": "Enterprise architects designing multi-cloud and hybrid cloud solutions",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["AWS/Azure/GCP experience", "Enterprise architecture", "Networking knowledge"],
        "learning_outcomes": [
            "Design multi-cloud architectures across AWS, Azure, GCP",
            "Implement cloud-agnostic solutions",
            "Master hybrid cloud connectivity and networking",
            "Handle multi-cloud security and compliance",
            "Optimize costs across multiple cloud providers"
        ],
        "tags": ["multi-cloud", "hybrid-cloud", "aws", "azure", "gcp", "cloud-strategy"],
        "request": {
            "subject": "Multi-Cloud Architecture and Enterprise Strategy",
            "goal": "I want to master multi-cloud architecture across AWS, Azure, and GCP. Teach me cloud-agnostic design, hybrid connectivity, multi-cloud security, cost optimization, and vendor management. Include enterprise case studies and best practices.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Site Reliability Engineering (SRE) Practices",
        "category": "devops",
        "subcategory": "sre",
        "difficulty": "advanced",
        "target_audience": "Engineers implementing Google's SRE practices for reliable systems",
        "estimated_hours": 125,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["System administration", "DevOps experience", "Monitoring tools", "Programming skills"],
        "learning_outcomes": [
            "Implement Google's SRE practices and principles",
            "Design and maintain SLIs, SLOs, and error budgets",
            "Build robust monitoring and alerting systems",
            "Conduct effective incident response and postmortems",
            "Automate toil and improve system reliability"
        ],
        "tags": ["sre", "reliability", "monitoring", "incident-response", "sli-slo", "automation"],
        "request": {
            "subject": "Site Reliability Engineering and System Reliability",
            "goal": "I want to master Site Reliability Engineering practices. Teach me SLIs, SLOs, error budgets, monitoring, alerting, incident response, postmortems, and automation. Include Google's SRE principles and real-world implementation strategies.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Bug Bounty Hunting and Ethical Hacking",
        "category": "cybersecurity",
        "subcategory": "ethical-hacking",
        "difficulty": "intermediate",
        "target_audience": "Security enthusiasts wanting to find vulnerabilities and earn bounties",
        "estimated_hours": 115,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Networking basics", "Web application knowledge", "Linux command line"],
        "learning_outcomes": [
            "Identify and exploit common web vulnerabilities",
            "Use professional penetration testing tools",
            "Write effective vulnerability reports",
            "Navigate bug bounty platforms and programs",
            "Build a successful bug bounty career"
        ],
        "tags": ["bug-bounty", "ethical-hacking", "penetration-testing", "vulnerability-assessment", "security"],
        "request": {
            "subject": "Bug Bounty Hunting and Ethical Penetration Testing",
            "goal": "I want to become a successful bug bounty hunter and ethical hacker. Teach me vulnerability assessment, penetration testing tools, exploit development, report writing, and bug bounty strategies. Include hands-on practice with legal targets.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Cloud Security Architecture",
        "category": "cybersecurity",
        "subcategory": "cloud-security",
        "difficulty": "advanced",
        "target_audience": "Security architects specializing in cloud security across major platforms",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Cloud platforms experience", "Security fundamentals", "Identity management"],
        "learning_outcomes": [
            "Secure cloud architectures across AWS, Azure, GCP",
            "Implement zero-trust security models",
            "Master cloud identity and access management",
            "Design compliance frameworks for cloud",
            "Respond to cloud security incidents"
        ],
        "tags": ["cloud-security", "zero-trust", "iam", "compliance", "incident-response"],
        "request": {
            "subject": "Cloud Security Architecture and Zero-Trust Implementation",
            "goal": "I want to master cloud security across AWS, Azure, and GCP. Teach me zero-trust architecture, identity management, compliance, threat detection, incident response, and security automation. Focus on enterprise security practices.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "T3 Stack Development (Next.js + tRPC + Prisma)",
        "category": "web-development",
        "subcategory": "fullstack",
        "difficulty": "intermediate",
        "target_audience": "Full-stack developers building modern, type-safe web applications",
        "estimated_hours": 95,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["React/Next.js", "TypeScript", "Database concepts"],
        "learning_outcomes": [
            "Build full-stack applications with T3 stack",
            "Implement type-safe APIs with tRPC",
            "Design databases with Prisma ORM",
            "Deploy T3 applications to production",
            "Optimize performance and scalability"
        ],
        "tags": ["t3-stack", "nextjs", "trpc", "prisma", "typescript", "fullstack"],
        "request": {
            "subject": "T3 Stack Modern Full-Stack Development",
            "goal": "I want to master the T3 stack for building modern, type-safe full-stack applications. Teach me Next.js App Router, tRPC APIs, Prisma database management, authentication, and deployment. Focus on best practices and scalability.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Supabase Backend Development",
        "category": "web-development",
        "subcategory": "backend",
        "difficulty": "beginner",
        "target_audience": "Developers building modern backends with Supabase as Firebase alternative",
        "estimated_hours": 80,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["JavaScript/TypeScript", "SQL basics", "Web development fundamentals"],
        "learning_outcomes": [
            "Build scalable backends with Supabase",
            "Implement authentication and authorization",
            "Design PostgreSQL databases with Supabase",
            "Create real-time applications",
            "Deploy and scale Supabase applications"
        ],
        "tags": ["supabase", "postgresql", "backend", "authentication", "real-time", "serverless"],
        "request": {
            "subject": "Supabase Backend Development and PostgreSQL",
            "goal": "I want to master Supabase for building modern backend applications. Teach me database design, authentication, real-time subscriptions, edge functions, storage, and deployment. Focus on building production-ready applications with best practices.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Technical Writing and Developer Relations",
        "category": "career-development",
        "subcategory": "technical-writing",
        "difficulty": "beginner",
        "target_audience": "Developers wanting to excel in technical communication and developer advocacy",
        "estimated_hours": 70,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Programming experience", "Communication skills", "Basic marketing knowledge"],
        "learning_outcomes": [
            "Write clear technical documentation and tutorials",
            "Build personal brand and thought leadership",
            "Create engaging developer content",
            "Master technical blogging and speaking",
            "Develop developer advocacy skills"
        ],
        "tags": ["technical-writing", "developer-relations", "documentation", "content-creation", "advocacy"],
        "request": {
            "subject": "Technical Writing and Developer Relations Career",
            "goal": "I want to excel in technical writing and developer relations. Teach me documentation best practices, content creation, technical blogging, community building, developer advocacy, and building a personal brand in tech.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Engineering Management and Tech Leadership",
        "category": "career-development",
        "subcategory": "management",
        "difficulty": "advanced",
        "target_audience": "Senior engineers transitioning to engineering management roles",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Senior engineering experience", "Team collaboration", "Project management basics"],
        "learning_outcomes": [
            "Lead and mentor engineering teams effectively",
            "Master engineering project management",
            "Handle technical decision-making and architecture",
            "Develop people management and coaching skills",
            "Build high-performing engineering cultures"
        ],
        "tags": ["engineering-management", "tech-leadership", "team-management", "mentoring", "culture"],
        "request": {
            "subject": "Engineering Management and Technical Leadership",
            "goal": "I want to transition from senior engineer to engineering manager. Teach me team leadership, people management, technical decision-making, project management, coaching, performance reviews, and building engineering culture.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Quantum Computing Fundamentals",
        "category": "emerging-technology",
        "subcategory": "quantum-computing",
        "difficulty": "advanced",
        "target_audience": "Researchers and developers exploring quantum computing applications",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Linear algebra", "Python programming", "Physics basics", "Complex numbers"],
        "learning_outcomes": [
            "Understand quantum computing principles and algorithms",
            "Program quantum circuits with Qiskit and Cirq",
            "Implement quantum algorithms (Shor's, Grover's)",
            "Explore quantum machine learning applications",
            "Access and use quantum cloud platforms"
        ],
        "tags": ["quantum-computing", "qiskit", "quantum-algorithms", "quantum-ml", "physics"],
        "request": {
            "subject": "Quantum Computing Programming and Algorithms",
            "goal": "I want to learn quantum computing fundamentals and programming. Teach me quantum mechanics basics, quantum algorithms, Qiskit programming, quantum machine learning, and practical applications. Include hands-on quantum circuit development.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Web3 and DeFi Protocol Development",
        "category": "blockchain",
        "subcategory": "defi",
        "difficulty": "advanced",
        "target_audience": "Blockchain developers building DeFi protocols and Web3 applications",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Solidity programming", "Blockchain fundamentals", "Finance basics"],
        "learning_outcomes": [
            "Build DeFi protocols and yield farming applications",
            "Implement AMMs, lending protocols, and DAOs",
            "Master Web3 frontend development",
            "Understand tokenomics and protocol design",
            "Deploy and audit DeFi smart contracts"
        ],
        "tags": ["web3", "defi", "protocol-development", "amm", "dao", "tokenomics"],
        "request": {
            "subject": "Web3 DeFi Protocol Development and Tokenomics",
            "goal": "I want to master Web3 and DeFi development beyond basic smart contracts. Teach me protocol design, AMMs, lending platforms, DAOs, tokenomics, Web3 frontends, and security auditing. Include real DeFi protocol case studies.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Game Development with Unreal Engine",
        "category": "game-development",
        "subcategory": "unreal-engine",
        "difficulty": "intermediate",
        "target_audience": "Game developers creating AAA-quality games with Unreal Engine",
        "estimated_hours": 135,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["C++ programming", "3D graphics concepts", "Game design basics"],
        "learning_outcomes": [
            "Build 3D games with Unreal Engine 5",
            "Master Blueprint visual scripting and C++",
            "Implement advanced graphics and lighting",
            "Create multiplayer and networking systems",
            "Optimize games for different platforms"
        ],
        "tags": ["unreal-engine", "cpp", "3d-graphics", "blueprints", "multiplayer", "optimization"],
        "request": {
            "subject": "Unreal Engine 5 Game Development with C++",
            "goal": "I want to master Unreal Engine 5 for creating professional-quality games. Teach me Blueprint scripting, C++ programming, graphics rendering, multiplayer networking, AI systems, and platform optimization. Include complete game development projects.",
            "time_value": 11,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "AR/VR Development for Immersive Experiences",
        "category": "emerging-technology",
        "subcategory": "ar-vr",
        "difficulty": "intermediate",
        "target_audience": "Developers building augmented and virtual reality applications",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Unity or Unreal Engine", "3D mathematics", "Mobile development"],
        "learning_outcomes": [
            "Develop AR applications for mobile and web",
            "Create immersive VR experiences",
            "Master spatial computing and hand tracking",
            "Implement 3D user interfaces and interactions",
            "Deploy AR/VR apps to various platforms"
        ],
        "tags": ["ar", "vr", "unity", "spatial-computing", "immersive-tech", "3d-interfaces"],
        "request": {
            "subject": "AR/VR Development and Immersive Technology",
            "goal": "I want to master AR/VR development for creating immersive experiences. Teach me Unity/Unreal for AR/VR, spatial computing, hand tracking, 3D UI design, performance optimization, and platform deployment. Include practical AR/VR projects.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Modern Data Stack Engineering",
        "category": "data-engineering",
        "subcategory": "modern-data-stack",
        "difficulty": "intermediate",
        "target_audience": "Data engineers building modern data platforms and analytics systems",
        "estimated_hours": 115,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["SQL proficiency", "Python programming", "Data modeling concepts"],
        "learning_outcomes": [
            "Build data pipelines with DBT and Airflow",
            "Implement data warehousing with Snowflake",
            "Master data ingestion with Fivetran and Airbyte",
            "Create analytics and visualization dashboards",
            "Design scalable data architecture"
        ],
        "tags": ["modern-data-stack", "dbt", "snowflake", "fivetran", "airflow", "data-engineering"],
        "request": {
            "subject": "Modern Data Stack Engineering and Analytics",
            "goal": "I want to master the modern data stack for building scalable data platforms. Teach me DBT transformations, Snowflake data warehousing, data ingestion tools, orchestration, monitoring, and analytics. Focus on enterprise data engineering practices.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Real-time Data Processing with Apache Flink",
        "category": "data-engineering",
        "subcategory": "streaming",
        "difficulty": "advanced",
        "target_audience": "Data engineers building real-time streaming and event processing systems",
        "estimated_hours": 105,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Java or Scala", "Distributed systems", "Stream processing concepts"],
        "learning_outcomes": [
            "Build real-time data processing with Apache Flink",
            "Implement complex event processing patterns",
            "Handle stateful stream processing",
            "Integrate with Kafka and other data sources",
            "Deploy and monitor Flink applications"
        ],
        "tags": ["apache-flink", "stream-processing", "real-time-analytics", "event-processing", "kafka"],
        "request": {
            "subject": "Apache Flink Real-time Stream Processing",
            "goal": "I want to master Apache Flink for real-time data processing and analytics. Teach me stream processing concepts, stateful computations, complex event processing, watermarks, checkpointing, and production deployment. Include practical streaming projects.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Advanced Git and Enterprise DevOps Workflows",
        "category": "devops",
        "subcategory": "version-control",
        "difficulty": "intermediate",
        "target_audience": "Developers mastering advanced Git and enterprise development workflows",
        "estimated_hours": 75,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Basic Git knowledge", "Command line proficiency", "Team development experience"],
        "learning_outcomes": [
            "Master advanced Git commands and workflows",
            "Implement GitOps and Infrastructure as Code",
            "Design branching strategies for large teams",
            "Handle complex merge conflicts and history rewriting",
            "Automate Git workflows with hooks and CI/CD"
        ],
        "tags": ["git", "gitops", "branching-strategy", "workflow-automation", "enterprise-development"],
        "request": {
            "subject": "Advanced Git and Enterprise Development Workflows",
            "goal": "I want to master advanced Git techniques and enterprise development workflows. Teach me complex Git operations, branching strategies, GitOps, automated workflows, code review processes, and team collaboration best practices.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "API Design and Developer Experience",
        "category": "web-development",
        "subcategory": "api-design",
        "difficulty": "intermediate",
        "target_audience": "Backend developers and API architects focusing on developer experience",
        "estimated_hours": 90,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["REST API experience", "Web development", "API documentation tools"],
        "learning_outcomes": [
            "Design intuitive and developer-friendly APIs",
            "Master OpenAPI specification and documentation",
            "Implement API versioning and backward compatibility",
            "Build comprehensive API testing strategies",
            "Create exceptional developer onboarding experiences"
        ],
        "tags": ["api-design", "openapi", "developer-experience", "api-documentation", "testing"],
        "request": {
            "subject": "API Design and Developer Experience Optimization",
            "goal": "I want to master API design for exceptional developer experience. Teach me REST/GraphQL best practices, OpenAPI documentation, versioning, testing, monitoring, and developer onboarding. Focus on building APIs developers love to use.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Comprehensive Testing Strategy and Automation",
        "category": "software-testing",
        "subcategory": "test-automation",
        "difficulty": "intermediate",
        "target_audience": "Developers and QA engineers implementing comprehensive testing strategies",
        "estimated_hours": 85,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Programming experience", "Web development", "Testing frameworks basics"],
        "learning_outcomes": [
            "Design comprehensive testing pyramids",
            "Implement unit, integration, and E2E testing",
            "Master test automation with Cypress and Playwright",
            "Build performance and security testing",
            "Create maintainable test suites and CI/CD integration"
        ],
        "tags": ["testing", "test-automation", "cypress", "playwright", "tdd", "quality-assurance"],
        "request": {
            "subject": "Comprehensive Testing Strategy and Test Automation",
            "goal": "I want to master testing strategies and automation for high-quality software. Teach me testing pyramids, unit/integration/E2E testing, test automation tools, performance testing, security testing, and CI/CD integration.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Web Performance Optimization Mastery",
        "category": "web-development",
        "subcategory": "performance",
        "difficulty": "advanced",
        "target_audience": "Frontend developers optimizing web application performance",
        "estimated_hours": 95,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["JavaScript proficiency", "Web development", "Browser DevTools"],
        "learning_outcomes": [
            "Optimize Core Web Vitals and user experience",
            "Implement advanced caching strategies",
            "Master bundle optimization and code splitting",
            "Optimize images, fonts, and static assets",
            "Monitor and analyze real user performance"
        ],
        "tags": ["web-performance", "core-web-vitals", "optimization", "caching", "monitoring"],
        "request": {
            "subject": "Web Performance Optimization and Core Web Vitals",
            "goal": "I want to master web performance optimization for lightning-fast applications. Teach me Core Web Vitals, bundle optimization, caching strategies, image optimization, performance monitoring, and user experience improvements.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Jamstack Architecture and Headless CMS",
        "category": "web-development",
        "subcategory": "jamstack",
        "difficulty": "intermediate",
        "target_audience": "Frontend developers building modern Jamstack applications",
        "estimated_hours": 80,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["React/Vue.js", "Static site generators", "API integration"],
        "learning_outcomes": [
            "Build scalable Jamstack applications",
            "Integrate headless CMS solutions",
            "Implement static site generation and ISR",
            "Master CDN and edge computing strategies",
            "Deploy and scale Jamstack sites"
        ],
        "tags": ["jamstack", "headless-cms", "static-site-generation", "cdn", "edge-computing"],
        "request": {
            "subject": "Jamstack Architecture and Headless CMS Development",
            "goal": "I want to master Jamstack architecture for building fast, scalable websites. Teach me static site generation, headless CMS integration, edge computing, CDN optimization, and modern deployment strategies. Include practical Jamstack projects.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Progressive Web Apps (PWA) Development",
        "category": "web-development",
        "subcategory": "pwa",
        "difficulty": "intermediate",
        "target_audience": "Web developers building app-like experiences with web technologies",
        "estimated_hours": 85,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["JavaScript", "Web APIs", "Service Workers basics"],
        "learning_outcomes": [
            "Build offline-first Progressive Web Apps",
            "Implement service workers and caching strategies",
            "Create app-like user experiences",
            "Handle push notifications and background sync",
            "Deploy PWAs to app stores"
        ],
        "tags": ["pwa", "service-workers", "offline-first", "web-apis", "app-like-experience"],
        "request": {
            "subject": "Progressive Web Apps and Offline-First Development",
            "goal": "I want to master PWA development for creating app-like web experiences. Teach me service workers, caching strategies, offline functionality, push notifications, background sync, and app store deployment.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "WebAssembly for High-Performance Web Apps",
        "category": "web-development",
        "subcategory": "webassembly",
        "difficulty": "advanced",
        "target_audience": "Developers building high-performance web applications with WebAssembly",
        "estimated_hours": 100,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.6,
        "prerequisites": ["C/C++ or Rust", "JavaScript", "Web development", "Performance concepts"],
        "learning_outcomes": [
            "Compile native code to WebAssembly",
            "Integrate WASM modules with JavaScript",
            "Optimize performance-critical web applications",
            "Build games and multimedia apps with WASM",
            "Debug and profile WebAssembly applications"
        ],
        "tags": ["webassembly", "wasm", "high-performance", "native-code", "optimization"],
        "request": {
            "subject": "WebAssembly High-Performance Web Development",
            "goal": "I want to master WebAssembly for building high-performance web applications. Teach me compiling C/C++/Rust to WASM, JavaScript integration, performance optimization, memory management, and real-world WASM applications.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "IoT and Edge Computing Development",
        "category": "emerging-technology",
        "subcategory": "iot",
        "difficulty": "intermediate",
        "target_audience": "Developers building IoT systems and edge computing applications",
        "estimated_hours": 110,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 8.9,
        "prerequisites": ["Programming basics", "Networking concepts", "Hardware understanding"],
        "learning_outcomes": [
            "Build IoT systems with Raspberry Pi and Arduino",
            "Implement edge computing and data processing",
            "Handle IoT communication protocols (MQTT, CoAP)",
            "Manage IoT security and device management",
            "Deploy scalable IoT architectures"
        ],
        "tags": ["iot", "edge-computing", "raspberry-pi", "arduino", "mqtt", "sensor-data"],
        "request": {
            "subject": "IoT and Edge Computing System Development",
            "goal": "I want to master IoT and edge computing for building connected systems. Teach me sensor programming, edge processing, communication protocols, cloud integration, security, and scalable IoT architectures. Include hands-on hardware projects.",
            "time_value": 9,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Business Intelligence with Power BI",
        "category": "data-science",
        "subcategory": "business-intelligence",
        "difficulty": "beginner",
        "target_audience": "Business analysts and data professionals creating enterprise dashboards",
        "estimated_hours": 75,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.6,
        "prerequisites": ["Data analysis basics", "SQL knowledge", "Business domain understanding"],
        "learning_outcomes": [
            "Create interactive Power BI dashboards",
            "Master DAX formulas and data modeling",
            "Implement enterprise reporting solutions",
            "Design self-service analytics platforms",
            "Deploy and manage Power BI at scale"
        ],
        "tags": ["power-bi", "business-intelligence", "dax", "data-modeling", "enterprise-reporting"],
        "request": {
            "subject": "Power BI Business Intelligence and Enterprise Reporting",
            "goal": "I want to master Power BI for creating enterprise business intelligence solutions. Teach me dashboard design, DAX formulas, data modeling, report automation, user management, and enterprise deployment strategies.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Startup CTO and Technical Leadership",
        "category": "career-development",
        "subcategory": "cto",
        "difficulty": "advanced",
        "target_audience": "Senior engineers aspiring to CTO roles and technical leadership",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["Senior engineering experience", "Architecture knowledge", "Business understanding"],
        "learning_outcomes": [
            "Lead technical strategy and architecture decisions",
            "Build and scale engineering teams",
            "Manage technical debt and system evolution",
            "Navigate startup growth and technical challenges",
            "Communicate effectively with stakeholders"
        ],
        "tags": ["cto", "technical-leadership", "startup", "team-building", "strategy"],
        "request": {
            "subject": "Startup CTO and Technical Leadership Excellence",
            "goal": "I want to become a successful startup CTO and technical leader. Teach me technical strategy, team building, architecture decisions, stakeholder communication, scaling challenges, and building engineering culture in fast-growing companies.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Freelancing and Independent Consulting for Developers",
        "category": "career-development",
        "subcategory": "freelancing",
        "difficulty": "beginner",
        "target_audience": "Developers wanting to build successful freelancing and consulting careers",
        "estimated_hours": 85,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Programming skills", "Communication abilities", "Basic business knowledge"],
        "learning_outcomes": [
            "Build a successful freelancing business",
            "Master client acquisition and relationship management",
            "Price services and negotiate contracts effectively",
            "Manage projects and deliver value consistently",
            "Scale from freelancing to consulting agency"
        ],
        "tags": ["freelancing", "consulting", "client-management", "pricing", "business-development"],
        "request": {
            "subject": "Freelancing and Independent Consulting for Developers",
            "goal": "I want to build a successful freelancing and consulting career as a developer. Teach me client acquisition, pricing strategies, contract negotiation, project management, value delivery, and scaling to a consulting business.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Reinforcement Learning and AI Agents",
        "category": "artificial-intelligence",
        "subcategory": "reinforcement-learning",
        "difficulty": "advanced",
        "target_audience": "ML researchers and developers building intelligent agents",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["Deep learning", "Python programming", "Mathematics (calculus, statistics)"],
        "learning_outcomes": [
            "Implement Q-learning and policy gradient algorithms",
            "Build game-playing AI agents",
            "Master multi-agent reinforcement learning",
            "Apply RL to real-world optimization problems",
            "Deploy and scale reinforcement learning systems"
        ],
        "tags": ["reinforcement-learning", "ai-agents", "q-learning", "policy-gradients", "multi-agent"],
        "request": {
            "subject": "Reinforcement Learning and Intelligent AI Agents",
            "goal": "I want to master reinforcement learning for building intelligent AI agents. Teach me RL algorithms, Q-learning, policy gradients, multi-agent systems, game AI, robotics applications, and real-world deployment strategies.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "SOC Analyst and Security Operations",
        "category": "cybersecurity",
        "subcategory": "soc",
        "difficulty": "intermediate",
        "target_audience": "Security professionals working in Security Operations Centers",
        "estimated_hours": 100,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["Networking fundamentals", "Security basics", "Log analysis"],
        "learning_outcomes": [
            "Monitor and analyze security events effectively",
            "Use SIEM tools and threat intelligence platforms",
            "Conduct incident response and threat hunting",
            "Implement security automation and orchestration",
            "Build comprehensive security monitoring programs"
        ],
        "tags": ["soc-analyst", "siem", "threat-hunting", "incident-response", "security-monitoring"],
        "request": {
            "subject": "SOC Analyst and Security Operations Excellence",
            "goal": "I want to excel as a SOC analyst and security operations professional. Teach me SIEM management, log analysis, threat hunting, incident response, security automation, and building effective security operations programs.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Incident Response and Digital Forensics",
        "category": "cybersecurity",
        "subcategory": "incident-response",
        "difficulty": "advanced",
        "target_audience": "Security professionals specializing in incident response and forensics",
        "estimated_hours": 125,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["Security fundamentals", "System administration", "Legal knowledge basics"],
        "learning_outcomes": [
            "Lead cybersecurity incident response teams",
            "Conduct digital forensics investigations",
            "Preserve and analyze digital evidence",
            "Handle legal and compliance requirements",
            "Build incident response capabilities"
        ],
        "tags": ["incident-response", "digital-forensics", "evidence-analysis", "cybersecurity", "investigation"],
        "request": {
            "subject": "Cybersecurity Incident Response and Digital Forensics",
            "goal": "I want to master incident response and digital forensics for cybersecurity investigations. Teach me forensics tools, evidence preservation, malware analysis, legal procedures, team coordination, and building incident response programs.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Remix Full-Stack Web Framework",
        "category": "web-development",
        "subcategory": "fullstack",
        "difficulty": "intermediate",
        "target_audience": "React developers wanting to build full-stack web applications with Remix",
        "estimated_hours": 90,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.8,
        "prerequisites": ["React experience", "Web development", "Node.js basics"],
        "learning_outcomes": [
            "Build full-stack applications with Remix",
            "Master nested routing and data loading",
            "Implement progressive enhancement patterns",
            "Handle forms and mutations effectively",
            "Deploy Remix applications to production"
        ],
        "tags": ["remix", "react", "fullstack", "nested-routing", "progressive-enhancement"],
        "request": {
            "subject": "Remix Full-Stack Web Framework Development",
            "goal": "I want to master Remix for building modern full-stack web applications. Teach me nested routing, data loading, progressive enhancement, form handling, error boundaries, and deployment strategies. Focus on performance and user experience.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Tauri Desktop App Development",
        "category": "desktop-development",
        "subcategory": "cross-platform",
        "difficulty": "intermediate",
        "target_audience": "Developers building cross-platform desktop applications with web technologies",
        "estimated_hours": 95,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 8.7,
        "prerequisites": ["Rust basics", "Web development", "Desktop application concepts"],
        "learning_outcomes": [
            "Build cross-platform desktop apps with Tauri",
            "Integrate Rust backend with web frontend",
            "Handle native system APIs and file operations",
            "Implement secure desktop application patterns",
            "Package and distribute desktop applications"
        ],
        "tags": ["tauri", "rust", "desktop-development", "cross-platform", "system-integration"],
        "request": {
            "subject": "Tauri Cross-Platform Desktop Application Development",
            "goal": "I want to master Tauri for building secure, cross-platform desktop applications. Teach me Rust-web integration, native API access, security patterns, system integration, packaging, and distribution strategies for desktop apps.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "AI Ethics and Responsible AI Development",
        "category": "artificial-intelligence",
        "subcategory": "ai-ethics",
        "difficulty": "intermediate",
        "target_audience": "AI developers and researchers focusing on responsible AI practices",
        "estimated_hours": 80,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["AI/ML experience", "Ethics awareness", "Policy understanding"],
        "learning_outcomes": [
            "Implement bias detection and mitigation strategies",
            "Design fair and transparent AI systems",
            "Handle AI governance and compliance frameworks",
            "Conduct AI impact assessments",
            "Build responsible AI development practices"
        ],
        "tags": ["ai-ethics", "responsible-ai", "bias-mitigation", "fairness", "ai-governance"],
        "request": {
            "subject": "AI Ethics and Responsible AI Development",
            "goal": "I want to master responsible AI development and ethics. Teach me bias detection, fairness metrics, transparency, explainability, governance frameworks, impact assessment, and building ethical AI systems that benefit society.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    }
]

async def generate_curated_roadmap(roadmap_config: dict) -> CuratedRoadmap:
    """Generate a single curated roadmap using AI"""
    logger.info(f"🎯 Generating: {roadmap_config['title']}")
    
    # Create AI request
    request = RoadmapCreateRequest(**roadmap_config['request'])
    
    # Generate content using AI service
    ai_response = await generate_roadmap_content(request)
    
    # Create curated roadmap
    curated_roadmap = CuratedRoadmap(
        title=roadmap_config['title'],
        description=ai_response.description,
        category=roadmap_config['category'],
        subcategory=roadmap_config.get('subcategory'),
        difficulty=roadmap_config['difficulty'],
        is_featured=roadmap_config['is_featured'],
        is_verified=roadmap_config['is_verified'], 
        quality_score=roadmap_config['quality_score'],
        view_count=0,
        adoption_count=0,
        completion_rate=0.0,
        average_rating=0.0,
        roadmap_plan=ai_response.roadmap_plan.model_dump()["modules"],
        estimated_hours=roadmap_config['estimated_hours'],
        prerequisites=roadmap_config['prerequisites'],
        learning_outcomes=roadmap_config['learning_outcomes'],
        tags=roadmap_config['tags'],
        target_audience=roadmap_config['target_audience'],
        slug=create_slug(roadmap_config['title']),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    return curated_roadmap

async def generate_initial_curated_roadmaps_background(db: Session):
    """Background task to generate initial 5 curated roadmaps"""
    try:
        logger.info("🚀 Starting background generation of initial 5 curated roadmaps...")
        generated_roadmaps = []
        
        for config in PREMIUM_ROADMAPS_CONFIG:
            try:
                roadmap = await generate_curated_roadmap(config)
                generated_roadmaps.append(roadmap)
                logger.info(f"✅ Generated: {config['title']}")
                # Small delay to avoid API limits
                await asyncio.sleep(2)
            except Exception as e:
                logger.error(f"❌ Failed to generate {config['title']}: {e}")
                continue
        
        # Save all generated roadmaps
        if generated_roadmaps:
            for roadmap in generated_roadmaps:
                db.add(roadmap)
            db.commit()
            logger.info(f"💾 Saved {len(generated_roadmaps)} initial curated roadmaps to database!")
        
    except Exception as e:
        logger.error(f"💥 Background roadmap generation failed: {e}")
        db.rollback()

async def generate_additional_curated_roadmaps_background(db: Session):
    """Background task to generate additional 30 curated roadmaps"""
    try:
        logger.info("🚀 Starting background generation of 30 additional curated roadmaps...")
        generated_roadmaps = []
        
        for config in ADDITIONAL_PREMIUM_ROADMAPS:
            try:
                roadmap = await generate_curated_roadmap(config)
                generated_roadmaps.append(roadmap)
                logger.info(f"✅ Generated: {config['title']}")
                # Small delay to avoid API limits
                await asyncio.sleep(2)
            except Exception as e:
                logger.error(f"❌ Failed to generate {config['title']}: {e}")
                continue
        
        # Save all generated roadmaps
        if generated_roadmaps:
            for roadmap in generated_roadmaps:
                db.add(roadmap)
            db.commit()
            logger.info(f"💾 Saved {len(generated_roadmaps)} additional curated roadmaps to database!")
        
    except Exception as e:
        logger.error(f"💥 Background roadmap generation failed: {e}")
        db.rollback()

async def generate_advanced_curated_roadmaps_background(db: Session):
    """Background task to generate advanced 37 curated roadmaps"""
    try:
        logger.info("🎯 Starting background generation of 37 advanced curated roadmaps...")
        generated_roadmaps = []
        
        for config in ADVANCED_PREMIUM_ROADMAPS:
            try:
                roadmap = await generate_curated_roadmap(config)
                generated_roadmaps.append(roadmap)
                logger.info(f"✅ Generated: {config['title']}")
                # Small delay to avoid API limits
                await asyncio.sleep(2)
            except Exception as e:
                logger.error(f"❌ Failed to generate {config['title']}: {e}")
                continue
        
        # Save all generated roadmaps
        if generated_roadmaps:
            for roadmap in generated_roadmaps:
                db.add(roadmap)
            db.commit()
            logger.info(f"💾 Saved {len(generated_roadmaps)} advanced curated roadmaps to database!")
        
    except Exception as e:
        logger.error(f"💥 Advanced roadmap generation failed: {e}")
        db.rollback()

@router.get("/", response_model=List[CuratedRoadmapListResponse])
async def browse_curated_roadmaps(
    background_tasks: BackgroundTasks,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(12, ge=1, le=50, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    subcategory: Optional[str] = Query(None, description="Filter by subcategory"), 
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    featured_only: bool = Query(False, description="Show only featured roadmaps"),
    verified_only: bool = Query(False, description="Show only verified roadmaps"),
    sort_by: str = Query("popularity", description="Sort by: popularity, rating, recent, alphabetical"),
    search: Optional[str] = Query(None, description="Search query"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Browse curated roadmaps with filtering and pagination.
    Public endpoint - no authentication required.
    Auto-generates roadmaps if database is empty (first-time visit).
    """
    
    # Check if curated roadmaps exist and generate accordingly
    existing_count = db.exec(select(func.count(CuratedRoadmap.id))).first()
    
    if existing_count == 0:
        logger.info("🎯 No curated roadmaps found. Starting background generation of initial 5 roadmaps...")
        # Start generation of initial 5 roadmaps in background
        background_tasks.add_task(generate_initial_curated_roadmaps_background, db)
        # Return empty array for now - roadmaps will be available after generation completes
        return []
    elif existing_count == 5:
        logger.info("🚀 Found exactly 5 roadmaps. Starting background generation of 30 additional roadmaps...")
        # Start generation of additional 30 roadmaps in background
        background_tasks.add_task(generate_additional_curated_roadmaps_background, db)
        # Continue to return existing roadmaps while additional ones generate
    elif existing_count == 35:
        logger.info("🎯 Found exactly 35 roadmaps. Starting background generation of 37 advanced roadmaps...")
        # Start generation of advanced 37 roadmaps in background
        background_tasks.add_task(generate_advanced_curated_roadmaps_background, db)
        # Continue to return existing roadmaps while advanced ones generate
    
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
    if verified_only:
        filters.append(CuratedRoadmap.is_verified == True)
    if search:
        search_filter = or_(
            CuratedRoadmap.title.icontains(search),
            CuratedRoadmap.description.icontains(search)
        )
        filters.append(search_filter)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Apply sorting
    if sort_by == "popularity":
        query = query.order_by(desc(CuratedRoadmap.adoption_count), desc(CuratedRoadmap.view_count))
    elif sort_by == "rating":
        query = query.order_by(desc(CuratedRoadmap.average_rating), desc(CuratedRoadmap.adoption_count))
    elif sort_by == "recent":
        query = query.order_by(desc(CuratedRoadmap.created_at))
    elif sort_by == "alphabetical":
        query = query.order_by(CuratedRoadmap.title)
    
    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
    roadmaps = db.exec(query).all()
    
    # Convert to response format (excluding full roadmap_plan for list view)
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

@router.get("/{roadmap_id}", response_model=CuratedRoadmapResponse)
def get_curated_roadmap(
    roadmap_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get detailed curated roadmap by ID.
    Public endpoint - increments view count.
    """
    roadmap = db.exec(select(CuratedRoadmap).where(CuratedRoadmap.id == roadmap_id)).first()
    
    if not roadmap:
        raise HTTPException(status_code=404, detail="Curated roadmap not found")
    
    # Increment view count (anonymous views are still valuable)
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

@router.get("/slug/{slug}", response_model=CuratedRoadmapResponse)
def get_curated_roadmap_by_slug(
    slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get curated roadmap by SEO-friendly slug.
    Public endpoint for better URLs.
    """
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

@router.get("/categories/all", response_model=CuratedRoadmapCategoriesResponse)
def get_curated_roadmap_categories(db: Session = Depends(get_db)):
    """
    Get all available categories and subcategories.
    Public endpoint for filtering UI.
    """
    # Query distinct categories and subcategories
    categories_query = db.exec(
        select(CuratedRoadmap.category, CuratedRoadmap.subcategory)
        .distinct()
    ).all()
    
    # Organize into nested structure
    categories = {}
    for category, subcategory in categories_query:
        if category not in categories:
            categories[category] = []
        if subcategory and subcategory not in categories[category]:
            categories[category].append(subcategory)
    
    # Sort for consistent ordering
    for category in categories:
        categories[category].sort()
    
    return CuratedRoadmapCategoriesResponse(categories=categories)

@router.post("/{roadmap_id}/adopt", response_model=CuratedRoadmapAdoptResponse)
def adopt_curated_roadmap(
    roadmap_id: int,
    adopt_request: CuratedRoadmapAdoptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adopt a curated roadmap to user's personal collection.
    Requires authentication.
    """
    # Verify curated roadmap exists
    curated_roadmap = db.exec(
        select(CuratedRoadmap).where(CuratedRoadmap.id == roadmap_id)
    ).first()
    
    if not curated_roadmap:
        raise HTTPException(status_code=404, detail="Curated roadmap not found")
    
    # Check if user already adopted this roadmap
    existing_adoption = db.exec(
        select(UserCuratedRoadmap).where(
            and_(
                UserCuratedRoadmap.user_id == current_user.id,
                UserCuratedRoadmap.curated_roadmap_id == roadmap_id
            )
        )
    ).first()
    
    if existing_adoption:
        raise HTTPException(
            status_code=409, 
            detail="You have already adopted this roadmap"
        )
    
    # Create personal copy of the roadmap
    personal_title = adopt_request.customize_title or curated_roadmap.title
    personal_roadmap = Roadmap(
        user_id=current_user.id,
        title=personal_title,
        description=curated_roadmap.description,
        roadmap_plan=curated_roadmap.roadmap_plan,
        subject=curated_roadmap.category,  # Map category to subject
        goal=f"Learning {curated_roadmap.title}",
        time_value=curated_roadmap.estimated_hours // 10 if curated_roadmap.estimated_hours else 4,  # Rough conversion
        time_unit="weeks",
        model="curated"  # Mark as adopted from curated
    )
    
    db.add(personal_roadmap)
    db.commit()
    db.refresh(personal_roadmap)
    
    # Record the adoption
    user_adoption = UserCuratedRoadmap(
        user_id=current_user.id,
        curated_roadmap_id=roadmap_id,
        personal_roadmap_id=personal_roadmap.id
    )
    
    db.add(user_adoption)
    
    # Update curated roadmap adoption count
    curated_roadmap.adoption_count += 1
    db.add(curated_roadmap)
    
    db.commit()
    db.refresh(user_adoption)
    
    return CuratedRoadmapAdoptResponse(
        success=True,
        message="Successfully adopted roadmap to your personal collection!",
        personal_roadmap_id=personal_roadmap.id,
        adoption_id=user_adoption.id
    )

@router.get("/featured/latest", response_model=List[CuratedRoadmapListResponse])
def get_featured_roadmaps(
    limit: int = Query(6, ge=1, le=20, description="Number of featured roadmaps to return"),
    db: Session = Depends(get_db)
):
    """
    Get latest featured roadmaps for homepage display.
    Public endpoint.
    """
    query = select(CuratedRoadmap).where(
        CuratedRoadmap.is_featured == True
    ).order_by(
        desc(CuratedRoadmap.quality_score),
        desc(CuratedRoadmap.adoption_count)
    ).limit(limit)
    
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

@router.get("/user/adopted", response_model=List[RoadmapResponse])
def get_user_adopted_roadmaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's adopted curated roadmaps (their personal copies).
    Requires authentication.
    """
    # Get user's adopted roadmaps through the tracking table
    adopted_query = db.exec(
        select(UserCuratedRoadmap, Roadmap)
        .join(Roadmap, UserCuratedRoadmap.personal_roadmap_id == Roadmap.id)
        .where(UserCuratedRoadmap.user_id == current_user.id)
        .order_by(desc(UserCuratedRoadmap.adopted_at))
    ).all()
    
    return [
        RoadmapResponse(
            id=roadmap.id,
            user_id=roadmap.user_id,
            title=roadmap.title,
            description=roadmap.description,
            roadmap_plan=roadmap.roadmap_plan,
            subject=roadmap.subject,
            goal=roadmap.goal,
            time_value=roadmap.time_value,
            time_unit=roadmap.time_unit,
            model=roadmap.model
        ) for _, roadmap in adopted_query
    ]

@router.post("/{roadmap_id}/rate")
def rate_curated_roadmap(
    roadmap_id: int,
    rating: int = Query(..., ge=1, le=5, description="Rating from 1 to 5 stars"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rate a curated roadmap (1-5 stars).
    Requires authentication and prior adoption.
    """
    # Verify user has adopted this roadmap
    adoption = db.exec(
        select(UserCuratedRoadmap).where(
            and_(
                UserCuratedRoadmap.user_id == current_user.id,
                UserCuratedRoadmap.curated_roadmap_id == roadmap_id
            )
        )
    ).first()
    
    if not adoption:
        raise HTTPException(
            status_code=403, 
            detail="You must adopt this roadmap before rating it"
        )
    
    # Update user's rating
    old_rating = adoption.user_rating
    adoption.user_rating = rating
    db.add(adoption)
    
    # Update curated roadmap's average rating
    curated_roadmap = db.exec(
        select(CuratedRoadmap).where(CuratedRoadmap.id == roadmap_id)
    ).first()
    
    if curated_roadmap:
        # Recalculate average rating
        all_ratings = db.exec(
            select(UserCuratedRoadmap.user_rating)
            .where(
                and_(
                    UserCuratedRoadmap.curated_roadmap_id == roadmap_id,
                    UserCuratedRoadmap.user_rating.is_not(None)
                )
            )
        ).all()
        
        if all_ratings:
            curated_roadmap.average_rating = sum(all_ratings) / len(all_ratings)
        else:
            curated_roadmap.average_rating = 0.0
            
        db.add(curated_roadmap)
    
    db.commit()
    
    return {"success": True, "message": "Rating updated successfully", "new_rating": rating}