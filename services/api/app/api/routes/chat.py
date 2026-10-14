"""Chat routes."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.db.session import get_db
from app.repositories.conversation_repository import ConversationRepository
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationResponse,
    MessageResponse,
)
from app.services.auth_service import get_current_user
from app.services.chat_service import chat_service

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """Send a question and receive an AI-generated answer."""
    return await chat_service.chat(
        question=body.question,
        owner_id=current_user.id,
        conversation_id=body.conversation_id,
        session=session,
    )


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ConversationListResponse:
    """List all conversations for current user."""
    repo = ConversationRepository(session)
    convs, total = await repo.list_by_owner(current_user.id, skip=skip, limit=min(limit, 100))
    return ConversationListResponse(
        items=[ConversationResponse.model_validate(c) for c in convs],
        total=total,
    )


@router.get("/conversations/{conv_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conv_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ConversationDetailResponse:
    """Get conversation detail with all messages."""
    repo = ConversationRepository(session)
    conv = await repo.get_by_id_and_owner(conv_id, current_user.id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        messages=[MessageResponse.model_validate(m) for m in conv.messages],
        created_at=conv.created_at,
    )


@router.delete("/conversations/{conv_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conv_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    """Delete a conversation owned by current user."""
    repo = ConversationRepository(session)
    conv = await repo.get_by_id_and_owner(conv_id, current_user.id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    await repo.delete(conv)
