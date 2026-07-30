/**
 * Quality Safety Net & Eval Regression Harness
 */

import { TokenSaveConfig } from '@tokensaveos/core';

export interface EvalTestCase {
  id: string;
  prompt: string;
  expectedKeyword: string;
}

export interface EvalReport {
  totalScenarios: number;
  passedScenarios: number;
  successRate: number;
  passedGate: boolean;
  minRequiredRate: number;
}

export class EvalHarness {
  private testSuite: EvalTestCase[] = [
    { id: 'eval-1', prompt: 'Refactor code to fix memory leak', expectedKeyword: 'refactor' },
    { id: 'eval-2', prompt: 'Summarize architecture decisions', expectedKeyword: 'architecture' },
    { id: 'eval-3', prompt: 'Format JSON payload', expectedKeyword: 'json' }
  ];

  constructor(private config: TokenSaveConfig) {}

  public async runRegressionSuite(agentRunner: (prompt: string) => Promise<string>): Promise<EvalReport> {
    let passed = 0;

    for (const test of this.testSuite) {
      try {
        const response = await agentRunner(test.prompt);
        if (response.toLowerCase().includes(test.expectedKeyword)) {
          passed++;
        }
      } catch (e) {
        // Failed case
      }
    }

    const successRate = this.testSuite.length > 0 ? parseFloat((passed / this.testSuite.length).toFixed(2)) : 1.0;
    const minRequiredRate = this.config.eval.minSuccessRate;
    const passedGate = successRate >= minRequiredRate;

    return {
      totalScenarios: this.testSuite.length,
      passedScenarios: passed,
      successRate,
      passedGate,
      minRequiredRate
    };
  }
}
