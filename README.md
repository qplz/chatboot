# AI Chatbot MVP — Website Only

AI Chatbot berbasis dokumen dengan RAG, dibangun untuk dijalankan di local dan di-deploy ke VPS Ubuntu.

**Status saat ini:** Fase 0-4 selesai (fondasi + auth + ingestion pipeline + RAG + embedding).

## Cara Cepat

```powershell
cd c:\ai-engineer\ai-chatbot-mvp
docker compose up -d postgres
docker compose run --rm api alembic upgrade head
docker compose up -d
```

Buka http://localhost:3000 — login dengan `admin@example.com` / `Admin123!`

Lihat [QUICKSTART.md](./QUICKSTART.md) untuk panduan lengkap.

## Stack

- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS
- **Backend:** FastAPI + Python 3.12 + SQLAlchemy async
- **Database:** PostgreSQL 17 + PGVector
- **Embedding:** sentence-transformers `all-MiniLM-L6-v2` (384 dim, CPU)
- **RAG:** Custom retrieval pipeline dengan cosine similarity
- **LLM:** Mock (lokal) / OpenAI API (set `LLM_PROVIDER=openai` di `.env`)
- **Container:** Docker + Docker Compose

## Cara Aktifkan OpenAI

Edit `.env`:
```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Lalu restart API:
```powershell
docker compose restart api
```

## Fase Implementasi

- [x] Fase 0 — Keputusan & setup
- [x] Fase 1 — Fondasi (Next.js + FastAPI + PostgreSQL)
- [x] Fase 2 — Login, RBAC, upload dokumen
- [x] Fase 3 — Document ingestion (PDF extraction + chunking)
- [x] Fase 4 — Embedding + PGVector retrieval + RAG + LLM
- [ ] Fase 5 — Agentic RAG + n8n workflows
- [ ] Fase 6 — UI polish + E2E tests
- [ ] Fase 7 — Security hardening
- [ ] Fase 8 — CI/CD (GitHub Actions)
- [ ] Fase 9 — VPS Ubuntu production
- [ ] Fase 10 — Monitoring + backup

Dokumentasi lengkap lihat `README AI Chatbot MVP.md`
