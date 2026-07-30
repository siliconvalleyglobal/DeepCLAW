import { describe, it, expect } from 'vitest';
import { scanRepository, rankContextFiles } from '../src/index.js';
import * as path from 'path';
describe('Context Engine Scanner & Ranker', () => {
    it('should scan files while excluding sensitive .env and git files', () => {
        const files = scanRepository(process.cwd());
        expect(files.every(f => !f.endsWith('.env'))).toBe(true);
    });
    it('should rank context files based on prompt keyword match', () => {
        const sampleFiles = [
            path.join(process.cwd(), 'package.json'),
            path.join(process.cwd(), 'tokensave.config.json')
        ];
        const ranked = rankContextFiles(sampleFiles, 'tokensave config', 8000);
        expect(ranked.length).toBeGreaterThan(0);
    });
});
