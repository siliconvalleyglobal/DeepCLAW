"""
Zero-Trust Cryptographic Agent Identity & Claims Verification (Pillar 1)
"""

import hmac
import hashlib
import time
import json
import base64
from typing import Dict, Any, Optional, List

class AgentIdentity:
    """
    Cryptographically signed Agent Identity claim token using HMAC-SHA256.
    """

    def __init__(
        self,
        agent_id: Optional[str] = None,
        name: Optional[str] = None,
        tenant_id: str = "default_tenant",
        roles: Optional[List[str]] = None,
        channel_origin: Optional[str] = None,
        permission_ceiling: Optional[str] = None,
        secret_key: str = "deepclaw_zero_trust_secret_2026"
    ):
        self.agent_id = agent_id or name or "agent_unknown"
        self.name = name or self.agent_id
        self.tenant_id = tenant_id
        self.roles = roles or ["agent_executor"]
        self.channel_origin = channel_origin
        self.permission_ceiling = permission_ceiling
        self.secret_key = secret_key

    def generate_token(self, ttl_seconds: int = 3600) -> str:
        """
        Generates a cryptographically signed Zero-Trust bearer token.
        """
        payload = {
            "agent_id": self.agent_id,
            "name": self.name,
            "tenant_id": self.tenant_id,
            "roles": self.roles,
            "channel_origin": self.channel_origin,
            "permission_ceiling": self.permission_ceiling,
            "exp": int(time.time()) + ttl_seconds,
            "iat": int(time.time())
        }
        encoded_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
        signature = hmac.new(
            self.secret_key.encode(),
            encoded_payload.encode(),
            hashlib.sha256
        ).hexdigest()

        return f"{encoded_payload}.{signature}"

    @classmethod
    def verify_token(cls, token: str, secret_key: str = "deepclaw_zero_trust_secret_2026") -> Dict[str, Any]:
        """
        Verifies token HMAC-SHA256 signature and expiration claim.
        """
        try:
            parts = token.split(".")
            if len(parts) != 2:
                raise ValueError("Invalid token format")

            encoded_payload, signature = parts[0], parts[1]
            expected_sig = hmac.new(
                secret_key.encode(),
                encoded_payload.encode(),
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(signature, expected_sig):
                raise ValueError("Cryptographic signature mismatch")

            payload = json.loads(base64.urlsafe_b64decode(encoded_payload.encode()).decode())
            if time.time() > payload.get("exp", 0):
                raise ValueError("Token expired")

            return payload
        except Exception as e:
            return {"valid": False, "error": str(e)}
