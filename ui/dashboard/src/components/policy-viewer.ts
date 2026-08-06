import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../api.js';

@customElement('policy-viewer')
export class PolicyViewer extends LitElement {
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
      margin-bottom: 1rem;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #e94560;
    }
    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .badge.permit {
      background: #0f3460;
      color: #4ade80;
    }
    .badge.deny {
      background: #0f3460;
      color: #f87171;
    }
    .trace {
      font-family: monospace;
      font-size: 0.875rem;
      color: #a0a0a0;
      margin-top: 0.5rem;
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

  @state() private _decisions: Array<Record<string, unknown>> = [];
  @state() private _loading = true;
  @state() private _error: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._loadDecisions();
    this._poll = setInterval(() => this._loadDecisions(), 5000);
  }

  disconnectedCallback() {
    if (this._poll) clearInterval(this._poll);
    super.disconnectedCallback();
  }

  private _poll: number | null = null;

  private async _loadDecisions() {
    try {
      const response = await apiFetch('/api/v1/policy/decisions?limit=20');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) {
        this._decisions = data.data ?? [];
      }
      this._error = null;
    } catch (e) {
      this._error = e instanceof Error ? e.message : 'Failed to load decisions';
    } finally {
      this._loading = false;
    }
  }

  render() {
    return html`
      <div class="card">
        <div class="header">
          <div class="title">Policy Decisions</div>
          <div class="badge">${this._decisions.length} records</div>
        </div>
        ${this._loading ? html`<div class="empty">Loading...</div>` : ''}
        ${this._error ? html`<div class="error">${this._error}</div>` : ''}
        ${!this._loading && !this._error && this._decisions.length === 0 ? html`<div class="empty">No decisions yet</div>` : ''}
        ${this._decisions.map((d) => html`
          <div class="decision">
            <div class="header">
              <span>${d.action}</span>
              <span class="badge ${d.permitted ? 'permit' : 'deny'}">
                ${d.permitted ? 'PERMIT' : 'DENY'}
              </span>
            </div>
            <div class="trace">${d.reasoningTrace}</div>
          </div>
        `)}
      </div>
    `;
  }
}
