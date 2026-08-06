import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

export interface ExecutionEvent {
  type: 'run_update';
  runId: string;
  status: string;
  step?: { id: string; name: string; action: string; status: string };
  output?: Record<string, unknown>;
}

@customElement('execution-viewer')
export class ExecutionViewer extends LitElement {
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
    .controls {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .controls input {
      flex: 1;
      padding: 0.5rem;
      background: #16213e;
      border: 1px solid #0f3460;
      border-radius: 4px;
      color: #e0e0e0;
    }
    .controls button {
      padding: 0.5rem 1rem;
      background: #e94560;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
    }
    .controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .events {
      max-height: 400px;
      overflow-y: auto;
      background: #0f0f23;
      border-radius: 6px;
      padding: 0.75rem;
      font-family: monospace;
      font-size: 0.875rem;
    }
    .event {
      padding: 0.5rem;
      border-bottom: 1px solid #16213e;
    }
    .event:last-child { border-bottom: none; }
    .event-status {
      color: #4ade80;
    }
    .event-step {
      color: #e94560;
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

  @state() private _runId = '';
  @state() private _events: ExecutionEvent[] = [];
  @state() private _connected = false;
  @state() private _error: string | null = null;

  private _ws: WebSocket | null = null;

  private _connect() {
    if (!this._runId) return;
    this._close();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3001`;
    this._ws = new WebSocket(wsUrl);

    this._ws.onopen = () => {
      this._connected = true;
      this._ws!.send(JSON.stringify({
        id: `sub-${Date.now()}`,
        type: 'request',
        timestamp: Date.now(),
        source: 'ui-dashboard',
        payload: { action: 'subscribe_run', runId: this._runId, identity: { name: 'dashboard', roles: ['viewer'] } },
      }));
    };

    this._ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'event' && data.payload?.type === 'run_update') {
          this._events = [...this._events, data.payload];
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    this._ws.onclose = () => {
      this._connected = false;
    };

    this._ws.onerror = () => {
      this._error = 'WebSocket connection failed';
      this._connected = false;
    };
  }

  private _close() {
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this._connected = false;
  }

  disconnectedCallback() {
    this._close();
    super.disconnectedCallback();
  }

  render() {
    return html`
      <div class="card">
        <div class="title">Real-time Execution Viewer</div>
        <div class="controls">
          <input placeholder="Run ID" .value=${this._runId} @input=${(e: any) => this._runId = e.target.value} />
          <button @click=${this._connect} ?disabled=${this._connected}>Connect</button>
          <button @click=${this._close} ?disabled=${!this._connected}>Disconnect</button>
        </div>
        ${this._error ? html`<div class="error">${this._error}</div>` : ''}
        <div class="events">
          ${this._events.length === 0 ? html`<div class="empty">Connect to a run to see live updates</div>` : ''}
          ${this._events.map((evt) => html`
            <div class="event">
              <div><span class="event-status">[${evt.status}]</span> run ${evt.runId}</div>
              ${evt.step ? html`<div class="event-step">step: ${evt.step.name} (${evt.step.status})</div>` : ''}
              ${evt.output ? html`<div>output: ${JSON.stringify(evt.output)}</div>` : ''}
            </div>
          `)}
        </div>
      </div>
    `;
  }
}
