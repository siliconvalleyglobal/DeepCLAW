import vm from 'node:vm';
import { WorkflowPersistence } from './persistence.js';
import type { WorkflowDefinition, WorkflowRun, WorkflowStep } from './workflow.js';
import { ExpressionEngine, ExpressionContext } from './expression.js';

export interface WorkflowRunnerOptions {
  maxConcurrency?: number;
  defaultRetryDelayMs?: number;
  codeExecutionTimeoutMs?: number;
  codeMaxResultSizeBytes?: number;
  codeMaxOutputDepth?: number;
  expressionEngine?: ExpressionEngine;
  onStepUpdate?: (runId: string, step: WorkflowStep, output?: Record<string, unknown>) => void;
}

export interface StepResult {
  stepId: string;
  status: 'completed' | 'failed' | 'skipped' | 'waiting_approval';
  output?: Record<string, unknown>;
  error?: string;
  approvalRequest?: ApprovalRequest;
}

export class WorkflowRunner {
  private persistence: WorkflowPersistence;
  private options: WorkflowRunnerOptions;
  private expressionEngine: ExpressionEngine;
  private running = new Set<string>();

  constructor(persistence: WorkflowPersistence, options: WorkflowRunnerOptions = {}) {
    this.persistence = persistence;
    this.options = {
      maxConcurrency: options.maxConcurrency ?? 5,
      defaultRetryDelayMs: options.defaultRetryDelayMs ?? 1000,
      codeExecutionTimeoutMs: options.codeExecutionTimeoutMs ?? 5000,
      codeMaxResultSizeBytes: options.codeMaxResultSizeBytes ?? 1024 * 1024,
      codeMaxOutputDepth: options.codeMaxOutputDepth ?? 10,
      onStepUpdate: options.onStepUpdate,
    };
    this.expressionEngine = options.expressionEngine ?? new ExpressionEngine();
  }

  async execute(runId: string): Promise<WorkflowRun> {
    if (this.running.has(runId)) {
      throw new Error(`Run ${runId} is already executing`);
    }

    const run = this.persistence.loadRun(runId);
    if (!run) throw new Error(`Run ${runId} not found`);

    const workflow = this.persistence.loadWorkflow(run.workflowId);
    if (!workflow) throw new Error(`Workflow ${run.workflowId} not found`);

    this.running.add(runId);
    let updated: WorkflowRun = { ...run, status: 'running', updatedAt: Date.now() };
    this.persistence.saveRun(updated);

    try {
      const results = new Map<string, StepResult>();
      const context: ExpressionContext = { input: run.input, steps: results, workflow };

      // Pre-fill previously completed step results if resuming
      for (const s of run.steps) {
        if (s.status === 'completed' && s.output) {
          results.set(s.id, { stepId: s.id, status: 'completed', output: s.output });
          context[`step_${s.id}`] = s.output;
        }
      }

      for (const step of workflow.steps) {
        const runStep = run.steps.find((s) => s.action === step.action && s.name === step.name);
        if (!runStep) continue;

        // Skip steps already completed
        if (runStep.status === 'completed') {
          continue;
        }

        const result = await this.executeStep(runStep, workflow, context, run);
        results.set(runStep.id, result);
        this.options.onStepUpdate?.(runId, runStep, result.output);

        if (result.status === 'waiting_approval') {
          updated.status = 'waiting_approval';
          updated.updatedAt = Date.now();
          this.persistence.saveRun(updated);
          return updated;
        }

        if (result.status === 'failed' && !runStep.continueOnError) {
          updated.status = 'failed';
          updated.finishedAt = Date.now();
          break;
        }
      }

      if (updated.status !== 'failed' && updated.status !== 'waiting_approval') {
        updated.status = 'completed';
        updated.finishedAt = Date.now();
        updated.output = this.buildOutput(results);
      }

      const latest = this.persistence.loadRun(runId);
      if (latest) {
        this.persistence.saveRun(latest);
      } else {
        this.persistence.saveRun(updated);
      }
      return latest ?? updated;
    } finally {
      this.running.delete(runId);
    }
  }

  async resolveApproval(
    runId: string,
    stepId: string,
    decision: ApprovalDecision
  ): Promise<WorkflowRun> {
    const run = this.persistence.loadRun(runId);
    if (!run) throw new Error(`Run ${runId} not found`);

    const stepIndex = run.steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) throw new Error(`Step ${stepId} not found in run ${runId}`);

