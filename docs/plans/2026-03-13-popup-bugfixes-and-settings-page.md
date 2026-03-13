# Popup Bugfixes And Settings Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修正獨立視窗重複開啟與列表排序問題，重整 popup 介面（顯示模式與設定面板），並新增 sync 容量統計顯示。

**Architecture:** 以最小侵入方式調整現有 `popup.html/js/css` 與 `background.js`。資料模型維持既有 `storage` 模組，新增輕量 helper 供 sync 容量查詢與獨立視窗單例管理。UI 採按鈕切換面板，不增加新頁面路由。

**Tech Stack:** Chrome Extension Manifest V3、Vanilla JS、Vitest、JSDOM。

---

### Task 1: 獨立視窗只允許單例

**Files:**
- Create: `tests/standalone-window.test.js`
- Create: `src/standalone-window.js`
- Modify: `background.js`

**Step 1: Write the failing test**
- 為 `src/standalone-window.js` 寫測試，涵蓋：
  - 已有 popup 視窗時回傳既有視窗 id（不重複 create）。
  - 無既有視窗時建立新視窗。
  - URL 比對可忽略 query 參數差異（`targetTabId`/`targetWindowId`）。

**Step 2: Run test to verify it fails**
- Run: `npm test -- tests/standalone-window.test.js`
- Expected: FAIL（模組不存在或行為未實作）

**Step 3: Write minimal implementation**
- 實作 `findStandaloneWindow` 與 `openOrFocusStandaloneWindow`。
- 在 `background.js` 改用 helper，讓 `openStandaloneWindow` 先找既有視窗再決定 create/focus。

**Step 4: Run test to verify it passes**
- Run: `npm test -- tests/standalone-window.test.js`
- Expected: PASS

### Task 2: 新增項目改為置頂

**Files:**
- Modify: `tests/storage.test.js`
- Modify: `src/storage.js`

**Step 1: Write the failing test**
- 在 `storage` 測試新增「連續新增兩筆時，第二筆在索引 0」。

**Step 2: Run test to verify it fails**
- Run: `npm test -- tests/storage.test.js`
- Expected: FAIL（目前行為是 append）

**Step 3: Write minimal implementation**
- `addItem` 改為 `const nextItems = [item, ...items]`。

**Step 4: Run test to verify it passes**
- Run: `npm test -- tests/storage.test.js`
- Expected: PASS

### Task 3: 顯示模式改為隱藏，透過按鈕切換

**Files:**
- Modify: `tests/popup-display-mode-panel.test.js`
- Modify: `popup.html`
- Modify: `popup.js`
- Modify: `popup.css`

**Step 1: Write the failing test**
- 驗證存在 `#toggle-display-mode-button`，且 `#display-mode-section` 預設為 hidden。

**Step 2: Run test to verify it fails**
- Run: `npm test -- tests/popup-display-mode-panel.test.js`
- Expected: FAIL

**Step 3: Write minimal implementation**
- 在 `新增項目` 左邊加入 `顯示模式` 按鈕。
- `display-mode-section` 預設隱藏；按鈕點擊切換顯示。

**Step 4: Run test to verify it passes**
- Run: `npm test -- tests/popup-display-mode-panel.test.js`
- Expected: PASS

### Task 4: 新增設定面板並搬移資料傳輸

**Files:**
- Create: `tests/popup-settings-panel.test.js`
- Modify: `popup.html`
- Modify: `popup.js`
- Modify: `popup.css`

**Step 1: Write the failing test**
- 驗證存在 `#toggle-settings-button`，以及 `#settings-panel` 內含匯出匯入按鈕。

**Step 2: Run test to verify it fails**
- Run: `npm test -- tests/popup-settings-panel.test.js`
- Expected: FAIL

**Step 3: Write minimal implementation**
- 新增「設定」按鈕（在 `新增項目` 左邊）。
- 新增 `settings-panel`，將資料傳輸區塊移入此面板。

**Step 4: Run test to verify it passes**
- Run: `npm test -- tests/popup-settings-panel.test.js`
- Expected: PASS

### Task 5: 搜尋框與分類移到「已建立項目」同一列

**Files:**
- Create: `tests/popup-items-header-layout.test.js`
- Modify: `popup.html`
- Modify: `popup.css`

**Step 1: Write the failing test**
- 驗證 `h2` 與 `.filters` 同屬 `items-header` 容器。

**Step 2: Run test to verify it fails**
- Run: `npm test -- tests/popup-items-header-layout.test.js`
- Expected: FAIL

**Step 3: Write minimal implementation**
- 調整 HTML 結構與 CSS 排版，使標題與篩選在同列且可換行。

**Step 4: Run test to verify it passes**
- Run: `npm test -- tests/popup-items-header-layout.test.js`
- Expected: PASS

### Task 6: 新增 sync 容量統計

**Files:**
- Modify: `tests/storage-area.test.js`
- Modify: `src/storage-area.js`
- Modify: `popup.html`
- Modify: `popup.js`

**Step 1: Write the failing test**
- 新增 `getSyncUsageStats` 測試：可回傳 `bytesInUse` 與 `quotaBytes`，sync 不可用時回傳 null。

**Step 2: Run test to verify it fails**
- Run: `npm test -- tests/storage-area.test.js`
- Expected: FAIL

**Step 3: Write minimal implementation**
- 在 `src/storage-area.js` 加入 `getSyncUsageStats`。
- 在設定面板顯示容量文字，初始化與資料變動後刷新。

**Step 4: Run test to verify it passes**
- Run: `npm test -- tests/storage-area.test.js`
- Expected: PASS

### Task 7: 全面驗證

**Files:**
- Modify: `popup.html`
- Modify: `popup.js`
- Modify: `popup.css`
- Modify: `background.js`
- Modify: `src/storage.js`
- Modify: `src/storage-area.js`
- Modify: `tests/*.test.js`

**Step 1: Run full test suite**
- Run: `npm test`
- Expected: 全部 PASS

**Step 2: Manual sanity checklist**
- 獨立視窗模式連點工具列圖示不會重複開新視窗。
- 新增項目後顯示於列表最上方。
- 顯示模式與設定面板可由按鈕展開/收合。
- 匯出匯入位於設定面板。
- 項目標題列與篩選元件同列。
- 設定面板可見 sync 使用量統計。
