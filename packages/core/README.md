# @svgph/core

Enterprise workflow orchestration engine for DeepCLAW.

## Features

- Workflow definition and execution engine
- Expression engine with variable interpolation
- Secure sandboxed code execution
- Cron-based workflow scheduling
- Workflow templates and instantiation
- Credential management
- Sub-workflow invocation
- Retry and error handling

## Installation

```bash
npm install @deepclaw/core
```

## Usage

```typescript
import { WorkflowRunner, WorkflowPersistence, ExpressionEngine } from '@svgph/core';

const persistence = new WorkflowPersistence('./data');
const runner = new WorkflowRunner(persistence);

const workflow = {
  id: 'wf-001',
  name: 'My Workflow',
  version: '1.0.0',
  steps: [
    { name: 'step1', action: 'transform.json', input: { text: 'hello' } },
    { name: 'step2', action: 'transform.uppercase', input: { text: 'world' } },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const result = await runner.execute('run-001');
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
