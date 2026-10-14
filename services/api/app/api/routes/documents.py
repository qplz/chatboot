"""Document routes — Phase 3."""
import asyncio
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.db.models.user import User
from app.db.session import get_db
from app.repositories.document_repository import DocumentRepository
from app.schemas.document import (
    DocumentListResponse,
    DocumentResponse,
    DocumentUploadResponse,
)
from app.services.auth_service import get_current_user
from app.services.document_service import document_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> DocumentUploadResponse:
    """Upload a document — triggers ingestion pipeline automatically."""
    doc = await document_service.upload(file, current_user.id, session)
    return DocumentUploadResponse(
        id=doc.id,
        original_name=doc.original_name,
        status=doc.status,
        message="Dokumen berhasil diunggah dan antri untuk diproses.",
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> DocumentListResponse:
    """List all documents owned by current user."""
    repo = DocumentRepository(session)
    docs, total = await repo.list_by_owner(current_user.id, skip=skip, limit=min(limit, 100))
    return DocumentListResponse(
        items=[DocumentResponse.model_validate(d) for d in docs],
        total=total,
    )


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    """Get document detail and processing status."""
    repo = DocumentRepository(session)
    doc = await repo.get_by_id_and_owner(doc_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokumen tidak ditemukan")
    return DocumentResponse.model_validate(doc)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    """Soft-delete a document owned by current user."""
    repo = DocumentRepository(session)
    doc = await repo.get_by_id_and_owner(doc_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokumen tidak ditemukan")
    await repo.soft_delete(doc)
    logger.info("document_deleted", doc_id=str(doc_id), user=str(current_user.id))


@router.post("/{doc_id}/reprocess", response_model=DocumentUploadResponse)
async def reprocess_document(
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> DocumentUploadResponse:
    """Re-trigger ingestion for a failed or needs_review document."""
    repo = DocumentRepository(session)
    doc = await repo.get_by_id_and_owner(doc_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokumen tidak ditemukan")

    if doc.status not in ("failed", "needs_review", "queued"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Dokumen tidak dapat diproses ulang dari status '{doc.status}'",
        )

    # Reset status
    doc.status = "queued"
    await session.commit()

    # Fire background ingestion
    from app.services.ingestion_service import ingestion_service
    asyncio.create_task(ingestion_service.process_document(doc_id))

    logger.info("document_reprocess_triggered", doc_id=str(doc_id))
    return DocumentUploadResponse(
        id=doc.id,
        original_name=doc.original_name,
        status="queued",
        message="Dokumen dijadwalkan ulang untuk diproses.",
    )
