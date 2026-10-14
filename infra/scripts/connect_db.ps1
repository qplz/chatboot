# Script koneksi cepat ke database AI Chatbot MVP
# Jalankan: .\infra\scripts\connect_db.ps1

$env:PGPASSWORD = "dev_password_local_only"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (-not (Test-Path $psql)) {
    # Cari psql di PATH
    $psql = (Get-Command psql -ErrorAction SilentlyContinue)?.Source
    if (-not $psql) {
        Write-Error "psql tidak ditemukan. Install PostgreSQL atau tambahkan ke PATH."
        exit 1
    }
}

Write-Host "Menghubungkan ke AI Chatbot DB (localhost:5433)..." -ForegroundColor Cyan
Write-Host "Ketik \q untuk keluar, \dt untuk lihat tabel" -ForegroundColor Gray

& $psql -h localhost -p 5433 -U ai_chatbot_app -d ai_chatbot
