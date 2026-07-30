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
export declare class EvalHarness {
    private config;
    private testSuite;
    constructor(config: TokenSaveConfig);
    runRegressionSuite(agentRunner: (prompt: string) => Promise<string>): Promise<EvalReport>;
}
