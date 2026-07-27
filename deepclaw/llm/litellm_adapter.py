"""
Model-agnostic LiteLLM adapter.
"""

from typing import Any, Dict, List, Optional


class LiteLLMAdapter:
    """LiteLLM unified wrapper for LLM provider bindings."""

    def __init__(self, default_model: str = "gpt-4o"):
        self.default_model = default_model

    async def completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        target_model = model or self.default_model
        try:
            import litellm  # type: ignore

            response = await litellm.acompletion(
                model=target_model,
                messages=messages,
                temperature=temperature,
                **kwargs,
            )
            return response.model_dump()
        except ImportError:
            # Fallback mock for offline / dev testing environments
            last_msg = messages[-1]["content"] if messages else ""
            return {
                "id": "mock-completion-1",
                "model": target_model,
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": f"[LiteLLM Mock Output for model {target_model}]: Processed '{last_msg}'",
                        }
                    }
                ],
            }
