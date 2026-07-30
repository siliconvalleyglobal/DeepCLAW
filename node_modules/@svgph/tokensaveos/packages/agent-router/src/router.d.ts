/**
 * Cost-Aware Model Router with Escalation Fallback
 */
import { ModelRouteDecision, TokenSaveConfig } from '@tokensaveos/core';
export declare class AgentRouter {
    private config;
    constructor(config: TokenSaveConfig);
    routePrompt(prompt: string, forceEscalate?: boolean): ModelRouteDecision;
}
