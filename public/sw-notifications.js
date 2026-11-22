// Handles pinned Notification click actions for ताज़ाMandi Voice Bubble & Instant Order Confirm
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action || (event.notification && event.notification.data && event.notification.data.action) || 'voice_listen';
  const targetUrl =
    action === 'confirm_order'
      ? '/?quick_action=confirm_order'
      : '/?quick_action=voice_listen';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          try {
            await client.focus();
          } catch {}
          client.postMessage({ type: 'TAZAMANDI_QUICK_ACTION', action });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
