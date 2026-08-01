export interface AgentIdentityOptions {
  name: string;
  roles?: string[];
  channelOrigin?: string | null;
  permissionCeiling?: string;
}

export class AgentIdentity {
  agentId: string;
  name: string;
  roles: string[];
  channelOrigin: string | null;
  permissionCeiling: string;
  constructor(options?: AgentIdentityOptions);
}

export interface PolicyDecision {
  decisionId: string;
  timestamp: number;
  agentId: string;
  action: string;
  permitted: boolean;
  reasoningTrace: string;
  violations: string[];
}

export class PreExecutionPolicyEngine {
  evaluateToolCall(identity: AgentIdentity, toolName: string, args?: Record<string, any>): PolicyDecision;
}

export class SIEMAuditLogger {
  logDecision(decision: PolicyDecision, metadata?: Record<string, any>): Record<string, any>;
  exportSiemJson(): string;
}

export class TokenBudgetGuard {
  constructor(options?: { maxTokensPerMinute?: number; maxUsdPerDay?: number });
  checkAndRecord(tenantId: string, tokens: number, costUsd?: number): { allowed: boolean; reason: string };
}

export class DLPEngine {
  sanitize(text: string): { sanitizedText: string; matchesFound: number };
}
