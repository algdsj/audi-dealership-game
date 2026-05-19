import { APP_VERSION_INFO } from '../game/config/appVersion.js';

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        registration.update?.();
        window.dispatchEvent(new CustomEvent('audi:pwa-status', {
          detail: {
            serviceWorker: 'registered',
            appVersion: APP_VERSION_INFO.version,
          },
        }));
      })
      .catch(() => {
        window.dispatchEvent(new CustomEvent('audi:pwa-status', {
          detail: {
            serviceWorker: 'failed',
            appVersion: APP_VERSION_INFO.version,
          },
        }));
      });
  });
}
