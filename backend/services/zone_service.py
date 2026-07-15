import asyncpg

from models.zone import Zone
from services.crowd_service import zone_from_row
from services.exceptions import ResourceNotFoundError


async def load_zone(db: asyncpg.Pool, zone_id: str) -> Zone:
    row = await db.fetchrow(
        """
        select zone_id, name, type, capacity, current_density_pct, last_updated, lat, lng
        from public.zones
        where zone_id = $1
        """,
        zone_id,
    )
    if row is None:
        raise ResourceNotFoundError(f"Zone not found: {zone_id}")
    return zone_from_row(row)
