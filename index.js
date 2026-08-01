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

class TokenBudgetGuard {
  constructor({ maxTokensPerMinute = 60000, maxUsdPerDay = 50.0 } = {}) {
    this.maxTokensPerMinute = maxTokensPerMinute;
    this.maxUsdPerDay = maxUsdPerDay;
    this.records = [];
  }

  checkAndRecord(tenantId, tokens, costUsd = 0.0) {
    const now = Date.now();
    const oneMinAgo = now - 60000;
    const tokensLastMin = this.records
      .filter((r) => r.timestamp > oneMinAgo && r.tenantId === tenantId)
      .reduce((sum, r) => sum + r.tokens, 0);

    if (tokensLastMin + tokens > this.maxTokensPerMinute) {
      return { allowed: false, reason: `Rate Limit Exceeded (${tokensLastMin + tokens} > ${this.maxTokensPerMinute})` };
    }

    this.records.push({ tenantId, tokens, costUsd, timestamp: now });
    return { allowed: true, reason: "Usage approved" };
  }
}

class DLPEngine {
  constructor() {
    this.patterns = [
      { name: "SSN", regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[REDACTED_SSN]" },
      { name: "EMAIL", regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: "[REDACTED_EMAIL]" },
      { name: "API_KEY", regex: /(?:sk-proj-|sk-ant-|gsk_)[a-zA-Z0-9_-]{20,}/g, replacement: "[REDACTED_API_KEY]" },
    ];
  }

  sanitize(text) {
    let sanitized = text;
    let matchesCount = 0;
    for (const rule of this.patterns) {
      const matches = sanitized.match(rule.regex);
      if (matches) {
        matchesCount += matches.length;
        sanitized = sanitized.replace(rule.regex, rule.replacement);
      }
    }
    return { sanitizedText: sanitized, matchesFound: matchesCount };
  }
}

module.exports = {
  AgentIdentity,
  PreExecutionPolicyEngine,
  SIEMAuditLogger,
  TokenBudgetGuard,
  DLPEngine,
};
