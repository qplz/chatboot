"""
Document ingestion pipeline — Phase 3 & 4.

State machine: queued -> processing -> completed | failed | needs_review

Each stage uses its own DB session to avoid transaction state corruption.
"""
import asyncio
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.db.models.document import Document, DocumentChunk, IngestionJob
from app.db.session import AsyncSessionLocal


# ── Text extraction ──────────────────────────────────────────────────────────

def _extract_pdf(file_path: str) -> list[dict]:
    """Extract text from a digital PDF. Returns list of {page, text}."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        pages = []
        for i, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            text = _clean_text(text)
            if text.strip():
                pages.append({"page": i, "text": text})
        return pages
    except Exception as exc:
        logger.warning("pdf_extraction_failed", error=str(exc))
        return []


def _extract_image(file_path: str) -> list[dict]:
    """Extract text from image using Tesseract OCR."""
    try:
        import pytesseract
        from PIL import Image

        img = Image.open(file_path)
        # Try Indonesian first, fallback to English
        text = pytesseract.image_to_string(img, lang="ind+eng", config="--psm 3")
        text = _clean_text(text)
        if text.strip():
            logger.info("ocr_success", path=file_path, chars=len(text))
            return [{"page": 1, "text": text}]
        else:
            logger.warning("ocr_no_text", path=file_path)
            return [{"page": 1, "text": f"[OCR tidak menghasilkan teks: {Path(file_path).name}]"}]
    except ImportError:
        logger.warning("pytesseract_not_installed")
        return [{"page": 1, "text": f"[OCR tidak tersedia: {Path(file_path).name}]"}]
    except Exception as exc:
        logger.warning("ocr_failed", error=str(exc), path=file_path)
        return [{"page": 1, "text": f"[OCR gagal: {Path(file_path).name}]"}]


def _clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\x20-\x7E\u00C0-\u024F\u0400-\u04FF\n\u0080-\u024F\u1E00-\u1EFF\u0020-\u007E]", "", text)
    return text.strip()


def _chunk_text(text: str, page: int, chunk_size: int = None, overlap: int = None) -> list[dict]:
    chunk_size = chunk_size or settings.chunk_size
    overlap = overlap or settings.chunk_overlap
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks = []
    current = ""
    idx = 0
    for sentence in sentences:
        if len(current) + len(sentence) + 1 <= chunk_size:
            current = (current + " " + sentence).strip()
        else:
            if current:
                chunks.append({"chunk_index": idx, "page": page, "text": current})
                idx += 1
                overlap_text = current[-overlap:] if len(current) > overlap else current
                current = (overlap_text + " " + sentence).strip()
            else:
                current = sentence
    if current:
        chunks.append({"chunk_index": idx, "page": page, "text": current})
    return chunks


# ── DB helpers (each with its own session) ───────────────────────────────────

async def _get_doc_and_job(document_id: uuid.UUID):
    """Load document and job in a fresh session."""
    async with AsyncSessionLocal() as session:
        doc_result = await session.execute(select(Document).where(Document.id == document_id))
        doc = doc_result.scalar_one_or_none()
        if not doc:
            return None, None

        job_result = await session.execute(
            select(IngestionJob)
            .where(IngestionJob.document_id == document_id)
            .order_by(IngestionJob.created_at.desc())
        )
        job = job_result.scalar_one_or_none()
        if not job:
            job = IngestionJob(document_id=document_id, status="queued")
            session.add(job)
            await session.commit()
            await session.refresh(job)

        return doc, job


async def _mark_processing(document_id: uuid.UUID, job_id: uuid.UUID) -> None:
    async with AsyncSessionLocal() as session:
        doc = await session.get(Document, document_id)
        job = await session.get(IngestionJob, job_id)
        if doc and job:
            doc.status = "processing"
            job.status = "processing"
            job.started_at = datetime.now(timezone.utc)
            job.attempt_count += 1
            await session.commit()


async def _save_chunks(document_id: uuid.UUID, owner_id: uuid.UUID, original_name: str,
                       all_chunks: list[dict]) -> list[uuid.UUID]:
    """Delete old chunks then save new ones. Returns new chunk IDs."""
    from sqlalchemy import delete as sa_delete
    async with AsyncSessionLocal() as session:
        # Remove old chunks from previous ingestion attempts
        await session.execute(
            sa_delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
        )
        await session.flush()

        chunk_ids = []
        for chunk_data in all_chunks:
            chunk_obj = DocumentChunk(
                document_id=document_id,
                chunk_index=chunk_data["chunk_index"],
                page_number=chunk_data["page"],
                text=chunk_data["text"],
                metadata_={
                    "doc_name": original_name,
                    "owner_id": str(owner_id),
                },
            )
            session.add(chunk_obj)
            await session.flush()
            chunk_ids.append(chunk_obj.id)
        await session.commit()
        logger.info("chunks_saved", doc_id=str(document_id), count=len(chunk_ids))
        return chunk_ids


async def _save_embeddings(chunk_id_text_pairs: list[tuple[uuid.UUID, str]]) -> int:
    """Generate and save embeddings for a list of (chunk_id, text) pairs."""
    from app.services.embedding_service import embedding_service
    from sqlalchemy import text as sa_text

    texts = [pair[1] for pair in chunk_id_text_pairs]
    try:
        vectors = await embedding_service.embed_batch(texts)
    except Exception as exc:
        logger.warning("embedding_batch_failed", error=str(exc))
        return 0

    async with AsyncSessionLocal() as session:
        count = 0
        for (chunk_id, _), vector in zip(chunk_id_text_pairs, vectors):
            vector_str = "[" + ",".join(f"{v:.8f}" for v in vector) + "]"
            await session.execute(
                sa_text(
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
            count += 1
        await session.commit()
        logger.info("embeddings_saved", count=count)
        return count


async def _mark_status(document_id: uuid.UUID, job_id: uuid.UUID,
                        status: str, error_code: str = None) -> None:
    async with AsyncSessionLocal() as session:
        doc = await session.get(Document, document_id)
        job = await session.get(IngestionJob, job_id)
        if doc:
            doc.status = status
        if job:
            job.status = status
            job.finished_at = datetime.now(timezone.utc)
            if error_code:
                job.error_code = error_code
        await session.commit()


# ── Main ingestion service ────────────────────────────────────────────────────

class IngestionService:
    async def process_document(self, document_id: uuid.UUID) -> None:
        """Main entry point — runs in background after upload."""
        logger.info("ingestion_start", doc_id=str(document_id))

        # 1. Load doc and job
        doc, job = await _get_doc_and_job(document_id)
        if not doc:
            logger.error("ingestion_doc_not_found", doc_id=str(document_id))
            return

        if doc.status == "completed":
            logger.info("ingestion_already_completed", doc_id=str(document_id))
            return

        job_id = job.id
        owner_id = doc.owner_id
        original_name = doc.original_name
        file_path = doc.file_path
        mime = doc.mime_type

        # 2. Mark as processing
        await _mark_processing(document_id, job_id)

        try:
            # 3. Extract text
            if mime == "application/pdf":
                pages = await asyncio.to_thread(_extract_pdf, file_path)
            elif mime in ("image/png", "image/jpeg"):
                pages = await asyncio.to_thread(_extract_image, file_path)
            else:
                pages = []

            if not pages:
                await _mark_status(document_id, job_id, "needs_review", "no_text_extracted")
                logger.warning("ingestion_no_text", doc_id=str(document_id))
                return

            # 4. Chunk
            all_chunks: list[dict] = []
            global_idx = 0
            for page_data in pages:
                for chunk in _chunk_text(page_data["text"], page_data["page"]):
                    chunk["chunk_index"] = global_idx
                    all_chunks.append(chunk)
                    global_idx += 1

            logger.info("ingestion_chunked", doc_id=str(document_id), count=len(all_chunks))

            # 5. Save chunks (own session)
            chunk_ids = await _save_chunks(document_id, owner_id, original_name, all_chunks)

            # 6. Generate & save embeddings (own session)
            chunk_id_text_pairs = [
                (cid, chunk["text"])
                for cid, chunk in zip(chunk_ids, all_chunks)
            ]
            emb_count = await _save_embeddings(chunk_id_text_pairs)
            logger.info("ingestion_pipeline_done",
                        doc_id=str(document_id),
                        chunks=len(chunk_ids),
                        embeddings=emb_count)

            # 7. Mark complete
            await _mark_status(document_id, job_id, "completed")
            logger.info("ingestion_complete", doc_id=str(document_id))

        except Exception as exc:
            logger.error("ingestion_failed", doc_id=str(document_id), error=str(exc), exc_info=True)
            await _mark_status(document_id, job_id, "failed", type(exc).__name__[:100])


ingestion_service = IngestionService()
