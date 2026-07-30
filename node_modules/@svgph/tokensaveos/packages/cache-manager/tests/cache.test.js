import { describe, it, expect } from 'vitest';
import { CacheManager } from '../src/index.js';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
describe('Cache Manager Prompt Breakpoints', () => {
    it('should annotate cache breakpoints for Anthropic provider', () => {
        const tmpDir = path.join(os.tmpdir(), 'tokensave-cache-test-1');
        const mgr = new CacheManager(tmpDir);
        const annotated = mgr.annotateCacheBreakpoints("System Prompt", "anthropic");
        expect(annotated.cache_control).toBeDefined();
        expect(annotated.cache_control.type).toBe('ephemeral');
    });
    it('should track prompt cache hits and record persistent savings', () => {
        const tmpDir = path.join(os.tmpdir(), 'tokensave-cache-test-2');
        if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
        const mgr = new CacheManager(tmpDir);
        const prompt = "Durable Architecture Prompt";
        expect(mgr.checkCache(prompt).hit).toBe(false); // 1 miss
        mgr.recordSavings(100, 40, 0.00018, prompt);
        expect(mgr.checkCache(prompt).hit).toBe(true); // 1 hit
        const stats = mgr.getStats();
        expect(stats.hits).toBe(1);
        expect(stats.misses).toBe(1);
        expect(stats.tokensSaved).toBeGreaterThan(0);
    });
});
