# Panduan Migrasi ke PostgreSQL Eksternal

## File yang tersedia

| File | Deskripsi |
|---|---|
| `infra/backup/ai_chatbot_export.sql` | Full dump (schema + data) |
| `infra/backup/ai_chatbot_schema_only.sql` | Schema saja (tanpa data) |
| `infra/scripts/setup_external_postgres.sql` | Script setup user & database |

---

## Opsi 1: PostgreSQL Lokal (Windows) yang sudah terinstall

### Langkah setup

1. **Buka pgAdmin atau psql** sebagai user `postgres`

2. **Jalankan script setup:**
   ```sql
   -- Di pgAdmin: buka Query Tool, pilih database postgres
   -- Paste isi file: infra/scripts/setup_external_postgres.sql
   ```

3. **Import database:**
   ```powershell
   # Via psql (pastikan PostgreSQL bin di PATH)
   psql -U postgres -d ai_chatbot -f "c:\ai-engineer\ai-chatbot-mvp\infra\backup\ai_chatbot_export.sql"
   ```

4. **Update .env** — ganti `DATABASE_URL` agar mengarah ke PostgreSQL lokal:
   ```env
   # Untuk PostgreSQL lokal (bukan di Docker)
   DATABASE_URL=postgresql+asyncpg://ai_chatbot_app:dev_password_local_only@localhost:5432/ai_chatbot
   ```

---

## Opsi 2: PostgreSQL via pgAdmin 4

1. Buka pgAdmin 4
2. Sambungkan ke server PostgreSQL Anda
3. Klik kanan **Databases** → **Create** → **Database**
   - Name: `ai_chatbot`
4. Klik kanan database `ai_chatbot` → **Query Tool**
5. Paste dan jalankan isi `setup_external_postgres.sql`
6. Klik kanan database `ai_chatbot` → **Restore...**
   - Format: Plain
   - Filename: pilih `ai_chatbot_export.sql`
   - Klik Restore

---

## Opsi 3: Tetap pakai Docker tapi expose port 5433 *(Recommended untuk lokal)*

Port 5433 sudah di-expose di `compose.yaml`. Koneksi dari pgAdmin/psql Windows:

```
Host:     localhost (atau 127.0.0.1)
Port:     5433          ← bukan 5432 (5432 dipakai PostgreSQL Windows)
Database: ai_chatbot
User:     ai_chatbot_app
Password: dev_password_local_only   (sesuai .env)
```

**pgAdmin 4** — tambahkan server baru:
- General → Name: `AI Chatbot MVP (Docker)`
- Connection → Host: `localhost`
- Connection → Port: `5433`
- Connection → Database: `ai_chatbot`
- Connection → Username: `ai_chatbot_app`
- Connection → Password: `dev_password_local_only`

**psql dari Command Prompt:**
```cmd
set PGPASSWORD=dev_password_local_only
psql -h localhost -p 5433 -U ai_chatbot_app -d ai_chatbot
```

**psql dari PowerShell:**
```powershell
$env:PGPASSWORD = "dev_password_local_only"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5433 -U ai_chatbot_app -d ai_chatbot
```

---

## Update .env untuk koneksi eksternal

Edit `c:\ai-engineer\ai-chatbot-mvp\.env`:

```env
# PostgreSQL di luar Docker (lokal Windows)
DATABASE_URL=postgresql+asyncpg://ai_chatbot_app:dev_password_local_only@host.docker.internal:5432/ai_chatbot

# Atau jika API juga di luar Docker (development langsung)
DATABASE_URL=postgresql+asyncpg://ai_chatbot_app:dev_password_local_only@localhost:5432/ai_chatbot
```

> **Catatan:** Dari dalam Docker container, gunakan `host.docker.internal` untuk mengakses host Windows.
> Dari aplikasi yang berjalan langsung di Windows (bukan Docker), gunakan `localhost`.

---

## Verifikasi setelah import

```sql
-- Cek tabel yang ada
\dt

-- Cek extension pgvector
SELECT extname, extversion FROM pg_extension;

-- Cek user admin
SELECT email, role FROM users;

-- Cek jumlah data
SELECT 'users' as tbl, COUNT(*) FROM users
UNION ALL SELECT 'documents', COUNT(*) FROM documents
UNION ALL SELECT 'chunks', COUNT(*) FROM document_chunks
UNION ALL SELECT 'embeddings', COUNT(*) FROM document_embeddings;
```

---

## Kebutuhan pgvector

pgvector **wajib terinstall** di PostgreSQL server target.

### Windows (via pgAdmin installer)
Biasanya sudah termasuk di PostgreSQL 16+.
Cek: `SELECT * FROM pg_available_extensions WHERE name = 'vector';`

### Ubuntu/Debian
```bash
sudo apt install postgresql-17-pgvector   # untuk PG 17
sudo apt install postgresql-16-pgvector   # untuk PG 16
```

### Jika pgvector tidak tersedia
Tetap pakai Docker PostgreSQL untuk database (port 5432 sudah di-expose),
dan hanya API/Web yang berjalan di luar Docker.
