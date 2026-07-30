/**
 * Team Cloud Sync & Encrypted Vault Exporter (Feature 5)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

export interface SyncPayload {
  exportTimestamp: number;
  hostname: string;
  totalTokensSaved: number;
  totalCostSavedUSD: number;
  signature: string;
}

export class VaultSync {
  public static exportSyncPayload(secretKey: string = "tokensave_enterprise_secret"): SyncPayload {
    const statePath = path.join(os.homedir(), '.tokensave', 'state.json');
    let state = { totalTokensSaved: 0, totalCostSavedUSD: 0 };
    if (fs.existsSync(statePath)) {
      try {
        state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      } catch (e) {}
    }

    const ts = Date.now();
    const hostname = os.hostname();
    const payloadStr = `${hostname}:${ts}:${state.totalTokensSaved}:${state.totalCostSavedUSD}`;
    const signature = crypto.createHmac('sha256', secretKey).update(payloadStr).digest('hex');

    return {
      exportTimestamp: ts,
      hostname,
      totalTokensSaved: state.totalTokensSaved || 0,
      totalCostSavedUSD: state.totalCostSavedUSD || 0,
      signature
    };
  }
}
