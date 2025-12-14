#!/usr/bin/env python3
"""
Script to populate library content in the database
Run this after deployment to seed the library content
"""

import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from sqlmodel import Session, select
from database.session import engine
from sql_models import LibraryContent
from datetime import datetime
import json

# Library content data - add all the missing slugs from the errors
LIBRARY_CONTENT_DATA = [
    {
        "slug": "natural-vs-artificial-lighting",
        "title": "Natural vs Artificial Lighting",
        "subject": "Photography",
        "goal": "Understanding lighting types in photography",
        "content": [
            {"type": "heading", "data": {"level": 1, "text": "Natural vs Artificial Lighting"}},
            {"type": "paragraph", "data": {"text": "Understanding the differences between natural and artificial lighting is fundamental to photography and videography."}}
        ]
    },
    {
        "slug": "iterative-prompt-refinement",
        "title": "Iterative Prompt Refinement",
        "subject": "AI & Machine Learning",
        "goal": "Learn prompt engineering techniques",
        "content": [
            {"type": "heading", "data": {"level": 1, "text": "Iterative Prompt Refinement"}},
            {"type": "paragraph", "data": {"text": "Iterative prompt refinement is the process of gradually improving prompts to get better results from AI models."}}
        ]
    },
    {
        "slug": "communicating-data-insights-to-stakeholders",
        "title": "Communicating Data Insights to Stakeholders",
        "subject": "Data Science",
        "goal": "Learn effective data communication",
        "content": [
            {"type": "heading", "data": {"level": 1, "text": "Communicating Data Insights to Stakeholders"}},
            {"type": "paragraph", "data": {"text": "Effective communication of data insights is crucial for driving business decisions."}}
        ]
    },
    {
        "slug": "quantum-computing-algorithms-and-applications",
        "title": "Quantum Computing Algorithms and Applications",
        "subject": "Quantum Computing",
        "goal": "Understand quantum algorithms",
        "content": [
            {"type": "heading", "data": {"level": 1, "text": "Quantum Computing Algorithms and Applications"}},
            {"type": "paragraph", "data": {"text": "Quantum computing leverages quantum mechanical phenomena to solve complex computational problems."}}
        ]
    },
    {
        "slug": "aspnet-core-architecture",
        "title": "ASP.NET Core Architecture",
        "subject": "Web Development",
        "goal": "Learn ASP.NET Core fundamentals",
        "content": [
            {"type": "heading", "data": {"level": 1, "text": "ASP.NET Core Architecture"}},
            {"type": "paragraph", "data": {"text": "ASP.NET Core is a cross-platform, high-performance framework for building modern web applications."}}
        ]
    },
    {
        "slug": "what-is-python-and-its-applications",
        "title": "What is Python and Its Applications",
        "subject": "Programming",
        "goal": "Introduction to Python programming",
        "content": [
            {"type": "heading", "data": {"level": 1, "text": "What is Python and Its Applications"}},
            {"type": "paragraph", "data": {"text": "Python is a versatile, high-level programming language known for its simplicity and readability."}}
        ]
    },
    {
        "slug": "proteins-structure-function-and-enzymes",
        "title": "Proteins: Structure, Function, and Enzymes",
        "subject": "Biology",
        "goal": "Understanding protein biochemistry",
        "content": [
            {"type": "heading", "data": {"level": 1, "text": "Proteins: Structure, Function, and Enzymes"}},
            {"type": "paragraph", "data": {"text": "Proteins are essential macromolecules that perform a vast array of functions in living organisms."}}
        ]
    },
    {
        "slug": "functions-declaration-parameters-return-values-variadic-functions",
        "title": "Functions: Declaration, Parameters, Return Values, Variadic Functions",
        "subject": "Programming",
        "goal": "Master function concepts in programming",
        "content": [
            {"type": "heading", "data": {"level": 1, "text": "Functions in Programming"}},
            {"type": "paragraph", "data": {"text": "Functions are reusable blocks of code that perform specific tasks and are fundamental to programming."}}
        ]
    },
    {
        "slug": "path-integral-formulation-of-quantum-mechanics",
        "title": "Path Integral Formulation of Quantum Mechanics",
        "subject": "Physics",
        "goal": "Understanding advanced quantum mechanics",
        "content": [
            {"type": "heading", "data": {"level": 1, "text": "Path Integral Formulation of Quantum Mechanics"}},
            {"type": "paragraph", "data": {"text": "The path integral formulation is an alternative approach to quantum mechanics developed by Richard Feynman."}}
        ]
    },
    {
        "slug": "neural-network-architectures",
        "title": "Neural Network Architectures",
        "subject": "Deep Learning Research",
        "goal": "Learn about neural network architectures in deep learning",
        "content_file": "content/neural-network-architectures.json"
    }
]


def populate_library_content():
    """Populate library content from the data above"""
    print("🚀 Starting library content population...")

    with Session(engine) as session:
        created_count = 0
        updated_count = 0

        for item in LIBRARY_CONTENT_DATA:
            slug = item["slug"]
            print(f"\n📄 Processing: {slug}")

            # Check if already exists
            statement = select(LibraryContent).where(LibraryContent.slug == slug)
            existing = session.exec(statement).first()

            # Load content from file if specified
            if "content_file" in item:
                content_file_path = os.path.join(os.path.dirname(__file__), item["content_file"])
                try:
                    with open(content_file_path, 'r') as f:
                        file_data = json.load(f)
                        content = file_data.get("content", item.get("content", []))
                        title = file_data.get("title", item["title"])
                        subject = file_data.get("subject", item["subject"])
                        goal = file_data.get("goal", item["goal"])
                except FileNotFoundError:
                    print(f"   ⚠️  Content file not found: {content_file_path}, using default")
                    content = item.get("content", [])
                    title = item["title"]
                    subject = item["subject"]
                    goal = item["goal"]
            else:
                content = item.get("content", [])
                title = item["title"]
                subject = item["subject"]
                goal = item["goal"]

            content_json = json.dumps(content)

            if existing:
                # Update existing
                existing.title = title
                existing.subject = subject
                existing.goal = goal
                existing.content_json = content_json
                existing.last_updated = datetime.utcnow()
                existing.is_active = True
                session.add(existing)
                updated_count += 1
                print(f"   ✅ Updated: {slug}")
            else:
                # Create new
                new_content = LibraryContent(
                    slug=slug,
                    title=title,
                    subject=subject,
                    goal=goal,
                    content_json=content_json,
                    resources_json=None,
                    last_updated=datetime.utcnow(),
                    created_at=datetime.utcnow(),
                    is_active=True
                )
                session.add(new_content)
                created_count += 1
                print(f"   ✅ Created: {slug}")

        # Commit all changes
        session.commit()

        print(f"\n🎉 Library content population complete!")
        print(f"   📊 Created: {created_count}")
        print(f"   🔄 Updated: {updated_count}")
        print(f"   📚 Total: {created_count + updated_count}")


if __name__ == "__main__":
    try:
        populate_library_content()
    except Exception as e:
        print(f"\n❌ Error populating library content: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
