/**
 * Cache Manager & Savings Persistence (Module 3)
 */
import { CacheStats } from '@tokensaveos/core';
import { ModelProvider } from '@tokensaveos/token-engine';
export interface PromptCacheRecord {
    hash: string;
    originalTokens: number;
    compressedTokens: number;
    costSavedUSD: number;
    timestamp: string;
}
export interface PersistentState {
    totalTokensSaved: number;
    totalCostSavedUSD: number;
    cacheHits: number;
    cacheMisses: number;
    history: PromptCacheRecord[];
}
export declare class CacheManager {
    private stateFilePath;
    private state;
    constructor(customPath?: string);
    private loadState;
    private saveState;
    checkCache(prompt: string): {
        hit: boolean;
        cachedText?: string;
    };
    recordSavings(originalTokens: number, compressedTokens: number, costSavedUSD: number, prompt: string): void;
    annotateCacheBreakpoints(content: string, provider?: ModelProvider): any;
    getStats(): CacheStats;
}
