// Minimal service worker registration and simple caching strategy
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').then(reg => {
        console.log('Service worker registered.', reg);
      }).catch(err => {
        console.warn('Service worker registration failed:', err);
      });
    });
  }
}
