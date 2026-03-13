import { getDefaultStorageArea } from './storage-area.js';
import {
  normalizeShortcutBindings,
  setShortcutBinding,
  clearShortcutBindingForItem
} from './shortcut-binding.js';

export const STORAGE_KEY = 'snippetItems';
export const LAST_USED_ITEM_ID_KEY = 'lastUsedSnippetItemId';
export const SHORTCUT_BINDINGS_KEY = 'shortcutBindings';
export const DISPLAY_MODE_KEY = 'displayMode';
export const DEFAULT_CATEGORY = '未分類';
export const DISPLAY_MODE_ATTACHED = 'attached';
export const DISPLAY_MODE_POPUP = 'popup';
export const DISPLAY_MODE_WINDOW = 'window';

function toNonEmptyString(value, fieldName) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) {
    throw new Error(`${fieldName} is required`);
  }
  return text;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeCategory(value) {
  const category = typeof value === 'string' ? value.trim() : '';
  return category || DEFAULT_CATEGORY;
}

function normalizeDisplayMode(value) {
  const mode = typeof value === 'string' ? value.trim() : '';
  if (mode === DISPLAY_MODE_POPUP) {
    return DISPLAY_MODE_POPUP;
  }
  if (mode === DISPLAY_MODE_WINDOW) {
    return DISPLAY_MODE_WINDOW;
  }
  return DISPLAY_MODE_ATTACHED;
}

function normalizeInputItem(input) {
  const title = toNonEmptyString(input?.title, 'title');
  const content = toNonEmptyString(input?.content, 'content');
  const category = normalizeCategory(input?.category);
  return { title, content, category };
}

function normalizeImportedId(value) {
  const id = typeof value === 'string' ? value.trim() : '';
  return id || '';
}

function normalizeImportedTimestamp(value, fallback = null) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const text = value.trim();
  if (!text) {
    return fallback;
  }
  const epoch = Date.parse(text);
  if (Number.isNaN(epoch)) {
    return fallback;
  }
  return text;
}

function toEpochMillis(isoText) {
  if (typeof isoText !== 'string') {
    return null;
  }
  const value = Date.parse(isoText);
  return Number.isNaN(value) ? null : value;
}

function shouldUseImportedByUpdatedAt(currentItem, importedItem, hasImportedUpdatedAt) {
  if (!hasImportedUpdatedAt) {
    return true;
  }

  const currentUpdated = toEpochMillis(currentItem?.updatedAt);
  const importedUpdated = toEpochMillis(importedItem?.updatedAt);
  if (currentUpdated === null || importedUpdated === null) {
    return true;
  }

  return importedUpdated > currentUpdated;
}

function generateId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function saveItems(items, storage = getDefaultStorageArea()) {
  await storage.set({ [STORAGE_KEY]: items });
}

async function saveShortcutBindings(bindings, storage = getDefaultStorageArea()) {
  await storage.set({
    [SHORTCUT_BINDINGS_KEY]: normalizeShortcutBindings(bindings)
  });
}

export async function loadItems(storage = getDefaultStorageArea()) {
  const result = await storage.get(STORAGE_KEY);
  const items = result[STORAGE_KEY];
  return Array.isArray(items) ? items : [];
}

