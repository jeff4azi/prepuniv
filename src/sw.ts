import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: any;
    registration: ServiceWorkerRegistration;
  }
}

self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);

// Web push listener
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data ? event.data.json() : { title: 'PrepUniv', body: 'New notification' };
  const title = data.title || 'PrepUniv';
  const options: NotificationOptions = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: data.data || {},
    tag: data.tag || 'prepuniv-notification',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click → deep link
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('url' in client && client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return undefined;
    })
  );
});

// Handle subscription change
self.addEventListener('pushsubscriptionchange', (event: PushSubscriptionChangeEvent) => {
  event.waitUntil(
    (async () => {
      const subscription = event.newSubscription ||
        (await self.registration.pushManager.subscribe(event.oldSubscription?.options ?? { userVisibleOnly: true }));
      if (subscription && self.registration.active) {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: subscription.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : '',
            auth: subscription.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : '',
          }),
        });
      }
    })()
  );
});
