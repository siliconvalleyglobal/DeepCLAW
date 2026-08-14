import { describe, test, expect, vi } from 'vitest';
import { WorkflowScheduler } from '../../src/core/scheduler.js';
import { WorkflowPersistence } from '../../src/core/persistence.js';

describe('WorkflowScheduler', () => {
  test('schedules and lists entries', async () => {
    const persistence = new WorkflowPersistence('/tmp/deepclaw-test-scheduler-' + Date.now());
    const scheduler = new WorkflowScheduler(persistence);

    const entry = await scheduler.schedule({
      workflowId: 'wf-sched-1',
      cron: '*/5 * * * *',
      enabled: true,
    });

    expect(entry.id).toBeDefined();
    expect(entry.workflowId).toBe('wf-sched-1');
    expect(entry.enabled).toBe(true);

    const entries = scheduler.listEntries();
    expect(entries.some((e) => e.id === entry.id)).toBe(true);
  });

  test('unschedule removes entry', async () => {
    const persistence = new WorkflowPersistence('/tmp/deepclaw-test-scheduler-unschedule-' + Date.now());
    const scheduler = new WorkflowScheduler(persistence);

    const entry = await scheduler.schedule({
      workflowId: 'wf-sched-2',
      cron: '0 * * * *',
      enabled: true,
    });

    const deleted = await scheduler.unschedule(entry.id);
    expect(deleted).toBe(true);

    const entries = scheduler.listEntries();
    expect(entries.some((e) => e.id === entry.id)).toBe(false);
  });

  test('nextRun computes next execution time', () => {
    const persistence = new WorkflowPersistence('/tmp/deepclaw-test-scheduler-nextrun-' + Date.now());
    const scheduler = new WorkflowScheduler(persistence);

    const now = Date.now();
    const next = scheduler.nextRun('0 12 * * *');
    expect(next).toBeGreaterThan(now);
  });
});
