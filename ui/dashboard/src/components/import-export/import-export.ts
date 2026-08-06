import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../../api.js';

@customElement('import-export-panel')
export class ImportExportPanel extends LitElement {
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
    .actions {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .actions input {
      flex: 1;
      padding: 0.5rem;
      background: #16213e;
      border: 1px solid #0f3460;
      border-radius: 4px;
      color: #e0e0e0;
    }
    .actions button {
      padding: 0.5rem 1rem;
      background: #e94560;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
    }
    textarea {
      width: 100%;
      height: 200px;
      background: #16213e;
      border: 1px solid #0f3460;
      border-radius: 4px;
      color: #e0e0e0;
      padding: 0.5rem;
      font-family: monospace;
    }
    .status {
      margin-top: 0.5rem;
      font-size: 0.875rem;
    }
    .status.success { color: #4ade80; }
    .status.error { color: #f87171; }
  `;

  @state() private _workflowId = '';
  @state() private _importJson = '';
  @state() private _status: { type: 'success' | 'error'; message: string } | null = null;

  private async _exportWorkflow() {
    if (!this._workflowId) return;
    const response = await apiFetch(`/api/v1/workflows/export/${this._workflowId}`);
    if (response.ok) {
      const data = await response.json();
      this._importJson = JSON.stringify(data, null, 2);
      this._showStatus('success', 'Workflow exported');
    } else {
      this._showStatus('error', 'Export failed');
    }
  }

  private async _importWorkflow() {
    if (!this._importJson.trim()) return;
    try {
      const payload = JSON.parse(this._importJson);
      const response = await apiFetch('/api/v1/workflows/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        this._showStatus('success', 'Workflow imported');
      } else {
        this._showStatus('error', 'Import failed');
      }
    } catch {
      this._showStatus('error', 'Invalid JSON');
    }
  }

  private _showStatus(type: 'success' | 'error', message: string) {
    this._status = { type, message };
    setTimeout(() => { this._status = null; }, 3000);
  }

  render() {
    return html`
      <div class="card">
        <div class="title">Import / Export</div>
        <div class="actions">
          <input placeholder="Workflow ID to export" .value=${this._workflowId} @input=${(e: any) => this._workflowId = e.target.value} />
          <button @click=${this._exportWorkflow}>Export</button>
        </div>
        <textarea placeholder="Paste workflow JSON here to import..." .value=${this._importJson} @input=${(e: any) => this._importJson = e.target.value}></textarea>
        <div class="actions" style="margin-top: 0.5rem;">
          <button @click=${this._importWorkflow}>Import</button>
        </div>
        ${this._status ? html`<div class="status ${this._status.type}">${this._status.message}</div>` : ''}
      </div>
    `;
  }
}
