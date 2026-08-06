import { describe, test, expect } from 'vitest';
import { feishuManifest, feishuTools, validateFeishuPlugin } from '../src/index';

describe('FeishuExtension', () => {
  test('manifest is valid', () => {
    expect(feishuManifest.name).toBe('feishu');
    expect(feishuManifest.version).toBe('2.0.0');
    expect(feishuManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateFeishuPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(feishuTools).toHaveLength(2);
    expect(feishuTools[0].name).toBe('send_message');
    expect(feishuTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = feishuTools[0];
    expect(tool.contract.validate({ receive_id: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ receive_id: '123', text: 'x'.repeat(10001) })).toBe(false);
    expect(tool.contract.validate({ receive_id: '123' })).toBe(false);
  });

  test('get_channel_info validates required receive_id field', () => {
    const tool = feishuTools[1];
    expect(tool.contract.validate({ receive_id: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});