#!/usr/bin/env node

/**
 * TokenSaveOS Hook Integration for Claude Code (Tier A)
 * Intercepts prompt submission to prune context, inject memory, and record savings.
 */

import { compressPrompt } from '@tokensaveos/token-engine';
import { CacheManager } from '@tokensaveos/cache-manager';
import { MemoryEngine } from '@tokensaveos/memory-engine';

const rawPrompt = process.argv.slice(2).join(' ') || "";

if (!rawPrompt.trim()) {
  process.exit(0);
}

const cache = new CacheManager();
const memory = new MemoryEngine();

// 1. Load memory
const mem = memory.loadMemory();

// 2. Compress prompt
const result = compressPrompt(rawPrompt);

// 3. Record savings to persistent storage (~/.tokensave/state.json)
cache.recordSavings(result.originalTokens, result.compressedTokens, result.estimatedSavingsUSD, rawPrompt);

// 4. Output optimized prompt with cache breakpoints for Claude Code
console.log(`[TokenSaveOS] Reduced tokens from ${result.originalTokens} to ${result.compressedTokens} (-${result.compressionRatio}%)`);
console.log(`\n--- OPTIMIZED PROMPT ---`);
console.log(result.compressedText);
