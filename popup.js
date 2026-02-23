import {
  loadItems,
  addItem,
  updateItem,
  deleteItem,
  replaceAllItems,
  setLastUsedItemId,
  getShortcutBindings,
  setShortcutBindingForSlot,
  clearShortcutBindingByItemId,
  getDisplayMode,
  setDisplayMode,
  DISPLAY_MODE_ATTACHED,
  DISPLAY_MODE_POPUP,
  DISPLAY_MODE_WINDOW,
  migrateLocalToSyncIfNeeded
} from './src/storage.js';
import {
  serializeItemsForExport,
  parseItemsFromImportText
} from './src/transfer.js';
import {
  filterItems,
  buildCategoryOptions
} from './src/filtering.js';
import { SHORTCUT_SLOT_KEYS, findShortcutSlotByItemId } from './src/shortcut-binding.js';
import { injectSnippetIntoActiveElement } from './src/page-inject.js';
import {
  createItemFormState,
  openCreateItemForm,
  openEditItemForm,
  closeItemForm,
  isEditingItemForm
} from './src/item-form-state.js';

const refs = {
  toggleFormButton: document.querySelector('#toggle-form-button'),
  formPanel: document.querySelector('#item-form-panel'),
  form: document.querySelector('#item-form'),
  titleInput: document.querySelector('#item-title'),
  categoryInput: document.querySelector('#item-category'),
  displayModeSelect: document.querySelector('#display-mode-select'),
  shortcutSlotSelect: document.querySelector('#item-shortcut-slot'),
  contentInput: document.querySelector('#item-content'),
  saveButton: document.querySelector('#save-button'),
  cancelEditButton: document.querySelector('#cancel-edit-button'),
  searchInput: document.querySelector('#search-input'),
  categoryFilter: document.querySelector('#category-filter'),
  itemsList: document.querySelector('#items-list'),
  exportButton: document.querySelector('#export-button'),
  importButton: document.querySelector('#import-button'),
  importFileInput: document.querySelector('#import-file-input'),
  status: document.querySelector('#status')
};

const state = {
  itemForm: createItemFormState(),
  items: [],
  shortcutBindings: {},
  displayMode: DISPLAY_MODE_ATTACHED,
  searchQuery: '',
  selectedCategory: '全部'
};
const query = new URLSearchParams(window.location.search);
const displayHost = query.get('displayHost') || '';
const targetWindowIdFromQuery = Number.parseInt(query.get('targetWindowId') || '', 10);
const targetTabIdFromQuery = Number.parseInt(query.get('targetTabId') || '', 10);
const runtimeContext = {
  displayHost,
  targetTabId: Number.isInteger(targetTabIdFromQuery) ? targetTabIdFromQuery : null,
  targetWindowId: Number.isInteger(targetWindowIdFromQuery) ? targetWindowIdFromQuery : null
};

if (runtimeContext.displayHost) {
  document.body.classList.add(`display-host-${runtimeContext.displayHost}`);
}

function getShortcutSlotLabel(slotKey) {
  const matched = /^slot-(\d+)$/.exec(slotKey);
  if (!matched) {
    return slotKey;
  }
  return `快捷鍵 ${matched[1]}`;
}

function setStatus(message, isError = false) {
  refs.status.textContent = message;
  refs.status.classList.toggle('error', isError);
}

function clearStatus() {
  setStatus('');
}

function getDisplayModeLabel(mode) {
  if (mode === DISPLAY_MODE_POPUP) {
    return '原本彈出（工具列）';
  }
  if (mode === DISPLAY_MODE_WINDOW) {
    return '獨立視窗';
  }
  return '附著在 Chrome 側邊';
}

function renderShortcutSlotOptions() {
  refs.shortcutSlotSelect.innerHTML = '';

  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = '不綁定';
  refs.shortcutSlotSelect.append(emptyOption);

  SHORTCUT_SLOT_KEYS.forEach((slotKey) => {
    const option = document.createElement('option');
    option.value = slotKey;
    option.textContent = getShortcutSlotLabel(slotKey);
    refs.shortcutSlotSelect.append(option);
  });
}

