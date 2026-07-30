import { describe, it, expect } from 'vitest';
import { redactSecrets, loadConfig, DEFAULT_CONFIG } from '../src/index.js';
describe('Core Config & Secret Redaction', () => {
    it('should redact sensitive API keys and bearer tokens', () => {
        const raw = "Here is my key: sk-abcdef12345678901234567890 and bearer token bearer 1234567890abcdef";
        const redacted = redactSecrets(raw);
        expect(redacted).not.toContain('sk-abcdef12345678901234567890');
        expect(redacted).toContain('[REDACTED_SECRET]');
    });
    it('should fallback to DEFAULT_CONFIG when no config file exists', () => {
        const config = loadConfig('/non/existent/tokensave.config.json');
        expect(config.context.maxTokens).toBe(DEFAULT_CONFIG.context.maxTokens);
    });
});
