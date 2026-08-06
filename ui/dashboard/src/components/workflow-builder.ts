import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../api.js';

export interface WorkflowNode {
  id: string;
  type: 'agent' | 'tool' | 'condition' | 'approval' | 'end';
  label: string;
  x: number;
  y: number;
  config?: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

@customElement('workflow-builder')
export class WorkflowBuilder extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 600px;
      position: relative;
      background: #1a1a2e;
      border: 1px solid #16213e;
      border-radius: 8px;
      overflow: hidden;
    }
    .canvas {
      width: 100%;
      height: 100%;
      position: relative;
      background-image: radial-gradient(#16213e 1px, transparent 1px);
      background-size: 20px 20px;
    }
    .node {
      position: absolute;
      min-width: 160px;
      padding: 0.75rem;
      background: #0f3460;
      border: 2px solid #e94560;
      border-radius: 6px;
      color: #e0e0e0;
      font-size: 0.875rem;
      cursor: move;
      user-select: none;
    }
    .node.selected {
      border-color: #4ade80;
      box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.3);
    }
    .node-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .node-title {
      font-weight: 600;
      color: #e94560;
    }
    .node-type {
      font-size: 0.75rem;
      color: #a0a0a0;
      text-transform: uppercase;
    }
    .toolbar {
      position: absolute;
      top: 1rem;
      left: 1rem;
      display: flex;
      gap: 0.5rem;
      z-index: 10;
    }
    .toolbar button {
      padding: 0.5rem 1rem;
      background: #16213e;
      border: 1px solid #e94560;
      border-radius: 4px;
      color: #e0e0e0;
      cursor: pointer;
      font-size: 0.875rem;
    }
    .toolbar button:hover {
      background: #0f3460;
    }
    .toolbar button.primary {
      background: #e94560;
      color: white;
    }
    .toolbar button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .status {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-size: 0.875rem;
      z-index: 10;
    }
    .status.success {
      background: #0f3460;
      color: #4ade80;
    }
    .status.error {
      background: #0f3460;
      color: #f87171;
    }
    .workflow-list {
      margin-top: 1rem;
    }
    .workflow-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #16213e;
      border: 1px solid #16213e;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }
    .workflow-item button {
      padding: 0.25rem 0.75rem;
      background: #e94560;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-size: 0.875rem;
    }
    .workflow-item button:hover {
      background: #c73650;
    }
  `;

  @state() private _nodes: WorkflowNode[] = [];
  @state() private _edges: WorkflowEdge[] = [];
  @state() private _selectedNodeId: string | null = null;
  @state() private _dragging: { nodeId: string; offsetX: number; offsetY: number } | null = null;
  @state() private _workflows: Array<{ id: string; name: string }> = [];
  @state() private _status: { type: 'success' | 'error'; message: string } | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._loadWorkflows();
    this._nodes = [
      { id: 'node-1', type: 'agent', label: 'Input Agent', x: 100, y: 100 },
      { id: 'node-2', type: 'tool', label: 'Policy Check', x: 300, y: 100 },
      { id: 'node-3', type: 'condition', label: 'Approved?', x: 500, y: 100 },
      { id: 'node-4', type: 'end', label: 'End', x: 700, y: 100 },
    ];
    this._edges = [
      { id: 'edge-1', source: 'node-1', target: 'node-2' },
      { id: 'edge-2', source: 'node-2', target: 'node-3' },
      { id: 'edge-3', source: 'node-3', target: 'node-4', condition: 'approved' },
    ];
  }

  private async _loadWorkflows() {
    try {
      const response = await apiFetch('/api/v1/workflows');
      const data = await response.json();
      if (data.success) {
        this._workflows = data.data ?? [];
      }
    } catch (e) {
      console.error('Failed to load workflows:', e);
    }
  }

  private _onMouseDown(e: MouseEvent, nodeId: string) {
    const node = this._nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const rect = this.getBoundingClientRect();
    this._dragging = {
      nodeId,
      offsetX: e.clientX - rect.left - node.x,
      offsetY: e.clientY - rect.top - node.y,
    };
    this._selectedNodeId = nodeId;
  }

  private _onMouseMove(e: MouseEvent) {
    if (!this._dragging) return;
    const rect = this.getBoundingClientRect();
    const node = this._nodes.find((n) => n.id === this._dragging!.nodeId);
    if (node) {
      node.x = Math.max(0, e.clientX - rect.left - this._dragging.offsetX);
      node.y = Math.max(0, e.clientY - rect.top - this._dragging.offsetY);
      this.requestUpdate();
    }
  }

  private _onMouseUp() {
    this._dragging = null;
  }

  private _addNode(type: WorkflowNode['type']) {
    const id = `node-${Date.now()}`;
    const labels: Record<WorkflowNode['type'], string> = {
      agent: 'New Agent',
      tool: 'New Tool',
      condition: 'Condition',
      approval: 'Approval Gate',
      end: 'End',
    };
    this._nodes = [
      ...this._nodes,
      { id, type, label: labels[type], x: 50 + this._nodes.length * 20, y: 50 + this._nodes.length * 20 },
    ];
  }

  private _deleteSelected() {
    if (!this._selectedNodeId) return;
    this._nodes = this._nodes.filter((n) => n.id !== this._selectedNodeId);
    this._edges = this._edges.filter((e) => e.source !== this._selectedNodeId && e.target !== this._selectedNodeId);
    this._selectedNodeId = null;
  }

  private async _saveWorkflow() {
    const name = prompt('Workflow name:');
    if (!name) return;
    const workflow = {
      id: `wf-${Date.now()}`,
      name,
      description: 'Created in workflow builder',
      version: '1.0.0',
      steps: this._nodes.map((n) => ({ name: n.label, action: n.type })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    try {
      const response = await apiFetch('/api/v1/workflows', {
        method: 'POST',
        body: JSON.stringify(workflow),
      });
      if (response.ok) {
        this._showStatus('success', 'Workflow saved');
        this._loadWorkflows();
      } else {
        this._showStatus('error', 'Failed to save workflow');
      }
    } catch (e) {
      this._showStatus('error', 'Failed to save workflow');
    }
  }

  private async _runWorkflow() {
    if (this._workflows.length === 0) {
      this._showStatus('error', 'No workflows to run');
      return;
    }
    const workflow = this._workflows[0];
    try {
      const response = await apiFetch(`/api/v1/workflows/${workflow.id}/runs`, {
        method: 'POST',
        body: JSON.stringify({ input: { source: 'workflow-builder' } }),
      });
      if (response.ok) {
        this._showStatus('success', 'Workflow run started');
      } else {
        this._showStatus('error', 'Failed to start workflow');
      }
    } catch (e) {
      this._showStatus('error', 'Failed to start workflow');
    }
  }

  private _showStatus(type: 'success' | 'error', message: string) {
    this._status = { type, message };
    setTimeout(() => { this._status = null; }, 3000);
  }

  render() {
    return html`
      <div class="canvas" @mousemove=${this._onMouseMove} @mouseup=${this._onMouseUp} @mouseleave=${this._onMouseUp}>
        <div class="toolbar">
          <button @click=${() => this._addNode('agent')}>+ Agent</button>
          <button @click=${() => this._addNode('tool')}>+ Tool</button>
          <button @click=${() => this._addNode('condition')}>+ Condition</button>
          <button @click=${() => this._addNode('approval')}>+ Approval</button>
          <button @click=${() => this._addNode('end')}>+ End</button>
          <button @click=${this._deleteSelected} ?disabled=${!this._selectedNodeId}>Delete</button>
          <button class="primary" @click=${this._saveWorkflow}>Save Workflow</button>
          <button class="primary" @click=${this._runWorkflow}>Run Workflow</button>
        </div>
        ${this._nodes.map((node) => html`
          <div
            class="node ${this._selectedNodeId === node.id ? 'selected' : ''}"
            style="left: ${node.x}px; top: ${node.y}px;"
            @mousedown=${(e: MouseEvent) => this._onMouseDown(e, node.id)}
          >
            <div class="node-header">
              <span class="node-title">${node.label}</span>
              <span class="node-type">${node.type}</span>
            </div>
          </div>
        `)}
        <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
          ${this._edges.map((edge) => {
            const source = this._nodes.find((n) => n.id === edge.source);
            const target = this._nodes.find((n) => n.id === edge.target);
            if (!source || !target) return '';
            const x1 = source.x + 80;
            const y1 = source.y + 25;
            const x2 = target.x + 80;
            const y2 = target.y + 25;
            const midX = (x1 + x2) / 2;
            return `
              <path
                d="M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}"
                stroke="#e94560"
                stroke-width="2"
                fill="none"
                marker-end="url(#arrowhead)"
              />
            `;
          })}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#e94560" />
            </marker>
          </defs>
        </svg>
        ${this._status ? html`
          <div class="status ${this._status.type}">${this._status.message}</div>
        ` : ''}
      </div>
      <div class="workflow-list">
        ${this._workflows.map((wf) => html`
          <div class="workflow-item">
            <span>${wf.name} (${wf.id})</span>
          </div>
        `)}
      </div>
    `;
  }
}
