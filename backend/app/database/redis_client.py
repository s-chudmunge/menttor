from typing import Generator, Optional
import redis
from core.config import settings
import contextlib

@contextlib.contextmanager
def get_redis_client() -> Generator[redis.Redis, None, None]:
    client: Optional[redis.Redis] = None
    try:
        client = redis.Redis.from_url(settings.REDIS_URL)
        yield client  # type: ignore[misc]
    finally:
        if client:
            client.close()