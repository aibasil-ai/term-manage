import { describe, expect, it, vi } from 'vitest';
import {
  STANDALONE_WINDOW_ID_KEY,
  openOrFocusStandaloneWindow,
  clearStoredStandaloneWindowIfMatches
} from '../src/standalone-window.js';

function createMockStorage(initialState = {}) {
  const state = { ...initialState };
  return {
    async get(key) {
      return { [key]: state[key] };
    },
    async set(values) {
      Object.assign(state, values);
    },
    async remove(key) {
      delete state[key];
    },
    dump() {
      return { ...state };
    }
  };
}

function createChromeLike({
  storage,
  windowsGetResult,
  windowsGetError,
  windowsCreateResult = { id: 999 }
} = {}) {
  return {
    storage: {
      local: storage || createMockStorage()
    },
    windows: {
      get: windowsGetError
        ? vi.fn().mockRejectedValue(windowsGetError)
        : vi.fn().mockResolvedValue(windowsGetResult),
      update: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(windowsCreateResult)
    },
    tabs: {
      update: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([{ id: 201 }])
    }
  };
}

describe('standalone window helper', () => {
  it('focuses existing standalone window by stored window id', async () => {
    const storage = createMockStorage({
      [STANDALONE_WINDOW_ID_KEY]: 103
    });
    const chromeLike = createChromeLike({
      storage,
      windowsGetResult: {
        id: 103,
        tabs: [{ id: 203 }]
      }
    });

    const result = await openOrFocusStandaloneWindow(chromeLike, {
      popupUrl: 'chrome-extension://abc/popup.html?displayHost=window&targetWindowId=7',
      width: 440,
      height: 760
    });

    expect(result).toEqual({ created: false, windowId: 103 });
    expect(chromeLike.windows.create).not.toHaveBeenCalled();
    expect(chromeLike.windows.get).toHaveBeenCalledWith(103, { populate: true });
    expect(chromeLike.tabs.update).toHaveBeenCalledWith(203, {
      url: 'chrome-extension://abc/popup.html?displayHost=window&targetWindowId=7'
    });
    expect(chromeLike.windows.update).toHaveBeenCalledWith(103, { focused: true });
  });

  it('creates new window and stores window id when stored id is stale', async () => {
    const storage = createMockStorage({
      [STANDALONE_WINDOW_ID_KEY]: 888
    });
    const chromeLike = createChromeLike({
      storage,
      windowsGetError: new Error('Window not found'),
      windowsCreateResult: { id: 500 }
    });

    const result = await openOrFocusStandaloneWindow(chromeLike, {
      popupUrl: 'chrome-extension://abc/popup.html?displayHost=window',
      width: 440,
      height: 760
    });

    expect(result).toEqual({ created: true, windowId: 500 });
    expect(chromeLike.windows.create).toHaveBeenCalledWith({
      type: 'popup',
      url: 'chrome-extension://abc/popup.html?displayHost=window',
      width: 440,
      height: 760
    });
    expect(storage.dump()[STANDALONE_WINDOW_ID_KEY]).toBe(500);
  });

  it('falls back to active tab query when populated tab list is missing', async () => {
    const storage = createMockStorage({
      [STANDALONE_WINDOW_ID_KEY]: 120
    });
    const chromeLike = createChromeLike({
      storage,
      windowsGetResult: {
        id: 120,
        tabs: []
      }
    });

    await openOrFocusStandaloneWindow(chromeLike, {
      popupUrl: 'chrome-extension://abc/popup.html?displayHost=window&targetTabId=33',
      width: 440,
      height: 760
    });

    expect(chromeLike.tabs.query).toHaveBeenCalledWith({
      active: true,
      windowId: 120
    });
    expect(chromeLike.tabs.update).toHaveBeenCalledWith(201, {
      url: 'chrome-extension://abc/popup.html?displayHost=window&targetTabId=33'
    });
  });

  it('clears stored standalone id when closed window matches', async () => {
    const storage = createMockStorage({
      [STANDALONE_WINDOW_ID_KEY]: 321
    });
    const chromeLike = {
      storage: {
        local: storage
      }
    };

    await clearStoredStandaloneWindowIfMatches(chromeLike, 321);
    expect(storage.dump()[STANDALONE_WINDOW_ID_KEY]).toBeUndefined();
  });
});
