# Panduan Docker & Docker Compose
### Spesifikasi Lingkungan: Ubuntu 22.04.5 LTS & Docker Engine 29.9.1

Panduan ini disusun khusus untuk menjalankan project **AI Chatbot MVP** di sistem operasi **Ubuntu 22.04.5 LTS** menggunakan **Docker version 29.9.1** (Docker Compose V2 specification).

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

File `docker-compose.yml` mengorkestrasi 4 layanan utama dalam satu jaringan bridge privat (`ai_chatbot_network`):

| Service | Container Name | Image Resmi | Port Host | Fungsi |
|---|---|---|---|---|
| **web** | `ai-chatbot-web` | *Local Build (Dockerfile)* | `3000` | Frontend React SPA + Nginx (Gzip, caching, healthcheck) |
| **postgres** | `ai-chatbot-postgres` | `pgvector/pgvector:pg17` | `5432` | PostgreSQL 17 + Ekstensi **PGVector** (vektor RAG) |
| **minio** | `ai-chatbot-minio` | `cgr.dev/chainguard/minio:latest` | `9000`, `9001` | S3-compatible Object Storage (Distribusi aman Chainguard, 100% bebas 401 Quay/DockerHub) |
| **n8n** | `ai-chatbot-n8n` | `n8nio/n8n:latest` | `5678` | Workflow Automation engine (Official Docker Hub image) |

---

## 3. Langkah Menjalankan Project (Fresh & Solved)

### Langkah 1: Pastikan Tidak Ada File Ganda (compose.yaml)
Jika di server Anda sebelumnya terdapat file `compose.yaml`, hapus agar Docker Compose hanya membaca `docker-compose.yml`:
```bash
rm -f /opt/agentic-rag/compose.yaml
```

### Langkah 2: Siapkan File Environment (.env)
Salin template konfigurasi jika belum ada:
```bash
cp .env.example .env
```

### Langkah 3: Tarik Image & Jalankan Kontainer
Gunakan perintah Compose V2:
```bash
# Tarik image terlebih dahulu untuk memastikan semua image berhasil diunduh
docker compose pull

# Jalankan seluruh stack di background (detached mode) bersama build frontend
docker compose up -d --build
```

### Langkah 4: Periksa Status Kontainer & Healthcheck
```bash
docker compose ps
```
Semua container akan berstatus `running` atau `healthy`.

---

## 4. Akses Aplikasi & Dashboard

Setelah kontainer aktif, buka peramban (browser):

- **Aplikasi Web Chatbot**: `http://localhost:3000` atau `http://<IP-VPS-Ubuntu>:3000`
  - *Akun Admin*: `admin@example.com` / `Admin123!`
  - *Akun User*: `user@example.com` / `User123!`
- **MinIO Storage Console**: `http://localhost:9001`
  - *User*: `admin`
  - *Password*: `minioadmin123`
- **n8n Workflow**: `http://localhost:5678`
- **PostgreSQL PGVector**: `localhost:5432`
  - *Database*: `ai_chatbot`
  - *User*: `postgres`
  - *Password*: `postgres123`

---

## 5. Solusi Permasalahan (Troubleshooting yang Telah Diperbaiki)

1. **Peringatan File Ganda (`Found multiple config files`)**:
   - **Penyebab**: Terdapat `compose.yaml` dan `docker-compose.yml` sekaligus di direktori yang sama.
   - **Solusi**: File `compose.yaml` telah dihapus dari repositori. Jika di server masih ada, jalankan `rm -f compose.yaml`.

2. **Error `401 UNAUTHORIZED` / `pull access denied` pada MinIO (`quay.io/minio/minio` atau `minio/minio`)**:
   - **Penyebab**: MinIO secara resmi telah menghentikan dan mengunci distribusi image publik gratis di Docker Hub dan Quay.io (mengembalikan status `401 UNAUTHORIZED` saat ditarik tanpa lisensi berbayar).
   - **Solusi**: Diganti menggunakan distribusi publik resmi **Chainguard**: `cgr.dev/chainguard/minio:latest`. Image ini 100% kompatibel penuh dengan MinIO S3 API, bebas biaya lisensi, aktif di-maintain komunitas global open source, dan bebas dari error autentikasi 401.

3. **Error `No such image: docker.n8n.io/n8nio/n8n:latest`**:
   - **Penyebab**: Registry custom `docker.n8n.io` sering mengalami timeout atau tidak dikenali oleh daemon Docker standar.
   - **Solusi**: Diganti dengan image resmi Docker Hub: `n8nio/n8n:latest`.

4. **Status `Interrupted` pada `pgvector/pgvector:pg17`**:
   - **Penyebab**: Terjadi akibat kegagalan pull pada MinIO sehingga Docker membatalkan proses download image lainnya secara bersamaan.
   - **Solusi**: Setelah MinIO dan n8n diperbaiki, jalankan `docker compose pull` untuk mengunduh semua image secara bersih.

---

## 6. Perintah Manajemen Operasional (Docker 29.9.1)

```bash
# Melihat log secara real-time untuk semua layanan
docker compose logs -f

# Melihat log khusus web frontend
docker compose logs -f web

# Melihat log database postgres
docker compose logs -f postgres

# Restart layanan tertentu (misal web)
docker compose restart web

# Menghentikan seluruh layanan tanpa menghapus data
docker compose stop

# Menghapus kontainer (volume data database tetap aman tersimpan)
docker compose down

# Menghapus kontainer beserta volume data (HATI-HATI: Data DB & S3 terhapus)
docker compose down -v
```

---

## 7. Konfigurasi Firewall Ubuntu 22.04 LTS (UFW)

Jika Anda mendeploy di VPS Ubuntu 22.04 dengan firewall UFW aktif:

```bash
# Izinkan akses port web chatbot
sudo ufw allow 3000/tcp comment 'AI Chatbot Web'

# (Opsional jika ingin membuka akses remote MinIO & n8n)
sudo ufw allow 9001/tcp comment 'MinIO Console'
sudo ufw allow 5678/tcp comment 'n8n Workflow'

# Reload firewall
sudo ufw reload
sudo ufw status
```
