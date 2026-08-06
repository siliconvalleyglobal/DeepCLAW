import { WorkflowPersistence } from './persistence.js';
import type { WorkflowDefinition, WorkflowRun } from './workflow.js';
import { WorkflowRunner, WorkflowRunnerOptions } from './runner.js';

export interface SchedulerEntry {
  id: string;
  workflowId: string;
  cron: string;
  enabled: boolean;
  lastRunAt?: number;
  nextRunAt?: number;
}

export class WorkflowScheduler {
  private persistence: WorkflowPersistence;
  private runner: WorkflowRunner;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private entries: SchedulerEntry[] = [];

  constructor(persistence: WorkflowPersistence, runnerOptions: WorkflowRunnerOptions = {}) {
    this.persistence = persistence;
    this.runner = new WorkflowRunner(persistence, runnerOptions);
  }

  async schedule(entry: Omit<SchedulerEntry, 'id' | 'lastRunAt' | 'nextRunAt'>): Promise<SchedulerEntry> {
    const scheduled: SchedulerEntry = {
      ...entry,
      id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nextRunAt: this.nextRun(entry.cron),
    };

    this.entries.push(scheduled);
    this.entries.sort((a, b) => (a.nextRunAt ?? 0) - (b.nextRunAt ?? 0));
    this._scheduleNext();
    return scheduled;
  }

  async unschedule(id: string): Promise<boolean> {
    const index = this.entries.findIndex((e) => e.id === id);
    if (index === -1) return false;

    this.entries.splice(index, 1);
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this._scheduleNext();
    return true;
  }

  listEntries(): SchedulerEntry[] {
    return [...this.entries];
  }

  private _scheduleNext(): void {
    if (this.entries.length === 0) return;

    const next = this.entries.find((e) => e.enabled && !this.timers.has(e.id));
    if (!next || next.nextRunAt == null) return;

    const delay = Math.max(0, next.nextRunAt - Date.now());
    const timer = setTimeout(() => this._runScheduled(next), delay);
    this.timers.set(next.id, timer);
  }

  private async _runScheduled(entry: SchedulerEntry): Promise<void> {
    this.timers.delete(entry.id);

    if (!entry.enabled) {
      this._scheduleNext();
      return;
    }

    const workflow = this.persistence.loadWorkflow(entry.workflowId);
    if (!workflow) {
      this._scheduleNext();
      return;
    }

    const run: WorkflowRun = {
      id: `run-${Date.now()}`,
      workflowId: workflow.id,
      version: workflow.version,
      status: 'pending',
      input: { triggeredBy: 'scheduler', scheduleId: entry.id },
      steps: workflow.steps.map((step) => ({
        ...step,
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: 'pending' as const,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.persistence.saveRun(run);

    entry.lastRunAt = Date.now();
    entry.nextRunAt = this.nextRun(entry.cron);

    try {
      await this.runner.execute(run.id);
    } catch {
      // runner logs its own errors
    }

    this._scheduleNext();
  }

  nextRun(cron: string): number {
    const parts = cron.split(' ');
    if (parts.length !== 5) {
      return Date.now() + 60000;
    }

    const now = new Date();
    let next = new Date(now);
    next.setSeconds(0, 0);

    try {
      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

      if (month !== '*' && Number(month) !== next.getMonth() + 1) {
        next.setMonth(next.getMonth() + 1);
      }

      if (dayOfMonth !== '*' && Number(dayOfMonth) !== next.getDate()) {
        next.setDate(next.getDate() + 1);
      }

      if (dayOfWeek !== '*') {
        const targetDay = Number(dayOfWeek);
        const currentDay = next.getDay();
        const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
        next.setDate(next.getDate() + daysUntil);
      }

      if (hour !== '*') {
        const targetHour = Number(hour);
        if (next.getHours() !== targetHour) {
          next.setHours(targetHour, 0, 0, 0);
          if (next <= now) {
            next.setDate(next.getDate() + 1);
          }
        }
      }

      if (minute !== '*') {
        const targetMinute = Number(minute);
        if (next.getMinutes() !== targetMinute) {
          next.setMinutes(targetMinute, 0, 0);
          if (next <= now) {
            next.setHours(next.getHours() + 1);
          }
        }
      }
    } catch {
      return Date.now() + 60000;
    }

    return next.getTime();
  }

  stop(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
