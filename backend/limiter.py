from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def rate_limit_key(request: Request) -> str:
    current_user = getattr(request.state, "current_user", None)
    uid = getattr(current_user, "uid", None)
    if isinstance(uid, str) and uid:
        return uid
    return get_remote_address(request)


limiter = Limiter(key_func=rate_limit_key)
