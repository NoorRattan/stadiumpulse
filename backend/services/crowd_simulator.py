import asyncio
import logging

import asyncpg

from services.db import get_pool

logger = logging.getLogger(__name__)


async def nudge_crowd_data(db: asyncpg.Pool) -> str:
    """Advance clearly simulated crowd readings with a bounded random walk."""
    return await db.execute(
        """
        with next_density as (
          select zone_id,
                 case
                   when random() < 0.04 then 90 + random() * 7
                   else greatest(12, least(96, current_density_pct + (random() * 12 - 6)))
                 end as density_pct
          from public.zones
        ), updated as (
          update public.zones z
          set current_density_pct = round(n.density_pct::numeric, 2),
              last_updated = now()
          from next_density n
          where z.zone_id = n.zone_id
          returning z.zone_id, z.current_density_pct, z.last_updated
        )
        insert into public.zone_readings (zone_id, density_pct, source, recorded_at)
        select zone_id, current_density_pct, 'estimated', last_updated
        from updated
        """
    )


async def run_crowd_simulation(interval_seconds: int) -> None:
    """Run the demo signal until the application shuts the task down."""
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            await nudge_crowd_data(await get_pool())
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Simulated crowd-data update failed")