function applyFormState() {
  refs.formPanel.classList.toggle('hidden', !state.itemForm.isVisible);

  const isEditing = isEditingItemForm(state.itemForm);
  refs.saveButton.textContent = isEditing ? '更新項目' : '新增項目';
  refs.cancelEditButton.textContent = isEditing ? '取消編輯' : '取消';
  refs.toggleFormButton.textContent = state.itemForm.isVisible ? '收合表單' : '新增項目';
}

function closeAndResetForm() {
  state.itemForm = closeItemForm(state.itemForm);
  refs.form.reset();
  refs.categoryInput.value = '';
  refs.shortcutSlotSelect.value = '';
  applyFormState();
}

function openCreateForm() {
  state.itemForm = openCreateItemForm(state.itemForm);
  refs.form.reset();
  refs.categoryInput.value = '';
  refs.shortcutSlotSelect.value = '';
  applyFormState();
  refs.titleInput.focus();
}

function openFormForEdit(item) {
  state.itemForm = openEditItemForm(state.itemForm, item.id);
  refs.titleInput.value = item.title;
  refs.categoryInput.value = item.category === '未分類' ? '' : item.category;
  refs.shortcutSlotSelect.value = findShortcutSlotByItemId(state.shortcutBindings, item.id) || '';
  refs.contentInput.value = item.content;
  applyFormState();
  refs.titleInput.focus();
}

function toPreview(text) {
  if (text.length <= 60) {
    return text;
  }
  return `${text.slice(0, 60)}...`;
}

function getFilteredItems() {
  return filterItems(state.items, {
    query: state.searchQuery,
    category: state.selectedCategory
  });
}

function renderCategoryFilterOptions() {
  const options = buildCategoryOptions(state.items);
  if (!options.includes(state.selectedCategory)) {
    state.selectedCategory = '全部';
  }

  refs.categoryFilter.innerHTML = '';

  options.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    option.selected = category === state.selectedCategory;
    refs.categoryFilter.append(option);
  });
}

async function refreshItems() {
  const [items, shortcutBindings] = await Promise.all([
    loadItems(),
    getShortcutBindings()
  ]);
  state.items = items;
  state.shortcutBindings = shortcutBindings;
  renderCategoryFilterOptions();
  renderItems();
}

async function refreshDisplayMode() {
  const displayMode = await getDisplayMode();
  state.displayMode = displayMode;
  refs.displayModeSelect.value = displayMode;
}

function renderEmptyState(message) {
  refs.itemsList.innerHTML = '';
  const li = document.createElement('li');
  li.className = 'empty';
  li.textContent = message;
  refs.itemsList.append(li);
}

function renderItems() {
  if (!state.items.length) {
    renderEmptyState('尚未建立任何項目。');
    return;
  }

  const filteredItems = getFilteredItems();
  if (!filteredItems.length) {
    renderEmptyState('沒有符合篩選條件的項目。');
    return;
  }

  refs.itemsList.innerHTML = '';

  filteredItems.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'item';

    const title = document.createElement('p');
    title.className = 'item-title';
    title.textContent = item.title;

    const category = document.createElement('p');
    category.className = 'item-category';
    category.textContent = item.category || '未分類';

    const meta = document.createElement('div');
    meta.className = 'item-meta';
    meta.append(category);

    const boundSlot = findShortcutSlotByItemId(state.shortcutBindings, item.id);
    if (boundSlot) {
      const shortcutBadge = document.createElement('p');
      shortcutBadge.className = 'item-shortcut';
      shortcutBadge.textContent = getShortcutSlotLabel(boundSlot);
      meta.append(shortcutBadge);
    }

    const preview = document.createElement('p');
    preview.className = 'item-preview';
    preview.textContent = toPreview(item.content);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const insertButton = document.createElement('button');
    insertButton.type = 'button';
    insertButton.textContent = '帶入';
    insertButton.addEventListener('click', () => {
      void handleInsert(item);
    });

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'secondary';
    editButton.textContent = '編輯';
    editButton.addEventListener('click', () => {
      openFormForEdit(item);
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'danger';
    deleteButton.textContent = '刪除';
    deleteButton.addEventListener('click', async () => {
      if (!confirm(`確定要刪除「${item.title}」嗎？`)) {
        return;
      }

      await deleteItem(item.id);
      await refreshItems();
      setStatus('已刪除項目。');
    });

    actions.append(insertButton, editButton, deleteButton);
    li.append(title, meta, preview, actions);
    refs.itemsList.append(li);
  });
}

