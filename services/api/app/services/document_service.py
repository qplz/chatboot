"""
Document service — Phase 3.
Handles upload validation, storage, and triggers async ingestion pipeline.
"""
import asyncio
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.db.models.document import Document
from app.repositories.document_repository import DocumentRepository
from app.services.storage_service import storage_service


MIME_TYPE_MAP = {
    "pdf":  "application/pdf",
    "png":  "image/png",
    "jpg":  "image/jpeg",
    "jpeg": "image/jpeg",
}


class DocumentService:
    async def upload(
        self, file: UploadFile, owner_id: uuid.UUID, session: AsyncSession
    ) -> Document:
        # Validate extension
        original_name = file.filename or "unnamed"
        ext = Path(original_name).suffix.lstrip(".").lower()
        if ext not in settings.allowed_extensions_list:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Tipe file '{ext}' tidak diizinkan. Diizinkan: {settings.allowed_upload_extensions}",
            )

        # Read and validate size
        content = await file.read()
        if len(content) > settings.max_upload_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File melebihi batas maksimum {settings.max_upload_size_mb}MB",
            )
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="File kosong",
            )

        mime_type = self._detect_mime(content, ext)

        # Save file
        internal_name, file_path, checksum = await storage_service.save_file(
            content, original_name
        )

        # Persist document record
        repo = DocumentRepository(session)
        doc = await repo.create(
            owner_id=owner_id,
            filename=internal_name,
            original_name=original_name,
            file_path=file_path,
            file_size=len(content),
            mime_type=mime_type,
            checksum=checksum,
        )

        logger.info(
            "document_uploaded",
            doc_id=str(doc.id),
            owner=str(owner_id),
            name=original_name,
            size=len(content),
        )

        # Trigger ingestion pipeline in background (fire-and-forget)
        doc_id = doc.id
        asyncio.create_task(self._trigger_ingestion(doc_id))

        return doc

    async def _trigger_ingestion(self, doc_id: uuid.UUID) -> None:
        """Start ingestion pipeline asynchronously after upload response returns."""
        from app.services.ingestion_service import ingestion_service
        try:
            await ingestion_service.process_document(doc_id)
        except Exception as exc:
            logger.error("ingestion_trigger_failed", doc_id=str(doc_id), error=str(exc))

    def _detect_mime(self, content: bytes, ext: str) -> str:
        signatures = {
            b"%PDF":       "application/pdf",
            b"\x89PNG":    "image/png",
            b"\xff\xd8\xff": "image/jpeg",
        }
        for sig, mime in signatures.items():
            if content.startswith(sig):
                return mime
        return MIME_TYPE_MAP.get(ext, "application/octet-stream")


document_service = DocumentService()
