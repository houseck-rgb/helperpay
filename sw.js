const CACHE='deposit-v6';
const INBOX='share-inbox';
const FILES=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-192-maskable.png','icon-512-maskable.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).catch(()=>{}))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==INBOX).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;const url=new URL(r.url);
  // 갤러리 → 공유 → 입금 처리 (안드로이드)
  if(r.method==='POST'&&url.pathname.endsWith('/share-target')){
    e.respondWith((async()=>{
      try{
        const fd=await r.formData();
        const files=fd.getAll('images').filter(f=>f&&f.size);
        const c=await caches.open(INBOX);const t=Date.now();
        await Promise.all(files.map((f,i)=>c.put(new Request(`inbox/${t}-${String(i).padStart(3,'0')}`),
          new Response(f,{headers:{'content-type':f.type||'image/jpeg','x-lm':String(f.lastModified||t)}}))));
      }catch(err){}
      return Response.redirect('./?shared=1',303);
    })());
    return;
  }
  if(r.method!=='GET'||url.origin!==location.origin)return;
  e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
});
