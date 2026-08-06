import { describe, test, expect } from 'vitest';
import { webchatWidgetManifest, webchatWidgetTools, validateWebchatWidgetPlugin } from '../src/index';

describe('WebchatWidgetExtension', () => {
  test('manifest is valid', () => {
    expect(webchatWidgetManifest.name).toBe('webchat_widget');
    expect(webchatWidgetManifest.version).toBe('2.0.0');
    expect(webchatWidgetManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateWebchatWidgetPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(webchatWidgetTools).toHaveLength(2);
    expect(webchatWidgetTools[0].name).toBe('send_message');
    expect(webchatWidgetTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = webchatWidgetTools[0];
    expect(tool.contract.validate({ session_id: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ session_id: '123', text: 'x'.repeat(100001) })).toBe(false);
    expect(tool.contract.validate({ session_id: '123' })).toBe(false);
  });

  test('get_channel_info validates required session_id field', () => {
    const tool = webchatWidgetTools[1];
    expect(tool.contract.validate({ session_id: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});