"""Unit tests for the DataStore."""

from app.database import DataStore


class TestDataStore:
    def setup_method(self):
        self.db = DataStore()

    def test_put_and_get(self):
        self.db.put("seniors", "key1", {"name": "Alice"})
        result = self.db.get("seniors", "key1")
        assert result == {"name": "Alice"}

    def test_get_nonexistent(self):
        result = self.db.get("seniors", "nope")
        assert result is None

    def test_scan(self):
        self.db.put("seniors", "k1", {"name": "A"})
        self.db.put("seniors", "k2", {"name": "B"})
        results = self.db.scan("seniors")
        assert len(results) == 2

    def test_scan_empty(self):
        results = self.db.scan("empty_set")
        assert results == []

    def test_delete(self):
        self.db.put("seniors", "k1", {"name": "A"})
        assert self.db.delete("seniors", "k1") is True
        assert self.db.get("seniors", "k1") is None

    def test_delete_nonexistent(self):
        assert self.db.delete("seniors", "nope") is False

    def test_scan_prefix(self):
        self.db.put("checkins", "+1555:2026-01-01", {"data": "a"})
        self.db.put("checkins", "+1555:2026-01-02", {"data": "b"})
        self.db.put("checkins", "+1666:2026-01-01", {"data": "c"})
        results = self.db.scan_prefix("checkins", "+1555")
        assert len(results) == 2

    def test_scan_prefix_no_match(self):
        self.db.put("checkins", "+1555:2026-01-01", {"data": "a"})
        results = self.db.scan_prefix("checkins", "+9999")
        assert results == []

    def test_separate_sets(self):
        self.db.put("seniors", "k1", {"type": "senior"})
        self.db.put("alerts", "k1", {"type": "alert"})
        assert self.db.get("seniors", "k1")["type"] == "senior"
        assert self.db.get("alerts", "k1")["type"] == "alert"
