"""
Agentic RAG service — Phase 4.

Pipeline:
  1. Embed query
  2. Retrieve top-k chunks from PGVector (filtered by owner)
  3. Build context with token budget
  4. Generate answer via LLM (OpenAI or mock)
  5. Return answer + sources
"""
import uuid
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.services.embedding_service import embedding_service


MAX_CONTEXT_CHARS = 6000  # ~1500 tokens — safe for most models


@dataclass
class RetrievedChunk:
    chunk_id: str
    document_id: str
    document_name: str
    page: int | None
    text: str
    score: float


class RAGService:

    # ── Retrieval ─────────────────────────────────────────────────────────────

    async def retrieve(
        self,
        query: str,
        owner_id: uuid.UUID,
        session: AsyncSession,
        top_k: int | None = None,
    ) -> list[RetrievedChunk]:
        """Vector similarity search with owner access filter."""
        top_k = top_k or settings.retrieval_top_k

        try:
            query_vector = await embedding_service.embed_query(query)
        except Exception as exc:
            logger.warning("embed_query_failed", error=str(exc))
            return []

        vector_str = "[" + ",".join(f"{v:.8f}" for v in query_vector) + "]"

        from sqlalchemy import text

        # Use a savepoint so any DB error doesn't abort the parent transaction
        try:
            async with session.begin_nested():
                result = await session.execute(
                    text("""
                        SELECT
                            dc.id           AS chunk_id,
                            dc.document_id,
                            d.original_name AS document_name,
                            dc.page_number  AS page,
                            dc.text,
                            1 - (de.embedding <=> CAST(:query_vec AS vector)) AS score
                        FROM document_embeddings de
                        JOIN document_chunks dc ON dc.id = de.chunk_id
                        JOIN documents d ON d.id = dc.document_id
                        WHERE d.owner_id = CAST(:owner_id AS uuid)
                          AND d.is_deleted = false
                          AND d.status = 'completed'
                        ORDER BY de.embedding <=> CAST(:query_vec AS vector)
                        LIMIT :top_k
                    """),
                    {
                        "query_vec": vector_str,
                        "owner_id": str(owner_id),
                        "top_k": top_k,
                    },
                )
                rows = result.fetchall()
        except Exception as exc:
            logger.warning("vector_search_failed", error=str(exc))
            return []

        chunks = [
            RetrievedChunk(
                chunk_id=str(row.chunk_id),
                document_id=str(row.document_id),
                document_name=row.document_name,
                page=row.page,
                text=row.text,
                score=float(row.score),
            )
            for row in rows
            if row.score > 0.3
        ]

        logger.info("retrieval_done", query_len=len(query), results=len(chunks))
        return chunks

    # ── Context builder ───────────────────────────────────────────────────────

    def _build_context(self, chunks: list[RetrievedChunk]) -> str:
        """Assemble context string within token budget."""
        parts = []
        total = 0
        for chunk in chunks:
            header = f"[Sumber: {chunk.document_name}, Hal. {chunk.page or '?'}]\n"
            block = header + chunk.text + "\n"
            if total + len(block) > MAX_CONTEXT_CHARS:
                break
            parts.append(block)
            total += len(block)
        return "\n---\n".join(parts)

    # ── LLM generation ────────────────────────────────────────────────────────

    async def _generate(self, question: str, context: str) -> str:
        provider = settings.llm_provider

        if provider == "mock" or not context:
            if not context:
                return (
                    "Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. "
                    "Pastikan dokumen sudah diunggah dan selesai diproses."
                )
            return (
                f"Berdasarkan dokumen yang tersedia:\n\n{context[:500]}...\n\n"
                "[Mode mock aktif — integrasikan OpenAI API untuk jawaban nyata]"
            )

        if provider == "openai":
            return await self._generate_openai(question, context)

        return f"[Provider '{provider}' belum diimplementasikan]"

    async def _generate_openai(self, question: str, context: str) -> str:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            api_key=settings.openai_api_key.get_secret_value()
        )
        system_prompt = (
            "Anda adalah asisten AI yang menjawab pertanyaan berdasarkan dokumen yang diberikan. "
            "Jawab dalam Bahasa Indonesia. "
            "Gunakan HANYA informasi dari konteks berikut. "
            "Jika informasi tidak tersedia dalam konteks, katakan dengan jelas bahwa informasi tidak ditemukan. "
            "Jangan mengarang jawaban.\n\n"
            f"KONTEKS DOKUMEN:\n{context}"
        )
        response = await client.chat.completions.create(
            model=settings.openai_model or "gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            max_tokens=1024,
            temperature=0.1,
        )
        return response.choices[0].message.content or ""

    # ── Main entry point ──────────────────────────────────────────────────────

    async def answer(
        self,
        question: str,
        owner_id: uuid.UUID,
        session: AsyncSession,
    ) -> tuple[str, list[RetrievedChunk]]:
        """
        Full RAG pipeline. Returns (answer_text, source_chunks).
        """
        # Skip retrieval for mock embedding (vectors are random noise)
        if settings.embedding_provider == "mock":
            chunks: list[RetrievedChunk] = []
        else:
            chunks = await self.retrieve(question, owner_id, session)

        context = self._build_context(chunks) if chunks else ""
        answer = await self._generate(question, context)

        return answer, chunks


rag_service = RAGService()
