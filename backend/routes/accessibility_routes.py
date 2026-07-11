import asyncpg
from fastapi import APIRouter, Depends, Request

from dependencies import AuthenticatedUser, get_current_user
from limiter import limiter
from models.accessibility import AccessibilitySettings
from services.db import get_pool

router = APIRouter(prefix="/api/accessibility", tags=["accessibility"])


@router.get("/settings", response_model=AccessibilitySettings)
@limiter.limit("60/minute")
async def get_settings(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: asyncpg.Pool = Depends(get_pool),
) -> AccessibilitySettings:
    row = await db.fetchrow(
        """
        select high_contrast, reduced_motion, screen_reader_mode, preferred_language
        from public.accessibility_settings
        where uid = $1
        """,
        current_user.uid,
    )
    if row is None:
        return AccessibilitySettings.model_validate({})
    return AccessibilitySettings(
        highContrast=row["high_contrast"],
        reducedMotion=row["reduced_motion"],
        screenReaderMode=row["screen_reader_mode"],
        preferredLanguage=row["preferred_language"],
    )


@router.put("/settings", response_model=AccessibilitySettings)
@limiter.limit("60/minute")
async def put_settings(
    request: Request,
    body: AccessibilitySettings,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: asyncpg.Pool = Depends(get_pool),
) -> AccessibilitySettings:
    await db.execute(
        """
        insert into public.accessibility_settings (
          uid, high_contrast, reduced_motion, screen_reader_mode, preferred_language
        )
        values ($1, $2, $3, $4, $5)
        on conflict (uid) do update
        set high_contrast = excluded.high_contrast,
            reduced_motion = excluded.reduced_motion,
            screen_reader_mode = excluded.screen_reader_mode,
            preferred_language = excluded.preferred_language
        """,
        current_user.uid,
        body.high_contrast,
        body.reduced_motion,
        body.screen_reader_mode,
        body.preferred_language,
    )
    return body
