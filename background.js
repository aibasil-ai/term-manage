import {
  loadItems,
  getLastUsedItemId,
  setLastUsedItemId,
  getShortcutBindings,
  getDisplayMode,
  DISPLAY_MODE_KEY,
  DISPLAY_MODE_ATTACHED,
  DISPLAY_MODE_POPUP,
  DISPLAY_MODE_WINDOW,
  migrateLocalToSyncIfNeeded
} from './src/storage.js';
import { pickItemForQuickInsert } from './src/shortcut.js';
import {
  SHORTCUT_SLOT_COMMANDS,
  findItemIdForCommand
} from './src/shortcut-binding.js';
import { injectSnippetIntoActiveElement } from './src/page-inject.js';
import {
  APPLY_DISPLAY_MODE_MESSAGE,
  ACTIVATE_DISPLAY_MODE_MESSAGE
} from './src/display-mode-messaging.js';

const INSERT_LAST_USED_COMMAND = 'insert-last-used-snippet';
const SLOT_COMMANDS = new Set(Object.values(SHORTCUT_SLOT_COMMANDS));
const STANDALONE_WINDOW_WIDTH = 440;
const STANDALONE_WINDOW_HEIGHT = 760;
const STANDALONE_WINDOW_PATH = 'popup.html?displayHost=window';
const ACTION_POPUP_PATH = 'popup.html?displayHost=action-popup';
const DISPLAY_HOST_WINDOW = 'window';
const DISPLAY_HOST_ACTION_POPUP = 'action-popup';
let currentDisplayMode = DISPLAY_MODE_ATTACHED;

async function resolveActiveTabId(tabFromEvent) {
  if (tabFromEvent?.id) {
    return tabFromEvent.id;
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tab?.id;
}

async function resolveActiveWindowId(tabFromEvent) {
  if (tabFromEvent?.windowId) {
    return tabFromEvent.windowId;
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  return tab?.windowId;
}

async function openStandaloneWindow(tabFromEvent) {
  const targetWindowId = await resolveActiveWindowId(tabFromEvent);
  const popupUrl = new URL(chrome.runtime.getURL(STANDALONE_WINDOW_PATH));
  if (tabFromEvent?.id) {
    popupUrl.searchParams.set('targetTabId', String(tabFromEvent.id));
  }
  if (targetWindowId) {
    popupUrl.searchParams.set('targetWindowId', String(targetWindowId));
  }

  await chrome.windows.create({
    type: 'popup',
    url: popupUrl.toString(),
    width: STANDALONE_WINDOW_WIDTH,
    height: STANDALONE_WINDOW_HEIGHT
  });
}

function normalizeSourceHost(value) {
  if (value === DISPLAY_HOST_WINDOW) {
    return DISPLAY_HOST_WINDOW;
  }
  if (value === DISPLAY_HOST_ACTION_POPUP) {
    return DISPLAY_HOST_ACTION_POPUP;
  }
  return 'attached';
}

function normalizeWindowId(value) {
  return Number.isInteger(value) ? value : null;
}

async function resolvePreferredWindowId(senderTab, requestedWindowId) {
  const normalizedRequested = normalizeWindowId(requestedWindowId);
  if (normalizedRequested) {
    return normalizedRequested;
  }

  const resolvedFromSender = await resolveActiveWindowId(senderTab);
  if (resolvedFromSender) {
    return resolvedFromSender;
  }

  if (!chrome.windows || typeof chrome.windows.getAll !== 'function') {
    return null;
  }

  const windows = await chrome.windows.getAll({ populate: false });
  const normalWindows = windows.filter((windowInfo) => windowInfo.type === 'normal');
  const focusedWindow = normalWindows.find((windowInfo) => windowInfo.focused);
  return focusedWindow?.id || normalWindows[0]?.id || null;
}

async function openActionPopupWithFallback(windowId) {
  if (!chrome.action || typeof chrome.action.openPopup !== 'function') {
    return false;
  }

  if (windowId) {
    try {
      await chrome.action.openPopup({ windowId });
      return true;
    } catch (error) {
      const message = String(error?.message || '');
      const unsupportedOption =
        message.includes('Unexpected property') || message.includes('No matching signature');
      if (!unsupportedOption) {
        return false;
      }
      // Older Chrome may not support windowId option.
    }
  }

  try {
    await chrome.action.openPopup();
    return true;
  } catch {
    return false;
  }
}

async function closeSidePanelIfPossible(windowId) {
  if (!chrome.sidePanel || typeof chrome.sidePanel.close !== 'function') {
    return false;
  }

  if (!windowId) {
    return false;
  }

  try {
    await chrome.sidePanel.close({ windowId });
    return true;
  } catch {
    return false;
  }
}

function normalizeDisplayMode(value) {
  if (value === DISPLAY_MODE_WINDOW) {
    return DISPLAY_MODE_WINDOW;
  }
  if (value === DISPLAY_MODE_POPUP) {
    return DISPLAY_MODE_POPUP;
  }
  return DISPLAY_MODE_ATTACHED;
}

async function applyActionBehaviorByMode(displayMode) {
  if (!chrome.sidePanel || typeof chrome.sidePanel.setPanelBehavior !== 'function') {
    if (chrome.action && typeof chrome.action.setPopup === 'function') {
      await chrome.action.setPopup({
        popup: displayMode === DISPLAY_MODE_POPUP ? ACTION_POPUP_PATH : ''
      });
    }
    return;
  }

  await chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: displayMode === DISPLAY_MODE_ATTACHED
  });

  if (chrome.action && typeof chrome.action.setPopup === 'function') {
    await chrome.action.setPopup({
      popup: displayMode === DISPLAY_MODE_POPUP ? ACTION_POPUP_PATH : ''
    });
  }
}

