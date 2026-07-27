"""
Routes inbound messaging traffic and enforces per-channel RBAC permission ceilings.
"""

import asyncio
from typing import Any, Callable, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage
from deepclaw.governance.identity import AgentIdentity
from deepclaw.governance.policy import PreExecutionPolicyEngine, PolicyDecision
from deepclaw.governance.audit_log import AuditLogger


class ChannelRouter:
    """Central router enforcing governance for all messaging channels."""

    def __init__(self):
        self.channels: Dict[str, BaseChannel] = {}
        self.policy_engine = PreExecutionPolicyEngine()
        self.audit_logger = AuditLogger()

    def register_channel(self, channel: BaseChannel) -> None:
        self.channels[channel.channel_name] = channel

    async def route_inbound(
        self,
        channel_name: str,
        raw_payload: Dict[str, Any],
        handler: Callable[[ChannelMessage, AgentIdentity], Any],
    ) -> Dict[str, Any]:
        if channel_name not in self.channels:
            raise ValueError(f"Channel '{channel_name}' not registered")

        channel = self.channels[channel_name]
        if not channel.verify_sender(raw_payload):
            raise PermissionError(f"Sender verification failed for channel '{channel_name}'")

        message = await channel.receive(raw_payload)

        # Build scoped agent identity with channel permission ceiling
        identity = AgentIdentity(
            name=f"ChannelAgent-{channel_name}",
            roles=[channel.permission_ceiling],
            channel_origin=channel_name,
            permission_ceiling=channel.permission_ceiling,
        )

        # Policy evaluation before message reaches agent logic
        decision: PolicyDecision = self.policy_engine.evaluate_tool_call(
            identity=identity,
            tool_name="send_reply",
            arguments={"content": message.content},
        )

        self.audit_logger.log_policy_decision(
            decision, metadata={"channel": channel_name, "sender_id": message.sender_id}
        )

        if not decision.permitted:
            raise PermissionError(
                f"Channel message blocked by governance policy: {decision.reasoning_trace}"
            )

        res = await handler(message, identity) if asyncio.iscoroutinefunction(handler) else handler(message, identity)
        return {
            "status": "routed_and_executed",
            "channel": channel_name,
            "decision": decision.model_dump(),
            "handler_result": res,
        }
