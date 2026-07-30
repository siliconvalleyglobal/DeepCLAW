/**
 * Repository Scanner with Security Filter
 */

import * as fs from 'fs';
import * as path from 'path';

const SENSITIVE_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  'secrets.json',
  'credentials.json',
  'id_rsa',
  'id_ed25519',
  'secrets.env'
];

export function scanRepository(rootDir: string, ignorePatterns: string[] = []): string[] {
  const fileList: string[] = [];

  function traverse(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      // Check security ignore rules
      if (SENSITIVE_FILES.some(sec => entry.name.toLowerCase() === sec.toLowerCase() || relativePath.toLowerCase().includes(sec))) {
        continue;
      }

      // Check configured ignore patterns
      if (ignorePatterns.some(pattern => relativePath.includes(pattern.replace('*', '')))) {
        continue;
      }

      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        fileList.push(fullPath);
      }
    }
  }

  traverse(rootDir);
  return fileList;
}
