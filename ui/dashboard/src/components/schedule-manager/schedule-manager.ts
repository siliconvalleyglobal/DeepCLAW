import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../../api.js';

export interface ScheduleEntry {
  id: string;
  workflowId: string;
  cron: string;
  enabled: boolean;
  lastRunAt?: number;
  nextRunAt?: number;
}

@customElement('schedule-manager')
export class ScheduleManager extends LitElement {
  static styles = css`
    :host { display: block; padding: 1rem; }
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
    .form {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .form input, .form select {
      padding: 0.5rem;
      background: #16213e;
      border: 1px solid #0f3460;
      border-radius: 4px;
      color: #e0e0e0;
    }
    .form button {
      padding: 0.5rem 1rem;
      background: #e94560;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
    }
    .schedule-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #16213e;
      border-radius: 4px;
      margin-bottom: 0.5rem;
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

  @state() private _schedules: ScheduleEntry[] = [];
  @state() private _loading = true;
  @state() private _error: string | null = null;
  @state() private _workflowId = '';
  @state() private _cron = '0 * * * *';

  connectedCallback() {
    super.connectedCallback();
    this._loadSchedules();
  }

  private async _loadSchedules() {
    try {
      const response = await apiFetch('/api/v1/schedules');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) this._schedules = data.data ?? [];
      this._error = null;
    } catch (e) {
      this._error = e instanceof Error ? e.message : 'Failed to load schedules';
    } finally {
      this._loading = false;
    }
  }

  private async _createSchedule() {
    if (!this._workflowId || !this._cron) return;
    await apiFetch('/api/v1/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId: this._workflowId, cron: this._cron, enabled: true }),
    });
    this._workflowId = '';
    this._loadSchedules();
  }

  private async _deleteSchedule(id: string) {
    await apiFetch(`/api/v1/schedules/${id}`, { method: 'DELETE' });
    this._loadSchedules();
  }

  render() {
    return html`
      <div class="card">
        <div class="title">Schedules</div>
        <div class="form">
          <input placeholder="Workflow ID" .value=${this._workflowId} @input=${(e: any) => this._workflowId = e.target.value} />
          <input placeholder="Cron (e.g. 0 * * * *)" .value=${this._cron} @input=${(e: any) => this._cron = e.target.value} />
          <button @click=${this._createSchedule}>Add Schedule</button>
        </div>
        ${this._loading ? html`<div class="empty">Loading...</div>` : ''}
        ${this._error ? html`<div class="error">${this._error}</div>` : ''}
        ${this._schedules.map((s) => html`
          <div class="schedule-item">
            <div>
              <div>${s.workflowId}</div>
              <div style="font-size: 0.875rem; color: #a0a0a0;">${s.cron} ${s.enabled ? '(enabled)' : '(disabled)'}</div>
            </div>
            <button @click=${() => this._deleteSchedule(s.id)}>Delete</button>
          </div>
        `)}
      </div>
    `;
  }
}
