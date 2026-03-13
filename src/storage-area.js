export function getDefaultStorageArea(chromeLike = globalThis.chrome) {
  const storage = chromeLike?.storage;

  if (storage?.sync) {
    return storage.sync;
  }

  if (storage?.local) {
    return storage.local;
  }

  throw new Error('No available chrome storage area found');
}

export async function getSyncUsageStats(chromeLike = globalThis.chrome) {
  const syncStorage = chromeLike?.storage?.sync;
  if (!syncStorage || typeof syncStorage.getBytesInUse !== 'function') {
    return null;
  }

  const bytesInUse = await syncStorage.getBytesInUse(null);
  const quotaBytes = Number.isFinite(syncStorage.QUOTA_BYTES)
    ? syncStorage.QUOTA_BYTES
    : null;

  return {
    bytesInUse: Number.isFinite(bytesInUse) ? bytesInUse : 0,
    quotaBytes
  };
}
