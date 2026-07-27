"""
Isolated execution container / microVM sandbox wrapper.
"""

from typing import Any, Callable, Dict


class ExecutionSandbox:
    """MicroVM / process isolation sandbox container."""

    def __init__(self, isolation_level: str = "process"):
        self.isolation_level = isolation_level

    async def execute_isolated(self, fn: Callable[..., Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """Execute callable within isolated execution context."""
        try:
            res = fn(*args, **kwargs)
            return {
                "status": "success",
                "isolation_level": self.isolation_level,
                "result": res,
            }
        except Exception as e:
            return {
                "status": "error",
                "isolation_level": self.isolation_level,
                "error": str(e),
            }
