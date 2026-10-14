# QUICKSTART — AI Chatbot MVP (Local)

Panduan menjalankan MVP di komputer lokal menggunakan Docker Compose.

## Prasyarat

Pastikan semua tools berikut sudah terinstal:

```powershell
git --version       # Git
docker --version    # Docker Desktop / Engine
docker compose version
node --version      # Node.js LTS (untuk development frontend tanpa Docker)
python --version    # Python 3.12+ (untuk development backend tanpa Docker)
```

---

## Setup Pertama Kali

### 1. Masuk ke direktori project

```powershell
cd c:\ai-engineer\ai-chatbot-mvp
```

### 2. Cek file .env sudah ada

File `.env` sudah dibuat dengan nilai development. Jika belum ada:

```powershell
Copy-Item .env.example .env
```

> **Catatan:** `.env` berisi nilai development lokal. Jangan commit ke Git.

### 3. Jalankan PostgreSQL terlebih dahulu

```powershell
docker compose up -d postgres
```

Tunggu hingga status healthy:

```powershell
docker compose ps
```

Output yang diharapkan:
```
NAME                          STATUS
ai-chatbot-mvp-postgres-1    Up (healthy)
```

### 4. Jalankan migrasi database

```powershell
docker compose run --rm api alembic upgrade head
```

Ini akan:
- Membuat semua tabel (users, documents, conversations, dll.)
- Mengaktifkan ekstensi PGVector
- Membuat akun admin awal

### 5. Jalankan semua services

```powershell
docker compose up -d
```

### 6. Cek status

```powershell
docker compose ps
```

Semua service harus berstatus `Up`:
```
ai-chatbot-mvp-postgres-1    Up (healthy)
ai-chatbot-mvp-api-1         Up (healthy)
ai-chatbot-mvp-web-1         Up
```

### 7. Lihat logs (opsional)

```powershell
docker compose logs -f api web
```

---

## Akses Aplikasi

| Service | URL | Deskripsi |
|---|---|---|
| **Website** | http://localhost:3000 | Frontend Next.js |
| **API Docs** | http://localhost:8000/docs | FastAPI Swagger UI |
| **API Health** | http://localhost:8000/health | Liveness check |

### Login Default

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `Admin123!` |

---

## Mode Development (tanpa Docker)

### Backend (FastAPI)

```powershell
cd services\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Pastikan PostgreSQL sudah running via Docker, lalu:

```powershell
# Update DATABASE_URL di .env untuk koneksi localhost
# DATABASE_URL=postgresql+asyncpg://ai_chatbot_app:dev_password_local_only@localhost:5432/ai_chatbot

alembic upgrade head
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend (Next.js)

```powershell
cd apps\web
npm install
npm run dev
```

Buka http://localhost:3000

---

## Workflow n8n (opsional)

Untuk mengaktifkan n8n:

```powershell
docker compose --profile automation up -d n8n
```

Akses editor: http://localhost:5678

---

## Perintah Berguna

```powershell
# Status semua container
docker compose ps

# Logs realtime
docker compose logs -f

# Logs service tertentu
docker compose logs -f api

# Masuk ke shell backend
docker compose exec api bash

# Akses database via psql
docker compose exec postgres psql -U ai_chatbot_app -d ai_chatbot

# Rebuild image
docker compose build api
docker compose up -d api

# Stop semua (data tetap aman)
docker compose stop

# Hapus container (volume data tetap)
docker compose down

# HATI-HATI: ini menghapus semua data
# docker compose down -v
```

---

## Struktur Project

```
ai-chatbot-mvp/
├── apps/web/           # Next.js frontend
├── services/api/       # FastAPI backend
├── ai/                 # RAG, ingestion, embeddings (Phase 4+)
├── n8n/workflows/      # n8n workflow exports
├── infra/              # Nginx, monitoring, backup configs
├── docs/decisions/     # Architecture Decision Records
├── .env                # Local env (jangan di-commit!)
├── .env.example        # Template env
├── compose.yaml        # Docker Compose
└── QUICKSTART.md       # Dokumen ini
```

---

## Fase Selanjutnya

| Fase | Deskripsi |
|---|---|
| Phase 3 | PaddleOCR + document pipeline |
| Phase 4 | Embedding + PGVector retrieval + real LLM |
| Phase 5 | Agentic RAG + n8n workflows |
| Phase 6 | Polish UI + E2E tests |
| Phase 7 | Security hardening |
| Phase 8 | Docker CI/CD |
| Phase 9 | VPS production deployment |

---

## Troubleshooting

**Container api tidak mau start:**
```powershell
docker compose logs api
```
Biasanya karena database belum healthy atau migration belum dijalankan.

**Port sudah digunakan:**
Ubah port di compose.yaml atau hentikan service yang menggunakan port tersebut.

**Migration gagal:**
```powershell
docker compose exec postgres psql -U ai_chatbot_app -d ai_chatbot -c "\dt"
```
Lihat apakah tabel sudah ada. Jika ada error pgvector, pastikan image `pgvector/pgvector:pg17` berhasil di-pull.

**Frontend tidak bisa connect ke API:**
Cek `NEXT_PUBLIC_API_BASE_URL` di `.env`. Untuk Docker-to-Docker, gunakan `http://api:8000`. Untuk browser, gunakan `http://localhost:8000`.