    const step = run.steps[stepIndex];
    if (step.status !== 'waiting_approval') {
      throw new Error(`Step ${stepId} is not waiting for approval (current status: ${step.status})`);
    }

    const approvalRequest: ApprovalRequest = {
      ...(step.approvalRequest ?? {
        stepId,
        runId,
        action: step.action,
        requestedAt: step.startedAt ?? Date.now(),
      }),
      decision,
    };

    if (!decision.approved) {
      this.persistence.updateStep(runId, stepId, {
        status: 'failed',
        error: `Approval rejected by ${decision.approver}${decision.reason ? ': ' + decision.reason : ''}`,
        finishedAt: Date.now(),
        approvalRequest,
      });

      const updatedRun: WorkflowRun = {
        ...run,
        status: 'failed',
        finishedAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.persistence.saveRun(updatedRun);
      return updatedRun;
    }

    // Approved: Mark step as approved and resume execution
    this.persistence.updateStep(runId, stepId, {
      status: 'running',
      approvalRequest,
    });

    const reloadedRun = this.persistence.loadRun(runId);
    if (reloadedRun) {
      reloadedRun.status = 'running';
      this.persistence.saveRun(reloadedRun);
    }

    return this.execute(runId);
  }

  async executeStep(step: WorkflowStep, workflow: WorkflowDefinition, context: ExpressionContext, run: WorkflowRun): Promise<StepResult> {
    // Check if step requires approval and hasn't been approved yet
    const requiresApproval = step.approval !== undefined || step.action.startsWith('approval:') || step.action.startsWith('hitl:');
    const isApproved = step.approvalRequest?.decision?.approved === true;

    if (requiresApproval && !isApproved) {
      const requestedAt = Date.now();
      const message = step.approval?.message ?? (step.input?.message as string) ?? `Approval required for step ${step.name}`;
      const timeoutMs = step.approval?.timeoutMs;
      const timeoutAt = timeoutMs ? requestedAt + timeoutMs : undefined;
      const requiredRoles = step.approval?.roles;

      const approvalRequest: ApprovalRequest = {
        stepId: step.id,
        runId: run.id,
        action: step.action,
        message,
        requestedAt,
        timeoutAt,
        requiredRoles,
      };

      this.persistence.updateStep(run.id, step.id, {
        status: 'waiting_approval',
        startedAt: requestedAt,
        approvalRequest,
      });

      return {
        stepId: step.id,
        status: 'waiting_approval',
        approvalRequest,
      };
    }

    const maxRetries = step.maxRetries ?? 0;
    let attempt = 0;

    while (attempt <= maxRetries) {
      attempt++;
      const startedAt = Date.now();
      this.persistence.updateStep(run.id, step.id, { status: 'running', startedAt });

      try {
        const resolvedInput = this.resolveInput(step.input ?? {}, context);

        if (step.action.startsWith('if:')) {
          const condition = step.action.slice('if:'.length);
          const evaluated = this.expressionEngine.evaluateBoolean(condition, context);
          const output = { branch: evaluated.success && evaluated.value ? 'true' : 'false', condition };
          this.persistence.updateStep(run.id, step.id, { status: 'completed', output, finishedAt: Date.now() });
          return { stepId: step.id, status: 'completed', output };
        }

        if (step.action.startsWith('loop:')) {
          const items = resolvedInput.items as unknown[] ?? [];
          const results: Record<string, unknown>[] = [];
          for (let i = 0; i < items.length; i++) {
            const itemContext = { ...context, item: items[i], index: i };
            const itemResult = await this.invokeAction('transform.json', { value: items[i] }, itemContext);
            results.push(itemResult);
          }
          const output = { loopResults: results, count: results.length };
          this.persistence.updateStep(run.id, step.id, { status: 'completed', output, finishedAt: Date.now() });
          return { stepId: step.id, status: 'completed', output };
        }

        if (step.action.startsWith('wait:')) {
          const delayMs = Number(resolvedInput.delayMs ?? step.action.slice('wait:'.length));
          await this.sleep(delayMs);
          const output = { waitedMs: delayMs };
          this.persistence.updateStep(run.id, step.id, { status: 'completed', output, finishedAt: Date.now() });
          return { stepId: step.id, status: 'completed', output };
        }

        if (step.action.startsWith('code:')) {
          const code = resolvedInput.code as string ?? '';
          const language = resolvedInput.language as string ?? 'javascript';
          const output = await this.executeCode(code, language, run.input);
          this.persistence.updateStep(run.id, step.id, { status: 'completed', output, finishedAt: Date.now() });
          return { stepId: step.id, status: 'completed', output };
        }

        const output = await this.invokeAction(step.action, resolvedInput, context);

        this.persistence.updateStep(run.id, step.id, {
          status: 'completed',
          output,
          finishedAt: Date.now(),
        });

        context[`step_${step.id}`] = output;
        return { stepId: step.id, status: 'completed', output };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (attempt <= maxRetries) {
          const delay = (step.retryDelayMs ?? this.options.defaultRetryDelayMs) ?? 0;
          await this.sleep(delay);
          this.persistence.updateStep(run.id, step.id, { retries: attempt });
          continue;
        }

        this.persistence.updateStep(run.id, step.id, {
          status: 'failed',
          error: errorMessage,
          finishedAt: Date.now(),
        });

        return { stepId: step.id, status: 'failed', error: errorMessage };
      }
    }

    return { stepId: step.id, status: 'failed', error: 'Max retries exceeded' };
  }

