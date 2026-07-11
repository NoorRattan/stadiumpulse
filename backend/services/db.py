import asyncpg

from config import get_settings

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = await asyncpg.create_pool(
            dsn=settings.supabase_db_url,
            min_size=1,
            max_size=5,
            # Supabase's transaction-mode pooler does not support persistent
            # prepared statements; disabling the asyncpg cache avoids 500s
            # from duplicate prepared-statement names across pooled sessions.
            statement_cache_size=0,
        )
    return _pool
