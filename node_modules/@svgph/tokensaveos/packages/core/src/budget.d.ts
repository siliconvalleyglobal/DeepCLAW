/**
 * Enterprise Developer Budget & Quota Manager (Feature 4)
 */
export interface BudgetConfig {
    monthlyLimitUSD: number;
    currentSpentUSD: number;
    alertThresholdPercent: number;
    hardCapEnabled: boolean;
}
export declare const DEFAULT_BUDGET: BudgetConfig;
export declare class BudgetManager {
    private budgetPath;
    constructor();
    getBudget(): BudgetConfig;
    setLimit(monthlyLimitUSD: number): BudgetConfig;
    recordExpense(amountUSD: number): {
        allowed: boolean;
        remainingUSD: number;
        warning?: string;
    };
}
