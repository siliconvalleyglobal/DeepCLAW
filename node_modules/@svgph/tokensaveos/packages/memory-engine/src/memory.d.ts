/**
 * Memory Engine System (Module 4)
 * Manages .tokensave/memory/{project.md, architecture.md, decisions.md, dependencies.md, coding-style.md}
 */
export type MemoryFileName = 'project.md' | 'architecture.md' | 'decisions.md' | 'dependencies.md' | 'coding-style.md';
export interface ProjectMemoryMap {
    schemaVersion: number;
    files: Record<MemoryFileName, string>;
}
export declare class MemoryEngine {
    private memoryDir;
    private schemaVersion;
    constructor(rootDir?: string);
    loadMemory(): ProjectMemoryMap;
    updateMemoryFile(fileName: MemoryFileName, content: string): string;
}
