import { describe, expect, it, vi } from 'vitest';
import {
  APPLY_DISPLAY_MODE_MESSAGE,
  ACTIVATE_DISPLAY_MODE_MESSAGE,
  notifyDisplayModeApplied,
  requestDisplayModeActivation
} from '../src/display-mode-messaging.js';

describe('display mode messaging', () => {
  it('returns false when runtime sendMessage is unavailable', async () => {
    const result = await notifyDisplayModeApplied('attached', null);
    expect(result).toBe(false);
  });

  it('sends expected message payload and returns true', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true });
    const runtime = { sendMessage };

    const result = await notifyDisplayModeApplied('window', runtime);

    expect(result).toBe(true);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({
      type: APPLY_DISPLAY_MODE_MESSAGE,
      mode: 'window'
    });
  });

  it('returns false when sendMessage throws', async () => {
    const sendMessage = vi.fn().mockRejectedValue(new Error('boom'));
    const runtime = { sendMessage };

    const result = await notifyDisplayModeApplied('popup', runtime);

    expect(result).toBe(false);
  });

  it('requests immediate activation with expected payload', async () => {
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      appliedNow: true,
      shouldCloseCurrentWindow: false
    });
    const runtime = { sendMessage };

    const result = await requestDisplayModeActivation('attached', 'window', 99, runtime);

    expect(sendMessage).toHaveBeenCalledWith({
      type: ACTIVATE_DISPLAY_MODE_MESSAGE,
      mode: 'attached',
      sourceHost: 'window',
      targetWindowId: 99
    });
    expect(result).toEqual({
      ok: true,
      appliedNow: true,
      shouldCloseCurrentWindow: false
    });
  });

  it('returns null when activation message fails', async () => {
    const sendMessage = vi.fn().mockRejectedValue(new Error('nope'));
    const runtime = { sendMessage };

    const result = await requestDisplayModeActivation('window', 'attached', null, runtime);
    expect(result).toBeNull();
  });
});
