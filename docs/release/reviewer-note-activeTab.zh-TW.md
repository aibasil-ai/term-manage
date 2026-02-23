# Chrome Web Store 審查備註（activeTab 版本）

本版本已依建議改為最小權限模型，不再要求所有網站存取權限。

## 變更重點

- 已移除 `host_permissions` 的 `http://*/*` 與 `https://*/*`
- 權限改為僅使用：`storage`、`activeTab`、`scripting`、`sidePanel`
- 文字帶入僅在使用者明確操作時執行（例如點擊擴充功能介面中的「帶入」按鈕，或使用已設定的快捷鍵命令）

## 安全與資料處理說明

- 不會在背景持續掃描或讀取網站內容
- 不會批次蒐集瀏覽資料
- 不使用遠端程式碼；所有執行邏輯隨套件打包
- 使用者資料僅儲存在 `chrome.storage.sync` / `chrome.storage.local`，用途僅限功能運作

## 已知限制

- 受瀏覽器安全限制，`chrome://`、Chrome Web Store 等受保護頁面無法注入與帶入
