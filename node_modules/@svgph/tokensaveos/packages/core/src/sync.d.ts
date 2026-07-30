/**
 * Team Cloud Sync & Encrypted Vault Exporter (Feature 5)
 */
export interface SyncPayload {
    exportTimestamp: number;
    hostname: string;
    totalTokensSaved: number;
    totalCostSavedUSD: number;
    signature: string;
}
export declare class VaultSync {
    static exportSyncPayload(secretKey?: string): SyncPayload;
}
