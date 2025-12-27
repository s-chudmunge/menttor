"""add_roadmap_id_and_is_generated_to_learningcontent

Revision ID: cba5ea0352fb
Revises: 2a1b3c4d5e6f
Create Date: 2025-09-27 15:46:07.361111

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cba5ea0352fb'
down_revision: Union[str, Sequence[str], None] = '2a1b3c4d5e6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # op.add_column('learningcontent', sa.Column('is_generated', sa.Boolean(), nullable=False, server_default='false'))
    
    # # Add roadmap_id column to learningcontent table
    # op.add_column('learningcontent', sa.Column('roadmap_id', sa.Integer(), nullable=True))
    
    # # Add foreign key constraint for roadmap_id
    # op.create_foreign_key('fk_learningcontent_roadmap_id', 'learningcontent', 'roadmap', ['roadmap_id'], ['id'])
    
    # # Create index on roadmap_id
    # op.create_index('ix_learningcontent_roadmap_id', 'learningcontent', ['roadmap_id'])
    pass


def downgrade() -> None:
    """Downgrade schema."""
    # Drop index and foreign key constraint
    op.drop_index('ix_learningcontent_roadmap_id', 'learningcontent')
    op.drop_constraint('fk_learningcontent_roadmap_id', 'learningcontent', type_='foreignkey')
    
    # Drop columns
    op.drop_column('learningcontent', 'roadmap_id')
    op.drop_column('learningcontent', 'is_generated')
