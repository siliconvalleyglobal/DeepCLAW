/**
 * Configuration & Secret Redaction Engine (Section 10 & 11)
 */
import * as fs from 'fs';
import * as path from 'path';
export const DEFAULT_CONFIG = {
    aiModels: {
        simple: "claude-haiku-4-5",
        medium: "claude-sonnet-4-6",
        complex: "claude-opus-4-6"
    },
    context: {
        maxTokens: 8000,
        ignorePatterns: ["*.test.ts", "dist/*", ".env*", ".git/*", "node_modules/*"]
    },
    memory: {
        autoUpdate: true,
        schemaVersion: 1
    },
    cache: {
        enabled: true,
        provider: "anthropic"
    },
    compression: {
        aggressivePrune: true,
        removeComments: true,
        minifyJson: true
    },
    eval: {
        gateOnRegression: true,
        minSuccessRate: 0.9
    }
};
export function redactSecrets(text) {
    if (!text)
        return text;
    let sanitized = text;
    // Redact common secret patterns
    const patterns = [
        /sk-[a-zA-Z0-9]{20,}/g, // OpenAI keys
        /npm_[a-zA-Z0-9]{30,}/g, // npm tokens
        /ghp_[a-zA-Z0-9]{30,}/g, // GitHub PATs
        /bearer\s+[a-zA-Z0-9\-_\.=]+/gi, // Bearer tokens
        /(password|secret|apikey|api_key)\s*[:=]\s*["']?[^"'\s]+["']?/gi // General key-value secrets
    ];
    for (const pattern of patterns) {
        sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
    }
    return sanitized;
}
export function loadConfig(configPath) {
    const targetPath = configPath || path.join(process.cwd(), 'tokensave.config.json');
    if (fs.existsSync(targetPath)) {
        try {
            const raw = fs.readFileSync(targetPath, 'utf-8');
            const parsed = JSON.parse(raw);
            return {
                ...DEFAULT_CONFIG,
                ...parsed,
                compression: {
                    ...DEFAULT_CONFIG.compression,
                    ...(parsed.compression || {})
                }
            };
        }
        catch (e) {
            // fallback to default on read/parse error
        }
    }
    return DEFAULT_CONFIG;
}
