"""Update interview type and place

Revision ID: 002
Revises: 001
Create Date: 2024-01-01 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create new enum types
    op.execute("CREATE TYPE interview_place AS ENUM ('phone', 'video', 'onsite')")
    
    # Add the new place column
    op.add_column('interviews', sa.Column('place', postgresql.ENUM('phone', 'video', 'onsite', name='interview_place'), nullable=True))
    
    # Update existing data - set default place based on old type values
    # For existing records, we'll map the old combined values to separate type and place
    op.execute("""
        UPDATE interviews 
        SET place = CASE 
            WHEN type = 'phone' THEN 'phone'::interview_place
            WHEN type = 'video' THEN 'video'::interview_place  
            WHEN type = 'onsite' THEN 'onsite'::interview_place
            ELSE 'video'::interview_place  -- default for technical, behavioral, final
        END
    """)
    
    # Update the type values for existing records
    op.execute("""
        UPDATE interviews 
        SET type = CASE 
            WHEN type IN ('phone', 'video', 'onsite') THEN 'technical'::interview_type
            ELSE type::interview_type
        END
    """)
    
    # Drop the old enum values and recreate the enum with new values
    op.execute("ALTER TYPE interview_type RENAME TO interview_type_old")
    op.execute("CREATE TYPE interview_type AS ENUM ('technical', 'behavioral', 'hr', 'final')")
    op.execute("ALTER TABLE interviews ALTER COLUMN type TYPE interview_type USING type::text::interview_type")
    op.execute("DROP TYPE interview_type_old")
    
    # Make place column non-nullable
    op.alter_column('interviews', 'place', nullable=False)


def downgrade() -> None:
    # This is a complex downgrade since we're changing the enum structure
    # We'll need to map the new structure back to the old combined structure
    
    # First, update type values back to the old combined format
    op.execute("""
        UPDATE interviews 
        SET type = CASE 
            WHEN type = 'technical' AND place = 'phone' THEN 'phone'
            WHEN type = 'technical' AND place = 'video' THEN 'video'
            WHEN type = 'technical' AND place = 'onsite' THEN 'onsite'
            WHEN type = 'behavioral' THEN 'behavioral'
            WHEN type = 'hr' THEN 'behavioral'  -- Map HR back to behavioral
            WHEN type = 'final' THEN 'final'
            ELSE 'technical'
        END::text
    """)
    
    # Recreate the old enum type
    op.execute("ALTER TYPE interview_type RENAME TO interview_type_new")
    op.execute("CREATE TYPE interview_type AS ENUM ('phone', 'video', 'onsite', 'technical', 'behavioral', 'final')")
    op.execute("ALTER TABLE interviews ALTER COLUMN type TYPE interview_type USING type::text::interview_type")
    op.execute("DROP TYPE interview_type_new")
    
    # Drop the place column and its enum type
    op.drop_column('interviews', 'place')
    op.execute("DROP TYPE IF EXISTS interview_place")