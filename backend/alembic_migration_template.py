"""Add user onboarding fields

Revision ID: add_user_onboarding
Revises: [previous_revision_id]
Create Date: 2025-08-22

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'add_user_onboarding'
down_revision = None  # Replace with actual previous revision ID
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns to user table
    op.add_column('user', sa.Column('display_name', sa.String(255), nullable=True))
    op.add_column('user', sa.Column('profile_completed', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('user', sa.Column('onboarding_completed', sa.Boolean(), nullable=False, server_default='false'))
    
    # Update existing users to have completed profiles (OAuth users)
    op.execute("""
        UPDATE user 
        SET profile_completed = TRUE, onboarding_completed = TRUE 
        WHERE email IS NOT NULL AND email NOT LIKE '%@phone.auth'
    """)

def downgrade():
    # Remove the columns
    op.drop_column('user', 'onboarding_completed')
    op.drop_column('user', 'profile_completed') 
    op.drop_column('user', 'display_name')