from collections.abc import Callable
from functools import lru_cache
from http import HTTPStatus

import jwt
from fastapi import Depends, Header, Request
from jwt import InvalidTokenError, PyJWKClient
from pydantic import BaseModel, ConfigDict, Field

from config import get_settings, get_supabase_jwks_url
from models.user import UserRole
from schemas.errors import ApiError, ErrorCode


class AuthenticatedUser(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    uid: str = Field(alias="uid")
    role: UserRole = Field(alias="role")
    email: str | None = Field(default=None, alias="email")
    display_name: str | None = Field(default=None, alias="displayName")


def extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise ApiError(ErrorCode.unauthenticated, "Missing Authorization header.", HTTPStatus.UNAUTHORIZED)

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise ApiError(ErrorCode.unauthenticated, "Expected Bearer token.", HTTPStatus.UNAUTHORIZED)
    return token


@lru_cache
def get_jwks_client(jwks_url: str) -> PyJWKClient:
    return PyJWKClient(jwks_url)


def _decode_options() -> dict[str, bool]:
    return {"verify_aud": False}


async def verify_token_async(token: str) -> dict[str, object]:
    settings = get_settings()
    issuer = f"{settings.supabase_url.rstrip('/')}/auth/v1"
    try:
        if settings.supabase_jwt_secret:
            decoded = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                issuer=issuer,
                options=_decode_options(),
            )
        else:
            signing_key = get_jwks_client(get_supabase_jwks_url(settings)).get_signing_key_from_jwt(token)
            decoded = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                issuer=issuer,
                options=_decode_options(),
            )
    except InvalidTokenError:
        raise
    return dict(decoded)


async def get_current_user(
    request: Request,
    authorization: str | None = Header(default=None),
) -> AuthenticatedUser:
    token = extract_bearer_token(authorization)
    try:
        decoded = await verify_token_async(token)
    except Exception as exc:
        raise ApiError(ErrorCode.unauthenticated, "Missing or invalid ID token.", HTTPStatus.UNAUTHORIZED) from exc

    uid = decoded.get("sub") or decoded.get("uid")
    role = decoded.get("user_role", decoded.get("role", UserRole.fan.value))
    if not isinstance(uid, str):
        raise ApiError(ErrorCode.unauthenticated, "Token is missing uid.", HTTPStatus.UNAUTHORIZED)

    try:
        user_role = UserRole(role)
    except ValueError as exc:
        raise ApiError(ErrorCode.unauthenticated, "Token has an invalid role claim.", HTTPStatus.UNAUTHORIZED) from exc

    current_user = AuthenticatedUser(
        uid=uid,
        role=user_role,
        email=decoded.get("email") if isinstance(decoded.get("email"), str) else None,
        displayName=decoded.get("name") if isinstance(decoded.get("name"), str) else None,
    )
    request.state.current_user = current_user
    return current_user


def require_role(*allowed_roles: UserRole) -> Callable[[AuthenticatedUser], AuthenticatedUser]:
    def dependency(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if current_user.role not in allowed_roles:
            allowed = ", ".join(role.value for role in allowed_roles)
            raise ApiError(
                ErrorCode.forbidden,
                f"This action requires one of these roles: {allowed}.",
                HTTPStatus.FORBIDDEN,
            )
        return current_user

    return dependency
