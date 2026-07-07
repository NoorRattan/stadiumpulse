class AIServiceError(RuntimeError):
    def __init__(self, message: str, *, upstream: Exception | None = None) -> None:
        super().__init__(message)
        self.upstream = upstream


class ResourceNotFoundError(RuntimeError):
    pass
