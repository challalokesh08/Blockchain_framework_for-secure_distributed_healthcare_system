import * as Updates from 'expo-updates';

// Automatic native update checks are disabled (checkAutomatically: NEVER) so a
// flaky network can never crash the app at launch. Updates are checked here,
// from JavaScript, where failures are safe to ignore.
export async function checkForAppUpdate() {
  if (!Updates.isEnabled) return { status: 'disabled' };
  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return { status: 'current' };
    await Updates.fetchUpdateAsync();
    return { status: 'downloaded' };
  } catch (error) {
    return { status: 'error', error: error?.message || String(error) };
  }
}

export async function applyAppUpdate() {
  try {
    await Updates.reloadAsync();
  } catch (error) {
    return false;
  }
  return true;
}
