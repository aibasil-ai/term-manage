import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

function loadPopupDocument() {
  const html = readFileSync(resolve(process.cwd(), 'popup.html'), 'utf8');
  return new JSDOM(html).window.document;
}

describe('popup settings panel', () => {
  it('contains toggle button and transfer actions inside settings panel', () => {
    const document = loadPopupDocument();

    const toggleSettingsButton = document.querySelector('#toggle-settings-button');
    expect(toggleSettingsButton).not.toBeNull();

    const settingsPanel = document.querySelector('#settings-panel');
    expect(settingsPanel).not.toBeNull();

    const exportButton = settingsPanel?.querySelector('#export-button');
    const importButton = settingsPanel?.querySelector('#import-button');
    expect(exportButton).not.toBeNull();
    expect(importButton).not.toBeNull();

    const syncUsageBar = settingsPanel?.querySelector('#sync-usage-bar');
    expect(syncUsageBar).not.toBeNull();
  });
});
