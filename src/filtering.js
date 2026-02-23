function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeQuery(value) {
  return normalizeText(value).toLowerCase();
}

export function filterItems(items, options = {}) {
  if (!Array.isArray(items)) {
    return [];
  }

  const query = normalizeQuery(options.query);
  const selectedCategory = normalizeText(options.category) || '全部';

  return items.filter((item) => {
    const category = normalizeText(item?.category) || '未分類';
    if (selectedCategory !== '全部' && category !== selectedCategory) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystacks = [item?.title, item?.content, category]
      .map((value) => normalizeQuery(value));

    return haystacks.some((text) => text.includes(query));
  });
}

export function buildCategoryOptions(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return ['全部'];
  }

  const set = new Set();

  items.forEach((item) => {
    const category = normalizeText(item?.category) || '未分類';
    set.add(category);
  });

  return ['全部', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hant'))];
}
