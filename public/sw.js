// Service Worker para habilitar o modo PWA (Instalação no Computador e Celular)
const CACHE_NAME = 'magalog-cd994-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through padrão para manter requisições ao Supabase e APIs sempre atualizadas
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
