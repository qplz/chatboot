"""AI Chatbot MVP — FastAPI entry point."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from sqlalchemy import text

from app.api.routes import auth, chat, documents
from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("startup", env=settings.app_env, name=settings.app_name)

    # Run pending migrations on startup
    try:
        from alembic.config import Config
        from alembic import command
        import os
        # Support both Docker (/app/alembic.ini) and local Windows (relative path)
        alembic_ini = "/app/alembic.ini" if os.path.exists("/app/alembic.ini") else "alembic.ini"
        alembic_cfg = Config(alembic_ini)
        import asyncio
        await asyncio.to_thread(command.upgrade, alembic_cfg, "head")
        logger.info("migrations_applied")
    except Exception as exc:
        logger.warning("migration_auto_run_failed", error=str(exc))

    # Preload embedding model on startup so first request is fast
    if settings.embedding_provider == "local":
        try:
            from app.services.embedding_service import embedding_service
            embedding_service._get_model()
            logger.info("embedding_model_preloaded")
        except Exception as exc:
            logger.warning("embedding_model_preload_failed", error=str(exc))

    yield

    await engine.dispose()
    logger.info("shutdown")


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="AI Chatbot API",
    version="0.2.0",
    description="AI Chatbot MVP — Backend API (Phase 3 & 4)",
    lifespan=lifespan,
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url="/redoc" if settings.app_env != "production" else None,
)

# ── Rate limiting ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Request ID middleware ─────────────────────────────────────────────────────
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    import uuid
    from structlog import contextvars
    request_id = str(uuid.uuid4())
    contextvars.clear_contextvars()
    contextvars.bind_contextvars(request_id=request_id, path=request.url.path)
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ── Global exception handler (dev only) ──────────────────────────────────────
import traceback as _traceback
from fastapi.responses import PlainTextResponse

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    tb = _traceback.format_exc()
    logger.error("unhandled_exception", path=str(request.url), error=str(exc), traceback=tb)
    if settings.app_env == "development":
        return PlainTextResponse(f"500 Internal Server Error\n\n{tb}", status_code=500)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ── Health endpoints ──────────────────────────────────────────────────────────
@app.get("/health", tags=["ops"])
async def health() -> dict:
    return {"status": "ok", "version": "0.2.0"}


@app.get("/ready", tags=["ops"])
async def ready() -> dict:
    """Check database connectivity."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "ok"}
    except Exception as exc:
        logger.error("readiness_check_failed", error=str(exc))
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not ready", "database": "unavailable"},
        )


# ── API routes ────────────────────────────────────────────────────────────────
PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(documents.router, prefix=PREFIX)
app.include_router(chat.router, prefix=PREFIX)
