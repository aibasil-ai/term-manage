# 文字快填助手 (Chrome Extension)

這是一個 Manifest V3 Chrome Extension，提供以下功能：

- 在 popup 建立、編輯、刪除內容項目（標題 + 分類 + 內容）
- 支援關鍵字搜尋與分類篩選
- 支援匯出/匯入 JSON（覆寫現有項目）
- 在任意網頁先選取輸入框後，可從 popup 點擊項目把內容帶入
- 支援快捷鍵「不開 popup」直接帶入最近使用項目
- 支援為項目綁定「快捷鍵 1~10」槽位後直接貼上指定內容
- 資料預設透過 `chrome.storage.sync` 保存（跨裝置同步）
- 支援切換顯示模式：附著在 Chrome 側邊欄 / 原本工具列彈出 / 獨立視窗

## 開發環境

- Node.js 18+
- npm 9+
- Chrome 瀏覽器
- `zip` 指令（用於產生上架包）

## 安裝依賴

```bash
npm install
```

## 執行測試

```bash
npm test
```

## 載入 Extension（Unpacked）

1. 開啟 Chrome，進入 `chrome://extensions`
2. 開啟右上角「開發人員模式」
3. 點擊「載入未封裝項目」
4. 選擇本專案資料夾（含 `manifest.json`）

## 跨裝置同步

- 本專案預設使用 `chrome.storage.sync`，同一 Google 帳號的 Chrome 可同步資料。
- 需在 Chrome 開啟同步功能；若未開啟，資料會留在本機。
- 若執行環境不支援 `sync`，程式會回退使用 `local`。
- 既有舊版本 `local` 資料會在啟動時自動搬移到 `sync`（僅在 `sync` 尚無資料時）。

`storage.sync` 主要限制（官方配額）：
- 總容量約 `100KB`（`QUOTA_BYTES = 102400`）
- 單一 key 項目約 `8KB`（`QUOTA_BYTES_PER_ITEM = 8192`）
- `MAX_ITEMS = 512`

## 使用方式

1. 點擊工具列 Extension 圖示，開啟 extension 介面
2. 可在「顯示模式」切換：
   - 預設為 `附著在 Chrome 側邊`
   - `附著在 Chrome 側邊`：點工具列圖示會開 side panel
   - `原本彈出（工具列）`：回到原本點圖示後彈出的小視窗
   - `獨立視窗`：點工具列圖示會開獨立 popup window，並優先回到開啟當下的目標分頁進行帶入
3. 表單預設為收合，先按「新增項目」展開
4. 在「標題 / 分類 / 內容」輸入後，若需要可指定「快捷鍵槽位」
5. 按「新增項目」完成建立
6. 可用上方搜尋框與分類下拉快速找項目
7. 需要備份時可按「匯出 JSON」，還原時按「匯入 JSON」
8. 到任意網頁，先點一下目標輸入框（`input`、`textarea` 或 `contenteditable`）
9. 回到 extension 介面，對某項目按「帶入」
10. 內容會插入目前焦點輸入欄位

## 帶入權限與限制

- 已在 `manifest.json` 設定 `host_permissions` 為 `http://*/*` 與 `https://*/*`，可對一般網站輸入框帶入文字。
- 以下頁面因 Chrome 安全限制，無法注入腳本與帶入內容：
  - `chrome://*`
  - `chrome-extension://*`
  - Chrome Web Store 與其他瀏覽器內建保護頁面
- 如果看到「Cannot access a chrome:// URL」或類似訊息，請切換到一般網站分頁後再帶入。

## 上架 Chrome Web Store

1. 先執行測試  
   `npm test`
2. 產生上架 zip  
   `npm run package:zip`
3. 上傳 `dist/term-manage-extension-v<version>.zip` 到 Chrome Web Store Developer Dashboard
4. 依清單完成商店頁、隱私與權限揭露

上架文件：
- `docs/release/chrome-web-store-publish-checklist.zh-TW.md`
- `docs/release/privacy-policy-template.zh-TW.md`
- `docs/release/store-screenshots.md`

### 商店素材自動產生

```bash
# 1) 產生最多 5 張商店截圖（1280x800）
npm run screenshots:store

# 2) 產生小型宣傳圖塊（440x280）
npm run assets:promo

# 3) 產生 Marquee 宣傳圖（1400x560）
npm run assets:marquee
```

輸出目錄：
- 截圖：`dist/store-screenshots/`
- 宣傳圖：`dist/store-assets/`

## 快捷鍵使用（不開 popup）

1. 進入 `chrome://extensions/shortcuts`
2. 找到 `文字快填助手` 的以下命令並自訂按鍵：
   - `insert-last-used-snippet`
   - `insert-snippet-slot-01` 到 `insert-snippet-slot-10`
3. 在任意網頁先點選輸入框後，按對應快捷鍵即可插入

規則：
- 快捷鍵會優先插入「最近一次成功帶入」的項目
- 如果沒有最近使用項目，會退回插入第一筆項目
- `insert-snippet-slot-01` 到 `insert-snippet-slot-10` 會插入對應槽位綁定的項目

## 匯入格式

可匯入兩種 JSON 格式：

1. 物件格式（建議）
```json
{
  "version": 1,
  "items": [
    { "title": "標題", "category": "分類", "content": "內容" }
  ]
}
```

2. 陣列格式
```json
[
  { "title": "標題", "content": "內容" }
]
```

匯入時：
- `title` 與 `content` 必填
- `category` 可省略，省略時會設為 `未分類`

## 專案結構

- `manifest.json`: MV3 設定
- `background.js`: 快捷鍵命令監聽與執行
- `popup.html` / `popup.css` / `popup.js`: UI 與交互邏輯
- `src/storage.js`: 項目儲存 CRUD
- `src/transfer.js`: 匯入匯出 JSON 處理
- `src/filtering.js`: 分類與搜尋過濾邏輯
- `src/shortcut.js`: 快捷鍵目標項目挑選邏輯
- `src/shortcut-binding.js`: 快捷鍵槽位綁定規則與命令映射
- `src/page-inject.js`: 注入頁面輸入框的可執行函式
- `src/insertion.js`: 可測試的插入核心邏輯
- `tests/storage.test.js`: 儲存模組測試
- `tests/transfer.test.js`: 匯入匯出測試
- `tests/filtering.test.js`: 過濾邏輯測試
- `tests/shortcut.test.js`: 快捷鍵項目挑選測試
- `tests/shortcut-binding.test.js`: 快捷鍵綁定規則測試
- `tests/insertion.test.js`: 插入邏輯測試
- `docs/plans/2026-02-23-chrome-snippet-extension.md`: 初版實作計畫
- `docs/plans/2026-02-23-extension-enhancements-123.md`: 1/2/3 增強計畫
