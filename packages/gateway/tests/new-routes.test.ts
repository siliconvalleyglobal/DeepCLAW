import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import { DeepClawGateway } from '../src/index';
import { PreExecutionPolicyEngine } from '@svgph/sdk';

describe('Gateway new routes', () => {
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
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks).toString();
      const url = `http://localhost:${port}${req.url}`;
      const requestInit: RequestInit = { method: req.method, headers: req.headers as Record<string, string> };
      if (req.method !== 'GET' && req.method !== 'HEAD' && body) requestInit.body = body;
      const response = await app.fetch(new Request(url, requestInit));
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(await response.text());
    });

    await new Promise<void>((resolve) => {
      server.listen(port, () => { port = (server.address() as any).port; resolve(); });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => { server.close(resolve); });
  });

  const base = () => `http://localhost:${port}`;

  describe('credentials', () => {
    test('creates credential', async () => {
      const res = await fetch(`${base()}/api/v1/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test-key', type: 'api_key', data: { key: 'secret' } }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('test-key');
    });

    test('lists credentials', async () => {
      const res = await fetch(`${base()}/api/v1/credentials`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(1);
    });

    test('deletes credential', async () => {
      const listRes = await fetch(`${base()}/api/v1/credentials`);
      const listData = await listRes.json();
      const id = listData.data[0].id;
      const res = await fetch(`${base()}/api/v1/credentials/${id}`, { method: 'DELETE' });
      expect(res.status).toBe(200);
    });
  });

  describe('templates', () => {
    test('lists templates', async () => {
      const res = await fetch(`${base()}/api/v1/workflow-templates`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(4);
    });

    test('instantiates template', async () => {
      const listRes = await fetch(`${base()}/api/v1/workflow-templates`);
      const listData = await listRes.json();
      const templateId = listData.data[0].id;
      const res = await fetch(`${base()}/api/v1/workflow-templates/${templateId}/instantiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Instantiated Workflow' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Instantiated Workflow');
    });
  });

  describe('schedules', () => {
    test('creates schedule', async () => {
      const res = await fetch(`${base()}/api/v1/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: 'wf-sched-test', cron: '0 * * * *', enabled: true }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.cron).toBe('0 * * * *');
    });

    test('lists schedules', async () => {
      const res = await fetch(`${base()}/api/v1/schedules`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe('import/export', () => {
    test('exports workflow', async () => {
      const createRes = await fetch(`${base()}/api/v1/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'wf-export-test',
          name: 'Export Test',
          description: 'Test',
          version: '1.0.0',
          steps: [{ name: 'step1', action: 'transform.json' }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
      });
      expect(createRes.status).toBe(200);

      const res = await fetch(`${base()}/api/v1/workflows/export/wf-export-test`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.workflow.name).toBe('Export Test');
    });

    test('imports workflow', async () => {
      const res = await fetch(`${base()}/api/v1/workflows/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: {
            id: 'wf-import-test',
            name: 'Import Test',
            description: 'Test',
            version: '1.0.0',
            steps: [{ name: 'step1', action: 'transform.json' }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Import Test');
    });
  });
});
