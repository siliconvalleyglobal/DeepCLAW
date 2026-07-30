/**
 * TokenSaveOS Core Interfaces & Types (Section 13)
 */
export interface AIModelConfig {
    simple: string;
    medium: string;
    complex: string;
}
export interface ContextConfig {
    maxTokens: number;
    ignorePatterns: string[];
}
export interface MemoryConfig {
    autoUpdate: boolean;
    schemaVersion: number;
}
export interface CacheConfig {
    enabled: boolean;
    provider: 'anthropic' | 'openai' | 'ollama';
}
export interface CompressionConfig {
    aggressivePrune: boolean;
    removeComments: boolean;
    minifyJson: boolean;
}
export interface EvalConfig {
    gateOnRegression: boolean;
    minSuccessRate: number;
}
export interface TokenSaveConfig {
    aiModels: AIModelConfig;
    context: ContextConfig;
    memory: MemoryConfig;
    cache: CacheConfig;
    compression?: CompressionConfig;
    eval: EvalConfig;
}
export interface RankedFile {
    path: string;
    score: number;
    tokens: number;
    reason: string;
}
export interface CompressionResult {
    compressedText: string;
    originalTokens: number;
    compressedTokens: number;
    tokensSaved: number;
    compressionRatio: number;
    estimatedSavingsUSD: number;
}
export interface ModelRouteDecision {
    selectedModel: string;
    tier?: 'simple' | 'medium' | 'complex';
    rationale: string;
    escalated?: boolean;
    tokenCount?: number;
    estimatedCostUSD?: number;
    savingsVsDefaultUSD?: number;
}
export interface CacheStats {
    hits: number;
    misses: number;
    hitRatio: number;
    tokensSaved: number;
    costSavedUSD: number;
    savingsRate?: number;
}
