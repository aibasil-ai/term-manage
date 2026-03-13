import { describe, it, expect } from 'vitest';
import { getDefaultStorageArea, getSyncUsageStats } from '../src/storage-area.js';

describe('storage area selection', () => {
  it('prefers chrome.storage.sync when available', () => {
    const sync = { name: 'sync' };
    const local = { name: 'local' };

    const area = getDefaultStorageArea({
      storage: { sync, local }
    });

    expect(area).toBe(sync);
  });

  it('falls back to chrome.storage.local when sync is unavailable', () => {
    const local = { name: 'local' };

    const area = getDefaultStorageArea({
      storage: { local }
    });

    expect(area).toBe(local);
  });

  it('throws when no storage area exists', () => {
    expect(() => getDefaultStorageArea({})).toThrow(/storage area/i);
  });

  it('returns sync usage stats when sync storage is available', async () => {
    const sync = {
      QUOTA_BYTES: 102400,
      getBytesInUse: async () => 1234
    };

    const stats = await getSyncUsageStats({
      storage: { sync }
    });

    expect(stats).toEqual({
      bytesInUse: 1234,
      quotaBytes: 102400
    });
  });

  it('returns null when sync storage is unavailable', async () => {
    const stats = await getSyncUsageStats({
      storage: { local: {} }
    });

    expect(stats).toBeNull();
  });
});
