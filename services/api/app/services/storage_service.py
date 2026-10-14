"""Local file storage service."""
import hashlib
import os
import uuid
from pathlib import Path

import aiofiles

from app.core.config import settings
from app.core.logging import logger


class StorageService:
    def __init__(self):
        self.upload_dir = Path(settings.upload_dir)

    def _ensure_dir(self) -> None:
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save_file(self, file_content: bytes, original_name: str) -> tuple[str, str, str]:
        """
        Save file bytes to storage.
        Returns: (internal_filename, file_path, sha256_checksum)
        """
        self._ensure_dir()
        ext = Path(original_name).suffix.lower()
        internal_name = f"{uuid.uuid4()}{ext}"
        file_path = self.upload_dir / internal_name

        async with aiofiles.open(file_path, "wb") as f:
            await f.write(file_content)

        checksum = hashlib.sha256(file_content).hexdigest()
        logger.info("file_saved", path=str(file_path), size=len(file_content))
        return internal_name, str(file_path), checksum

    async def delete_file(self, file_path: str) -> None:
        path = Path(file_path)
        if path.exists():
            path.unlink()
            logger.info("file_deleted", path=file_path)

    async def read_file(self, file_path: str) -> bytes:
        async with aiofiles.open(file_path, "rb") as f:
            return await f.read()


storage_service = StorageService()
