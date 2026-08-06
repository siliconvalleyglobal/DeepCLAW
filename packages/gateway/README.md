# @svgph/gateway

REST API and WebSocket gateway for DeepCLAW.

## Features

- RESTful API for workflows, credentials, templates, and schedules
- WebSocket gateway for real-time execution monitoring
- Pre-execution policy enforcement
- Workflow import/export
- Credential management
- Template instantiation

## Installation

```bash
npm install @deepclaw/gateway
```

## Usage

```typescript
import { DeepClawGateway } from '@svgph/gateway';

const gateway = new DeepClawGateway({
  port: 3000,
  policyEngine: new PreExecutionPolicyEngine(),
});

const app = gateway.getApp();
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
