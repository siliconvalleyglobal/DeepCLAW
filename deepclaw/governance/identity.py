"""
Zero Trust scoped, verifiable per-agent identity.
"""

import uuid
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class AgentIdentity(BaseModel):
    """Verifiable identity token bound to an agent instance."""

    agent_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    tenant_id: str = "default-tenant"
    roles: List[str] = Field(default_factory=lambda: ["agent"])
    allowed_tools: List[str] = Field(default_factory=list)
    channel_origin: Optional[str] = None
    permission_ceiling: str = "restricted"
