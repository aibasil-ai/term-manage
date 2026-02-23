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
