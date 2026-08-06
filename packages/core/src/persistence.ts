import fs from 'fs';
import path from 'path';
import type { WorkflowDefinition, WorkflowRun, WorkflowStep } from './workflow.js';

export class WorkflowPersistence {
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    fs.mkdirSync(this.dataDir, { recursive: true });
  }

  private workflowPath(id: string) {
    return path.join(this.dataDir, `workflow-${id}.json`);
  }

  private runPath(id: string) {
    return path.join(this.dataDir, `run-${id}.json`);
  }

  saveWorkflow(workflow: WorkflowDefinition) {
    const filePath = this.workflowPath(workflow.id);
    const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : {};
    fs.writeFileSync(filePath, JSON.stringify({ ...existing, ...workflow, updatedAt: Date.now() }, null, 2), 'utf-8');
  }

  loadWorkflow(id: string): WorkflowDefinition | null {
    const filePath = this.workflowPath(id);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  listWorkflows(): WorkflowDefinition[] {
    const files = fs.readdirSync(this.dataDir).filter((f) => f.startsWith('workflow-') && f.endsWith('.json'));
    const workflows: WorkflowDefinition[] = [];
    for (const file of files) {
      const content = JSON.parse(fs.readFileSync(path.join(this.dataDir, file), 'utf-8'));
      workflows.push(content);
    }
    return workflows.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  saveRun(run: WorkflowRun) {
    const filePath = this.runPath(run.id);
    const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : {};
    fs.writeFileSync(filePath, JSON.stringify({ ...existing, ...run, updatedAt: Date.now() }, null, 2), 'utf-8');
  }

  loadRun(id: string): WorkflowRun | null {
    const filePath = this.runPath(id);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  listRuns(workflowId?: string): WorkflowRun[] {
    const files = fs.readdirSync(this.dataDir).filter((f) => f.startsWith('run-') && f.endsWith('.json'));
    const runs: WorkflowRun[] = [];
    for (const file of files) {
      const run = JSON.parse(fs.readFileSync(path.join(this.dataDir, file), 'utf-8'));
      if (!workflowId || run.workflowId === workflowId) {
        runs.push(run);
      }
    }
    return runs.sort((a, b) => b.createdAt - a.createdAt);
  }

  updateStep(runId: string, stepId: string, updates: Partial<WorkflowStep>) {
    const run = this.loadRun(runId);
    if (!run) return;
    const steps = run.steps.map((step) => {
      if (step.id !== stepId) return step;
      return { ...step, ...updates };
    });
    const updated = { ...run, steps, updatedAt: Date.now() };
    if (updates.status === 'completed' || updates.status === 'failed' || updates.status === 'cancelled') {
      updated.status = updates.status;
      updated.finishedAt = Date.now();
    }
    this.saveRun(updated);
  }
}
