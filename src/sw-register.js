/**
 * BoxTrack Service Worker Registration
 * External module so CSP forbids 'unsafe-inline'.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      registration.addEventListener('updatefound', () => {
        const nextWorker = registration.installing;
        if (!nextWorker) return;
        nextWorker.addEventListener('statechange', () => {
          if (nextWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('boxtrack:sw-update'));
          }
        });
      });
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent('boxtrack:sw-error', {
          detail: { message: err?.message || 'Error al registrar caché offline' }
        })
      );
    }
  });
}
