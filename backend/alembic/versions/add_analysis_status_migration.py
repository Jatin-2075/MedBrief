"""add analysis_status to health data

Revision ID: add_analysis_status_001
Revises: <REPLACE_WITH_YOUR_LAST_REVISION_ID>
Create Date: 2026-06-30
"""
from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    op.add_column(
        "health_data",                          # change to your actual table name if different
        sa.Column(
            "analysis_status",
            sa.String(),
            nullable=False,
            server_default="pending",
        ),
    )
    # Backfill existing rows:
    # If a row has an AI summary/analysis field populated → completed, else → failed
    # Adjust the column name below to match whatever stores the Gemini output in your HealthData model
    op.execute("""
        UPDATE health_data
        SET analysis_status = CASE
            WHEN ai_analysis IS NOT NULL AND ai_analysis != '' THEN 'completed'
            ELSE 'failed'
        END
    """)


def downgrade() -> None:
    op.drop_column("health_data", "analysis_status")