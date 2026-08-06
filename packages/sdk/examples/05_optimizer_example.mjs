import {
  AgentIdentity,
  PreExecutionPolicyEngine,
  SIEMAuditLogger,
  TokenBudgetGuard,
  DLPEngine,
  DeepClawOptimizer,
} from '../index.mjs';

async function main() {
  console.log('=== DeepCLAW Node.js SDK Example ===\n');

  const optimizer = new DeepClawOptimizer({
    contextMaxTokens: 4000,
    ignorePatterns: ['*.test.*', 'node_modules/*', '.git/*', 'dist/*']
  });

  const policy = new PreExecutionPolicyEngine();
  const logger = new SIEMAuditLogger();
  const guard = new TokenBudgetGuard({ maxTokensPerMinute: 5000, maxUsdPerDay: 25 });
  const dlp = new DLPEngine();

  const identity = new AgentIdentity({
    name: 'deepclaw-example-agent',
    roles: ['workflow_operator'],
    channelOrigin: 'cli',
    permissionCeiling: 'standard'
  });

  const sensitivePrompt = 'Please analyze this code. My SSN is 123-45-6789, email john@example.com, key sk-proj-abcdef1234567890123456';
  const sanitized = dlp.sanitize(sensitivePrompt);
  console.log('[DLP] Sanitized prompt:');
  console.log('  Input: ', sensitivePrompt);
  console.log('  Output:', sanitized.sanitizedText);
  console.log('  Matches:', sanitized.matchesFound);
  console.log();

  const decision = policy.evaluateToolCall(identity, 'mcp_query');
  logger.logDecision(decision, { example: true });
  console.log('[Policy] Tool call decision:', decision.permitted ? 'PERMITTED' : 'DENIED');
  console.log('  Reasoning:', decision.reasoningTrace);
  console.log();

  const budgetCheck = guard.checkAndRecord('tenant-demo', 1200);
  console.log('[Budget] Token check:', budgetCheck.allowed ? 'APPROVED' : 'BLOCKED', '-', budgetCheck.reason);
  console.log();

  const rawPrompt = 'Can you please analyze this code and explain what improvements can be made in order to achieve better performance?';
  const compressed = optimizer.optimizePrompt(rawPrompt, { provider: 'anthropic' });
  console.log('[Optimizer] Prompt compression:');
  console.log('  Original tokens:', compressed.originalTokens);
  console.log('  Compressed tokens:', compressed.compressedTokens);
  console.log('  Saved:', `${compressed.tokensSaved} tokens (${compressed.compressionRatio}%)`);
  console.log('  Est. savings: $', compressed.estimatedSavingsUSD);
  console.log();

  const redacted = optimizer.redactSecrets('DB password = "super_secret_123" and API key sk-abc123xyz789');
  console.log('[Optimizer] Secret redaction:', redacted);
  console.log();

  const budget = optimizer.getBudget();
  console.log('[Optimizer] Monthly budget: $', budget.monthlyLimitUSD);
  console.log('  Current spent: $', budget.currentSpentUSD);
  console.log('  Hard cap enabled:', budget.hardCapEnabled);
  console.log();

  const expense = optimizer.recordExpense(0.45);
  console.log('[Optimizer] Recorded $0.45 expense:');
  console.log('  Allowed:', expense.allowed);
  console.log('  Remaining: $', expense.remainingUSD);
  if (expense.warning) console.log('  Warning:', expense.warning);
  console.log();

  const rankedFiles = optimizer.optimizeContext('DeepCLAW AgentIdentity policy', process.cwd());
  console.log(`[Optimizer] Context ranking: ${rankedFiles.length} files selected`);
  for (const file of rankedFiles.slice(0, 5)) {
    console.log(`  - ${file.path} (score: ${file.score}, ~${file.tokens} tokens)`);
  }
  console.log();

  const siemJson = logger.exportSiemJson();
  console.log('[SIEM] Audit log entries:', JSON.parse(siemJson).length);
  console.log('\n=== Example completed successfully ===');
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
