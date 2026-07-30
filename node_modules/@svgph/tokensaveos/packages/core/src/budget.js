/**
 * Enterprise Developer Budget & Quota Manager (Feature 4)
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
export const DEFAULT_BUDGET = {
    monthlyLimitUSD: 100.0,
    currentSpentUSD: 0.0,
    alertThresholdPercent: 80.0,
    hardCapEnabled: true
};
export class BudgetManager {
    budgetPath;
    constructor() {
        const dir = path.join(os.homedir(), '.tokensave');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        this.budgetPath = path.join(dir, 'budget.json');
    }
    getBudget() {
        if (fs.existsSync(this.budgetPath)) {
            try {
                const raw = fs.readFileSync(this.budgetPath, 'utf-8');
                return { ...DEFAULT_BUDGET, ...JSON.parse(raw) };
            }
            catch (e) { }
        }
        return DEFAULT_BUDGET;
    }
    setLimit(monthlyLimitUSD) {
        const current = this.getBudget();
        current.monthlyLimitUSD = monthlyLimitUSD;
        fs.writeFileSync(this.budgetPath, JSON.stringify(current, null, 2), 'utf-8');
        return current;
    }
    recordExpense(amountUSD) {
        const b = this.getBudget();
        b.currentSpentUSD = parseFloat((b.currentSpentUSD + amountUSD).toFixed(5));
        fs.writeFileSync(this.budgetPath, JSON.stringify(b, null, 2), 'utf-8');
        const remainingUSD = Math.max(0, b.monthlyLimitUSD - b.currentSpentUSD);
        const spentPercent = (b.currentSpentUSD / b.monthlyLimitUSD) * 100;
        let warning;
        if (spentPercent >= b.alertThresholdPercent) {
            warning = `[Budget Alert] ${spentPercent.toFixed(1)}% of monthly budget ($${b.monthlyLimitUSD}) consumed!`;
        }
        if (b.hardCapEnabled && b.currentSpentUSD > b.monthlyLimitUSD) {
            return { allowed: false, remainingUSD: 0, warning: `[Hard Cap Reached] Monthly token budget limit of $${b.monthlyLimitUSD} exceeded!` };
        }
        return { allowed: true, remainingUSD, warning };
    }
}
