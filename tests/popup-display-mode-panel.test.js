import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

function loadPopupDocument() {
  const html = readFileSync(resolve(process.cwd(), 'popup.html'), 'utf8');
  return new JSDOM(html).window.document;
}

describe('popup display mode panel', () => {
  it('renders display mode as collapsed details panel by default', () => {
    const document = loadPopupDocument();
    const panel = document.querySelector('#display-mode-panel');

    expect(panel).not.toBeNull();
    expect(panel?.tagName).toBe('DETAILS');
    expect(panel?.hasAttribute('open')).toBe(false);

    const summary = panel?.querySelector('summary');
    expect(summary).not.toBeNull();
    expect(summary?.textContent).toContain('顯示模式');

    const select = panel?.querySelector('#display-mode-select');
    expect(select).not.toBeNull();
  });
});
