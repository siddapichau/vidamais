const CACHE_NAME = 'vidamais-v2-3-2';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/core.js',
  './js/firebase.js',
  './js/app.js',
  './manifest.json',
  './pages/home.html',
  './pages/dashboard.html',
  './pages/financeiro.html',
  './pages/habitos.html',
  './pages/humor.html',
  './pages/metas.html',
  './pages/conquistas.html',
  './pages/relatorios.html',
  './pages/perfil.html',
  './pages/insumos.html',
  './pages/auth.html',
];

self.addEventListener('install', event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=> cache.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', event=>{
  event.waitUntil(caches.keys().then(keys=> Promise.all(keys.filter(k=> k!==CACHE_NAME).map(k=> caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event=>{
  const req = event.request;
  if(req.method!=='GET') return;
  if(req.url.includes('firestore') || req.url.includes('firebase') || req.url.includes('googleapis') || req.url.includes('gstatic.com')){
    return; // não cachear Firebase
  }
  event.respondWith(
    fetch(req).then(res=>{
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache=> cache.put(req, copy).catch(()=>{}));
      return res;
    }).catch(()=> caches.match(req).then(cached=> cached || caches.match('./index.html')))
  );
});
