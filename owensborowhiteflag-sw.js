/* Offline helper for owensborowhiteflag.html only (registered with scope "/owensborowhiteflag").
   Pages: network first, so people always get the newest version; the saved copy is used only
   when there's no signal. The weather forecast is never cached here (the page saves its own copy). */
var CACHE = 'owb-v1';
var PAGE = '/owensborowhiteflag.html';
var CORE = [PAGE, '/images/owensboro/slides-cover.jpg', '/assets/owensboro/staying-warm-and-safe-slides.pdf', '/assets/favicon.svg'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) { return c.add(new Request(u, { cache: 'reload' }))['catch'](function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { if (k.indexOf('owb-') === 0 && k !== CACHE) return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function timeout(ms) { return new Promise(function (_, reject) { setTimeout(function () { reject(new Error('timeout')); }, ms); }); }

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch the weather API or other sites

  if (req.mode === 'navigate') {
    e.respondWith(Promise.race([fetch(req), timeout(6000)]).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(PAGE, copy); }); }
      return res;
    })['catch'](function () {
      return caches.match(PAGE).then(function (hit) { return hit || fetch(req); });
    }));
    return;
  }
  if (CORE.indexOf(url.pathname) >= 0) {
    // saved files: show the saved copy right away, refresh it in the background
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(url.pathname).then(function (hit) {
        var net = fetch(req).then(function (res) { if (res && res.ok) c.put(url.pathname, res.clone()); return res; })['catch'](function () { return hit || Response.error(); });
        return hit || net;
      });
    }));
  }
});
