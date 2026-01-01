"""Add roadmap table

Revision ID: 3f8a54b3b3a0
Revises: 
Create Date: 2024-07-25 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import sqlmodel

# revision identifiers, used by Alembic.
revision = '3f8a54b3b3a0'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('roadmap',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=False),
    sa.Column('roadmap_plan', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('subject', sa.String(), nullable=True),
    sa.Column('goal', sa.String(), nullable=True),
    sa.Column('time_value', sa.Integer(), nullable=True),
    sa.Column('time_unit', sa.String(), nullable=True),
    sa.Column('model', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('roadmap')
