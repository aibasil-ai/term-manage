import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

function loadPopupDocument() {
  const html = readFileSync(resolve(process.cwd(), 'popup.html'), 'utf8');
  return new JSDOM(html).window.document;
}

describe('popup display mode panel', () => {
  it('renders display mode section hidden by default and controlled by a toggle button', () => {
    const document = loadPopupDocument();
    const toggleButton = document.querySelector('#toggle-display-mode-button');
    const section = document.querySelector('#display-mode-section');

    expect(toggleButton).not.toBeNull();
    expect(section).not.toBeNull();
    expect(section?.classList.contains('hidden')).toBe(true);

    const select = section?.querySelector('#display-mode-select');
    expect(select).not.toBeNull();
  });
});
