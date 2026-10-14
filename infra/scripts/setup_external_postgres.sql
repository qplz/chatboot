-- =============================================================
-- Script Setup PostgreSQL Eksternal untuk AI Chatbot MVP
-- Jalankan sebagai superuser (postgres) pada server target
-- =============================================================

-- 1. Buat database
CREATE DATABASE ai_chatbot
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- 2. Buat user aplikasi
-- GANTI password di bawah sesuai .env Anda
CREATE USER ai_chatbot_app WITH
    LOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOINHERIT
    NOREPLICATION
    CONNECTION LIMIT -1
    PASSWORD 'dev_password_local_only';   -- ganti sesuai POSTGRES_PASSWORD di .env

-- 3. Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ai_chatbot TO ai_chatbot_app;

-- Setelah ini, sambungkan ke database ai_chatbot dan jalankan:
\c ai_chatbot

-- 4. Grant schema privileges
GRANT ALL ON SCHEMA public TO ai_chatbot_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ai_chatbot_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ai_chatbot_app;

-- 5. Install pgvector extension (perlu superuser)
-- Pastikan pgvector sudah terinstall di PostgreSQL server Anda
-- Untuk Ubuntu: sudo apt install postgresql-16-pgvector
-- Untuk PostgreSQL 17: sudo apt install postgresql-17-pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Verifikasi
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
