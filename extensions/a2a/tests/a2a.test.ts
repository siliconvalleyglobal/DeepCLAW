import { describe, test, expect } from 'vitest';
import { a2aManifest, a2aTools, validateA2APlugin } from '../src/index';

describe('A2AExtension', () => {
  test('manifest is valid', () => {
    expect(a2aManifest.name).toBe('a2a');
    expect(a2aManifest.version).toBe('2.0.0');
    expect(a2aManifest.capabilities?.protocols).toBe(true);
  });

  test('validation passes', () => {
    const result = validateA2APlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(a2aTools).toHaveLength(2);
    expect(a2aTools[0].name).toBe('delegate_task');
    expect(a2aTools[1].name).toBe('get_task_status');
  });

  test('delegate_task validates required fields', () => {
    const tool = a2aTools[0];
    expect(tool.contract.validate({ agentId: 'agent-1', task: { type: 'test' } })).toBe(true);
    expect(tool.contract.validate({ agentId: 'agent-1' })).toBe(false);
    expect(tool.contract.validate({ task: { type: 'test' } })).toBe(false);
  });
});
