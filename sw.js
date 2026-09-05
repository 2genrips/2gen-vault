const CACHE='vaultsignal-live-community-v180';
const ASSETS=['./','./index.html','./styles.css','./app.js','./config.js','./cloud-compat-v18.js','./cloud.js','./creator-command.css','./creator-command.js','./grail-intelligence.css','./grail-intelligence.js','./journey-engine.css','./journey-engine.js','./vaultgraph.css','./vaultgraph.js','./signal-network.css','./signal-network.js','./live-community.css','./live-community.js','./manifest.webmanifest','./icon.svg','./privacy.html','./terms.html','./support.html'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  e.respondWith(
    fetch(e.request).then(r=>{
      const copy=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy));
      return r;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
  );
});

self.addEventListener('push',event=>{
  let payload={};
  try{payload=event.data?.json?.()||{}}catch{
    try{payload={body:event.data?.text?.()||'New VaultSignal community signal'}}catch{}
  }
  const title=payload.title||'VaultSignal • New Signal';
  const options={
    body:payload.body||'A followed Signal Network room has new activity.',
    icon:'./icon.svg',
    badge:'./icon.svg',
    tag:payload.tag||'vaultsignal-signal',
    renotify:true,
    data:{url:payload.url||'./',...(payload.data||{})}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification?.data?.url||'./';
  event.waitUntil((async()=>{
    const list=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of list){
      if('navigate'in client){try{await client.navigate(target)}catch{}}
      if('focus'in client)return client.focus();
    }
    if(clients.openWindow)return clients.openWindow(target);
  })());
});
