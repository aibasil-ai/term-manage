function createInputEvent(target) {
  const view = target?.ownerDocument?.defaultView;
  const EventCtor = view?.Event ?? Event;
  return new EventCtor('input', {
    bubbles: true,
    composed: true
  });
}

function isTextInputElement(element) {
  if (!element) {
    return false;
  }

  if (element.tagName === 'TEXTAREA') {
    return !element.disabled && !element.readOnly;
  }

  if (element.tagName !== 'INPUT') {
    return false;
  }

  const editableTypes = new Set([
    'text',
    'search',
    'url',
    'tel',
    'email',
    'password',
    'number'
  ]);

  const type = (element.getAttribute('type') || 'text').toLowerCase();
  return editableTypes.has(type) && !element.disabled && !element.readOnly;
}

function isContentEditableElement(element) {
  if (!element) {
    return false;
  }

  const contentEditableValue = element.contentEditable;
  return Boolean(
    element.isContentEditable ||
      contentEditableValue === true ||
      contentEditableValue === 'true' ||
      element.getAttribute('contenteditable') === 'true'
  );
}

function insertIntoTextControl(element, text) {
  const value = element.value || '';
  const start = typeof element.selectionStart === 'number'
    ? element.selectionStart
    : value.length;
  const end = typeof element.selectionEnd === 'number'
    ? element.selectionEnd
    : start;

  const nextValue = `${value.slice(0, start)}${text}${value.slice(end)}`;
  element.value = nextValue;

  const nextCursor = start + text.length;
  if (typeof element.setSelectionRange === 'function') {
    element.setSelectionRange(nextCursor, nextCursor);
  }

  element.dispatchEvent(createInputEvent(element));

  return {
    ok: true,
    mode: 'text-control'
  };
}

function insertIntoContentEditable(element, text) {
  element.append(element.ownerDocument.createTextNode(text));
  element.dispatchEvent(createInputEvent(element));

  return {
    ok: true,
    mode: 'contenteditable'
  };
}

export function insertTextIntoElement(element, text) {
  if (typeof text !== 'string') {
    return { ok: false, reason: 'invalid-text' };
  }

  if (isTextInputElement(element)) {
    return insertIntoTextControl(element, text);
  }

  if (isContentEditableElement(element)) {
    return insertIntoContentEditable(element, text);
  }

  return {
    ok: false,
    reason: 'no-editable-element'
  };
}

export function insertTextIntoActiveElement(text, doc = document) {
  const activeElement = doc?.activeElement;
  return insertTextIntoElement(activeElement, text);
}
