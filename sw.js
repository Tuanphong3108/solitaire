// Định danh cache. CẦN THAY ĐỔI MỖI KHI CÓ BẢN CẬP NHẬT LỚN để kích hoạt xóa cache cũ.
const CACHE_NAME = 'solitaire-m3-cache-v1.0.4'; 

// Danh sách các file cốt lõi cần cache để chạy offline
const urlsToCache = [
    './game.html',
    './googlegame.html
    './manifest.json',
    // Giữ Tailwind CDN để có thể hoạt động offline sau khi tải lần đầu
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap'
    './icon.png'
    // 'icon.png' - giả định file này có sẵn
];

// 1. Giai đoạn INSTALL (Cài đặt cache lần đầu)
self.addEventListener('install', (event) => {
    // Chờ cho đến khi cache được mở và các file được thêm vào
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Đã mở cache và đang thêm files...');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('[Service Worker] Lỗi thêm files vào cache:', error);
            })
    );
    self.skipWaiting(); // Bỏ qua trạng thái chờ, kích hoạt ngay lập tức
});

// 2. Giai đoạn ACTIVATE (Xóa cache cũ - Cơ chế Cache-Buster)
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Nếu tên cache KHÔNG nằm trong whitelist (cache hiện tại)
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log(`[Service Worker] Xóa cache cũ: ${cacheName}`);
                        // XÓA CACHE CŨ
                        return caches.delete(cacheName); 
                    }
                })
            );
        })
        .then(() => self.clients.claim()) // Yêu cầu SW kiểm soát ngay lập tức
        .catch(error => {
            console.error('[Service Worker] Lỗi trong quá trình kích hoạt:', error);
        })
    );
});

// 3. Giai đoạn FETCH (Phục vụ file)
self.addEventListener('fetch', (event) => {
    // Cache-First Strategy cho tất cả các request
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Trả về từ cache nếu có
                if (response) {
                    return response;
                }
                
                // Nếu không có trong cache, fetch từ network
                return fetch(event.request).catch(() => {
                    // Xử lý khi không có mạng và không có trong cache (ví dụ: trả về trang offline)
                    // Ở đây ta đơn giản là để trình duyệt tự xử lý lỗi kết nối
                    console.log('[Service Worker] Lỗi Fetch: Không tìm thấy trong Cache và Network thất bại.');
                });
            })
    );
});
