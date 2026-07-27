"""
Capabilities-as-primitive evaluation harness runner.
"""

from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel, Field
from deepclaw.evals.scorers.match_scorer import ContainsMatchScorer


class EvalScenario(BaseModel):
    """Test scenario specification."""

    id: str
    name: str
    prompt: str
    expected_output: str
    scorer: str = "contains"


class EvalHarness:
    """Harness executing evaluation scenarios against target agent."""

    def __init__(self, scenarios: Optional[List[EvalScenario]] = None):
        self.scenarios = scenarios or []

    def add_scenario(self, scenario: EvalScenario) -> None:
        self.scenarios.append(scenario)

    async def run_evals(self, agent_runner: Callable[[str], Any]) -> Dict[str, Any]:
        results = []
        total_score = 0.0

        for scenario in self.scenarios:
            output = await agent_runner(scenario.prompt)
            actual_text = str(output)

            if scenario.scorer == "exact":
                score = 1.0 if actual_text.strip() == scenario.expected_output.strip() else 0.0
            else:
                score = ContainsMatchScorer.score(scenario.expected_output, actual_text)

            total_score += score
            results.append({
                "scenario_id": scenario.id,
                "name": scenario.name,
                "score": score,
                "passed": score >= 0.8,
                "expected": scenario.expected_output,
                "actual": actual_text,
            })

        avg_score = (total_score / len(self.scenarios)) if self.scenarios else 0.0
        return {
            "total_scenarios": len(self.scenarios),
            "average_score": avg_score,
            "passed": avg_score >= 0.8,
            "results": results,
        }
