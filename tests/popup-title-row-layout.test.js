import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('popup title row layout stylesheet', () => {
  it('does not force title row to stack vertically in small screens', () => {
    const css = readFileSync(resolve(process.cwd(), 'popup.css'), 'utf8');
    const mediaStart = css.indexOf('@media (max-width: 420px)');
    expect(mediaStart).toBeGreaterThan(-1);
    const mediaBlock = css.slice(mediaStart);

    expect(mediaBlock).not.toContain('.title-row');
  });
});
