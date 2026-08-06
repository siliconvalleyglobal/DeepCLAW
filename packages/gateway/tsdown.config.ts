import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: 'src/index.ts',
    platform: 'node',
    format: 'esm',
    outDir: 'dist',
    dts: true,
    clean: false,
  },
  {
    entry: 'src/server.ts',
    platform: 'node',
    format: 'esm',
    outDir: 'dist',
    dts: true,
  },
  {
    entry: 'src/cli.ts',
    platform: 'node',
    format: 'esm',
    outDir: 'dist',
    dts: true,
    banner: '#!/usr/bin/env node\n',
  },
]);
