import { describe, it, expect } from 'vitest';
import { getDefaultStorageArea } from '../src/storage-area.js';

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
});
