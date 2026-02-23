import { describe, it, expect } from 'vitest';
import { pickItemForQuickInsert } from '../src/shortcut.js';

describe('shortcut module', () => {
  it('returns null when items are empty', () => {
    const item = pickItemForQuickInsert([], null);
    expect(item).toBeNull();
  });

  it('returns last used item when matched', () => {
    const items = [
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' }
    ];

    const item = pickItemForQuickInsert(items, 'b');
    expect(item?.id).toBe('b');
  });

  it('falls back to first item when last used id is missing', () => {
    const items = [
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' }
    ];

    const item = pickItemForQuickInsert(items, 'x');
    expect(item?.id).toBe('a');
  });
});
