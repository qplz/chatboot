"""Add vector embedding column to document_embeddings.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-13
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add vector column — dimension must match EMBEDDING_DIMENSION in .env (384)
    op.execute("""
        ALTER TABLE document_embeddings
        ADD COLUMN IF NOT EXISTS embedding vector(384)
    """)
    # Index for cosine similarity search
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_doc_embeddings_vector
        ON document_embeddings
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 10)
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_doc_embeddings_vector")
    op.execute("ALTER TABLE document_embeddings DROP COLUMN IF EXISTS embedding")
