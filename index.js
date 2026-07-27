/**
 * DeepClaw — Node.js & TypeScript SDK
 * Enterprise-Governance-First Open Source AI Agent Framework
 */

class AgentIdentity {
  constructor({ name, roles = ["agent"], channelOrigin = null, permissionCeiling = "restricted" } = {}) {
    this.agentId = `agent-${Date.now()}`;
    this.name = name;
    this.roles = roles;
    this.channelOrigin = channelOrigin;
    this.permissionCeiling = permissionCeiling;
  }
}

class PreExecutionPolicyEngine {
  constructor() {
    this.rolePermissions = {
      admin: ["*"],
      workflow_operator: ["read", "write", "mcp_*"],
      restricted_agent: ["read"],
      external_channel: ["read_public", "send_reply"],
    };
  }

  evaluateToolCall(identity, toolName, args = {}) {
    const roles = identity.roles || ["restricted_agent"];
    let permitted = false;

    for (const r of roles) {
      const perms = this.rolePermissions[r] || [];
      if (perms.includes("*") || perms.includes(toolName)) {
        permitted = true;
        break;
      }
      for (const p of perms) {
        if (p.endsWith("*") && toolName.startsWith(p.slice(0, -1))) {
          permitted = true;
          break;
        }
      }
    }

    return {
      decisionId: `dec-${Date.now()}`,
      timestamp: Date.now() / 1000,
      agentId: identity.agentId || identity.name,
      action: toolName,
      permitted,
      reasoningTrace: permitted
        ? `PERMITTED: Action '${toolName}' authorized.`
        : `DENIED: Pre-execution policy check failed for '${toolName}'.`,
      violations: permitted ? [] : [`Role(s) ${roles} lack permission for '${toolName}'`],
    };
  }
}

class SIEMAuditLogger {
  constructor() {
    this.records = [];
  }

  logDecision(decision, metadata = {}) {
    const record = {
      eventType: "GOVERNANCE_POLICY_EVALUATION",
      timestamp: decision.timestamp,
      decisionId: decision.decisionId,
      action: decision.action,
      permitted: decision.permitted,
      reasoningTrace: decision.reasoningTrace,
      metadata,
    };
    this.records.push(record);
    return record;
  }

  exportSiemJson() {
    return JSON.stringify(this.records, null, 2);
  }
}

module.exports = {
  AgentIdentity,
  PreExecutionPolicyEngine,
  SIEMAuditLogger,
};
