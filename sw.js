// Service worker – VLSN Team (bản Supabase)
// Lưu "vỏ" ứng dụng để mở nhanh và mở được khi mạng chập chờn. Dữ liệu luôn lấy trực tiếp từ Supabase.
const VERSION = 'vlsn-supa-v13';
const SHELL = ['./', './index.html', './offline.html', './manifest.webmanifest', './config.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(k => Promise.all(k.filter(x => x !== VERSION).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET') return;
  // Thư viện Supabase từ CDN: dùng bản đã lưu nếu mất mạng
  if (url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(caches.open(VERSION).then(c => fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => c.match(req))));
    return;
  }
  if (url.origin !== self.location.origin || url.pathname.endsWith('seed.json')) return;
  // File của trang: ưu tiên mạng (luôn có bản mới), mất mạng thì dùng bản đã lưu
  e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req.mode === 'navigate' ? './index.html' : req, cp)); } return r; })
    .catch(() => caches.match(req.mode === 'navigate' ? './index.html' : req).then(r => r || (req.mode === 'navigate' ? caches.match('./offline.html') : undefined))));
});
