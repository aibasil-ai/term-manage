export function injectSnippetIntoActiveElement(text) {
  const activeElement = document.activeElement;

  if (!activeElement) {
    return { ok: false, reason: '找不到焦點元素' };
  }

  const fireInputEvent = (element) => {
    element.dispatchEvent(
      new Event('input', {
        bubbles: true,
        composed: true
      })
    );
  };

  const tagName = activeElement.tagName;
  const isTextInput =
    tagName === 'TEXTAREA' ||
    (tagName === 'INPUT' &&
      ['text', 'search', 'url', 'tel', 'email', 'password', 'number'].includes(
        (activeElement.getAttribute('type') || 'text').toLowerCase()
      ));

  if (isTextInput && !activeElement.readOnly && !activeElement.disabled) {
    const value = activeElement.value || '';
    const start =
      typeof activeElement.selectionStart === 'number'
        ? activeElement.selectionStart
        : value.length;
    const end =
      typeof activeElement.selectionEnd === 'number'
        ? activeElement.selectionEnd
        : start;

    activeElement.value = `${value.slice(0, start)}${text}${value.slice(end)}`;

    const cursor = start + text.length;
    if (typeof activeElement.setSelectionRange === 'function') {
      activeElement.setSelectionRange(cursor, cursor);
    }

    fireInputEvent(activeElement);
    return { ok: true };
  }

  const isContentEditable =
    activeElement.isContentEditable ||
    activeElement.contentEditable === true ||
    activeElement.contentEditable === 'true' ||
    activeElement.getAttribute('contenteditable') === 'true';

  if (isContentEditable) {
    const selection = window.getSelection();

    if (
      selection &&
      selection.rangeCount > 0 &&
      activeElement.contains(selection.anchorNode)
    ) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      activeElement.append(document.createTextNode(text));
    }

    fireInputEvent(activeElement);
    return { ok: true };
  }

  return { ok: false, reason: '目前焦點不是可編輯輸入欄位' };
}
