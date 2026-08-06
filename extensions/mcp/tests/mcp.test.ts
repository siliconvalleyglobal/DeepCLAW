import { describe, test, expect } from 'vitest';
import { mcpManifest, mcpTools, validateMCPPlugin } from '../src/index';

describe('MCPExtension', () => {
  test('manifest is valid', () => {
    expect(mcpManifest.name).toBe('mcp');
    expect(mcpManifest.version).toBe('2.0.0');
    expect(mcpManifest.capabilities?.protocols).toBe(true);
  });

  test('validation passes', () => {
    const result = validateMCPPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(mcpTools).toHaveLength(2);
    expect(mcpTools[0].name).toBe('proxy_tool_call');
    expect(mcpTools[1].name).toBe('list_tools');
  });

  test('proxy_tool_call validates required fields', () => {
    const tool = mcpTools[0];
    expect(tool.contract.validate({ serverUrl: 'http://localhost', toolName: 'test' })).toBe(true);
    expect(tool.contract.validate({ serverUrl: 'http://localhost' })).toBe(false);
    expect(tool.contract.validate({ toolName: 'test' })).toBe(false);
  });
});
