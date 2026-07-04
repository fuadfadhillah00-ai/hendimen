// sw.js - Service Worker untuk Push Notification (LENGKAP)
const CACHE_NAME = 'hendimen-v2'; // Update version

// Install Service Worker
self.addEventListener('install', function(event) {
    console.log('[SW] Install');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll([
                '/',
                '/dashboard.html',
                '/index.html',
                '/icon-192.png',
                '/icon-512.png',
                '/favicon.ico'
            ]);
        })
    );
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', function(event) {
    console.log('[SW] Activate');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME && cacheName !== 'notif-cache') {
                        console.log('[SW] Hapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 🔥 KRUSIAL: Handle Push Notification dari server
self.addEventListener('push', function(event) {
    console.log('[SW] Push diterima:', event);
    
    let data = {
        title: 'Hendimen',
        body: 'Anda memiliki notifikasi baru',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'hendimen-notification',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: {
            url: '/dashboard.html',
            job_id: null
        }
    };
    
    if (event.data) {
        try {
            const parsed = JSON.parse(event.data.text());
            data = { ...data, ...parsed };
            console.log('[SW] Push data:', data);
        } catch(e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        vibrate: data.vibrate,
        requireInteraction: data.requireInteraction,
        data: data.data,
        actions: [
            { action: 'open', title: '🔓 Buka Aplikasi' },
            { action: 'close', title: '❌ Tutup' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Handle klik notifikasi
self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Notification click:', event);
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    const urlToOpen = event.notification.data?.url || '/dashboard.html';
    const jobId = event.notification.data?.job_id;
    
    let finalUrl = urlToOpen;
    if (jobId) {
        finalUrl = urlToOpen + '?job=' + jobId;
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                // Cari tab dashboard yang sudah terbuka
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes('dashboard') && 'focus' in client) {
                        // Kirim pesan ke halaman
                        client.postMessage({ 
                            action: 'focusJob', 
                            jobId: jobId,
                            notification: 'clicked'
                        });
                        return client.focus();
                    }
                }
                // Buka tab baru jika belum ada
                if (clients.openWindow) {
                    return clients.openWindow(finalUrl);
                }
            })
    );
});

// Handle pesan dari halaman
self.addEventListener('message', function(event) {
    console.log('[SW] Message received:', event.data);
    
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data.action === 'testNotification') {
        self.registration.showNotification('Test Notifikasi', {
            body: 'Jika Anda melihat ini, notifikasi berhasil!',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200]
        });
    }
});

// 🔥 TAMBAHKAN: Periodic background sync (jika didukung)
self.addEventListener('periodicsync', function(event) {
    if (event.tag === 'check-notifications') {
        event.waitUntil(checkNewNotifications());
    }
});

// Fungsi untuk cek notifikasi baru dari server
async function checkNewNotifications() {
    try {
        const lastNotifId = await getLastNotifId();
        const response = await fetch(`/check_notifications_sw.php?last_id=${lastNotifId}`);
        const data = await response.json();
        
        if (data.notifications && data.notifications.length > 0) {
            for (const notif of data.notifications) {
                await self.registration.showNotification(notif.title || 'Hendimen', {
                    body: notif.message,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    vibrate: [200, 100, 200],
                    requireInteraction: true,
                    data: { 
                        url: '/dashboard.html', 
                        job_id: notif.job_id 
                    }
                });
            }
            await saveLastNotifId(data.last_id);
        }
    } catch(e) {
        console.log('[SW] Check notif error:', e);
    }
}

async function getLastNotifId() {
    const cache = await caches.open('notif-cache');
    const response = await cache.match('/last-notif-id');
    if (response) {
        const id = await response.text();
        return parseInt(id) || 0;
    }
    return 0;
}

async function saveLastNotifId(id) {
    const cache = await caches.open('notif-cache');
    const response = new Response(String(id));
    await cache.put('/last-notif-id', response);
}

// Workbox configuration
const CACHE_STRATEGY = "pwabuilder-offline";

try {
    importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');
    
    self.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SKIP_WAITING") {
            self.skipWaiting();
        }
    });
    
    workbox.routing.registerRoute(
        new RegExp('/*'),
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: CACHE_STRATEGY
        })
    );
} catch(e) {
    console.log('[SW] Workbox not loaded:', e);
}

// ========== NOMOR 6: USER GESTURE HANDLER UNTUK CHROME ==========
// Tambahkan kode ini di AKHIR file javascript (1) (1).js

