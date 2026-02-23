import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEY,
  LAST_USED_ITEM_ID_KEY,
  SHORTCUT_BINDINGS_KEY,
  DISPLAY_MODE_KEY,
  DISPLAY_MODE_ATTACHED,
  DISPLAY_MODE_POPUP,
  DISPLAY_MODE_WINDOW,
  loadItems,
  addItem,
  updateItem,
  deleteItem,
  replaceAllItems,
  setLastUsedItemId,
  getLastUsedItemId,
  getShortcutBindings,
  setShortcutBindingForSlot,
  getDisplayMode,
  setDisplayMode
} from '../src/storage.js';

function createMockStorage() {
  const state = {};

  return {
    async get(key) {
      if (typeof key === 'string') {
        return { [key]: state[key] };
      }

      if (Array.isArray(key)) {
        return key.reduce((acc, itemKey) => {
          acc[itemKey] = state[itemKey];
          return acc;
        }, {});
      }

      return { ...state };
    },

    async set(values) {
      Object.assign(state, values);
    },

    _dump() {
      return { ...state };
    }
  };
}

describe('storage module', () => {
  let storage;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it('loads empty array when storage has no items', async () => {
    const items = await loadItems(storage);
    expect(items).toEqual([]);
  });

  it('adds item and persists it', async () => {
    const created = await addItem(
      {
        title: '問候語',
        content: '您好，這是預設內容。'
      },
      storage
    );

    expect(created.id).toBeTruthy();
    expect(created.title).toBe('問候語');
    expect(created.content).toBe('您好，這是預設內容。');
    expect(created.createdAt).toBeTruthy();
    expect(created.updatedAt).toBeTruthy();

    const persisted = storage._dump()[STORAGE_KEY];
    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toMatchObject({
      id: created.id,
      title: '問候語',
      content: '您好，這是預設內容。',
      category: '未分類'
    });
  });

  it('adds item with trimmed category', async () => {
    const created = await addItem(
      {
        title: 'FAQ',
        content: '這是常見問題。',
        category: '  工作  '
      },
      storage
    );

    expect(created.category).toBe('工作');
  });

  it('updates existing item by id', async () => {
    const created = await addItem(
      {
        title: '原始標題',
        content: '原始內容'
      },
      storage
    );

    const updated = await updateItem(
      created.id,
      {
        title: '新標題',
        content: '新內容'
      },
      storage
    );

    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe('新標題');
    expect(updated.content).toBe('新內容');
    expect(updated.category).toBe('未分類');
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.updatedAt).getTime()
    );

    const [persisted] = storage._dump()[STORAGE_KEY];
    expect(persisted.title).toBe('新標題');
    expect(persisted.content).toBe('新內容');
  });

  it('updates category when patch contains category field', async () => {
    const created = await addItem(
      {
        title: '類別測試',
        content: '內容',
        category: 'A'
      },
      storage
    );

    const updated = await updateItem(
      created.id,
      {
        category: '  B  '
      },
      storage
    );

    expect(updated.category).toBe('B');
  });

  it('deletes item by id', async () => {
    const first = await addItem(
      { title: '第一筆', content: 'A' },
      storage
    );
    await addItem(
      { title: '第二筆', content: 'B' },
      storage
    );

    await deleteItem(first.id, storage);

    const persisted = storage._dump()[STORAGE_KEY];
    expect(persisted).toHaveLength(1);
    expect(persisted[0].title).toBe('第二筆');
  });

  it('throws when adding item with empty title or content', async () => {
    await expect(
      addItem({ title: '', content: '內容' }, storage)
    ).rejects.toThrow(/title/i);

    await expect(
      addItem({ title: '標題', content: '' }, storage)
    ).rejects.toThrow(/content/i);
  });

  it('replaces all items from imported payload', async () => {
    await replaceAllItems(
      [
        { title: 'A', content: 'AAA', category: '分類一' },
        { title: 'B', content: 'BBB' }
      ],
      storage
    );

    const persisted = storage._dump()[STORAGE_KEY];
    expect(persisted).toHaveLength(2);
    expect(persisted[0]).toMatchObject({
      title: 'A',
      content: 'AAA',
      category: '分類一'
    });
    expect(persisted[1]).toMatchObject({
      title: 'B',
      content: 'BBB',
      category: '未分類'
    });
  });

  it('stores and loads last used item id', async () => {
    await setLastUsedItemId('item-123', storage);
    const loaded = await getLastUsedItemId(storage);
    expect(loaded).toBe('item-123');
    expect(storage._dump()[LAST_USED_ITEM_ID_KEY]).toBe('item-123');
  });

  it('loads default display mode when storage is empty', async () => {
    const loaded = await getDisplayMode(storage);
    expect(loaded).toBe(DISPLAY_MODE_ATTACHED);
  });

  it('stores and loads display mode', async () => {
    await setDisplayMode(DISPLAY_MODE_WINDOW, storage);
    const loaded = await getDisplayMode(storage);
    expect(loaded).toBe(DISPLAY_MODE_WINDOW);
    expect(storage._dump()[DISPLAY_MODE_KEY]).toBe(DISPLAY_MODE_WINDOW);
  });

  it('stores and loads popup display mode', async () => {
    await setDisplayMode(DISPLAY_MODE_POPUP, storage);
    const loaded = await getDisplayMode(storage);
    expect(loaded).toBe(DISPLAY_MODE_POPUP);
    expect(storage._dump()[DISPLAY_MODE_KEY]).toBe(DISPLAY_MODE_POPUP);
  });

  it('normalizes invalid display mode to default', async () => {
    await storage.set({
      [DISPLAY_MODE_KEY]: 'unknown-mode'
    });

    const loaded = await getDisplayMode(storage);
    expect(loaded).toBe(DISPLAY_MODE_ATTACHED);
  });

  it('stores and loads shortcut bindings', async () => {
    await setShortcutBindingForSlot('slot-1', 'item-a', storage);
    await setShortcutBindingForSlot('slot-2', 'item-b', storage);

    const loaded = await getShortcutBindings(storage);
    expect(loaded).toEqual({
      'slot-1': 'item-a',
      'slot-2': 'item-b'
    });
    expect(storage._dump()[SHORTCUT_BINDINGS_KEY]).toEqual({
      'slot-1': 'item-a',
      'slot-2': 'item-b'
    });
  });

  it('keeps one item bound to only one slot', async () => {
    await setShortcutBindingForSlot('slot-1', 'item-a', storage);
    await setShortcutBindingForSlot('slot-2', 'item-a', storage);

    const loaded = await getShortcutBindings(storage);
    expect(loaded).toEqual({
      'slot-2': 'item-a'
    });
  });

  it('migrates local data into sync when sync is empty', async () => {
    const { migrateLocalToSyncIfNeeded } = await import('../src/storage.js');

    const syncStorage = createMockStorage();
    const localStorage = createMockStorage();
    await localStorage.set({
      [STORAGE_KEY]: [{ id: 'x', title: 'T', content: 'C', category: '未分類' }],
      [LAST_USED_ITEM_ID_KEY]: 'x',
      [DISPLAY_MODE_KEY]: DISPLAY_MODE_WINDOW
    });

    const migrated = await migrateLocalToSyncIfNeeded({
      storage: {
        sync: syncStorage,
        local: localStorage
      }
    });

    expect(migrated).toBe(true);
    expect(syncStorage._dump()[STORAGE_KEY]).toHaveLength(1);
    expect(syncStorage._dump()[LAST_USED_ITEM_ID_KEY]).toBe('x');
    expect(syncStorage._dump()[DISPLAY_MODE_KEY]).toBe(DISPLAY_MODE_WINDOW);
  });

  it('does not migrate when sync already has data', async () => {
    const { migrateLocalToSyncIfNeeded } = await import('../src/storage.js');

    const syncStorage = createMockStorage();
    const localStorage = createMockStorage();
    await syncStorage.set({
      [STORAGE_KEY]: [{ id: 'sync', title: 'A', content: 'B', category: '未分類' }]
    });
    await localStorage.set({
      [STORAGE_KEY]: [{ id: 'local', title: 'L', content: 'D', category: '未分類' }]
    });

    const migrated = await migrateLocalToSyncIfNeeded({
      storage: {
        sync: syncStorage,
        local: localStorage
      }
    });

    expect(migrated).toBe(false);
    expect(syncStorage._dump()[STORAGE_KEY][0].id).toBe('sync');
  });

  it('clears shortcut binding when deleting bound item', async () => {
    const first = await addItem({ title: 'A', content: 'AA' }, storage);
    const second = await addItem({ title: 'B', content: 'BB' }, storage);
    await setShortcutBindingForSlot('slot-1', first.id, storage);
    await setShortcutBindingForSlot('slot-2', second.id, storage);

    await deleteItem(first.id, storage);

    const loaded = await getShortcutBindings(storage);
    expect(loaded).toEqual({
      'slot-2': second.id
    });
  });

  it('resets shortcut bindings after replace all items', async () => {
    await setShortcutBindingForSlot('slot-1', 'item-a', storage);
    await replaceAllItems(
      [{ title: 'A', content: 'AA', category: '未分類' }],
      storage
    );

    const loaded = await getShortcutBindings(storage);
    expect(loaded).toEqual({});
  });
});
