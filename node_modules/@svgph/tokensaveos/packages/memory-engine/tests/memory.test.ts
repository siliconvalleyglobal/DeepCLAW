import { describe, it, expect } from 'vitest';
import { MemoryEngine } from '../src/index.js';

describe('Memory Engine Storage & Redaction', () => {
  it('should load memory with schemaVersion = 1 across all 5 memory files', () => {
    const mem = new MemoryEngine();
    const record = mem.loadMemory();
    expect(record.schemaVersion).toBe(1);
    expect(record.files['project.md']).toBeDefined();
    expect(record.files['architecture.md']).toBeDefined();
    expect(record.files['decisions.md']).toBeDefined();
    expect(record.files['dependencies.md']).toBeDefined();
    expect(record.files['coding-style.md']).toBeDefined();
  });

  it('should redact secrets before updating memory file', () => {
    const mem = new MemoryEngine();
    mem.updateMemoryFile('project.md', 'Secret Project with key sk-123456789012345678901234567890');
    const loaded = mem.loadMemory();
    expect(loaded.files['project.md']).not.toContain('sk-123456789012345678901234567890');
    expect(loaded.files['project.md']).toContain('[REDACTED_SECRET]');
  });
});
