"""
Token Budget & Rate Limiting Guard for DeepCLAW Governance.
Enforces real-time token limits, spending caps, and sliding-window rate limits.
"""

import time
from typing import Dict, Optional, Tuple
from pydantic import BaseModel, Field


class BudgetLimitExceededError(Exception):
    """Raised when a tenant, agent, or user exceeds their allocated token or USD budget."""
    pass


class TokenBudgetConfig(BaseModel):
    max_tokens_per_minute: int = Field(default=60000, description="Max tokens allowed per minute")
    max_tokens_per_day: int = Field(default=1000000, description="Max tokens allowed per day")
    max_usd_per_day: float = Field(default=50.0, description="Max USD expenditure per day")
    cost_per_1k_input_tokens: float = Field(default=0.0015, description="Cost per 1k input tokens in USD")
    cost_per_1k_output_tokens: float = Field(default=0.0020, description="Cost per 1k output tokens in USD")


class TokenBudgetGuard:
    """
    Sliding-window token budget manager and rate limiter.
    Tracks consumption across tenants, agents, and users to prevent runaway costs.
    """

    def __init__(self, default_config: Optional[TokenBudgetConfig] = None):
        self.default_config = default_config or TokenBudgetConfig()
        # Key format: "entity_type:entity_id" -> list of (timestamp, prompt_tokens, completion_tokens, cost)
        self._consumption_log: Dict[str, list] = {}

    def _get_key(self, tenant_id: str, agent_id: Optional[str] = None) -> str:
        if agent_id:
            return f"tenant:{tenant_id}:agent:{agent_id}"
        return f"tenant:{tenant_id}"

    def calculate_cost(self, prompt_tokens: int, completion_tokens: int, config: Optional[TokenBudgetConfig] = None) -> float:
        cfg = config or self.default_config
        input_cost = (prompt_tokens / 1000.0) * cfg.cost_per_1k_input_tokens
        output_cost = (completion_tokens / 1000.0) * cfg.cost_per_1k_output_tokens
        return round(input_cost + output_cost, 6)

    def check_and_record(
        self,
        tenant_id: str,
        prompt_tokens: int,
        completion_tokens: int,
        agent_id: Optional[str] = None,
        config: Optional[TokenBudgetConfig] = None
    ) -> Tuple[bool, float, str]:
        """
        Verifies if consumption is within budget limits.
        If allowed, records consumption and returns (True, cost, message).
        If exceeded, raises BudgetLimitExceededError or returns (False, cost, message).
        """
        cfg = config or self.default_config
        key = self._get_key(tenant_id, agent_id)
        now = time.time()
        one_min_ago = now - 60
        one_day_ago = now - 86400

        total_tokens_requested = prompt_tokens + completion_tokens
        estimated_cost = self.calculate_cost(prompt_tokens, completion_tokens, cfg)

        if key not in self._consumption_log:
            self._consumption_log[key] = []

        # Prune old logs (> 24 hours)
        self._consumption_log[key] = [
            entry for entry in self._consumption_log[key] if entry[0] > one_day_ago
        ]

        # Calculate usage in 1-minute window
        tokens_last_min = sum(
            e[1] + e[2] for e in self._consumption_log[key] if e[0] > one_min_ago
        )
        if tokens_last_min + total_tokens_requested > cfg.max_tokens_per_minute:
            msg = f"Rate Limit Exceeded: {tokens_last_min + total_tokens_requested} tokens requested in 1 min (Limit: {cfg.max_tokens_per_minute})"
            return False, estimated_cost, msg

        # Calculate usage in 24-hour window
        tokens_last_day = sum(e[1] + e[2] for e in self._consumption_log[key])
        if tokens_last_day + total_tokens_requested > cfg.max_tokens_per_day:
            msg = f"Daily Token Budget Exceeded: {tokens_last_day + total_tokens_requested} tokens in 24h (Limit: {cfg.max_tokens_per_day})"
            return False, estimated_cost, msg

        # Calculate USD spending in 24-hour window
        cost_last_day = sum(e[3] for e in self._consumption_log[key])
        if cost_last_day + estimated_cost > cfg.max_usd_per_day:
            msg = f"Daily USD Budget Exceeded: ${cost_last_day + estimated_cost:.4f} in 24h (Limit: ${cfg.max_usd_per_day:.2f})"
            return False, estimated_cost, msg

        # Record valid consumption
        self._consumption_log[key].append((now, prompt_tokens, completion_tokens, estimated_cost))
        return True, estimated_cost, "Usage approved"

    def get_usage_summary(self, tenant_id: str, agent_id: Optional[str] = None) -> dict:
        key = self._get_key(tenant_id, agent_id)
        now = time.time()
        one_day_ago = now - 86400
        logs = [e for e in self._consumption_log.get(key, []) if e[0] > one_day_ago]

        total_prompt = sum(e[1] for e in logs)
        total_completion = sum(e[2] for e in logs)
        total_cost = sum(e[3] for e in logs)

        return {
            "entity_key": key,
            "total_prompt_tokens": total_prompt,
            "total_completion_tokens": total_completion,
            "total_tokens": total_prompt + total_completion,
            "total_cost_usd": round(total_cost, 4),
            "total_requests": len(logs)
        }
