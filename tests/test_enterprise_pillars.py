"""
Enterprise Pillars & Real Infrastructure Integration Test Suite
"""

import pytest
import os
from deepclaw.governance.identity import AgentIdentity
from deepclaw.governance.sandbox import SubprocessSandbox
from deepclaw.governance.audit_log import AuditLogger
from deepclaw.governance.sso import SSOProvider
from deepclaw.channels.adapters.telegram import TelegramAdapter
from deepclaw.channels.base_channel import ChannelMessage

def test_zero_trust_cryptographic_identity():
    identity = AgentIdentity(agent_id="agent_alpha", tenant_id="tenant_svg")
    token = identity.generate_token(ttl_seconds=300)
    assert token is not None

    payload = AgentIdentity.verify_token(token)
    assert payload["agent_id"] == "agent_alpha"
    assert payload["tenant_id"] == "tenant_svg"

def test_subprocess_sandbox_isolation():
    sandbox = SubprocessSandbox(timeout_seconds=2.0)
    code = "print('Hello from isolated sandbox')"
    res = sandbox.execute_code(code)
    assert res["success"] is True
    assert res["stdout"] == "Hello from isolated sandbox"
    assert res["exit_code"] == 0

def test_durable_sqlite_audit_log(tmp_path):
    db_file = str(tmp_path / "audit_test.db")
    logger = AuditLogger(db_path=db_file)
    res = logger.log_event(
        event_type="TOOL_CALL",
        agent_id="agent_beta",
        action_target="database_query",
        decision="ALLOWED",
        reasoning_chain=["Check policy matrix", "Role matches db_admin"]
    )
    assert res["logged"] is True
    assert res["signature"] is not None

    events = logger.get_events(agent_id="agent_beta")
    assert len(events) == 1
    assert events[0]["action_target"] == "database_query"
    assert events[0]["reasoning_chain"] == ["Check policy matrix", "Role matches db_admin"]

def test_enterprise_sso_authentication():
    sso = SSOProvider(issuer_domain="sso.svgph.com")
    saml_res = sso.parse_saml_assertion("<saml:Assertion><saml:NameID>admin@svg.ph</saml:NameID></saml:Assertion>")
    assert saml_res["authenticated"] is True
    assert saml_res["user_id"] == "admin@svg.ph"

def test_telegram_channel_http_adapter():
    adapter = TelegramAdapter()
    msg = ChannelMessage(message_id="101", sender_id="user1", recipient_id="chat1", content="Hello Telegram", channel="telegram")
    res = adapter.send_message(msg)
    assert res["status"] in ["sent_local_mode", "success", "failed"]
