# Chrome Web Store 審查備註（網站存取權限版本）

本版本使用網站存取權限（`http://*/*`、`https://*/*`）以支援在一般網站的輸入欄位帶入文字內容。

## 權限重點

- 目前權限為：`storage`、`activeTab`、`scripting`、`sidePanel`
- 目前網站存取範圍為：`http://*/*`、`https://*/*`
- 文字帶入僅在使用者明確操作時執行（例如點擊擴充功能介面中的「帶入」按鈕，或使用已設定的快捷鍵命令）
- 網站存取權限用途為在目前分頁執行 `chrome.scripting.executeScript`，將使用者已儲存文字帶入焦點輸入欄位

## 安全與資料處理說明

- 不會在背景持續掃描或讀取網站內容
- 不會批次蒐集瀏覽資料
- 不使用遠端程式碼；所有執行邏輯隨套件打包
- 使用者資料僅儲存在 `chrome.storage.sync` / `chrome.storage.local`，用途僅限功能運作

## 已知限制

- 受瀏覽器安全限制，`chrome://`、Chrome Web Store 等受保護頁面無法注入與帶入
