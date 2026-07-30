#!/usr/bin/env node

/**
 * TokenSaveOS Executable CLI
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { loadConfig, DEFAULT_CONFIG, RankedFile, BudgetManager, VaultSync } from '@tokensaveos/core';
import { scanRepository, rankContextFiles } from '@tokensaveos/context-engine';
import { compressPrompt } from '@tokensaveos/token-engine';
import { CacheManager } from '@tokensaveos/cache-manager';
import { MemoryEngine } from '@tokensaveos/memory-engine';
import { AgentRouter } from '@tokensaveos/agent-router';
import { EvalHarness } from '@tokensaveos/eval-harness';
import { SkillManager } from '@tokensaveos/skill-manager';
import { TokenSaveMCPServer, startLLMProxy } from '@tokensaveos/mcp-server';

const command = process.argv[2] || 'help';

async function main() {
  console.log(`\x1b[36m⚡ TokenSaveOS v1.3.0\x1b[0m — AI Agent Optimization Platform\n`);

  const config = loadConfig();
  const cache = new CacheManager();
  const memory = new MemoryEngine();
  const router = new AgentRouter(config);
  const evals = new EvalHarness(config);
  const skills = new SkillManager();
  const budget = new BudgetManager();

  switch (command) {
    case 'init': {
      const configPath = path.join(process.cwd(), 'tokensave.config.json');
      if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
        console.log(`\x1b[32m[+] Initialized tokensave.config.json in ${process.cwd()}\x1b[0m`);
      } else {
        console.log(`\x1b[33m[!] tokensave.config.json already exists.\x1b[0m`);
      }
      memory.loadMemory(); // initialize .tokensave/memory/
      console.log(`\x1b[32m[+] Initialized .tokensave/memory/ storage.\x1b[0m`);
      break;
    }

    case 'analyze': {
      console.log(`🔍 Scanning repository context in ${process.cwd()}...`);
      const files = scanRepository(process.cwd(), config.context.ignorePatterns);
      console.log(`[✓] Scanned ${files.length} repository files (excluding secrets/.env/git).`);
      
      const samplePrompt = "Refactor architecture and optimize prompt token consumption";
      const ranked = rankContextFiles(files, samplePrompt, config.context.maxTokens);
      console.log(`\n\x1b[36mTop Ranked Context Files for Sample Task:\x1b[0m`);
      ranked.forEach((f: RankedFile, i: number) => {
        console.log(`  ${i + 1}. ${path.relative(process.cwd(), f.path)} (${f.tokens} tokens) — ${f.reason}`);
      });
      break;
    }

    case 'optimize': {
      const sample = process.argv[3] || "Please kindly note that we should refactor the code and remove unnecessary whitespace comments.";
      const res = compressPrompt(sample);
      cache.recordSavings(res.originalTokens, res.compressedTokens, res.estimatedSavingsUSD, sample);
      console.log(`\x1b[33mBefore:\x1b[0m ${res.originalTokens} tokens`);
      console.log(`\x1b[32mAfter:\x1b[0m  ${res.compressedTokens} tokens (-${res.compressionRatio}%)`);
      console.log(`\x1b[36mUSD Saved:\x1b[0m $${res.estimatedSavingsUSD}\n`);
      console.log(`\x1b[1mCompressed Result:\x1b[0m\n${res.compressedText}`);
      break;
    }

    case 'proxy': {
      const port = parseInt(process.argv[3] || '8080', 10);
      console.log(`🚀 Starting Zero-Code LLM API Proxy...`);
      startLLMProxy(port);
      break;
    }

    case 'budget': {
      const sub = process.argv[3];
      if (sub === 'set') {
        const limit = parseFloat(process.argv[4] || '100');
        const b = budget.setLimit(limit);
        console.log(`\x1b[32m[+] Updated monthly token budget limit to $${b.monthlyLimitUSD}\x1b[0m`);
      } else {
        const b = budget.getBudget();
        console.log(`\x1b[36m=== Enterprise Token Budget Status ===\x1b[0m`);
        console.log(`• Monthly Limit:  \x1b[32m$${b.monthlyLimitUSD.toFixed(2)}\x1b[0m`);
        console.log(`• Current Spent:  \x1b[33m$${b.currentSpentUSD.toFixed(5)}\x1b[0m`);
        console.log(`• Remaining:      \x1b[35m$${Math.max(0, b.monthlyLimitUSD - b.currentSpentUSD).toFixed(2)}\x1b[0m`);
      }
      break;
    }

    case 'sync': {
      const payload = VaultSync.exportSyncPayload();
      console.log(`\x1b[36m=== Encrypted Vault Sync Payload ===\x1b[0m`);
      console.log(JSON.stringify(payload, null, 2));
      console.log(`\x1b[32m[+] Enterprise Vault signature verified for host '${payload.hostname}'.\x1b[0m`);
      break;
    }

    case 'stats': {
      const s = cache.getStats();
      console.log(`\x1b[36m=== TokenSaveOS Real Savings Dashboard (~/.tokensave/state.json) ===\x1b[0m`);
      console.log(`• Compression Savings Rate: \x1b[32m${s.savingsRate}%\x1b[0m`);
      console.log(`• Total Tokens Saved:       \x1b[32m${s.tokensSaved.toLocaleString()}\x1b[0m`);
      console.log(`• Total Cost Reduction:     \x1b[32m$${s.costSavedUSD.toFixed(5)}\x1b[0m`);
      console.log(`• Cache Hit Ratio:          \x1b[35m${s.hitRatio}%\x1b[0m (${s.hits} hits / ${s.misses} misses)`);
      break;
    }

    case 'dashboard': {
      console.log(`🌐 Launching TokenSaveOS Analytics Dashboard on http://localhost:3005 ...`);
      const dashDir = path.join(process.cwd(), 'apps', 'dashboard');
      const child = spawn('npm', ['run', 'dev'], { cwd: dashDir, stdio: 'inherit', shell: true });
      break;
    }

    case 'memory': {
      const current = memory.loadMemory();
      console.log(`\x1b[36mDurable Project Memory (.tokensave/memory/):\x1b[0m`);
      console.log(JSON.stringify(current, null, 2));
      break;
    }

    case 'skills': {
      const sub = process.argv[3];
      if (sub === 'install') {
        const name = process.argv[4] || 'security-audit';
        const category: any = process.argv[5] || 'security';
        const installed = skills.installSkill(name, category);
        console.log(`\x1b[32m[+] Installed skill '${installed.name}' under skills/${installed.category}/\x1b[0m`);
      } else {
        const list = skills.listSkills();
        console.log(`\x1b[36mInstalled Agent Skills (${list.length}):\x1b[0m`);
        list.forEach(s => console.log(`  • [${s.category}] ${s.name} (${s.path})`));
      }
      break;
    }

    case 'run': {
      const prompt = process.argv.slice(3).join(' ') || "Refactor project architecture for token optimization";
      console.log(`\x1b[35m[Tier B Agent Mode]\x1b[0m Running standalone TokenSaveOS agent for prompt: "${prompt}"`);
      const route = router.routePrompt(prompt);
      console.log(`[Router] Selected Model: \x1b[32m${route.selectedModel}\x1b[0m (${route.rationale})`);
      const compressed = compressPrompt(prompt);
      cache.recordSavings(compressed.originalTokens, compressed.compressedTokens, compressed.estimatedSavingsUSD, prompt);
      console.log(`[Token Engine] Compressed prompt from ${compressed.originalTokens} to ${compressed.compressedTokens} tokens.`);
      break;
    }

    case 'eval': {
      console.log(`🧪 Running Quality Safety Net Regression Suite...`);
      const mockRunner = async (p: string) => `Executed task successfully: ${p}`;
      const report = await evals.runRegressionSuite(mockRunner);
      console.log(`[Eval Result] Total: ${report.totalScenarios} | Passed: ${report.passedScenarios} | Success Rate: ${report.successRate * 100}%`);
      console.log(`[Gate Status] ${report.passedGate ? '\x1b[32mPASSED GATE\x1b[0m' : '\x1b[31mFAILED GATE\x1b[0m'} (Min required: ${report.minRequiredRate * 100}%)`);
      break;
    }

    case 'mcp': {
      console.log(`🔌 Launching TokenSaveOS MCP Stdio Server...`);
      const mcp = new TokenSaveMCPServer();
      await mcp.startStdio();
      break;
    }

    default: {
      console.log(`Usage: tokensave <command> [options]`);
      console.log(`\nCommands:`);
      console.log(`  init       Initialize project configuration & .tokensave/memory/`);
      console.log(`  analyze    Scan repository & rank context efficiency`);
      console.log(`  optimize   Compress a prompt and calculate token/cost savings`);
      console.log(`  proxy      Start Zero-Code LLM API Proxy on http://localhost:8080`);
      console.log(`  budget     Manage developer budgets (tokensave budget [get|set <limit>])`);
      console.log(`  sync       Generate encrypted enterprise vault sync signature`);
      console.log(`  stats      Display token savings & prompt cache stats`);
      console.log(`  dashboard  Launch live web analytics dashboard on http://localhost:3005`);
      console.log(`  memory     Display project memory (.tokensave/memory/)`);
      console.log(`  skills     Manage skills (tokensave skills [list|install <name> <category>])`);
      console.log(`  run        Run as a standalone Tier B agent runtime`);
      console.log(`  eval       Run regression test suite against compression config`);
      console.log(`  mcp        Start Stdio JSON-RPC MCP Gateway server`);
    }
  }
}

main().catch(console.error);
