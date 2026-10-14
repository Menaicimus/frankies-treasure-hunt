// Online-first: o estado do jogo é sempre sincronizado com o Firestore.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async () => {
  // Remove apenas o cache da versão anterior deste jogo.
  await caches.delete('cacada-v1');
  await self.clients.claim();
})()));
