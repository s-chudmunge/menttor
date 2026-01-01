"""remove_practice_tables

Revision ID: 202488583727
Revises: 3f8a54b3b3a0
Create Date: 2026-01-01 18:34:25.685342

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '202488583727'
down_revision: Union[str, Sequence[str], None] = '3f8a54b3b3a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_table('practiceanswer')
    op.drop_table('practicequestion')
    op.drop_table('practicesession')
    op.drop_column('userprogress', 'last_practice_at')
    op.drop_column('userprogress', 'total_practice_sessions')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table('practicesession',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.dialects.postgresql.UUID(), autoincrement=False, nullable=False),
        sa.Column('roadmap_id', sa.Integer(), autoincrement=False, nullable=False),
        sa.Column('session_type', sa.VARCHAR(length=50), autoincrement=False, nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), server_default=sa.text('now()'), autoincrement=False, nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), autoincrement=False, nullable=True),
        sa.Column('score', sa.Float(), autoincrement=False, nullable=True),
        sa.Column('total_questions', sa.Integer(), autoincrement=False, nullable=True),
        sa.Column('correct_answers', sa.Integer(), autoincrement=False, nullable=True),
        sa.Column('status', sa.VARCHAR(length=50), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(['roadmap_id'], ['roadmaps.id'], name='practicesession_roadmap_id_fkey'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='practicesession_user_id_fkey'),
        sa.PrimaryKeyConstraint('id', name='practicesession_pkey')
    )
    op.create_table('practicequestion',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), autoincrement=False, nullable=False),
        sa.Column('topic_id', sa.Integer(), autoincrement=False, nullable=False),
        sa.Column('subtopic_id', sa.Integer(), autoincrement=False, nullable=False),
        sa.Column('question_text', sa.Text(), autoincrement=False, nullable=False),
        sa.Column('question_type', sa.VARCHAR(length=50), autoincrement=False, nullable=False),
        sa.Column('difficulty_level', sa.Integer(), autoincrement=False, nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['practicesession.id'], name='practicequestion_session_id_fkey'),
        sa.ForeignKeyConstraint(['subtopic_id'], ['subtopics.id'], name='practicequestion_subtopic_id_fkey'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], name='practicequestion_topic_id_fkey'),
        sa.PrimaryKeyConstraint('id', name='practicequestion_pkey')
    )
    op.create_table('practiceanswer',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), autoincrement=False, nullable=False),
        sa.Column('user_answer', sa.Text(), autoincrement=False, nullable=True),
        sa.Column('is_correct', sa.Boolean(), autoincrement=False, nullable=True),
        sa.Column('answered_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(['question_id'], ['practicequestion.id'], name='practiceanswer_question_id_fkey'),
        sa.PrimaryKeyConstraint('id', name='practiceanswer_pkey')
    )
    op.add_column('userprogress', sa.Column('last_practice_at', sa.DateTime(timezone=True), autoincrement=False, nullable=True))
    op.add_column('userprogress', sa.Column('total_practice_sessions', sa.Integer(), server_default=sa.text('0'), autoincrement=False, nullable=True))
