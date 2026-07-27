"""
Model fallback chain for automatic provider failover.
"""

from typing import Any, Dict, List
from deepclaw.llm.litellm_adapter import LiteLLMAdapter


class FallbackChain:
    """Sequential model chain trying secondary models if primary fails."""

    def __init__(self, models: List[str]):
        if not models:
            raise ValueError("Fallback chain requires at least one model spec")
        self.models = models
        self.adapter = LiteLLMAdapter()

    async def execute(self, messages: List[Dict[str, str]], **kwargs: Any) -> Dict[str, Any]:
        last_exception = None
        for model in self.models:
            try:
                res = await self.adapter.completion(messages=messages, model=model, **kwargs)
                res["fallback_model_used"] = model
                return res
            except Exception as e:
                last_exception = e
                continue
        raise RuntimeError(f"All models in fallback chain failed: {last_exception}")
