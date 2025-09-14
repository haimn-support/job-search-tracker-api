"""Initial database schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types
    op.execute("CREATE TYPE position_status AS ENUM ('applied', 'screening', 'interviewing', 'offer', 'rejected', 'withdrawn')")
    op.execute("CREATE TYPE interview_type AS ENUM ('technical', 'behavioral', 'hr', 'final')")
    op.execute("CREATE TYPE interview_place AS ENUM ('phone', 'video', 'onsite')")
    op.execute("CREATE TYPE interview_outcome AS ENUM ('pending', 'passed', 'failed', 'cancelled')")
    
    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=True),
        sa.Column('last_name', sa.String(length=100), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Create positions table
    op.create_table('positions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('company', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('salary_range', sa.String(length=100), nullable=True),
        sa.Column('status', postgresql.ENUM('applied', 'screening', 'interviewing', 'offer', 'rejected', 'withdrawn', name='position_status'), nullable=False),
        sa.Column('application_date', sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_positions_user_id'), 'positions', ['user_id'], unique=False)
    op.create_index(op.f('ix_positions_status'), 'positions', ['status'], unique=False)
    op.create_index(op.f('ix_positions_application_date'), 'positions', ['application_date'], unique=False)
    
    # Create interviews table
    op.create_table('interviews',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('position_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', postgresql.ENUM('technical', 'behavioral', 'hr', 'final', name='interview_type'), nullable=False),
        sa.Column('place', postgresql.ENUM('phone', 'video', 'onsite', name='interview_place'), nullable=False),
        sa.Column('scheduled_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('outcome', postgresql.ENUM('pending', 'passed', 'failed', 'cancelled', name='interview_outcome'), nullable=False),
        sa.ForeignKeyConstraint(['position_id'], ['positions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_interviews_position_id'), 'interviews', ['position_id'], unique=False)
    op.create_index(op.f('ix_interviews_scheduled_date'), 'interviews', ['scheduled_date'], unique=False)


def downgrade() -> None:
    # Drop tables
    op.drop_table('interviews')
    op.drop_table('positions')
    op.drop_table('users')
    
    # Drop enum types
    op.execute("DROP TYPE IF EXISTS interview_outcome")
    op.execute("DROP TYPE IF EXISTS interview_place")
    op.execute("DROP TYPE IF EXISTS interview_type")
    op.execute("DROP TYPE IF EXISTS position_status")