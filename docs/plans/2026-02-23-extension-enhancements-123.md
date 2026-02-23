# Chrome Extension Enhancements (1-2-3) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 依序完成匯入/匯出、分類與搜尋、快捷鍵無 popup 帶入三項增強功能。

**Architecture:** 延續 MV3 popup + storage 架構，新增 transfer/filter/page-inject 模組提升可測試性。快捷鍵由 service worker 監聽 `chrome.commands`，使用 `scripting.executeScript` 注入頁面。最近使用項目 ID 存於 storage，供快捷鍵插入。

**Tech Stack:** Chrome Extension Manifest V3、Vanilla JavaScript、Vitest + jsdom

---

### Task 1: 匯入/匯出 JSON（TDD）

**Files:**
- Create: `src/transfer.js`
- Modify: `src/storage.js`
- Modify: `tests/storage.test.js`
- Create: `tests/transfer.test.js`
- Modify: `popup.html`
- Modify: `popup.js`
- Modify: `popup.css`

**Step 1: 寫 transfer 模組失敗測試（RED）**
Run: `npm test tests/transfer.test.js`
Expected: FAIL（模組或函式不存在）

**Step 2: 實作最小 transfer 模組（GREEN）**
Run: `npm test tests/transfer.test.js`
Expected: PASS

**Step 3: 寫 storage 批次覆寫/最近使用失敗測試（RED）**
Run: `npm test tests/storage.test.js`
Expected: FAIL（新函式不存在）

**Step 4: 實作 storage 新函式（GREEN）**
Run: `npm test tests/storage.test.js`
Expected: PASS

**Step 5: 串接 popup 匯入/匯出 UI**
Run: `npm test`
Expected: 既有測試皆 PASS

### Task 2: 分類與搜尋（TDD）

**Files:**
- Create: `src/filtering.js`
- Create: `tests/filtering.test.js`
- Modify: `src/storage.js`
- Modify: `tests/storage.test.js`
- Modify: `popup.html`
- Modify: `popup.js`
- Modify: `popup.css`

**Step 1: 寫 filtering 模組失敗測試（RED）**
Run: `npm test tests/filtering.test.js`
Expected: FAIL

**Step 2: 實作 filtering 模組（GREEN）**
Run: `npm test tests/filtering.test.js`
Expected: PASS

**Step 3: 擴充 storage category 測試（RED）**
Run: `npm test tests/storage.test.js`
Expected: FAIL

**Step 4: 實作 category 正規化與儲存（GREEN）**
Run: `npm test tests/storage.test.js`
Expected: PASS

**Step 5: 串接 popup 分類與搜尋 UI**
Run: `npm test`
Expected: 全測試 PASS

### Task 3: 快捷鍵無 popup 帶入（TDD + Integration）

**Files:**
- Create: `src/page-inject.js`
- Create: `background.js`
- Modify: `manifest.json`
- Modify: `popup.js`
- Modify: `README.md`

**Step 1: 抽出頁面注入函式並維持既有測試（RED/GREEN）**
Run: `npm test tests/insertion.test.js`
Expected: PASS（確保行為未退化）

**Step 2: 新增 commands/background 串接**
Run: `npm test`
Expected: 全測試 PASS

**Step 3: 文件更新 + 手動驗證指引**
Run: `npm test`
Expected: 全測試 PASS

### Final Verification

Run:
1. `npm test`
2. 手動載入 extension，測試：匯入/匯出、分類搜尋、快捷鍵插入

Expected:
- 測試全部通過
- 三項功能可操作
