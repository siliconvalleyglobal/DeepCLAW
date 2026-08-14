import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface AgentIdentityOptions {
  name: string;
  roles?: string[];
  channelOrigin?: string | null;
  permissionCeiling?: string;
}

export interface PolicyDecision {
  decisionId: string;
  timestamp: number;
  agentId: string;
  action: string;
  permitted: boolean;
  reasoningTrace: string;
  violations: string[];
}

export interface CompressionResult {
  compressedText: string;
  originalTokens: number;
  compressedTokens: number;
  tokensSaved: number;
  compressionRatio: number;
  estimatedSavingsUSD: number;
}

export interface RankedFile {
  path: string;
  score: number;
  tokens: number;
  reason: string;
}

export interface BudgetConfig {
  monthlyLimitUSD: number;
  currentSpentUSD: number;
  alertThresholdPercent: number;
  hardCapEnabled: boolean;
}

export interface DeepClawOptimizerOptions {
  configPath?: string;
  contextMaxTokens?: number;
  ignorePatterns?: string[];
}

export interface ProviderRates {
  [provider: string]: {
    inputPer1k: number;
    outputPer1k: number;
  };
}

const PROVIDER_RATES: ProviderRates = {
  anthropic: { inputPer1k: 0.003, outputPer1k: 0.015 },
  openai: { inputPer1k: 0.0025, outputPer1k: 0.01 },
  ollama: { inputPer1k: 0.0, outputPer1k: 0.0 },
};

const SENSITIVE_FILES: string[] = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  'secrets.json',
  'credentials.json',
  'id_rsa',
  'id_ed25519',
  'secrets.env',
];

const DEFAULT_CONFIG = {
  context: { maxTokens: 8000, ignorePatterns: ['*.test.*', 'node_modules/*', '.git/*', 'dist/*'] },
  compression: { aggressivePrune: true, removeComments: true, minifyJson: true, stripWhitespace: true },
};

const DEFAULT_BUDGET: BudgetConfig = {
  monthlyLimitUSD: 100.0,
  currentSpentUSD: 0.0,
  alertThresholdPercent: 80.0,
  hardCapEnabled: true,
};

function loadConfig(configPath?: string): typeof DEFAULT_CONFIG {
  if (configPath && fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      // ignore parse errors
    }
  }
  return DEFAULT_CONFIG;
}

function scanRepository(rootDir: string, ignorePatterns: string[] = []): string[] {
  const fileList: string[] = [];

  function traverse(currentDir: string): void {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (
        SENSITIVE_FILES.some(
          (sec) =>
            entry.name.toLowerCase() === sec.toLowerCase() ||
            relativePath.toLowerCase().includes(sec)
        )
      ) {
        continue;
      }

      if (ignorePatterns.some((pattern) => relativePath.includes(pattern.replace('*', '')))) {
        continue;
      }

      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        fileList.push(fullPath);
      }
    }
  }

  traverse(rootDir);
  return fileList;
}

function rankContextFiles(files: string[], prompt: string, maxTokens = 8000): RankedFile[] {
  const promptKeywords = prompt.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const ranked: RankedFile[] = [];

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lowerContent = content.toLowerCase();
      const filename = path.basename(filePath).toLowerCase();
      let score = 0;
      let matches = 0;

      for (const kw of promptKeywords) {
        if (filename.includes(kw)) score += 10;
        const occurrences = (lowerContent.match(new RegExp(kw, 'g')) || []).length;
        score += Math.min(occurrences * 2, 20);
        if (occurrences > 0) matches++;
      }

      const tokens = Math.ceil(content.length / 4);

      if (score > 0 || matches > 0) {
        ranked.push({
          path: filePath,
          score,
          tokens,
          reason: `Matched ${matches} prompt terms with relevance score ${score}`,
        });
      }
    } catch {
      // skip unreadable files
    }
  }

  ranked.sort((a, b) => b.score - a.score);

  let accumulatedTokens = 0;
  const pruned: RankedFile[] = [];

  for (const item of ranked) {
    if (accumulatedTokens + item.tokens <= maxTokens) {
      pruned.push(item);
      accumulatedTokens += item.tokens;
    }
  }

  return pruned;
}

