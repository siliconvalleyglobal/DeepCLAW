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
});
