/**
 * Context Ranker — Ranks and prunes repository files for context efficiency
 */
import { RankedFile } from '@tokensaveos/core';
export declare function rankContextFiles(files: string[], prompt: string, maxTokens?: number): RankedFile[];
