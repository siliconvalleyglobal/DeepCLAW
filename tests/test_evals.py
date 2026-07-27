"""
Unit tests for eval harness, trace replay, and regression detection.
"""

import pytest
from deepclaw.evals.harness import EvalHarness, EvalScenario
from deepclaw.evals.regression import RegressionChecker
from deepclaw.evals.replay import TraceReplayEngine


@pytest.mark.asyncio
async def test_eval_harness_execution():
    harness = EvalHarness()
    harness.add_scenario(
        EvalScenario(
            id="sc-1",
            name="Greeting Check",
            prompt="Hello agent",
            expected_output="Hello world",
            scorer="contains",
        )
    )

    async def mock_runner(prompt: str) -> str:
        return "Hello world, how can I assist you?"

    results = await harness.run_evals(mock_runner)
    assert results["passed"] is True
    assert results["average_score"] == 1.0


def test_regression_checker():
    baseline = {"test_1": 1.0, "test_2": 0.9}
    current = {"test_1": 1.0, "test_2": 0.5}  # regressed

    has_regression, msgs = RegressionChecker.check_regression(baseline, current)
    assert has_regression is True
    assert len(msgs) == 1
    assert "Regression detected in 'test_2'" in msgs[0]


def test_trace_replay_conversion():
    trace = {
        "trace_id": "tr-100",
        "events": [
            {
                "event_type": "USER_INPUT",
                "input_data": {"prompt": "What is 2+2?"},
            },
            {
                "event_type": "AGENT_RESPONSE",
                "output_data": {"response": "4"},
            },
        ],
    }

    scenario = TraceReplayEngine.trace_to_eval_scenario(trace)
    assert scenario.id == "eval-tr-100"
    assert scenario.prompt == "What is 2+2?"
    assert scenario.expected_output == "4"
