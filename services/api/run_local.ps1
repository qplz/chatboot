#!/usr/bin/env pwsh
# =============================================================
# Jalankan FastAPI langsung di Windows (database tetap di Docker)
# Pastikan Docker PostgreSQL sudah running: docker compose up -d postgres
# =============================================================

Set-Location $PSScriptRoot

# 1. Buat virtual environment jika belum ada
if (-not (Test-Path ".venv")) {
    Write-Host "[1/4] Membuat virtual environment..." -ForegroundColor Cyan
    python -m venv .venv
}

# 2. Aktifkan virtual environment
Write-Host "[2/4] Mengaktifkan virtual environment..." -ForegroundColor Cyan
& ".\.venv\Scripts\Activate.ps1"

# 3. Install dependencies
Write-Host "[3/4] Install dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt --quiet

# 4. Copy .env.local sebagai .env aktif
if (Test-Path ".env.local") {
    Copy-Item ".env.local" ".env" -Force
    Write-Host "      Menggunakan .env.local (koneksi localhost:5433)" -ForegroundColor Yellow
}

# 5. Test koneksi database dulu
Write-Host "[4/4] Cek koneksi ke Docker PostgreSQL..." -ForegroundColor Cyan
$pgpass = "dev_password_local_only"
$env:PGPASSWORD = $pgpass
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (Test-Path $psql) {
    $result = & $psql -h localhost -p 5433 -U ai_chatbot_app -d ai_chatbot -c "SELECT 1;" 2>&1
    if ($result -match "1 row") {
        Write-Host "      ✅ Database terhubung (localhost:5433)" -ForegroundColor Green
    } else {
        Write-Host "      ❌ Database tidak terhubung. Jalankan: docker compose up -d postgres" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " API berjalan di: http://localhost:8000 " -ForegroundColor Green
Write-Host " Swagger docs:    http://localhost:8000/docs" -ForegroundColor Green
Write-Host " Database:        localhost:5433 (Docker)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 6. Jalankan API
uvicorn main:app --reload --host 127.0.0.1 --port 8000
