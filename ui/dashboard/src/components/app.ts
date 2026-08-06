import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import './policy-viewer.js';
import './audit-log.js';
import './budget-tracker.js';
import './workflow-builder.js';
import '../components/template-gallery/template-gallery.js';
import '../components/schedule-manager/schedule-manager.js';
import '../components/credential-manager/credential-manager.js';
import '../components/import-export/import-export.js';
import '../components/execution-viewer/execution-viewer.js';

@customElement('deepclaw-app')
export class DeepClawApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', system-ui, sans-serif;
      background: #0f0f23;
      color: #e0e0e0;
      min-height: 100vh;
    }
    .container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 2rem;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #16213e;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #e94560;
    }
    .nav {
      display: flex;
      gap: 1rem;
    }
    .nav a {
      color: #a0a0a0;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .nav a:hover {
      color: #e0e0e0;
      background: #16213e;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }
    .full-width {
      grid-column: 1 / -1;
    }
  `;

  render() {
    return html`
      <div class="container">
        <div class="header">
          <div class="logo">DeepCLAW</div>
          <nav class="nav">
            <a href="#dashboard">Dashboard</a>
            <a href="#workflows">Workflows</a>
            <a href="#policies">Policies</a>
            <a href="#audit">Audit</a>
            <a href="#budget">Budget</a>
          </nav>
        </div>
        <div class="grid">
          <policy-viewer></policy-viewer>
          <audit-log></audit-log>
          <budget-tracker></budget-tracker>
          <template-gallery></template-gallery>
          <schedule-manager></schedule-manager>
          <credential-manager></credential-manager>
          <import-export-panel></import-export-panel>
          <execution-viewer class="full-width"></execution-viewer>
          <workflow-builder class="full-width"></workflow-builder>
        </div>
      </div>
    `;
  }
}
