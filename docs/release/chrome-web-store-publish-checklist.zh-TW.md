# Chrome Web Store 上架檢查清單（2026-02-23）

## 0. 發佈前技術檢查

- [ ] 測試通過：`npm test`
- [ ] 可正常打包：`npm run package:zip`
- [ ] `manifest.json` 為 Manifest V3，版本號正確（每次上架都要遞增 `version`）
- [ ] 不含測試檔、`node_modules`、開發工具檔於上架 zip
- [ ] 權限最小化（目前實際使用：`storage`、`activeTab`、`scripting`、`sidePanel`）

## 1. 開發者帳號與主控台

- [ ] 使用可長期維護的 Google 帳號登入 Chrome Web Store Developer Dashboard
- [ ] 完成開發者註冊與驗證流程
- [ ] 開啟該帳號的兩步驟驗證（2SV）

## 2. 上傳套件

- [ ] 執行 `npm run package:zip`
- [ ] 取得 `dist/term-manage-extension-v<版本>.zip`
- [ ] 在 Developer Dashboard 建立新項目並上傳 zip

## 3. Store Listing（商店頁）素材

- [ ] Extension 名稱（建議：`文字快填助手`）
- [ ] 短描述（132 字內）
- [ ] 完整描述（功能、使用情境、限制）
- [ ] 至少 1 張截圖（建議 1280x800 或 640x400，最多 5 張）
- [ ] 小型宣傳圖（440x280，必填）
- [ ] 128x128 商店圖示（已在專案：`icons/icon-128.png`）
- [ ] 類別、語言、聯絡信箱

## 4. 隱私與權限揭露

- [ ] 填寫隱私實務（Privacy practices）
- [ ] 針對各權限填寫用途說明（尤其是 `scripting`、`activeTab`）
- [ ] 提供公開可存取的隱私權政策 URL（可用 GitHub Pages 或官網）
- [ ] 確認資料僅用於功能本身，不做未揭露的追蹤或販售

可直接改寫使用：`docs/release/privacy-policy-template.zh-TW.md`

## 5. 審核與發佈

- [ ] 送審前再做一次手動 smoke test（一般網站、`chrome://` 受限頁、側欄/彈出/獨立視窗）
- [ ] 送出審核並等待結果
- [ ] 若被退件，依 reviewer 意見修正後重新上傳
- [ ] 通過後選擇立即發佈或排程發佈

## 6. 這個專案的建議填寫文案（可直接貼）

### 單一用途（Single purpose）
此擴充功能提供「可重用文字片段管理與快速帶入」能力，讓使用者在網頁輸入框快速插入已儲存內容。

### 權限用途
- `storage`: 儲存使用者建立的文字項目與偏好設定（含快捷鍵槽位、顯示模式）。
- `activeTab`: 取得當前作用中分頁，以便把文字帶入使用者選取的輸入框。
- `scripting`: 注入帶入函式至目前分頁的輸入元素（`input`/`textarea`/`contenteditable`）。
- `sidePanel`: 提供附著在 Chrome 側邊欄的操作介面。

### 已知限制（建議寫在描述）
- 因瀏覽器安全限制，無法在 `chrome://`、Chrome Web Store 等受保護頁面帶入文字。

## 7. 常見退件風險

- 權限說明太模糊，無法對應實際功能
- 隱私政策連結無法開啟或內容過於空泛
- 商店描述未說明限制（例如 `chrome://` 不能注入）
- 上傳包包含與執行無關內容，或版本號未遞增
