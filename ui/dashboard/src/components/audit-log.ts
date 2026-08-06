import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../api.js';

@customElement('audit-log')
export class AuditLog extends LitElement {
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
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 0.75rem;
      border-bottom: 1px solid #16213e;
      color: #e0e0e0;
      font-size: 0.875rem;
    }
    th {
      color: #e94560;
      font-weight: 600;
    }
    .timestamp {
      font-family: monospace;
      color: #a0a0a0;
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

  @state() private _logs: Array<Record<string, unknown>> = [];
  @state() private _loading = true;
  @state() private _error: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._loadLogs();
    this._poll = setInterval(() => this._loadLogs(), 5000);
  }

  disconnectedCallback() {
    if (this._poll) clearInterval(this._poll);
    super.disconnectedCallback();
  }

  private _poll: number | null = null;

  private async _loadLogs() {
    try {
      const response = await apiFetch('/api/v1/audit/logs?limit=50');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) {
        this._logs = data.data ?? [];
      }
      this._error = null;
    } catch (e) {
      this._error = e instanceof Error ? e.message : 'Failed to load logs';
    } finally {
      this._loading = false;
    }
  }

  render() {
    return html`
      <div class="card">
        <div class="title">Audit Log</div>
        ${this._loading ? html`<div class="empty">Loading...</div>` : ''}
        ${this._error ? html`<div class="error">${this._error}</div>` : ''}
        ${!this._loading && !this._error && this._logs.length === 0 ? html`<div class="empty">No logs yet</div>` : ''}
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Decision</th>
              <th>Agent</th>
            </tr>
          </thead>
          <tbody>
            ${this._logs.map((log) => html`
              <tr>
                <td class="timestamp">${new Date(Number(log.timestamp) * 1000).toLocaleString()}</td>
                <td>${log.action}</td>
                <td>${log.permitted ? 'PERMIT' : 'DENY'}</td>
                <td>${log.agentId ?? '-'}</td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }
}
