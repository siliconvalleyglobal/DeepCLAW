/**
 * Context Ranker — Ranks and prunes repository files for context efficiency
 */
import * as fs from 'fs';
import * as path from 'path';
export function rankContextFiles(files, prompt, maxTokens = 8000) {
    const promptKeywords = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const ranked = [];
    for (const filePath of files) {
        try {
            const stats = fs.statSync(filePath);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lowerContent = content.toLowerCase();
            const filename = path.basename(filePath).toLowerCase();
            let score = 0;
            let matches = 0;
            for (const kw of promptKeywords) {
                if (filename.includes(kw))
                    score += 10;
                const occurrences = (lowerContent.match(new RegExp(kw, 'g')) || []).length;
                score += Math.min(occurrences * 2, 20);
                if (occurrences > 0)
                    matches++;
            }
            // Estimate tokens (~4 chars per token)
            const tokens = Math.ceil(content.length / 4);
            if (score > 0 || matches > 0) {
                ranked.push({
                    path: filePath,
                    score,
                    tokens,
                    reason: `Matched ${matches} prompt terms with relevance score ${score}`
                });
            }
        }
        catch (e) {
            // Ignore unreadable files
        }
    }
    // Sort by highest score first
    ranked.sort((a, b) => b.score - a.score);
    // Prune to fit within maxTokens ceiling
    let accumulatedTokens = 0;
    const pruned = [];
    for (const item of ranked) {
        if (accumulatedTokens + item.tokens <= maxTokens) {
            pruned.push(item);
            accumulatedTokens += item.tokens;
        }
    }
    return pruned;
}
