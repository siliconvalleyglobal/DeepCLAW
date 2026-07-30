/**
 * Token Optimization & Compression Engine (Module 2)
 */
import { CompressionResult } from '@tokensaveos/core';
import { ModelProvider } from './tokenizer.js';
export interface CompressOptions {
    stripWhitespace?: boolean;
    removeComments?: boolean;
    dedupLines?: boolean;
    minifyJson?: boolean;
    aggressivePrune?: boolean;
    provider?: ModelProvider;
}
export declare function compressPrompt(rawText: string, options?: CompressOptions): CompressionResult;
