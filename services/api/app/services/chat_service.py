"""
Chat service — Phase 4.
Uses RAG pipeline for document-grounded answers.

Session strategy:
  - User message: committed via request session
  - RAG retrieval: uses its OWN session (isolated from request session)
  - Assistant message: committed via request session
"""
import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.db.models.conversation import Conversation
from app.db.session import AsyncSessionLocal
from app.repositories.conversation_repository import ConversationRepository
from app.schemas.chat import ChatResponse, SourceCitation
from app.services.rag_service import rag_service


class ChatService:
    async def chat(
        self,
        question: str,
        owner_id: uuid.UUID,
        conversation_id: Optional[uuid.UUID],
        session: AsyncSession,
    ) -> ChatResponse:
        repo = ConversationRepository(session)

        # ── Step 1: Get or create conversation ───────────────────────────────
        conv: Optional[Conversation] = None
        if conversation_id:
            conv = await repo.get_by_id_and_owner(conversation_id, owner_id)

        if not conv:
            title = question[:60] + ("..." if len(question) > 60 else "")
            conv = await repo.create(owner_id=owner_id, title=title)

        conv_id = conv.id  # capture before potential session issues

        # ── Step 2: Save user message ─────────────────────────────────────────
        await repo.add_message(conv_id, role="user", content=question)
        await repo.commit()

        # ── Step 3: RAG in an isolated session ───────────────────────────────
        # Using a separate session ensures vector search errors cannot
        # corrupt the request session used to save messages.
        answer = ""
        source_chunks = []

        async with AsyncSessionLocal() as rag_session:
            try:
                answer, source_chunks = await rag_service.answer(
                    question=question,
                    owner_id=owner_id,
                    session=rag_session,
                )
            except Exception as exc:
                logger.error("rag_failed", error=str(exc), exc_info=True)
                answer = (
                    "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. "
                    "Silakan coba lagi."
                )
                source_chunks = []

        # ── Step 4: Save assistant message ───────────────────────────────────
        await repo.add_message(conv_id, role="assistant", content=answer)
        await repo.commit()

        # ── Step 5: Build source citations ────────────────────────────────────
        sources = [
            SourceCitation(
                document_id=uuid.UUID(chunk.document_id),
                document_name=chunk.document_name,
                page=chunk.page,
                chunk_id=uuid.UUID(chunk.chunk_id),
            )
            for chunk in source_chunks
        ]

        logger.info("chat_done", conv_id=str(conv_id), sources=len(sources))

        return ChatResponse(
            conversation_id=conv_id,
            answer=answer,
            sources=sources,
            status="completed",
        )


chat_service = ChatService()
