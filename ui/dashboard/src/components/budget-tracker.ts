import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../api.js';

@customElement('budget-tracker')
export class BudgetTracker extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }
    .card {
      background: #1a1a2e;
      border: 1px solid #16213e;
      border-radius: 8px;
      padding: 1.5rem;
    }
    .title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #e94560;
      margin-bottom: 1rem;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .stat {
      background: #16213e;
      padding: 1rem;
      border-radius: 6px;
    }
    .label {
      font-size: 0.875rem;
      color: #a0a0a0;
      margin-bottom: 0.5rem;
    }
    .value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #e0e0e0;
    }
    .warning {
      color: #fbbf24;
    }
    .danger {
      color: #f87171;
    }
    .empty {
      color: #a0a0a0;
      font-style: italic;
    }
    .error {
      color: #f87171;
      font-style: italic;
    }
  `;

  @state() private _budget: Record<string, number> = {};
  @state() private _loading = true;
  @state() private _error: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._loadBudget();
    this._poll = setInterval(() => this._loadBudget(), 10000);
  }

  disconnectedCallback() {
    if (this._poll) clearInterval(this._poll);
    super.disconnectedCallback();
  }

  private _poll: number | null = null;

  private async _loadBudget() {
    try {
      const response = await apiFetch('/api/v1/budget');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) {
        this._budget = data.data ?? {};
      }
      this._error = null;
    } catch (e) {
      this._error = e instanceof Error ? e.message : 'Failed to load budget';
    } finally {
      this._loading = false;
    }
  }

  render() {
    const monthlyLimit = this._budget.monthlyLimitUSD ?? 0;
    const currentSpent = this._budget.currentSpentUSD ?? 0;
    const remaining = Math.max(0, monthlyLimit - currentSpent);
    const spentPercent = monthlyLimit > 0 ? (currentSpent / monthlyLimit) * 100 : 0;
    const isWarning = spentPercent >= 80;
    const isDanger = spentPercent >= 100;

    return html`
      <div class="card">
        <div class="title">Budget Tracker</div>
        ${this._loading ? html`<div class="empty">Loading...</div>` : ''}
        ${this._error ? html`<div class="error">${this._error}</div>` : ''}
        <div class="stats">
          <div class="stat">
            <div class="label">Monthly Limit</div>
            <div class="value">$${monthlyLimit.toFixed(2)}</div>
          </div>
          <div class="stat">
            <div class="label">Current Spend</div>
            <div class="value ${isDanger ? 'danger' : isWarning ? 'warning' : ''}">
              $${currentSpent.toFixed(2)}
            </div>
          </div>
          <div class="stat">
            <div class="label">Remaining</div>
            <div class="value">$${remaining.toFixed(2)}</div>
          </div>
          <div class="stat">
            <div class="label">Usage</div>
            <div class="value ${isDanger ? 'danger' : isWarning ? 'warning' : ''}">
              ${spentPercent.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