async function applyShortcutBinding(itemId, shortcutSlot) {
  const slot = typeof shortcutSlot === 'string' ? shortcutSlot.trim() : '';
  if (slot) {
    await setShortcutBindingForSlot(slot, itemId);
    return;
  }

  await clearShortcutBindingByItemId(itemId);
}

function isRestrictedTargetUrl(url) {
  const text = typeof url === 'string' ? url.trim() : '';
  if (!text) {
    return false;
  }

  return (
    text.startsWith('chrome://') ||
    text.startsWith('chrome-extension://') ||
    text.startsWith('chrome-search://') ||
    text.startsWith('edge://') ||
    text.startsWith('about:') ||
    text.startsWith('devtools://') ||
    text.startsWith('view-source:')
  );
}

function pickFirstInjectableTab(tabs) {
  return tabs.find((tab) => tab?.id && !isRestrictedTargetUrl(tab.url)) || null;
}

async function resolveTargetTabForInsert() {
  const candidates = [];

  if (runtimeContext.targetWindowId) {
    const [tabInTargetWindow] = await chrome.tabs.query({
      active: true,
      windowId: runtimeContext.targetWindowId
    });
    if (tabInTargetWindow?.id) {
      candidates.push(tabInTargetWindow);
    }

    const tabsInTargetWindow = await chrome.tabs.query({
      windowId: runtimeContext.targetWindowId
    });
    tabsInTargetWindow
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
      .forEach((tab) => {
        if (tab?.id) {
          candidates.push(tab);
        }
      });
  }

  if (runtimeContext.targetTabId) {
    try {
      const tab = await chrome.tabs.get(runtimeContext.targetTabId);
      if (tab?.id) {
        candidates.push(tab);
      }
    } catch {
      // Ignore stale tab id and continue fallback lookup.
    }
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  if (tab?.id) {
    candidates.push(tab);
  }

  const dedupedById = new Map();
  candidates.forEach((candidate) => {
    if (candidate?.id) {
      dedupedById.set(candidate.id, candidate);
    }
  });

  const deduped = [...dedupedById.values()];
  const injectable = pickFirstInjectableTab(deduped);
  if (injectable) {
    return { tab: injectable, reason: null };
  }

  const hasRestrictedOnly = deduped.some((candidate) => isRestrictedTargetUrl(candidate.url));
  if (hasRestrictedOnly) {
    return { tab: null, reason: 'restricted-url' };
  }

  return { tab: null, reason: 'no-tab' };
}

async function handleSubmit(event) {
  event.preventDefault();

  const title = refs.titleInput.value.trim();
  const content = refs.contentInput.value.trim();
  const category = refs.categoryInput.value.trim();
  const shortcutSlot = refs.shortcutSlotSelect.value;

  if (!title || !content) {
    setStatus('標題與內容不可為空。', true);
    return;
  }

  clearStatus();

  try {
    if (isEditingItemForm(state.itemForm)) {
      const editingId = state.itemForm.editingId;
      await updateItem(editingId, { title, content, category });
      await applyShortcutBinding(editingId, shortcutSlot);
      setStatus('項目已更新。');
    } else {
      const created = await addItem({ title, content, category });
      await applyShortcutBinding(created.id, shortcutSlot);
      setStatus('項目已新增。');
    }

    closeAndResetForm();
    await refreshItems();
  } catch (error) {
    setStatus(`儲存失敗：${error.message || '未知錯誤'}`, true);
  }
}

async function handleInsert(item) {
  clearStatus();
  setStatus('帶入中...');

  try {
    const { tab, reason } = await resolveTargetTabForInsert();

    if (!tab || !tab.id) {
      if (reason === 'restricted-url') {
        setStatus('目標分頁是 Chrome 內建頁面（chrome://），請切換到一般網站後再試。', true);
        return;
      }
      setStatus('找不到目前分頁。', true);
      return;
    }

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectSnippetIntoActiveElement,
      args: [item.content]
    });

    if (result?.ok) {
      await setLastUsedItemId(item.id);
      setStatus('內容已帶入焦點輸入框。');
    } else {
      setStatus(result?.reason || '無法帶入內容。', true);
    }
  } catch (error) {
    if (String(error?.message || '').includes('Cannot access a chrome:// URL')) {
      setStatus('無法在 Chrome 內建頁面（chrome://）帶入，請切換到一般網站後再試。', true);
      return;
    }
    setStatus(`帶入失敗：${error.message || '未知錯誤'}`, true);
  }
}

