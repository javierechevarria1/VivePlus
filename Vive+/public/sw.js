self.addEventListener("push", () => {});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/salud"));
});

// Mantener el SW activo para showNotification
self.addEventListener("message", (event) => {
  if (event.data === "keepalive") return;
});