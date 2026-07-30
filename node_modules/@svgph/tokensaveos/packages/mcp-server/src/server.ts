/**
 * MCP Gateway & Stdio Server Transport (Module 8)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { compressPrompt } from '@tokensaveos/token-engine';
import { MemoryEngine } from '@tokensaveos/memory-engine';
import { CacheManager } from '@tokensaveos/cache-manager';

export class TokenSaveMCPServer {
  private server: Server;
  private memory: MemoryEngine;
  private cache: CacheManager;

  constructor() {
    this.memory = new MemoryEngine();
    this.cache = new CacheManager();

    this.server = new Server(
      {
        name: '@svgph/tokensaveos-mcp',
        version: '1.1.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'tokensave_compress_prompt',
            description: 'Compress AI prompt and prune redundant filler text',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: { type: 'string', description: 'Raw prompt text' }
              },
              required: ['prompt']
            }
          },
          {
            name: 'tokensave_get_memory',
            description: 'Retrieve durable project memory files (.tokensave/memory/)',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'tokensave_compress_prompt') {
        const prompt = String((args as any)?.prompt || '');
        const res = compressPrompt(prompt);
        this.cache.recordSavings(res.originalTokens, res.compressedTokens, res.estimatedSavingsUSD, prompt);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res, null, 2)
            }
          ]
        };
      }

      if (name === 'tokensave_get_memory') {
        const mem = this.memory.loadMemory();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mem, null, 2)
            }
          ]
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  public async startStdio() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
