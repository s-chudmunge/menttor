"""Add practice session tables for custom practice/exam mode

Revision ID: 2a1b3c4d5e6f
Revises: 1e85813d6de6
Create Date: 2025-08-28 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2a1b3c4d5e6f'
down_revision: Union[str, Sequence[str], None] = '1e85813d6de6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add practice session tables."""
    
    # op.create_table('practicesession',
    #     sa.Column('id', sa.Integer(), nullable=False),
    #     sa.Column('user_id', sa.Integer(), nullable=False),
    #     sa.Column('roadmap_id', sa.Integer(), nullable=False),
    #     sa.Column('session_token', sa.String(), nullable=False),
    #     sa.Column('subtopic_ids', postgresql.JSONB(), nullable=False),
    #     sa.Column('question_types', postgresql.JSONB(), nullable=False),
    #     sa.Column('question_count', sa.Integer(), nullable=False),
    #     sa.Column('time_limit', sa.Integer(), nullable=False),
    #     sa.Column('hints_enabled', sa.Boolean(), nullable=False, server_default='true'),
    #     sa.Column('subject', sa.String(), nullable=False),
    #     sa.Column('goal', sa.String(), nullable=False),
    #     sa.Column('status', sa.String(), nullable=False, server_default='active'),
    #     sa.Column('started_at', sa.DateTime(), nullable=True),
    #     sa.Column('completed_at', sa.DateTime(), nullable=True),
    #     sa.Column('total_time_spent', sa.Integer(), nullable=True),
    #     sa.Column('final_score', sa.Float(), nullable=True),
    #     sa.Column('correct_answers', sa.Integer(), nullable=True),
    #     sa.Column('hints_used', sa.Integer(), nullable=True),
    #     sa.Column('created_at', sa.DateTime(), nullable=False),
    #     sa.ForeignKeyConstraint(['roadmap_id'], ['roadmap.id'], ),
    #     sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    #     sa.PrimaryKeyConstraint('id')
    # )
    # op.create_index(op.f('ix_practicesession_roadmap_id'), 'practicesession', ['roadmap_id'], unique=False)
    # op.create_index(op.f('ix_practicesession_session_token'), 'practicesession', ['session_token'], unique=True)
    # op.create_index(op.f('ix_practicesession_user_id'), 'practicesession', ['user_id'], unique=False)

    # # Create practicequestion table
    # op.create_table('practicequestion',
    #     sa.Column('id', sa.Integer(), nullable=False),
    #     sa.Column('session_id', sa.Integer(), nullable=False),
    #     sa.Column('subtopic_id', sa.String(), nullable=False),
    #     sa.Column('question_type', sa.String(), nullable=False),
    #     sa.Column('question_data', postgresql.JSONB(), nullable=False),
    #     sa.Column('difficulty', sa.String(), nullable=False, server_default='medium'),
    #     sa.Column('order_index', sa.Integer(), nullable=False),
    #     sa.Column('model_used', sa.String(), nullable=True),
    #     sa.Column('generation_prompt', sa.Text(), nullable=True),
    #     sa.Column('created_at', sa.DateTime(), nullable=False),
    #     sa.ForeignKeyConstraint(['session_id'], ['practicesession.id'], ),
    #     sa.PrimaryKeyConstraint('id')
    # )
    # op.create_index(op.f('ix_practicequestion_session_id'), 'practicequestion', ['session_id'], unique=False)
    # op.create_index(op.f('ix_practicequestion_subtopic_id'), 'practicequestion', ['subtopic_id'], unique=False)

    # # Create practiceanswer table
    # op.create_table('practiceanswer',
    #     sa.Column('id', sa.Integer(), nullable=False),
    #     sa.Column('session_id', sa.Integer(), nullable=False),
    #     sa.Column('question_id', sa.Integer(), nullable=False),
    #     sa.Column('user_answer', sa.Text(), nullable=False),
    #     sa.Column('is_correct', sa.Boolean(), nullable=False),
    #     sa.Column('time_spent', sa.Integer(), nullable=False),
    #     sa.Column('hint_used', sa.Boolean(), nullable=False, server_default='false'),
    #     sa.Column('answered_at', sa.DateTime(), nullable=False),
    #     sa.Column('question_order', sa.Integer(), nullable=False, server_default='0'),
    #     sa.ForeignKeyConstraint(['question_id'], ['practicequestion.id'], ),
    #     sa.ForeignKeyConstraint(['session_id'], ['practicesession.id'], ),
    #     sa.PrimaryKeyConstraint('id')
    # )
    # op.create_index(op.f('ix_practiceanswer_question_id'), 'practiceanswer', ['question_id'], unique=False)
    # op.create_index(op.f('ix_practiceanswer_session_id'), 'practiceanswer', ['session_id'], unique=False)

    # # Add practice-related columns to existing tables
    # op.add_column('userprogress', sa.Column('practice_sessions_count', sa.Integer(), nullable=False, server_default='0'))
    # op.add_column('userprogress', sa.Column('last_practice_score', sa.Float(), nullable=True))
    pass


def downgrade() -> None:
    """Remove practice session tables."""
    
    # Remove columns from existing tables
    op.drop_column('userprogress', 'last_practice_score')
    op.drop_column('userprogress', 'practice_sessions_count')
    
    # Drop practice tables
    op.drop_index(op.f('ix_practiceanswer_session_id'), table_name='practiceanswer')
    op.drop_index(op.f('ix_practiceanswer_question_id'), table_name='practiceanswer')
    op.drop_table('practiceanswer')
    
    op.drop_index(op.f('ix_practicequestion_subtopic_id'), table_name='practicequestion')
    op.drop_index(op.f('ix_practicequestion_session_id'), table_name='practicequestion')
    op.drop_table('practicequestion')
    
    op.drop_index(op.f('ix_practicesession_user_id'), table_name='practicesession')
    op.drop_index(op.f('ix_practicesession_session_token'), table_name='practicesession')
    op.drop_index(op.f('ix_practicesession_roadmap_id'), table_name='practicesession')
    op.drop_table('practicesession')