"""
Model-agnostic LiteLLM adapter with streaming and multi-modal support.
"""

from typing import Any, AsyncGenerator, Dict, List, Optional, Union


class LiteLLMAdapter:
    def __init__(self, default_model: str = "gpt-4o"):
        self.default_model = default_model

    async def completion(
        self,
        messages: List[Dict[str, Any]],
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
        except Exception:
            last_msg = messages[-1].get("content", "") if messages else ""
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

    async def stream_completion(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        **kwargs: Any,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        target_model = model or self.default_model
        try:
            import litellm  # type: ignore
            response = await litellm.acompletion(
                model=target_model,
                messages=messages,
                temperature=temperature,
                stream=True,
                **kwargs,
            )
            async for chunk in response:
                yield chunk.model_dump()
        except Exception:
            last_msg = messages[-1].get("content", "") if messages else ""
            text = f"[LiteLLM Mock Stream for model {target_model}]: Processed '{last_msg}'"
            for char in text:
                yield {"choices": [{"delta": {"content": char}}]}
            yield {"choices": [{"finish_reason": "stop"}]}

    @staticmethod
    def normalize_message_content(content: Union[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        if isinstance(content, str):
            return [{"type": "text", "text": content}]
        return content

    def build_multimodal_messages(
        self,
        text: str,
        image_urls: Optional[List[str]] = None,
        image_paths: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        parts: List[Dict[str, Any]] = [{"type": "text", "text": text}]
        if image_urls:
            for url in image_urls:
                parts.append({"type": "image_url", "image_url": {"url": url}})
        if image_paths:
            for path in image_paths:
                try:
                    import base64
                    with open(path, "rb") as f:
                        encoded = base64.b64encode(f.read()).decode("utf-8")
                    parts.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded}"}})
                except Exception:
                    pass
        return [{"role": "user", "content": parts}]
