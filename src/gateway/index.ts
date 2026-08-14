import { Hono } from 'hono';
import { PreExecutionPolicyEngine, AgentIdentity, PolicyDecision } from '../sdk/index.js';
import { WorkflowPersistence, WorkflowDefinition, WorkflowRun, WorkflowRunner, BUILTIN_TEMPLATES, WorkflowTemplate, WorkflowScheduler, SchedulerEntry } from '../core/index.js';
import { ObservabilityBridge } from './observability.js';
import { CredentialManager } from './credentials.js';
import { WebSocketGateway } from './websocket-gateway.js';
import fs from 'node:fs';
import {
  requestIdMiddleware,
  securityHeaders,
  rateLimitMiddleware,
  requestLogger,
  RateLimiter,
} from './middleware.js';

export interface GatewayConfig {
  port: number;
  policyEngine: PreExecutionPolicyEngine;
  defaultIdentity?: AgentIdentity;
  wsGateway?: WebSocketGateway;
}

export interface PolicyEvaluationRequest {
  identity: AgentIdentity;
  toolName: string;
  args?: Record<string, unknown>;
}

export interface MCPProxyRequest {
  identity: AgentIdentity;
  request: {
    method: string;
    params?: Record<string, unknown>;
  };
  targetUrl: string;
}

