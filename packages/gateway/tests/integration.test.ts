import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import { DeepClawGateway } from '../src/index';
import { PreExecutionPolicyEngine, AgentIdentity } from '@svgph/sdk';

describe('Gateway integration', () => {
  let gateway: DeepClawGateway;
  let server: ReturnType<typeof createServer>;
  let port: number;

  beforeAll(async () => {
    port = 0;
    gateway = new DeepClawGateway({
      port,
      policyEngine: new PreExecutionPolicyEngine(),
    });

    const app = gateway.getApp();
    server = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks).toString();
      const url = `http://localhost:${port}${req.url}`;
      const requestInit: RequestInit = {
        method: req.method,
        headers: req.headers as Record<string, string>,
      };
      if (req.method !== 'GET' && req.method !== 'HEAD' && body) {
        requestInit.body = body;
      }
      const request = new Request(url, requestInit);
      const response = await app.fetch(request);
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      const responseBody = await response.text();
      res.end(responseBody);
    });

    await new Promise<void>((resolve) => {
      server.listen(port, () => {
        port = (server.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(resolve);
    });
  });

  const base = () => `http://localhost:${port}`;

  test('health endpoint returns ok', async () => {
    const res = await fetch(`${base()}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('deepclaw-gateway');
  });

  test('policy evaluate returns decision', async () => {
    const res = await fetch(`${base()}/api/v1/policy/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: { name: 'admin', roles: ['admin'], agentId: 'agent-1' },
        toolName: 'read_file',
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.decision.permitted).toBe(true);
  });

  test('mcp proxy blocks restricted tool', async () => {
    const res = await fetch(`${base()}/api/v1/mcp/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: { name: 'bot', roles: ['restricted_agent'], agentId: 'agent-2' },
        request: { method: 'exec_bash', params: {} },
        targetUrl: 'http://localhost:3001',
      }),
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.policy.permitted).toBe(false);
  });

  test('workflow create/list/run lifecycle', async () => {
    const createRes = await fetch(`${base()}/api/v1/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'wf-integration',
        name: 'Integration Workflow',
        description: 'Test',
        version: '1.0.0',
        steps: [{ name: 'step1', action: 'read_file' }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    });
    expect(createRes.status).toBe(200);

    const listRes = await fetch(`${base()}/api/v1/workflows`);
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.success).toBe(true);
    expect(listData.data.some((w: any) => w.id === 'wf-integration')).toBe(true);

    const runRes = await fetch(`${base()}/api/v1/workflows/wf-integration/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { query: 'test' } }),
    });
    expect(runRes.status).toBe(200);
    const runData = await runRes.json();
    expect(runData.data.status).toBe('pending');
    expect(runData.data.steps).toHaveLength(1);
  });

  test('observability endpoint exports spans', async () => {
    await fetch(`${base()}/api/v1/policy/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: { name: 'admin', roles: ['admin'], agentId: 'agent-1' },
        toolName: 'list_tools',
      }),
    });

    const res = await fetch(`${base()}/api/v1/observability/otel`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.resource).toBeDefined();
    expect(data.scopeSpans).toHaveLength(1);
    expect(data.scopeSpans[0].spans.length).toBeGreaterThan(0);
  });
});
