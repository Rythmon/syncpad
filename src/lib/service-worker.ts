export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[SyncPad] Service Worker registered with scope:', registration.scope);

    // Check for Background Sync API support
    if ('sync' in registration) {
      console.log('[SyncPad] Background Sync API is supported.');
    }

    return registration;
  } catch (error) {
    console.warn('[SyncPad] Service Worker registration failed:', error);
    return null;
  }
}

export async function requestBackgroundSync(tag = 'syncpad-background-sync') {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if ('sync' in reg) {
      // @ts-ignore - Background Sync API
      await reg.sync.register(tag);
      console.log(`[SyncPad] Scheduled background sync tag: ${tag}`);
      return true;
    }
  } catch (err) {
    console.warn('[SyncPad] Error registering background sync:', err);
  }
  return false;
}
