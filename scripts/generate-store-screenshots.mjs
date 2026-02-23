import http from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist', 'store-screenshots');

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8'
};

const seededItems = [
  {
    id: 'item-1',
    title: '客服開場白',
    category: '客服',
    content: '您好，感謝您的來信，我們已收到需求並安排處理。',
    createdAt: '2026-02-23T08:00:00.000Z',
    updatedAt: '2026-02-23T08:00:00.000Z'
  },
  {
    id: 'item-2',
    title: '請假申請',
    category: '行政',
    content: '主管您好，我將於 3/3（週二）請假一天，工作已完成交接。',
    createdAt: '2026-02-23T08:10:00.000Z',
    updatedAt: '2026-02-23T08:10:00.000Z'
  },
  {
    id: 'item-3',
    title: '會議記錄模板',
    category: '會議',
    content: '會議主題：\n決議事項：\n待辦清單：\n負責人與期限：',
    createdAt: '2026-02-23T08:20:00.000Z',
    updatedAt: '2026-02-23T08:20:00.000Z'
  },
  {
    id: 'item-4',
    title: '報價回覆',
    category: '業務',
    content: '以下為本次需求的報價與交期，若確認我方即可安排製作。',
    createdAt: '2026-02-23T08:30:00.000Z',
    updatedAt: '2026-02-23T08:30:00.000Z'
  }
];

const initialStorageState = {
  snippetItems: seededItems,
  shortcutBindings: {
    'slot-1': 'item-1',
    'slot-2': 'item-4'
  },
  displayMode: 'attached',
  lastUsedSnippetItemId: 'item-1'
};

function buildMockState(overrides = {}) {
  return {
    ...initialStorageState,
    ...overrides
  };
}

async function openPopupPage(context, baseUrl, stateOverrides = {}) {
  const page = await context.newPage();

  await page.addInitScript(
    ({ seedState }) => {
      const state = JSON.parse(JSON.stringify(seedState));

      const clone = (value) => {
        if (value === undefined) {
          return undefined;
        }

        if (typeof structuredClone === 'function') {
          return structuredClone(value);
        }

        return JSON.parse(JSON.stringify(value));
      };

      function pickByKeys(keys) {
        if (keys === undefined || keys === null) {
          return clone(state);
        }

        if (typeof keys === 'string') {
          return { [keys]: clone(state[keys]) };
        }

        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach((key) => {
            result[key] = clone(state[key]);
          });
          return result;
        }

        if (typeof keys === 'object') {
          const result = {};
          Object.entries(keys).forEach(([key, defaultValue]) => {
            result[key] = key in state ? clone(state[key]) : defaultValue;
          });
          return result;
        }

        return {};
      }

      const storageArea = {
        async get(keys) {
          return pickByKeys(keys);
        },
        async set(items) {
          Object.assign(state, clone(items));
        },
        async remove(keys) {
          const list = Array.isArray(keys) ? keys : [keys];
          list.forEach((key) => {
            delete state[key];
          });
        },
        async clear() {
          Object.keys(state).forEach((key) => {
            delete state[key];
          });
        }
      };

      window.chrome = {
        storage: {
          sync: storageArea,
          local: storageArea,
          onChanged: {
            addListener() {}
          }
        },
        tabs: {
          async query() {
            return [];
          },
          async get() {
            return null;
          }
        },
        scripting: {
          async executeScript() {
            return [{ result: { ok: true } }];
          }
        },
        sidePanel: {
          async setPanelBehavior() {}
        },
        action: {
          onClicked: {
            addListener() {}
          },
          async setPopup() {}
        },
        commands: {
          onCommand: {
            addListener() {}
          }
        },
        windows: {
          async create() {
            return { id: 1 };
          }
        },
        runtime: {
          getURL: (assetPath) => assetPath,
          lastError: null
        }
      };
    },
    { seedState: buildMockState(stateOverrides) }
  );

  await page.goto(`${baseUrl}/popup.html?displayHost=window`, {
    waitUntil: 'networkidle'
  });
  await page.waitForSelector('text=已建立項目');
  await page.waitForSelector('.item');

  return page;
}

async function saveScreenshot(page, fileName) {
  const screenshotPath = path.join(outputDir, fileName);
  await page.screenshot({ path: screenshotPath });
  return screenshotPath;
}

function startStaticServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');
      const pathname = decodeURIComponent(requestUrl.pathname);
      const relativePath = pathname === '/' ? '/popup.html' : pathname;
      const sanitized = relativePath.replace(/^\/+/, '');
      const normalized = path.normalize(sanitized);
      if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
        res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }
      const filePath = path.join(rootDir, normalized);

      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }

      const content = await readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'content-type': CONTENT_TYPES[ext] || 'application/octet-stream'
      });
      res.end(content);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to get local server address'));
        return;
      }
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () =>
          new Promise((resolveClose) => {
            server.close(() => resolveClose());
          })
      });
    });
  });
}

async function generate() {
  await mkdir(outputDir, { recursive: true });

  const staticServer = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'zh-TW'
  });
  const baseUrl = staticServer.baseUrl;

  try {
    {
      const page = await openPopupPage(context, baseUrl);
      await saveScreenshot(page, '01-overview.png');
      await page.close();
    }

    {
      const page = await openPopupPage(context, baseUrl);
      await page.click('#toggle-form-button');
      await page.fill('#item-title', '新品上架公告');
      await page.fill('#item-category', '行銷');
      await page.selectOption('#item-shortcut-slot', 'slot-3');
      await page.fill('#item-content', '新品已上架，歡迎前往官網查看完整規格與優惠方案。');
      await saveScreenshot(page, '02-create-item-form.png');
      await page.close();
    }

    {
      const page = await openPopupPage(context, baseUrl);
      await page.fill('#search-input', '客服');
      await page.selectOption('#category-filter', '客服');
      await saveScreenshot(page, '03-search-and-filter.png');
      await page.close();
    }

    {
      const page = await openPopupPage(context, baseUrl);
      await page.click('button.secondary:has-text("編輯")');
      await saveScreenshot(page, '04-edit-existing-item.png');
      await page.close();
    }

    {
      const page = await openPopupPage(context, baseUrl, {
        snippetItems: seededItems.slice(0, 1),
        shortcutBindings: { 'slot-1': 'item-1' }
      });
      await page.selectOption('#display-mode-select', 'window');
      await page.dispatchEvent('#display-mode-select', 'change');
      await page.waitForTimeout(150);
      await saveScreenshot(page, '05-display-mode-and-transfer.png');
      await page.close();
    }
  } finally {
    await context.close();
    await browser.close();
    await staticServer.close();
  }

  console.log(`Screenshots generated at: ${outputDir}`);
}

generate().catch((error) => {
  console.error('Failed to generate store screenshots:', error);
  process.exitCode = 1;
});
