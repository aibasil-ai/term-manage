import { describe, it, expect } from 'vitest';
import {
  createItemFormState,
  openCreateItemForm,
  openEditItemForm,
  closeItemForm,
  isEditingItemForm
} from '../src/item-form-state.js';

describe('item form state', () => {
  it('starts hidden and not editing', () => {
    const state = createItemFormState();
    expect(state.isVisible).toBe(false);
    expect(state.editingId).toBeNull();
    expect(isEditingItemForm(state)).toBe(false);
  });

  it('opens in create mode', () => {
    const state = openCreateItemForm(createItemFormState());
    expect(state.isVisible).toBe(true);
    expect(state.editingId).toBeNull();
    expect(isEditingItemForm(state)).toBe(false);
  });

  it('opens in edit mode with editing id', () => {
    const state = openEditItemForm(createItemFormState(), 'item-1');
    expect(state.isVisible).toBe(true);
    expect(state.editingId).toBe('item-1');
    expect(isEditingItemForm(state)).toBe(true);
  });

  it('closes and clears editing mode', () => {
    const openState = openEditItemForm(createItemFormState(), 'item-1');
    const closed = closeItemForm(openState);
    expect(closed.isVisible).toBe(false);
    expect(closed.editingId).toBeNull();
  });
});
