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

| Service | Container Name | Port Host | Fungsi |
|---|---|---|---|
| **web** | `ai-chatbot-web` | `3000` | Frontend React SPA + Nginx (Gzip, caching, healthcheck) |
| **postgres** | `ai-chatbot-postgres` | `5432` | PostgreSQL 17 + Ekstensi **PGVector** (vektor RAG) |
| **minio** | `ai-chatbot-minio` | `9000`, `9001` | S3-compatible Object Storage (API: 9000, Dashboard UI: 9001) |
| **n8n** | `ai-chatbot-n8n` | `5678` | Workflow Automation engine (Indonesia Timezone) |

---

## 3. Langkah Menjalankan Project

### Langkah 1: Siapkan File Environment (.env)
Salin template konfigurasi:
```bash
cp .env.example .env
```
*(Opsional: Sesuaikan password atau kunci enkripsi di dalam `.env` jika diperlukan)*

### Langkah 2: Build & Jalankan Kontainer
Gunakan perintah Compose V2:
```bash
# Jalankan seluruh stack di background (detached mode)
docker compose up -d --build
```

### Langkah 3: Periksa Status Kontainer & Healthcheck
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

## 5. Perintah Manajemen Operasional (Docker 29.9.1)

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

## 6. Konfigurasi Firewall Ubuntu 22.04 LTS (UFW)

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

---

## 7. Troubleshooting di Ubuntu 22.04

1. **Permission Denied saat menjalankan docker**:
   Pastikan user Anda masuk ke group `docker`:
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **Port Konflik (misal 3000 atau 5432 sudah dipakai)**:
   Ubah variabel `WEB_PORT` atau `POSTGRES_PORT` di file `.env` tanpa perlu mengubah `docker-compose.yml`. Contoh:
   ```env
   WEB_PORT=8080
   POSTGRES_PORT=5433
   ```
   Lalu jalankan `docker compose up -d`.