export interface A2ADelegateRequest {
  identity: AgentIdentity;
  agentId: string;
  task: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export class DeepClawGateway {
  private app: Hono;
  private config: GatewayConfig;
  private decisions: PolicyDecision[] = [];
  private auditLogs: Array<Record<string, unknown>> = [];
  private persistence: WorkflowPersistence;
  private observability: ObservabilityBridge;
  private rateLimiter: RateLimiter;
  private credentials: CredentialManager;
  private scheduler: WorkflowScheduler;
  private wsGateway?: WebSocketGateway;

  constructor(config: GatewayConfig) {
    this.config = config;
    this.app = new Hono();
    this.persistence = new WorkflowPersistence(process.env.DEEPCLAW_DB_PATH ?? './deepclaw.db');
    this.observability = new ObservabilityBridge();
    this.rateLimiter = new RateLimiter();
    const credentialDir = process.env.DEEPCLAW_CREDENTIAL_DIR ?? './deepclaw-credentials';
    this.credentials = new CredentialManager(credentialDir);
    this.scheduler = new WorkflowScheduler(this.persistence);
    this.wsGateway = config.wsGateway;
    this._setupMiddleware();
    this._setupRoutes();
  }

  private _setupMiddleware(): void {
    this.app.use('*', requestIdMiddleware as any);
    this.app.use('*', securityHeaders as any);
    this.app.use('*', rateLimitMiddleware(this.rateLimiter) as any);
    this.app.use('*', requestLogger as any);

    this.app.onError((err: unknown, c: any) => {
      const requestId = (c as any).get('requestId');
      console.error(`[${requestId}] Unhandled error:`, err);
      return c.json(
        {
          success: false,
          error: {
            code: -32603,
            message: err instanceof Error ? err.message : 'Internal server error',
            requestId,
          },
        },
        500
      );
    });
  }

  private _jsonError(c: any, code: number, message: string, status: number): Response {
    const requestId = (c as any).get('requestId');
    return c.json({
      success: false,
      error: { code, message, requestId },
    }, status);
  }

  private _recordDecision(decision: PolicyDecision): void {
    this.decisions.push(decision);
    if (this.decisions.length > 1000) {
      this.decisions = this.decisions.slice(-500);
    }
  }

  private _recordAuditLog(entry: Record<string, unknown>): void {
    this.auditLogs.push(entry);
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-500);
    }
  }

  private _setupRoutes(): void {
    this.app.get('/health', (c) => {
      return c.json({
        status: 'ok',
        service: 'deepclaw-gateway',
        version: '2.0.0',
        timestamp: Date.now(),
      });
    });

    this.app.get('/api/v1/policy/decisions', (c) => {
      const limit = Math.min(Number(c.req.query('limit') ?? 100), 500);
      const items = this.decisions.slice(-limit).reverse();
      return c.json({ success: true, data: items, count: items.length });
    });

    this.app.get('/api/v1/audit/logs', (c) => {
      const limit = Math.min(Number(c.req.query('limit') ?? 100), 500);
      const items = this.auditLogs.slice(-limit).reverse();
      return c.json({ success: true, data: items, count: items.length });
    });

    this.app.post('/api/v1/policy/evaluate', async (c) => {
      try {
        const body = await c.req.json<PolicyEvaluationRequest>();
        const identity = new AgentIdentity(body.identity);
        const engine = this.config.policyEngine;
        const decision = engine.evaluateToolCall(identity, body.toolName);
        this._recordDecision(decision);
        this._recordAuditLog({
          eventType: 'POLICY_EVALUATION',
          timestamp: Date.now() / 1000,
          action: body.toolName,
          agentId: identity.agentId,
          permitted: decision.permitted,
          reasoningTrace: decision.reasoningTrace,
          requestId: (c as any).get('requestId'),
        });

        const span = this.observability.startSpan('policy.evaluate', {
          agentId: identity.agentId,
          action: body.toolName,
        });
        this.observability.recordPolicyDecision(
          span,
          body.toolName,
          decision.permitted,
          decision.reasoningTrace,
          identity.agentId
        );
        this.observability.endSpan(span, decision.permitted ? 'OK' : 'ERROR', decision.reasoningTrace);

        return c.json({
          success: true,
          decision,
          timestamp: Date.now(),
        });
      } catch (error) {
        return this._jsonError(c, -32600, 'Invalid request', 400);
      }
    });

    this.app.post('/api/v1/mcp/proxy', async (c) => {
      try {
        const body = await c.req.json<MCPProxyRequest>();
        const identity = new AgentIdentity(body.identity);
        const engine = this.config.policyEngine;
        const decision = engine.evaluateToolCall(identity, body.request.method);

        if (!decision.permitted) {
          this._recordDecision(decision);
          this._recordAuditLog({
            eventType: 'MCP_PROXY_DENIED',
            timestamp: Date.now() / 1000,
            action: body.request.method,
            agentId: identity.agentId,
            permitted: false,
            reasoningTrace: decision.reasoningTrace,
            targetUrl: body.targetUrl,
            requestId: (c as any).get('requestId'),
          });
          return c.json({
            success: false,
            policy: decision,
            error: {
              code: -32601,
              message: `Policy denied: ${decision.reasoningTrace}`,
              requestId: (c as any).get('requestId'),
            },
          }, 403);
        }

        const response = {
          success: true,
          policy: decision,
          proxied: true,
          target: body.targetUrl,
          timestamp: Date.now(),
        };
        this._recordDecision(decision);
        this._recordAuditLog({
          eventType: 'MCP_PROXY_ALLOWED',
          timestamp: Date.now() / 1000,
          action: body.request.method,
          agentId: identity.agentId,
          permitted: true,
          reasoningTrace: decision.reasoningTrace,
          targetUrl: body.targetUrl,
          requestId: (c as any).get('requestId'),
        });
        return c.json(response);
      } catch (error) {
        return this._jsonError(c, -32600, 'Invalid MCP proxy request', 400);
      }
    });

    this.app.post('/api/v1/a2a/delegate', async (c) => {
      try {
        const body = await c.req.json<A2ADelegateRequest>();
        const identity = new AgentIdentity(body.identity);
        const engine = this.config.policyEngine;
        const decision = engine.evaluateToolCall(identity, `a2a:delegate:${body.agentId}`);

        if (!decision.permitted) {
          this._recordDecision(decision);
          this._recordAuditLog({
            eventType: 'A2A_DELEGATION_DENIED',
            timestamp: Date.now() / 1000,
            action: `a2a:delegate:${body.agentId}`,
            agentId: identity.agentId,
            permitted: false,
            reasoningTrace: decision.reasoningTrace,
            requestId: (c as any).get('requestId'),
          });
          return c.json({
            success: false,
            policy: decision,
            error: {
              code: -32601,
              message: `Delegation denied: ${decision.reasoningTrace}`,
              requestId: (c as any).get('requestId'),
            },
          }, 403);
        }

        const response = {
          success: true,
          policy: decision,
          delegation: {
            agentId: body.agentId,
            taskId: `task-${Date.now()}`,
            status: 'dispatched',
          },
          timestamp: Date.now(),
        };
        this._recordDecision(decision);
        this._recordAuditLog({
          eventType: 'A2A_DELEGATION_DISPATCHED',
          timestamp: Date.now() / 1000,
          action: `a2a:delegate:${body.agentId}`,
          agentId: identity.agentId,
          permitted: true,
          reasoningTrace: decision.reasoningTrace,
          targetAgentId: body.agentId,
          requestId: (c as any).get('requestId'),
        });
        return c.json(response);
      } catch (error) {
        return this._jsonError(c, -32600, 'Invalid A2A delegation request', 400);
      }
    });

    this.app.get('/api/v1/status', (c) => {
      return c.json({
        status: 'operational',
        version: '2.0.0',
        nodeVersion: process.version,
        uptime: process.uptime(),
        timestamp: Date.now(),
      });
    });

    this.app.get('/api/v1/budget', (c) => {
      return c.json({
        success: true,
        data: {
          monthlyLimitUSD: 100.0,
          currentSpentUSD: 0.0,
          alertThresholdPercent: 80.0,
          hardCapEnabled: true,
        },
        timestamp: Date.now(),
      });
    });

    this.app.post('/api/v1/workflows', async (c) => {
      try {
        const body = await c.req.json<WorkflowDefinition>();
        this.persistence.saveWorkflow(body);
        return c.json({ success: true, data: body, timestamp: Date.now() });
      } catch {
        return this._jsonError(c, -32600, 'Invalid workflow definition', 400);
      }
    });

    this.app.get('/api/v1/workflows', (c) => {
      const workflows = this.persistence.listWorkflows();
      return c.json({ success: true, data: workflows, count: workflows.length });
    });

    this.app.get('/api/v1/workflows/runs', (c) => {
      const workflowId = c.req.query('workflowId');
      const runs = this.persistence.listRuns(workflowId ?? undefined);
      return c.json({ success: true, data: runs, count: runs.length });
    });

    this.app.get('/api/v1/workflows/runs/:id', (c) => {
      const id = c.req.param('id');
      const run = this.persistence.loadRun(id);
      if (!run) {
        return this._jsonError(c, -32601, 'Run not found', 404);
      }
      return c.json({ success: true, data: run });
    });

    this.app.get('/api/v1/workflows/:id', (c) => {
      const id = c.req.param('id');
      const workflow = this.persistence.loadWorkflow(id);
      if (!workflow) {
        return this._jsonError(c, -32601, 'Workflow not found', 404);
      }
      return c.json({ success: true, data: workflow });
    });

    this.app.post('/api/v1/workflows/:id/runs', async (c) => {
      try {
        const id = c.req.param('id');
        const workflow = this.persistence.loadWorkflow(id);
        if (!workflow) {
          return this._jsonError(c, -32601, 'Workflow not found', 404);
        }
        const body = await c.req.json<{ input?: Record<string, unknown> }>();
        const run: WorkflowRun = {
          id: `run-${Date.now()}`,
          workflowId: workflow.id,
          version: workflow.version,
          status: 'pending',
          input: body.input ?? {},
          steps: workflow.steps.map((step) => ({
            ...step,
            id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            status: 'pending' as const,
          })),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        this.persistence.saveRun(run);
        return c.json({ success: true, data: run, timestamp: Date.now() });
      } catch {
        return this._jsonError(c, -32600, 'Invalid run request', 400);
      }
    });

    this.app.patch('/api/v1/workflows/runs/:runId/steps/:stepId', async (c) => {
      try {
        const { runId, stepId } = c.req.param();
        const body = await c.req.json<Partial<WorkflowRun['steps'][number]>>();
        this.persistence.updateStep(runId, stepId, body);
        const run = this.persistence.loadRun(runId);
        if (!run) {
          return this._jsonError(c, -32601, 'Run not found', 404);
        }
        return c.json({ success: true, data: run });
      } catch {
        return this._jsonError(c, -32600, 'Invalid step update', 400);
      }
    });

    this.app.get('/api/v1/observability/otel', (c) => {
      const otlp = this.observability.exportOtlpJson();
      return c.json(otlp);
    });

    this.app.post('/api/v1/observability/clear', (c) => {
      this.observability.clear();
      return c.json({ success: true, timestamp: Date.now() });
    });

    this.app.get('/api/v1/workflow-templates', (c) => {
      return c.json({ success: true, data: BUILTIN_TEMPLATES, count: BUILTIN_TEMPLATES.length });
    });

    this.app.get('/api/v1/workflow-templates/:id', (c) => {
      const id = c.req.param('id');
      const template = BUILTIN_TEMPLATES.find((t) => t.id === id);
      if (!template) {
        return this._jsonError(c, -32601, 'Template not found', 404);
      }
      return c.json({ success: true, data: template });
    });

    this.app.post('/api/v1/workflow-templates/:id/instantiate', async (c) => {
      try {
        const id = c.req.param('id');
        const template = BUILTIN_TEMPLATES.find((t) => t.id === id);
        if (!template) {
          return this._jsonError(c, -32601, 'Template not found', 404);
        }
        const body = await c.req.json<{ name?: string }>();
        const workflow: WorkflowDefinition = {
          id: `wf-${Date.now()}`,
          name: body.name || template.workflow.name,
          description: template.workflow.description,
          version: template.workflow.version,
          steps: template.workflow.steps,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        this.persistence.saveWorkflow(workflow);
        return c.json({ success: true, data: workflow, timestamp: Date.now() });
      } catch {
        return this._jsonError(c, -32600, 'Invalid instantiate request', 400);
      }
    });

    this.app.get('/api/v1/schedules', (c) => {
      const entries = this.scheduler.listEntries();
      return c.json({ success: true, data: entries, count: entries.length });
    });

    this.app.post('/api/v1/schedules', async (c) => {
      try {
        const body = await c.req.json<{ workflowId: string; cron: string; enabled?: boolean }>();
        const entry = await this.scheduler.schedule({
          workflowId: body.workflowId,
          cron: body.cron,
          enabled: body.enabled ?? true,
        });
        return c.json({ success: true, data: entry, timestamp: Date.now() });
      } catch {
        return this._jsonError(c, -32600, 'Invalid schedule request', 400);
      }
    });

    this.app.delete('/api/v1/schedules/:id', async (c) => {
      const id = c.req.param('id');
      const deleted = await this.scheduler.unschedule(id);
      if (!deleted) {
        return this._jsonError(c, -32601, 'Schedule not found', 404);
      }
      return c.json({ success: true, timestamp: Date.now() });
    });

    this.app.post('/api/v1/workflows/:id/runs', async (c) => {
      try {
        const id = c.req.param('id');
        const workflow = this.persistence.loadWorkflow(id);
        if (!workflow) {
          return this._jsonError(c, -32601, 'Workflow not found', 404);
        }
        const body = await c.req.json<{ input?: Record<string, unknown> }>();
        const run: WorkflowRun = {
          id: `run-${Date.now()}`,
          workflowId: workflow.id,
          version: workflow.version,
          status: 'pending',
          input: body.input ?? {},
          steps: workflow.steps.map((step) => ({
            ...step,
            id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            status: 'pending' as const,
            maxRetries: step.maxRetries ?? 2,
            retryDelayMs: step.retryDelayMs ?? 1000,
            continueOnError: step.continueOnError ?? false,
          })),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        this.persistence.saveRun(run);

        const runner = new WorkflowRunner(this.persistence, {
          onStepUpdate: (runId, step, output) => {
            this.wsGateway?.broadcastRunUpdate({
              type: 'run_update',
              runId,
              status: 'running',
              step,
              output,
            });
          },
        });
        runner.execute(run.id).catch(() => {});

        return c.json({ success: true, data: run, timestamp: Date.now() });
      } catch {
        return this._jsonError(c, -32600, 'Invalid run request', 400);
      }
    });

    this.app.get('/api/v1/workflow-runners/:id/execute', async (c) => {
      const id = c.req.param('id');
      const run = this.persistence.loadRun(id);
      if (!run) {
        return this._jsonError(c, -32601, 'Run not found', 404);
      }

      const runner = new WorkflowRunner(this.persistence);
      runner.execute(id).catch(() => {});

      return c.json({ success: true, message: 'Execution started', runId: id, timestamp: Date.now() });
    });

    this.app.get('/api/v1/credentials', (c) => {
      const items = this.credentials.list();
      return c.json({ success: true, data: items, count: items.length });
    });

    this.app.post('/api/v1/credentials', async (c) => {
      try {
        const body = await c.req.json<{ name: string; type: string; data: Record<string, string> }>();
        const credential = this.credentials.create(body.name, body.type as any, body.data);
        return c.json({ success: true, data: credential, timestamp: Date.now() });
      } catch {
        return this._jsonError(c, -32600, 'Invalid credential payload', 400);
      }
    });

    this.app.get('/api/v1/credentials/:id', (c) => {
      const id = c.req.param('id');
      const credential = this.credentials.get(id);
      if (!credential) {
        return this._jsonError(c, -32601, 'Credential not found', 404);
      }
      return c.json({ success: true, data: credential });
    });

    this.app.delete('/api/v1/credentials/:id', (c) => {
      const id = c.req.param('id');
      const deleted = this.credentials.delete(id);
      if (!deleted) {
        return this._jsonError(c, -32601, 'Credential not found', 404);
      }
      return c.json({ success: true, timestamp: Date.now() });
    });

    this.app.get('/api/v1/workflows/export/:id', (c) => {
      const id = c.req.param('id');
      const workflow = this.persistence.loadWorkflow(id);
      if (!workflow) {
        return this._jsonError(c, -32601, 'Workflow not found', 404);
      }
      const runs = this.persistence.listRuns(id);
      const exportData = {
        workflow,
        runs,
        exportedAt: Date.now(),
        version: '2.0.0',
      };
      c.header('Content-Type', 'application/json');
      c.header('Content-Disposition', `attachment; filename="${id}.json"`);
      return c.json(exportData);
    });

    this.app.get('/api/v1/approvals/pending', (c) => {
      const allRuns = this.persistence.listAllRuns();
      const pending: Array<{ runId: string; workflowId: string; step: WorkflowRun['steps'][number] }> = [];
      for (const run of allRuns) {
        if (run.status === 'waiting_approval' || run.steps.some((s) => s.status === 'waiting_approval')) {
          for (const step of run.steps) {
            if (step.status === 'waiting_approval') {
              pending.push({
                runId: run.id,
                workflowId: run.workflowId,
                step,
              });
            }
          }
        }
      }
      return c.json({ success: true, count: pending.length, data: pending, timestamp: Date.now() });
    });

    this.app.post('/api/v1/approvals/:runId/:stepId/resolve', async (c) => {
      try {
        const { runId, stepId } = c.req.param();
        const body = await c.req.json<{
          approved: boolean;
          approver?: string;
          reason?: string;
        }>();

        if (typeof body.approved !== 'boolean') {
          return this._jsonError(c, -32600, 'approved (boolean) is required in payload', 400);
        }

        const runner = new WorkflowRunner(this.persistence);
        const decision = {
          approved: body.approved,
          approver: body.approver || 'system_admin',
          reason: body.reason,
          timestamp: Date.now(),
        };

        const updatedRun = await runner.resolveApproval(runId, stepId, decision);

        this.auditLogs.push({
          type: 'approval_decision',
          runId,
          stepId,
          decision,
          timestamp: Date.now(),
        });

        if (this.wsGateway) {
          const resolvedStep = updatedRun.steps.find((s) => s.id === stepId);
          this.wsGateway.broadcastRunUpdate({
            type: 'run_update',
            runId,
            status: updatedRun.status,
            step: resolvedStep,
          });
        }

        return c.json({ success: true, data: updatedRun, timestamp: Date.now() });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return this._jsonError(c, -32602, message, 400);
      }
    });

    this.app.post('/api/v1/workflows/import', async (c) => {
      try {
        const body = await c.req.json<{ workflow: WorkflowDefinition; runs?: WorkflowRun[] }>();
        if (!body.workflow) {
          return this._jsonError(c, -32600, 'Missing workflow in import payload', 400);
        }
        const imported = body.workflow;
        this.persistence.saveWorkflow(imported);
        if (body.runs) {
          for (const run of body.runs) {
            this.persistence.saveRun(run);
          }
        }
        return c.json({ success: true, data: imported, timestamp: Date.now() });
      } catch {
        return this._jsonError(c, -32600, 'Invalid import payload', 400);
      }
    });
  }

  listen(port?: number): void {
    const actualPort = port ?? this.config.port;

    if (typeof (globalThis as any).Bun !== 'undefined') {
      (globalThis as any).Bun.serve({
        port: actualPort,
        fetch: (request: Request) => this.app.fetch(request),
      });
    } else {
      (globalThis as any).__deepclaw_hono_app = this.app;
      (globalThis as any).__deepclaw_port = actualPort;
    }
  }

  getApp(): Hono {
    return this.app;
  }
}

