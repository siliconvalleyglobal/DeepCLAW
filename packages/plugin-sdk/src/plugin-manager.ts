import { PluginManifest, PluginContext, PluginValidationResult, PluginTool } from './types';

export class PluginRegistry {
  private plugins: Map<string, PluginManifest> = new Map();
  private tools: Map<string, PluginTool> = new Map();

  register(manifest: PluginManifest): void {
    if (this.plugins.has(manifest.name)) {
      throw new Error(`Plugin '${manifest.name}' is already registered`);
    }
    this.plugins.set(manifest.name, manifest);
  }

  unregister(pluginName: string): boolean {
    const manifest = this.plugins.get(pluginName);
    if (!manifest) return false;
    for (const [toolName, tool] of this.tools) {
      if (toolName.startsWith(`${pluginName}:`)) {
        this.tools.delete(toolName);
      }
    }
    return this.plugins.delete(pluginName);
  }

  getManifest(pluginName: string): PluginManifest | undefined {
    return this.plugins.get(pluginName);
  }

  listPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }

  registerTool(pluginName: string, tool: PluginTool): void {
    const key = `${pluginName}:${tool.name}`;
    this.tools.set(key, tool);
  }

  getTool(toolName: string): PluginTool | undefined {
    return this.tools.get(toolName);
  }

  listTools(pluginName?: string): PluginTool[] {
    const result: PluginTool[] = [];
    for (const [key, tool] of this.tools) {
      if (pluginName && !key.startsWith(`${pluginName}:`)) continue;
      result.push(tool);
    }
    return result;
  }

  validate(manifest: PluginManifest): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!manifest.name || manifest.name.trim().length === 0) {
      errors.push('Plugin name is required');
    }
    if (!manifest.version || manifest.version.trim().length === 0) {
      errors.push('Plugin version is required');
    }
    if (!manifest.main || manifest.main.trim().length === 0) {
      errors.push('Plugin main entry is required');
    }
    if (!manifest.permissions || manifest.permissions.length === 0) {
      warnings.push('Plugin has no permissions declared');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export class PluginManager {
  private registry: PluginRegistry;

  constructor() {
    this.registry = new PluginRegistry();
  }

  async install(manifest: PluginManifest): Promise<PluginValidationResult> {
    const validation = this.registry.validate(manifest);
    if (!validation.valid) {
      return validation;
    }
    this.registry.register(manifest);
    await this._runHook(manifest, 'onInstall');
    return validation;
  }

  async activate(pluginName: string): Promise<boolean> {
    const manifest = this.registry.getManifest(pluginName);
    if (!manifest) return false;
    await this._runHook(manifest, 'onActivate');
    return true;
  }

  async deactivate(pluginName: string): Promise<boolean> {
    const manifest = this.registry.getManifest(pluginName);
    if (!manifest) return false;
    await this._runHook(manifest, 'onDeactivate');
    return true;
  }

  uninstall(pluginName: string): boolean {
    return this.registry.unregister(pluginName);
  }

  async evaluateToolCall(ctx: PluginContext): Promise<boolean> {
    const manifest = this.registry.getManifest(ctx.pluginName);
    if (!manifest) return false;

    const hook = manifest.hooks.onToolCall;
    if (!hook) return true;

    return await hook(ctx);
  }

  getRegistry(): PluginRegistry {
    return this.registry;
  }

  private async _runHook(manifest: PluginManifest, hookName: keyof PluginManifest['hooks']): Promise<void> {
    const hook = manifest.hooks[hookName];
    if (typeof hook === 'function') {
      await hook();
    }
  }
}