  private resolveInput(input: Record<string, unknown>, context: ExpressionContext): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string' && value.includes('{{')) {
        const result = this.expressionEngine.evaluate(value, context);
        resolved[key] = result.success ? result.value : value;
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveInput(value as Record<string, unknown>, context);
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }

  private async executeCode(code: string, language: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (language === 'javascript') {
      return this.executeCodeFallback(code, input);
    }

    if (language === 'python') {
      return { simulated: true, language, note: 'Python execution requires external runtime' };
    }

    throw new Error(`Unsupported code language: ${language}`);
  }

  private async executeCodeFallback(code: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const sandbox = this.createSafeSandbox(input);
    const startTime = Date.now();
    let result: unknown;
    try {
      result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Code execution timed out after ${this.options.codeExecutionTimeoutMs}ms`));
        }, this.options.codeExecutionTimeoutMs);

        try {
          const wrappedCode = `(async () => { ${code} })()`;
          const ctx = vm.createContext(sandbox);
          vm.runInContext(wrappedCode, ctx, { 
            timeout: this.options.codeExecutionTimeoutMs,
            displayErrors: true,
          }          ).then(resolve).catch((err: unknown) => {
            clearTimeout(timeout);
            reject(err);
          });
        } catch (err) {
          clearTimeout(timeout);
          reject(err);
        }
      });
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : String(err),
        executionTimeMs: Date.now() - startTime,
        language: 'javascript',
      };
    }

    const executionTimeMs = Date.now() - startTime;
    const sizeCheck = this.checkResultSize(result);
    if (!sizeCheck.valid) {
      return {
        error: `Result exceeds maximum size limit: ${sizeCheck.bytes} bytes (max ${this.options.codeMaxResultSizeBytes} bytes)`,
        executionTimeMs,
        language: 'javascript',
      };
    }

    const depthCheck = this.checkResultDepth(result, 0);
    if (!depthCheck.valid) {
      return {
        error: `Result exceeds maximum depth limit: ${depthCheck.depth} (max ${this.options.codeMaxOutputDepth})`,
        executionTimeMs,
        language: 'javascript',
      };
    }

    return { result, executionTimeMs, language: 'javascript' };
  }

  private createSafeSandbox(input: Record<string, unknown>): Record<string, unknown> {
    const safeConsole = {
      log: (...args: unknown[]) => console.log('[sandbox]', ...args),
      warn: (...args: unknown[]) => console.warn('[sandbox]', ...args),
      error: (...args: unknown[]) => console.error('[sandbox]', ...args),
    };

    const safeUtils: Record<string, unknown> = {
      input,
      console: safeConsole,
      Math,
      JSON,
      Date,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Error,
      Promise,
      Set,
      Map,
      Symbol,
      Reflect,
      Proxy,
    };

    return safeUtils;
  }

  private checkResultSize(value: unknown): { valid: boolean; bytes: number } {
    try {
      const json = JSON.stringify(value);
      const bytes = Buffer.byteLength(json, 'utf8');
      return { valid: bytes <= this.options.codeMaxResultSizeBytes!, bytes };
    } catch {
      return { valid: false, bytes: 0 };
    }
  }

  private checkResultDepth(value: unknown, depth: number): { valid: boolean; depth: number } {
    if (depth > (this.options.codeMaxOutputDepth ?? 10)) {
      return { valid: false, depth };
    }

    if (Array.isArray(value)) {
      let maxChildDepth = depth;
      for (const item of value) {
        const childCheck = this.checkResultDepth(item, depth + 1);
        if (!childCheck.valid) return childCheck;
        maxChildDepth = Math.max(maxChildDepth, childCheck.depth);
      }
      return { valid: true, depth: maxChildDepth };
    }

    if (value !== null && typeof value === 'object') {
      let maxChildDepth = depth;
      for (const [, v] of Object.entries(value as Record<string, unknown>)) {
        const childCheck = this.checkResultDepth(v, depth + 1);
        if (!childCheck.valid) return childCheck;
        maxChildDepth = Math.max(maxChildDepth, childCheck.depth);
      }
      return { valid: true, depth: maxChildDepth };
    }

    return { valid: true, depth };
  }

  private async invokeAction(action: string, input: Record<string, unknown>, context: ExpressionContext): Promise<Record<string, unknown>> {
    if (action.startsWith('subworkflow:')) {
      const subWorkflowId = action.slice('subworkflow:'.length);
      return this.invokeSubWorkflow(subWorkflowId, input);
    }

    if (action.startsWith('http.')) {
      const url = input.url as string;
      const response = await fetch(url, {
        method: (input.method as string) ?? 'GET',
        headers: input.headers as Record<string, string>,
        body: input.body ? JSON.stringify(input.body) : undefined,
      });
      const body = await response.text();
      return { status: response.status, body, ok: response.ok };
    }

    if (action.startsWith('transform.')) {
      const transformType = action.slice('transform.'.length);
      if (transformType === 'json') {
        return { transformed: JSON.stringify(input, null, 2) };
      }
      if (transformType === 'uppercase' && typeof input.text === 'string') {
        return { transformed: input.text.toUpperCase() };
      }
      return { transformed: input };
    }

    if (action.startsWith('channel.')) {
      return { sent: true, channel: action, input };
    }

    if (action.startsWith('llm.')) {
      return { generated: `Simulated LLM response for ${action}`, input };
    }

    if (action.startsWith('policy.')) {
      return { permitted: true, action, input };
    }

    if (action.startsWith('governance.')) {
      return { governed: true, action, input };
    }

    if (action.startsWith('audit.')) {
      return { audited: true, action, input };
    }

    if (action.startsWith('compliance.')) {
      return { compliance: true, action, input };
    }

    if (action.startsWith('mcp.')) {
      return { mcp: true, action, input };
    }

    if (action.startsWith('webhook.')) {
      return { webhook: true, action, input };
    }

    if (action.startsWith('email.')) {
      return { sent: true, action, input };
    }

    if (action.startsWith('slack.')) {
      return { sent: true, action, input };
    }

    if (action.startsWith('telegram.')) {
      return { sent: true, action, input };
    }

    if (action.startsWith('human.')) {
      return { pending_human_approval: true, action, input };
    }

    if (action.startsWith('throw.')) {
      const message = (input.message as string) ?? 'Simulated failure';
      throw new Error(message);
    }

    return { executed: true, action, input };
  }

  private async invokeSubWorkflow(workflowId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const workflow = this.persistence.loadWorkflow(workflowId);
    if (!workflow) {
      return { error: `Sub-workflow ${workflowId} not found` };
    }

    const subRun: WorkflowRun = {
      id: `run-${Date.now()}`,
      workflowId,
      version: workflow.version,
      status: 'pending',
      input,
      steps: workflow.steps.map((step) => ({
        ...step,
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: 'pending' as const,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.persistence.saveRun(subRun);
    const executed = await this.execute(subRun.id);
    return { subRunId: executed.id, status: executed.status, output: executed.output };
  }

  private buildOutput(results: Map<string, StepResult>): Record<string, unknown> {
    const output: Record<string, unknown> = {};
    for (const [stepId, result] of results) {
      output[stepId] = result;
    }
    return output;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
