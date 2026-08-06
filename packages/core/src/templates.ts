import type { WorkflowDefinition } from './workflow.js';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'automation' | 'integration' | 'governance' | 'custom';
  tags: string[];
  workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>;
  createdAt: number;
  updatedAt: number;
}

export const BUILTIN_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'template-governed-chatbot',
    name: 'Governed Multi-Channel Chatbot',
    description: 'Receive message from any channel, apply DLP, check policy, and respond',
    category: 'communication',
    tags: ['chatbot', 'dlp', 'multi-channel'],
    workflow: {
      name: 'Governed Multi-Channel Chatbot',
      description: 'Receive message from any channel, apply DLP, check policy, and respond',
      version: '1.0.0',
      steps: [
        { name: 'Receive Message', action: 'channel.receive' },
        { name: 'DLP Scan', action: 'governance.dlp_scan' },
        { name: 'Policy Check', action: 'policy.evaluate' },
        { name: 'Generate Response', action: 'llm.generate' },
        { name: 'Send Response', action: 'channel.send' },
      ],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template-mcp-tool-orchestrator',
    name: 'MCP Tool Orchestrator',
    description: 'Discover MCP tools, validate against policy, execute, and log results',
    category: 'automation',
    tags: ['mcp', 'tools', 'orchestration'],
    workflow: {
      name: 'MCP Tool Orchestrator',
      description: 'Discover MCP tools, validate against policy, execute, and log results',
      version: '1.0.0',
      steps: [
        { name: 'List Tools', action: 'mcp.list_tools' },
        { name: 'Validate Tools', action: 'policy.validate_tools' },
        { name: 'Execute Tool', action: 'mcp.call_tool' },
        { name: 'Audit Result', action: 'governance.audit' },
      ],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template-daily-compliance-report',
    name: 'Daily Compliance Report',
    description: 'Generate ISO 42001 & SOC 2 compliance report and send to stakeholders',
    category: 'governance',
    tags: ['compliance', 'reporting', 'scheduled'],
    workflow: {
      name: 'Daily Compliance Report',
      description: 'Generate ISO 42001 & SOC 2 compliance report and send to stakeholders',
      version: '1.0.0',
      steps: [
        { name: 'Collect Audit Logs', action: 'audit.collect' },
        { name: 'Generate Report', action: 'compliance.generate' },
        { name: 'Review', action: 'human.checkpoint' },
        { name: 'Send Report', action: 'email.send' },
      ],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template-http-webhook-relay',
    name: 'HTTP Webhook Relay',
    description: 'Receive webhook, transform payload, and route to multiple channels',
    category: 'integration',
    tags: ['webhook', 'relay', 'transformation'],
    workflow: {
      name: 'HTTP Webhook Relay',
      description: 'Receive webhook, transform payload, and route to multiple channels',
      version: '1.0.0',
      steps: [
        { name: 'Receive Webhook', action: 'webhook.receive' },
        { name: 'Transform Payload', action: 'transform.json' },
        { name: 'Route to Slack', action: 'slack.send' },
        { name: 'Route to Telegram', action: 'telegram.send' },
      ],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
