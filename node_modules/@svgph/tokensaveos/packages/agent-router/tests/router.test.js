import { describe, it, expect } from 'vitest';
import { AgentRouter } from '../src/index.js';
import { DEFAULT_CONFIG } from '@tokensaveos/core';
describe('Agent Router Model Routing & Escalation', () => {
    it('should route simple tasks to small/haiku tier', () => {
        const router = new AgentRouter(DEFAULT_CONFIG);
        const decision = router.routePrompt('Hello, fix typo in heading');
        expect(decision.selectedModel).toBe(DEFAULT_CONFIG.aiModels.simple);
    });
    it('should route complex or escalated tasks to opus/complex tier', () => {
        const router = new AgentRouter(DEFAULT_CONFIG);
        const decision = router.routePrompt('Refactor security architecture and review policy engine', true);
        expect(decision.selectedModel).toBe(DEFAULT_CONFIG.aiModels.complex);
        expect(decision.escalated).toBe(true);
    });
});
