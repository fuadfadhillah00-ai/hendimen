// notif.js - Notifikasi sederhana
console.log('🔔 notif.js loaded - versi terbaru');

class NotifHelper {
    constructor() {
        console.log('✅ NotifHelper instance created');
    }
    
    show(title, message) {
        console.log('📢 Menampilkan notifikasi:', title, '-', message);
        
        // Notifikasi browser (muncul di HP)
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                vibrate: [200, 100, 200],
                silent: false,
                requireInteraction: true
            });
            
            notification.onclick = () => {
                console.log('Notifikasi diklik');
                window.focus();
            };
        } else {
            console.log('⚠️ Izin notifikasi belum diberikan');
        }
        
        // Mainkan suara
        const audio = new Audio('/sound/notification.mp3');
        audio.volume = 1.0;
        audio.play().catch(e => console.log('🔇 Suara error:', e.message));
        
        // Tampilkan toast di website
        this.showToast(title, message);
    }
    
    showToast(title, message) {
        // Hapus toast lama jika ada
        const oldToast = document.querySelector('.custom-toast');
        if (oldToast) oldToast.remove();
        
        const toast = document.createElement('div');
        toast.className = 'custom-toast info';
        toast.innerHTML = `
            <div class="toast-icon">🔔</div>
            <div class="toast-content">
                <div class="toast-title">${this.escapeHtml(title)}</div>
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        document.body.appendChild(toast);
        
        // Animasi masuk
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto close setelah 5 detik
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Tombol close
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            };
        }
    }
    
    escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
}

// Buat instance global
window.notifHelper = new NotifHelper();
console.log('✅ notifHelper global ready');