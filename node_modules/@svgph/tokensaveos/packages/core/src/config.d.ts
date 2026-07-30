/**
 * Configuration & Secret Redaction Engine (Section 10 & 11)
 */
import { TokenSaveConfig } from './types.js';
export declare const DEFAULT_CONFIG: TokenSaveConfig;
export declare function redactSecrets(text: string): string;
export declare function loadConfig(configPath?: string): TokenSaveConfig;
