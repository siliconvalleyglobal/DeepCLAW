import { WebSocketServer, WebSocket } from 'ws';
import { PreExecutionPolicyEngine, AgentIdentity, PolicyDecision } from '../sdk/index.js';
import type { WorkflowRun, WorkflowStep } from '../core/index.js';

export interface WebSocketGatewayConfig {
  port: number;
  policyEngine: PreExecutionPolicyEngine;
}

export interface GatewayMessage {
  id: string;
  type: 'request' | 'response' | 'event' | 'error';
  timestamp: number;
  source: string;
  target?: string;
  payload: unknown;
  metadata: Record<string, unknown>;
}

export interface RunUpdateMessage {
  type: 'run_update';
  runId: string;
  status: string;
  step?: WorkflowStep;
  output?: Record<string, unknown>;
}

export class WebSocketGateway {
  private wss: WebSocketServer;
  private config: WebSocketGatewayConfig;
  private clients: Set<WebSocket> = new Set();
  private runSubscriptions: Map<string, Set<WebSocket>> = new Map();

  constructor(config: WebSocketGatewayConfig) {
    this.config = config;
    this.wss = new WebSocketServer({ port: config.port });
    this._setupHandlers();
  }

  private _setupHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      this.clients.add(ws);
      const source = req.headers['x-source'] as string || 'unknown';
      ws.send(JSON.stringify(this._createMessage('event', source, {
        type: 'connection_established',
        message: 'Connected to DeepCLAW WebSocket Gateway',
      })));

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as GatewayMessage;
          const response = await this._handleMessage(message, source, ws);
          ws.send(JSON.stringify(response));
        } catch (error) {
          ws.send(JSON.stringify(this._createMessage('error', source, {
            code: -32600,
            message: 'Invalid message format',
          })));
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        for (const [runId, subscribers] of this.runSubscriptions.entries()) {
          subscribers.delete(ws);
          if (subscribers.size === 0) {
            this.runSubscriptions.delete(runId);
          }
        }
      });
    });
  }

  private async _handleMessage(message: GatewayMessage, source: string, ws: WebSocket): Promise<GatewayMessage> {
    const { type, payload } = message;

    if (type === 'request') {
      const request = payload as { action?: string; identity?: Partial<AgentIdentity>; runId?: string };
      if (!request.action || !request.identity) {
        return this._createMessage('error', source, {
          code: -32600,
          message: 'Missing action or identity in request',
        });
      }

      if (request.action === 'subscribe_run' && request.runId) {
        const runId = request.runId;
        if (!this.runSubscriptions.has(runId)) {
          this.runSubscriptions.set(runId, new Set());
        }
        this.runSubscriptions.get(runId)!.add(ws);

        return this._createMessage('response', source, {
          success: true,
          subscribed: true,
          runId,
          timestamp: Date.now(),
        });
      }

      const identity = new AgentIdentity({
        name: request.identity.name || 'unknown',
        roles: request.identity.roles || ['restricted_agent'],
        channelOrigin: request.identity.channelOrigin || null,
        permissionCeiling: request.identity.permissionCeiling || 'restricted',
      });

      const decision = this.config.policyEngine.evaluateToolCall(identity, request.action);

      return this._createMessage('response', source, {
        success: true,
        decision,
        timestamp: Date.now(),
      });
    }

    return this._createMessage('error', source, {
      code: -32601,
      message: `Unknown message type: ${type}`,
    });
  }

  broadcastRunUpdate(update: RunUpdateMessage): void {
    const subscribers = this.runSubscriptions.get(update.runId);
    if (!subscribers || subscribers.size === 0) return;

    const message = this._createMessage('event', 'workflow-runner', update);
    const data = JSON.stringify(message);

    subscribers.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private _createMessage(
    type: GatewayMessage['type'],
    source: string,
    payload: unknown,
    target?: string
  ): GatewayMessage {
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      timestamp: Date.now(),
      source,
      target,
      payload,
      metadata: {},
    };
  }

  broadcast(message: GatewayMessage): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  getPort(): number {
    return this.wss.options.port as number;
  }

  close(): void {
    this.wss.close();
  }
}
