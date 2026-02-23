export const SHORTCUT_SLOT_KEYS = Array.from(
  { length: 10 },
  (_, index) => `slot-${index + 1}`
);

export const SHORTCUT_SLOT_COMMANDS = SHORTCUT_SLOT_KEYS.reduce((acc, slotKey) => {
  const numeric = Number(slotKey.replace('slot-', ''));
  const suffix = String(numeric).padStart(2, '0');
  acc[slotKey] = `insert-snippet-slot-${suffix}`;
  return acc;
}, {});

const COMMAND_TO_SLOT = Object.entries(SHORTCUT_SLOT_COMMANDS).reduce((acc, [slot, command]) => {
  acc[command] = slot;
  return acc;
}, {});

function normalizeItemId(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || null;
}

export function normalizeShortcutBindings(raw) {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const normalized = {};

  SHORTCUT_SLOT_KEYS.forEach((slotKey) => {
    const itemId = normalizeItemId(raw[slotKey]);
    if (itemId) {
      normalized[slotKey] = itemId;
    }
  });

  return normalized;
}

export function setShortcutBinding(bindings, slotKey, itemId) {
  if (!SHORTCUT_SLOT_KEYS.includes(slotKey)) {
    throw new Error(`invalid slot key: ${slotKey}`);
  }

  const normalizedBindings = normalizeShortcutBindings(bindings);
  const normalizedItemId = normalizeItemId(itemId);

  const next = {};

  SHORTCUT_SLOT_KEYS.forEach((key) => {
    const currentItemId = normalizedBindings[key];
    if (!currentItemId) {
      return;
    }

    if (normalizedItemId && currentItemId === normalizedItemId) {
      return;
    }

    if (key === slotKey) {
      return;
    }

    next[key] = currentItemId;
  });

  if (normalizedItemId) {
    next[slotKey] = normalizedItemId;
  }

  return next;
}

export function clearShortcutBindingForItem(bindings, itemId) {
  const normalizedBindings = normalizeShortcutBindings(bindings);
  const normalizedItemId = normalizeItemId(itemId);

  if (!normalizedItemId) {
    return normalizedBindings;
  }

  const next = {};
  SHORTCUT_SLOT_KEYS.forEach((slotKey) => {
    const currentItemId = normalizedBindings[slotKey];
    if (currentItemId && currentItemId !== normalizedItemId) {
      next[slotKey] = currentItemId;
    }
  });

  return next;
}

export function findItemIdForCommand(command, bindings) {
  const slotKey = COMMAND_TO_SLOT[command];
  if (!slotKey) {
    return null;
  }

  const normalizedBindings = normalizeShortcutBindings(bindings);
  return normalizedBindings[slotKey] || null;
}

export function findShortcutSlotByItemId(bindings, itemId) {
  const normalizedBindings = normalizeShortcutBindings(bindings);
  const normalizedItemId = normalizeItemId(itemId);

  if (!normalizedItemId) {
    return null;
  }

  for (const slotKey of SHORTCUT_SLOT_KEYS) {
    if (normalizedBindings[slotKey] === normalizedItemId) {
      return slotKey;
    }
  }

  return null;
}
