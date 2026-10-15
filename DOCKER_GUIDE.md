# Panduan Docker & Docker Compose
### Spesifikasi Lingkungan: Ubuntu 22.04.5 LTS & Docker Engine 29.9.1

Panduan ini disusun khusus untuk menjalankan project **AI Chatbot MVP** di sistem operasi **Ubuntu 22.04.5 LTS** menggunakan **Docker version 29.9.1** (Docker Compose V2 specification) dengan model lokal **Ollama (Qwen 2.5: 3B)**.

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

## 3. Langkah Menjalankan Project (Fresh & Solved)

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

### Langkah 3: Tarik Image & Jalankan Kontainer
Gunakan perintah Compose V2:
```bash
# Tarik base image resmi
sudo docker compose pull

# Build service lokal (Frontend & Backend) dan jalankan di background
sudo docker compose up -d --build
```

Container `ai-chatbot-ollama-pull` otomatis akan memeriksa apakah model `qwen2.5:3b` sudah ada di volume storage. Jika belum ada, kontainer ini akan mengunduh model tersebut secara otomatis.

### Langkah 4: Periksa Status Kontainer & Healthcheck
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

1. **Peringatan File Ganda (`Found multiple config files`)**:
   - **Penyebab**: Terdapat `compose.yaml` dan `docker-compose.yml` sekaligus di direktori yang sama.
   - **Solusi**: File `compose.yaml` telah dihapus dari repositori. Jika di server masih ada, jalankan `rm -f compose.yaml`.

2. **Error `401 UNAUTHORIZED` / `pull access denied` pada MinIO (`quay.io/minio/minio` atau `minio/minio`)**:
   - **Penyebab**: MinIO secara resmi telah menghentikan dan mengunci distribusi image publik gratis di Docker Hub dan Quay.io.
   - **Solusi**: Diganti menggunakan distribusi publik resmi **Chainguard**: `cgr.dev/chainguard/minio:latest`. Image ini 100% kompatibel penuh dengan MinIO S3 API, bebas biaya lisensi, aktif di-maintain komunitas global open source, dan bebas dari error autentikasi 401.

3. **Error `No such image: docker.n8n.io/n8nio/n8n:latest`**:
   - **Penyebab**: Registry custom `docker.n8n.io` sering mengalami timeout atau tidak dikenali oleh daemon Docker standar.
   - **Solusi**: Diganti dengan image resmi Docker Hub: `n8nio/n8n:latest`.

4. **Status `Interrupted` pada `pgvector/pgvector:pg17`**:
   - **Penyebab**: Terjadi akibat kegagalan pull pada MinIO sehingga Docker membatalkan proses download image lainnya secara bersamaan.
   - **Solusi**: Setelah MinIO dan n8n diperbaiki, jalankan `docker compose pull` untuk mengunduh semua image secara bersih.

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

# Menghapus kontainer beserta volume data (HATI-HATI: Data DB, S3 & model AI terhapus)
sudo docker compose down -v
```
