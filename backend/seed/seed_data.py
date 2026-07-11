from pathlib import Path

import asyncpg

from config import get_settings
from logger import configure_logging, get_logger

logger = get_logger(__name__)


async def run_seed() -> None:
    settings = get_settings()
    seed_path = Path(__file__).resolve().parents[2] / "supabase" / "seed.sql"
    sql = seed_path.read_text(encoding="utf-8")
    connection = await asyncpg.connect(settings.supabase_db_url)
    try:
        await connection.execute(sql)
    finally:
        await connection.close()


def main() -> int:
    import asyncio

    configure_logging("INFO")
    asyncio.run(run_seed())
    logger.info("Supabase seed data upserted")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
