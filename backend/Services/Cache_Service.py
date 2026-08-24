import json
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel
from upstash_redis import Redis

from ..Security.Settings import settings

redis_client = Redis(
    url=settings.UPSTASH_REDIS_REST_URL,
    token=settings.UPSTASH_REDIS_REST_TOKEN,
)

TTL_SHORT = 30
TTL_MEDIUM = 120
TTL_LONG = 300


def _json_default(obj: Any) -> Any:
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, BaseModel):
        return obj.model_dump(mode="json")
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def _serialize(value: Any) -> str:
    return json.dumps(value, default=_json_default)


def cache_get(key: str) -> Optional[Any]:
    try:
        raw = redis_client.get(key)
    except Exception:
        return None
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        return None


def cache_set(key: str, value: Any, ttl: int = TTL_LONG) -> None:
    try:
        redis_client.set(key, _serialize(value), ex=ttl)
    except Exception:
        pass


def cache_delete(*keys: str) -> None:
    keys = tuple(k for k in keys if k)
    if not keys:
        return
    try:
        redis_client.delete(*keys)
    except Exception:
        pass


def cache_delete_pattern(*patterns: str) -> None:
    try:
        for pattern in patterns:
            cursor = 0
            while True:
                cursor, keys = redis_client.scan(cursor, match=pattern, count=200)
                if keys:
                    redis_client.delete(*keys)
                if cursor == 0:
                    break
    except Exception:
        pass


def model_to_cacheable(model: BaseModel) -> dict:
    """Convert a pydantic response model to a plain JSON-safe dict for caching."""
    return model.model_dump(mode="json")