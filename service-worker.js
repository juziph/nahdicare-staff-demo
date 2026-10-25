const CACHE='nahdicare-staff-demo-app-v6';
const ASSETS=['./','./index.html','./style.css','./premium.css','./native.css','./app.js','./premium.js','./native.js','./manifest.webmanifest','./roster-v2.css','./roster-v2.js','./brand-official.css','./brand-official.js','./official-symbol.b64','./share-roster.js','./share-roster.css','./scenario-scheduling.js','./scenario-scheduling.css','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE&&key.startsWith('nahdicare-staff-demo-app-')).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const u=new URL(req.url);
  if(u.origin!==self.location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{
      if(res.ok){const c=res.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',c));}
      return res;
    }).catch(()=>caches.match('./index.html')));
  }else{
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{
      if(res.ok){const c=res.clone();caches.open(CACHE).then(cache=>cache.put(req,c));}
      return res;
    })));
  }
});