function estimateProviderTokens(text: string, provider = 'anthropic'): number {
  if (!text || text.trim().length === 0) return 0;

  if (provider === 'anthropic') {
    return Math.ceil(text.length / 3.5);
  }

  if (provider === 'openai') {
    return Math.ceil(text.length / 4);
  }

  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  return Math.max(1, Math.round(words * 1.3 + (chars - words * 5) * 0.2));
}

interface CompressOptions {
  stripWhitespace?: boolean;
  removeComments?: boolean;
  minifyJson?: boolean;
  aggressivePrune?: boolean;
  provider?: string;
}

function compressPrompt(rawText: string, options: CompressOptions = {}): CompressionResult {
  const {
    stripWhitespace = true,
    removeComments = true,
    minifyJson = true,
    aggressivePrune = true,
    provider = 'anthropic',
  } = options;

  let text = rawText || '';
  const originalTokens = estimateProviderTokens(text, provider);

  if (originalTokens === 0) {
    return {
      compressedText: '',
      originalTokens: 0,
      compressedTokens: 0,
      tokensSaved: 0,
      compressionRatio: 0,
      estimatedSavingsUSD: 0,
    };
  }

  if (minifyJson) {
    text = text.replace(/```json\s*([\s\S]*?)\s*```/g, (match, jsonStr) => {
      try {
        return '```json\n' + JSON.stringify(JSON.parse(jsonStr)) + '\n```';
      } catch {
        return match;
      }
    });
  }

  if (removeComments) {
    text = text.replace(/\/\*[\s\S]*?\*\//g, '');
    text = text.replace(/(^|\s)#\s+[^\n]*/g, '$1');
  }

  if (aggressivePrune) {
    const fillerPatterns = [
      /\bcan you please\b/gi,
      /\bcould you kindly\b/gi,
      /\bplease kindly\b/gi,
      /\bcan you\b/gi,
      /\bplease\b/gi,
      /\bkindly\b/gi,
      /\bas an ai\b/gi,
      /\bas mentioned before\b/gi,
      /\bfor your information\b/gi,
      /\bin order to\b/gi,
      /\bat this point in time\b/gi,
      /\bwhat improvements can be made\b/gi,
    ];
    for (const rx of fillerPatterns) {
      text = text.replace(rx, '');
    }
    text = text.replace(/\s+/g, ' ');
  }

  if (stripWhitespace) {
    text = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
  }

  const compressedTokens = estimateProviderTokens(text, provider);
  const tokensSaved = Math.max(0, originalTokens - compressedTokens);
  const compressionRatio =
    originalTokens > 0 ? parseFloat(((tokensSaved / originalTokens) * 100).toFixed(1)) : 0;
  const rate = PROVIDER_RATES[provider]?.inputPer1k ?? 0;
  const estimatedSavingsUSD = parseFloat(((tokensSaved / 1000) * rate).toFixed(5));

  return {
    compressedText: text,
    originalTokens,
    compressedTokens,
    tokensSaved,
    compressionRatio,
    estimatedSavingsUSD,
  };
}

class BudgetManager {
  private budgetPath: string;

  constructor() {
    const dir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.deepclaw');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.budgetPath = path.join(dir, 'budget.json');
  }

  getBudget(): BudgetConfig {
    if (fs.existsSync(this.budgetPath)) {
      try {
        return { ...DEFAULT_BUDGET, ...JSON.parse(fs.readFileSync(this.budgetPath, 'utf-8')) };
      } catch {
        // ignore parse errors
      }
    }
    return { ...DEFAULT_BUDGET };
  }

  setLimit(monthlyLimitUSD: number): BudgetConfig {
    const current = this.getBudget();
    current.monthlyLimitUSD = monthlyLimitUSD;
    fs.writeFileSync(this.budgetPath, JSON.stringify(current, null, 2), 'utf-8');
    return current;
  }

  recordExpense(amountUSD: number): { allowed: boolean; remainingUSD: number; warning?: string } {
    const b = this.getBudget();
    b.currentSpentUSD = parseFloat((b.currentSpentUSD + amountUSD).toFixed(5));
    fs.writeFileSync(this.budgetPath, JSON.stringify(b, null, 2), 'utf-8');

    const remainingUSD = Math.max(0, b.monthlyLimitUSD - b.currentSpentUSD);
    const spentPercent = (b.currentSpentUSD / b.monthlyLimitUSD) * 100;
    let warning: string | undefined;

    if (spentPercent >= b.alertThresholdPercent) {
      warning = `[Budget Alert] ${spentPercent.toFixed(1)}% of monthly budget ($${b.monthlyLimitUSD}) consumed!`;
    }

    if (b.hardCapEnabled && b.currentSpentUSD > b.monthlyLimitUSD) {
      return {
        allowed: false,
        remainingUSD: 0,
        warning: `[Hard Cap Reached] Monthly token budget limit of $${b.monthlyLimitUSD} exceeded!`,
      };
    }

    return { allowed: true, remainingUSD, warning };
  }
}

export class AgentIdentity {
  agentId: string;
  name: string;
  roles: string[];
  channelOrigin: string | null;
  permissionCeiling: string;

  constructor(options: AgentIdentityOptions) {
    this.agentId = `agent-${Date.now()}`;
    this.name = options.name;
    this.roles = options.roles ?? ['agent'];
    this.channelOrigin = options.channelOrigin ?? null;
    this.permissionCeiling = options.permissionCeiling ?? 'restricted';
  }
}

export class PreExecutionPolicyEngine {
  private rolePermissions: Record<string, string[]> = {
    admin: ['*'],
    workflow_operator: ['read', 'write', 'mcp_*', 'a2a:*'],
    restricted_agent: ['read'],
    external_channel: ['read_public', 'send_reply'],
  };

  evaluateToolCall(identity: AgentIdentity, toolName: string): PolicyDecision {
    const roles = identity.roles.length > 0 ? identity.roles : ['restricted_agent'];
    let permitted = false;

    for (const r of roles) {
      const perms = this.rolePermissions[r] ?? [];
      if (perms.includes('*') || perms.includes(toolName)) {
        permitted = true;
        break;
      }
      for (const p of perms) {
        if (p.endsWith('*') && toolName.startsWith(p.slice(0, -1))) {
          permitted = true;
          break;
        }
      }
      if (permitted) break;
    }

    return {
      decisionId: `dec-${Date.now()}`,
      timestamp: Date.now() / 1000,
      agentId: identity.agentId,
      action: toolName,
      permitted,
      reasoningTrace: permitted
        ? `PERMITTED: Action '${toolName}' authorized.`
        : `DENIED: Pre-execution policy check failed for '${toolName}'.`,
      violations: permitted ? [] : [`Role(s) ${roles.join(', ')} lack permission for '${toolName}'`],
    };
  }
}

export class SIEMAuditLogger {
  private records: unknown[] = [];

  logDecision(decision: PolicyDecision, metadata: Record<string, unknown> = {}): Record<string, unknown> {
    const record = {
      eventType: 'GOVERNANCE_POLICY_EVALUATION',
      timestamp: decision.timestamp,
      decisionId: decision.decisionId,
      action: decision.action,
      permitted: decision.permitted,
      reasoningTrace: decision.reasoningTrace,
      metadata,
    };
    this.records.push(record);
    return record;
  }

  exportSiemJson(): string {
    return JSON.stringify(this.records, null, 2);
  }
}

export class TokenBudgetGuard {
  private maxTokensPerMinute: number;
  private maxUsdPerDay: number;
  private records: Array<{ tenantId: string; tokens: number; costUsd: number; timestamp: number }>;

  constructor(options: { maxTokensPerMinute?: number; maxUsdPerDay?: number } = {}) {
    this.maxTokensPerMinute = options.maxTokensPerMinute ?? 60000;
    this.maxUsdPerDay = options.maxUsdPerDay ?? 50.0;
    this.records = [];
  }

  checkAndRecord(tenantId: string, tokens: number, costUsd = 0): { allowed: boolean; reason: string } {
    const now = Date.now();
    const oneMinAgo = now - 60000;
    const tokensLastMin = this.records
      .filter((r) => r.timestamp > oneMinAgo && r.tenantId === tenantId)
      .reduce((sum, r) => sum + r.tokens, 0);

    if (tokensLastMin + tokens > this.maxTokensPerMinute) {
      return {
        allowed: false,
        reason: `Rate Limit Exceeded (${tokensLastMin + tokens} > ${this.maxTokensPerMinute})`,
      };
    }

    this.records.push({ tenantId, tokens, costUsd, timestamp: now });
    return { allowed: true, reason: 'Usage approved' };
  }
}

export class DLPEngine {
  private patterns: Array<{ name: string; regex: RegExp; replacement: string }> = [
    { name: 'SSN', regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[REDACTED_SSN]' },
    {
      name: 'EMAIL',
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[REDACTED_EMAIL]',
    },
    { name: 'API_KEY', regex: /(?:sk-proj-|sk-ant-|gsk_)[a-zA-Z0-9_-]{20,}/g, replacement: '[REDACTED_API_KEY]' },
  ];

  sanitize(text: string): { sanitizedText: string; matchesFound: number } {
    let sanitized = text;
    let matchesCount = 0;

    for (const rule of this.patterns) {
      const matches = sanitized.match(rule.regex);
      if (matches) {
        matchesCount += matches.length;
        sanitized = sanitized.replace(rule.regex, rule.replacement);
      }
    }

    return { sanitizedText: sanitized, matchesFound: matchesCount };
  }
}

export interface InjectionScanResult {
  isSafe: boolean;
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  matchedPatterns: string[];
  sanitizedPrompt?: string;
  reason?: string;
}

export class PromptInjectionGuard {
  private injectionPatterns: Array<{ name: string; regex: RegExp; severity: 'low' | 'medium' | 'high' | 'critical' }> = [
    { name: 'SYSTEM_PROMPT_OVERRIDE', regex: /(?:ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions|disregard\s+(?:all\s+)?guidelines)/i, severity: 'critical' },
    { name: 'ROLEPLAY_JAILBREAK', regex: /(?:you\s+are\s+now\s+dan|do\s+anything\s+now|developer\s+mode\s+enabled|jailbreak\s+mode)/i, severity: 'critical' },
    { name: 'PROMPT_LEAK_EXTRACTION', regex: /(?:repeat\s+(?:the\s+)?(?:entire\s+)?system\s+prompt|what\s+are\s+your\s+hidden\s+rules|print\s+initial\s+instructions)/i, severity: 'high' },
    { name: 'DELIMITER_HIJACK', regex: /(?:<\/?(?:system|instruction|admin|im_start|im_end)>|```(?:system|admin))/i, severity: 'high' },
    { name: 'BASE64_EVASION_TRIGGER', regex: /(?:execute|decode|eval)\s+(?:base64|hex|encoded)\s*:/i, severity: 'medium' },
  ];

  scan(prompt: string): InjectionScanResult {
    const matched: string[] = [];
    let highestSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';

    for (const pattern of this.injectionPatterns) {
      if (pattern.regex.test(prompt)) {
        matched.push(pattern.name);
        if (pattern.severity === 'critical' || highestSeverity === 'none') {
          highestSeverity = pattern.severity;
        }
      }
    }

    if (matched.length > 0) {
      return {
        isSafe: false,
        threatLevel: highestSeverity,
        matchedPatterns: matched,
        reason: `Potential adversarial prompt injection detected: ${matched.join(', ')}`,
      };
    }

    return {
      isSafe: true,
      threatLevel: 'none',
      matchedPatterns: [],
    };
  }

  sanitize(prompt: string): string {
    let cleaned = prompt;
    for (const pattern of this.injectionPatterns) {
      cleaned = cleaned.replace(pattern.regex, '[REDACTED_ADVERSARIAL_INSTRUCTION]');
    }
    return cleaned;
  }
}

export interface GraphEntity {
  id: string;
  name: string;
  type: string;
  properties?: Record<string, unknown>;
}

export interface GraphRelationship {
  sourceId: string;
  targetId: string;
  relation: string;
  metadata?: Record<string, unknown>;
}

export class KnowledgeGraphMemory {
  private entities = new Map<string, GraphEntity>();
  private relationships: GraphRelationship[] = [];

  addEntity(entity: GraphEntity): void {
    this.entities.set(entity.id, entity);
  }

  getEntity(id: string): GraphEntity | undefined {
    return this.entities.get(id);
  }

  addRelationship(rel: GraphRelationship): void {
    this.relationships.push(rel);
  }

  findRelated(entityId: string): Array<{ relation: string; entity: GraphEntity }> {
    const results: Array<{ relation: string; entity: GraphEntity }> = [];
    for (const rel of this.relationships) {
      if (rel.sourceId === entityId) {
        const target = this.entities.get(rel.targetId);
        if (target) results.push({ relation: rel.relation, entity: target });
      } else if (rel.targetId === entityId) {
        const source = this.entities.get(rel.sourceId);
        if (source) results.push({ relation: `inverse_${rel.relation}`, entity: source });
      }
    }
    return results;
  }

  exportGraph(): { entities: GraphEntity[]; relationships: GraphRelationship[] } {
    return {
      entities: Array.from(this.entities.values()),
      relationships: [...this.relationships],
    };
  }
}

export class DeepClawOptimizer {
  private config: typeof DEFAULT_CONFIG;
  private budgetManager: BudgetManager;
  private contextMaxTokens: number;
  private ignorePatterns: string[];

  constructor(options: DeepClawOptimizerOptions = {}) {
    this.config = loadConfig(options.configPath);
    this.budgetManager = new BudgetManager();
    this.contextMaxTokens = options.contextMaxTokens ?? this.config.context?.maxTokens ?? 8000;
    this.ignorePatterns = options.ignorePatterns ?? this.config.context?.ignorePatterns ?? [
      '*.test.*',
      'node_modules/*',
      '.git/*',
      'dist/*',
    ];
  }

  optimizePrompt(text: string, options: CompressOptions = {}): CompressionResult {
    const provider = options.provider ?? 'anthropic';
    const opts: CompressOptions = {
      stripWhitespace: options.stripWhitespace ?? this.config.compression?.stripWhitespace ?? true,
      removeComments: options.removeComments ?? this.config.compression?.removeComments ?? true,
      minifyJson: options.minifyJson ?? this.config.compression?.minifyJson ?? true,
      aggressivePrune: options.aggressivePrune ?? this.config.compression?.aggressivePrune ?? true,
      provider,
    };
    return compressPrompt(text, opts);
  }

  optimizeContext(prompt: string, rootDir = process.cwd()): RankedFile[] {
    const files = scanRepository(rootDir, this.ignorePatterns);
    return rankContextFiles(files, prompt, this.contextMaxTokens);
  }

  redactSecrets(text: string): string {
    const patterns = [
      /sk-[a-zA-Z0-9]{20,}/g,
      /npm_[a-zA-Z0-9]{30,}/g,
      /ghp_[a-zA-Z0-9]{30,}/g,
      /bearer\s+[a-zA-Z0-9\-_.=]+/gi,
      /(password|secret|apikey|api_key)\s*[:=]\s*["']?[^"'\s]+["']?/gi,
    ];
    let sanitized = text || '';
    for (const pattern of patterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
    }
    return sanitized;
  }

  recordExpense(amountUSD: number): { allowed: boolean; remainingUSD: number; warning?: string } {
    return this.budgetManager.recordExpense(amountUSD);
  }

  getBudget(): BudgetConfig {
    return this.budgetManager.getBudget();
  }

  setBudgetLimit(monthlyLimitUSD: number): BudgetConfig {
    return this.budgetManager.setLimit(monthlyLimitUSD);
  }

  estimateTokens(text: string, provider = 'anthropic'): number {
    return estimateProviderTokens(text, provider);
  }

  calculateCost(tokens: number, provider = 'anthropic', type = 'input'): number {
    const rate = type === 'input' ? PROVIDER_RATES[provider].inputPer1k : PROVIDER_RATES[provider].outputPer1k;
    return parseFloat(((tokens / 1000) * rate).toFixed(5));
  }
}

export * from './streaming.js';
