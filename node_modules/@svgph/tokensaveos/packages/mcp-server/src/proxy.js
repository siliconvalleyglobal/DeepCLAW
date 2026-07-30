/**
 * TokenSaveOS Zero-Code LLM API Proxy Server (Feature 1)
 * Intercepts OpenAI/Anthropic API requests, compresses prompts on the fly,
 * records token savings to ~/.tokensave/state.json, and forwards requests upstream.
 */
import * as http from 'http';
import * as https from 'https';
import { compressPrompt } from '@tokensaveos/token-engine';
import { CacheManager } from '@tokensaveos/cache-manager';
export function startLLMProxy(port = 8080) {
    const cache = new CacheManager();
    const server = http.createServer((req, res) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            let reqPath = req.url || '/';
            let targetHost = 'api.openai.com';
            let isAnthropic = false;
            if (req.headers['x-api-key'] || reqPath.includes('/v1/messages')) {
                targetHost = 'api.anthropic.com';
                isAnthropic = true;
            }
            let modifiedBody = body;
            try {
                if (body && req.method === 'POST') {
                    const parsed = JSON.parse(body);
                    let rawText = '';
                    if (parsed.messages && Array.isArray(parsed.messages)) {
                        const lastMsg = parsed.messages[parsed.messages.length - 1];
                        if (lastMsg && lastMsg.content && typeof lastMsg.content === 'string') {
                            rawText = lastMsg.content;
                            const res = compressPrompt(rawText);
                            lastMsg.content = res.compressedText;
                            cache.recordSavings(res.originalTokens, res.compressedTokens, res.estimatedSavingsUSD, rawText);
                            modifiedBody = JSON.stringify(parsed);
                        }
                    }
                    else if (parsed.prompt && typeof parsed.prompt === 'string') {
                        rawText = parsed.prompt;
                        const res = compressPrompt(rawText);
                        parsed.prompt = res.compressedText;
                        cache.recordSavings(res.originalTokens, res.compressedTokens, res.estimatedSavingsUSD, rawText);
                        modifiedBody = JSON.stringify(parsed);
                    }
                }
            }
            catch (e) {
                // Fall back to raw body if parse fails
            }
            const headers = {};
            for (const [k, v] of Object.entries(req.headers)) {
                if (k.toLowerCase() !== 'host' && k.toLowerCase() !== 'content-length' && v) {
                    headers[k] = Array.isArray(v) ? v.join(', ') : v;
                }
            }
            headers['host'] = targetHost;
            headers['content-length'] = String(Buffer.byteLength(modifiedBody));
            const options = {
                hostname: targetHost,
                port: 443,
                path: reqPath,
                method: req.method,
                headers
            };
            const proxyReq = https.request(options, upstreamRes => {
                res.writeHead(upstreamRes.statusCode || 200, upstreamRes.headers);
                upstreamRes.pipe(res, { end: true });
            });
            proxyReq.on('error', err => {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Proxy Upstream Error', details: err.message }));
            });
            proxyReq.write(modifiedBody);
            proxyReq.end();
        });
    });
    server.listen(port, () => {
        console.log(`\x1b[32m[+] TokenSaveOS LLM API Proxy running on http://localhost:${port}\x1b[0m`);
        console.log(`\x1b[36m[!] Set OPENAI_BASE_URL=http://localhost:${port}/v1 for zero-code automatic prompt compression!\x1b[0m`);
    });
    return server;
}
