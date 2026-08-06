import { createServer } from 'node:http';
import { Hono } from 'hono';
import { PreExecutionPolicyEngine, AgentIdentity } from '@svgph/sdk';
import { DeepClawGateway } from './index';
import { WebSocketGateway } from './websocket-gateway';

export interface ServerConfig {
  httpPort: number;
  wsPort: number;
  policyEngine: PreExecutionPolicyEngine;
}

export class DeepClawServer {
  private httpPort: number;
  private wsPort: number;
  private policyEngine: PreExecutionPolicyEngine;
  private httpServer: ReturnType<typeof createServer> | null = null;
  private wsGateway: WebSocketGateway | null = null;
  private gateway: DeepClawGateway;

  constructor(config: ServerConfig) {
    this.httpPort = config.httpPort;
    this.wsPort = config.wsPort;
    this.policyEngine = config.policyEngine;
  }

  start(): void {
    this.httpServer = createServer(async (req, res) => {
      try {
        const protocol = 'http';
        const host = req.headers.host || `localhost:${this.httpPort}`;
        const requestUrl = `${protocol}://${host}${req.url}`;
        const headers = new Headers(req.headers as HeadersInit);
        headers.set('x-forwarded-for', req.socket.remoteAddress || '127.0.0.1');
        const request = new Request(requestUrl, {
          method: req.method,
          headers,
        });
        const response = await this.gateway.getApp().fetch(request);
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        const body = await response.text();
        res.end(body);
      } catch (err) {
        console.error('Request error:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    this.httpServer.listen(this.httpPort, () => {
      console.log(`[DeepCLAW] HTTP server listening on port ${this.httpPort}`);
    });

    this.wsGateway = new WebSocketGateway({ port: this.wsPort, policyEngine: this.policyEngine });
    console.log(`[DeepCLAW] WebSocket gateway listening on port ${this.wsPort}`);

    this.gateway = new DeepClawGateway({
      port: config.httpPort,
      policyEngine: config.policyEngine,
      wsGateway: this.wsGateway,
    });

    process.on('SIGINT', () => this._gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this._gracefulShutdown('SIGTERM'));
  }

  private async _gracefulShutdown(signal: string): Promise<void> {
    console.log(`[DeepCLAW] Received ${signal}, shutting down gracefully...`);
    await this.stop();
    console.log('[DeepCLAW] Shutdown complete');
    process.exit(0);
  }

  async stop(): Promise<void> {
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
    }
    if (this.wsGateway) {
      this.wsGateway.close();
      this.wsGateway = null;
    }
  }
}
