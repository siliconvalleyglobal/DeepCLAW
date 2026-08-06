import { describe, test, expect, beforeAll } from 'vitest';
import { DeepClawGateway } from '../src/index';
import { PreExecutionPolicyEngine, AgentIdentity } from '@svgph/sdk';

describe('DeepClawGateway', () => {
  let gateway: DeepClawGateway;
  let policyEngine: PreExecutionPolicyEngine;

  beforeAll(() => {
    policyEngine = new PreExecutionPolicyEngine();
    gateway = new DeepClawGateway({
      port: 0,
      policyEngine,
    });
  });

  describe('health endpoint', () => {
    test('returns ok status', async () => {
      const response = await gateway.getApp().fetch(new Request('http://localhost/health'));
      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('deepclaw-gateway');
      expect(data.version).toBe('2.0.0');
    });
  });

  describe('policy evaluation endpoint', () => {
    test('evaluates and returns permit for admin', async () => {
      const response = await gateway.getApp().fetch(
        new Request('http://localhost/api/v1/policy/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity: { name: 'admin', roles: ['admin'], agentId: 'agent-1' },
            toolName: 'read_file',
          }),
        })
      );

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.decision.permitted).toBe(true);
      expect(data.decision.decisionId).toMatch(/^dec-/);
    });

    test('evaluates and returns deny for restricted agent', async () => {
      const response = await gateway.getApp().fetch(
        new Request('http://localhost/api/v1/policy/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity: { name: 'bot', roles: ['restricted_agent'], agentId: 'agent-2' },
            toolName: 'exec_bash',
          }),
        })
      );

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.decision.permitted).toBe(false);
      expect(data.decision.violations.length).toBeGreaterThan(0);
    });
  });

  describe('MCP proxy endpoint', () => {
    test('proxies MCP request when permitted', async () => {
      const response = await gateway.getApp().fetch(
        new Request('http://localhost/api/v1/mcp/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity: { name: 'admin', roles: ['admin'], agentId: 'agent-1' },
            request: {
              method: 'tools/list',
              params: {},
            },
            targetUrl: 'http://localhost:3001',
          }),
        })
      );

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.policy.permitted).toBe(true);
      expect(data.proxied).toBe(true);
    });

    test('blocks MCP request when denied', async () => {
      const response = await gateway.getApp().fetch(
        new Request('http://localhost/api/v1/mcp/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity: { name: 'bot', roles: ['restricted_agent'], agentId: 'agent-2' },
            request: {
              method: 'exec_bash',
              params: { command: 'rm -rf /' },
            },
            targetUrl: 'http://localhost:3001',
          }),
        })
      );

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.policy.permitted).toBe(false);
      expect(response.status).toBe(403);
    });
  });

  describe('A2A delegation endpoint', () => {
    test('delegates task when permitted', async () => {
      const response = await gateway.getApp().fetch(
        new Request('http://localhost/api/v1/a2a/delegate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity: { name: 'operator', roles: ['workflow_operator'], agentId: 'agent-3' },
            agentId: 'agent-b',
            task: { type: 'research', query: 'find latest AI papers' },
            context: {},
          }),
        })
      );

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.policy.permitted).toBe(true);
      expect(data.delegation.status).toBe('dispatched');
    });
  });

  describe('status endpoint', () => {
    test('returns operational status', async () => {
      const response = await gateway.getApp().fetch(new Request('http://localhost/api/v1/status'));
      const data = await response.json();
      expect(data.status).toBe('operational');
      expect(data.version).toBe('2.0.0');
      expect(data.nodeVersion).toBeDefined();
    });
  });

  describe('workflow endpoints', () => {
    test('creates and retrieves a workflow', async () => {
      const createResponse = await gateway.getApp().fetch(
        new Request('http://localhost/api/v1/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 'wf-1',
            name: 'Test Workflow',
            description: 'A test workflow',
            version: '1.0.0',
            steps: [
              { name: 'step1', action: 'read_file' },
              { name: 'step2', action: 'write_file' },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }),
        })
      );
      expect(createResponse.status).toBe(200);
      const createData = await createResponse.json();
      expect(createData.success).toBe(true);
      expect(createData.data.id).toBe('wf-1');

      const getResponse = await gateway.getApp().fetch(new Request('http://localhost/api/v1/workflows/wf-1'));
      const getData = await getResponse.json();
      expect(getData.success).toBe(true);
      expect(getData.data.name).toBe('Test Workflow');
      expect(getData.data.steps).toHaveLength(2);
    });

    test('lists workflows', async () => {
      const response = await gateway.getApp().fetch(new Request('http://localhost/api/v1/workflows'));
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(1);
    });

    test('creates a workflow run', async () => {
      const response = await gateway.getApp().fetch(
        new Request('http://localhost/api/v1/workflows/wf-1/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: { query: 'test' } }),
        })
      );
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('pending');
      expect(data.data.steps).toHaveLength(2);
    });

    test('retrieves and updates a run step', async () => {
      const listResponse = await gateway.getApp().fetch(new Request('http://localhost/api/v1/workflows/runs?workflowId=wf-1'));
      const listData = await listResponse.json();
      expect(listData.data.length).toBeGreaterThan(0);
      const run = listData.data[0];
      const stepId = run.steps[0].id;

      const patchResponse = await gateway.getApp().fetch(
        new Request(`http://localhost/api/v1/workflows/runs/${run.id}/steps/${stepId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed', output: { result: 'ok' } }),
        })
      );
      const patchData = await patchResponse.json();
      expect(patchData.success).toBe(true);
      expect(patchData.data.steps[0].status).toBe('completed');
    });
  });

  describe('observability endpoints', () => {
    test('exports OTel spans', async () => {
      const evalResponse = await gateway.getApp().fetch(
        new Request('http://localhost/api/v1/policy/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity: { name: 'admin', roles: ['admin'], agentId: 'agent-1' },
            toolName: 'read_file',
          }),
        })
      );
      expect(evalResponse.status).toBe(200);

      const otelResponse = await gateway.getApp().fetch(new Request('http://localhost/api/v1/observability/otel'));
      const otelData = await otelResponse.json();
      expect(otelData.resource).toBeDefined();
      expect(otelData.scopeSpans).toHaveLength(1);
      expect(otelData.scopeSpans[0].spans.length).toBeGreaterThan(0);
    });

    test('clears spans', async () => {
      const clearResponse = await gateway.getApp().fetch(new Request('http://localhost/api/v1/observability/clear', {
        method: 'POST',
      }));
      expect(clearResponse.status).toBe(200);

      const otelResponse = await gateway.getApp().fetch(new Request('http://localhost/api/v1/observability/otel'));
      const otelData = await otelResponse.json();
      expect(otelData.scopeSpans[0].spans).toHaveLength(0);
    });
  });
});
