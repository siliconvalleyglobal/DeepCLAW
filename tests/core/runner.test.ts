import { describe, test, expect, vi } from 'vitest';
import { WorkflowRunner } from '../../src/core/runner.js';
import { WorkflowPersistence } from '../../src/core/persistence.js';
import type { WorkflowDefinition, WorkflowRun, WorkflowStep } from '../../src/core/workflow.js';

function createPersistence(): WorkflowPersistence {
  return new WorkflowPersistence('/tmp/deepclaw-test-runner-' + Date.now());
}

function createWorkflow(steps: Omit<WorkflowStep, 'id' | 'status'>[]): WorkflowDefinition {
  return {
    id: 'wf-runner-test',
    name: 'Runner Test Workflow',
    description: 'Test workflow for runner',
    version: '1.0.0',
    steps,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe('WorkflowRunner', () => {
  test('executes simple steps', async () => {
    const persistence = createPersistence();
    const workflow = createWorkflow([
      { name: 'step1', action: 'transform.json', input: { text: 'hello' } },
      { name: 'step2', action: 'transform.uppercase', input: { text: 'world' } },
    ]);
    persistence.saveWorkflow(workflow);

    const run: WorkflowRun = {
      id: 'run-runner-1',
      workflowId: workflow.id,
      version: workflow.version,
      status: 'pending',
      input: {},
      steps: workflow.steps.map((step) => ({
        ...step,
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: 'pending' as const,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persistence.saveRun(run);

    const runner = new WorkflowRunner(persistence);
    const result = await runner.execute(run.id);

    expect(result.status).toBe('completed');
    expect(result.steps).toHaveLength(2);
  });

  test('retries failed step up to maxRetries', async () => {
    const persistence = createPersistence();
    const workflow = createWorkflow([
      { name: 'flaky', action: 'throw.simulated', input: { message: 'fail' }, maxRetries: 1, retryDelayMs: 10 },
    ]);
    persistence.saveWorkflow(workflow);

    const run: WorkflowRun = {
      id: 'run-runner-2',
      workflowId: workflow.id,
      version: workflow.version,
      status: 'pending',
      input: {},
      steps: workflow.steps.map((step) => ({
        ...step,
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: 'pending' as const,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persistence.saveRun(run);

    const runner = new WorkflowRunner(persistence);
    const result = await runner.execute(run.id);

    expect(result.status).toBe('failed');
    const failedStep = result.steps.find((s) => s.name === 'flaky');
    expect(failedStep?.status).toBe('failed');
  });

  test('calls onStepUpdate callback', async () => {
    const persistence = createPersistence();
    const workflow = createWorkflow([
      { name: 'step1', action: 'transform.json', input: { text: 'hello' } },
    ]);
    persistence.saveWorkflow(workflow);

    const run: WorkflowRun = {
      id: 'run-runner-3',
      workflowId: workflow.id,
      version: workflow.version,
      status: 'pending',
      input: {},
      steps: workflow.steps.map((step) => ({
        ...step,
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: 'pending' as const,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persistence.saveRun(run);

    const updates: Array<{ runId: string; step: WorkflowStep }> = [];
    const runner = new WorkflowRunner(persistence, {
      onStepUpdate: (runId, step) => updates.push({ runId, step }),
    });
    await runner.execute(run.id);

    expect(updates.length).toBeGreaterThanOrEqual(1);
    expect(updates[0].runId).toBe(run.id);
  });

  test('pauses workflow on step requiring approval and resumes after approval', async () => {
    const persistence = createPersistence();
    const workflow = createWorkflow([
      { name: 'step1', action: 'transform.json', input: { text: 'ready' } },
      {
        name: 'step2_approval',
        action: 'database.delete_records',
        approval: { message: 'Approve deleting records?', roles: ['admin'] },
      },
      { name: 'step3_done', action: 'transform.uppercase', input: { text: 'finished' } },
    ]);
    persistence.saveWorkflow(workflow);

    const run: WorkflowRun = {
      id: 'run-hitl-1',
      workflowId: workflow.id,
      version: workflow.version,
      status: 'pending',
      input: {},
      steps: workflow.steps.map((step) => ({
        ...step,
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: 'pending' as const,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persistence.saveRun(run);

    const runner = new WorkflowRunner(persistence);
    const pausedResult = await runner.execute(run.id);

    expect(pausedResult.status).toBe('waiting_approval');
    const approvalStep = pausedResult.steps.find((s) => s.name === 'step2_approval');
    expect(approvalStep?.status).toBe('waiting_approval');
    expect(approvalStep?.approvalRequest?.message).toBe('Approve deleting records?');

    // Approve the step
    const resumedResult = await runner.resolveApproval(run.id, approvalStep!.id, {
      approved: true,
      approver: 'admin@svg.ph',
      timestamp: Date.now(),
    });

    expect(resumedResult.status).toBe('completed');
    const finalStep = resumedResult.steps.find((s) => s.name === 'step3_done');
    expect(finalStep?.status).toBe('completed');
  });

  test('fails workflow when approval is rejected', async () => {
    const persistence = createPersistence();
    const workflow = createWorkflow([
      {
        name: 'step_sensitive',
        action: 'hitl:approve_payment',
        approval: { message: 'Transfer approval' },
      },
    ]);
    persistence.saveWorkflow(workflow);

    const run: WorkflowRun = {
      id: 'run-hitl-reject',
      workflowId: workflow.id,
      version: workflow.version,
      status: 'pending',
      input: {},
      steps: workflow.steps.map((step) => ({
        ...step,
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: 'pending' as const,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persistence.saveRun(run);

    const runner = new WorkflowRunner(persistence);
    await runner.execute(run.id);

    const rejectedResult = await runner.resolveApproval(run.id, run.steps[0].id, {
      approved: false,
      approver: 'compliance_officer',
      reason: 'Exceeds transaction limits',
      timestamp: Date.now(),
    });

    expect(rejectedResult.status).toBe('failed');
    expect(rejectedResult.steps[0].error).toContain('Exceeds transaction limits');
  });
});
