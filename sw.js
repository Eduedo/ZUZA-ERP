// Service Worker ligero para habilitar instalación PWA en Android / Desktop
const CACHE_NAME = 'erp-zuza-v1.3.0';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network-first para que siempre traiga datos frescos de Supabase / GitHub Pages
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
