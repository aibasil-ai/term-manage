import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

function loadPopupDocument() {
  const html = readFileSync(resolve(process.cwd(), 'popup.html'), 'utf8');
  return new JSDOM(html).window.document;
}

describe('popup items header layout', () => {
  it('places title and filters in the same header row container', () => {
    const document = loadPopupDocument();
    const header = document.querySelector('.items-header');

    expect(header).not.toBeNull();
    expect(header?.querySelector('h2')?.textContent).toContain('已建立項目');
    expect(header?.querySelector('.filters')).not.toBeNull();
  });
});
