import { describe, test, expect } from 'vitest';
import { smsTwilioManifest, smsTwilioTools, validateSMSTwilioPlugin } from '../src/index';

describe('SMSTwilioExtension', () => {
  test('manifest is valid', () => {
    expect(smsTwilioManifest.name).toBe('sms_twilio');
    expect(smsTwilioManifest.version).toBe('2.0.0');
    expect(smsTwilioManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateSMSTwilioPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(smsTwilioTools).toHaveLength(2);
    expect(smsTwilioTools[0].name).toBe('send_message');
    expect(smsTwilioTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = smsTwilioTools[0];
    expect(tool.contract.validate({ to: '123', body: 'hello' })).toBe(true);
    expect(tool.contract.validate({ to: '123', body: 'x'.repeat(1601) })).toBe(false);
    expect(tool.contract.validate({ to: '123' })).toBe(false);
  });

  test('get_channel_info validates required to field', () => {
    const tool = smsTwilioTools[1];
    expect(tool.contract.validate({ to: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});