# Chrome 輸入框內容帶入 Extension 實作計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立一個 Chrome MV3 Extension，能在 popup 建立/管理內容項目，並把選定內容帶入當前頁面焦點輸入框。

**Architecture:** 採用 `popup` 作為使用者介面，資料透過 `chrome.storage.local` 儲存。插入行為由 `chrome.scripting.executeScript` 在目前分頁執行，直接處理 `document.activeElement`（支援 `input`、`textarea`、`contenteditable`）。

**Tech Stack:** Manifest V3、Vanilla JavaScript、Vitest、jsdom

---

### Task 1: 建立專案骨架與測試基礎

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`

**Step 1: 建立最小測試腳本**
- 先建立 `npm test` 指令（Vitest）

**Step 2: 安裝依賴**
Run: `npm install`
Expected: 安裝完成、無阻擋錯誤

**Step 3: 驗證測試框架可執行**
Run: `npm test`
Expected: 可啟動測試（即使目前沒有測試檔）

### Task 2: 以 TDD 建立儲存模組（CRUD）

**Files:**
- Create: `tests/storage.test.js`
- Create: `src/storage.js`

**Step 1: 寫失敗測試（RED）**
- 測試案例：初始化空資料、新增項目、更新項目、刪除項目

**Step 2: 驗證測試失敗（RED 驗證）**
Run: `npm test tests/storage.test.js`
Expected: 失敗，原因為 `src/storage.js` 尚未實作

**Step 3: 寫最小實作（GREEN）**
- 提供 `loadItems`、`addItem`、`updateItem`、`deleteItem`

**Step 4: 驗證通過（GREEN 驗證）**
Run: `npm test tests/storage.test.js`
Expected: 全數通過

### Task 3: 以 TDD 建立輸入框插入邏輯

**Files:**
- Create: `tests/insertion.test.js`
- Create: `src/insertion.js`

**Step 1: 寫失敗測試（RED）**
- 測試案例：
  - `input`/`textarea` 在游標位置插入
  - 有選取文字時可覆蓋
  - `contenteditable` 可追加文字
  - 插入後會觸發 `input` 事件

**Step 2: 驗證測試失敗**
Run: `npm test tests/insertion.test.js`
Expected: 失敗，因未實作

**Step 3: 寫最小實作（GREEN）**
- 實作 `insertTextIntoActiveElement(text)` 與可測試核心邏輯

**Step 4: 驗證通過**
Run: `npm test tests/insertion.test.js`
Expected: 全數通過

### Task 4: 串接 Extension UI 與注入流程

**Files:**
- Create: `manifest.json`
- Create: `popup.html`
- Create: `popup.css`
- Create: `popup.js`

**Step 1: 建立 MV3 manifest**
- 權限：`storage`、`activeTab`、`scripting`
- `action.default_popup` 指向 `popup.html`

**Step 2: 實作 popup 項目管理 UI**
- 可新增/編輯/刪除項目
- 可點擊某項目執行帶入

**Step 3: 串接帶入行為**
- 取得當前 active tab
- `chrome.scripting.executeScript` 執行插入函式
- 若沒有焦點欄位，顯示錯誤提示

**Step 4: 基本整合驗證**
Run: `npm test`
Expected: 全數單元測試通過

### Task 5: 文件與手動驗證流程

**Files:**
- Create: `README.md`

**Step 1: 撰寫安裝與使用說明**
- 載入 unpacked extension
- 如何新增項目與帶入

**Step 2: 手動驗證**
Run:
1. `npm install`
2. `npm test`
3. Chrome 載入 extension
4. 任意網頁點選輸入框，從 popup 點擊內容帶入

Expected: 功能符合目標行為
