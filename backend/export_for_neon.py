#!/usr/bin/env python3
"""
Export curated roadmaps data for Neon database
Generates clean INSERT statements for production deployment
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'app'))

from database.session import get_db, engine
from sqlmodel import Session, select
from sql_models import CuratedRoadmap
import json

def export_roadmaps_for_neon():
    """Export roadmaps as clean INSERT statements for Neon"""
    print("-- Curated Roadmaps Data for Neon Production Database")
    print("-- Generated automatically from local development data")
    print()
    
    with Session(engine) as db:
        roadmaps = db.exec(select(CuratedRoadmap)).all()
        
        if not roadmaps:
            print("-- No roadmaps found in local database")
            return
        
        print(f"-- Found {len(roadmaps)} roadmaps to export")
        print()
        
        for i, roadmap in enumerate(roadmaps, 1):
            # Clean and prepare data
            roadmap_plan_json = json.dumps(roadmap.roadmap_plan).replace("'", "''")
            prerequisites_json = json.dumps(roadmap.prerequisites)
            learning_outcomes_json = json.dumps(roadmap.learning_outcomes)
            tags_json = json.dumps(roadmap.tags)
            
            print(f"-- Roadmap {i}: {roadmap.title}")
            print("INSERT INTO curated_roadmap (")
            print("    title, description, category, subcategory, difficulty,")
            print("    is_featured, is_verified, quality_score, estimated_hours,")
            print("    prerequisites, learning_outcomes, tags, target_audience, slug,")
            print("    roadmap_plan")
            print(") VALUES (")
            print(f"    {repr(roadmap.title)},")
            print(f"    {repr(roadmap.description)},")
            print(f"    {repr(roadmap.category)},")
            print(f"    {repr(roadmap.subcategory)},")
            print(f"    {repr(roadmap.difficulty)},")
            print(f"    {str(roadmap.is_featured).lower()},")
            print(f"    {str(roadmap.is_verified).lower()},")
            print(f"    {roadmap.quality_score},")
            print(f"    {roadmap.estimated_hours},")
            print(f"    '{prerequisites_json}'::jsonb,")
            print(f"    '{learning_outcomes_json}'::jsonb,")
            print(f"    '{tags_json}'::jsonb,")
            print(f"    {repr(roadmap.target_audience)},")
            print(f"    {repr(roadmap.slug)},")
            print(f"    '{roadmap_plan_json}'::jsonb")
            print(");")
            print()
        
        print("-- Verify data was inserted")
        print("SELECT id, title, category, difficulty, adoption_count FROM curated_roadmap ORDER BY id;")

if __name__ == "__main__":
    export_roadmaps_for_neon()