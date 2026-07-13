from enum import StrEnum
from http import HTTPStatus
from typing import Self

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

from services.exceptions import AIServiceError, ResourceNotFoundError


class ErrorCode(StrEnum):
    validation_error = "VALIDATION_ERROR"
    unauthenticated = "UNAUTHENTICATED"
    forbidden = "FORBIDDEN"
    conflict = "CONFLICT"
    not_found = "NOT_FOUND"
    rate_limited = "RATE_LIMITED"
    internal_error = "INTERNAL_ERROR"
    ai_upstream_error = "AI_UPSTREAM_ERROR"


class ErrorDetail(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    code: ErrorCode = Field(alias="code")
    message: str = Field(alias="message")
    status: int = Field(alias="status")


class ErrorResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    error: ErrorDetail = Field(alias="error")


class ApiError(Exception):
    def __init__(self: Self, code: ErrorCode, message: str, status: int) -> None:
        self.code = code
        self.message = message
        self.status = status


def error_response(code: ErrorCode, message: str, status: int) -> JSONResponse:
    response = ErrorResponse(error=ErrorDetail(code=code, message=message, status=status))
    return JSONResponse(status_code=status, content=response.model_dump(by_alias=True))


async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    return error_response(exc.code, exc.message, exc.status)


async def ai_service_error_handler(request: Request, exc: AIServiceError) -> JSONResponse:
    return error_response(
        ErrorCode.ai_upstream_error,
        "AI upstream request failed.",
        HTTPStatus.BAD_GATEWAY,
    )


async def resource_not_found_handler(request: Request, exc: ResourceNotFoundError) -> JSONResponse:
    return error_response(ErrorCode.not_found, str(exc), HTTPStatus.NOT_FOUND)


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return error_response(
        ErrorCode.validation_error,
        "Request validation failed.",
        HTTPStatus.BAD_REQUEST,
    )


async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return error_response(
        ErrorCode.rate_limited,
        "Too many requests. Try again shortly.",
        HTTPStatus.TOO_MANY_REQUESTS,
    )


async def http_error_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    if exc.status_code == HTTPStatus.UNAUTHORIZED:
        return error_response(ErrorCode.unauthenticated, "Missing or invalid ID token.", exc.status_code)
    if exc.status_code == HTTPStatus.FORBIDDEN:
        return error_response(ErrorCode.forbidden, "This action is not permitted.", exc.status_code)
    if exc.status_code == HTTPStatus.NOT_FOUND:
        return error_response(ErrorCode.not_found, "Requested resource was not found.", exc.status_code)
    return error_response(ErrorCode.internal_error, "Unexpected server error.", HTTPStatus.INTERNAL_SERVER_ERROR)


async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    return error_response(
        ErrorCode.internal_error,
        "Unexpected server error.",
        HTTPStatus.INTERNAL_SERVER_ERROR,
    )
