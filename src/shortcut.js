export function pickItemForQuickInsert(items, lastUsedItemId) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const normalizedLastUsedId =
    typeof lastUsedItemId === 'string' ? lastUsedItemId.trim() : '';

  if (normalizedLastUsedId) {
    const matched = items.find((item) => item?.id === normalizedLastUsedId);
    if (matched) {
      return matched;
    }
  }

  return items[0] ?? null;
}
