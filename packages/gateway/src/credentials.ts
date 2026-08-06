import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface Credential {
  id: string;
  name: string;
  type: 'api_key' | 'bearer_token' | 'basic_auth' | 'oauth2' | 'custom';
  data: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
}

export class CredentialManager {
  private storePath: string;
  private encryptionKey: Buffer;
  private cache: Map<string, Credential> = new Map();

  constructor(storeDir: string, encryptionKey?: Buffer) {
    this.storePath = path.join(storeDir, 'credentials.json');
    this.encryptionKey = encryptionKey || this._deriveKey('deepclaw-local-encryption');
    fs.mkdirSync(storeDir, { recursive: true });
    this._load();
  }

  create(name: string, type: Credential['type'], data: Record<string, string>): Credential {
    const credential: Credential = {
      id: `cred-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`,
      name,
      type,
      data: this._encryptFields(data),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.cache.set(credential.id, credential);
    this._persist();
    return credential;
  }

  get(id: string): Credential | null {
    const credential = this.cache.get(id);
    if (!credential) return null;
    return {
      ...credential,
      data: this._decryptFields(credential.data),
      lastUsedAt: Date.now(),
    };
  }

  list(): Credential[] {
    return Array.from(this.cache.values()).map((c) => ({
      ...c,
      data: this._decryptFields(c.data),
    }));
  }

  update(id: string, updates: Partial<Pick<Credential, 'name' | 'type' | 'data'>>): Credential | null {
    const existing = this.cache.get(id);
    if (!existing) return null;

    const updated: Credential = {
      ...existing,
      ...updates,
      data: updates.data ? this._encryptFields(updates.data) : existing.data,
      updatedAt: Date.now(),
    };
    this.cache.set(id, updated);
    this._persist();
    return updated;
  }

  delete(id: string): boolean {
    const deleted = this.cache.delete(id);
    if (deleted) this._persist();
    return deleted;
  }

  private _load(): void {
    if (!fs.existsSync(this.storePath)) return;
    try {
      const raw = JSON.parse(fs.readFileSync(this.storePath, 'utf-8'));
      for (const [id, credential] of Object.entries(raw)) {
        this.cache.set(id, credential as Credential);
      }
    } catch {
      this.cache.clear();
    }
  }

  private _persist(): void {
    const serialized = Object.fromEntries(this.cache.entries());
    fs.writeFileSync(this.storePath, JSON.stringify(serialized, null, 2), 'utf-8');
  }

  private _encryptFields(data: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = this._encrypt(value);
    }
    return result;
  }

  private _decryptFields(data: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      try {
        result[key] = this._decrypt(value);
      } catch {
        result[key] = '[ENCRYPTED]';
      }
    }
    return result;
  }

  private _encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private _decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf-8');
  }

  private _deriveKey(password: string): Buffer {
    return crypto.pbkdf2Sync(password, 'deepclaw-salt', 100000, 32, 'sha256');
  }
}
