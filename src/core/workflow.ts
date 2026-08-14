export interface AgentIdentity {
  agentId: string;
  name: string;
  roles: string[];
  channelOrigin: string | null;
  permissionCeiling: string;
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

export interface CompressionResult {
  compressedText: string;
  originalTokens: number;
  compressedTokens: number;
  tokensSaved: number;
  compressionRatio: number;
  estimatedSavingsUSD: number;
}

export interface RankedFile {
  path: string;
  score: number;
  tokens: number;
  reason: string;
}

export interface BudgetConfig {
  monthlyLimitUSD: number;
  currentSpentUSD: number;
  alertThresholdPercent: number;
  hardCapEnabled: boolean;
}

export interface GatewayMessage {
  id: string;
  type: 'request' | 'response' | 'event';
  timestamp: number;
  source: string;
  target?: string;
  payload: unknown;
  metadata: Record<string, unknown>;
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface A2ARequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params: {
    agentId: string;
    task?: Record<string, unknown>;
    context?: Record<string, unknown>;
  };
}

export interface OpenClawGatewayMessage {
  type: 'gateway_request' | 'gateway_response' | 'gateway_event';
  version: string;
  id: string;
  timestamp: number;
  source: {
    type: 'agent' | 'channel' | 'cli' | 'external';
    id: string;
  };
  target?: {
    type: 'agent' | 'channel' | 'mcp' | 'a2a';
    id: string;
  };
  payload: {
    action: string;
    args?: Record<string, unknown>;
    result?: unknown;
    error?: {
      code: number;
      message: string;
    };
  };
  policy?: {
    decisionId: string;
    permitted: boolean;
    reasoningTrace: string;
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  action: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  startedAt?: number;
  finishedAt?: number;
  retries?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  continueOnError?: boolean;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  version: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  steps: WorkflowStep[];
  createdAt: number;
  updatedAt: number;
  finishedAt?: number;
  metadata?: Record<string, unknown>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: Omit<WorkflowStep, 'id' | 'status' | 'startedAt' | 'finishedAt' | 'output' | 'error'>[];
  createdAt: number;
  updatedAt: number;
  triggers?: WorkflowTrigger[];
}

export interface WorkflowTrigger {
  id: string;
  type: 'webhook' | 'schedule' | 'event';
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface SubWorkflowCall {
  workflowId: string;
  input?: Record<string, unknown>;
  waitForCompletion?: boolean;
}
