import { describe, test, expect } from 'vitest';
import { PluginRegistry, PluginManager } from '../../src/plugin-sdk/index.js';
import { PluginManifest, PluginTool, PluginContext } from '../../src/plugin-sdk/types.js';

describe('PluginRegistry', () => {
  const createManifest = (name: string): PluginManifest => ({
    name,
    version: '1.0.0',
    description: `Test plugin ${name}`,
    author: 'Test',
    license: 'MIT',
    main: 'index.js',
    capabilities: { tools: true },
    permissions: [],
    hooks: {},
  });

  test('registers and retrieves plugin', () => {
    const registry = new PluginRegistry();
    const manifest = createManifest('test-plugin');
    registry.register(manifest);
    expect(registry.getManifest('test-plugin')).toBe(manifest);
    expect(registry.listPlugins()).toHaveLength(1);
  });

  test('prevents duplicate registration', () => {
    const registry = new PluginRegistry();
    registry.register(createManifest('dup'));
    expect(() => registry.register(createManifest('dup'))).toThrow();
  });

  test('unregisters plugin and tools', () => {
    const registry = new PluginRegistry();
    registry.register(createManifest('plugin-a'));
    const tool: PluginTool = {
      name: 'tool1',
      description: 'Test tool',
      contract: {
        name: 'tool1',
        version: '1.0.0',
        inputSchema: {},
        outputSchema: {},
        validate: () => true,
        transform: async () => ({}),
      },
      execute: async () => ({}),
    };
    registry.registerTool('plugin-a', tool);
    expect(registry.listTools('plugin-a')).toHaveLength(1);
    expect(registry.unregister('plugin-a')).toBe(true);
    expect(registry.getManifest('plugin-a')).toBeUndefined();
    expect(registry.listTools('plugin-a')).toHaveLength(0);
  });

  test('validates manifest', () => {
    const registry = new PluginRegistry();
    const result = registry.validate({ name: '', version: '', description: '', author: '', license: '', main: '', capabilities: {}, permissions: [], hooks: {} });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('PluginManager', () => {
  test('installs and activates plugin', async () => {
    const manager = new PluginManager();
    const manifest: PluginManifest = {
      name: 'managed-plugin',
      version: '1.0.0',
      description: 'Managed plugin',
      author: 'Test',
      license: 'MIT',
      main: 'index.js',
      capabilities: { tools: true },
      permissions: [{ action: 'read', resources: ['*'], effect: 'allow' }],
      hooks: {
        onActivate: async () => {},
      },
    };

    const result = await manager.install(manifest);
    expect(result.valid).toBe(true);
    expect(await manager.activate('managed-plugin')).toBe(true);
    expect(manager.getRegistry().getManifest('managed-plugin')).toBeDefined();
  });

  test('evaluates tool call hook', async () => {
    const manager = new PluginManager();
    const manifest: PluginManifest = {
      name: 'hook-plugin',
      version: '1.0.0',
      description: 'Hook plugin',
      author: 'Test',
      license: 'MIT',
      main: 'index.js',
      capabilities: { tools: true },
      permissions: [],
      hooks: {
        onToolCall: async (ctx: PluginContext) => ctx.action === 'allowed_action',
      },
    };

    await manager.install(manifest);
    const allowedCtx: PluginContext = {
      pluginName: 'hook-plugin',
      agentId: 'agent-1',
      tenantId: 'tenant-1',
      action: 'allowed_action',
      args: {},
      metadata: {},
    };
    const deniedCtx: PluginContext = {
      ...allowedCtx,
      action: 'denied_action',
    };

    expect(await manager.evaluateToolCall(allowedCtx)).toBe(true);
    expect(await manager.evaluateToolCall(deniedCtx)).toBe(false);
  });

  test('uninstalls plugin', async () => {
    const manager = new PluginManager();
    await manager.install({
      name: 'removable',
      version: '1.0.0',
      description: 'Removable',
      author: 'Test',
      license: 'MIT',
      main: 'index.js',
      capabilities: {},
      permissions: [],
      hooks: {},
    });
    expect(manager.uninstall('removable')).toBe(true);
    expect(manager.getRegistry().getManifest('removable')).toBeUndefined();
  });
});
