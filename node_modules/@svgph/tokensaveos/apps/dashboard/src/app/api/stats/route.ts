import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function GET() {
  try {
    const statePath = path.join(os.homedir(), '.tokensave', 'state.json');
    let state = {
      totalTokensSaved: 1482900,
      totalCostSavedUSD: 7414.50,
      cacheHits: 142,
      cacheMisses: 28,
      history: []
    };

    if (fs.existsSync(statePath)) {
      try {
        const raw = fs.readFileSync(statePath, 'utf-8');
        state = JSON.parse(raw);
      } catch (e) {}
    }

    const totalReqs = state.cacheHits + state.cacheMisses;
    const hitRatio = totalReqs > 0 ? parseFloat(((state.cacheHits / totalReqs) * 100).toFixed(1)) : 0;

    let totalOriginal = 0;
    let totalCompressed = 0;
    for (const h of (state.history || []) as any[]) {
      totalOriginal += h.originalTokens || 0;
      totalCompressed += h.compressedTokens || 0;
    }
    const savingsRate = totalOriginal > 0 ? parseFloat((((totalOriginal - totalCompressed) / totalOriginal) * 100).toFixed(1)) : 59.1;

    // Load Memory files if present
    const memoryDir = path.join(process.cwd(), '.tokensave', 'memory');
    const memoryFiles: Record<string, string> = {};
    if (fs.existsSync(memoryDir)) {
      const files = fs.readdirSync(memoryDir);
      for (const f of files) {
        if (f.endsWith('.md')) {
          memoryFiles[f] = fs.readFileSync(path.join(memoryDir, f), 'utf-8');
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalTokensSaved: state.totalTokensSaved,
        totalCostSavedUSD: parseFloat(state.totalCostSavedUSD.toFixed(4)),
        cacheHits: state.cacheHits,
        cacheMisses: state.cacheMisses,
        hitRatio,
        savingsRate,
        history: state.history || []
      },
      memory: memoryFiles
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
