import { describe, test, expect } from 'vitest';
import { CredentialManager } from '../../gateway/src/credentials.js';

describe('CredentialManager', () => {
  test('creates and retrieves credential', async () => {
    const dir = '/tmp/deepclaw-test-cred-create-' + Date.now();
    const manager = new CredentialManager(dir);
    const created = manager.create('api-key', 'api_key', { key: 'secret-123' });
    expect(created.id).toBeDefined();
    expect(created.name).toBe('api-key');

    const retrieved = manager.get(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('api-key');
    expect(retrieved?.data.key).toBe('secret-123');
  });

  test('lists credentials', async () => {
    const dir = '/tmp/deepclaw-test-cred-list-' + Date.now();
    const manager = new CredentialManager(dir);
    manager.create('token-a', 'bearer_token', { token: 'aaa' });
    manager.create('token-b', 'bearer_token', { token: 'bbb' });

    const list = manager.list();
    expect(list).toHaveLength(2);
  });

  test('updates credential', async () => {
    const dir = '/tmp/deepclaw-test-cred-update-' + Date.now();
    const manager = new CredentialManager(dir);
    const created = manager.create('updatable', 'basic_auth', { username: 'user', password: 'pass' });

    manager.update(created.id, { data: { username: 'user', password: 'new-pass' } });
    const updated = manager.get(created.id);
    expect(updated?.data.password).toBe('new-pass');
  });

  test('deletes credential', async () => {
    const dir = '/tmp/deepclaw-test-cred-delete-' + Date.now();
    const manager = new CredentialManager(dir);
    const created = manager.create('deletable', 'custom', { value: 'x' });

    const deleted = manager.delete(created.id);
    expect(deleted).toBe(true);
    expect(manager.get(created.id)).toBeNull();
  });
});
