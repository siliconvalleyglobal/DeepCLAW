"""
Exact match and substring correctness scorers.
"""

from typing import Any


class ExactMatchScorer:
    """Exact string match scorer."""

    @staticmethod
    def score(expected: Any, actual: Any) -> float:
        return 1.0 if str(expected).strip() == str(actual).strip() else 0.0


class ContainsMatchScorer:
    """Substring match scorer."""

    @staticmethod
    def score(expected_substring: str, actual: str) -> float:
        return 1.0 if str(expected_substring).lower() in str(actual).lower() else 0.0
