import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

function loadPopupDocument() {
  const html = readFileSync(resolve(process.cwd(), 'popup.html'), 'utf8');
  return new JSDOM(html).window.document;
}

describe('popup action buttons icons', () => {
  it('renders icons for settings, display mode and create item buttons', () => {
    const document = loadPopupDocument();
    const ids = [
      '#toggle-settings-button',
      '#toggle-display-mode-button',
      '#toggle-form-button'
    ];

    ids.forEach((id) => {
      const button = document.querySelector(id);
      expect(button).not.toBeNull();
      expect(button?.querySelector('.button-icon')).not.toBeNull();
      expect(button?.querySelector('.sr-only')).not.toBeNull();
      expect(button?.getAttribute('title')).toBeTruthy();
    });
  });
});
