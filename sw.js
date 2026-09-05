const CACHE='vaultsignal-vaultgraph-v160';
const ASSETS=['./','./index.html','./styles.css','./app.js','./config.js','./cloud.js','./creator-command.css','./creator-command.js','./grail-intelligence.css','./grail-intelligence.js','./journey-engine.css','./journey-engine.js','./vaultgraph.css','./vaultgraph.js','./manifest.webmanifest','./icon.svg','./privacy.html','./terms.html','./support.html'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window', includeUncontrolled:true}).then(list => {
    for (const client of list) if ('focus' in client) return client.focus();
    if (clients.openWindow) return clients.openWindow('./');
  }));
});
