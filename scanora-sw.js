/* Scanora offline helper. Keeps the app available with no internet. */
const V='scanora-v10';
const SHELL=['./scanora.html','./scanora-manifest.json','./scanora-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('scanora-')&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return;
  const u=new URL(r.url);
  const fonts=u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
  const mine=u.origin===location.origin&&/scanora/.test(u.pathname);
  if(fonts){ // fonts: cache-first, fetched once while online
    e.respondWith(caches.open(V).then(c=>c.match(r).then(hit=>hit||fetch(r).then(res=>{c.put(r,res.clone());return res;}).catch(()=>new Response('',{status:204})))));
    return;
  }
  if(mine){ // app files: open instantly from the saved copy, refresh it quietly in the background
    e.respondWith(caches.open(V).then(c=>c.match(r,{ignoreSearch:true}).then(hit=>{
      const net=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res;}).catch(()=>null);
      return hit||net.then(res=>res||new Response('Offline',{status:503}));
    })));
  }
});
