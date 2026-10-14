"""Conversation repository."""
import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.conversation import Conversation, Message


class ConversationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, owner_id: uuid.UUID, title: str = "New Conversation") -> Conversation:
        conv = Conversation(owner_id=owner_id, title=title)
        self.session.add(conv)
        await self.session.flush()   # get ID without full commit
        return conv

    async def get_by_id_and_owner(self, conv_id: uuid.UUID, owner_id: uuid.UUID) -> Conversation | None:
        result = await self.session.execute(
            select(Conversation)
            .where(Conversation.id == conv_id, Conversation.owner_id == owner_id)
            .options(selectinload(Conversation.messages))
        )
        return result.scalar_one_or_none()

    async def list_by_owner(
        self, owner_id: uuid.UUID, skip: int = 0, limit: int = 50
    ) -> tuple[list[Conversation], int]:
        q = select(Conversation).where(Conversation.owner_id == owner_id)
        count_result = await self.session.execute(
            select(func.count()).select_from(q.subquery())
        )
        total = count_result.scalar_one()
        result = await self.session.execute(
            q.order_by(Conversation.updated_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def add_message(
        self, conversation_id: uuid.UUID, role: str, content: str
    ) -> Message:
        msg = Message(conversation_id=conversation_id, role=role, content=content)
        self.session.add(msg)
        await self.session.flush()  # persist within current transaction, no commit
        return msg

    async def commit(self) -> None:
        await self.session.commit()

    async def delete(self, conv: Conversation) -> None:
        await self.session.delete(conv)
        await self.session.commit()
