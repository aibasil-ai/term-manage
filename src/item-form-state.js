export function createItemFormState() {
  return {
    isVisible: false,
    editingId: null
  };
}

export function openCreateItemForm(_state) {
  return {
    isVisible: true,
    editingId: null
  };
}

export function openEditItemForm(_state, editingId) {
  const id = typeof editingId === 'string' ? editingId.trim() : '';
  if (!id) {
    throw new Error('editingId is required');
  }

  return {
    isVisible: true,
    editingId: id
  };
}

export function closeItemForm(_state) {
  return {
    isVisible: false,
    editingId: null
  };
}

export function isEditingItemForm(state) {
  return Boolean(state?.editingId);
}
