"""Add curated roadmaps system for public catalog

Revision ID: 1e85813d6de6
Revises: 5686bef7003e
Create Date: 2025-08-22 19:35:51.214521

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '1e85813d6de6'
down_revision: Union[str, Sequence[str], None] = '5686bef7003e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema and add curated roadmaps system."""
    
    # Add user table columns
    op.add_column('user', sa.Column('display_name', sa.String(), nullable=True))
    op.add_column('user', sa.Column('profile_completed', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('user', sa.Column('onboarding_completed', sa.Boolean(), nullable=False, server_default='false'))
    
    # Create curated_roadmap table
    op.create_table('curated_roadmap',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.String(1000), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('subcategory', sa.String(50), nullable=True),
        sa.Column('difficulty', sa.String(20), nullable=False),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('quality_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('adoption_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completion_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('average_rating', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('roadmap_plan', postgresql.JSONB(), nullable=False),
        sa.Column('estimated_hours', sa.Integer(), nullable=True),
        sa.Column('prerequisites', postgresql.JSONB(), nullable=False, server_default='[]'),
        sa.Column('learning_outcomes', postgresql.JSONB(), nullable=False, server_default='[]'),
        sa.Column('tags', postgresql.JSONB(), nullable=False, server_default='[]'),
        sa.Column('slug', sa.String(200), nullable=True),
        sa.Column('target_audience', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_curated_roadmap_category', 'curated_roadmap', ['category'])
    op.create_index('ix_curated_roadmap_subcategory', 'curated_roadmap', ['subcategory'])
    op.create_index('ix_curated_roadmap_difficulty', 'curated_roadmap', ['difficulty'])
    op.create_index('ix_curated_roadmap_slug', 'curated_roadmap', ['slug'])
    
    # Create user_curated_roadmap table
    op.create_table('user_curated_roadmap',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('curated_roadmap_id', sa.Integer(), nullable=False),
        sa.Column('personal_roadmap_id', sa.Integer(), nullable=True),
        sa.Column('user_rating', sa.Integer(), nullable=True),
        sa.Column('adopted_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['curated_roadmap_id'], ['curated_roadmap.id']),
        sa.ForeignKeyConstraint(['personal_roadmap_id'], ['roadmap.id']),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for user_curated_roadmap
    op.create_index('ix_user_curated_roadmap_user_id', 'user_curated_roadmap', ['user_id'])
    op.create_index('ix_user_curated_roadmap_curated_roadmap_id', 'user_curated_roadmap', ['curated_roadmap_id'])
    
    # Insert sample curated roadmaps data
    connection = op.get_bind()
    
    # Sample roadmaps with minimal but functional data
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
            'prerequisites': '["High school mathematics", "Basic computer skills"]',
            'learning_outcomes': '["Understand ML concepts", "Work with Python and pandas", "Build predictive models", "Complete real-world projects"]',
            'tags': '["machine-learning", "python", "data-science", "beginner"]',
            'target_audience': 'Complete beginners wanting to start a career in data science',
            'slug': 'machine-learning-for-data-science-beginners',
            'roadmap_plan': '[{"id": "module1", "title": "Python & Data Fundamentals", "timeline": "2 weeks", "topics": [{"id": "topic1", "title": "Python Basics", "subtopics": [{"id": "subtopic1", "title": "Variables and Data Types", "has_learn": true, "has_quiz": true, "has_code_challenge": true}]}]}]'
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
            'prerequisites': '["JavaScript ES6+", "HTML/CSS", "Basic React knowledge"]',
            'learning_outcomes': '["Build scalable React applications", "Master TypeScript integration", "Implement modern patterns", "Optimize performance"]',
            'tags': '["react", "typescript", "frontend", "javascript", "hooks"]',
            'target_audience': 'Frontend developers wanting to master React with TypeScript',
            'slug': 'modern-react-development-with-typescript',
            'roadmap_plan': '[{"id": "module1", "title": "TypeScript Fundamentals", "timeline": "1 week", "topics": [{"id": "topic1", "title": "TypeScript Basics", "subtopics": [{"id": "subtopic1", "title": "Basic Types", "has_learn": true, "has_quiz": true, "has_code_challenge": true}]}]}]'
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
            'prerequisites': '["Basic Python programming", "HTML/CSS fundamentals", "Command line basics"]',
            'learning_outcomes': '["Build full-stack web applications", "Implement authentication", "Work with databases", "Deploy to production"]',
            'tags': '["python", "django", "web-development", "backend", "database"]',
            'target_audience': 'Developers with basic Python knowledge wanting to build web applications',
            'slug': 'complete-python-web-development-with-django',
            'roadmap_plan': '[{"id": "module1", "title": "Django Fundamentals", "timeline": "1 week", "topics": [{"id": "topic1", "title": "Django Setup", "subtopics": [{"id": "subtopic1", "title": "Installation and Project Setup", "has_learn": true, "has_quiz": true, "has_code_challenge": true}]}]}]'
        }
    ]
    
    for roadmap in sample_roadmaps:
        connection.execute(
            sa.text("""
                INSERT INTO curated_roadmap (
                    title, description, category, subcategory, difficulty,
                    is_featured, is_verified, quality_score, estimated_hours,
                    prerequisites, learning_outcomes, tags, target_audience, slug, roadmap_plan
                ) VALUES (
                    :title, :description, :category, :subcategory, :difficulty,
                    :is_featured, :is_verified, :quality_score, :estimated_hours,
                    CAST(:prerequisites AS jsonb), CAST(:learning_outcomes AS jsonb), 
                    CAST(:tags AS jsonb), :target_audience, :slug, CAST(:roadmap_plan AS jsonb)
                )
            """),
            roadmap
        )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop curated roadmaps tables
    op.drop_table('user_curated_roadmap')
    op.drop_table('curated_roadmap')
    
    # Drop user table columns
    op.drop_column('user', 'onboarding_completed')
    op.drop_column('user', 'profile_completed')
    op.drop_column('user', 'display_name')