async function activateDisplayModeNow(displayMode, sourceHost, sender, requestedWindowId) {
  const normalizedHost = normalizeSourceHost(sourceHost);
  const preferredWindowId = await resolvePreferredWindowId(sender?.tab, requestedWindowId);
  const fromStandaloneWindow = normalizedHost === DISPLAY_HOST_WINDOW;
  const fromActionPopup = normalizedHost === DISPLAY_HOST_ACTION_POPUP;
  const fromAttached = normalizedHost === 'attached';

  if (displayMode === DISPLAY_MODE_WINDOW) {
    if (fromStandaloneWindow) {
      return { appliedNow: true, shouldCloseCurrentWindow: false };
    }

    await openStandaloneWindow(sender?.tab);
    if (fromAttached) {
      await closeSidePanelIfPossible(preferredWindowId);
    }
    return {
      appliedNow: true,
      shouldCloseCurrentWindow: fromActionPopup
    };
  }

  if (displayMode === DISPLAY_MODE_ATTACHED) {
    if (fromAttached) {
      return { appliedNow: true, shouldCloseCurrentWindow: false };
    }

    if (chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
      if (preferredWindowId) {
        try {
          await chrome.sidePanel.open({ windowId: preferredWindowId });
          return {
            appliedNow: true,
            shouldCloseCurrentWindow: fromStandaloneWindow || fromActionPopup
          };
        } catch (error) {
          const message = String(error?.message || '');
          if (message.includes('may only be called in response to a user gesture')) {
            return {
              appliedNow: false,
              shouldCloseCurrentWindow: false,
              blockedByUserGesture: true
            };
          }
          return { appliedNow: false, shouldCloseCurrentWindow: false };
        }
      }
    }

    return { appliedNow: false, shouldCloseCurrentWindow: false };
  }

  if (displayMode === DISPLAY_MODE_POPUP) {
    if (fromActionPopup) {
      return { appliedNow: true, shouldCloseCurrentWindow: false };
    }

    const popupOpened = await openActionPopupWithFallback(preferredWindowId);
    if (popupOpened) {
      if (fromAttached) {
        await closeSidePanelIfPossible(preferredWindowId);
      }
      return {
        appliedNow: true,
        shouldCloseCurrentWindow: fromStandaloneWindow
      };
    }

    return { appliedNow: false, shouldCloseCurrentWindow: false };
  }

  return { appliedNow: false, shouldCloseCurrentWindow: false };
}

async function syncDisplayModeFromStorage() {
  await migrateLocalToSyncIfNeeded();
  currentDisplayMode = normalizeDisplayMode(await getDisplayMode());
  await applyActionBehaviorByMode(currentDisplayMode);
}

async function handleToolbarActionClick(tabFromEvent) {
  if (currentDisplayMode === DISPLAY_MODE_WINDOW) {
    await openStandaloneWindow(tabFromEvent);
    return;
  }

  if (currentDisplayMode === DISPLAY_MODE_POPUP) {
    return;
  }

  if (!chrome.sidePanel || typeof chrome.sidePanel.setPanelBehavior !== 'function') {
    console.warn('[文字快填助手] 目前環境不支援 side panel，改以獨立視窗開啟。');
    await openStandaloneWindow(tabFromEvent);
  }
}

