import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist', 'store-assets');
const pngPath = path.join(outputDir, 'small-promo-tile-440x280.png');
const jpgPath = path.join(outputDir, 'small-promo-tile-440x280.jpg');

async function toDataUrl(filePath, mimeType) {
  const bytes = await readFile(filePath);
  const base64 = bytes.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

async function generateSmallPromoTile() {
  await mkdir(outputDir, { recursive: true });

  const iconDataUrl = await toDataUrl(path.join(rootDir, 'icons', 'icon-128.png'), 'image/png');
  const overviewDataUrl = await toDataUrl(
    path.join(rootDir, 'dist', 'store-screenshots', '01-overview.png'),
    'image/png'
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: {
      width: 440,
      height: 280
    }
  });

  const html = `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        width: 440px;
        height: 280px;
        overflow: hidden;
        font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
      }
      .tile {
        position: relative;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #ecfeff 0%, #e2e8f0 45%, #cbd5e1 100%);
        color: #0f172a;
      }
      .hero {
        position: absolute;
        inset: 0;
        opacity: 0.14;
        background-image: url('${overviewDataUrl}');
        background-size: cover;
        background-position: center top;
        filter: saturate(1.1) contrast(1.05);
      }
      .overlay {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 86% 10%, rgba(15, 118, 110, 0.24), transparent 42%),
          radial-gradient(circle at 8% 90%, rgba(30, 64, 175, 0.18), transparent 36%);
      }
      .content {
        position: relative;
        z-index: 1;
        height: 100%;
        padding: 18px;
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr auto;
        gap: 10px;
      }
      .top {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .icon {
        width: 42px;
        height: 42px;
        border-radius: 11px;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.2);
        background: #fff;
        padding: 5px;
      }
      .title {
        margin: 0;
        font-size: 27px;
        line-height: 1.1;
        font-weight: 900;
        letter-spacing: 0.3px;
      }
      .subtitle {
        margin: 2px 0 0;
        font-size: 13px;
        color: #334155;
        font-weight: 700;
      }
      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-content: start;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 7px 11px;
        font-size: 13px;
        font-weight: 800;
        border: 1px solid rgba(15, 23, 42, 0.08);
        backdrop-filter: blur(1px);
      }
      .badge.teal {
        color: #115e59;
        background: rgba(204, 251, 241, 0.92);
      }
      .badge.blue {
        color: #1d4ed8;
        background: rgba(219, 234, 254, 0.92);
      }
      .badge.slate {
        color: #334155;
        background: rgba(241, 245, 249, 0.96);
      }
      .bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .note {
        margin: 0;
        font-size: 12px;
        color: #475569;
        font-weight: 700;
      }
      .cta {
        border-radius: 8px;
        background: #0f766e;
        color: #fff;
        font-size: 12px;
        font-weight: 800;
        padding: 7px 10px;
      }
    </style>
  </head>
  <body>
    <div class="tile">
      <div class="hero"></div>
      <div class="overlay"></div>
      <div class="content">
        <div class="top">
          <img class="icon" src="${iconDataUrl}" alt="icon" />
          <div>
            <h1 class="title">文字快填助手</h1>
            <p class="subtitle">快速帶入常用文字到任意輸入框</p>
          </div>
        </div>
        <div class="badges">
          <span class="badge teal">項目管理</span>
          <span class="badge blue">快捷鍵 1-10</span>
          <span class="badge slate">搜尋 / 分類 / 匯入匯出</span>
        </div>
        <div class="bottom">
          <p class="note">Chrome Extension</p>
          <span class="cta">效率提升</span>
        </div>
      </div>
    </div>
  </body>
</html>`;

  await page.setContent(html, { waitUntil: 'load' });

  await page.screenshot({
    path: pngPath,
    type: 'png'
  });

  await page.screenshot({
    path: jpgPath,
    type: 'jpeg',
    quality: 92
  });

  await browser.close();

  console.log('Generated small promo tile:');
  console.log(`- ${pngPath}`);
  console.log(`- ${jpgPath}`);
}

generateSmallPromoTile().catch((error) => {
  console.error('Failed to generate small promo tile:', error);
  process.exitCode = 1;
});
