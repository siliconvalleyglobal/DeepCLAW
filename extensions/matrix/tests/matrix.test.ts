import { describe, test, expect } from 'vitest';
import { matrixManifest, matrixTools, validateMatrixPlugin } from '../src/index';

describe('MatrixExtension', () => {
  test('manifest is valid', () => {
    expect(matrixManifest.name).toBe('matrix');
    expect(matrixManifest.version).toBe('2.0.0');
    expect(matrixManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateMatrixPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(matrixTools).toHaveLength(2);
    expect(matrixTools[0].name).toBe('send_message');
    expect(matrixTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = matrixTools[0];
    expect(tool.contract.validate({ room_id: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ room_id: '123', text: 'x'.repeat(65537) })).toBe(false);
    expect(tool.contract.validate({ room_id: '123' })).toBe(false);
  });

  test('get_channel_info validates required room_id field', () => {
    const tool = matrixTools[1];
    expect(tool.contract.validate({ room_id: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});