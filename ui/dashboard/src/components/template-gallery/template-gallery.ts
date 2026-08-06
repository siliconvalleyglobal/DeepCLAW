import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../../api.js';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
}

@customElement('template-gallery')
export class TemplateGallery extends LitElement {
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
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }
    .template {
      background: #16213e;
      border: 1px solid #16213e;
      border-radius: 6px;
      padding: 1rem;
    }
    .template-name {
      font-weight: 600;
      color: #e0e0e0;
      margin-bottom: 0.5rem;
    }
    .template-desc {
      font-size: 0.875rem;
      color: #a0a0a0;
      margin-bottom: 0.75rem;
    }
    .tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }
    .tag {
      background: #0f3460;
      color: #e94560;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
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

  @state() private _templates: WorkflowTemplate[] = [];
  @state() private _loading = true;
  @state() private _error: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._loadTemplates();
  }

  private async _loadTemplates() {
    try {
      const response = await apiFetch('/api/v1/workflow-templates');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) this._templates = data.data ?? [];
      this._error = null;
    } catch (e) {
      this._error = e instanceof Error ? e.message : 'Failed to load templates';
    } finally {
      this._loading = false;
    }
  }

  private async _instantiate(templateId: string) {
    const name = prompt('Workflow name:');
    if (!name) return;
    const response = await apiFetch(`/api/v1/workflow-templates/${templateId}/instantiate`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (response.ok) {
      alert('Workflow created from template');
    } else {
      alert('Failed to instantiate template');
    }
  }

  render() {
    return html`
      <div class="card">
        <div class="title">Workflow Templates</div>
        ${this._loading ? html`<div class="empty">Loading...</div>` : ''}
        ${this._error ? html`<div class="error">${this._error}</div>` : ''}
        ${!this._loading && !this._error && this._templates.length === 0 ? html`<div class="empty">No templates available</div>` : ''}
        <div class="grid">
          ${this._templates.map((t) => html`
            <div class="template">
              <div class="template-name">${t.name}</div>
              <div class="template-desc">${t.description}</div>
              <div class="tags">
                ${t.tags.map((tag) => html`<span class="tag">${tag}</span>`)}
              </div>
              <button @click=${() => this._instantiate(t.id)}>Use Template</button>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}
