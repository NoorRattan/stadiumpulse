import argparse
import asyncio
from collections.abc import Sequence

import asyncpg

from config import get_settings
from logger import configure_logging, get_logger
from models.user import UserRole

logger = get_logger(__name__)


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Grant a StadiumPulse role to a Supabase user.")
    parser.add_argument("uid", help="Supabase Auth user UUID")
    parser.add_argument("role", choices=[role.value for role in UserRole], help="Role to grant")
    return parser.parse_args(argv)


async def grant_role(uid: str, role: UserRole, connection: asyncpg.Connection) -> None:
    async with connection.transaction():
        await connection.execute("set local role service_role")
        await connection.execute(
            """
            insert into public.user_roles (uid, role)
            values ($1, $2)
            on conflict (uid) do update set role = excluded.role
            """,
            uid,
            role.value,
        )
        await connection.execute(
            """
            update public.profiles
            set role = $2
            where id = $1
            """,
            uid,
            role.value,
        )


async def async_main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    settings = get_settings()
    connection = await asyncpg.connect(settings.supabase_db_url)
    try:
        await grant_role(args.uid, UserRole(args.role), connection)
    finally:
        await connection.close()
    logger.info("Granted role %s to uid %s", args.role, args.uid)
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    configure_logging("INFO")
    return asyncio.run(async_main(argv))


if __name__ == "__main__":
    raise SystemExit(main())
