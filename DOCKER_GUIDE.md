# Panduan Docker & Docker Compose
### Spesifikasi Lingkungan: Ubuntu 22.04.5 LTS & Docker Engine 29.9.1

Panduan ini disusun khusus untuk menjalankan project **AI Chatbot MVP & Agentic RAG** di sistem operasi **Ubuntu 22.04.5 LTS** menggunakan **Docker version 29.9.1** (Docker Compose V2 specification) dengan model lokal **Ollama (Qwen 2.5: 3B)**.

---

## 1. Verifikasi Versi OS & Docker

Jalankan perintah berikut di terminal Ubuntu untuk memastikan kesesuaian sistem:

```bash
# 1. Cek versi OS Ubuntu
lsb_release -a
# Hasil yang diharapkan: Ubuntu 22.04.5 LTS (jammy)

# 2. Cek versi Docker Engine
docker --version
# Hasil yang diharapkan: Docker version 29.9.1 (atau Docker 29.x)

# 3. Cek versi Docker Compose (Compose V2 plugin)
docker compose version
```

> **Catatan Docker 29.x:** Pada Docker modern, perintah standar yang digunakan adalah `docker compose` (dengan spasi), bukan `docker-compose` (versi 1 lama).

---

## 2. Struktur Layanan (Services)

File `docker-compose.yml` mengorkestrasi 6 layanan utama + 1 helper auto-puller dalam satu jaringan bridge privat (`ai_chatbot_network`) dengan port host terisolasi ke `127.0.0.1`:

| Service | Container Name | Image / Build | Port Host (Binding) | Fungsi |
|---|---|---|---|---|
| **web** | `ai-chatbot-web` | *Local Build (`Dockerfile`)* | `127.0.0.1:8080` | Frontend React SPA + Nginx (Gzip, caching, healthcheck, `/api/` & `/ollama/` reverse proxy) |
| **backend** | `ai-chatbot-backend` | *Local Build (`backend/`)* | `127.0.0.1:8000` | Backend API FastAPI + Python 3.12 (RAG, kalkulasi matematika, Ollama inference, Swagger docs di `/docs`) |
| **postgres** | `ai-chatbot-postgres` | `pgvector/pgvector:pg17` | `127.0.0.1:5432` | PostgreSQL 17 + Ekstensi **PGVector** (vektor RAG) |
| **minio** | `ai-chatbot-minio` | `cgr.dev/chainguard/minio:latest` | `127.0.0.1:9000`, `127.0.0.1:9001` | S3-compatible Object Storage (Distribusi aman Chainguard, 100% bebas 401 Quay/DockerHub) |
| **n8n** | `ai-chatbot-n8n` | `n8nio/n8n:latest` | `127.0.0.1:5678` | Workflow Automation engine (Official Docker Hub image) |
| **ollama** | `ai-chatbot-ollama` | `ollama/ollama:latest` | `127.0.0.1:11434` | Local LLM Inference Engine menjalankan model **`qwen2.5:3b`** |
| **ollama-pull** | `ai-chatbot-ollama-pull` | `ollama/ollama:latest` | *-* | Auto-puller helper yang otomatis mengunduh model `qwen2.5:3b` saat startup pertama |

---

## 3. Langkah Menjalankan Project (Sudah Disesuaikan & Diperbaiki)

### Langkah 1: Pastikan Tidak Ada File Ganda (compose.yaml)
Jika di server Anda sebelumnya terdapat file `compose.yaml`, hapus agar Docker Compose hanya membaca `docker-compose.yml`:
```bash
rm -f /opt/agentic-rag/compose.yaml
```

### Langkah 2: File Environment (.env) Sudah Disediakan
File `.env` otomatis telah dibuat dengan port yang disesuaikan dan konfigurasi model Ollama `qwen2.5:3b`:
```bash
# Periksa file .env
cat .env
```

### Langkah 3: Build & Jalankan Kontainer
Gunakan perintah Compose V2:
```bash
# Tarik base image resmi
sudo docker compose pull

# Build service lokal (Frontend & Backend) dan jalankan di background
sudo docker compose up -d --build
```

Container `ai-chatbot-ollama-pull` otomatis akan memeriksa apakah model `qwen2.5:3b` sudah ada di volume storage. Jika belum ada, kontainer ini akan mengunduh model tersebut secara otomatis.

### Langkah 4: Periksa Status Kontainer
```bash
sudo docker compose ps
```
Semua kontainer utama akan berstatus `running` (Up) dan `healthy`.

---

## 4. Akses Aplikasi & Dashboard

Setelah kontainer aktif, akses layanan melalui IP localhost:

