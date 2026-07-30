/**
 * Per-Provider Tokenizer Support (Module 2)
 */
export type ModelProvider = 'anthropic' | 'openai' | 'ollama';
export interface ProviderPricing {
    inputPer1k: number;
    outputPer1k: number;
}
export declare const PROVIDER_RATES: Record<ModelProvider, ProviderPricing>;
export declare function estimateProviderTokens(text: string, provider?: ModelProvider): number;
export declare function calculateCost(tokens: number, provider?: ModelProvider, type?: 'input' | 'output'): number;
