import { describe, test, expect } from 'vitest';
import {
  AgentIdentity,
  PreExecutionPolicyEngine,
  SIEMAuditLogger,
  TokenBudgetGuard,
  DLPEngine,
  DeepClawOptimizer,
  StreamBuffer,
  streamPipeline,
  asyncGenerator,
} from '../src/index';

describe('AgentIdentity', () => {
  test('constructs with defaults', () => {
    const id = new AgentIdentity({ name: 'test-agent' });
    expect(id.name).toBe('test-agent');
    expect(id.roles).toEqual(['agent']);
    expect(id.channelOrigin).toBeNull();
    expect(id.permissionCeiling).toBe('restricted');
    expect(id.agentId).toMatch(/^agent-/);
  });

  test('constructs with custom options', () => {
    const id = new AgentIdentity({
      name: 'custom',
      roles: ['admin', 'workflow_operator'],
      channelOrigin: 'telegram',
      permissionCeiling: 'elevated',
    });
    expect(id.name).toBe('custom');
    expect(id.roles).toEqual(['admin', 'workflow_operator']);
    expect(id.channelOrigin).toBe('telegram');
    expect(id.permissionCeiling).toBe('elevated');
  });
});

describe('PreExecutionPolicyEngine', () => {
  test('allows admin wildcard', () => {
    const engine = new PreExecutionPolicyEngine();
    const identity = new AgentIdentity({ name: 'admin', roles: ['admin'] });
    const decision = engine.evaluateToolCall(identity, 'exec_bash');
    expect(decision.permitted).toBe(true);
    expect(decision.decisionId).toMatch(/^dec-/);
  });

  test('denies restricted agent for privileged tool', () => {
    const engine = new PreExecutionPolicyEngine();
    const identity = new AgentIdentity({ name: 'bot', roles: ['restricted_agent'] });
    const decision = engine.evaluateToolCall(identity, 'exec_bash');
    expect(decision.permitted).toBe(false);
    expect(decision.violations.length).toBeGreaterThan(0);
  });

  test('allows workflow_operator for mcp_* tools', () => {
    const engine = new PreExecutionPolicyEngine();
    const identity = new AgentIdentity({ name: 'operator', roles: ['workflow_operator'] });
    const decision = engine.evaluateToolCall(identity, 'mcp_query');
    expect(decision.permitted).toBe(true);
  });
});

describe('SIEMAuditLogger', () => {
  test('logs decision and exports JSON', () => {
    const logger = new SIEMAuditLogger();
    const decision = {
      decisionId: 'dec-1',
      timestamp: 1700000000,
      agentId: 'agent-1',
      action: 'read_file',
      permitted: true,
      reasoningTrace: 'OK',
      violations: [] as string[],
    };
    const record = logger.logDecision(decision, { channel: 'cli' });
    expect(record.eventType).toBe('GOVERNANCE_POLICY_EVALUATION');
    const json = logger.exportSiemJson();
    expect(JSON.parse(json).length).toBe(1);
  });
});

describe('TokenBudgetGuard', () => {
  test('allows request under limit', () => {
    const guard = new TokenBudgetGuard({ maxTokensPerMinute: 1000, maxUsdPerDay: 10 });
    const res = guard.checkAndRecord('tenant-1', 100);
    expect(res.allowed).toBe(true);
    expect(res.reason).toContain('approved');
  });

  test('blocks request over rate limit', () => {
    const guard = new TokenBudgetGuard({ maxTokensPerMinute: 100 });
    guard.checkAndRecord('tenant-1', 60);
    const res = guard.checkAndRecord('tenant-1', 60);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Rate Limit Exceeded');
  });
});

describe('DLPEngine', () => {
  test('redacts SSN and email', () => {
    const engine = new DLPEngine();
    const res = engine.sanitize('SSN: 123-45-6789, email: john@example.com');
    expect(res.matchesFound).toBe(2);
    expect(res.sanitizedText).toContain('[REDACTED_SSN]');
    expect(res.sanitizedText).toContain('[REDACTED_EMAIL]');
    expect(res.sanitizedText).not.toContain('123-45-6789');
    expect(res.sanitizedText).not.toContain('john@example.com');
  });

  test('redacts API keys', () => {
    const engine = new DLPEngine();
    const res = engine.sanitize('key: sk-proj-abcdef1234567890123456');
    expect(res.matchesFound).toBe(1);
    expect(res.sanitizedText).toContain('[REDACTED_API_KEY]');
  });
});

describe('DeepClawOptimizer', () => {
  test('compresses prompt using local fallback when CLI unavailable', () => {
    const optimizer = new DeepClawOptimizer();
    const result = optimizer.optimizePrompt('Can you please analyze this code and explain what improvements can be made?');
    expect(result.compressedTokens).toBeGreaterThan(0);
    expect(result.tokensSaved).toBeGreaterThan(0);
    expect(result.compressionRatio).toBeGreaterThan(0);
  });

  test('redacts secrets locally', () => {
    const optimizer = new DeepClawOptimizer();
    const redacted = optimizer.redactSecrets('password = "secret123" and key sk-abcdef1234567890');
    expect(redacted).toContain('[REDACTED_SECRET]');
    expect(redacted).not.toContain('secret123');
  });

  test('estimates tokens', () => {
    const optimizer = new DeepClawOptimizer();
    const tokens = optimizer.estimateTokens('Hello world', 'anthropic');
    expect(tokens).toBeGreaterThan(0);
  });

  test('calculates cost', () => {
    const optimizer = new DeepClawOptimizer();
    const cost = optimizer.calculateCost(1000, 'anthropic', 'input');
    expect(cost).toBeGreaterThanOrEqual(0);
  });

  test('records expense and checks budget', () => {
    const optimizer = new DeepClawOptimizer();
    const budget = optimizer.getBudget();
    expect(budget.monthlyLimitUSD).toBeGreaterThan(0);
    const result = optimizer.recordExpense(1.0);
    expect(result.allowed).toBeDefined();
  });

  test('scans repository for context using local fallback', () => {
    const optimizer = new DeepClawOptimizer({ contextMaxTokens: 5000 });
    const ranked = optimizer.optimizeContext('test AgentIdentity class', process.cwd());
    expect(Array.isArray(ranked)).toBe(true);
  });
});

describe('Streaming', () => {
  test('StreamBuffer pushes and retrieves chunks', () => {
    const buffer = new StreamBuffer();
    const id1 = buffer.push({ text: 'hello' });
    const id2 = buffer.push({ text: 'world' });
    expect(id1).toMatch(/^chunk-/);
    expect(id2).toMatch(/^chunk-/);
    const all = buffer.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].data).toEqual({ text: 'hello' });
    buffer.close();
    expect(() => buffer.push({ text: 'fail' })).toThrow('Stream is closed');
  });

  test('streamPipeline transforms async iterable', async () => {
    const source = asyncGenerator([1, 2, 3]);
    const chunks: unknown[] = [];
    let completed = false;
    await streamPipeline(
      source,
      (n) => n * 10,
      {
        onChunk: (chunk) => chunks.push(chunk.data),
        onComplete: () => {
          completed = true;
        },
      }
    );
    expect(chunks).toEqual([10, 20, 30]);
    expect(completed).toBe(true);
  });

  test('streamPipeline calls onError on failure', async () => {
    async function* badSource() {
      yield 1;
      throw new Error('boom');
    }
    const errors: Error[] = [];
    await streamPipeline(
      badSource(),
      (n) => n,
      {
        onError: (err) => errors.push(err),
      }
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('boom');
  });
});
