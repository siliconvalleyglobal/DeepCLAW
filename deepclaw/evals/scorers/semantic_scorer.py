"""
Semantic similarity evaluation scorer using token n-gram vector cosine similarity.
"""

import math
from typing import Any


class SemanticSimilarityScorer:
    """N-gram vector similarity scorer for semantic response matching."""

    @staticmethod
    def score(expected: Any, actual: Any) -> float:
        exp_str = str(expected).lower()
        act_str = str(actual).lower()

        if exp_str == act_str:
            return 1.0

        exp_words = exp_str.split()
        act_words = act_str.split()
        vocab = set(exp_words + act_words)

        if not vocab:
            return 0.0

        exp_vec = [exp_words.count(w) for w in vocab]
        act_vec = [act_words.count(w) for w in vocab]

        dot = sum(a * b for a, b in zip(exp_vec, act_vec))
        norm_exp = math.sqrt(sum(a * a for a in exp_vec))
        norm_act = math.sqrt(sum(b * b for b in act_vec))

        if norm_exp == 0 or norm_act == 0:
            return 0.0

        return round(dot / (norm_exp * norm_act), 4)
