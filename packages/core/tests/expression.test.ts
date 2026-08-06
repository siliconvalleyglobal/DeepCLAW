import { describe, test, expect } from 'vitest';
import { ExpressionEngine } from '../src/expression.js';

describe('ExpressionEngine', () => {
  const engine = new ExpressionEngine();

  test('returns plain string when no expressions', () => {
    const result = engine.evaluate('hello world', {});
    expect(result.success).toBe(true);
    expect(result.value).toBe('hello world');
  });

  test('resolves simple variable', () => {
    const result = engine.evaluate('{{ name }}', { name: 'DeepCLAW' });
    expect(result.success).toBe(true);
    expect(result.value).toBe('DeepCLAW');
  });

  test('resolves nested variable', () => {
    const result = engine.evaluate('{{ user.name }}', { user: { name: 'Admin' } });
    expect(result.success).toBe(true);
    expect(result.value).toBe('Admin');
  });

  test('resolves array length', () => {
    const result = engine.evaluate('{{ items.length }}', { items: [1, 2, 3] });
    expect(result.success).toBe(true);
    expect(result.value).toBe('3');
  });

  test('returns error for missing property', () => {
    const result = engine.evaluate('{{ missing.nested }}', {});
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('evaluateBoolean returns true for true string', () => {
    const result = engine.evaluateBoolean('{{ approved }}', { approved: true });
    expect(result.success).toBe(true);
    expect(result.value).toBe(true);
  });

  test('evaluateBoolean returns false for false string', () => {
    const result = engine.evaluateBoolean('{{ approved }}', { approved: false });
    expect(result.success).toBe(true);
    expect(result.value).toBe(false);
  });
});
