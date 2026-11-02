// Service Worker para habilitar o modo PWA (Instalação no Computador e Celular)
const CACHE_NAME = 'magalog-cd994-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições de esquemas não-http ou chamadas para APIs locais e externas para não quebrar com rejected promise
  if (!event.request.url.startsWith('http')) return;

  // Pass-through padrão para manter requisições ao Supabase e APIs sempre atualizadas
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return new Response('', { status: 408, statusText: 'Request timed out or offline' });
    })
  );
});
