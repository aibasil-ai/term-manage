import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist', 'store-assets');
const pngPath = path.join(outputDir, 'marquee-promo-1400x560.png');
const jpgPath = path.join(outputDir, 'marquee-promo-1400x560.jpg');

async function toDataUrl(filePath, mimeType) {
  const bytes = await readFile(filePath);
  const base64 = bytes.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

async function generateMarqueePromo() {
  await mkdir(outputDir, { recursive: true });

  const iconDataUrl = await toDataUrl(path.join(rootDir, 'icons', 'icon-128.png'), 'image/png');
  const overviewDataUrl = await toDataUrl(
    path.join(rootDir, 'dist', 'store-screenshots', '01-overview.png'),
    'image/png'
  );
  const filterDataUrl = await toDataUrl(
    path.join(rootDir, 'dist', 'store-screenshots', '03-search-and-filter.png'),
    'image/png'
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: {
      width: 1400,
      height: 560
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
        width: 1400px;
        height: 560px;
        overflow: hidden;
        font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
      }
      .canvas {
        position: relative;
        width: 100%;
        height: 100%;
        background: linear-gradient(128deg, #ecfeff 0%, #dbeafe 40%, #e2e8f0 100%);
        color: #0f172a;
      }
      .glow {
        position: absolute;
        border-radius: 999px;
        filter: blur(40px);
        opacity: 0.7;
      }
      .glow-a {
        width: 520px;
        height: 520px;
        top: -210px;
        right: -80px;
        background: rgba(15, 118, 110, 0.35);
      }
      .glow-b {
        width: 440px;
        height: 440px;
        left: -120px;
        bottom: -220px;
        background: rgba(29, 78, 216, 0.3);
      }
      .layout {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: 1.12fr 1fr;
        gap: 26px;
        width: 100%;
        height: 100%;
        padding: 42px;
      }
      .left {
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        gap: 18px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .brand-icon {
        width: 64px;
        height: 64px;
        border-radius: 14px;
        padding: 8px;
        background: #fff;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
      }
      .title {
        margin: 0;
        font-size: 58px;
        line-height: 1;
        letter-spacing: 0.4px;
        font-weight: 900;
      }
      .subtitle {
        margin: 8px 0 0;
        font-size: 28px;
        line-height: 1.2;
        color: #1e293b;
        font-weight: 750;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .chip {
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 20px;
        font-weight: 800;
        border: 1px solid rgba(15, 23, 42, 0.08);
      }
      .chip.teal {
        color: #115e59;
        background: rgba(204, 251, 241, 0.96);
      }
      .chip.blue {
        color: #1d4ed8;
        background: rgba(219, 234, 254, 0.96);
      }
      .chip.slate {
        color: #334155;
        background: rgba(241, 245, 249, 0.98);
      }
      .feature {
        margin: 0;
        align-self: end;
        font-size: 23px;
        line-height: 1.35;
        color: #334155;
        font-weight: 700;
      }
      .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .platform {
        margin: 0;
        font-size: 19px;
        color: #334155;
        font-weight: 800;
      }
      .badge {
        border-radius: 10px;
        background: #0f766e;
        color: #fff;
        font-size: 18px;
        font-weight: 900;
        padding: 10px 16px;
      }
      .right {
        position: relative;
      }
      .shot {
        position: absolute;
        border-radius: 18px;
        overflow: hidden;
        background: #fff;
        border: 1px solid rgba(148, 163, 184, 0.35);
        box-shadow: 0 18px 46px rgba(15, 23, 42, 0.2);
      }
      .shot img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: top;
      }
      .shot-main {
        width: 590px;
        height: 370px;
        right: 0;
        top: 22px;
      }
      .shot-second {
        width: 470px;
        height: 260px;
        left: 0;
        bottom: 8px;
        border: 4px solid rgba(255, 255, 255, 0.86);
      }
    </style>
  </head>
  <body>
    <section class="canvas">
      <div class="glow glow-a"></div>
      <div class="glow glow-b"></div>
      <div class="layout">
        <div class="left">
          <div class="brand">
            <img class="brand-icon" src="${iconDataUrl}" alt="icon" />
            <div>
              <h1 class="title">文字快填助手</h1>
              <p class="subtitle">快速管理、搜尋並插入常用文字</p>
            </div>
          </div>
          <div class="chips">
            <span class="chip teal">項目管理</span>
            <span class="chip blue">快捷鍵 1-10</span>
            <span class="chip slate">匯入 / 匯出 / 分類篩選</span>
          </div>
          <p class="feature">在任意網站輸入框一鍵帶入內容，提升客服、行政與業務回覆效率。</p>
          <div class="footer">
            <p class="platform">Chrome Extension</p>
            <span class="badge">提升輸入效率</span>
          </div>
        </div>
        <div class="right">
          <div class="shot shot-main">
            <img src="${overviewDataUrl}" alt="overview" />
          </div>
          <div class="shot shot-second">
            <img src="${filterDataUrl}" alt="filter" />
          </div>
        </div>
      </div>
    </section>
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

  console.log('Generated marquee promo:');
  console.log(`- ${pngPath}`);
  console.log(`- ${jpgPath}`);
}

generateMarqueePromo().catch((error) => {
  console.error('Failed to generate marquee promo:', error);
  process.exitCode = 1;
});
