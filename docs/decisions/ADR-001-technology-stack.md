# ADR-001: Technology Stack Decision

**Date:** 2026-10-13
**Status:** Accepted

## Context

Membangun AI Chatbot MVP berbasis website yang dapat dijalankan secara lokal dan di-deploy ke VPS Ubuntu.

## Decision

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS | App Router, SSR, type-safety, utility-first styling |
| Backend | FastAPI + Python 3.12 | Async-native, automatic OpenAPI docs, Pydantic validation |
| Database | PostgreSQL 17 + PGVector | Mature RDBMS, vector similarity search built-in |
| ORM | SQLAlchemy 2.x async | Modern async support, Alembic migrations |
| Auth | JWT (python-jose) + bcrypt (passlib) | Stateless tokens, industry-standard hashing |
| Container | Docker + Docker Compose | Consistent environment local/prod |
| Workflow | n8n | Visual automation, webhook support |
| LLM | Mock (local dev) → OpenAI API (production) | Zero cost during development |
| Embedding | Mock (local dev) → real model (production) | 384-dim vectors as baseline |
| OCR | PaddleOCR | Open source, supports Bahasa Indonesia |
| Reverse Proxy | Nginx | TLS termination, routing |

## Consequences

- LLM_PROVIDER=mock berarti jawaban chat adalah placeholder — Phase 4 akan mengintegrasikan LLM nyata
- Embedding_PROVIDER=mock berarti vector search belum aktif — Phase 4 akan mengaktifkan PGVector retrieval
- Semua keputusan versi dependency harus dikunci di requirements.txt dan package.json sebelum production
