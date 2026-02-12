
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1'
      },
      actions: [
        {action: 'journal', title: 'Open Journal'},
        {action: 'close', title: 'Close'}
      ]
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'journal') {
    event.waitUntil(
      clients.openWindow('/journal')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
