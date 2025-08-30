# Menttor - AI-Powered Learning Platform

A modern educational platform that creates personalized learning journeys using AI and provides interactive practice sessions with real-time question generation.

## 🚀 Live Application

- **Frontend**: [https://menttor.vercel.app](https://menttor.live)
- **Backend API**: [https://menttor-backend.onrender.com](https://menttor-backend.onrender.com)

## ✨ Key Features

### 🗺️ AI-Generated Learning Roadmaps
- Personalized learning paths created using AI based on your goals
- Interactive journey visualization with progress tracking
- Structured modules, topics, and subtopics

### 📚 Adaptive Learning Content
- AI-generated content tailored to each subtopic
- Interactive learning modules with explanations
- Progress tracking and completion status

### 🎯 Smart Practice Sessions
- **Real-time Question Generation**: Questions generated as you start practicing
- **Multiple Question Types**: MCQ, Numerical, Case Studies, Code Completion, Debugging
- **Streaming Experience**: Start practicing immediately while more questions load in background
- **Customizable Sessions**: Choose question count, types, time limits, and subtopics

### 🔐 Secure Authentication
- Firebase Authentication integration
- User progress and data persistence
- Secure API access with JWT tokens

## 🏗️ Architecture

### Backend (FastAPI + PostgreSQL)
```
backend/
├── app/
│   ├── routers/           # API endpoints
│   │   ├── practice.py    # Practice session management & streaming
│   │   ├── quiz.py        # Quiz functionality  
│   │   ├── progress.py    # Progress tracking
│   │   └── auth.py        # Authentication
│   ├── services/          # Business logic
│   │   ├── ai_service.py      # AI content generation
│   │   ├── practice_service.py # Practice session logic
│   │   └── behavioral_service.py # User behavior tracking
│   ├── sql_models.py      # Database models
│   ├── schemas.py         # API schemas
│   └── main.py           # FastAPI application
└── alembic/              # Database migrations
```

### Frontend (Next.js + React)
```
frontend/
├── src/
│   ├── app/
│   │   ├── journey/           # Main learning interface
│   │   │   └── components/
│   │   │       ├── PracticeView.tsx    # Practice session creation
│   │   │       ├── InteractiveRoadmap.tsx # Journey visualization
│   │   │       └── JourneyHeader.tsx    # Progress display
│   │   ├── learn/            # Learning content pages
│   │   └── quiz/            # Quiz interfaces
│   ├── lib/
│   │   ├── api.ts           # API client with Firebase auth
│   │   └── firebase/        # Firebase configuration
│   └── components/          # Shared UI components
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Primary database with JSONB support
- **SQLModel**: Type-safe ORM
- **Firebase Admin**: Authentication verification
- **Google Vertex AI**: AI content generation
- **Alembic**: Database migrations

### Frontend  
- **Next.js 14**: React framework with app router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Firebase**: Authentication
- **Framer Motion**: Animations
- **Lucide React**: Icons

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL
- Firebase project

### Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:password@localhost/menttor"
export FIREBASE_PROJECT_ID="your-project-id"
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install

# Set environment variables
# Create .env.local file:
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
# ... other Firebase config

# Start development server
npm run dev
```

## 🔥 Recent Major Features

### Streaming Practice Sessions
- **Instant Start**: Begin practicing within seconds instead of waiting 30+ seconds
- **Progressive Loading**: Questions stream in real-time as they're generated
- **Batch Generation**: Questions created in small batches for optimal performance
- **Real-time Progress**: Live updates showing generation progress

### Auto-Migration System
- **CI/CD Safe**: Automatically generates migrations based on SQLModel changes
- **Data Preservation**: Never loses existing user data during deployments
- **Zero Downtime**: Fallback systems ensure continuous operation

### Enhanced Authentication  
- **Firebase Integration**: Secure authentication with proper token handling
- **Session Management**: Persistent user sessions across the platform
- **API Security**: All endpoints properly protected with authentication

## 📊 Database Schema

### Core Tables
- **User**: User profiles and authentication
- **Roadmap**: AI-generated learning paths  
- **UserProgress**: Learning progress tracking
- **LearningContent**: Generated educational content

### Practice System
- **PracticeSession**: Practice session management
- **PracticeQuestion**: Generated questions with metadata
- **PracticeAnswer**: User responses and scoring

### Behavioral Tracking
- **UserBehavior**: Engagement metrics and streaks
- **LearningSession**: Session state and flow tracking

## 🚀 Deployment

The application uses automated CI/CD:

- **Frontend**: Deployed on Vercel with automatic deployments from main branch
- **Backend**: Deployed on Render with Docker containers
- **Database**: Managed PostgreSQL with automatic migrations
- **Authentication**: Firebase handles user management

## 📈 Performance Features

- **Streaming**: Real-time question generation reduces wait times by 85%
- **Caching**: Smart caching of AI-generated content
- **Auto-scaling**: Handles variable loads with horizontal scaling
- **Optimized Queries**: Database queries optimized for learning workflows

## 🔐 Security

- **Firebase Auth**: Industry-standard authentication
- **JWT Tokens**: Secure API access
- **Input Validation**: All inputs validated and sanitized
- **CORS**: Proper cross-origin resource sharing setup

---

Built with ❤️ for learners who want personalized, AI-powered education experiences.
