/**
 * MCP Gateway & Stdio Server Transport (Module 8)
 */
export declare class TokenSaveMCPServer {
    private server;
    private memory;
    private cache;
    constructor();
    private setupHandlers;
    startStdio(): Promise<void>;
}
