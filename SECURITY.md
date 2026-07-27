# Security Policy & Zero Trust Architecture

## Agent Zero Trust Default Posture

DeepClaw treats AI agents as potentially untrusted entities executing under strict identity boundary limits:

1. **Pre-Execution Inspection**: Every tool invocation is subject to policy verification *before* execution.
2. **Permission Ceilings**: Inbound channel requests (WhatsApp, Slack, Webhooks) inherit defined permission ceilings preventing scope escalation.
3. **Irreversible Action Checkpoints**: Financial transactions, external account mutations, or mass user communications require human approval by default.
4. **SIEM Audit Trails**: Immutable, structured audit logs trace identity, policy decision, reasoning state, and execution output.

## Reporting a Vulnerability

Please report security issues privately to `security@deepclaw.dev` or open a confidential security advisory. Do not disclose vulnerabilities in public GitHub issues prior to patch release.
