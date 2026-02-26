export const APPLY_DISPLAY_MODE_MESSAGE = 'apply-display-mode-now';
export const ACTIVATE_DISPLAY_MODE_MESSAGE = 'activate-display-mode-now';

async function sendRuntimeMessage(payload, runtime = globalThis.chrome?.runtime) {
  if (!runtime || typeof runtime.sendMessage !== 'function') {
    return null;
  }

  try {
    return await runtime.sendMessage(payload);
  } catch {
    return null;
  }
}

export async function notifyDisplayModeApplied(
  mode,
  runtime = globalThis.chrome?.runtime
) {
  const response = await sendRuntimeMessage(
    {
      type: APPLY_DISPLAY_MODE_MESSAGE,
      mode
    },
    runtime
  );
  return Boolean(response || response === undefined);
}

export async function requestDisplayModeActivation(
  mode,
  sourceHost,
  targetWindowId,
  runtime = globalThis.chrome?.runtime
) {
  const response = await sendRuntimeMessage(
    {
      type: ACTIVATE_DISPLAY_MODE_MESSAGE,
      mode,
      sourceHost,
      targetWindowId
    },
    runtime
  );
  if (!response || typeof response !== 'object') {
    return null;
  }
  return response;
}
