export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  main: string;
  capabilities: PluginCapabilities;
  permissions: PluginPermission[];
  hooks: PluginHooks;
  metadata?: Record<string, unknown>;
}

export interface PluginCapabilities {
  tools?: boolean;
  channels?: boolean;
  protocols?: boolean;
  governance?: boolean;
}

export interface PluginPermission {
  action: string;
  resources: string[];
  effect: 'allow' | 'deny';
  description?: string;
}

export interface PluginHooks {
  onInstall?: () => void | Promise<void>;
  onActivate?: () => void | Promise<void>;
  onDeactivate?: () => void | Promise<void>;
  onToolCall?: (ctx: PluginContext) => boolean | Promise<boolean>;
  onMessage?: (ctx: PluginContext) => void | Promise<void>;
  onError?: (ctx: PluginContext) => void | Promise<void>;
}

export interface PluginContext {
  pluginName: string;
  agentId: string;
  tenantId: string;
  action: string;
  args: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface PluginContract<TInput = Record<string, unknown>, TOutput = Record<string, unknown>> {
  name: string;
  version: string;
  inputSchema: TInput;
  outputSchema: TOutput;
  validate(input: TInput): boolean;
  transform(input: TInput): Promise<TOutput>;
}

export interface PluginTool<TInput = Record<string, unknown>, TOutput = Record<string, unknown>> {
  name: string;
  description: string;
  contract: PluginContract<TInput, TOutput>;
  execute: (input: TInput, ctx: PluginContext) => Promise<TOutput>;
}

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