async function insertItemIntoActiveTab(item, tabFromEvent) {
  const tabId = await resolveActiveTabId(tabFromEvent);
  if (!tabId) {
    console.warn('[文字快填助手] 找不到可用分頁。');
    return false;
  }

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: injectSnippetIntoActiveElement,
    args: [item.content]
  });

  if (result?.ok) {
    await setLastUsedItemId(item.id);
    return true;
  }

  console.warn('[文字快填助手] 快捷鍵插入失敗：', result?.reason || '未知原因');
  return false;
}

async function handleInsertLastUsedCommand(tabFromEvent) {
  await migrateLocalToSyncIfNeeded();

  const items = await loadItems();
  const lastUsedItemId = await getLastUsedItemId();
  const targetItem = pickItemForQuickInsert(items, lastUsedItemId);

  if (!targetItem) {
    console.warn('[文字快填助手] 沒有可插入的項目。');
    return;
  }

  await insertItemIntoActiveTab(targetItem, tabFromEvent);
}

async function handleInsertShortcutSlotCommand(command, tabFromEvent) {
  await migrateLocalToSyncIfNeeded();

  const [items, bindings] = await Promise.all([
    loadItems(),
    getShortcutBindings()
  ]);

  const itemId = findItemIdForCommand(command, bindings);
  if (!itemId) {
    console.warn('[文字快填助手] 此快捷鍵尚未綁定項目。');
    return;
  }

  const targetItem = items.find((item) => item.id === itemId);
  if (!targetItem) {
    console.warn('[文字快填助手] 綁定項目不存在，請重新綁定。');
    return;
  }

  await insertItemIntoActiveTab(targetItem, tabFromEvent);
}

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === INSERT_LAST_USED_COMMAND) {
    void handleInsertLastUsedCommand(tab).catch((error) => {
      console.error('[文字快填助手] 快捷鍵處理失敗：', error);
    });
    return;
  }

  if (SLOT_COMMANDS.has(command)) {
    void handleInsertShortcutSlotCommand(command, tab).catch((error) => {
      console.error('[文字快填助手] 快捷鍵處理失敗：', error);
    });
  }
});

chrome.action.onClicked.addListener((tab) => {
  void handleToolbarActionClick(tab).catch((error) => {
    console.error('[文字快填助手] 工具列點擊處理失敗：', error);
  });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync' && areaName !== 'local') {
    return;
  }

  if (!Object.hasOwn(changes, DISPLAY_MODE_KEY)) {
    return;
  }

  const nextMode = normalizeDisplayMode(changes[DISPLAY_MODE_KEY]?.newValue);
  currentDisplayMode = nextMode;
  void applyActionBehaviorByMode(nextMode).catch((error) => {
    console.error('[文字快填助手] 更新 action 行為失敗：', error);
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message) {
    return;
  }

  if (message.type === APPLY_DISPLAY_MODE_MESSAGE) {
    const nextMode = normalizeDisplayMode(message.mode);
    currentDisplayMode = nextMode;

    void applyActionBehaviorByMode(nextMode)
      .then(() => {
        sendResponse({ ok: true, mode: nextMode });
      })
      .catch((error) => {
        console.error('[文字快填助手] 更新顯示模式設定失敗：', error);
        sendResponse({
          ok: false,
          mode: nextMode,
          error: error?.message || 'unknown-error'
        });
      });

    return true;
  }

  if (message.type === ACTIVATE_DISPLAY_MODE_MESSAGE) {
    const nextMode = normalizeDisplayMode(message.mode);

    void activateDisplayModeNow(
      nextMode,
      message.sourceHost,
      _sender,
      message.targetWindowId
    )
      .then((result) => {
        sendResponse({
          ok: true,
          mode: nextMode,
          ...result
        });
      })
      .catch((error) => {
        console.error('[文字快填助手] 即時切換顯示模式失敗：', error);
        sendResponse({
          ok: false,
          mode: nextMode,
          appliedNow: false,
          shouldCloseCurrentWindow: false,
          error: error?.message || 'unknown-error'
        });
      });

    return true;
  }
});

void applyActionBehaviorByMode(currentDisplayMode).catch((error) => {
  console.error('[文字快填助手] 初始化 action 行為失敗：', error);
});

void syncDisplayModeFromStorage().catch((error) => {
  console.error('[文字快填助手] 讀取顯示模式失敗：', error);
});
