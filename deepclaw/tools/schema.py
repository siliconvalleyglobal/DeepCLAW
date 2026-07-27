"""
Typed schema definitions for agent tools.
"""

from typing import Any, Callable, Dict, Optional
from pydantic import BaseModel, Field


class ToolSchema(BaseModel):
    """Declarative specification for executable tools."""

    name: str
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    handler: Optional[Callable[..., Any]] = None

    def execute(self, **kwargs: Any) -> Any:
        if self.handler is None:
            raise NotImplementedError(f"Tool '{self.name}' has no registered execution handler")
        return self.handler(**kwargs)
