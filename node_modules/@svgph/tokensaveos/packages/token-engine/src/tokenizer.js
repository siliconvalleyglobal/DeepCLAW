/**
 * Per-Provider Tokenizer Support (Module 2)
 */
import { get_encoding } from 'tiktoken';
export const PROVIDER_RATES = {
    anthropic: { inputPer1k: 0.003, outputPer1k: 0.015 },
    openai: { inputPer1k: 0.0025, outputPer1k: 0.01 },
    ollama: { inputPer1k: 0.0, outputPer1k: 0.0 }
};
let tiktokenEncoder = null;
function getTiktokenEncoder() {
    if (!tiktokenEncoder) {
        try {
            tiktokenEncoder = get_encoding('cl100k_base');
        }
        catch (e) {
            tiktokenEncoder = null;
        }
    }
    return tiktokenEncoder;
}
export function estimateProviderTokens(text, provider = 'anthropic') {
    if (!text || text.trim().length === 0)
        return 0;
    if (provider === 'openai') {
        const enc = getTiktokenEncoder();
        if (enc) {
            try {
                const tokens = enc.encode(text);
                return tokens.length;
            }
            catch (e) {
                // fallback heuristic if encoding fails
            }
        }
    }
    if (provider === 'anthropic') {
        // Anthropic BPE tokenizer estimation: ~3.5 chars per token for code/text
        return Math.ceil(text.length / 3.5);
    }
    // Fallback for Ollama / Llama3 BPE tokenizers
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    return Math.max(1, Math.round(words * 1.3 + (chars - words * 5) * 0.2));
}
export function calculateCost(tokens, provider = 'anthropic', type = 'input') {
    const rate = type === 'input' ? PROVIDER_RATES[provider].inputPer1k : PROVIDER_RATES[provider].outputPer1k;
    return parseFloat(((tokens / 1000) * rate).toFixed(5));
}
