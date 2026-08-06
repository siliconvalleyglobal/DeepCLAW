# @svgph/sdk

Node.js/TypeScript SDK for DeepCLAW.

## Features

- Token optimization and prompt compression
- Data Loss Prevention (DLP) engine
- Token budget tracking
- Repository context ranking
- Secret redaction

## Installation

```bash
npm install @deepclaw/sdk
```

## Usage

```typescript
import { DeepClawOptimizer, DLPEngine, TokenBudgetGuard } from '@svgph/sdk';

const optimizer = new DeepClawOptimizer({ contextMaxTokens: 8000 });
const compressed = optimizer.optimizePrompt('Can you please analyze this code...');

const dlp = new DLPEngine();
const clean = dlp.sanitize('My SSN is 123-45-6789');

const guard = new TokenBudgetGuard({ maxTokensPerMinute: 60000, maxUsdPerDay: 50 });
const allowed = guard.checkAndRecord('tenant-1', 1200);
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
