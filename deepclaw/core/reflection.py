"""
Autonomous tool self-correction and reflection loop.
"""

import asyncio
from typing import Any, Callable, Dict, Optional, Tuple


class SelfCorrectionLoop:
    """Manages retry reflection loops when tool calls or LLM completions fail."""

    def __init__(self, max_retries: int = 3, backoff_seconds: float = 0.5):
        self.max_retries = max_retries
        self.backoff_seconds = backoff_seconds

    async def execute_with_reflection(
        self,
        tool_fn: Callable[..., Any],
        args: Dict[str, Any],
        reflection_prompt_builder: Optional[Callable[[Exception, int], str]] = None,
    ) -> Tuple[bool, Any, Optional[str]]:
        """Attempt tool execution with automatic error reflection and retries."""
        last_error: Optional[Exception] = None

        for attempt in range(1, self.max_retries + 1):
            try:
                res = await tool_fn(**args) if asyncio.iscoroutinefunction(tool_fn) else tool_fn(**args)
                return True, res, None
            except Exception as e:
                last_error = e
                reflection = (
                    reflection_prompt_builder(e, attempt)
                    if reflection_prompt_builder
                    else f"Attempt {attempt}/{self.max_retries} failed with error: {str(e)}. Reflecting and retrying..."
                )
                if attempt < self.max_retries:
                    await asyncio.sleep(self.backoff_seconds * attempt)

        return False, None, f"Execution failed after {self.max_retries} attempts: {str(last_error)}"
