# Zero-Trust Governance & Security Guide 🛡️

DeepClaw enforces **Agent Zero Trust**: every tool call is evaluated by a pre-execution policy engine before execution occurs.

---

## 🔒 1. Pre-Execution Policy Engine (`deepclaw/governance/policy.py`)

When an agent attempts to invoke a tool, `PreExecutionPolicyEngine.evaluate_tool_call()` evaluates the request against:
1. **Agent Identity (`identity.py`)**: Token carrying agent ID and assigned roles.
2. **RBAC Permission Ceilings (`rbac.py`)**: Role-based matrix mapping allowable tool operations (`read`, `write`, `mcp_*`, `admin_*`).
3. **Guardrails (`guardrails.py`)**: Input validation rules preventing path traversal, SQL injection, or dangerous payloads.

If policy check fails, a `DENY` decision is rendered immediately, halting execution.

---

## 📊 2. SIEM JSON Audit Trail (`deepclaw/governance/audit_log.py`)

All policy evaluations log structured events to `AuditLogger`:

```json
{
  "event_type": "GOVERNANCE_POLICY_EVALUATION",
  "timestamp": 1785146762.384,
  "decision_id": "dec-1785146762384",
  "action": "admin_drop_db",
  "permitted": false,
  "reasoning_trace": "DENIED: Pre-execution policy check failed for 'admin_drop_db'.",
  "violations": ["Agent role(s) ['restricted_agent'] lack permission for 'admin_drop_db'"]
}
```

---

## 📜 3. ISO 42001 & SOC 2 Compliance Reports (`deepclaw/governance/compliance.py`)

Run `deepclaw report` to generate compliance evidence reports mapped to:
- **ISO/IEC 42001**: AI Management System risk assessments (Clause 6.2) & impact monitoring (Clause 8.2 & 9.1).
- **SOC 2 Type II**: Trust Services Criteria for Logical Access (CC6.1) & Security Event Monitoring (CC7.2).