function createExportFileName() {
  const date = new Date().toISOString().slice(0, 10);
  return `snippet-items-${date}.json`;
}

async function handleExport() {
  try {
    const items = await loadItems();
    const json = serializeItemsForExport(items);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = createExportFileName();
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('已匯出 JSON。');
  } catch (error) {
    setStatus(`匯出失敗：${error.message || '未知錯誤'}`, true);
  }
}

async function handleImportFileChange(event) {
  const file = event.target.files?.[0];
  event.target.value = '';

  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const importedItems = parseItemsFromImportText(text);
    await replaceAllItems(importedItems);
    state.searchQuery = '';
    state.selectedCategory = '全部';
    refs.searchInput.value = '';
    closeAndResetForm();
    await refreshItems();
    setStatus(`已匯入 ${importedItems.length} 筆項目。`);
  } catch (error) {
    setStatus(`匯入失敗：${error.message || '未知錯誤'}`, true);
  }
}

async function handleDisplayModeChange() {
  const selected = refs.displayModeSelect.value;

  try {
    const savedMode = await setDisplayMode(selected);
    state.displayMode = savedMode;
    refs.displayModeSelect.value = savedMode;
    setStatus(`已切換為「${getDisplayModeLabel(savedMode)}」，下次點擊工具列圖示生效。`);
  } catch (error) {
    setStatus(`切換顯示模式失敗：${error.message || '未知錯誤'}`, true);
  }
}

refs.form.addEventListener('submit', (event) => {
  void handleSubmit(event);
});

refs.toggleFormButton.addEventListener('click', () => {
  if (state.itemForm.isVisible) {
    closeAndResetForm();
  } else {
    openCreateForm();
  }
  clearStatus();
});

refs.cancelEditButton.addEventListener('click', () => {
  closeAndResetForm();
  clearStatus();
});

refs.searchInput.addEventListener('input', () => {
  state.searchQuery = refs.searchInput.value;
  renderItems();
});

refs.categoryFilter.addEventListener('change', () => {
  state.selectedCategory = refs.categoryFilter.value;
  renderItems();
});

refs.exportButton.addEventListener('click', () => {
  void handleExport();
});

refs.importButton.addEventListener('click', () => {
  refs.importFileInput.click();
});

refs.importFileInput.addEventListener('change', (event) => {
  void handleImportFileChange(event);
});

refs.displayModeSelect.addEventListener('change', () => {
  void handleDisplayModeChange();
});

renderShortcutSlotOptions();
applyFormState();

void (async () => {
  try {
    await migrateLocalToSyncIfNeeded();
    await refreshDisplayMode();
    await refreshItems();
  } catch (error) {
    setStatus(`讀取資料失敗：${error.message || '未知錯誤'}`, true);
  }
})();
