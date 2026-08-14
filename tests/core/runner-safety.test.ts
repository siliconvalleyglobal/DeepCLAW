import { describe, test, expect } from 'vitest';
import { WorkflowRunner } from '../../src/core/runner.js';
import { WorkflowPersistence } from '../../src/core/persistence.js';
import type { WorkflowDefinition, WorkflowRun, WorkflowStep } from '../../src/core/workflow.js';

describe('WorkflowRunner code execution safety', () => {
  test('allows safe code execution', async () => {
    const persistence = new WorkflowPersistence('/tmp/deepclaw-test-runner-safety-' + Date.now());
    const workflow: WorkflowDefinition = {
      id: 'wf-safety',
      name: 'Safety Test',
      description: 'Test',
      version: '1.0.0',
      steps: [{ name: 'safe', action: 'code:', input: { code: 'return { sum: input.a + input.b };', language: 'javascript' } }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persistence.saveWorkflow(workflow);

    const run: WorkflowRun = {
      id: 'run-safe-1',
      workflowId: workflow.id,
      version: workflow.version,
      status: 'pending',
      input: { a: 1, b: 2 },
      steps: workflow.steps.map((step) => ({
        ...step,
        id: 'step-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        status: 'pending' as const,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persistence.saveRun(run);

    const runner = new WorkflowRunner(persistence);
    const result = await runner.execute(run.id);
    const step = result.steps.find((s) => s.name === 'safe');
    expect(step?.status).toBe('completed');
    expect(step?.output?.result).toEqual({ sum: 3 });
  });
});
