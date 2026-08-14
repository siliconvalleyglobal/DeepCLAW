import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/gateway/index.ts',
    server: 'src/gateway/server.ts',
    cli: 'src/gateway/cli.ts',
  },
  platform: 'node',
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  banner: {
    cli: '#!/usr/bin/env node\n',
  },
});