// Fungsi untuk request notifikasi setelah user gesture
async function requestNotificationAfterLogin() {
    console.log('Checking notification permission after login...');
    
    // Hanya request jika masih default (belum pernah ditanya)
    if (Notification.permission === 'default') {
        console.log('Requesting notification permission...');
        const granted = await requestNotificationPermission();
        if (granted) {
            console.log('✅ Notification permission granted');
            if (typeof enablePushNotifications === 'function') {
                await enablePushNotifications();
            }
        } else {
            console.log('❌ Notification permission denied');
        }
    } else if (Notification.permission === 'granted') {
        console.log('✅ Notification already granted');
    } else {
        console.log('❌ Notification previously denied');
    }
}

// TAMBAHKAN DI DALAM FUNGSI afterLogin()
// Cari fungsi afterLogin() yang sudah ada, lalu tambahkan kode ini di dalamnya

// Jika fungsi afterLogin() sudah ada, tambahkan baris ini di akhir fungsi:
// setTimeout(requestNotificationAfterLogin, 2000);

// Atau jika belum ada, buat fungsi afterLogin baru seperti ini:
const originalAfterLogin = window.afterLogin;
if (originalAfterLogin) {
    window.afterLogin = async function() {
        // Panggil fungsi asli
        await originalAfterLogin();
        
        // Tambahkan request notifikasi setelah login
        setTimeout(requestNotificationAfterLogin, 2000);
    };
}

// Event listener untuk tombol login form
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    // Biarkan proses login berjalan normal
    
    // Setelah submit, tunggu login berhasil
    // Ini akan ditangani oleh afterLogin di atas
});

// Event listener untuk tombol aktivasi notifikasi di halaman Settings
document.addEventListener('DOMContentLoaded', function() {
    // Tunggu sampai settings page terload
    const observer = new MutationObserver(function(mutations) {
        const settingsPage = document.getElementById('settingsPage');
        if (settingsPage && settingsPage.style.display === 'block') {
            // Cek apakah tombol sudah ada
            let notifBtn = document.getElementById('enableNotificationBtn');
            if (!notifBtn) {
                // Buat tombol jika belum ada
                const settingsContent = document.querySelector('#settingsPage > div');
                if (settingsContent) {
                    const buttonHtml = `
                        <div class="form-group" style="margin-bottom:18px;">
                            <label>Notifikasi Browser</label>
                            <div>
                                <button type="button" id="enableNotificationBtn" class="btn btn-primary" onclick="requestNotificationFromSettings()">
                                    <i class="fas fa-bell"></i> Aktifkan Notifikasi
                                </button>
                                <span id="notifPermissionStatus" style="margin-left: 10px;"></span>
                            </div>
                            <small>Aktifkan notifikasi untuk mendapatkan pemberitahuan pesan dan update pekerjaan</small>
                        </div>
                    `;
                    settingsContent.insertAdjacentHTML('afterbegin', buttonHtml);
                }
            }
        }
    });
    
    observer.observe(document.getElementById('settingsPage') || document.body, { attributes: true });
});

// Fungsi untuk tombol di settings
window.requestNotificationFromSettings = async function() {
    const granted = await requestNotificationPermission();
    const statusSpan = document.getElementById('notifPermissionStatus');
    if (granted) {
        statusSpan.innerHTML = '<span style="color: green;">✓ Notifikasi Aktif</span>';
        if (typeof showToastNotification === 'function') {
            showToastNotification('Berhasil', 'Notifikasi browser telah diaktifkan', 'success');
        } else {
            alert('Notifikasi telah diaktifkan!');
        }
    } else {
        statusSpan.innerHTML = '<span style="color: red;">✗ Tidak diizinkan</span>';
        if (typeof showToastNotification === 'function') {
            showToastNotification('Gagal', 'Notifikasi tidak diizinkan. Cek pengaturan browser Anda.', 'error');
        } else {
            alert('Notifikasi tidak diizinkan. Silakan cek pengaturan browser Anda.');
        }
    }
};

// Update status permission saat halaman settings dibuka
function updateNotificationStatusDisplay() {
    const statusSpan = document.getElementById('notifPermissionStatus');
    if (statusSpan) {
        if (Notification.permission === 'granted') {
            statusSpan.innerHTML = '<span style="color: green;">✓ Notifikasi Aktif</span>';
        } else if (Notification.permission === 'denied') {
            statusSpan.innerHTML = '<span style="color: red;">✗ Notifikasi Diblokir</span>';
        } else {
            statusSpan.innerHTML = '<span style="color: orange;">⚡ Belum diaktifkan</span>';
        }
    }
}

// Panggil update status saat settings page terbuka
const settingsPageObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        const settingsPage = document.getElementById('settingsPage');
        if (settingsPage && settingsPage.style.display === 'block') {
            setTimeout(updateNotificationStatusDisplay, 100);
        }
    });
});

const settingsPage = document.getElementById('settingsPage');
if (settingsPage) {
    settingsPageObserver.observe(settingsPage, { attributes: true });
}