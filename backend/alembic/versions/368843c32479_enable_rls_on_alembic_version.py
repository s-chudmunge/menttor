"""enable_rls_on_alembic_version

Revision ID: 368843c32479
Revises: cba5ea0352fb
Create Date: 2025-12-30 18:42:57.005902

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '368843c32479'
down_revision: Union[str, Sequence[str], None] = 'cba5ea0352fb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TABLE public.alembic_version ENABLE ROW LEVEL SECURITY;")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE public.alembic_version DISABLE ROW LEVEL SECURITY;")
