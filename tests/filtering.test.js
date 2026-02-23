import { describe, it, expect } from 'vitest';
import { filterItems, buildCategoryOptions } from '../src/filtering.js';

const sampleItems = [
  { title: '客服回覆', content: '您好，我們已收到您的需求', category: '客服' },
  { title: '工作日報', content: '今日完成任務 A 與 B', category: '工作' },
  { title: '未分類範本', content: '一般內容', category: '未分類' }
];

describe('filtering module', () => {
  it('filters by search query across title/content/category', () => {
    const result = filterItems(sampleItems, { query: '客服', category: '全部' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('客服回覆');
  });

  it('filters by category', () => {
    const result = filterItems(sampleItems, { category: '工作' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('工作日報');
  });

  it('returns all items when query/category are not set', () => {
    const result = filterItems(sampleItems, {});
    expect(result).toHaveLength(3);
  });

  it('builds category options with 全部 as first option', () => {
    const categories = buildCategoryOptions(sampleItems);
    expect(categories[0]).toBe('全部');
    expect(categories).toContain('客服');
    expect(categories).toContain('工作');
    expect(categories).toContain('未分類');
  });
});
