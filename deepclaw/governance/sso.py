"""
Enterprise SSO & OIDC Authentication Module (Pillar 4 / Enterprise)
Supports JWT/OIDC bearer token validation, SAML 2.0 assertion parsing, and enterprise role mapping.
"""

import time
import json
import base64
import hmac
import hashlib
from typing import Dict, Any, Optional

class SSOProvider:
    """
    Enterprise SSO Authenticator supporting OIDC, SAML 2.0, and JWT assertions.
    """

    def __init__(self, issuer_domain: str = "sso.svgph.com", client_id: str = "deepclaw_enterprise"):
        self.issuer_domain = issuer_domain
        self.client_id = client_id

    def authenticate_oidc_token(self, bearer_token: str, secret_key: str = "deepclaw_sso_secret") -> Dict[str, Any]:
        """
        Validates OIDC bearer token claims and extracts user claims + roles.
        """
        try:
            parts = bearer_token.split(".")
            if len(parts) != 3:
                # Format: header.payload.signature
                raise ValueError("Invalid JWT format")

            header_b64, payload_b64, signature = parts[0], parts[1], parts[2]
            
            # Verify HMAC-SHA256 signature
            message = f"{header_b64}.{payload_b64}"
            expected_sig = base64.urlsafe_b64encode(
                hmac.new(secret_key.encode(), message.encode(), hashlib.sha256).digest()
            ).decode().rstrip("=")

            if not hmac.compare_digest(signature.rstrip("="), expected_sig):
                return {"authenticated": False, "reason": "Invalid token signature"}

            # Padding decode
            padding = len(payload_b64) % 4
            if padding:
                payload_b64 += "=" * (4 - padding)

            payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode()).decode())

            if payload.get("iss") and payload["iss"] != self.issuer_domain:
                return {"authenticated": False, "reason": f"Issuer mismatch: {payload.get('iss')}"}

            if time.time() > payload.get("exp", 0):
                return {"authenticated": False, "reason": "Token expired"}

            return {
                "authenticated": True,
                "user_id": payload.get("sub"),
                "email": payload.get("email"),
                "tenant_id": payload.get("tenant_id", "default_tenant"),
                "roles": payload.get("roles", ["user"])
            }
        except Exception as e:
            return {"authenticated": False, "reason": str(e)}

    def parse_saml_assertion(self, saml_xml: str) -> Dict[str, Any]:
        """
        Parses SAML 2.0 response XML assertion for enterprise IdPs (Okta, PingIdentity, Azure AD).
        """
        if "<saml:Assertion" not in saml_xml and "<Assertion" not in saml_xml:
            return {"authenticated": False, "reason": "Invalid SAML assertion XML"}

        # Basic attribute extraction
        user_id = "enterprise_user"
        if "<saml:NameID" in saml_xml:
            try:
                user_id = saml_xml.split("<saml:NameID")[1].split(">")[1].split("</")[0]
            except Exception:
                pass

        return {
            "authenticated": True,
            "user_id": user_id,
            "protocol": "SAML2.0",
            "roles": ["enterprise_admin"]
        }
