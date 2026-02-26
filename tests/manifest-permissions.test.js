import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function loadManifest() {
  const manifestPath = resolve(process.cwd(), 'manifest.json');
  const raw = readFileSync(manifestPath, 'utf8');
  return JSON.parse(raw);
}

describe('manifest host permissions', () => {
  it('declares host permissions required by scripting injection', () => {
    const manifest = loadManifest();
    const hostPermissions = manifest.host_permissions || [];

    expect(hostPermissions).toContain('http://*/*');
    expect(hostPermissions).toContain('https://*/*');
  });
});