- **Frontend Web Chatbot**: `http://127.0.0.1:8080`
  - *Akun Admin*: `admin@example.com` / `Admin123!`
  - *Akun User*: `user@example.com` / `User123!`
- **Backend API & Swagger Docs**: `http://127.0.0.1:8000/docs`
  - *Endpoint Status*: `http://127.0.0.1:8000/api/v1/status`
  - *Liveness Probe*: `http://127.0.0.1:8000/healthz`
- **Ollama API Endpoint**: `http://127.0.0.1:11434`
  - *Cek Model*: `curl http://127.0.0.1:11434/api/tags`
  - *Model Aktif*: `qwen2.5:3b`
- **MinIO Storage Console**: `http://127.0.0.1:9001`
  - *User*: `admin`
  - *Password*: `minioadmin123`
  - *S3 API Endpoint*: `http://127.0.0.1:9000`
- **n8n Workflow**: `http://127.0.0.1:5678`
- **PostgreSQL PGVector**: `127.0.0.1:5432`
  - *Database*: `ai_chatbot`
  - *User*: `postgres`
  - *Password*: `postgres123`

---

## 5. Menguji Model Ollama Qwen 2.5 (3B)

Anda dapat menguji model `qwen2.5:3b` langsung dari terminal server:

```bash
# 1. Cek daftar model yang terpasang di kontainer Ollama
sudo docker exec -it ai-chatbot-ollama ollama list

# 2. Uji tanya jawab langsung (interaktif) dengan Qwen 2.5
sudo docker exec -it ai-chatbot-ollama ollama run qwen2.5:3b "Halo, perkenalkan dirimu"

# 3. Uji via REST API Ollama
curl http://127.0.0.1:11434/api/generate -d '{
  "model": "qwen2.5:3b",
  "prompt": "Berapa hasil dari 1 + 1?",
  "stream": false
}'
```

---

## 6. Solusi Permasalahan (Troubleshooting yang Telah Diperbaiki)

1. **Error `range of CPUs is from 0.01 to 2.00, as there are only 2 CPUs available`**:
   - **Penyebab**: Server VPS Anda memiliki 2 CPU core, namun pada konfigurasi `ollama` sebelumnya didefinisikan limit `cpus: "4.0"`. Docker Engine versi 29 secara ketat menolak alokasi limit kontainer yang melebihi kapasitas fisik core host.
   - **Solusi**: Nilai `cpus: "4.0"` telah dihapus dari `docker-compose.yml`. Alokasi CPU kini bersifat dinamis dan adaptif mengikuti 2 CPU host tanpa batasan kaku, mencegah error daemon Docker.

2. **Error `Tidak menghasilkan jawaban` saat ditanya `1+1=2` atau pertanyaan umum**:
   - **Penyebab**: Intent classification sebelumnya salah mengklasifikasikan pertanyaan meta seperti *"bagaimana caranya agar project saya bisa menjawab pertanyaan 1+1=2..."* sebagai persamaan matematika murni, serta mengembalikan guardrail kosong jika tidak ada dokumen yang cocok.
   - **Solusi**: Diterapkan **Dual-Path Intent Classifier** baru yang membedakan:
     - Pertanyaan arsitektur sistem (menjelaskan 5 pilar sistem RAG & Qwen 2.5 secara detail).
     - Pertanyaan verifikasi aritmatika murni (`1+1=2` -> validasi BENAR & langkah kalkulasi).
     - Pertanyaan sapaan & identitas asisten AI.
     - Pengetahuan umum (AI, RAG, dsb) dengan penjelasan komprehensif.

3. **Peringatan File Ganda (`Found multiple config files`)**:
   - **Penyebab**: Terdapat `compose.yaml` dan `docker-compose.yml` di folder yang sama.
   - **Solusi**: File `compose.yaml` telah dihapus.

4. **Error `401 UNAUTHORIZED` pada MinIO**:
   - **Penyebab**: MinIO membatasi image publik di Docker Hub dan Quay.io.
   - **Solusi**: Diganti menggunakan distribusi publik resmi Chainguard `cgr.dev/chainguard/minio:latest`.

---

## 7. Perintah Manajemen Operasional (Docker 29.9.1)

```bash
# Melihat log secara real-time untuk semua layanan
sudo docker compose logs -f

# Melihat log khusus Ollama LLM
sudo docker compose logs -f ollama

# Melihat log khusus web frontend
sudo docker compose logs -f web

# Melihat log backend API
sudo docker compose logs -f backend

# Restart layanan tertentu (misal backend)
sudo docker compose restart backend

# Menghentikan seluruh layanan tanpa menghapus data
sudo docker compose stop

# Menghapus kontainer (volume data database, MinIO & model Ollama tetap aman tersimpan)
sudo docker compose down
```
