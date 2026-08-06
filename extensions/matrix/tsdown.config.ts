import { defineConfig } from 'tsdown';
export default defineConfig([
  { entry: 'src/index.ts', platform: 'node', format: 'esm', outDir: 'dist', dts: true, clean: true },
  { entry: 'src/index.ts', platform: 'node', format: 'cjs', outDir: 'dist', dts: true },
]);