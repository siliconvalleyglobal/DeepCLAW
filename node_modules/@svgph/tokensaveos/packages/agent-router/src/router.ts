/**
 * Cost-Aware Model Router with Escalation Fallback
 */

import { ModelRouteDecision, TokenSaveConfig } from '@tokensaveos/core';
import { estimateProviderTokens } from '@tokensaveos/token-engine';

export class AgentRouter {
  constructor(private config: TokenSaveConfig) {}

  public routePrompt(prompt: string, forceEscalate: boolean = false): ModelRouteDecision {
    const tokens = estimateProviderTokens(prompt, 'anthropic');
    const lower = prompt.toLowerCase();

    const isComplex =
      forceEscalate ||
      tokens > 3000 ||
      lower.includes('refactor') ||
      lower.includes('architecture') ||
      lower.includes('security') ||
      lower.includes('eval');

    const isSimple =
      !isComplex &&
      tokens < 300 &&
      (lower.includes('typo') || lower.includes('format') || lower.includes('hello'));

    let selectedModel = this.config.aiModels.medium;
    let rationale = "Medium complexity coding task routed to balanced Sonnet tier.";

    if (isSimple) {
      selectedModel = this.config.aiModels.simple;
      rationale = "Low complexity simple request routed to Haiku tier for cost savings.";
    } else if (isComplex) {
      selectedModel = this.config.aiModels.complex;
      rationale = forceEscalate
        ? "Task escalated to Opus tier after initial low confidence signal."
        : "High complexity architectural/security task routed to Opus tier.";
    }

    // Cost calculations
    const costPer1k = selectedModel.includes('haiku') ? 0.0005 : selectedModel.includes('opus') ? 0.015 : 0.003;
    const defaultCostPer1k = 0.003;

    const estimatedCostUSD = parseFloat(((tokens / 1000) * costPer1k).toFixed(6));
    const defaultCostUSD = (tokens / 1000) * defaultCostPer1k;
    const savingsVsDefaultUSD = parseFloat(Math.max(0, defaultCostUSD - estimatedCostUSD).toFixed(6));

    return {
      selectedModel,
      tokenCount: tokens,
      estimatedCostUSD,
      savingsVsDefaultUSD,
      rationale,
      escalated: forceEscalate
    };
  }
}
