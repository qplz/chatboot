"""Document repository."""
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.document import Document, IngestionJob


class DocumentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        owner_id: uuid.UUID,
        filename: str,
        original_name: str,
        file_path: str,
        file_size: int,
        mime_type: str,
        checksum: str | None = None,
    ) -> Document:
        doc = Document(
            owner_id=owner_id,
            filename=filename,
            original_name=original_name,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            status="queued",
            checksum=checksum,
        )
        self.session.add(doc)
        job = IngestionJob(document=doc, status="queued")
        self.session.add(job)
        await self.session.commit()
        await self.session.refresh(doc)
        return doc

    async def get_by_id_and_owner(self, doc_id: uuid.UUID, owner_id: uuid.UUID) -> Document | None:
        result = await self.session.execute(
            select(Document).where(
                Document.id == doc_id,
                Document.owner_id == owner_id,
                Document.is_deleted.is_(False),
            )
        )
        return result.scalar_one_or_none()

    async def list_by_owner(self, owner_id: uuid.UUID, skip: int = 0, limit: int = 50) -> tuple[list[Document], int]:
        q = select(Document).where(Document.owner_id == owner_id, Document.is_deleted.is_(False))
        count_result = await self.session.execute(select(func.count()).select_from(q.subquery()))
        total = count_result.scalar_one()
        result = await self.session.execute(q.order_by(Document.created_at.desc()).offset(skip).limit(limit))
        return list(result.scalars().all()), total

    async def soft_delete(self, doc: Document) -> None:
        doc.is_deleted = True
        doc.status = "deleted"
        await self.session.commit()
