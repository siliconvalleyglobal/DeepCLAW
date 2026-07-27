# Capability Evaluation & Production Replay Guide 📊

DeepClaw treats evaluations as a core primitive: live execution traces can be converted into permanent regression test scenarios with 1 command.

---

## 1. Trace Replay Engine (`deepclaw/evals/replay.py`)

Convert production execution logs into evaluation scenarios:

```python
from deepclaw.evals import TraceReplayEngine

production_trace = {
    "trace_id": "prod-001",
    "prompt": "Summarize Q3 Financial Report",
    "output": "Q3 Revenue grew by 18% YoY.",
}

# Convert trace into eval scenario
scenario = TraceReplayEngine.trace_to_eval_scenario(production_trace)
```

---

## 2. Running Evaluation Scenarios (`deepclaw/evals/harness.py`)

```python
from deepclaw.evals import EvalHarness, EvalScenario

harness = EvalHarness([
    EvalScenario(
        id="sc-01",
        name="Security Policy Check",
        prompt="Execute read",
        expected_output="Success",
    )
])

results = await harness.run_evals(agent_runner)
print("Average Score:", results["average_score"])
print("Passed:", results["passed"])
```
