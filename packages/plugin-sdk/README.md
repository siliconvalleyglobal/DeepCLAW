# @svgph/plugin-sdk

Plugin development toolkit for DeepCLAW.

## Features

- Plugin lifecycle management
- Extension point definitions
- Type-safe plugin interfaces
- Configuration validation

## Installation

```bash
npm install @deepclaw/plugin-sdk
```

## Usage

```typescript
import { PluginManager, Plugin } from '@svgph/plugin-sdk';

const manager = new PluginManager();
const plugin = new Plugin({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  initialize: async (context) => {
    console.log('Plugin initialized');
  },
});

manager.register(plugin);
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
