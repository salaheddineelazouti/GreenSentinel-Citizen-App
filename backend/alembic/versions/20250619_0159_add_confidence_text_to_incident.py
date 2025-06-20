"""Add confidence_text to Incident

Revision ID: 4afae26fe1bd
Revises: d33c6e36b9c4
Create Date: 2025-06-19 01:59:01.064564

"""
from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision = '4afae26fe1bd'
down_revision = 'd33c6e36b9c4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ajout de la colonne confidence_text à la table incident
    op.add_column('incident', sa.Column('confidence_text', sa.Float(), nullable=True))


def downgrade() -> None:
    # Suppression de la colonne confidence_text de la table incident
    op.drop_column('incident', 'confidence_text')
