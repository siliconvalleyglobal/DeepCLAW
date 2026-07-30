import { describe, it, expect } from 'vitest';
import { estimateProviderTokens, compressPrompt } from '../src/index.js';

describe('Token Engine Tokenizer & Compressor', () => {
  it('should estimate provider tokens per model family', () => {
    const text = "Please refactor the architecture and optimize token usage.";
    const anthropicTokens = estimateProviderTokens(text, 'anthropic');
    const openaiTokens = estimateProviderTokens(text, 'openai');
    expect(anthropicTokens).toBeGreaterThan(0);
    expect(openaiTokens).toBeGreaterThan(0);
  });

  it('should compress real-world prompt with NO options passed (default-ON aggressivePrune)', () => {
    const raw = "Can you please analyze this code and explain what improvements can be made?";
    const result = compressPrompt(raw); // No options passed - tests default behavior
    expect(result.originalTokens).toBeGreaterThan(result.compressedTokens);
    expect(result.tokensSaved).toBeGreaterThan(0);
    expect(result.compressionRatio).toBeGreaterThan(0);
    expect(result.compressedText).not.toContain('please');
  });

  it('should compress prompt text and strip filler words when options provided', () => {
    const raw = "Please kindly note that we should refactor the code and remove unnecessary whitespace comments. # comment line";
    const result = compressPrompt(raw, { aggressivePrune: true, removeComments: true });
    expect(result.tokensSaved).toBeGreaterThan(0);
    expect(result.compressedText).not.toContain('# comment line');
  });
});
