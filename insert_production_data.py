#!/usr/bin/env python3
"""
Insert sample curated roadmaps into production Neon database.
"""

import psycopg2
import json
from datetime import datetime

# Production Neon database connection string
DATABASE_URL = "postgresql://admin-db:tyson2012@34.93.60.80:5432/menttor-db"

def insert_sample_roadmaps():
    """Insert sample curated roadmaps data into production."""
    
    sample_roadmaps = [
        {
            'title': 'Machine Learning for Data Science Beginners',
            'description': 'Complete beginner-friendly roadmap for machine learning and data science with Python',
            'category': 'data-science',
            'subcategory': 'machine-learning',
            'difficulty': 'beginner',
            'is_featured': True,
            'is_verified': True,
            'quality_score': 9.2,
            'estimated_hours': 100,
            'prerequisites': ["High school mathematics", "Basic computer skills"],
            'learning_outcomes': ["Understand ML concepts", "Work with Python and pandas", "Build predictive models", "Complete real-world projects"],
            'tags': ["machine-learning", "python", "data-science", "beginner"],
            'target_audience': 'Complete beginners wanting to start a career in data science',
            'slug': 'machine-learning-for-data-science-beginners',
            'roadmap_plan': {
                "modules": [
                    {
                        "id": "module1",
                        "title": "Python & Data Fundamentals",
                        "timeline": "2 weeks",
                        "topics": [
                            {
                                "id": "topic1",
                                "title": "Python Basics",
                                "subtopics": [
                                    {
                                        "id": "subtopic1",
                                        "title": "Variables and Data Types",
                                        "has_learn": True,
                                        "has_quiz": True,
                                        "has_code_challenge": True
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        },
        {
            'title': 'Modern React Development with TypeScript',
            'description': 'Expert-level React development using TypeScript, hooks, state management, and performance optimization',
            'category': 'web-development',
            'subcategory': 'frontend',
            'difficulty': 'intermediate',
            'is_featured': True,
            'is_verified': True,
            'quality_score': 9.4,
            'estimated_hours': 80,
            'prerequisites': ["JavaScript ES6+", "HTML/CSS", "Basic React knowledge"],
            'learning_outcomes': ["Build scalable React applications", "Master TypeScript integration", "Implement modern patterns", "Optimize performance"],
            'tags': ["react", "typescript", "frontend", "javascript", "hooks"],
            'target_audience': 'Frontend developers wanting to master React with TypeScript',
            'slug': 'modern-react-development-with-typescript',
            'roadmap_plan': {
                "modules": [
                    {
                        "id": "module1",
                        "title": "TypeScript Fundamentals",
                        "timeline": "1 week",
                        "topics": [
                            {
                                "id": "topic1",
                                "title": "TypeScript Basics",
                                "subtopics": [
                                    {
                                        "id": "subtopic1",
                                        "title": "Basic Types",
                                        "has_learn": True,
                                        "has_quiz": True,
                                        "has_code_challenge": True
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        },
        {
            'title': 'Complete Python Web Development with Django',
            'description': 'Full-stack web development with Django covering authentication, databases, and deployment',
            'category': 'web-development',
            'subcategory': 'backend',
            'difficulty': 'intermediate',
            'is_featured': True,
            'is_verified': True,
            'quality_score': 9.5,
            'estimated_hours': 120,
            'prerequisites': ["Basic Python programming", "HTML/CSS fundamentals", "Command line basics"],
            'learning_outcomes': ["Build full-stack web applications", "Implement authentication", "Work with databases", "Deploy to production"],
            'tags': ["python", "django", "web-development", "backend", "database"],
            'target_audience': 'Developers with basic Python knowledge wanting to build web applications',
            'slug': 'complete-python-web-development-with-django',
            'roadmap_plan': {
                "modules": [
                    {
                        "id": "module1",
                        "title": "Django Fundamentals",
                        "timeline": "1 week",
                        "topics": [
                            {
                                "id": "topic1",
                                "title": "Django Setup",
                                "subtopics": [
                                    {
                                        "id": "subtopic1",
                                        "title": "Installation and Project Setup",
                                        "has_learn": True,
                                        "has_quiz": True,
                                        "has_code_challenge": True
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        }
    ]
    
    try:
        # Connect to production database
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("Connected to production Neon database!")
        
        # Check if data already exists
        cur.execute("SELECT COUNT(*) FROM curated_roadmap")
        existing_count = cur.fetchone()[0]
        
        if existing_count > 0:
            print(f"Found {existing_count} existing roadmaps. Clearing table first...")
            cur.execute("DELETE FROM curated_roadmap")
            conn.commit()
        
        print("Inserting sample curated roadmaps...")
        
        # Insert each roadmap
        for i, roadmap_data in enumerate(sample_roadmaps, 1):
            try:
                insert_sql = """
                    INSERT INTO curated_roadmap (
                        title, description, category, subcategory, difficulty,
                        is_featured, is_verified, quality_score, estimated_hours,
                        prerequisites, learning_outcomes, tags, target_audience, slug, roadmap_plan
                    ) VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s::jsonb, %s::jsonb, %s::jsonb, %s, %s, %s::jsonb
                    )
                """
                
                cur.execute(insert_sql, (
                    roadmap_data['title'],
                    roadmap_data['description'],
                    roadmap_data['category'],
                    roadmap_data['subcategory'],
                    roadmap_data['difficulty'],
                    roadmap_data['is_featured'],
                    roadmap_data['is_verified'],
                    roadmap_data['quality_score'],
                    roadmap_data['estimated_hours'],
                    json.dumps(roadmap_data['prerequisites']),
                    json.dumps(roadmap_data['learning_outcomes']),
                    json.dumps(roadmap_data['tags']),
                    roadmap_data['target_audience'],
                    roadmap_data['slug'],
                    json.dumps(roadmap_data['roadmap_plan'])
                ))
                
                print(f"✅ Inserted roadmap {i}: {roadmap_data['title']}")
                
            except Exception as e:
                print(f"❌ Error inserting roadmap {i}: {e}")
                conn.rollback()
                continue
        
        # Commit all changes
        conn.commit()
        
        # Verify the data
        cur.execute("SELECT COUNT(*) FROM curated_roadmap")
        total_roadmaps = cur.fetchone()[0]
        print(f"\n🎉 Successfully inserted {total_roadmaps} curated roadmaps in production!")
        
        # Show sample
        cur.execute("SELECT title, category, difficulty FROM curated_roadmap LIMIT 1")
        sample = cur.fetchone()
        if sample:
            print(f"Sample: {sample[0]} ({sample[1]}, {sample[2]})")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"💥 Database error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Inserting sample roadmaps into production Neon database...")
    try:
        success = insert_sample_roadmaps()
        if success:
            print("\n✨ All done! Production /explore page should now show roadmaps.")
        else:
            print("\n❌ Failed to insert data.")
    except Exception as e:
        print(f"\n💥 Error: {e}")