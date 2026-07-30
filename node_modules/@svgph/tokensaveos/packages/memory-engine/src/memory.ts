/**
 * Memory Engine System (Module 4)
 * Manages .tokensave/memory/{project.md, architecture.md, decisions.md, dependencies.md, coding-style.md}
 */

import * as fs from 'fs';
import * as path from 'path';
import { redactSecrets } from '@tokensaveos/core';

export type MemoryFileName = 'project.md' | 'architecture.md' | 'decisions.md' | 'dependencies.md' | 'coding-style.md';

export interface ProjectMemoryMap {
  schemaVersion: number;
  files: Record<MemoryFileName, string>;
}

export class MemoryEngine {
  private memoryDir: string;
  private schemaVersion: number = 1;

  constructor(rootDir: string = process.cwd()) {
    this.memoryDir = path.join(rootDir, '.tokensave', 'memory');
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  public loadMemory(): ProjectMemoryMap {
    const memoryFiles: MemoryFileName[] = [
      'project.md',
      'architecture.md',
      'decisions.md',
      'dependencies.md',
      'coding-style.md'
    ];

    const resultFiles: Record<string, string> = {};

    for (const fileName of memoryFiles) {
      const filePath = path.join(this.memoryDir, fileName);
      if (!fs.existsSync(filePath)) {
        const defaultContent = `<!-- schemaVersion: 1 -->\n# ${fileName.replace('.md', '').toUpperCase()}\n\nInitial durable memory log.`;
        fs.writeFileSync(filePath, defaultContent, 'utf-8');
        resultFiles[fileName] = defaultContent;
      } else {
        resultFiles[fileName] = fs.readFileSync(filePath, 'utf-8');
      }
    }

    return {
      schemaVersion: this.schemaVersion,
      files: resultFiles as Record<MemoryFileName, string>
    };
  }

  public updateMemoryFile(fileName: MemoryFileName, content: string): string {
    const filePath = path.join(this.memoryDir, fileName);
    const sanitized = redactSecrets(content);
    const contentWithHeader = `<!-- schemaVersion: ${this.schemaVersion} -->\n` + sanitized;
    fs.writeFileSync(filePath, contentWithHeader, 'utf-8');
    return contentWithHeader;
  }
}
