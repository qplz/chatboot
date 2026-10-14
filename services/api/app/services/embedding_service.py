"""
Embedding service — Phase 4.

Providers:
  - mock: returns zero vectors (for testing without ML deps)
  - local: sentence-transformers all-MiniLM-L6-v2 (384 dim, runs on CPU)
  - openai: text-embedding-3-small (1536 dim)
"""
import uuid
from typing import Optional

import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.db.models.document import DocumentEmbedding


class EmbeddingService:
    def __init__(self):
        self._model = None  # lazy load

    def _get_model(self):
        """Lazy-load sentence-transformers model on first use."""
        if self._model is not None:
            return self._model

        if settings.embedding_provider == "local":
            try:
                from sentence_transformers import SentenceTransformer
                model_name = settings.embedding_model
                if model_name == "mock-embedding":
                    model_name = "all-MiniLM-L6-v2"
                logger.info("loading_embedding_model", model=model_name)
                self._model = SentenceTransformer(model_name)
                logger.info("embedding_model_loaded", model=model_name)
            except Exception as exc:
                logger.error("embedding_model_load_failed", error=str(exc))
                raise
        return self._model

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of texts."""
        if not texts:
            return []

        provider = settings.embedding_provider

        if provider == "mock":
            dim = settings.embedding_dimension
            return [
                (np.random.randn(dim) * 0.1).tolist()
                for _ in texts
            ]

        if provider == "local":
            import asyncio
            model = self._get_model()
            vectors = await asyncio.to_thread(
                lambda: model.encode(texts, normalize_embeddings=True).tolist()
            )
            return vectors

        if provider == "openai":
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.openai_api_key.get_secret_value())
            model_name = settings.embedding_model or "text-embedding-3-small"
            response = await client.embeddings.create(input=texts, model=model_name)
            return [item.embedding for item in response.data]

        raise ValueError(f"Unknown embedding provider: {provider}")

    async def embed_query(self, text: str) -> list[float]:
        """Generate embedding for a single query."""
        results = await self.embed_batch([text])
        return results[0]

    async def save_embedding(
        self,
        session: AsyncSession,
        chunk_id: uuid.UUID,
        vector: list[float],
    ) -> None:
        """Persist an embedding vector to DB using pgvector."""
        from sqlalchemy import text

        vector_str = "[" + ",".join(f"{v:.8f}" for v in vector) + "]"
        await session.execute(
            text(
                "INSERT INTO document_embeddings "
                "(id, chunk_id, model_name, model_version, embedding) "
                "VALUES (gen_random_uuid(), :chunk_id, :model_name, :model_version, CAST(:embedding AS vector)) "
                "ON CONFLICT DO NOTHING"
            ),
            {
                "chunk_id": str(chunk_id),
                "model_name": settings.embedding_model,
                "model_version": "1.0",
                "embedding": vector_str,
            },
        )


embedding_service = EmbeddingService()
