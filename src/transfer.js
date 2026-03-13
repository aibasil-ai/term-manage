function ensureNonEmptyString(value, fieldName, index) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) {
    throw new Error(`item[${index}] ${fieldName} is required`);
  }
  return text;
}

function normalizeImportedItem(input, index) {
  const title = ensureNonEmptyString(input?.title, 'title', index);
  const content = ensureNonEmptyString(input?.content, 'content', index);

  const idText = typeof input?.id === 'string' ? input.id.trim() : '';
  const categoryText = typeof input?.category === 'string' ? input.category.trim() : '';
  const createdAtText = typeof input?.createdAt === 'string' ? input.createdAt.trim() : '';
  const updatedAtText = typeof input?.updatedAt === 'string' ? input.updatedAt.trim() : '';
  const normalized = {
    title,
    content
  };

  if (idText) {
    normalized.id = idText;
  }

  if (categoryText) {
    normalized.category = categoryText;
  }

  if (createdAtText) {
    normalized.createdAt = createdAtText;
  }

  if (updatedAtText) {
    normalized.updatedAt = updatedAtText;
  }

  return normalized;
}

export function serializeItemsForExport(items) {
  if (!Array.isArray(items)) {
    throw new Error('items must be an array');
  }

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    items
  };

  return JSON.stringify(payload, null, 2);
}

export function parseItemsFromImportText(text) {
  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch (_error) {
    throw new Error('Invalid JSON format');
  }

  const items = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.items)
      ? parsed.items
      : null;

  if (!items) {
    throw new Error('Import payload must be an array or contain an items array');
  }

  return items.map((item, index) => normalizeImportedItem(item, index));
}
