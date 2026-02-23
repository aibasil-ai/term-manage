import { describe, it, expect } from 'vitest';
import {
  insertTextIntoElement,
  insertTextIntoActiveElement
} from '../src/insertion.js';

describe('insertion module', () => {
  it('inserts text into input at cursor position', () => {
    const input = document.createElement('input');
    input.value = 'HelloWorld';
    document.body.appendChild(input);

    input.focus();
    input.setSelectionRange(5, 5);

    const result = insertTextIntoElement(input, ' ');

    expect(result.ok).toBe(true);
    expect(input.value).toBe('Hello World');
    expect(input.selectionStart).toBe(6);
    expect(input.selectionEnd).toBe(6);
  });

  it('replaces selected text in textarea', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'abc123xyz';
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.setSelectionRange(3, 6);

    const result = insertTextIntoElement(textarea, '---');

    expect(result.ok).toBe(true);
    expect(textarea.value).toBe('abc---xyz');
  });

  it('appends text into contenteditable element', () => {
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    editable.textContent = '前綴';
    document.body.appendChild(editable);

    const result = insertTextIntoElement(editable, '內容');

    expect(result.ok).toBe(true);
    expect(editable.textContent).toBe('前綴內容');
  });

  it('dispatches input event after insert', () => {
    const input = document.createElement('input');
    input.value = 'A';
    document.body.appendChild(input);

    let inputEventCount = 0;
    input.addEventListener('input', () => {
      inputEventCount += 1;
    });

    insertTextIntoElement(input, 'B');

    expect(inputEventCount).toBe(1);
  });

  it('returns failure when active element is not editable', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    const result = insertTextIntoActiveElement('x', document);

    expect(result.ok).toBe(false);
  });
});
