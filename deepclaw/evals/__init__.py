"""
Capabilities-as-primitive eval runner, replay, and regression detection.
"""

from deepclaw.evals.harness import EvalHarness, EvalScenario
from deepclaw.evals.regression import RegressionChecker
from deepclaw.evals.replay import TraceReplayEngine

__all__ = ["EvalHarness", "EvalScenario", "RegressionChecker", "TraceReplayEngine"]
