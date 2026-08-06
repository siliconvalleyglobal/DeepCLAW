import { describe, test, expect } from 'vitest';
import { emailSmtpManifest, emailSmtpTools, validateEmailSMTPPlugin } from '../src/index';

describe('EmailSMTPExtension', () => {
  test('manifest is valid', () => {
    expect(emailSmtpManifest.name).toBe('email_smtp');
    expect(emailSmtpManifest.version).toBe('2.0.0');
    expect(emailSmtpManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateEmailSMTPPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(emailSmtpTools).toHaveLength(2);
    expect(emailSmtpTools[0].name).toBe('send_message');
    expect(emailSmtpTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = emailSmtpTools[0];
    expect(tool.contract.validate({ to: 'a@b.com', subject: 'hi', body: 'hello' })).toBe(true);
    expect(tool.contract.validate({ to: 'a@b.com', subject: 'hi', body: 'x'.repeat(100001) })).toBe(false);
    expect(tool.contract.validate({ to: 'a@b.com', subject: 'hi' })).toBe(false);
  });

  test('get_channel_info validates required to field', () => {
    const tool = emailSmtpTools[1];
    expect(tool.contract.validate({ to: 'a@b.com' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});