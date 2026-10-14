"""Test koneksi ke Docker PostgreSQL dari Python Windows."""
import asyncio
import sys


async def test_connection():
    # Test 1: asyncpg langsung
    try:
        import asyncpg
        conn = await asyncpg.connect(
            host="localhost",
            port=5433,
            user="ai_chatbot_app",
            password="dev_password_local_only",
            database="ai_chatbot",
        )
        version = await conn.fetchval("SELECT version()")
        tables = await conn.fetchval(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'"
        )
        users = await conn.fetchval("SELECT COUNT(*) FROM users")
        docs = await conn.fetchval("SELECT COUNT(*) FROM documents")
        await conn.close()

        print("=" * 55)
        print("  ✅ KONEKSI BERHASIL!")
        print("=" * 55)
        print(f"  Host:      localhost:5433 (Docker PostgreSQL)")
        print(f"  Database:  ai_chatbot")
        print(f"  PG versi:  {version.split(',')[0]}")
        print(f"  Tables:    {tables}")
        print(f"  Users:     {users}")
        print(f"  Documents: {docs}")
        print("=" * 55)
        return True

    except ImportError:
        print("❌ asyncpg belum terinstall")
        print("   Jalankan: pip install asyncpg")
        return False
    except OSError as e:
        print(f"❌ Tidak bisa konek ke localhost:5433")
        print(f"   Error: {e}")
        print("   Pastikan Docker PostgreSQL running:")
        print("   docker compose up -d postgres")
        return False
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {e}")
        return False


# Test 2: SQLAlchemy async (cara yang dipakai API)
async def test_sqlalchemy():
    try:
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy import text

        url = "postgresql+asyncpg://ai_chatbot_app:dev_password_local_only@localhost:5433/ai_chatbot"
        engine = create_async_engine(url, echo=False)

        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1 as ok"))
            row = result.fetchone()

        await engine.dispose()
        print(f"\n  ✅ SQLAlchemy async OK (result={row.ok})")
        return True

    except ImportError:
        print("\n  ⚠️  SQLAlchemy tidak terinstall (opsional)")
        return True
    except Exception as e:
        print(f"\n  ❌ SQLAlchemy error: {e}")
        return False


if __name__ == "__main__":
    ok1 = asyncio.run(test_connection())
    ok2 = asyncio.run(test_sqlalchemy())

    if ok1 and ok2:
        print("\n🎉 Semua test PASS — API siap dijalankan di Windows!")
        print("\nLangkah selanjutnya:")
        print("  cd services\\api")
        print("  .env.local → ganti DATABASE_URL ke localhost:5433")
        print("  uvicorn main:app --reload --host 127.0.0.1 --port 8000")
        sys.exit(0)
    else:
        sys.exit(1)
