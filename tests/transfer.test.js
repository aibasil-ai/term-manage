import { describe, it, expect } from 'vitest';
import { serializeItemsForExport, parseItemsFromImportText } from '../src/transfer.js';

describe('transfer module', () => {
  it('serializes items with versioned payload', () => {
    const json = serializeItemsForExport([
      { title: '標題', content: '內容', category: '分類' }
    ]);

    const payload = JSON.parse(json);
    expect(payload.version).toBe(1);
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]).toMatchObject({
      title: '標題',
      content: '內容',
      category: '分類'
    });
  });

  it('parses object payload with items', () => {
    const text = JSON.stringify({
      version: 1,
      items: [
        { title: '標題一', content: '內容一', category: 'A' },
        { title: '標題二', content: '內容二' }
      ]
    });

    const items = parseItemsFromImportText(text);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      title: '標題一',
      content: '內容一',
      category: 'A'
    });
  });

  it('parses plain array payload', () => {
    const text = JSON.stringify([
      { title: 'X', content: 'Y' }
    ]);

    const items = parseItemsFromImportText(text);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: 'X',
      content: 'Y'
    });
  });

  it('throws for invalid JSON', () => {
    expect(() => parseItemsFromImportText('{ bad json')).toThrow(/JSON/i);
  });

  it('throws when title or content is missing', () => {
    const text = JSON.stringify({
      items: [{ title: '', content: 'ok' }]
    });

    expect(() => parseItemsFromImportText(text)).toThrow(/title/i);
  });
});
