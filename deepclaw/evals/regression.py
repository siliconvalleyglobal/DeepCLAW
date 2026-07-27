"""
Flags eval-score regressions before merge or deployment.
"""

from typing import Dict, List, Tuple


class RegressionChecker:
    """Checks eval run outputs against baseline scores to flag regressions."""

    @staticmethod
    def check_regression(
        baseline_results: Dict[str, float],
        current_results: Dict[str, float],
        tolerance: float = 0.05,
    ) -> Tuple[bool, List[str]]:
        regressions = []
        for key, base_score in baseline_results.items():
            curr_score = current_results.get(key, 0.0)
            if base_score - curr_score > tolerance:
                regressions.append(
                    f"Regression detected in '{key}': Baseline {base_score:.2f} -> Current {curr_score:.2f}"
                )

        has_regression = len(regressions) > 0
        return has_regression, regressions
