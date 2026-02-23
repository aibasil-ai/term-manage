import { describe, it, expect } from 'vitest';
import {
  SHORTCUT_SLOT_KEYS,
  SHORTCUT_SLOT_COMMANDS,
  normalizeShortcutBindings,
  setShortcutBinding,
  clearShortcutBindingForItem,
  findItemIdForCommand,
  findShortcutSlotByItemId
} from '../src/shortcut-binding.js';

describe('shortcut binding module', () => {
  it('defines ten shortcut slot keys and command map', () => {
    expect(SHORTCUT_SLOT_KEYS).toEqual([
      'slot-1',
      'slot-2',
      'slot-3',
      'slot-4',
      'slot-5',
      'slot-6',
      'slot-7',
      'slot-8',
      'slot-9',
      'slot-10'
    ]);
    expect(SHORTCUT_SLOT_COMMANDS['slot-1']).toBe('insert-snippet-slot-01');
    expect(SHORTCUT_SLOT_COMMANDS['slot-10']).toBe('insert-snippet-slot-10');
  });

  it('normalizes invalid binding payload', () => {
    const normalized = normalizeShortcutBindings({
      'slot-1': 'item-a',
      'slot-2': '  ',
      invalid: 'item-x'
    });

    expect(normalized).toEqual({
      'slot-1': 'item-a'
    });
  });

  it('sets binding and keeps each item bound to at most one slot', () => {
    let bindings = normalizeShortcutBindings({
      'slot-1': 'item-a'
    });

    bindings = setShortcutBinding(bindings, 'slot-2', 'item-a');

    expect(bindings).toEqual({
      'slot-2': 'item-a'
    });
  });

  it('clears binding for deleted item', () => {
    const next = clearShortcutBindingForItem(
      {
        'slot-1': 'item-a',
        'slot-2': 'item-b'
      },
      'item-a'
    );

    expect(next).toEqual({
      'slot-2': 'item-b'
    });
  });

  it('resolves item id by command', () => {
    const itemId = findItemIdForCommand('insert-snippet-slot-02', {
      'slot-2': 'item-b'
    });

    expect(itemId).toBe('item-b');
  });

  it('finds slot by item id', () => {
    const slot = findShortcutSlotByItemId(
      {
        'slot-1': 'item-a',
        'slot-3': 'item-c'
      },
      'item-c'
    );

    expect(slot).toBe('slot-3');
  });
});
