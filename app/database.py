"""In-memory database store for CareCompanion."""

from __future__ import annotations

import logging
from collections import defaultdict
from typing import Any

logger = logging.getLogger(__name__)


class DataStore:
    """Simple dict-based store for seniors, check-ins, alerts, and service data."""

    def __init__(self) -> None:
        self._data: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
        logger.info("DataStore initialized")

    def put(self, set_name: str, key: str, record: dict[str, Any]) -> None:
        self._data[set_name][key] = record

    def get(self, set_name: str, key: str) -> dict[str, Any] | None:
        return self._data[set_name].get(key)

    def scan(self, set_name: str) -> list[dict[str, Any]]:
        return list(self._data[set_name].values())

    def delete(self, set_name: str, key: str) -> bool:
        return self._data[set_name].pop(key, None) is not None

    def scan_prefix(self, set_name: str, prefix: str) -> list[dict[str, Any]]:
        return [
            v for k, v in self._data[set_name].items() if k.startswith(prefix)
        ]


# Global instance
_db: DataStore | None = None


def get_db() -> DataStore:
    global _db
    if _db is None:
        _db = DataStore()
    return _db