export async function addItem(input, storage = getDefaultStorageArea()) {
  const { title, content, category } = normalizeInputItem(input);
  const timestamp = nowIso();

  const item = {
    id: generateId(),
    title,
    content,
    category,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const items = await loadItems(storage);
  const nextItems = [item, ...items];
  await saveItems(nextItems, storage);
  return item;
}

export async function updateItem(id, patch, storage = getDefaultStorageArea()) {
  const itemId = toNonEmptyString(id, 'id');
  const items = await loadItems(storage);
  const index = items.findIndex((item) => item.id === itemId);

  if (index === -1) {
    throw new Error('item not found');
  }

  const current = items[index];
  const next = {
    ...current,
    title:
      patch && Object.hasOwn(patch, 'title')
        ? toNonEmptyString(patch.title, 'title')
        : current.title,
    content:
      patch && Object.hasOwn(patch, 'content')
        ? toNonEmptyString(patch.content, 'content')
        : current.content,
    category:
      patch && Object.hasOwn(patch, 'category')
        ? normalizeCategory(patch.category)
        : normalizeCategory(current.category),
    updatedAt: nowIso()
  };

  const nextItems = [...items];
  nextItems[index] = next;
  await saveItems(nextItems, storage);
  return next;
}

export async function deleteItem(id, storage = getDefaultStorageArea()) {
  const itemId = toNonEmptyString(id, 'id');
  const items = await loadItems(storage);
  const nextItems = items.filter((item) => item.id !== itemId);
  await saveItems(nextItems, storage);
  await clearShortcutBindingByItemId(itemId, storage);
}

export async function replaceAllItems(inputItems, storage = getDefaultStorageArea()) {
  if (!Array.isArray(inputItems)) {
    throw new Error('items must be an array');
  }

  const now = nowIso();
  const normalized = inputItems.map((input) => {
    const { title, content, category } = normalizeInputItem(input);
    return {
      id: generateId(),
      title,
      content,
      category,
      createdAt: now,
      updatedAt: now
    };
  });

  await storage.set({
    [STORAGE_KEY]: normalized,
    [LAST_USED_ITEM_ID_KEY]: null,
    [SHORTCUT_BINDINGS_KEY]: {}
  });

  return normalized;
}

export async function mergeImportedItems(inputItems, storage = getDefaultStorageArea()) {
  if (!Array.isArray(inputItems)) {
    throw new Error('items must be an array');
  }

  const timestamp = nowIso();
  const existingItems = await loadItems(storage);
  const existingById = new Map(existingItems.map((item) => [item.id, item]));
  const updatedExistingItems = new Map();
  const addedItems = [];
  const addedItemIndexById = new Map();
  const updatedExistingIds = new Set();
  let addedCount = 0;

  inputItems.forEach((input) => {
    const { title, content, category } = normalizeInputItem(input);
    const importedId = normalizeImportedId(input?.id);
    const importedCreatedAt = normalizeImportedTimestamp(input?.createdAt, null);
    const importedUpdatedAt = normalizeImportedTimestamp(input?.updatedAt, null);
    const hasImportedUpdatedAt = typeof importedUpdatedAt === 'string';

    if (importedId && existingById.has(importedId)) {
      const current = updatedExistingItems.get(importedId) || existingById.get(importedId);
      const importedCandidate = {
        ...current,
        title,
        content,
        category,
        updatedAt: importedUpdatedAt || timestamp
      };
      if (!shouldUseImportedByUpdatedAt(current, importedCandidate, hasImportedUpdatedAt)) {
        return;
      }

      updatedExistingItems.set(importedId, {
        ...current,
        title,
        content,
        category,
        updatedAt: importedUpdatedAt || timestamp
      });
      updatedExistingIds.add(importedId);
      return;
    }

    if (importedId && addedItemIndexById.has(importedId)) {
      const index = addedItemIndexById.get(importedId);
      const current = addedItems[index];
      const importedCandidate = {
        ...current,
        title,
        content,
        category,
        updatedAt: importedUpdatedAt || timestamp
      };
      if (!shouldUseImportedByUpdatedAt(current, importedCandidate, hasImportedUpdatedAt)) {
        return;
      }

      addedItems[index] = {
        ...current,
        title,
        content,
        category,
        updatedAt: importedUpdatedAt || timestamp
      };
      return;
    }

    const nextId =
      importedId && !existingById.has(importedId) && !addedItemIndexById.has(importedId)
        ? importedId
        : generateId();
    const nextItem = {
      id: nextId,
      title,
      content,
      category,
      createdAt: importedCreatedAt || timestamp,
      updatedAt: importedUpdatedAt || timestamp
    };
    addedItems.push(nextItem);
    addedItemIndexById.set(nextId, addedItems.length - 1);
    addedCount += 1;
  });

  const mergedExistingItems = existingItems.map(
    (item) => updatedExistingItems.get(item.id) || item
  );
  const mergedItems = [...addedItems, ...mergedExistingItems];
  await saveItems(mergedItems, storage);

  return {
    items: mergedItems,
    addedCount,
    updatedCount: updatedExistingIds.size
  };
}

export async function setLastUsedItemId(id, storage = getDefaultStorageArea()) {
  const value = typeof id === 'string' ? id.trim() : '';
  await storage.set({
    [LAST_USED_ITEM_ID_KEY]: value || null
  });
}

export async function getLastUsedItemId(storage = getDefaultStorageArea()) {
  const result = await storage.get(LAST_USED_ITEM_ID_KEY);
  const value = result[LAST_USED_ITEM_ID_KEY];
  return typeof value === 'string' && value.trim() ? value : null;
}

export async function getShortcutBindings(storage = getDefaultStorageArea()) {
  const result = await storage.get(SHORTCUT_BINDINGS_KEY);
  return normalizeShortcutBindings(result[SHORTCUT_BINDINGS_KEY]);
}

export async function setDisplayMode(mode, storage = getDefaultStorageArea()) {
  const normalizedMode = normalizeDisplayMode(mode);
  await storage.set({
    [DISPLAY_MODE_KEY]: normalizedMode
  });
  return normalizedMode;
}

export async function getDisplayMode(storage = getDefaultStorageArea()) {
  const result = await storage.get(DISPLAY_MODE_KEY);
  return normalizeDisplayMode(result[DISPLAY_MODE_KEY]);
}

export async function setShortcutBindingForSlot(
  slotKey,
  itemId,
  storage = getDefaultStorageArea()
) {
  const bindings = await getShortcutBindings(storage);
  const nextBindings = setShortcutBinding(bindings, slotKey, itemId);
  await saveShortcutBindings(nextBindings, storage);
  return nextBindings;
}

export async function clearShortcutBindingByItemId(
  itemId,
  storage = getDefaultStorageArea()
) {
  const bindings = await getShortcutBindings(storage);
  const nextBindings = clearShortcutBindingForItem(bindings, itemId);
  await saveShortcutBindings(nextBindings, storage);
  return nextBindings;
}

export async function migrateLocalToSyncIfNeeded(chromeLike = globalThis.chrome) {
  const syncStorage = chromeLike?.storage?.sync;
  const localStorage = chromeLike?.storage?.local;

  if (!syncStorage || !localStorage || syncStorage === localStorage) {
    return false;
  }

  const syncData = await syncStorage.get([
    STORAGE_KEY,
    LAST_USED_ITEM_ID_KEY,
    SHORTCUT_BINDINGS_KEY,
    DISPLAY_MODE_KEY
  ]);
  const syncItems = Array.isArray(syncData[STORAGE_KEY]) ? syncData[STORAGE_KEY] : [];
  const syncLastUsedItemId = syncData[LAST_USED_ITEM_ID_KEY];
  const syncBindings = normalizeShortcutBindings(syncData[SHORTCUT_BINDINGS_KEY]);

  if (
    syncItems.length > 0 ||
    (typeof syncLastUsedItemId === 'string' && syncLastUsedItemId.trim()) ||
    Object.keys(syncBindings).length > 0
  ) {
    return false;
  }

  const localData = await localStorage.get([
    STORAGE_KEY,
    LAST_USED_ITEM_ID_KEY,
    SHORTCUT_BINDINGS_KEY,
    DISPLAY_MODE_KEY
  ]);
  const localItems = Array.isArray(localData[STORAGE_KEY]) ? localData[STORAGE_KEY] : [];
  const localLastUsedItemId = localData[LAST_USED_ITEM_ID_KEY];
  const localBindings = normalizeShortcutBindings(localData[SHORTCUT_BINDINGS_KEY]);
  const localDisplayMode = normalizeDisplayMode(localData[DISPLAY_MODE_KEY]);
  const normalizedLastUsedItemId =
    typeof localLastUsedItemId === 'string' && localLastUsedItemId.trim()
      ? localLastUsedItemId
      : null;

  if (
    localItems.length === 0 &&
    !normalizedLastUsedItemId &&
    Object.keys(localBindings).length === 0
  ) {
    return false;
  }

  await syncStorage.set({
    [STORAGE_KEY]: localItems,
    [LAST_USED_ITEM_ID_KEY]: normalizedLastUsedItemId,
    [SHORTCUT_BINDINGS_KEY]: localBindings,
    [DISPLAY_MODE_KEY]: localDisplayMode
  });

  return true;
}
