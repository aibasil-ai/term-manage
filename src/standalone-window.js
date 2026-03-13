export const STANDALONE_WINDOW_ID_KEY = 'standalonePopupWindowId';

function getStorageArea(chromeLike, storageAreaOverride) {
  if (storageAreaOverride) {
    return storageAreaOverride;
  }

  return chromeLike?.storage?.local || null;
}

async function loadStoredWindowId(storageArea) {
  if (!storageArea || typeof storageArea.get !== 'function') {
    return null;
  }

  const result = await storageArea.get(STANDALONE_WINDOW_ID_KEY);
  const value = result?.[STANDALONE_WINDOW_ID_KEY];
  return Number.isInteger(value) ? value : null;
}

async function saveStoredWindowId(storageArea, windowId) {
  if (!storageArea || typeof storageArea.set !== 'function') {
    return;
  }

  if (!Number.isInteger(windowId)) {
    return;
  }

  await storageArea.set({
    [STANDALONE_WINDOW_ID_KEY]: windowId
  });
}

async function clearStoredWindowId(storageArea) {
  if (!storageArea || typeof storageArea.remove !== 'function') {
    return;
  }

  await storageArea.remove(STANDALONE_WINDOW_ID_KEY);
}

async function resolveWindowById(chromeLike, windowId) {
  if (!Number.isInteger(windowId) || !chromeLike?.windows || typeof chromeLike.windows.get !== 'function') {
    return null;
  }

  try {
    return await chromeLike.windows.get(windowId, { populate: true });
  } catch {
    return null;
  }
}

async function resolveWindowTabId(chromeLike, windowInfo) {
  const tabFromPopulate = Array.isArray(windowInfo?.tabs) ? windowInfo.tabs.find((tab) => tab?.id) : null;
  if (tabFromPopulate?.id) {
    return tabFromPopulate.id;
  }

  if (!chromeLike?.tabs || typeof chromeLike.tabs.query !== 'function' || !windowInfo?.id) {
    return null;
  }

  const [activeTab] = await chromeLike.tabs.query({
    active: true,
    windowId: windowInfo.id
  });

  return activeTab?.id || null;
}

export async function openOrFocusStandaloneWindow(chromeLike, options) {
  const popupUrl = options?.popupUrl;
  const width = options?.width;
  const height = options?.height;
  const storageArea = getStorageArea(chromeLike, options?.storageArea);

  if (!popupUrl) {
    throw new Error('popupUrl is required');
  }

  const storedWindowId = await loadStoredWindowId(storageArea);
  const existingWindow = await resolveWindowById(chromeLike, storedWindowId);
  if (existingWindow?.id) {
    const tabId = await resolveWindowTabId(chromeLike, existingWindow);
    if (tabId && chromeLike?.tabs && typeof chromeLike.tabs.update === 'function') {
      await chromeLike.tabs.update(tabId, { url: popupUrl });
    }

    if (chromeLike?.windows && typeof chromeLike.windows.update === 'function') {
      await chromeLike.windows.update(existingWindow.id, { focused: true });
    }

    await saveStoredWindowId(storageArea, existingWindow.id);
    return {
      created: false,
      windowId: existingWindow.id
    };
  }

  await clearStoredWindowId(storageArea);

  if (!chromeLike?.windows || typeof chromeLike.windows.create !== 'function') {
    throw new Error('windows.create is not available');
  }

  const created = await chromeLike.windows.create({
    type: 'popup',
    url: popupUrl,
    width,
    height
  });

  const createdWindowId = Number.isInteger(created?.id) ? created.id : null;
  if (createdWindowId) {
    await saveStoredWindowId(storageArea, createdWindowId);
  }

  return {
    created: true,
    windowId: createdWindowId
  };
}

export async function clearStoredStandaloneWindowIfMatches(
  chromeLike,
  closedWindowId,
  options = {}
) {
  if (!Number.isInteger(closedWindowId)) {
    return;
  }

  const storageArea = getStorageArea(chromeLike, options.storageArea);
  const storedWindowId = await loadStoredWindowId(storageArea);
  if (storedWindowId !== closedWindowId) {
    return;
  }

  await clearStoredWindowId(storageArea);
}
