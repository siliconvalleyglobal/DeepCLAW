import { describe, test, expect } from 'vitest';
import { BUILTIN_TEMPLATES, WorkflowTemplate } from '../src/templates.js';

describe('WorkflowTemplates', () => {
  test('has builtin templates', () => {
    expect(BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });

  test('each template has required fields', () => {
    for (const template of BUILTIN_TEMPLATES) {
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.workflow).toBeDefined();
      expect(template.workflow.steps.length).toBeGreaterThan(0);
    }
  });

  test('template ids are unique', () => {
    const ids = BUILTIN_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
