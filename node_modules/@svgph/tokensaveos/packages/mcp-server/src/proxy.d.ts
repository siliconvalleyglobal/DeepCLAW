/**
 * TokenSaveOS Zero-Code LLM API Proxy Server (Feature 1)
 * Intercepts OpenAI/Anthropic API requests, compresses prompts on the fly,
 * records token savings to ~/.tokensave/state.json, and forwards requests upstream.
 */
import * as http from 'http';
export declare function startLLMProxy(port?: number): http.Server;
