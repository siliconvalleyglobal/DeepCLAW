import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../../api.js';

export interface CredentialEntry {
  id: string;
  name: string;
  type: string;
  createdAt: number;
  updatedAt: number;
}

@customElement('credential-manager')
export class CredentialManager extends LitElement {
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
    .cred-item {
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

  @state() private _credentials: CredentialEntry[] = [];
  @state() private _loading = true;
  @state() private _error: string | null = null;
  @state() private _name = '';
  @state() private _type = 'api_key';

  connectedCallback() {
    super.connectedCallback();
    this._loadCredentials();
  }

  private async _loadCredentials() {
    try {
      const response = await apiFetch('/api/v1/credentials');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) this._credentials = data.data ?? [];
      this._error = null;
    } catch (e) {
      this._error = e instanceof Error ? e.message : 'Failed to load credentials';
    } finally {
      this._loading = false;
    }
  }

  private async _createCredential() {
    if (!this._name) return;
    await apiFetch('/api/v1/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: this._name, type: this._type, data: { value: 'demo-secret' } }),
    });
    this._name = '';
    this._loadCredentials();
  }

  private async _deleteCredential(id: string) {
    await apiFetch(`/api/v1/credentials/${id}`, { method: 'DELETE' });
    this._loadCredentials();
  }

  render() {
    return html`
      <div class="card">
        <div class="title">Credentials</div>
        <div class="form">
          <input placeholder="Name" .value=${this._name} @input=${(e: any) => this._name = e.target.value} />
          <select .value=${this._type} @change=${(e: any) => this._type = e.target.value}>
            <option value="api_key">API Key</option>
            <option value="bearer_token">Bearer Token</option>
            <option value="basic_auth">Basic Auth</option>
            <option value="oauth2">OAuth2</option>
            <option value="custom">Custom</option>
          </select>
          <button @click=${this._createCredential}>Add</button>
        </div>
        ${this._loading ? html`<div class="empty">Loading...</div>` : ''}
        ${this._error ? html`<div class="error">${this._error}</div>` : ''}
        ${this._credentials.map((c) => html`
          <div class="cred-item">
            <div>
              <div>${c.name}</div>
              <div style="font-size: 0.875rem; color: #a0a0a0;">${c.type}</div>
            </div>
            <button @click=${() => this._deleteCredential(c.id)}>Delete</button>
          </div>
        `)}
      </div>
    `;
  }
}
