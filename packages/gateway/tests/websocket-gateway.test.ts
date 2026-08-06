import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { WebSocketGateway } from '../src/websocket-gateway';
import { PreExecutionPolicyEngine, AgentIdentity } from '@svgph/sdk';

describe('WebSocketGateway', () => {
  let gateway: WebSocketGateway;
  let policyEngine: PreExecutionPolicyEngine;
  let port: number;

  beforeAll(() => {
    policyEngine = new PreExecutionPolicyEngine();
    port = 3103;
    gateway = new WebSocketGateway({ port, policyEngine });
  });

  afterAll(() => {
    gateway.close();
  });

  test('accepts WebSocket connections', async () => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    const message = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 2000);
      ws.onopen = () => {};
      ws.onmessage = (event) => {
        clearTimeout(timeout);
        try {
          resolve(JSON.parse(event.data));
        } catch (e) {
          reject(e);
        }
      };
      ws.onerror = (err) => { clearTimeout(timeout); reject(err); };
    });
    expect(message.type).toBe('event');
    expect(message.payload.type).toBe('connection_established');
    ws.close();
  });

  test('handles policy evaluation over WebSocket', async () => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 2000);
      ws.onopen = () => { clearTimeout(timeout); resolve(); };
      ws.onerror = (err) => { clearTimeout(timeout); reject(err); };
    });

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 500);
      ws.onmessage = () => { clearTimeout(timeout); resolve(); };
    });

    const requestMessage = {
      id: 'test-1',
      type: 'request',
      timestamp: Date.now(),
      source: 'test-client',
      payload: {
        action: 'read_file',
        identity: { name: 'admin', roles: ['admin'] },
      },
    };

    ws.send(JSON.stringify(requestMessage));

    const response = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 2000);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'response') {
            clearTimeout(timeout);
            resolve(data);
          }
        } catch (e) {
          clearTimeout(timeout);
          reject(e);
        }
      };
    });

    expect(response.type).toBe('response');
    expect(response.payload.success).toBe(true);
    expect(response.payload.decision.permitted).toBe(true);
    ws.close();
  });

  test('broadcasts messages to all clients', async () => {
    const ws1 = new WebSocket(`ws://localhost:${port}`);
    const ws2 = new WebSocket(`ws://localhost:${port}`);

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout')), 2000);
        ws1.onopen = () => { clearTimeout(timeout); resolve(); };
        ws1.onerror = (err) => { clearTimeout(timeout); reject(err); };
      }),
      new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout')), 2000);
        ws2.onopen = () => { clearTimeout(timeout); resolve(); };
        ws2.onerror = (err) => { clearTimeout(timeout); reject(err); };
      }),
    ]);

    await Promise.all([
      new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 500);
        ws1.onmessage = () => { clearTimeout(timeout); resolve(); };
      }),
      new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 500);
        ws2.onmessage = () => { clearTimeout(timeout); resolve(); };
      }),
    ]);

    const broadcastMessage = {
      id: 'broadcast-1',
      type: 'event',
      timestamp: Date.now(),
      source: 'gateway',
      payload: { type: 'test_broadcast', message: 'Hello all' },
    };

    gateway.broadcast(broadcastMessage);

    const [msg1, msg2] = await Promise.all([
      new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout')), 2000);
        ws1.onmessage = (event) => {
          clearTimeout(timeout);
          resolve(JSON.parse(event.data));
        };
      }),
      new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout')), 2000);
        ws2.onmessage = (event) => {
          clearTimeout(timeout);
          resolve(JSON.parse(event.data));
        };
      }),
    ]);

    expect(msg1.payload.message).toBe('Hello all');
    expect(msg2.payload.message).toBe('Hello all');
    ws1.close();
    ws2.close();
  });

  test('broadcasts run updates to subscribers', async () => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 2000);
      ws.onopen = () => { clearTimeout(timeout); resolve(); };
      ws.onerror = (err) => { clearTimeout(timeout); reject(err); };
    });

    const subscriptionMessage = {
      id: 'sub-1',
      type: 'request',
      timestamp: Date.now(),
      source: 'test-client',
      payload: { action: 'subscribe_run', runId: 'run-123', identity: { name: 'admin', roles: ['admin'] } },
    };
    ws.send(JSON.stringify(subscriptionMessage));

    const subResponse = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 2000);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'response') { clearTimeout(timeout); resolve(data); }
        } catch (e) { clearTimeout(timeout); reject(e); }
      };
    });
    expect(subResponse.payload.subscribed).toBe(true);

    gateway.broadcastRunUpdate({
      type: 'run_update',
      runId: 'run-123',
      status: 'running',
      step: { id: 'step-1', name: 'Step 1', action: 'test', status: 'running' } as any,
      output: { result: 'ok' },
    });

    const update = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 2000);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'event' && data.payload?.type === 'run_update') {
            clearTimeout(timeout);
            resolve(data);
          }
        } catch (e) { clearTimeout(timeout); reject(e); }
      };
    });

    expect(update.payload.runId).toBe('run-123');
    expect(update.payload.step.name).toBe('Step 1');
    ws.close();
  });
});
