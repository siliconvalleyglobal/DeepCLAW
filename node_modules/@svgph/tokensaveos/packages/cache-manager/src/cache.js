/**
 * Cache Manager & Savings Persistence (Module 3)
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
export class CacheManager {
    stateFilePath;
    state;
    constructor(customPath) {
        const baseDir = customPath || path.join(os.homedir(), '.tokensave');
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }
        this.stateFilePath = path.join(baseDir, 'state.json');
        this.state = this.loadState();
    }
    loadState() {
        if (fs.existsSync(this.stateFilePath)) {
            try {
                const raw = fs.readFileSync(this.stateFilePath, 'utf-8');
                return JSON.parse(raw);
            }
            catch (e) {
                // fallback default if unparseable
            }
        }
        return {
            totalTokensSaved: 0,
            totalCostSavedUSD: 0,
            cacheHits: 0,
            cacheMisses: 0,
            history: []
        };
    }
    saveState() {
        fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2), 'utf-8');
    }
    checkCache(prompt) {
        const hash = Buffer.from(prompt.trim().toLowerCase()).toString('base64');
        const match = this.state.history.find(h => h.hash === hash);
        if (match) {
            this.state.cacheHits++;
            this.saveState();
            return { hit: true };
        }
        this.state.cacheMisses++;
        this.saveState();
        return { hit: false };
    }
    recordSavings(originalTokens, compressedTokens, costSavedUSD, prompt) {
        const hash = Buffer.from(prompt.trim().toLowerCase()).toString('base64');
        const tokensSaved = Math.max(0, originalTokens - compressedTokens);
        this.state.totalTokensSaved += tokensSaved;
        this.state.totalCostSavedUSD += costSavedUSD;
        this.state.history.push({
            hash,
            originalTokens,
            compressedTokens,
            costSavedUSD,
            timestamp: new Date().toISOString()
        });
        this.saveState();
    }
    annotateCacheBreakpoints(content, provider = 'anthropic') {
        if (provider === 'anthropic') {
            return {
                type: 'text',
                text: content,
                cache_control: { type: 'ephemeral' }
            };
        }
        return content;
    }
    getStats() {
        const totalRequests = this.state.cacheHits + this.state.cacheMisses;
        const hitRatio = totalRequests > 0 ? parseFloat(((this.state.cacheHits / totalRequests) * 100).toFixed(1)) : 0;
        // Total savings rate calculation
        let totalOriginal = 0;
        let totalCompressed = 0;
        for (const h of this.state.history) {
            totalOriginal += h.originalTokens;
            totalCompressed += h.compressedTokens;
        }
        const savingsRate = totalOriginal > 0 ? parseFloat((((totalOriginal - totalCompressed) / totalOriginal) * 100).toFixed(1)) : 0;
        return {
            hits: this.state.cacheHits,
            misses: this.state.cacheMisses,
            hitRatio,
            tokensSaved: this.state.totalTokensSaved,
            costSavedUSD: parseFloat(this.state.totalCostSavedUSD.toFixed(5)),
            savingsRate
        };
    }
}
