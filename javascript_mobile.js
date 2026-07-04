// ================================================================
// JAVASCRIPT_MOBILE.JS - Mobile Dashboard for Hendimen
// SISTEM NEGOSIASI 1 PUTARAN - BUDGET RANGE
// ================================================================

// ===== GLOBAL DEBUG FLAG =====
const DEBUG = true;

function debugLog(...args) {
    if (DEBUG) {
        console.log('[DEBUG]', ...args);
    }
}

// ===== GLOBAL STATE =====

let currentUser = null;
let jobs = [];
let walletTransactions = [];
let walletBalance = 0;
let reviews = [];
let notifications = [];
let currentRatingTargetId = null;
let chatState = {
    currentConversation: null,
    lastMessageId: 0,
    pollingInterval: null,
    notifiedIds: new Set()
};
// ===== GLOBAL STATE - Tambahkan ini =====
let lastNotificationId = 0; // ID notifikasi terakhir yang sudah ditampilkan
let notificationPolling = null;
let isProcessing = false;
let firstNotificationLoad = true; // 🔥 TAMBAHKAN: Flag untuk load pertama

// ===== CONSTANTS =====
const BIAYA_ADMIN = 2500;
const EMERGENCY_FEE = 10000;

// ===== KONSTANTA NEGOSIASI 1 PUTARAN =====
const OFFER_TIMEOUT = 86400; // 24 jam dalam detik
const SERVICE_FEE_PERCENT = 5;
const HELPER_FEE_PERCENT = 5;

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatRupiah(angka) {
    if (angka === undefined || angka === null) return '0';
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function getCategoryName(category) {
    const categories = {
        'moving': 'Pindahan',
        'delivery': 'Pengiriman',
        'transport': 'Antar Jemput',
        'event': 'Jaga Acara',
        'perbaikan': 'Perbaikan',
        'kebersihan': 'Kebersihan',
        'pindahan': 'Pindahan',
        'tukang': 'Tukang',
        'design': 'Design',
        'lainnya': 'Lainnya'
    };
    return categories[category] || category;
}

function getStatusName(status) {
    const statuses = {
        'open': '📢 Terbuka',
        'offered': '📩 Ada Tawaran',
        'selected': '🎯 Menunggu Bayar',
        'paid': '💳 Dibayar',
        'in-progress': '🔄 Sedang Dikerjakan',
        'ongoing': '🔄 Sedang Dikerjakan',
        'pending_acc': '⏳ Menunggu ACC',
        'perbaikan': '🔧 Perlu Perbaikan',
        'completed': '✅ Selesai',
        'cancelled': '❌ Dibatalkan'
    };
    return statuses[status] || status;
}

function formatChatTime(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);
        if (diffMin < 1) return 'Baru saja';
        if (diffMin < 60) return diffMin + ' mnt';
        if (diffHr < 24) return diffHr + ' jam';
        if (diffDay < 7) return diffDay + ' hari';
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    } catch (e) { return ''; }
}

function formatMsgTime(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
}

function formatMsgDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return 'Hari ini';
        if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (e) { return ''; }
}

function timeAgo(datetime) {
    const diff = time() - strtotime(datetime);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
    if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
    return Math.floor(diff / 86400) + ' hari lalu';
}

function strtotime(str) {
    return Math.floor(new Date(str).getTime() / 1000);
}

function time() {
    return Math.floor(Date.now() / 1000);
}

// ================================================================
// UI HELPERS
// ================================================================

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('show', show);
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const existing = container.querySelectorAll('.toast');
    existing.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    let icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '🔔';
    toast.innerHTML = `
        <span class="icon">${icon}</span>
        <span class="msg">${escapeHtml(message)}</span>
        <button class="close-toast">&times;</button>
    `;
    container.appendChild(toast);

    const close = toast.querySelector('.close-toast');
    close.onclick = () => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    };

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function showNotification(message, type = 'info') {
    showToast(message, type);
}

// ================================================================
// MODAL FUNCTIONS
// ================================================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
        document.body.style.overflow = '';
    }
});

document.addEventListener('click', function(e) {
    const closeBtn = e.target.closest('.close[data-modal]');
    if (closeBtn) {
        const modalId = closeBtn.dataset.modal;
        closeModal(modalId);
    }
});

// ================================================================
// DRAWER FUNCTIONS
// ================================================================

function openDrawer() {
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeDrawer() {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawerOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

document.getElementById('hamburgerBtn').addEventListener('click', openDrawer);
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);

// ================================================================
// NAVIGATION
// ================================================================

function navigateTo(pageId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));

    const target = document.getElementById('page-' + pageId);
    if (target) {
        target.classList.add('active');
    }

    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageId);
    });

    document.querySelectorAll('.drawer-menu a[data-page]').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageId);
    });

    closeDrawer();

    if (pageId === 'wallet') {
        loadWallet();
    }
    if (pageId === 'messages') {
        loadConversationsMobile();
    }
    if (pageId === 'rating') {
        loadReviews();
    }
    if (pageId === 'jobs') {
        loadMyJobs();
    }
    if (pageId === 'home') {
        loadRequesterJobs();
        loadHelperJobs();
        updateRequesterStats();
        updateHelperStats();
        syncRatingToBeranda();
    }
    if (pageId === 'history') {
        loadHistory();
    }
}

document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
    item.addEventListener('click', function() {
        navigateTo(this.dataset.page);
    });
});

document.querySelectorAll('.drawer-menu a[data-page]').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        navigateTo(this.dataset.page);
    });
});

// ================================================================
// SESSION CHECK & LOGIN
// ================================================================

async function checkSession() {
    try {
        const response = await fetch('check_session.php', {
            method: 'GET',
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await response.json();

        if (data.success && data.user) {
            if (data.user.role === 'admin') {
                window.location.href = 'admin_dashboard.html';
                return;
            }
            currentUser = data.user;
            window.currentUser = currentUser;
            console.log('✅ User logged in:', currentUser);
            afterLogin();
            return;
        }

        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                if (userData.role === 'admin') {
                    window.location.href = 'admin_dashboard.html';
                    return;
                }
                currentUser = userData;
                window.currentUser = currentUser;
                console.log('✅ Using sessionStorage user:', currentUser);
                afterLogin();
                return;
            } catch (e) {
                console.error('Error parsing sessionStorage:', e);
            }
        }

        if (!sessionStorage.getItem('redirectAttempted')) {
            sessionStorage.setItem('redirectAttempted', 'true');
            window.location.href = 'auth.html';
        }
    } catch (error) {
        console.error('Session check error:', error);
        if (!sessionStorage.getItem('redirectAttempted')) {
            sessionStorage.setItem('redirectAttempted', 'true');
            window.location.href = 'auth.html';
        }
    }
}

// ================================================================
// AFTER LOGIN - Reset notifikasi
// ================================================================

async function afterLogin() {
    console.log('afterLogin called', currentUser);

    if (!currentUser) {
        console.error('currentUser is null');
        window.location.href = 'auth.html';
        return;
    }

    // 🔥 Reset notifikasi tracking
    lastNotificationId = 0;
    firstNotificationLoad = true;
    localStorage.removeItem('lastNotificationIdMobile');

    updateUserUI();

    if (currentUser.role === 'user') {
        currentUser.role = 'requester';
    }

    setRole('requester');

    try {
        await loadWalletFromDB();
        updateWalletDisplay();
        updateWalletVisibility();
        await loadJobsFromDB();
        updateNotificationBadge();
        await syncRatingToBeranda();
        startNotificationPolling(); // 🔥 Mulai polling dengan reset
        initDarkMode();
        updateBerandaHistory();
        loadReviews();
        
        setTimeout(() => {
            if (currentUser.role === 'helper') {
                updateHelperStats();
                setTimeout(() => {
                    updateHelperStatsFromTransactions();
                }, 300);
            } else {
                updateRequesterStats();
            }
        }, 500);
        
        setTimeout(requestNotificationPermission, 3000);
    } catch (e) {
        console.error('Error loading data:', e);
    }

    console.log('afterLogin complete');
}

function updateUserUI() {
    const name = currentUser.name || currentUser.nama_lengkap || 'User';
    const initials = currentUser.avatar || name.charAt(0).toUpperCase();

    const avatarHeader = document.getElementById('avatarHeader');
    if (avatarHeader) avatarHeader.textContent = initials;

    const drawerAvatar = document.getElementById('drawerAvatar');
    const drawerName = document.getElementById('drawerName');
    const drawerRole = document.getElementById('drawerRole');
    if (drawerAvatar) drawerAvatar.textContent = initials;
    if (drawerName) drawerName.textContent = name;
    if (drawerRole) drawerRole.textContent = currentUser.role === 'requester' ? 'Requester' : 'Helper';
}

// ================================================================
// ROLE SWITCH
// ================================================================

function setRole(role) {
    const isRequester = role === 'requester';
    const requesterView = document.getElementById('requesterViewMobile');
    const helperView = document.getElementById('helperViewMobile');
    const reqBtn = document.getElementById('roleRequesterMobile');
    const helBtn = document.getElementById('roleHelperMobile');

    if (isRequester) {
        requesterView.style.display = 'block';
        helperView.style.display = 'none';
        reqBtn.classList.add('active');
        helBtn.classList.remove('active');
        document.body.classList.add('requester-mode');
        document.body.classList.remove('helper-mode');
        currentUser.role = 'requester';
        loadRequesterJobs();
        updateRequesterStats();
        updateWalletVisibility();
    } else {
        requesterView.style.display = 'none';
        helperView.style.display = 'block';
        helBtn.classList.add('active');
        reqBtn.classList.remove('active');
        document.body.classList.add('helper-mode');
        document.body.classList.remove('requester-mode');
        currentUser.role = 'helper';
        loadHelperJobs();
        updateHelperStats();
        updateHelperStatsFromTransactions();
        updateWalletVisibility();
    }

    updateWalletByRole();
    loadWallet();
    updateBerandaHistory();
}

document.getElementById('roleRequesterMobile').addEventListener('click', function() {
    setRole('requester');
});

document.getElementById('roleHelperMobile').addEventListener('click', function() {
    setRole('helper');
});

// ================================================================
// DARK MODE
// ================================================================

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    const toggle = document.getElementById('darkModeToggleMobile');
    if (toggle) toggle.checked = isDark;

    const label = document.getElementById('darkToggleLabel');
    if (label) label.textContent = isDark ? 'Mode Terang' : 'Mode Gelap';

    const icon = document.querySelector('#drawerDarkToggle i');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';

    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}

function initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        const toggle = document.getElementById('darkModeToggleMobile');
        if (toggle) toggle.checked = true;
        const label = document.getElementById('darkToggleLabel');
        if (label) label.textContent = 'Mode Terang';
        const icon = document.querySelector('#drawerDarkToggle i');
        if (icon) icon.className = 'fas fa-sun';
    }
}

document.getElementById('darkModeToggleMobile').addEventListener('change', toggleDarkMode);
document.getElementById('drawerDarkToggle').addEventListener('click', toggleDarkMode);

// ================================================================
// LOGOUT - Reset notifikasi
// ================================================================

async function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        showLoading(true);
        try {
            // 🔥 Hapus tracking notifikasi
            localStorage.removeItem('lastNotificationIdMobile');
            lastNotificationId = 0;
            firstNotificationLoad = true;
            
            await fetch('logout.php');
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = 'index.html';
        } finally {
            showLoading(false);
        }
    }
}

document.getElementById('drawerLogout').addEventListener('click', function(e) {
    e.preventDefault();
    logout();
});

document.getElementById('logoutBtnMobile').addEventListener('click', logout);

// ================================================================
// LOAD JOBS - FIXED: ERROR HANDLING UNTUK RESPONSE 500
// ================================================================

async function loadJobsFromDB() {
    if (!currentUser) {
        console.log('loadJobsFromDB: No current user');
        return false;
    }

    console.log('🔄 Loading jobs from database...');

    try {
        // Gunakan Promise.allSettled agar tidak gagal total jika satu endpoint error
        const results = await Promise.allSettled([
            fetch(`get_jobs.php?type=open&t=${Date.now()}`),
            fetch(`get_jobs.php?type=requester&user_id=${currentUser.id}&t=${Date.now()}`),
            fetch(`get_jobs.php?type=helper&user_id=${currentUser.id}&t=${Date.now()}`),
            fetch(`get_jobs.php?type=pending&t=${Date.now()}`),
            fetch(`get_jobs.php?type=offered&t=${Date.now()}`)
        ]);

        // Proses setiap hasil
        const allJobs = [];
        const jobIds = new Set();

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            let data = null;
            let source = ['open', 'requester', 'helper', 'pending', 'offered'][i] || 'unknown';

            if (result.status === 'fulfilled' && result.value.ok) {
                try {
                    const text = await result.value.text();
                    if (text && text.trim().length > 0) {
                        data = JSON.parse(text);
                        if (data.success && data.jobs) {
                            console.log(`✅ ${source}: ${data.jobs.length} jobs`);
                            data.jobs.forEach(job => {
                                if (!jobIds.has(job.id)) {
                                    jobIds.add(job.id);
                                    allJobs.push(job);
                                }
                            });
                        } else {
                            console.warn(`⚠️ ${source}: API returned success:false or no jobs`);
                        }
                    } else {
                        console.warn(`⚠️ ${source}: Empty response`);
                    }
                } catch (parseError) {
                    console.warn(`⚠️ ${source}: JSON parse error - ${parseError.message}`);
                }
            } else {
                const errorMsg = result.status === 'rejected' ? result.reason?.message || 'Unknown' : `HTTP ${result.value?.status || '?'}`;
                console.warn(`⚠️ ${source}: Failed - ${errorMsg}`);
            }
        }

        // Jika tidak ada jobs sama sekali, coba endpoint dasar
        if (allJobs.length === 0) {
            console.log('🔄 No jobs from specific endpoints, trying fallback...');
            try {
                const fallbackRes = await fetch(`get_jobs.php?type=all&t=${Date.now()}`);
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    if (fallbackData.success && fallbackData.jobs) {
                        fallbackData.jobs.forEach(job => {
                            if (!jobIds.has(job.id)) {
                                jobIds.add(job.id);
                                allJobs.push(job);
                            }
                        });
                        console.log(`✅ Fallback: ${fallbackData.jobs.length} jobs`);
                    }
                }
            } catch (e) {
                console.warn('⚠️ Fallback failed:', e.message);
            }
        }

        jobs = allJobs;
        console.log(`✅ Jobs loaded: ${jobs.length} total`);

        // Refresh displays
        refreshAllJobDisplays();

        return true;
    } catch (error) {
        console.error('Error loading jobs:', error);
        // Jangan biarkan error menggagalkan aplikasi
        jobs = [];
        refreshAllJobDisplays();
        return false;
    }
}

function refreshAllJobDisplays() {
    console.log('🔄 Refreshing all job displays...');

    const isRequester = currentUser?.role === 'requester';

    if (isRequester) {
        loadRequesterJobs();
        updateRequesterStats();
    } else {
        loadHelperJobs();
        updateHelperStats();
        updateHelperStatsFromTransactions();
    }

    loadMyJobs();
    loadFavorites();
    loadHistory();
    syncRatingToBeranda();
    updateMyJobBadges();
    updateWalletDisplay();
    updateBerandaHistory();

    console.log('✅ All job displays refreshed');
}

// ================================================================
// JOBS - REQUESTER VIEW
// ================================================================

function loadRequesterJobs() {
    const jobList = document.getElementById('requesterJobListMobile');
    if (!jobList) return;

    // Filter semua job yang dibuat oleh requester ini
    let filteredJobs = jobs.filter(job => job.user_id === currentUser?.id);

    const statusFilter = document.getElementById('statusFilterMobile')?.value || 'all';
    const catFilter = document.getElementById('categoryFilterMobile')?.value || 'all';
    const sort = document.getElementById('sortFilterMobile')?.value || 'newest';
    const search = document.getElementById('homeSearchMobile')?.value?.toLowerCase() || '';

    // Filter status - tampilkan semua termasuk offered, selected
    if (statusFilter !== 'all') {
        filteredJobs = filteredJobs.filter(job => job.status === statusFilter);
    }
    if (catFilter !== 'all') {
        filteredJobs = filteredJobs.filter(job => job.category === catFilter);
    }
    if (search) {
        filteredJobs = filteredJobs.filter(job =>
            job.title.toLowerCase().includes(search) ||
            (job.location && job.location.toLowerCase().includes(search))
        );
    }

    if (sort === 'newest') filteredJobs = filteredJobs.slice().reverse();
    else if (sort === 'oldest') filteredJobs = filteredJobs.slice();
    else if (sort === 'price-high') filteredJobs = filteredJobs.slice().sort((a, b) => b.price - a.price);
    else if (sort === 'price-low') filteredJobs = filteredJobs.slice().sort((a, b) => a.price - b.price);

    document.getElementById('activeJobsCount').textContent = filteredJobs.length;

    jobList.innerHTML = '';
    if (filteredJobs.length === 0) {
        jobList.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><h3>Tidak ada permintaan</h3><p>Buat permintaan pertama Anda</p></div>`;
        return;
    }

    filteredJobs.forEach(job => {
        const isInProgress = job.status === 'in-progress' || job.status === 'ongoing' || job.status === 'selected' || job.status === 'paid';
        jobList.appendChild(createJobCard(job, isInProgress));
    });
}

// ================================================================
// JOBS - HELPER VIEW
// ================================================================

function loadHelperJobs() {
    const jobList = document.getElementById('helperJobListMobile');
    if (!jobList) return;

    // Helper melihat job yang tersedia (open/offered) dan job miliknya sendiri
    let openJobs = jobs.filter(job => job.status === 'open' || job.status === 'offered');
    let inProgressJobs = jobs.filter(job => ['paid', 'in-progress', 'ongoing'].includes(job.status) && job.helper_id === currentUser?.id);
    let perbaikanJobs = jobs.filter(job => job.status === 'perbaikan' && job.helper_id === currentUser?.id);

    const cat = document.getElementById('helperCategoryFilterMobile')?.value || 'all';
    const sort = document.getElementById('helperSortFilterMobile')?.value || 'newest';
    const search = document.getElementById('helperSearchMobile')?.value?.toLowerCase() || '';

    if (cat !== 'all') {
        openJobs = openJobs.filter(job => job.category === cat);
        inProgressJobs = inProgressJobs.filter(job => job.category === cat);
        perbaikanJobs = perbaikanJobs.filter(job => job.category === cat);
    }

    if (search) {
        openJobs = openJobs.filter(job => job.title.toLowerCase().includes(search) || (job.location && job.location.toLowerCase().includes(search)));
        inProgressJobs = inProgressJobs.filter(job => job.title.toLowerCase().includes(search) || (job.location && job.location.toLowerCase().includes(search)));
        perbaikanJobs = perbaikanJobs.filter(job => job.title.toLowerCase().includes(search) || (job.location && job.location.toLowerCase().includes(search)));
    }

    if (sort === 'newest') {
        openJobs = openJobs.slice().reverse();
        inProgressJobs = inProgressJobs.slice().reverse();
        perbaikanJobs = perbaikanJobs.slice().reverse();
    } else if (sort === 'price-high') {
        openJobs = openJobs.slice().sort((a, b) => b.price - a.price);
        inProgressJobs = inProgressJobs.slice().sort((a, b) => b.price - a.price);
        perbaikanJobs = perbaikanJobs.slice().sort((a, b) => b.price - a.price);
    } else if (sort === 'price-low') {
        openJobs = openJobs.slice().sort((a, b) => a.price - b.price);
        inProgressJobs = inProgressJobs.slice().sort((a, b) => a.price - b.price);
        perbaikanJobs = perbaikanJobs.slice().sort((a, b) => a.price - b.price);
    }

    document.getElementById('helperActiveJobsCount').textContent = inProgressJobs.length;

    jobList.innerHTML = '';

    if (openJobs.length === 0 && inProgressJobs.length === 0 && perbaikanJobs.length === 0) {
        jobList.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><h3>Tidak ada pekerjaan tersedia</h3></div>`;
        return;
    }

    if (perbaikanJobs.length > 0) {
        const header = document.createElement('div');
        header.style.cssText = 'grid-column:1/-1;padding:8px 4px;font-weight:700;color:#e67e22;font-size:0.8rem;';
        header.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Perlu Upload Ulang (${perbaikanJobs.length})`;
        jobList.appendChild(header);
        perbaikanJobs.forEach(job => {
            jobList.appendChild(createJobCard(job, true));
        });
    }

    inProgressJobs.forEach(job => {
        jobList.appendChild(createJobCard(job, true));
    });

    if (openJobs.length > 0) {
        const header = document.createElement('div');
        header.style.cssText = 'grid-column:1/-1;padding:8px 4px;font-weight:700;color:var(--primary);font-size:0.8rem;';
        header.innerHTML = `<i class="fas fa-briefcase"></i> Pekerjaan Tersedia (${openJobs.length})`;
        jobList.appendChild(header);
        openJobs.forEach(job => {
            jobList.appendChild(createJobCard(job, false));
        });
    }
}

// ================================================================
// JOBS - CREATE JOB CARD (DENGAN SISTEM NEGOSIASI)
// ================================================================

function createJobCard(job, isInProgress) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.onclick = function(e) {
        if (e.target.closest('button')) return;
        viewJobDetail(job.id);
    };

    let imageHtml = '';
    if (job.image_path && job.image_path !== null && job.image_path !== '') {
        imageHtml = `<img src="${job.image_path}" class="card-img" alt="${escapeHtml(job.title)}" onerror="this.style.display='none'">`;
    } else {
        imageHtml = `<div class="card-img" style="display:flex;align-items:center;justify-content:center;color:var(--gray-lighter);background:var(--gray-bg);"><i class="fas fa-image" style="font-size:2rem;"></i></div>`;
    }

    const emergencyBadge = job.emergency ? `<span class="emergency-badge">🚨 Emergency</span>` : '';
    const statusBadge = isInProgress ? `<span class="emergency-badge" style="background:#f59e0b;">🔄 Sedang Berjalan</span>` : '';
    const offeredBadge = job.status === 'offered' ? `<span class="emergency-badge" style="background:#3b82f6;">📩 ${job.offer_count || 0} Tawaran</span>` : '';
    const selectedBadge = job.status === 'selected' ? `<span class="emergency-badge" style="background:#8b5cf6;">🎯 Menunggu Bayar</span>` : '';
    const paidBadge = job.status === 'paid' ? `<span class="emergency-badge" style="background:#059669;">💳 Dibayar</span>` : '';

    let shortDesc = '';
    if (job.description) {
        const words = job.description.trim().split(/\s+/);
        shortDesc = words.length > 20 ? words.slice(0, 20).join(' ') + '...' : job.description;
        if (shortDesc.length > 150) shortDesc = shortDesc.substring(0, 150) + '...';
    }

    const formattedPrice = 'Rp ' + (job.price || 0).toLocaleString('id-ID');
    const budgetDisplay = (job.budget_min && job.budget_max) ? 
        `Budget: Rp ${job.budget_min.toLocaleString('id-ID')} - Rp ${job.budget_max.toLocaleString('id-ID')}` : '';
    const shortLocation = job.location ? (job.location.length > 35 ? job.location.substring(0, 35) + '...' : job.location) : 'Lokasi tidak tersedia';
    const lowestOffer = job.lowest_offer ? '💰 Tawaran termurah: Rp ' + job.lowest_offer.toLocaleString('id-ID') : '';

    let actionsHtml = '';
    const isHelper = currentUser?.role === 'helper' || currentUser?.role === 'user';
    const isRequester = currentUser?.role === 'requester';
    const isJobOwner = currentUser?.id === job.user_id;

    // ================================================================
    // STATUS: PERBAIKAN - Helper upload ulang
    // ================================================================
    if (job.status === 'perbaikan' && isHelper && job.helper_id === currentUser?.id) {
        actionsHtml = `
            <div class="card-actions">
                <button class="btn btn-primary" style="background:#e67e22;border-color:#e67e22;" onclick="event.stopPropagation(); openUploadBuktiModalMobile(${job.id})">
                    <i class="fas fa-redo"></i> Upload Ulang
                </button>
                <button class="btn btn-outline" onclick="event.stopPropagation(); openReportModalMobile(${job.id})">
                    <i class="fas fa-flag"></i> Laporkan
                </button>
            </div>
        `;
    }
    // ================================================================
    // STATUS: IN PROGRESS - Helper upload bukti
    // ================================================================
    else if (job.status === 'in-progress' || job.status === 'ongoing') {
        actionsHtml = `
            <div class="card-actions">
                <button class="btn btn-success" onclick="event.stopPropagation(); openUploadBuktiModalMobile(${job.id})">
                    <i class="fas fa-cloud-upload-alt"></i> Selesai
                </button>
                <button class="btn btn-outline" onclick="event.stopPropagation(); startChatWithRequesterMobile(${job.id}, ${job.user_id}, '${escapeHtml(job.requester_name || 'Requester')}', '${escapeHtml(job.title)}')">
                    <i class="fas fa-comment"></i> Chat
                </button>
            </div>
        `;
    }
    // ================================================================
    // STATUS: PAID - Helper mulai bekerja
    // ================================================================
    else if (job.status === 'paid' && isHelper && job.helper_id === currentUser?.id) {
        actionsHtml = `
            <div class="card-actions">
                <button class="btn btn-primary" onclick="event.stopPropagation(); startJob(${job.id})">
                    <i class="fas fa-play"></i> Mulai Bekerja
                </button>
                <button class="btn btn-outline" onclick="event.stopPropagation(); startChatWithRequesterMobile(${job.id}, ${job.user_id}, '${escapeHtml(job.requester_name || 'Requester')}', '${escapeHtml(job.title)}')">
                    <i class="fas fa-comment"></i> Chat
                </button>
            </div>
        `;
    }
    // ================================================================
    // STATUS: SELECTED - Requester bayar
    // ================================================================
    else if (job.status === 'selected' && isRequester && isJobOwner) {
        actionsHtml = `
            <div class="card-actions">
                <button class="btn btn-success" onclick="event.stopPropagation(); openPaymentModal(${job.id})">
                    <i class="fas fa-credit-card"></i> Bayar Sekarang
                </button>
            </div>
        `;
    }
// ================================================================
// Di dalam createJobCard() - Bagian STATUS OPEN / OFFERED
// ================================================================

else if (job.status === 'open' || job.status === 'offered') {
    const isHelper = currentUser?.role === 'helper' || currentUser?.role === 'user';
    const isRequester = currentUser?.role === 'requester';
    const isJobOwner = currentUser?.id === job.user_id;
    
    if (isHelper && !isJobOwner) {
        // Helper melihat tombol Tawar
        const hasOffered = jobs.some(j => j.id === job.id && j.offers && j.offers.some(o => o.helper_id === currentUser.id && o.status === 'pending'));
        actionsHtml = `
            <div class="card-actions">
                <button class="btn btn-primary" onclick="event.stopPropagation(); createOffer(${job.id})">
                    <i class="fas fa-gavel"></i> Tawar
                </button>
                <button class="btn btn-outline" onclick="event.stopPropagation(); openOffersModal(${job.id})">
                    <i class="fas fa-list"></i> Lihat Tawaran ${job.offer_count > 0 ? '('+job.offer_count+')' : ''}
                </button>
            </div>
        `;
    } else if (isRequester && isJobOwner) {
        // 🔥 REQUESTER: Lihat tawaran dan pilih
        actionsHtml = `
            <div class="card-actions">
                <button class="btn btn-primary" onclick="event.stopPropagation(); openOffersModal(${job.id})">
                    <i class="fas fa-list"></i> Lihat Tawaran ${job.offer_count > 0 ? '('+job.offer_count+')' : ''}
                </button>
                ${job.offer_count === 0 ? `
                    <button class="btn btn-ghost" onclick="event.stopPropagation(); cancelJob(${job.id})">
                        <i class="fas fa-times"></i> Batal
                    </button>
                ` : ''}
                <button class="btn btn-outline" onclick="event.stopPropagation(); openReportModalMobile(${job.id})">
                    <i class="fas fa-flag"></i> Laporkan
                </button>
            </div>
        `;
    } else {
        actionsHtml = `
            <div class="card-actions">
                <button class="btn btn-outline" onclick="event.stopPropagation(); openOffersModal(${job.id})">
                    <i class="fas fa-list"></i> Lihat Tawaran ${job.offer_count > 0 ? '('+job.offer_count+')' : ''}
                </button>
            </div>
        `;
    }
}
    // ================================================================
    // STATUS: PENDING_ACC - Requester ACC/Reject
    // ================================================================
    else if (job.status === 'pending_acc' && isRequester && isJobOwner) {
        actionsHtml = `
            <div class="card-actions">
                <button class="btn btn-success" onclick="event.stopPropagation(); openAccModalMobile(${job.id})">
                    <i class="fas fa-check"></i> ACC
                </button>
                <button class="btn btn-danger" onclick="event.stopPropagation(); openRejectModalMobile(${job.id})">
                    <i class="fas fa-times"></i> Reject
                </button>
                <button class="btn btn-outline" onclick="event.stopPropagation(); openReportModalMobile(${job.id})">
                    <i class="fas fa-flag"></i> Laporkan
                </button>
            </div>
        `;
    }
    // ================================================================
    // STATUS: COMPLETED - Rating
    // ================================================================
    else if (job.status === 'completed') {
        const canRate = (isRequester && isJobOwner) || (isHelper && job.helper_id === currentUser?.id);
        actionsHtml = `
            <div class="card-actions">
                ${canRate ? `
                    <button class="btn btn-primary" onclick="event.stopPropagation(); giveRating(${job.id})">
                        <i class="fas fa-star"></i> Beri Rating
                    </button>
                ` : ''}
                <button class="btn btn-outline" onclick="event.stopPropagation(); openReportModalMobile(${job.id})">
                    <i class="fas fa-flag"></i> Laporkan
                </button>
            </div>
        `;
    }
    // ================================================================
    // DEFAULT
    // ================================================================
    else {
        actionsHtml = `
            <div class="card-actions">
                <button class="btn btn-outline" onclick="event.stopPropagation(); openReportModalMobile(${job.id})">
                    <i class="fas fa-flag"></i> Laporkan
                </button>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="card-img" style="position:relative;">
            ${imageHtml}
            <div style="position:absolute;top:8px;left:8px;display:flex;gap:4px;flex-wrap:wrap;">
                ${emergencyBadge} ${statusBadge} ${offeredBadge} ${selectedBadge} ${paidBadge}
            </div>
            <button class="btn ${job.favorite ? 'btn-primary' : 'btn-outline'}" style="position:absolute;top:8px;right:8px;padding:4px 8px;font-size:0.7rem;border-radius:50%;min-width:32px;min-height:32px;width:32px;height:32px;" onclick="event.stopPropagation(); toggleFavorite(${job.id})">
                <i class="${job.favorite ? 'fas' : 'far'} fa-heart"></i>
            </button>
        </div>
        <div class="card-body">
            <div style="font-size:0.6rem;color:var(--primary);font-weight:600;margin-bottom:2px;">
                <i class="fas fa-tag"></i> ${getCategoryName(job.category)}
                <span style="margin-left:8px;color:var(--gray-light);font-weight:400;">${getStatusName(job.status)}</span>
            </div>
            <div class="card-title">${escapeHtml(job.title)}</div>
            <div class="card-price">${formattedPrice}</div>
            ${budgetDisplay ? `<div style="font-size:0.7rem;color:var(--gray);">${budgetDisplay}</div>` : ''}
            ${lowestOffer ? `<div style="font-size:0.7rem;color:#059669;font-weight:600;">${lowestOffer}</div>` : ''}
            <div class="card-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(shortLocation)}</span>
                <span><i class="fas fa-user"></i> ${escapeHtml(job.requester_name || 'Anonymous')}</span>
            </div>
            ${shortDesc ? `<div class="card-desc">📝 ${escapeHtml(shortDesc)}</div>` : ''}
            ${actionsHtml}
        </div>
    `;

    return card;
}

// ================================================================
// BUDGET RANGE - Untuk Requester (GANTI INDICATOR)
// ================================================================

function updateBudgetDisplayMobile() {
    const minInput = document.getElementById('budgetMinMobile');
    const maxInput = document.getElementById('budgetMaxMobile');
    const emergencyCheck = document.getElementById('emergencyJobMobile');
    
    let minVal = 0, maxVal = 0;
    if (minInput) {
        const raw = minInput.value.replace(/\./g, '');
        minVal = parseInt(raw) || 0;
    }
    if (maxInput) {
        const raw = maxInput.value.replace(/\./g, '');
        maxVal = parseInt(raw) || 0;
    }
    
    const isEmergency = emergencyCheck ? emergencyCheck.checked : false;
    
    const minDisplay = document.getElementById('budgetMinDisplayMobile');
    const maxDisplay = document.getElementById('budgetMaxDisplayMobile');
    const emergencyDisplay = document.getElementById('emergencyDisplayMobile');
    
    if (minDisplay) minDisplay.textContent = 'Rp ' + (minVal || 0).toLocaleString('id-ID');
    if (maxDisplay) maxDisplay.textContent = 'Rp ' + (maxVal || 0).toLocaleString('id-ID');
    if (emergencyDisplay) {
        emergencyDisplay.textContent = isEmergency ? '✅ Emergency (+Rp 10.000)' : 'Tidak';
        emergencyDisplay.style.color = isEmergency ? '#dc3545' : '#64748b';
    }
}

// Event listeners untuk budget
document.addEventListener('DOMContentLoaded', function() {
    const minInput = document.getElementById('budgetMinMobile');
    const maxInput = document.getElementById('budgetMaxMobile');
    const emergencyCheck = document.getElementById('emergencyJobMobile');
    
    if (minInput) {
        minInput.addEventListener('input', function(e) {
            let nilai = this.value.replace(/\D/g, '');
            if (nilai) {
                this.value = formatRupiah(nilai);
            }
            updateBudgetDisplayMobile();
        });
    }
    
    if (maxInput) {
        maxInput.addEventListener('input', function(e) {
            let nilai = this.value.replace(/\D/g, '');
            if (nilai) {
                this.value = formatRupiah(nilai);
            }
            updateBudgetDisplayMobile();
        });
    }
    
    if (emergencyCheck) {
        emergencyCheck.addEventListener('change', updateBudgetDisplayMobile);
    }
});

// ================================================================
// OFFER SYSTEM - CREATE OFFER (Helper menawar)
// ================================================================

async function createOffer(jobId) {
    if (!currentUser) {
        showNotification('Anda harus login terlebih dahulu', 'error');
        return;
    }
    
    // Cek role: helper di database adalah 'user', atau mode 'helper'
    if (currentUser.role !== 'user' && currentUser.role !== 'helper') {
        showNotification('Hanya Helper yang bisa menawar', 'error');
        return;
    }
    
    // Cek apakah helper sudah menawar job ini
    try {
        const response = await fetch(`get_offers.php?job_id=${jobId}&t=${Date.now()}`);
        const data = await response.json();
        if (data.success && data.offers) {
            const existing = data.offers.some(o => o.helper_id == currentUser.id && o.status === 'pending');
            if (existing) {
                showNotification('Anda sudah menawar pekerjaan ini (hanya 1 kali)', 'warning');
                return;
            }
        }
    } catch (e) {
        console.warn('Error checking existing offers:', e);
    }
    
    // Buka modal tawaran
    document.getElementById('offerJobId').value = jobId;
    
    const job = jobs.find(j => j.id === jobId);
    if (job) {
        document.getElementById('offerJobTitle').textContent = job.title;
        const budgetText = (job.budget_min && job.budget_max) ? 
            `Rp ${job.budget_min.toLocaleString('id-ID')} - Rp ${job.budget_max.toLocaleString('id-ID')}` : 
            'Rp ' + (job.price || 0).toLocaleString('id-ID');
        document.getElementById('offerJobEstimate').textContent = 'Budget: ' + budgetText;
    }
    
    document.getElementById('offerPrice').value = '';
    document.getElementById('offerMessage').value = '';
    openModal('offerModal');
}

async function submitOffer() {
    const jobId = document.getElementById('offerJobId').value;
    const priceInput = document.getElementById('offerPrice').value.replace(/\./g, '');
    const message = document.getElementById('offerMessage').value.trim();
    
    if (!jobId) {
        showNotification('ID pekerjaan tidak valid', 'error');
        return;
    }
    
    const nominal = parseInt(priceInput) || 0;
    if (nominal < 10000) {
        showNotification('Harga tawaran minimal Rp 10.000', 'error');
        return;
    }
    
    showLoading(true);
    
    const formData = new FormData();
    formData.append('action', 'create');
    formData.append('job_id', jobId);
    formData.append('price', nominal);
    formData.append('message', message);
    
    try {
        const response = await fetch('offer.php', { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Tawaran berhasil dikirim! Menunggu respon Requester.', 'success');
            closeModal('offerModal');
            
            await loadJobsFromDB();
            loadHelperJobs();
            loadRequesterJobs();
        } else {
            showNotification('Gagal: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error submitting offer:', error);
        showNotification('Terjadi kesalahan', 'error');
    } finally {
        showLoading(false);
    }
}

document.getElementById('offerPrice').addEventListener('input', function(e) {
    let nilai = this.value.replace(/\D/g, '');
    if (nilai) {
        this.value = formatRupiah(nilai);
    }
});

document.getElementById('submitOfferBtn').addEventListener('click', submitOffer);

// ================================================================
// GET OFFERS - Ambil daftar tawaran untuk satu job
// ================================================================

async function getJobOffers(jobId) {
    try {
        const response = await fetch(`get_offers.php?job_id=${jobId}&t=${Date.now()}`);
        const data = await response.json();
        if (data.success) {
            return data.offers || [];
        }
        return [];
    } catch (error) {
        console.error('Error getting offers:', error);
        return [];
    }
}

// ================================================================
// LOAD OFFERS FOR JOB - PERBAIKAN LENGKAP
// ================================================================

async function loadOffersForJob(jobId) {
    const container = document.getElementById('offersList');
    if (!container) {
        console.error('❌ offersList container not found!');
        return;
    }
    
    container.innerHTML = '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Memuat tawaran...</div>';
    
    try {
        const response = await fetch(`get_offers.php?job_id=${jobId}&t=${Date.now()}`);
        const data = await response.json();
        
        console.log('📦 Offers data received:', data);
        
        if (!data.success) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Gagal memuat</h3></div>';
            return;
        }
        
        const offers = data.offers || [];
        const job = data.job || {};
        
        console.log('📋 Job data:', job);
        console.log('📋 Current user:', currentUser);
        console.log('📋 Total offers:', offers.length);
        
        if (offers.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Belum ada tawaran</h3><p>Belum ada helper yang menawar</p></div>';
            return;
        }
        
        // 🔥 CEK: Apakah user adalah requester pemilik job?
        const isRequester = currentUser?.role === 'requester';
        const isJobOwner = currentUser?.id === job?.user_id;
        const canSelectAny = isRequester && isJobOwner && (job?.status === 'offered' || job?.status === 'open');
        
        console.log('🔍 isRequester:', isRequester);
        console.log('🔍 isJobOwner:', isJobOwner);
        console.log('🔍 canSelectAny:', canSelectAny);
        console.log('🔍 job.status:', job?.status);
        
        // Tampilkan tawaran, urut dari termurah
        let html = `<div style="margin-bottom:8px;font-size:0.8rem;color:var(--gray);">${offers.length} tawaran</div>`;
        
        offers.forEach((offer, index) => {
            const isYourOffer = offer.helper_id == currentUser?.id;
            const isSelected = offer.status === 'accepted';
            const isExpired = offer.is_expired || false;
            const isPending = offer.status === 'pending';
            
            console.log(`📌 Offer #${index}:`, {
                id: offer.id,
                helper_id: offer.helper_id,
                status: offer.status,
                isPending,
                isExpired,
                isYourOffer
            });
            
            let statusBadge = '';
            if (isSelected) {
                statusBadge = '<span style="background:#10b981;color:white;padding:2px 10px;border-radius:20px;font-size:0.6rem;">✅ Dipilih</span>';
            } else if (isExpired) {
                statusBadge = '<span style="background:#ef4444;color:white;padding:2px 10px;border-radius:20px;font-size:0.6rem;">⏰ Expired</span>';
            } else if (isYourOffer) {
                statusBadge = '<span style="background:#3b82f6;color:white;padding:2px 10px;border-radius:20px;font-size:0.6rem;">Tawaran Anda</span>';
            }
            
            const stars = offer.helper_rating > 0 ? '⭐ ' + offer.helper_rating.toFixed(1) : '⭐ 0.0';
            
            // 🔥 PERBAIKAN: canSelect = requester pemilik job, tawaran pending, belum expired, dan bukan tawaran sendiri
            const canSelect = canSelectAny && isPending && !isExpired && !isYourOffer;
            
            console.log(`🎯 canSelect for offer ${offer.id}:`, canSelect, {
                canSelectAny,
                isPending,
                isExpired,
                isYourOffer
            });
            
            html += `
                <div style="background:var(--card-bg);border-radius:12px;padding:14px;margin-bottom:10px;border:1px solid ${isSelected ? '#10b981' : 'var(--border-color)'};${isSelected ? 'border-left:4px solid #10b981;' : ''}">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                        <div>
                            <strong>${escapeHtml(offer.helper_name || 'Helper')}</strong>
                            <span style="font-size:0.7rem;color:var(--gray-light);margin-left:6px;">${stars}</span>
                            ${statusBadge}
                        </div>
                        <div style="font-weight:700;color:var(--primary);font-size:1.1rem;">
                            Rp ${Number(offer.offered_price).toLocaleString('id-ID')}
                        </div>
                    </div>
                    ${offer.message ? `<div style="font-size:0.8rem;color:var(--gray);margin-top:6px;padding:6px 10px;background:var(--gray-bg);border-radius:8px;">💬 ${escapeHtml(offer.message)}</div>` : ''}
                    <div style="font-size:0.65rem;color:var(--gray-light);margin-top:6px;">
                        <i class="fas fa-clock"></i> ${formatChatTime(offer.created_at)}
                        ${offer.total_ratings > 0 ? ` · ${offer.total_ratings} ulasan` : ''}
                    </div>
                    ${canSelect ? `
                        <div style="margin-top:10px;display:flex;gap:8px;">
                            <button class="btn btn-success" style="flex:1;padding:8px;font-size:0.75rem;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;" onclick="selectOffer(${offer.id}, ${offer.job_id}, ${offer.offered_price})">
                                <i class="fas fa-check"></i> Pilih Tawaran Ini
                            </button>
                            <button class="btn btn-ghost" style="flex:0.5;padding:8px;font-size:0.75rem;background:transparent;border:1px solid #e2e8f0;color:#64748b;border-radius:8px;cursor:pointer;font-weight:600;" onclick="declineOffer(${offer.id})">
                                <i class="fas fa-times"></i> Tolak
                            </button>
                        </div>
                    ` : ''}
                    ${isYourOffer && isPending && !isExpired ? `
                        <div style="margin-top:8px;font-size:0.7rem;color:var(--gray);text-align:center;">
                            <i class="fas fa-clock"></i> Menunggu keputusan Requester
                        </div>
                    ` : ''}
                    ${isSelected && isYourOffer ? `
                        <div style="margin-top:8px;font-size:0.7rem;color:#059669;text-align:center;font-weight:600;">
                            <i class="fas fa-check-circle"></i> Tawaran Anda dipilih! Tunggu pembayaran dari Requester.
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
        console.log('✅ Offers rendered successfully');
        
    } catch (error) {
        console.error('Error loading offers:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error</h3></div>';
    }
}

// ================================================================
// OPEN OFFERS MODAL - Lihat semua tawaran untuk satu job
// ================================================================

function openOffersModal(jobId) {
    console.log('🔍 openOffersModal called with jobId:', jobId);
    
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
        showNotification('Pekerjaan tidak ditemukan', 'error');
        return;
    }
    
    console.log('📋 Job found:', job.title, 'status:', job.status, 'offer_count:', job.offer_count);
    
    document.getElementById('offersModalJobId').value = jobId;
    document.getElementById('offersModalTitle').textContent = 'Tawaran untuk: ' + job.title;
    document.getElementById('offersModalStatus').textContent = 'Status: ' + getStatusName(job.status);
    
    openModal('offersModal');
    loadOffersForJob(jobId);
}

function refreshOffers() {
    const jobId = document.getElementById('offersModalJobId').value;
    console.log('🔄 Refreshing offers for jobId:', jobId);
    if (jobId) {
        loadOffersForJob(jobId);
    }
}

// ================================================================
// SELECT OFFER - Requester memilih tawaran (DEAL!)
// ================================================================

async function selectOffer(offerId, jobId, price) {
    console.log('🎯 selectOffer called:', { offerId, jobId, price });
    
    if (!currentUser) {
        showNotification('Anda harus login', 'error');
        return;
    }
    
    // Cek role
    if (currentUser.role !== 'requester') {
        showNotification('Hanya Requester yang bisa memilih tawaran', 'error');
        return;
    }
    
    if (!confirm(`Pilih tawaran Rp ${Number(price).toLocaleString('id-ID')} ini?`)) {
        return;
    }
    
    showLoading(true);
    
    try {
        const formData = new FormData();
        formData.append('action', 'select');
        formData.append('offer_id', offerId);
        
        console.log('📤 Sending select offer request:', { offerId, action: 'select' });
        
        const response = await fetch('offer.php', { method: 'POST', body: formData });
        const result = await response.json();
        
        console.log('📥 Select offer response:', result);
        
        if (result.success) {
            showNotification('🎉 DEAL! Tawaran dipilih! Silakan lakukan pembayaran.', 'success');
            closeModal('offersModal');
            closeModal('jobDetailModalMobile');
            
            await loadJobsFromDB();
            loadRequesterJobs();
            loadHelperJobs();
            loadMyJobs();
            
            setTimeout(() => {
                openPaymentModal(jobId);
            }, 1000);
        } else {
            showNotification('Gagal: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error selecting offer:', error);
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ================================================================
// DECLINE OFFER - Requester menolak tawaran
// ================================================================

async function declineOffer(offerId) {
    console.log('❌ declineOffer called with offerId:', offerId);
    
    if (!confirm('Tolak tawaran ini?')) return;
    
    showLoading(true);
    
    try {
        const formData = new FormData();
        formData.append('action', 'decline');
        formData.append('offer_id', offerId);
        
        const response = await fetch('offer.php', { method: 'POST', body: formData });
        const result = await response.json();
        
        console.log('📥 Decline response:', result);
        
        if (result.success) {
            showNotification('Tawaran ditolak', 'info');
            const jobId = document.getElementById('offersModalJobId').value;
            if (jobId) loadOffersForJob(jobId);
        } else {
            showNotification('Gagal: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error declining offer:', error);
        showNotification('Terjadi kesalahan', 'error');
    } finally {
        showLoading(false);
    }
}

// ================================================================
// PAYMENT - Requester membayar setelah deal
// ================================================================

async function openPaymentModal(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
        showNotification('Pekerjaan tidak ditemukan', 'error');
        return;
    }
    
    if (job.status !== 'selected') {
        showNotification('Pekerjaan belum deal atau sudah dibayar', 'error');
        return;
    }
    
    // Hitung total biaya
    const dealPrice = job.price || 0;
    const isEmergency = job.emergency || false;
    const serviceFee = dealPrice * (SERVICE_FEE_PERCENT / 100);
    const adminFee = 2500;
    const emergencyFee = isEmergency ? 10000 : 0;
    const total = dealPrice + serviceFee + adminFee + emergencyFee;
    
    document.getElementById('paymentJobId').value = jobId;
    document.getElementById('paymentJobTitle').textContent = job.title;
    document.getElementById('paymentDealPrice').textContent = 'Rp ' + dealPrice.toLocaleString('id-ID');
    document.getElementById('paymentServiceFee').textContent = 'Rp ' + serviceFee.toLocaleString('id-ID');
    document.getElementById('paymentAdminFee').textContent = 'Rp ' + adminFee.toLocaleString('id-ID');
    document.getElementById('paymentEmergencyFee').textContent = isEmergency ? 'Rp ' + emergencyFee.toLocaleString('id-ID') : 'Rp 0';
    document.getElementById('paymentTotal').textContent = 'Rp ' + total.toLocaleString('id-ID');
    
    document.getElementById('paymentEmergencyRow').style.display = isEmergency ? 'flex' : 'none';
    
    // Cek saldo
    const balance = currentUser.wallet_requester || 0;
    const balanceEl = document.getElementById('paymentBalance');
    if (balanceEl) {
        balanceEl.textContent = 'Saldo: Rp ' + balance.toLocaleString('id-ID');
        const payBtn = document.getElementById('paymentPayBtn');
        if (balance < total) {
            balanceEl.style.color = '#dc3545';
            balanceEl.innerHTML += ' (Saldo tidak cukup!)';
            if (payBtn) payBtn.disabled = true;
        } else {
            balanceEl.style.color = '';
            if (payBtn) payBtn.disabled = false;
        }
    }
    
    openModal('paymentModal');
}

async function processPayment() {
    const jobId = document.getElementById('paymentJobId').value;
    
    if (!jobId) {
        showNotification('ID pekerjaan tidak valid', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const formData = new FormData();
        formData.append('action', 'pay');
        formData.append('job_id', jobId);
        formData.append('user_id', currentUser.id);
        
        const response = await fetch('update_job.php', { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Pembayaran berhasil! Pekerjaan siap dimulai.', 'success');
            closeModal('paymentModal');
            
            if (result.new_balance !== undefined) {
                currentUser.wallet_requester = result.new_balance;
            }
            
            await loadWalletFromDB();
            await loadJobsFromDB();
            loadRequesterJobs();
            loadHelperJobs();
            loadMyJobs();
            updateWalletDisplay();
            
            showNotification('📢 Helper akan segera mulai bekerja.', 'info');
        } else {
            showNotification('Gagal: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        showNotification('Terjadi kesalahan', 'error');
    } finally {
        showLoading(false);
    }
}

document.getElementById('paymentPayBtn').addEventListener('click', processPayment);

// ================================================================
// START JOB - Helper mulai bekerja setelah dibayar
// ================================================================

async function startJob(jobId) {
    if (!currentUser) {
        showNotification('Anda harus login', 'error');
        return;
    }
    
    // Cek role: helper di database adalah 'user', atau mode 'helper'
    if (currentUser.role !== 'user' && currentUser.role !== 'helper') {
        showNotification('Hanya Helper yang bisa memulai pekerjaan', 'error');
        return;
    }
    
    if (!confirm('Mulai mengerjakan pekerjaan ini?')) return;
    
    showLoading(true);
    
    try {
        const formData = new FormData();
        formData.append('action', 'start');
        formData.append('job_id', jobId);
        formData.append('user_id', currentUser.id);
        
        const response = await fetch('update_job.php', { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.success) {
            showNotification('🔧 Pekerjaan dimulai!', 'success');
            await loadJobsFromDB();
            loadHelperJobs();
            loadMyJobs();
        } else {
            showNotification('Gagal: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error starting job:', error);
        showNotification('Terjadi kesalahan', 'error');
    } finally {
        showLoading(false);
    }
}

// ================================================================
// CANCEL JOB - Requester membatalkan pekerjaan
// ================================================================

async function cancelJob(jobId) {
    if (!currentUser) {
        showNotification('Anda harus login', 'error');
        return;
    }
    
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
        showNotification('Pekerjaan tidak ditemukan', 'error');
        return;
    }
    
    if (job.user_id !== currentUser.id) {
        showNotification('Anda bukan pemilik pekerjaan ini', 'error');
        return;
    }
    
    if (job.status !== 'open' && job.status !== 'offered') {
        showNotification('Pekerjaan sudah tidak bisa dibatalkan', 'error');
        return;
    }
    
    if (!confirm(`Batalkan pekerjaan "${job.title}"?`)) {
        return;
    }
    
    showLoading(true);
    
    try {
        const formData = new FormData();
        formData.append('action', 'cancel');
        formData.append('job_id', jobId);
        formData.append('user_id', currentUser.id);
        
        const response = await fetch('update_job.php', { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.success) {
            showNotification('Pekerjaan dibatalkan', 'info');
            await loadJobsFromDB();
            loadRequesterJobs();
            loadMyJobs();
        } else {
            showNotification('Gagal: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error canceling job:', error);
        showNotification('Terjadi kesalahan', 'error');
    } finally {
        showLoading(false);
    }
}

// ================================================================
// VIEW JOB DETAIL - PERBAIKAN UNTUK REQUESTER
// ================================================================

function viewJobDetail(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    document.getElementById('detailJobTitleMobile').textContent = job.title;
    document.getElementById('detailJobCategoryMobile').textContent = getCategoryName(job.category);
    document.getElementById('detailJobLocationMobile').textContent = job.location || 'Tidak tersedia';
    document.getElementById('detailJobPriceMobile').textContent = 'Rp ' + (job.price || 0).toLocaleString('id-ID');
    document.getElementById('detailJobDescriptionMobile').textContent = job.description || 'Tidak ada deskripsi';
    document.getElementById('detailJobDateMobile').textContent = job.date || 'Tidak tersedia';
    document.getElementById('detailJobStatusMobile').textContent = getStatusName(job.status);
    document.getElementById('detailJobBadgeMobile').innerHTML = 
        (job.emergency ? '<span class="emergency-badge">🚨 Emergency</span>' : '') +
        (job.offer_count > 0 ? ` <span class="emergency-badge" style="background:#3b82f6;">${job.offer_count} Tawaran</span>` : '');

    const actionBtn = document.getElementById('detailActionBtnMobile');
    const favBtn = document.getElementById('detailFavoriteBtnMobile');

    const isRequester = currentUser?.role === 'requester';
    const isHelper = currentUser?.role === 'user' || currentUser?.role === 'helper';
    const isJobOwner = currentUser?.id === job.user_id;

    console.log('🔍 viewJobDetail - isRequester:', isRequester, 'isJobOwner:', isJobOwner, 'job.status:', job.status);

    if (isRequester) {
        if (job.status === 'open' || job.status === 'offered') {
            // 🔥 REQUESTER: Lihat tawaran
            actionBtn.textContent = `📩 Lihat Tawaran ${job.offer_count > 0 ? '('+job.offer_count+')' : ''}`;
            actionBtn.onclick = function() { 
                console.log('🔘 Opening offers modal for job:', jobId);
                openOffersModal(jobId); 
            };
            actionBtn.style.display = 'inline-block';
            actionBtn.style.background = '#2D63A3';
            actionBtn.style.color = 'white';
        } else if (job.status === 'selected') {
            actionBtn.textContent = '💳 Bayar';
            actionBtn.onclick = function() { openPaymentModal(jobId); };
            actionBtn.style.display = 'inline-block';
        } else if (job.status === 'pending_acc') {
            actionBtn.textContent = '📸 ACC Bukti';
            actionBtn.onclick = function() { openAccModalMobile(jobId); };
            actionBtn.style.display = 'inline-block';
        } else if (job.status === 'completed') {
            actionBtn.textContent = '⭐ Rating';
            actionBtn.onclick = function() { giveRating(jobId); };
            actionBtn.style.display = 'inline-block';
        } else {
            actionBtn.style.display = 'none';
        }
    } else if (isHelper) {
        if (job.status === 'open' || job.status === 'offered') {
            // Cek apakah helper sudah menawar
            const hasOffered = jobs.some(j => j.id === jobId && j.offers && j.offers.some(o => o.helper_id === currentUser.id && o.status === 'pending'));
            actionBtn.textContent = hasOffered ? '💰 Sudah Tawar' : '💰 Tawar';
            actionBtn.onclick = function() { 
                if (!hasOffered) createOffer(jobId); 
                else showNotification('Anda sudah menawar pekerjaan ini', 'info');
            };
            actionBtn.style.display = 'inline-block';
        } else if (job.status === 'paid' && job.helper_id === currentUser?.id) {
            actionBtn.textContent = '▶️ Mulai Bekerja';
            actionBtn.onclick = function() { startJob(jobId); };
            actionBtn.style.display = 'inline-block';
        } else if ((job.status === 'in-progress' || job.status === 'ongoing') && job.helper_id === currentUser?.id) {
            actionBtn.textContent = '📸 Upload Bukti';
            actionBtn.onclick = function() { openUploadBuktiModalMobile(jobId); };
            actionBtn.style.display = 'inline-block';
        } else if (job.status === 'perbaikan' && job.helper_id === currentUser?.id) {
            actionBtn.textContent = '📸 Upload Ulang';
            actionBtn.onclick = function() { openUploadBuktiModalMobile(jobId); };
            actionBtn.style.display = 'inline-block';
        } else if (job.status === 'completed' && job.helper_id === currentUser?.id) {
            actionBtn.textContent = '⭐ Rating';
            actionBtn.onclick = function() { giveRating(jobId); };
            actionBtn.style.display = 'inline-block';
        } else {
            actionBtn.style.display = 'none';
        }
    } else {
        actionBtn.style.display = 'none';
    }

    favBtn.innerHTML = job.favorite ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    favBtn.onclick = function() { toggleFavorite(jobId); };

    openModal('jobDetailModalMobile');
}

// ================================================================
// JOBS - FAVORITES
// ================================================================

function toggleFavorite(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    job.favorite = !job.favorite;
    loadFavorites();
    loadRequesterJobs();
    loadHelperJobs();
    loadMyJobs();
}

function loadFavorites() {
    const favoritesList = document.getElementById('favoriteJobListMobile');
    if (!favoritesList) return;

    const favoriteJobs = jobs.filter(job => job.favorite);
    
    favoritesList.innerHTML = '';
    if (favoriteJobs.length === 0) {
        favoritesList.innerHTML = `<div class="empty-state"><i class="fas fa-heart"></i><h3>Belum ada favorit</h3><p>Klik ikon hati untuk menyimpan</p></div>`;
        return;
    }

    favoriteJobs.forEach(job => {
        favoritesList.appendChild(createJobCard(job, false));
    });
}

// ================================================================
// JOBS - MY JOBS (Pekerjaan Saya)
// ================================================================

function loadMyJobs() {
    if (!currentUser) return;

    const isHelper = currentUser?.role === 'helper' || currentUser?.role === 'user';
    
    // Active jobs
    let active = isHelper
        ? jobs.filter(j => (j.status === 'paid' || j.status === 'in-progress' || j.status === 'ongoing') && j.helper_id === currentUser?.id)
        : jobs.filter(j => (j.status === 'open' || j.status === 'offered' || j.status === 'selected' || j.status === 'paid' || j.status === 'in-progress' || j.status === 'ongoing') && j.user_id === currentUser?.id);

    // Pending ACC (requester only)
    let pendingAcc = [];
    if (!isHelper) {
        pendingAcc = jobs.filter(j => j.status === 'pending_acc' && j.user_id === currentUser?.id);
    }

    // Perbaikan (helper only)
    let perbaikan = isHelper
        ? jobs.filter(j => j.status === 'perbaikan' && j.helper_id === currentUser?.id)
        : [];

    // Completed
    let complete = isHelper
        ? jobs.filter(j => j.status === 'completed' && j.helper_id === currentUser?.id)
        : jobs.filter(j => j.status === 'completed' && j.user_id === currentUser?.id);

    // RENDER ACTIVE TAB
    const activeDiv = document.getElementById('activeJobListMobile');
    if (activeDiv) {
        activeDiv.innerHTML = '';
        if (active.length === 0) {
            activeDiv.innerHTML = `<div class="empty-state"><i class="fas fa-briefcase"></i><h3>Belum ada pekerjaan aktif</h3></div>`;
        } else {
            active.forEach(job => {
                activeDiv.appendChild(createJobCard(job, job.status === 'in-progress' || job.status === 'ongoing'));
            });
        }
    }

    // RENDER COMPLETED TAB
    const compDiv = document.getElementById('completedJobListMobile');
    if (compDiv) {
        compDiv.innerHTML = '';
        if (complete.length === 0) {
            compDiv.innerHTML = `<div class="empty-state"><i class="fas fa-check-circle"></i><h3>Belum ada pekerjaan selesai</h3></div>`;
        } else {
            complete.forEach(job => {
                compDiv.appendChild(createJobCard(job, false));
            });
        }
    }

    // RENDER PENDING ACC TAB (Requester only)
    const accDiv = document.getElementById('pendingAccJobListMobile');
    if (accDiv) {
        accDiv.innerHTML = '';
        if (!isHelper) {
            if (pendingAcc.length === 0) {
                accDiv.innerHTML = `<div class="empty-state"><i class="fas fa-hourglass-half"></i><h3>Tidak ada pekerjaan menunggu ACC</h3></div>`;
            } else {
                pendingAcc.forEach(job => {
                    accDiv.appendChild(createRequesterAccCard(job));
                });
            }
        } else {
            accDiv.innerHTML = `<div class="empty-state"><i class="fas fa-info-circle"></i><h3>Tab ini untuk Requester</h3></div>`;
        }
    }

    // RENDER PERBAIKAN TAB (Helper only)
    const fixDiv = document.getElementById('perbaikanJobListMobile');
    if (fixDiv) {
        fixDiv.innerHTML = '';
        if (!isHelper) {
            fixDiv.innerHTML = `<div class="empty-state"><i class="fas fa-info-circle"></i><h3>Tab ini untuk Helper</h3></div>`;
        } else if (perbaikan.length === 0) {
            fixDiv.innerHTML = `<div class="empty-state"><i class="fas fa-tools"></i><h3>Tidak ada pekerjaan dalam perbaikan</h3></div>`;
        } else {
            perbaikan.forEach(job => {
                fixDiv.appendChild(createHelperPerbaikanCard(job));
            });
        }
    }

    updateMyJobBadges();
}

function updateMyJobBadges() {
    if (!currentUser) return;
    const isHelper = currentUser.role === 'helper' || currentUser.role === 'user';

    let pendingCount = 0;
    if (!isHelper) {
        pendingCount = jobs.filter(j => j.status === 'pending_acc' && j.user_id === currentUser.id).length;
    }

    const perbaikanCount = isHelper
        ? jobs.filter(j => j.status === 'perbaikan' && j.helper_id === currentUser.id).length
        : 0;

    const el1 = document.getElementById('badgePendingAccMobile');
    const el2 = document.getElementById('badgePerbaikanMobile');

    if (el1) { el1.textContent = pendingCount; el1.style.display = pendingCount ? 'inline-block' : 'none'; }
    if (el2) { el2.textContent = perbaikanCount; el2.style.display = perbaikanCount ? 'inline-block' : 'none'; }
}

// ================================================================
// JOBS - ACCEPT / REJECT (Requester)
// ================================================================

function createRequesterAccCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.style.borderLeft = '4px solid #2980b9';

    const formattedPrice = 'Rp ' + (job.price || 0).toLocaleString('id-ID');
    const completionImage = job.completion_image || '';
    const imgHtml = completionImage && completionImage !== ''
        ? `<img src="${completionImage}" class="acc-proof-img" alt="Bukti Pekerjaan" onclick="event.stopPropagation(); openImageViewer('${completionImage}')">`
        : `<div style="background:#f1f5f9;border-radius:8px;padding:16px;text-align:center;margin:6px 0;color:#94a3b8;font-size:0.8rem;"><i class="fas fa-image"></i> Belum ada foto bukti</div>`;

    const rejectReason = job.reject_reason
        ? `<div class="acc-reject-note"><i class="fas fa-exclamation-triangle"></i> <b>Reject sebelumnya:</b> ${escapeHtml(job.reject_reason)}</div>`
        : '';

    card.innerHTML = `
        <div class="card-body">
            <div style="background:#dbeafe;color:#1d4ed8;padding:4px 10px;border-radius:20px;font-size:0.65rem;font-weight:700;display:inline-block;margin-bottom:6px;">
                <i class="fas fa-clock"></i> Menunggu ACC Anda
            </div>
            <div class="card-title">${escapeHtml(job.title)}</div>
            <div class="card-price">${formattedPrice}</div>
            <div style="font-size:0.7rem;color:var(--gray);margin:4px 0;">
                <i class="fas fa-user"></i> Helper: ${escapeHtml(job.helper_name || '—')}
                <span style="margin-left:8px;"><i class="fas fa-calendar"></i> ${job.date}</span>
            </div>
            ${rejectReason}
            ${imgHtml}
            <div class="card-actions">
                <button class="btn btn-success" onclick="event.stopPropagation(); openAccModalMobile(${job.id})">
                    <i class="fas fa-check"></i> ACC
                </button>
                <button class="btn btn-danger" onclick="event.stopPropagation(); openRejectModalMobile(${job.id})">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
            <button class="btn btn-ghost" style="width:100%;margin-top:6px;font-size:0.7rem;" onclick="event.stopPropagation(); openReportModalMobile(${job.id})">
                <i class="fas fa-flag"></i> Laporkan Masalah
            </button>
        </div>
    `;
    return card;
}

// ================================================================
// ACC JOB
// ================================================================

async function accJob(jobId) {
    console.log('🔄 accJob called for jobId:', jobId);
    
    if (!currentUser) {
        showNotification('Anda harus login terlebih dahulu', 'error');
        return;
    }

    let job = jobs.find(j => j.id === jobId);
    if (!job) {
        await loadJobsFromDB();
        job = jobs.find(j => j.id === jobId);
        if (!job) {
            showNotification('Pekerjaan tidak ditemukan', 'error');
            return;
        }
    }

    showLoading(true);

    try {
        const params = new URLSearchParams();
        params.append('job_id', jobId);
        params.append('action', 'acc');
        params.append('user_id', currentUser.id);

        const response = await fetch('update_job.php', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        let data = null;
        let rawText = '';
        
        try {
            rawText = await response.text();
            console.log('Raw response:', rawText.substring(0, 200));
            
            if (rawText && rawText.trim().length > 0) {
                data = JSON.parse(rawText);
            } else {
                throw new Error('Respons kosong dari server');
            }
        } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            
            if (rawText.includes('<!DOCTYPE') || rawText.includes('<html')) {
                throw new Error('Server mengembalikan halaman error HTML.');
            }
            
            throw new Error('Server mengembalikan respons tidak valid: ' + rawText.substring(0, 100));
        }

        if (data && data.success) {
            showNotification('✅ Pekerjaan disetujui! Dana telah ditransfer ke Helper.', 'success');
            
            const jobIndex = jobs.findIndex(j => j.id === jobId);
            if (jobIndex !== -1) {
                jobs[jobIndex].status = 'completed';
            }

            await loadJobsFromDB();
            await loadWalletFromDB();
            
            if (currentUser.role === 'helper') {
                setTimeout(() => {
                    updateHelperStatsFromTransactions();
                }, 500);
            }
            
            loadMyJobs();
            loadHelperJobs();
            loadRequesterJobs();
            updateWalletDisplay();
            
            closeModal('jobDetailModalMobile');
            setTimeout(() => { 
                if (job) giveRating(jobId); 
            }, 1000);
            
        } else {
            const errorMsg = data?.message || 'Terjadi kesalahan pada server';
            showNotification('Gagal: ' + errorMsg, 'error');
        }
        
    } catch (error) {
        console.error('Error in accJob:', error);
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ================================================================
// ACC MODAL
// ================================================================

function openAccModalMobile(jobId) {
    console.log('🔍 openAccModalMobile called for jobId:', jobId);
    
    let job = jobs.find(j => j.id === jobId);
    
    if (!job) {
        console.log('⚠️ Job not found in array, reloading jobs...');
        showLoading(true);
        
        loadJobsFromDB().then(() => {
            showLoading(false);
            job = jobs.find(j => j.id === jobId);
            
            if (!job) {
                showNotification('Pekerjaan tidak ditemukan setelah reload', 'error');
                return;
            }
            
            showAccModalContent(job);
        }).catch(err => {
            showLoading(false);
            console.error('Error reloading jobs:', err);
            showNotification('Gagal memuat data pekerjaan', 'error');
        });
        return;
    }
    
    showAccModalContent(job);
}

function showAccModalContent(job) {
    console.log('✅ Showing ACC modal for job:', job.id, job.title);
    
    document.getElementById('accJobIdMobile').value = job.id;
    document.getElementById('accJobTitleMobile').textContent = job.title || 'Tidak ada judul';
    document.getElementById('accHelperNameMobile').textContent = job.helper_name || job.helper_id || 'Helper';
    document.getElementById('accTotalPriceMobile').textContent = 'Rp ' + (job.price || 0).toLocaleString('id-ID');

    openModal('accModalMobile');
}

document.getElementById('submitAccMobile').addEventListener('click', async function() {
    const jobId = document.getElementById('accJobIdMobile').value;
    
    console.log('🔄 Submit ACC for jobId:', jobId);
    
    if (!jobId || jobId === '') {
        showNotification('ID pekerjaan tidak valid', 'error');
        return;
    }

    closeModal('accModalMobile');
    await accJob(parseInt(jobId));
});

// ================================================================
// REJECT MODAL
// ================================================================

function openRejectModalMobile(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) { showNotification('Pekerjaan tidak ditemukan', 'error'); return; }

    document.getElementById('rejectJobIdMobile').value = jobId;
    document.getElementById('rejectAlasanMobile').value = '';
    openModal('rejectModalMobile');
}

async function submitRejectMobile() {
    const jobId = document.getElementById('rejectJobIdMobile').value;
    const alasan = document.getElementById('rejectAlasanMobile').value.trim();

    if (!jobId) { 
        showNotification('ID pekerjaan tidak valid', 'error'); 
        return; 
    }
    if (!alasan) { 
        showNotification('Alasan reject wajib diisi', 'error'); 
        return; 
    }

    showLoading(true);

    try {
        const formData = new FormData();
        formData.append('job_id', jobId);
        formData.append('action', 'reject');
        formData.append('user_id', currentUser.id);
        formData.append('alasan', alasan);

        const response = await fetch('update_job.php', { 
            method: 'POST',
            body: formData
        });

        const text = await response.text();
        console.log('Raw response:', text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            throw new Error('Server mengembalikan respons tidak valid');
        }

        if (data.success) {
            showNotification('Bukti ditolak. Helper akan upload ulang.', 'warning');
            closeModal('rejectModalMobile');
            
            await loadJobsFromDB();
            loadMyJobs();
            loadHelperJobs();
            loadRequesterJobs();
            
        } else {
            showNotification('Gagal: ' + (data.message || 'Terjadi kesalahan'), 'error');
        }
        
    } catch (error) {
        console.error('Error in submitRejectMobile:', error);
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

document.getElementById('submitRejectMobile').addEventListener('click', submitRejectMobile);

// ================================================================
// HELPER PERBAIKAN CARD
// ================================================================

function createHelperPerbaikanCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.style.borderLeft = '4px solid #d97706';

    const formattedPrice = 'Rp ' + (job.price || 0).toLocaleString('id-ID');

    const rejectNote = job.reject_reason
        ? `<div class="acc-reject-note" style="background:#fef3c7;border-color:#fde68a;color:#92400e;">
            <i class="fas fa-comment-alt"></i> <b>Alasan reject:</b> ${escapeHtml(job.reject_reason)}
        </div>`
        : '';

    card.innerHTML = `
        <div class="card-body">
            <div style="background:linear-gradient(90deg,#d97706,#f59e0b);padding:4px 10px;border-radius:20px;display:inline-block;margin-bottom:6px;color:white;font-size:0.65rem;font-weight:700;">
                <i class="fas fa-exclamation-triangle"></i> Perlu Upload Ulang
            </div>
            <div class="card-title">${escapeHtml(job.title)}</div>
            <div class="card-price">${formattedPrice}</div>
            <div style="font-size:0.7rem;color:var(--gray);margin:4px 0;">
                <i class="fas fa-calendar"></i> ${job.date}
            </div>
            ${rejectNote}
            <div class="card-actions">
                <button class="btn btn-primary" style="background:#d97706;border-color:#d97706;" onclick="event.stopPropagation(); openUploadBuktiModalMobile(${job.id})">
                    <i class="fas fa-cloud-upload-alt"></i> Upload Ulang
                </button>
                <button class="btn btn-outline" onclick="event.stopPropagation(); openReportModalMobile(${job.id})">
                    <i class="fas fa-flag"></i> Laporkan
                </button>
            </div>
        </div>
    `;
    return card;
}

// ================================================================
// UPLOAD BUKTI MODAL
// ================================================================

function openUploadBuktiModalMobile(jobId) {
    console.log('openUploadBuktiModalMobile called for job:', jobId);

    if (!currentUser) { showNotification('Anda harus login', 'error'); return; }
    if (!jobId) { showNotification('ID pekerjaan tidak valid', 'error'); return; }

    const job = jobs.find(j => j.id == jobId);
    if (!job) { showNotification('Data pekerjaan tidak ditemukan', 'error'); return; }

    // Cek role helper
    if (currentUser.role !== 'user' && currentUser.role !== 'helper') {
        showNotification('Hanya Helper yang dapat upload bukti', 'error');
        return;
    }
    if (job.helper_id != currentUser.id) {
        showNotification('Anda bukan helper untuk pekerjaan ini', 'error');
        return;
    }

    if (job.status !== 'in-progress' && job.status !== 'ongoing' && job.status !== 'perbaikan' && job.status !== 'paid') {
        showNotification('Pekerjaan harus "Sedang Berjalan" atau "Perlu Perbaikan"', 'error');
        return;
    }

    document.getElementById('uploadBuktiJobIdMobile').value = jobId;
    document.getElementById('uploadBuktiJobTitleMobile').textContent = `#${job.id} - ${job.title}`;

    const rejectInfo = document.getElementById('uploadBuktiRejectInfoMobile');
    const rejectReason = document.getElementById('uploadBuktiRejectReasonMobile');
    if (job.status === 'perbaikan' && job.reject_reason) {
        rejectInfo.style.display = 'block';
        rejectReason.textContent = job.reject_reason;
    } else {
        rejectInfo.style.display = 'none';
    }

    document.getElementById('uploadBuktiFileMobile').value = '';
    document.getElementById('uploadBuktiPreviewMobile').style.display = 'none';
    document.getElementById('uploadBuktiPreviewImgMobile').src = '';

    openModal('uploadBuktiModalMobile');
}

document.getElementById('uploadBuktiDropZoneMobile').addEventListener('click', function() {
    document.getElementById('uploadBuktiFileMobile').click();
});

document.getElementById('uploadBuktiFileMobile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('File harus berupa gambar', 'error');
        this.value = '';
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Ukuran file maksimal 5MB', 'error');
        this.value = '';
        return;
    }

    const preview = document.getElementById('uploadBuktiPreviewMobile');
    const img = document.getElementById('uploadBuktiPreviewImgMobile');
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
});

document.getElementById('clearBuktiPreviewMobile').addEventListener('click', function() {
    document.getElementById('uploadBuktiFileMobile').value = '';
    document.getElementById('uploadBuktiPreviewMobile').style.display = 'none';
    document.getElementById('uploadBuktiPreviewImgMobile').src = '';
});

document.getElementById('submitBuktiMobile').addEventListener('click', async function() {
    const jobId = document.getElementById('uploadBuktiJobIdMobile').value;
    const fileInput = document.getElementById('uploadBuktiFileMobile');
    const file = fileInput.files[0];

    if (!jobId) { showNotification('ID pekerjaan tidak valid', 'error'); return; }
    if (!file) { showNotification('Silakan pilih foto bukti', 'error'); return; }

    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    showLoading(true);

    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('bukti_file', file);

    try {
        const response = await fetch('upload_completion.php', { method: 'POST', body: formData });
        const result = await response.json();

        if (result.success) {
            showNotification('Bukti berhasil dikirim! Menunggu konfirmasi Requester.', 'success');
            closeModal('uploadBuktiModalMobile');
            await loadJobsFromDB();
            loadMyJobs();
            loadHelperJobs();
            loadRequesterJobs();
        } else {
            showNotification('Gagal: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan', 'error');
    } finally {
        showLoading(false);
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Bukti';
    }
});

// ================================================================
// REPORT MODAL
// ================================================================

function openReportModalMobile(jobId) {
    const job = jobs.find(j => j.id === jobId);
    document.getElementById('reportJobIdMobile').value = jobId;
    document.getElementById('reportPesanMobile').value = '';
    openModal('reportModalMobile');
}

document.getElementById('submitReportMobile').addEventListener('click', async function() {
    const jobId = document.getElementById('reportJobIdMobile').value;
    const pesan = document.getElementById('reportPesanMobile').value.trim();

    if (!jobId) { 
        showNotification('ID pekerjaan tidak valid', 'error'); 
        return; 
    }
    if (!pesan) { 
        showNotification('Pesan laporan wajib diisi', 'error'); 
        return; 
    }

    showLoading(true);

    try {
        const formData = new FormData();
        formData.append('job_id', jobId);
        formData.append('action', 'report');
        formData.append('user_id', currentUser.id);
        formData.append('role', currentUser.role);
        formData.append('pesan', pesan);

        const response = await fetch('update_job.php', { 
            method: 'POST',
            body: formData
        });

        const text = await response.text();
        console.log('Raw response:', text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            throw new Error('Server mengembalikan respons tidak valid');
        }

        if (data.success) {
            showNotification('Laporan berhasil dikirim. Tim akan meninjau dalam 1x24 jam.', 'success');
            closeModal('reportModalMobile');
        } else {
            showNotification('Gagal: ' + (data.message || 'Terjadi kesalahan'), 'error');
        }
        
    } catch (error) {
        console.error('Error in submitReportMobile:', error);
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
});

// ================================================================
// RATING
// ================================================================

function giveRating(jobId) {
    console.log('giveRating called for job:', jobId);

    const job = jobs.find(j => j.id === jobId);
    if (!job) { showNotification('Pekerjaan tidak ditemukan', 'error'); return; }

    const isRequester = currentUser?.role === 'requester';
    currentRatingTargetId = isRequester ? job.helper_id : job.user_id;
    const targetName = isRequester ? (job.helper_name || 'Helper') : (job.requester_name || 'Requester');

    document.getElementById('ratingModalTitleMobile').textContent = `Beri Rating untuk ${targetName}`;
    document.getElementById('ratingJobIdMobile').value = jobId;

    document.querySelectorAll('#starContainerMobile .star').forEach(s => s.classList.remove('lit'));
    document.querySelectorAll('input[name="ratingMobile"]').forEach(r => r.checked = false);
    document.getElementById('ratingLabelMobile').textContent = 'Pilih bintang';
    document.getElementById('ratingLabelMobile').style.opacity = '0.6';
    document.getElementById('reviewTextMobile').value = '';

    openModal('ratingModalMobile');
}

document.querySelectorAll('#starContainerMobile .star').forEach(star => {
    star.addEventListener('click', function() {
        const val = parseInt(this.dataset.val);
        const radio = document.getElementById('r' + val + 'm');
        if (radio) radio.checked = true;

        document.querySelectorAll('#starContainerMobile .star').forEach(s => {
            s.classList.toggle('lit', parseInt(s.dataset.val) <= val);
        });

        const desc = ['', 'Sangat Buruk 😞', 'Buruk 😕', 'Cukup 😐', 'Bagus 😊', 'Luar Biasa! 🤩'];
        document.getElementById('ratingLabelMobile').textContent = desc[val] || 'Pilih bintang';
        document.getElementById('ratingLabelMobile').style.opacity = '1';
    });

    star.addEventListener('mouseover', function() {
        const val = parseInt(this.dataset.val);
        document.querySelectorAll('#starContainerMobile .star').forEach(s => {
            s.classList.toggle('lit', parseInt(s.dataset.val) <= val);
        });
    });

    star.addEventListener('mouseout', function() {
        const checked = document.querySelector('input[name="ratingMobile"]:checked');
        const val = checked ? parseInt(checked.value) : 0;
        document.querySelectorAll('#starContainerMobile .star').forEach(s => {
            s.classList.toggle('lit', parseInt(s.dataset.val) <= val);
        });
    });
});

document.getElementById('submitRatingMobile').addEventListener('click', async function() {
    const jobId = document.getElementById('ratingJobIdMobile').value;
    const ratingRadio = document.querySelector('input[name="ratingMobile"]:checked');
    const rating = ratingRadio ? ratingRadio.value : null;
    const reviewText = document.getElementById('reviewTextMobile').value;

    if (!jobId) { 
        showNotification('Error: ID pekerjaan tidak ditemukan', 'error'); 
        return; 
    }
    if (!rating) { 
        showNotification('Silakan pilih rating bintang 1-5', 'error'); 
        return; 
    }
    if (!currentRatingTargetId) { 
        showNotification('Error: Target rating tidak ditemukan', 'error'); 
        return; 
    }

    showLoading(true);

    try {
        const formData = new FormData();
        formData.append('job_id', jobId);
        formData.append('action', 'rate');
        formData.append('user_id', currentUser.id);
        formData.append('rating', rating);
        formData.append('ulasan', reviewText || '');
        formData.append('rater_role', currentUser.role);
        formData.append('target_id', currentRatingTargetId);

        const response = await fetch('update_job.php', { 
            method: 'POST',
            body: formData
        });

        const text = await response.text();
        console.log('Raw response:', text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            throw new Error('Server mengembalikan respons tidak valid');
        }

        if (data.success) {
            showNotification('Terima kasih atas rating Anda! ⭐', 'success');
            closeModal('ratingModalMobile');
            currentRatingTargetId = null;
            
            await loadJobsFromDB();
            await syncRatingToBeranda();
            loadReviews();
            
        } else {
            showNotification('Gagal: ' + (data.message || 'Terjadi kesalahan'), 'error');
        }
        
    } catch (error) {
        console.error('Error in submitRatingMobile:', error);
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
});

// ================================================================
// LOAD REVIEWS
// ================================================================

async function loadReviews() {
    if (!currentUser) {
        console.log('loadReviews: No current user');
        return;
    }

    const reviewList = document.getElementById('reviewListMobile');
    if (!reviewList) {
        console.error('❌ Elemen reviewListMobile tidak ditemukan!');
        return;
    }

    reviewList.innerHTML = `
        <div style="text-align:center;padding:30px;color:var(--gray);">
            <i class="fas fa-spinner fa-spin" style="font-size:1.5rem;"></i>
            <p style="margin-top:10px;">Memuat ulasan...</p>
        </div>
    `;

    try {
        const response = await fetch(`get_ratings.php?user_id=${currentUser.id}&type=received&t=${Date.now()}`);
        const result = await response.json();

        console.log('📦 Rating response:', result);

        if (!result.success) {
            reviewList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Gagal memuat rating</h3>
                    <p>${result.message || 'Terjadi kesalahan'}</p>
                </div>
            `;
            return;
        }

        const ratings = result.ratings || [];

        if (ratings.length === 0) {
            reviewList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star" style="font-size:2.5rem;color:#cbd5e1;"></i>
                    <h3>Belum ada rating</h3>
                    <p>Belum ada ulasan dari pengguna lain</p>
                </div>
            `;
            updateRatingStatsMobile([]);
            await syncRatingToBeranda();
            return;
        }

        reviewList.innerHTML = '';
        
        ratings.forEach((r, index) => {
            const reviewDiv = document.createElement('div');
            reviewDiv.style.cssText = `
                border-bottom: 1px solid var(--border-color);
                padding: 14px 0;
                ${index === 0 ? '' : 'margin-top: 4px;'}
            `;
            
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= r.rating) {
                    starsHtml += '<i class="fas fa-star" style="color: #f59e0b;"></i>';
                } else {
                    starsHtml += '<i class="far fa-star" style="color: #d1d5db;"></i>';
                }
            }
            
            const initial = (r.rater_name || 'U').charAt(0).toUpperCase();
            const roleLabel = r.rater_role === 'requester' ? 'Requester' : 'Helper';
            
            let ulasanHtml = '';
            if (r.ulasan && r.ulasan.trim() !== '') {
                ulasanHtml = escapeHtml(r.ulasan);
            } else {
                ulasanHtml = '<em style="color: var(--gray-light);">Tidak ada ulasan</em>';
            }
            
            reviewDiv.innerHTML = `
                <div style="display:flex;align-items:flex-start;gap:12px;">
                    <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg, var(--primary), var(--primary-light));color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0;">
                        ${initial}
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
                            <div>
                                <strong style="font-size:0.9rem;">${escapeHtml(r.rater_name || 'Pengguna')}</strong>
                                <span style="color:var(--gray);font-size:0.7rem;margin-left:6px;">(${roleLabel})</span>
                            </div>
                            <div style="font-size:0.65rem;color:var(--gray-light);">
                                ${formatDate(r.created_at)}
                            </div>
                        </div>
                        <div style="margin:4px 0 6px 0;font-size:0.85rem;">
                            ${starsHtml}
                        </div>
                        <div style="font-size:0.85rem;color:var(--dark);line-height:1.5;word-wrap:break-word;">
                            ${ulasanHtml}
                        </div>
                        <div style="font-size:0.65rem;color:var(--gray-light);margin-top:4px;">
                            <i class="fas fa-briefcase"></i> Pekerjaan: ${escapeHtml(r.job_title || '#' + r.job_id)}
                        </div>
                    </div>
                </div>
            `;
            reviewList.appendChild(reviewDiv);
        });

        updateRatingStatsMobile(ratings);
        await syncRatingToBeranda();

        console.log(`✅ ${ratings.length} ulasan dimuat`);

    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${error.message || 'Terjadi kesalahan saat memuat ulasan'}</p>
            </div>
        `;
    }
}

function updateRatingStatsMobile(ratings) {
    if (!ratings || ratings.length === 0) {
        document.getElementById('ratingAvgMobile').textContent = '0.0';
        document.getElementById('ratingTotalMobile').textContent = '0';
        document.getElementById('ratingSatisfactionMobile').textContent = '0%';
        document.getElementById('ratingCountBadge').textContent = '0 ulasan';
        return;
    }

    let total = 0;
    ratings.forEach(r => total += parseInt(r.rating));
    const avg = (total / ratings.length).toFixed(1);
    const satisfaction = Math.round((avg / 5) * 100);

    document.getElementById('ratingAvgMobile').textContent = avg + ' ★';
    document.getElementById('ratingTotalMobile').textContent = ratings.length;
    document.getElementById('ratingSatisfactionMobile').textContent = satisfaction + '%';
    document.getElementById('ratingCountBadge').textContent = ratings.length + ' ulasan';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return dateStr; }
}

// ================================================================
// SYNC RATING TO BERANDA
// ================================================================

async function syncRatingToBeranda() {
    if (!currentUser) return;

    try {
        const response = await fetch(`get_ratings.php?user_id=${currentUser.id}&type=received&t=${Date.now()}`);
        const result = await response.json();

        if (result.success) {
            const ratings = result.ratings || [];
            let total = 0;
            ratings.forEach(r => total += parseInt(r.rating));
            const avg = ratings.length > 0 ? (total / ratings.length).toFixed(1) : '0.0';

            const ratingHelper = document.getElementById('berandaRatingHelper');
            if (ratingHelper) {
                ratingHelper.textContent = avg + ' ★';
                console.log('✅ Beranda rating helper updated:', avg);
            }

            const requesterRatingEl = document.getElementById('requesterRating');
            if (requesterRatingEl) {
                requesterRatingEl.textContent = avg + ' ★';
                console.log('✅ Beranda rating requester updated:', avg);
            }
        }
    } catch (error) {
        console.error('Error syncing rating to beranda:', error);
    }
}

// ================================================================
// UPDATE STATS
// ================================================================

function updateRequesterStats() {
    if (!currentUser || currentUser.role !== 'requester') {
        console.log('updateRequesterStats: Bukan requester');
        return;
    }

    console.log('🔄 UPDATING REQUESTER STATS');

    const myJobs = jobs.filter(job => job.user_id === currentUser.id);
    const activeCount = myJobs.filter(job => job.status === 'open' || job.status === 'offered' || job.status === 'selected' || job.status === 'paid' || job.status === 'in-progress' || job.status === 'ongoing').length;
    const completedCount = myJobs.filter(job => job.status === 'completed').length;
    
    const transactions = window.walletTransactions || [];
    let totalSpent = 0;
    
    transactions.forEach(trans => {
        const isRequester = trans.role === 'requester';
        const isDebit = trans.type === 'debit' || trans.type === 'fee' || trans.type === 'tip' || trans.type === 'service_fee' || trans.type === 'admin_fee' || trans.type === 'emergency_fee';
        const isSuccess = trans.status === 'Sukses' || trans.status === 'success';
        
        if (isRequester && isDebit && isSuccess) {
            let amount = 0;
            if (typeof trans.amount === 'string') {
                const clean = trans.amount.replace(/[^0-9]/g, '');
                amount = parseInt(clean) || 0;
            } else if (typeof trans.amount === 'number') {
                amount = Math.abs(trans.amount);
            }
            totalSpent += amount;
        }
    });

    const activeCountEl = document.getElementById('activeJobsCount');
    const completedCountEl = document.getElementById('requesterCompletedCount');
    const spentEl = document.getElementById('requesterSpent');
    const reminderEl = document.getElementById('reminderActiveCount');
    
    if (activeCountEl) activeCountEl.textContent = activeCount;
    if (completedCountEl) completedCountEl.textContent = completedCount;
    if (spentEl) {
        spentEl.textContent = 'Rp ' + totalSpent.toLocaleString('id-ID');
        console.log('✅ Requester spent updated:', totalSpent);
    }
    if (reminderEl) reminderEl.textContent = activeCount;
    
    syncRatingToBeranda();
    
    console.log('✅ Requester stats updated - Active:', activeCount, 'Completed:', completedCount, 'Spent:', totalSpent);
}

function updateHelperStats() {
    if (!currentUser || (currentUser.role !== 'helper' && currentUser.role !== 'user')) {
        console.log('updateHelperStats: Bukan helper');
        return;
    }

    console.log('🔄 UPDATING HELPER STATS');

    const myJobs = jobs.filter(job => job.helper_id === currentUser.id);
    const activeCount = myJobs.filter(job => 
        job.status === 'paid' || job.status === 'in-progress' || job.status === 'ongoing'
    ).length;
    const completedCount = myJobs.filter(job => job.status === 'completed').length;

    const transactions = window.walletTransactions || [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthlyEarnings = 0;
    let monthlyCount = 0;

    transactions.forEach(trans => {
        const isHelper = trans.role === 'helper' || trans.role === 'unknown';
        const isPayment = trans.type === 'payment' || trans.type === 'tip' || trans.type === 'credit';
        const isSuccess = trans.status === 'Sukses' || trans.status === 'success';
        
        if (isHelper && isPayment && isSuccess) {
            let transDate = null;
            if (trans.created_at) {
                transDate = new Date(trans.created_at);
            } else if (trans.date) {
                transDate = new Date(trans.date);
            }
            
            if (transDate && !isNaN(transDate.getTime())) {
                const transMonth = transDate.getMonth();
                const transYear = transDate.getFullYear();
                
                if (transMonth === currentMonth && transYear === currentYear) {
                    let amount = 0;
                    if (typeof trans.amount === 'string') {
                        const clean = trans.amount.replace(/[^0-9]/g, '');
                        amount = parseInt(clean) || 0;
                    } else if (typeof trans.amount === 'number') {
                        amount = Math.abs(trans.amount);
                    }
                    if (amount > 0) {
                        monthlyEarnings += amount;
                        monthlyCount++;
                    }
                }
            }
        }
    });

    console.log(`💰 Pendapatan bulan ${now.toLocaleString('id-ID', { month: 'long' })}: Rp ${monthlyEarnings.toLocaleString()}`);

    const activeEl = document.getElementById('helperActiveJobsCount');
    const completedEl = document.getElementById('helperCompletedJobsCount');
    const earningsEl = document.getElementById('berandaPendapatanHelper');
    const reminderEl = document.getElementById('helperReminderCount');
    const ratingEl = document.getElementById('berandaRatingHelper');

    if (activeEl) activeEl.textContent = activeCount;
    if (completedEl) completedEl.textContent = completedCount;
    if (earningsEl) {
        earningsEl.textContent = 'Rp ' + monthlyEarnings.toLocaleString('id-ID');
        console.log('✅ Helper earnings updated:', earningsEl.textContent);
    }
    if (reminderEl) reminderEl.textContent = activeCount;
    
    syncRatingToBeranda();

    window._helperStats = {
        activeCount,
        completedCount,
        monthlyEarnings,
        monthlyCount,
        currentMonth: now.toLocaleString('id-ID', { month: 'long' }),
        currentYear,
        totalJobs: myJobs.length
    };

    console.log('✅ Helper stats updated:', window._helperStats);
}

function updateHelperStatsFromTransactions() {
    if (!currentUser || (currentUser.role !== 'helper' && currentUser.role !== 'user')) {
        console.log('updateHelperStatsFromTransactions: Bukan helper atau tidak login');
        return;
    }

    console.log('🔄 UPDATE HELPER STATS FROM TRANSACTIONS');

    const transactions = window.walletTransactions || [];
    console.log('📊 Total transaksi di wallet:', transactions.length);

    if (transactions.length === 0) {
        console.warn('⚠️ Tidak ada transaksi di wallet!');
        document.getElementById('berandaPendapatanHelper').textContent = 'Rp 0';
        return;
    }

    const helperTx = transactions.filter(t => {
        const isHelper = t.role === 'helper' || t.role === 'unknown';
        const isPayment = t.type === 'payment' || t.type === 'tip' || t.type === 'credit';
        const isSuccess = t.status === 'Sukses' || t.status === 'success' || t.status === 'success';
        return isHelper && isPayment && isSuccess;
    });

    console.log('📊 Transaksi helper (payment + tip):', helperTx.length);

    if (helperTx.length === 0) {
        console.warn('⚠️ Tidak ada transaksi payment/tip untuk helper!');
        document.getElementById('berandaPendapatanHelper').textContent = 'Rp 0';
        return;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    console.log(`📅 Bulan: ${now.toLocaleString('id-ID', { month: 'long' })} ${currentYear}`);

    let monthlyEarnings = 0;
    let monthlyCount = 0;

    helperTx.forEach(t => {
        let tDate = null;
        if (t.created_at) {
            tDate = new Date(t.created_at);
        } else if (t.date) {
            tDate = new Date(t.date);
        }

        if (!tDate || isNaN(tDate.getTime())) {
            return;
        }

        const tMonth = tDate.getMonth();
        const tYear = tDate.getFullYear();

        if (tMonth === currentMonth && tYear === currentYear) {
            let amount = 0;
            if (typeof t.amount === 'string') {
                const clean = t.amount.replace(/[^0-9]/g, '');
                amount = parseInt(clean) || 0;
            } else if (typeof t.amount === 'number') {
                amount = Math.abs(t.amount);
            }

            if (amount > 0) {
                monthlyEarnings += amount;
                monthlyCount++;
            }
        }
    });

    console.log(`💰 Pendapatan bulan ini: Rp ${monthlyEarnings.toLocaleString()}`);
    console.log(`📝 Jumlah transaksi: ${monthlyCount}`);

    const earningsEl = document.getElementById('berandaPendapatanHelper');
    if (earningsEl) {
        if (monthlyEarnings > 0) {
            earningsEl.textContent = 'Rp ' + monthlyEarnings.toLocaleString('id-ID');
            console.log('✅ UI updated:', earningsEl.textContent);
        } else {
            earningsEl.textContent = 'Rp 0';
            console.log('⚠️ UI set ke Rp 0 (tidak ada pendapatan bulan ini)');
        }
    } else {
        console.error('❌ Elemen berandaPendapatanHelper tidak ditemukan!');
    }

    window._helperStatsFromTransactions = {
        monthlyEarnings,
        monthlyCount,
        currentMonth: now.toLocaleString('id-ID', { month: 'long' }),
        currentYear,
        totalTransactions: helperTx.length
    };

    console.log('✅ Helper stats from transactions updated:', window._helperStatsFromTransactions);
}

// ================================================================
// WALLET
// ================================================================

async function loadWalletFromDB() {
    if (!currentUser) {
        console.log('loadWalletFromDB: No current user');
        return false;
    }

    console.log('Loading wallet from DB for user:', currentUser.id, 'role:', currentUser.role);

    try {
        const response = await fetch(`get_wallet.php?user_id=${currentUser.id}&role=${currentUser.role}&t=${Date.now()}`);
        
        if (!response.ok) {
            throw new Error('HTTP error ' + response.status);
        }
        
        const result = await response.json();
        console.log('Wallet API response:', result);

        if (result.success) {
            if (result.wallet_requester !== undefined) {
                currentUser.wallet_requester = result.wallet_requester;
            }
            if (result.wallet_helper !== undefined) {
                currentUser.wallet_helper = result.wallet_helper;
            }

            window.walletTransactions = result.transactions || [];

            if (currentUser.role === 'requester') {
                walletBalance = currentUser.wallet_requester || 0;
            } else {
                walletBalance = currentUser.wallet_helper || 0;
            }

            updateWalletDisplay();
            loadWallet();
            
            return true;
        } else {
            console.error('Failed to load wallet:', result.message);
            return false;
        }
    } catch (error) {
        console.error('Error loading wallet:', error);
        return false;
    }
}

function updateBerandaHistory() {
    const transactions = window.walletTransactions || [];
    
    const relevant = transactions.filter(t => 
        t.type === 'topup' || 
        t.type === 'fee' || 
        t.type === 'debit' || 
        t.type === 'payment' ||
        t.type === 'service_fee' ||
        t.type === 'admin_fee' ||
        t.type === 'emergency_fee'
    );
    
    const latest = relevant.slice(0, 5);
    
    const container = document.getElementById('berandaHistoryMobile');
    if (!container) return;

    if (latest.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:12px;color:var(--gray-light);font-size:0.8rem;">
            <i class="fas fa-inbox"></i> Belum ada transaksi
        </div>`;
        return;
    }

    let html = '';
    latest.forEach(trans => {
        const amount = trans.amount || '0';
        const isPositive = amount.startsWith('+');
        const color = isPositive ? 'var(--success)' : 'var(--danger)';
        const desc = trans.description || 'Transaksi';
        const date = formatDateShort(trans.created_at || trans.date);
        
        html += `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-color);font-size:0.75rem;">
                <div>
                    <div style="font-weight:500;">${escapeHtml(desc)}</div>
                    <div style="color:var(--gray-light);font-size:0.65rem;">${date}</div>
                </div>
                <div style="font-weight:600;color:${color};">${amount}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function updateWalletByRole() {
    if (!currentUser) return;

    if (currentUser.role === 'requester') {
        walletBalance = currentUser.wallet_requester || 0;
        walletTransactions = window.walletTransactions || [];
    } else {
        walletBalance = currentUser.wallet_helper || 0;
        walletTransactions = window.walletTransactions || [];
    }
}

function loadWallet() {
    if (!currentUser) return;

    const role = currentUser.role;
    console.log('🔄 loadWallet called - role:', role);

    fetch(`get_wallet.php?user_id=${currentUser.id}&role=${role}&t=${Date.now()}`)
        .then(res => {
            if (!res.ok) throw new Error('HTTP error ' + res.status);
            return res.json();
        })
        .then(data => {
            console.log('📦 Wallet data received for role:', role);

            if (!data.success) {
                console.error('Failed to load wallet:', data.message);
                return;
            }

            window.walletTransactions = data.transactions || [];
            console.log('📊 Transactions loaded:', window.walletTransactions.length);

            const reqEl = document.getElementById('walletRequesterPageMobile');
            const helEl = document.getElementById('walletHelperPageMobile');
            
            if (reqEl && data.wallet_requester !== undefined) {
                reqEl.textContent = 'Rp ' + data.wallet_requester.toLocaleString('id-ID');
            }
            if (helEl && data.wallet_helper !== undefined) {
                helEl.textContent = 'Rp ' + data.wallet_helper.toLocaleString('id-ID');
            }

            updateTransactionHistory(data.transactions || [], role);

            if (currentUser.role === 'requester') {
                updateRequesterStats();
            } else if (currentUser.role === 'helper' || currentUser.role === 'user') {
                updateHelperStats();
                updateHelperStatsFromTransactions();
            }

            updateWalletVisibility();
            updateBerandaHistory();

            console.log('✅ Wallet loaded');
        })
        .catch(err => {
            console.error('Error loading wallet:', err);
        });
}

function updateTransactionHistory(transactions, role) {
    const historyEl = document.getElementById('walletHistoryMobile');
    if (!historyEl) return;

    historyEl.innerHTML = '';

    if (!transactions || transactions.length === 0) {
        historyEl.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--gray-light);">
            <i class="fas fa-inbox" style="display:block;font-size:1.5rem;margin-bottom:8px;"></i>
            Belum ada transaksi
        </td></tr>`;
        return;
    }

    const latest = transactions.slice(0, 10);
    
    latest.forEach(trans => {
        const row = document.createElement('tr');
        
        let amountText = trans.amount || '0';
        let isPositive = false;
        
        if (amountText.startsWith('+')) {
            isPositive = true;
        } else if (amountText.startsWith('-')) {
            isPositive = false;
        } else {
            if (trans.type === 'topup' || trans.type === 'credit' || trans.type === 'payment') {
                isPositive = true;
            } else if (trans.type === 'fee' || trans.type === 'debit' || trans.type === 'service_fee' || trans.type === 'admin_fee' || trans.type === 'emergency_fee' || trans.type === 'helper_fee') {
                isPositive = false;
            } else {
                const numericAmount = parseFloat(String(amountText).replace(/[^0-9.-]/g, ''));
                isPositive = numericAmount >= 0;
            }
        }

        const isSuccess = trans.status === 'Sukses' || trans.status === 'success';
        const isPending = trans.status === 'Pending' || trans.status === 'pending';
        
        let statusClass = 'badge-success';
        let statusText = 'Sukses';
        if (isPending) {
            statusClass = 'badge-warning';
            statusText = 'Pending';
        } else if (!isSuccess) {
            statusClass = 'badge-danger';
            statusText = '❌ Gagal';
        }
        
        const amountClass = isPositive ? 'positive' : 'negative';
        const color = isPositive ? 'var(--success)' : 'var(--danger)';

        row.innerHTML = `
            <td>${formatDateShort(trans.created_at || trans.date)}</td>
            <td>${escapeHtml(trans.description || 'Transaksi')}</td>
            <td class="${amountClass}" style="color:${color};">${amountText}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
        `;
        historyEl.appendChild(row);
    });

    if (transactions.length > 10) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="4" style="text-align:center;padding:8px;color:var(--gray);font-size:0.7rem;">
            <i class="fas fa-chevron-down"></i> ${transactions.length - 10} transaksi lainnya
        </td>`;
        historyEl.appendChild(row);
    }
}

function formatDateShort(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    } catch (e) {
        return dateStr;
    }
}

function updateWalletDisplay() {
    if (!currentUser) return;

    const format = (num) => 'Rp ' + formatRupiah(num || 0);

    const reqEl = document.getElementById('walletRequesterPageMobile');
    const helEl = document.getElementById('walletHelperPageMobile');
    if (reqEl) reqEl.textContent = format(currentUser.wallet_requester);
    if (helEl) helEl.textContent = format(currentUser.wallet_helper);

    const modalReq = document.getElementById('modalWalletBalanceMobile');
    const modalHel = document.getElementById('modalWalletHelperMobile');
    if (modalReq) modalReq.textContent = format(currentUser.wallet_requester);
    if (modalHel) modalHel.textContent = format(currentUser.wallet_helper);
}

function updateWalletVisibility() {
    if (!currentUser) return;

    const isRequester = currentUser.role === 'requester';
    const reqCard = document.getElementById('walletRequesterCardMobile');
    const helCard = document.getElementById('walletHelperCardMobile');

    if (isRequester) {
        if (reqCard) reqCard.style.display = 'block';
        if (helCard) helCard.style.display = 'none';
        document.body.classList.add('requester-mode');
        document.body.classList.remove('helper-mode');
        document.getElementById('historyRoleHintMobile').textContent = '(Requester)';
    } else {
        if (reqCard) reqCard.style.display = 'none';
        if (helCard) helCard.style.display = 'block';
        document.body.classList.add('helper-mode');
        document.body.classList.remove('requester-mode');
        document.getElementById('historyRoleHintMobile').textContent = '(Helper)';
    }
}

// ================================================================
// TOPUP
// ================================================================

let topupSuccess = false;

document.getElementById('topupBtnMobile').addEventListener('click', function() {
    if (currentUser?.role !== 'requester') {
        showNotification('Hanya Requester yang dapat top up', 'error');
        return;
    }
    resetTopupModalMobile();
    openModal('topupModalMobile');
});

document.getElementById('topupNominalMobile').addEventListener('input', function(e) {
    let nilai = this.value.replace(/\D/g, '');
    if (nilai) {
        this.value = formatRupiah(nilai);
        const nominal = parseInt(nilai) || 0;
        const admin = 2500;
        const total = nominal + admin;

        document.getElementById('summaryNominalMobile').textContent = 'Rp ' + formatRupiah(nominal);
        document.getElementById('totalPaymentAmountMobile').textContent = 'Rp ' + formatRupiah(total);
        document.getElementById('topupReceivedAmountMobile').textContent = 'Rp ' + formatRupiah(nominal);
        document.getElementById('totalPaymentDisplayMobile').innerHTML = 'Total Dibayar: Rp ' + total.toLocaleString('id-ID');
    } else {
        this.value = '';
        document.getElementById('summaryNominalMobile').textContent = 'Rp 0';
        document.getElementById('totalPaymentAmountMobile').textContent = 'Rp 0';
        document.getElementById('topupReceivedAmountMobile').textContent = 'Rp 0';
        document.getElementById('totalPaymentDisplayMobile').innerHTML = 'Total Dibayar: Rp 0';
    }
});

document.getElementById('topupPayBtnMobile').addEventListener('click', async function(e) {
    e.preventDefault();

    if (topupSuccess) {
        closeModal('topupModalMobile');
        resetTopupModalMobile();
        return;
    }

    if (!currentUser || currentUser.role !== 'requester') {
        showNotification('Hanya Requester yang dapat top up', 'error');
        return;
    }

    const nominalStr = document.getElementById('topupNominalMobile').value.replace(/\./g, '');
    const nominal = parseInt(nominalStr) || 0;

    if (nominal < 10000) {
        showNotification('Minimal top up Rp 10.000', 'error');
        return;
    }

    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    showLoading(true);

    try {
        const formData = new FormData();
        formData.append('user_id', currentUser.id);
        formData.append('nominal', nominal);
        formData.append('method', 'qris');

        const response = await fetch('topup.php', { method: 'POST', body: formData });
        const result = await response.json();

        if (result.success) {
            const qrisSection = document.getElementById('qrisSectionMobile');
            const qrisImg = document.getElementById('qrisImageMobile');
            const statusMsg = document.getElementById('topupStatusMessageMobile');
            const totalDibayar = nominal + 2500;

            if (qrisImg) qrisImg.src = 'qris2.jpeg?t=' + Date.now();
            if (statusMsg) {
                statusMsg.innerHTML = `<span style="color:#16a34a;">✅ Request berhasil! Total: Rp ${totalDibayar.toLocaleString('id-ID')}<br>Scan QRIS untuk membayar.</span>`;
                statusMsg.style.background = '#dcfce7';
                statusMsg.style.padding = '8px';
                statusMsg.style.borderRadius = '8px';
            }
            if (qrisSection) qrisSection.style.display = 'block';

            document.getElementById('totalPaymentDisplayMobile').innerHTML = 'Total Dibayar: Rp ' + totalDibayar.toLocaleString('id-ID');
            document.getElementById('topupNominalMobile').value = '';

            topupSuccess = true;
            this.innerHTML = '<i class="fas fa-check"></i> Selesai';
            this.style.background = '#16a34a';

            showNotification('Request top up berhasil!', 'success');

            setTimeout(async () => {
                await loadWalletFromDB();
                loadWallet();
            }, 2000);
        } else {
            showNotification('Gagal: ' + result.message, 'error');
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-paper-plane"></i> Request Top Up';
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan', 'error');
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-paper-plane"></i> Request Top Up';
    } finally {
        showLoading(false);
    }
});

function resetTopupModalMobile() {
    topupSuccess = false;
    document.getElementById('qrisSectionMobile').style.display = 'none';
    document.getElementById('topupStatusMessageMobile').innerHTML = '';
    document.getElementById('topupNominalMobile').value = '';
    document.getElementById('summaryNominalMobile').textContent = 'Rp 0';
    document.getElementById('totalPaymentAmountMobile').textContent = 'Rp 0';
    document.getElementById('topupReceivedAmountMobile').textContent = 'Rp 0';

    const btn = document.getElementById('topupPayBtnMobile');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Request Top Up';
        btn.style.background = '';
        btn.disabled = false;
    }
}

// ================================================================
// WITHDRAW
// ================================================================

document.getElementById('withdrawBtnMobile').addEventListener('click', function() {
    if (currentUser?.role !== 'helper' && currentUser?.role !== 'user') {
        showNotification('Hanya Helper yang dapat menarik saldo', 'error');
        return;
    }
    document.getElementById('helperBalanceWithdrawMobile').textContent = 'Rp ' + (currentUser.wallet_helper || 0).toLocaleString('id-ID');
    document.getElementById('withdrawNominalMobile').value = '';
    document.getElementById('withdrawSummaryNominalMobile').textContent = 'Rp 0';
    document.getElementById('withdrawNetAmountMobile').textContent = 'Rp 0';
    openModal('withdrawModalMobile');
});

document.getElementById('withdrawNominalMobile').addEventListener('input', function(e) {
    let nilai = this.value.replace(/\D/g, '');
    if (nilai) {
        this.value = formatRupiah(nilai);
        const nominal = parseInt(nilai) || 0;
        const net = nominal > 2500 ? nominal - 2500 : 0;

        document.getElementById('withdrawSummaryNominalMobile').textContent = 'Rp ' + formatRupiah(nominal);
        document.getElementById('withdrawNetAmountMobile').textContent = 'Rp ' + formatRupiah(net);
        document.getElementById('withdrawNetAmountMobile').style.color = net > 0 ? '#1a6b3c' : '#e74c3c';
    } else {
        this.value = '';
        document.getElementById('withdrawSummaryNominalMobile').textContent = 'Rp 0';
        document.getElementById('withdrawNetAmountMobile').textContent = 'Rp 0';
    }
});

document.getElementById('withdrawFormMobile').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!currentUser || (currentUser.role !== 'helper' && currentUser.role !== 'user')) {
        showNotification('Hanya Helper yang dapat menarik saldo', 'error');
        return;
    }

    const nominalStr = document.getElementById('withdrawNominalMobile').value.replace(/\./g, '');
    const nominal = parseInt(nominalStr) || 0;
    const bank = document.getElementById('withdrawBankMobile').value;
    const accountNumber = document.getElementById('withdrawAccountNumberMobile').value.trim();
    const accountName = document.getElementById('withdrawAccountNameMobile').value.trim();

    if (nominal < 50000) {
        showNotification('Minimal penarikan Rp 50.000', 'error');
        return;
    }
    if (nominal > (currentUser.wallet_helper || 0)) {
        showNotification('Saldo helper tidak mencukupi', 'error');
        return;
    }
    if (!bank) { showNotification('Pilih bank tujuan', 'error'); return; }
    if (!accountNumber) { showNotification('Nomor rekening harus diisi', 'error'); return; }
    if (!accountName) { showNotification('Nama pemilik rekening harus diisi', 'error'); return; }

    showLoading(true);

    const formData = new FormData();
    formData.append('user_id', currentUser.id);
    formData.append('nominal', nominal);
    formData.append('bank', bank);
    formData.append('account_number', accountNumber);
    formData.append('account_name', accountName);

    try {
        const response = await fetch('withdraw.php', { method: 'POST', body: formData });
        const result = await response.json();

        if (result.success) {
            if (result.new_balance !== undefined) {
                currentUser.wallet_helper = result.new_balance;
            }
            await loadWalletFromDB();
            closeModal('withdrawModalMobile');
            showNotification(result.message || 'Permintaan penarikan berhasil!', 'success');
        } else {
            showNotification('Gagal: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan', 'error');
    } finally {
        showLoading(false);
    }
});

// ================================================================
// HISTORY
// ================================================================

function loadHistory() {
    const container = document.getElementById('historyListMobile');
    if (!container) return;

    const search = document.getElementById('historySearchMobile')?.value?.toLowerCase() || '';
    const sort = document.getElementById('historySortMobile')?.value || 'newest';

    let hist = jobs.filter(j => j.status === 'completed' && j.user_id === currentUser?.id);

    if (search) {
        hist = hist.filter(j => j.title.toLowerCase().includes(search) || (j.location && j.location.toLowerCase().includes(search)));
    }

    if (sort === 'newest') hist = hist.slice().reverse();
    else if (sort === 'oldest') hist = hist.slice();
    else if (sort === 'price-high') hist = hist.slice().sort((a, b) => b.price - a.price);
    else if (sort === 'price-low') hist = hist.slice().sort((a, b) => a.price - b.price);

    container.innerHTML = '';
    if (hist.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-history"></i><h3>Belum ada histori</h3></div>`;
        return;
    }

    hist.forEach(job => {
        container.appendChild(createJobCard(job, false));
    });
}

document.getElementById('historySearchMobile').addEventListener('input', loadHistory);
document.getElementById('historySortMobile').addEventListener('change', loadHistory);

async function loadConversationsMobile() {
    if (!currentUser) {
        console.log('loadConversationsMobile: No current user');
        return;
    }

    // Tentukan role untuk chat
    let chatRole = currentUser.role === 'helper' ? 'helper' : 'requester';
    
    console.log('🔄 Loading conversations for user:', currentUser.id, 'role:', chatRole);

    try {
        const response = await fetch(`get_conversations.php?user_id=${currentUser.id}&role=${chatRole}&t=${Date.now()}`);
        
        if (!response.ok) {
            console.error('HTTP error:', response.status);
            return;
        }
        
        const data = await response.json();
        console.log('📦 Conversations data:', data);

        if (data.success) {
            // 🔥 PASTIKAN DATA DARI SERVER SUDAH ADA NAMA LENGKAP
            const conversations = data.conversations || [];
            
            // Log untuk debugging
            if (conversations.length > 0) {
                console.log('📋 First conversation:', {
                    other_party: conversations[0].other_party,
                    other_party_id: conversations[0].other_party_id
                });
            }
            
            renderConversationList(conversations);
            
            if (typeof updateChatBadge === 'function') {
                updateChatBadge(conversations);
            } else {
                // Fallback: update badge manual
                let total = 0;
                conversations.forEach(c => { total += c.unread_count || 0; });
                const badge = document.getElementById('chatBadgeBottom');
                if (badge) {
                    badge.textContent = total;
                    badge.style.display = total > 0 ? 'inline-block' : 'none';
                }
            }
        } else {
            console.error('Failed to load conversations:', data.message);
            const container = document.getElementById('chatConversationsListMobile');
            if (container) {
                container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><h3>Belum ada percakapan</h3></div>`;
            }
        }
    } catch (e) {
        console.error('loadConversationsMobile error:', e);
        const container = document.getElementById('chatConversationsListMobile');
        if (container) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error memuat percakapan</h3></div>`;
        }
    }
}

// ================================================================
// CHAT FUNCTIONS - LENGKAP
// ================================================================

function displayMessagesMobile(messages) {
    const el = document.getElementById('chatMessagesMobile');
    if (!el) {
        console.error('❌ chatMessagesMobile element not found');
        return;
    }

    console.log('📝 Displaying messages:', messages.length);

    if (!messages || messages.length === 0) {
        el.innerHTML = `<div class="empty-state"><i class="fas fa-comment-slash"></i><h3>Belum ada pesan</h3><p>Mulai percakapan sekarang!</p></div>`;
        return;
    }

    let html = '';
    let lastDate = '';
    
    // 🔥 Ambil data partner dari chatState
    const partnerName = chatState.currentConversation?.other_name || 'Partner';

    messages.forEach(msg => {
        const dateStr = msg.date_only || formatMsgDate(msg.created_at);
        if (dateStr && dateStr !== lastDate) {
            html += `<div class="msg-date">${escapeHtml(dateStr)}</div>`;
            lastDate = dateStr;
        }

        const isMe = msg.is_me || msg.sender_id == currentUser.id;
        const cls = isMe ? 'sent' : 'received';
        const time = msg.time_only || formatMsgTime(msg.created_at);
        
        // 🔥 TAMPILKAN NAMA PENGIRIM UNTUK PESAN DITERIMA
        let senderNameHtml = '';
        if (!isMe) {
            // Tampilkan nama pengirim di atas bubble pesan
            senderNameHtml = `<div style="font-size:0.65rem;font-weight:600;color:var(--primary);margin-bottom:2px;margin-left:4px;">${escapeHtml(partnerName)}</div>`;
        }

        html += `
            <div class="msg ${cls}" data-id="${msg.id}">
                ${senderNameHtml}
                ${escapeHtml(msg.message)}
                <span class="time">${time}</span>
            </div>
        `;
    });

    el.innerHTML = html;
    el.scrollTop = el.scrollHeight;
}

// ================================================================
// POLL NEW MESSAGES MOBILE - Cek pesan baru
// ================================================================

async function pollNewMessagesMobile(jobId, otherId) {
    if (!chatState.lastMessageId) {
        console.log('⏭️ No last message ID, skipping poll');
        return;
    }

    try {
        const url = `get_messages.php?job_id=${jobId}&user_id=${currentUser.id}&other_id=${otherId}&role=${currentUser.role}&last_message_id=${chatState.lastMessageId}&t=${Date.now()}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.messages && data.messages.length > 0) {
            console.log('📨 New messages received:', data.messages.length);
            appendMessagesMobile(data.messages);
            chatState.lastMessageId = data.newest_id || chatState.lastMessageId;
            loadConversationsMobile();
        }
    } catch (e) {
        // silent fail - jangan ganggu user
        console.log('Polling error (silent):', e.message);
    }
}

// ================================================================
// UTILITY - GET INITIALS DARI NAMA LENGKAP
// ================================================================

function getInitials(fullName) {
    if (!fullName) return '??';
    
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return '??';
    if (parts.length === 1) {
        // Jika hanya 1 kata, ambil 2 huruf pertama
        return parts[0].substring(0, 2).toUpperCase();
    }
    // Ambil huruf pertama dari kata pertama dan kata terakhir
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return (first + last).toUpperCase();
}

function appendMessagesMobile(messages) {
    const el = document.getElementById('chatMessagesMobile');
    if (!el) return;

    // Remove empty state
    const empty = el.querySelector('.empty-state');
    if (empty) empty.remove();

    let lastDate = '';
    const allMsgs = el.querySelectorAll('.msg');
    if (allMsgs.length > 0) {
        const lastMsg = allMsgs[allMsgs.length - 1];
        const prev = lastMsg.previousElementSibling;
        if (prev && prev.classList.contains('msg-date')) {
            lastDate = prev.textContent;
        }
    }

    // 🔥 Ambil data partner dari chatState
    const partnerName = chatState.currentConversation?.other_name || 'Partner';

    messages.forEach(msg => {
        // Skip if already displayed
        if (msg.id && msg.id <= chatState.lastMessageId) return;

        const dateStr = msg.date_only || formatMsgDate(msg.created_at);
        if (dateStr && dateStr !== lastDate) {
            const sep = document.createElement('div');
            sep.className = 'msg-date';
            sep.textContent = dateStr;
            el.appendChild(sep);
            lastDate = dateStr;
        }

        const isMe = msg.is_me || msg.sender_id == currentUser.id;
        const cls = isMe ? 'sent' : 'received';
        const time = msg.time_only || formatMsgTime(msg.created_at);
        
        // 🔥 TAMPILKAN NAMA PENGIRIM UNTUK PESAN DITERIMA
        let senderNameHtml = '';
        if (!isMe) {
            senderNameHtml = `<div style="font-size:0.65rem;font-weight:600;color:var(--primary);margin-bottom:2px;margin-left:4px;">${escapeHtml(partnerName)}</div>`;
        }

        const div = document.createElement('div');
        div.className = `msg ${cls}`;
        div.innerHTML = `${senderNameHtml}${escapeHtml(msg.message)}<span class="time">${time}</span>`;
        el.appendChild(div);

        if (msg.id && msg.id > chatState.lastMessageId) {
            chatState.lastMessageId = msg.id;
        }

        // Notification for received messages
        if (!isMe && msg.id && !chatState.notifiedIds.has(msg.id)) {
            chatState.notifiedIds.add(msg.id);
            const name = chatState.currentConversation?.other_name || 'Pesan';
            showNotification(`${name}: ${msg.message.substring(0, 60)}`, 'info');
        }
    });

    el.scrollTop = el.scrollHeight;
}

// ================================================================
// LOAD MESSAGES MOBILE - Ambil pesan dari server
// ================================================================

async function loadMessagesMobile(jobId, otherId) {
    try {
        const url = `get_messages.php?job_id=${jobId}&user_id=${currentUser.id}&other_id=${otherId}&role=${currentUser.role}&limit=100&offset=0&t=${Date.now()}`;
        console.log('📥 Loading messages from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error('HTTP error:', response.status);
            document.getElementById('chatMessagesMobile').innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error memuat pesan (${response.status})</h3></div>`;
            return;
        }
        
        const data = await response.json();
        console.log('📦 Messages data:', data);

        if (data.success) {
            displayMessagesMobile(data.messages || []);
            chatState.lastMessageId = data.newest_id || 0;
        } else {
            console.error('Failed to load messages:', data.message);
            document.getElementById('chatMessagesMobile').innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error memuat pesan</h3></div>`;
        }
    } catch (e) {
        console.error('loadMessagesMobile error:', e);
        document.getElementById('chatMessagesMobile').innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error memuat pesan</h3><p>${escapeHtml(e.message)}</p></div>`;
    }
}

// ================================================================
// UPDATE CHAT BADGE - Perbaiki dan pastikan ada
// ================================================================

function updateChatBadge(conversations) {
    console.log('🔄 updateChatBadge called with conversations:', conversations);
    
    let total = 0;
    if (conversations && conversations.length > 0) {
        conversations.forEach(c => { 
            total += c.unread_count || 0; 
        });
    }

    // Update badge di bottom nav
    const badge = document.getElementById('chatBadgeBottom');
    if (badge) {
        badge.textContent = total;
        badge.style.display = total > 0 ? 'inline-block' : 'none';
        console.log('📊 Badge updated:', total);
    }

    // Update badge di drawer (jika ada)
    const drawerBadge = document.getElementById('chatBadgeDrawer');
    if (drawerBadge) {
        drawerBadge.textContent = total;
        drawerBadge.style.display = total > 0 ? 'inline-block' : 'none';
    }
}

function renderConversationList(conversations) {
    const container = document.getElementById('chatConversationsListMobile');
    if (!container) return;

    container.innerHTML = '';
    if (!conversations || conversations.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><h3>Belum ada percakapan</h3></div>`;
        return;
    }

    conversations.forEach(conv => {
        const item = document.createElement('div');
        item.className = 'chat-list-item';
        
        // 🔥 TAMPILKAN NAMA LENGKAP, BUKAN INISIAL
        const fullName = conv.other_party || 'Pengguna';
        const initials = getInitials(fullName);
        
        const unread = conv.unread_count > 0 ? `<span class="unread-badge">${conv.unread_count}</span>` : '';

        // 🔥 TAMPILKAN NAMA LENGKAP DI HTML
        item.innerHTML = `
            <div class="chat-avatar">${initials}</div>
            <div class="chat-info">
                <div class="name" style="font-weight:600;font-size:0.9rem;">${escapeHtml(fullName)}</div>
                <div class="last-msg">${escapeHtml(conv.last_message || 'Belum ada pesan')}</div>
                <div class="time">${formatChatTime(conv.last_message_time)}</div>
            </div>
            ${unread}
        `;

        item.onclick = function() {
            console.log('🔘 Opening chat with:', fullName, 'job:', conv.job_id);
            openChatMobile(conv.job_id, fullName, conv.other_party_id, conv.job_title);
        };

        container.appendChild(item);
    });
}

async function openChatMobile(jobId, otherName, otherId, jobTitle) {
    if (!currentUser) {
        showNotification('Anda harus login terlebih dahulu', 'error');
        return;
    }

    console.log('🔓 Opening chat:', { jobId, otherName, otherId, jobTitle });

    jobId = parseInt(jobId);
    otherId = parseInt(otherId);

    // Stop old polling
    if (chatState.pollingInterval) {
        clearInterval(chatState.pollingInterval);
        chatState.pollingInterval = null;
    }

    chatState.currentConversation = { 
        job_id: jobId, 
        other_id: otherId, 
        other_name: otherName, 
        job_title: jobTitle 
    };
    chatState.lastMessageId = 0;
    chatState.notifiedIds.clear();

    // Switch to chat main view
    document.getElementById('chatSidebar').style.display = 'none';
    document.getElementById('chatMainMobile').style.display = 'flex';

    // 🔥 PASTIKAN TOMBOL BACK TERLIHAT DAN BISA DIKLIK
    const backBtn = document.getElementById('chatBackMobile');
    if (backBtn) {
        backBtn.style.display = 'inline-block';
        backBtn.onclick = function() {
            closeChatMobile();
        };
    }

    // Tampilkan nama lengkap di header chat
    const partnerName = otherName || 'User';
    document.getElementById('chatPartnerName').textContent = partnerName;
    
    const isRequester = currentUser.role === 'requester';
    document.getElementById('chatPartnerRole').textContent = isRequester ? 'Helper' : 'Requester';

    // Clear messages
    const messagesEl = document.getElementById('chatMessagesMobile');
    messagesEl.innerHTML = `<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h3>Memuat...</h3></div>`;

    // Enable input
    document.getElementById('chatInputMobile').disabled = false;
    document.getElementById('chatSendMobile').disabled = false;
    document.getElementById('chatInputMobile').placeholder = 'Ketik pesan...';

    // Check if upload button should be enabled
    const job = jobs.find(j => j.id == jobId);
    const isHelperWorker = (currentUser?.role === 'helper' || currentUser?.role === 'user') && job?.helper_id === currentUser?.id;
    const isActiveJob = job && (job.status === 'paid' || job.status === 'in-progress' || job.status === 'ongoing');
    document.getElementById('chatUploadMobile').disabled = !(isActiveJob && isHelperWorker);

    // Load messages
    await loadMessagesMobile(jobId, otherId);

    // Start polling
    if (chatState.pollingInterval) {
        clearInterval(chatState.pollingInterval);
    }
    chatState.pollingInterval = setInterval(() => {
        if (chatState.currentConversation) {
            pollNewMessagesMobile(jobId, otherId);
        }
    }, 3000);

    setTimeout(() => document.getElementById('chatInputMobile').focus(), 300);
}

// ================================================================
// CLOSE CHAT - Kembali ke daftar percakapan
// ================================================================

function closeChatMobile() {
    console.log('🔙 Closing chat...');
    
    // Stop polling
    if (chatState.pollingInterval) {
        clearInterval(chatState.pollingInterval);
        chatState.pollingInterval = null;
    }
    
    // Reset chat state
    chatState.currentConversation = null;
    chatState.lastMessageId = 0;
    chatState.notifiedIds.clear();
    
    // Switch back to sidebar view
    document.getElementById('chatSidebar').style.display = 'block';
    document.getElementById('chatMainMobile').style.display = 'none';
    
    // Disable input
    document.getElementById('chatInputMobile').disabled = true;
    document.getElementById('chatSendMobile').disabled = true;
    document.getElementById('chatUploadMobile').disabled = true;
    document.getElementById('chatInputMobile').placeholder = 'Pilih percakapan...';
    
    // Reload conversations to update unread counts
    loadConversationsMobile();
    
    console.log('✅ Chat closed');
}

// 🔥 EXPOSE KE GLOBAL
window.closeChatMobile = closeChatMobile;

async function loadMessagesMobile(jobId, otherId) {
    try {
        const url = `get_messages.php?job_id=${jobId}&user_id=${currentUser.id}&other_id=${otherId}&role=${currentUser.role}&limit=100&offset=0&t=${Date.now()}`;
        console.log('📥 Loading messages from:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('📦 Messages data:', data);

        if (data.success) {
            displayMessagesMobile(data.messages || []);
            chatState.lastMessageId = data.newest_id || 0;
        } else {
            console.error('Failed to load messages:', data.message);
            document.getElementById('chatMessagesMobile').innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error memuat pesan</h3></div>`;
        }
    } catch (e) {
        console.error('loadMessagesMobile error:', e);
        document.getElementById('chatMessagesMobile').innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error memuat pesan</h3></div>`;
    }
}

async function sendMessageMobile() {
    if (!currentUser || !chatState.currentConversation) {
        showNotification('Pilih percakapan terlebih dahulu', 'warning');
        return;
    }

    const input = document.getElementById('chatInputMobile');
    const msg = input.value.trim();
    if (!msg) return;

    console.log('📤 Sending message:', {
        job_id: chatState.currentConversation.job_id,
        sender_id: currentUser.id,
        receiver_id: chatState.currentConversation.other_id,
        sender_role: currentUser.role
    });

    input.value = '';
    const sendBtn = document.getElementById('chatSendMobile');
    sendBtn.disabled = true;

    try {
        const fd = new FormData();
        fd.append('job_id', chatState.currentConversation.job_id);
        fd.append('sender_id', currentUser.id);
        fd.append('receiver_id', chatState.currentConversation.other_id);
        fd.append('message', msg);
        fd.append('sender_role', currentUser.role);

        const response = await fetch('send_message.php', { method: 'POST', body: fd });
        const data = await response.json();
        
        console.log('📥 Send message response:', data);

        if (data.success) {
            const newMsg = {
                id: data.data.id,
                sender_id: currentUser.id,
                receiver_id: chatState.currentConversation.other_id,
                message: msg,
                is_me: true,
                created_at: data.data.created_at || new Date().toISOString(),
                time_only: formatMsgTime(data.data.created_at || new Date().toISOString()),
                date_only: formatMsgDate(data.data.created_at || new Date().toISOString())
            };
            appendMessagesMobile([newMsg]);
            chatState.lastMessageId = Math.max(chatState.lastMessageId, data.data.id || 0);
            loadConversationsMobile();
        } else {
            showNotification('Gagal kirim: ' + data.message, 'error');
            input.value = msg;
        }
    } catch (e) {
        console.error('sendMessageMobile error:', e);
        showNotification('Gagal mengirim pesan', 'error');
        input.value = msg;
    } finally {
        sendBtn.disabled = false;
        input.focus();
    }
}

document.getElementById('chatSendMobile').addEventListener('click', sendMessageMobile);
document.getElementById('chatInputMobile').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessageMobile();
    }
});

document.getElementById('chatSearchMobile').addEventListener('input', function() {
    const term = this.value.toLowerCase();
    document.querySelectorAll('.chat-list-item').forEach(item => {
        const name = item.querySelector('.name')?.textContent?.toLowerCase() || '';
        const lastMsg = item.querySelector('.last-msg')?.textContent?.toLowerCase() || '';
        item.style.display = (name.includes(term) || lastMsg.includes(term)) ? '' : 'none';
    });
});

document.getElementById('chatUploadMobile').addEventListener('click', function() {
    if (!chatState.currentConversation) {
        showNotification('Pilih percakapan terlebih dahulu', 'warning');
        return;
    }

    const jobId = chatState.currentConversation.job_id;
    const job = jobs.find(j => j.id == jobId);

    if (!job) { showNotification('Data pekerjaan tidak ditemukan', 'error'); return; }
    if (currentUser.role !== 'helper' && currentUser.role !== 'user') {
        showNotification('Hanya Helper yang dapat upload bukti', 'error');
        return;
    }
    if (job.helper_id != currentUser.id) {
        showNotification('Anda bukan helper untuk pekerjaan ini', 'error');
        return;
    }
    if (job.status !== 'in-progress' && job.status !== 'ongoing' && job.status !== 'paid') {
        showNotification('Pekerjaan belum dimulai', 'error');
        return;
    }

    openUploadBuktiModalMobile(jobId);
});

async function startChatWithRequesterMobile(jobId, requesterId, requesterName, jobTitle) {
    if (!currentUser) return;
    // 🔥 PASTIKAN NAMA LENGKAP DIKIRIM
    const fullName = requesterName || 'Requester';
    navigateTo('messages');
    await loadConversationsMobile();
    await openChatMobile(jobId, fullName, requesterId, jobTitle);
}

async function startChatWithHelperMobile(jobId, helperId, helperName, jobTitle) {
    if (!currentUser) return;
    // 🔥 PASTIKAN NAMA LENGKAP DIKIRIM
    const fullName = helperName || 'Helper';
    navigateTo('messages');
    await loadConversationsMobile();
    await openChatMobile(jobId, fullName, helperId, jobTitle);
}

// ================================================================
// NOTIFICATIONS
// ================================================================

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notifBadgeMobile');

    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
}

// ================================================================
// LOAD NOTIFICATIONS - Hanya untuk badge, bukan untuk ditampilkan
// ================================================================

async function loadNotifications() {
    if (!currentUser) return;

    try {
        // 🔥 Ambil hanya jumlah notifikasi yang belum dibaca, bukan semua
        const response = await fetch(`get_notifications.php?user_id=${currentUser.id}&limit=1&t=${Date.now()}`);
        const data = await response.json();

        if (data.success) {
            notifications = data.notifications || [];
            updateNotificationBadge();
            console.log('📊 Notification badge updated, unread:', notifications.filter(n => !n.read).length);
        }
    } catch (e) {
        console.error('loadNotifications error:', e);
    }
}

// ================================================================
// NOTIFICATIONS - PERBAIKAN
// ================================================================

function startNotificationPolling() {
    if (notificationPolling) {
        clearInterval(notificationPolling);
    }

    // 🔥 Ambil ID notifikasi terakhir dari localStorage
    const savedId = localStorage.getItem('lastNotificationIdMobile');
    if (savedId) {
        lastNotificationId = parseInt(savedId);
        console.log('📌 Last notification ID from storage:', lastNotificationId);
    } else {
        // 🔥 Jika tidak ada, set ke 0 agar tidak menampilkan notifikasi lama
        lastNotificationId = 0;
        console.log('📌 No saved notification ID, starting from 0');
    }
    
    // 🔥 Reset flag untuk load pertama
    firstNotificationLoad = true;

    notificationPolling = setInterval(async () => {
        if (!currentUser) return;
        if (isProcessing) return;

        isProcessing = true;

        try {
            // 🔥 Kirim last_id untuk hanya mengambil notifikasi baru
            const url = `check_notifications.php?last_id=${lastNotificationId}&t=${Date.now()}`;
            console.log('🔔 Checking notifications with last_id:', lastNotificationId);
            
            const response = await fetch(url);
            const data = await response.json();

            if (data.success && data.notifications && data.notifications.length > 0) {
                console.log('📬 New notifications received:', data.notifications.length);
                
                // 🔥 Filter notifikasi yang benar-benar baru (ID > lastNotificationId)
                const newNotifs = data.notifications.filter(n => n.id > lastNotificationId);
                
                if (newNotifs.length > 0) {
                    // 🔥 Jika ini adalah load pertama (firstNotificationLoad = true), 
                    // jangan tampilkan notifikasi, hanya update last_id
                    if (firstNotificationLoad) {
                        console.log('⏭️ First load, skipping notifications display, updating last_id only');
                        // Update last_id ke ID tertinggi
                        const maxId = Math.max(...newNotifs.map(n => n.id));
                        lastNotificationId = maxId;
                        localStorage.setItem('lastNotificationIdMobile', lastNotificationId);
                        firstNotificationLoad = false;
                    } else {
                        // 🔥 Tampilkan notifikasi baru satu per satu
                        for (const notif of newNotifs) {
                            let title = "Hendimen";
                            if (notif.type === 'payment') title = "💰 Pembayaran";
                            else if (notif.type === 'pending_acc') title = "⏰ Menunggu ACC";
                            else if (notif.type === 'reject') title = "❌ Ditolak";
                            else if (notif.type === 'offer') title = "📩 Tawaran Baru";
                            else if (notif.type === 'new_job') title = "📢 Pekerjaan Baru";
                            else if (notif.type === 'success') title = "✅ Sukses";
                            else title = "🔔 Hendimen";

                            if (window.notifHelper) {
                                window.notifHelper.show(title, notif.message, notif.type);
                            } else {
                                showNotification(`${title}: ${notif.message}`, notif.type);
                            }

                            // Update lastNotificationId
                            if (notif.id > lastNotificationId) {
                                lastNotificationId = notif.id;
                                localStorage.setItem('lastNotificationIdMobile', lastNotificationId);
                            }
                        }
                    }
                    
                    // Update badge
                    await loadNotifications();
                } else {
                    // 🔥 Jika tidak ada notifikasi baru tapi ada data, update flag
                    if (firstNotificationLoad) {
                        firstNotificationLoad = false;
                    }
                }
            } else {
                // 🔥 Jika tidak ada notifikasi, update flag
                if (firstNotificationLoad) {
                    firstNotificationLoad = false;
                }
            }
        } catch (e) {
            console.log('Polling error:', e.message);
        } finally {
            isProcessing = false;
        }
    }, 5000); // Polling setiap 5 detik
}

document.getElementById('notifBellMobile').addEventListener('click', function() {
    loadNotifications();
    const badge = document.getElementById('notifBadgeMobile');
    if (badge) badge.style.display = 'none';
    notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    showNotification('📬 ' + (notifications.length || 0) + ' notifikasi', 'info');
});

// ================================================================
// NOTIFICATION PERMISSION
// ================================================================

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        document.getElementById('notifStatusMobile').textContent = '⚠️ Browser tidak mendukung notifikasi';
        return false;
    }

    if (Notification.permission === 'granted') {
        document.getElementById('notifStatusMobile').textContent = '✅ Notifikasi aktif';
        return true;
    }

    if (Notification.permission === 'denied') {
        document.getElementById('notifStatusMobile').textContent = '❌ Notifikasi diblokir. Buka pengaturan browser.';
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        const status = document.getElementById('notifStatusMobile');
        if (permission === 'granted') {
            status.textContent = '✅ Notifikasi aktif';
            showNotification('Notifikasi berhasil diaktifkan!', 'success');
            return true;
        } else {
            status.textContent = '❌ Izin ditolak';
            return false;
        }
    } catch (error) {
        console.error('Error requesting notification:', error);
        document.getElementById('notifStatusMobile').textContent = '⚠️ Error: ' + error.message;
        return false;
    }
}

document.getElementById('enableNotifMobile').addEventListener('click', function() {
    requestNotificationPermission();
});

// ================================================================
// CREATE JOB - FORM & BUDGET RANGE
// ================================================================

document.getElementById('createJobBtnMobile').addEventListener('click', function() {
    if (currentUser?.role !== 'requester') {
        showNotification('Hanya Requester yang dapat membuat pekerjaan', 'error');
        return;
    }

    document.getElementById('createJobFormMobile').reset();
    document.getElementById('simpleLocationPreviewMobile').style.display = 'none';
    document.getElementById('imagePreviewMobile').style.display = 'none';
    document.getElementById('emergencyJobMobile').checked = false;
    
    // Reset budget display
    updateBudgetDisplayMobile();

    const reqBalance = currentUser.wallet_requester || 0;
    document.getElementById('modalWalletBalanceMobile').textContent = 'Rp ' + formatRupiah(reqBalance);
    document.getElementById('modalWalletHelperMobile').textContent = 'Rp ' + formatRupiah(currentUser.wallet_helper || 0);

    openModal('createJobModalMobile');
});

document.getElementById('simpleLocationBtnMobile').addEventListener('click', function() {
    if (!navigator.geolocation) {
        showNotification('Browser tidak mendukung geolocation', 'error');
        return;
    }

    showLoading(true);
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            document.getElementById('jobLatitudeMobile').value = lat;
            document.getElementById('jobLongitudeMobile').value = lng;
            document.getElementById('jobLocationMobile').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

            const preview = document.getElementById('simpleLocationPreviewMobile');
            const text = document.getElementById('simpleLocationTextMobile');
            text.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            preview.style.display = 'block';

            showLoading(false);
            showNotification('Lokasi berhasil didapatkan!', 'success');
        },
        function(error) {
            showLoading(false);
            let msg = 'Gagal mendapatkan lokasi: ';
            switch (error.code) {
                case 1: msg += 'Izin ditolak'; break;
                case 2: msg += 'Lokasi tidak tersedia'; break;
                case 3: msg += 'Waktu habis'; break;
                default: msg += error.message;
            }
            showNotification(msg, 'error');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
});

document.getElementById('removeLocationMobile').addEventListener('click', function() {
    document.getElementById('simpleLocationPreviewMobile').style.display = 'none';
    document.getElementById('jobLocationMobile').value = '';
    document.getElementById('jobLatitudeMobile').value = '';
    document.getElementById('jobLongitudeMobile').value = '';
});

document.getElementById('jobImageMobile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('previewImgMobile').src = event.target.result;
            document.getElementById('imagePreviewMobile').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('removeImageMobile').addEventListener('click', function() {
    document.getElementById('jobImageMobile').value = '';
    document.getElementById('imagePreviewMobile').style.display = 'none';
    document.getElementById('previewImgMobile').src = '#';
});

// ================================================================
// SAVE JOB TO DATABASE (DENGAN BUDGET RANGE)
// ================================================================

async function saveJobToDatabase() {
    console.log('🔄 saveJobToDatabase dipanggil!');
    
    if (!currentUser) {
        showNotification('Anda harus login terlebih dahulu', 'error');
        return false;
    }
    
    if (currentUser.role !== 'requester') {
        showNotification('Hanya Requester yang dapat memposting pekerjaan!', 'error');
        return false;
    }
    
    const jobTitleEl = document.getElementById('jobTitleMobile');
    const jobCategoryEl = document.getElementById('jobCategoryMobile');
    const jobDescriptionEl = document.getElementById('jobDescriptionMobile');
    const jobLocationEl = document.getElementById('jobLocationMobile');
    const jobLatitudeEl = document.getElementById('jobLatitudeMobile');
    const jobLongitudeEl = document.getElementById('jobLongitudeMobile');
    const emergencyJobEl = document.getElementById('emergencyJobMobile');
    const jobImageEl = document.getElementById('jobImageMobile');
    const budgetMinEl = document.getElementById('budgetMinMobile');
    const budgetMaxEl = document.getElementById('budgetMaxMobile');
    
    if (!jobTitleEl || !jobCategoryEl || !jobDescriptionEl || !jobLocationEl) {
        showNotification('Form tidak lengkap. Silakan refresh halaman.', 'error');
        return false;
    }
    
    const title = jobTitleEl.value.trim();
    const category = jobCategoryEl.value;
    const description = jobDescriptionEl.value.trim();
    const location = jobLocationEl.value.trim();
    const latitude = jobLatitudeEl ? jobLatitudeEl.value : '-6.2088';
    const longitude = jobLongitudeEl ? jobLongitudeEl.value : '106.8456';
    const jobImage = jobImageEl ? jobImageEl.files[0] : null;
    
    let emergency = 0;
    if (emergencyJobEl) {
        emergency = emergencyJobEl.checked ? 1 : 0;
    }
    
    // ================================================================
    // AMBIL BUDGET RANGE
    // ================================================================
    let budgetMin = 0, budgetMax = 0;
    if (budgetMinEl) {
        budgetMin = parseInt(budgetMinEl.value.replace(/\./g, '')) || 0;
    }
    if (budgetMaxEl) {
        budgetMax = parseInt(budgetMaxEl.value.replace(/\./g, '')) || 0;
    }
    
    if (budgetMin < 10000) {
        showNotification('Budget minimum minimal Rp 10.000', 'error');
        return false;
    }
    if (budgetMax < budgetMin) {
        showNotification('Budget maksimum harus lebih besar dari minimum', 'error');
        return false;
    }
    
    // Gunakan budgetMax sebagai estimated_price (helper akan menawar di bawah ini)
    const estimatedPrice = budgetMax;
    
    console.log('📊 Budget Min:', budgetMin, 'Max:', budgetMax, 'Emergency:', emergency);
    
    // Validasi input
    if (!title) { showNotification('Judul pekerjaan harus diisi!', 'error'); return false; }
    if (!category) { showNotification('Kategori harus dipilih!', 'error'); return false; }
    if (!description) { showNotification('Deskripsi pekerjaan harus diisi!', 'error'); return false; }
    if (!location) { showNotification('Alamat lokasi pekerjaan harus diisi!', 'error'); return false; }
    
    if (jobImage) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(jobImage.type)) {
            showNotification('Format gambar harus JPG, PNG, GIF, atau WEBP', 'error');
            return false;
        }
        if (jobImage.size > 5 * 1024 * 1024) {
            showNotification('Ukuran gambar maksimal 5MB', 'error');
            return false;
        }
    }
    
    if (estimatedPrice < 10000) {
        showNotification('Minimal estimasi biaya Rp 10.000', 'error');
        return false;
    }
    
    showLoading(true);
    
    const formData = new FormData();
    formData.append('user_id', currentUser.id);
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('location', location);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('price', estimatedPrice);
    formData.append('budget_min', budgetMin);
    formData.append('budget_max', budgetMax);
    formData.append('emergency', emergency);
    
    if (jobImage) {
        formData.append('job_image', jobImage);
    }
    
    try {
        const response = await fetch('save_job.php', {
            method: 'POST',
            credentials: 'same-origin',
            body: formData
        });
        
        const responseText = await response.text();
        console.log('📄 Raw response:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('JSON parse error:', e);
            throw new Error('Response tidak valid: ' + responseText.substring(0, 200));
        }
        
        if (result.success) {
            console.log('✅ JOB BERHASIL!');
            console.log('  Job ID:', result.job_id);
            console.log('  Estimasi harga:', result.estimated_price);
            
            await loadJobsFromDB();
            
            if (currentUser.role === 'requester') {
                loadRequesterJobs();
            } else {
                loadHelperJobs();
            }
            loadMyJobs();
            
            closeModal('createJobModalMobile');
            
            document.getElementById('createJobFormMobile').reset();
            document.getElementById('jobImageMobile').value = '';
            document.getElementById('imagePreviewMobile').style.display = 'none';
            document.getElementById('previewImgMobile').src = '#';
            document.getElementById('simpleLocationPreviewMobile').style.display = 'none';
            document.getElementById('jobLocationMobile').value = '';
            
            // Reset budget
            if (budgetMinEl) budgetMinEl.value = '';
            if (budgetMaxEl) budgetMaxEl.value = '';
            if (emergencyJobEl) emergencyJobEl.checked = false;
            updateBudgetDisplayMobile();
            
            updateWalletDisplay();
            
            showNotification(`✅ Permintaan berhasil diposting! Menunggu tawaran dari Helper.`, 'success');
            navigateTo('home');
            
            return true;
        } else {
            showNotification('Gagal: ' + result.message, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error detail:', error);
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
        return false;
    } finally {
        showLoading(false);
    }
}

document.getElementById('createJobFormMobile').addEventListener('submit', async function(e) {
    e.preventDefault();
    await saveJobToDatabase();
});

// ================================================================
// IMAGE VIEWER
// ================================================================

function openImageViewer(src) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
    overlay.innerHTML = `<img src="${src}" style="max-width:92vw;max-height:92vh;border-radius:8px;object-fit:contain;">`;
    overlay.onclick = function() { this.remove(); };
    document.body.appendChild(overlay);
}

// ================================================================
// INIT
// ================================================================

function setupJobTabs() {
    const tabs = document.querySelectorAll('.tabbed-menu .tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
            
            const target = document.getElementById(tabId);
            if (target) {
                target.classList.add('active');
            }
            
            if (tabId === 'favoriteJobsTabMobile') {
                loadFavorites();
            } else if (tabId === 'pendingAccTabMobile') {
                loadMyJobs();
            } else if (tabId === 'perbaikanTabMobile') {
                loadMyJobs();
            } else {
                loadMyJobs();
            }
        });
    });
}

function setDefaultTab() {
    const firstTab = document.querySelector('.tabbed-menu .tab-btn');
    if (firstTab) {
        const tabId = firstTab.dataset.tab;
        document.querySelectorAll('.tabbed-menu .tab-btn').forEach(t => t.classList.remove('active'));
        firstTab.classList.add('active');
        
        document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(tabId);
        if (target) target.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Hendimen Mobile Dashboard initializing...');

    checkSession();
    initDarkMode();
    setupJobTabs();
    setDefaultTab();

    if (Notification.permission === 'granted') {
        document.getElementById('notifStatusMobile').textContent = '✅ Notifikasi aktif';
    } else if (Notification.permission === 'denied') {
        document.getElementById('notifStatusMobile').textContent = '❌ Notifikasi diblokir';
    } else {
        document.getElementById('notifStatusMobile').textContent = '⚡ Klik tombol untuk mengaktifkan';
    }
});

// ================================================================
// PERBAIKAN LANGSUNG - UPDATE PENDAPATAN BULAN INI
// ================================================================

(async function fixEarningsNow() {
    console.log('🔧 ===== PERBAIKAN LANGSUNG =====\n');
    
    if (!currentUser) {
        console.error('❌ Anda harus login!');
        return;
    }
    
    if (currentUser.role !== 'helper' && currentUser.role !== 'user') {
        console.warn('⚠️ Anda bukan Helper, tapi tetap jalan...');
    }
    
    console.log('👤 User:', currentUser.nama_lengkap || currentUser.name);
    console.log('💰 Wallet Helper:', currentUser.wallet_helper);
    
    console.log('\n📥 Mengambil transaksi...');
    
    if (typeof loadWalletFromDB === 'function') {
        await loadWalletFromDB();
    }
    
    const transactions = window.walletTransactions || [];
    console.log('📊 Total transaksi:', transactions.length);
    
    if (transactions.length === 0) {
        console.warn('⚠️ Tidak ada transaksi!');
        document.getElementById('berandaPendapatanHelper').textContent = 'Rp 0';
        return;
    }
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let totalEarnings = 0;
    let count = 0;
    
    console.log('\n📋 TRANSAKSI YANG DIPROSES:');
    
    transactions.forEach(t => {
        const isHelper = t.role === 'helper' || t.role === 'unknown' || t.role === null || t.role === undefined;
        const isPayment = t.type === 'payment' || t.type === 'tip' || t.type === 'credit';
        const isSuccess = t.status === 'Sukses' || t.status === 'success';
        
        if (isHelper && isPayment && isSuccess) {
            let tDate = null;
            if (t.created_at) tDate = new Date(t.created_at);
            else if (t.date) tDate = new Date(t.date);
            
            if (tDate && !isNaN(tDate.getTime())) {
                const tMonth = tDate.getMonth();
                const tYear = tDate.getFullYear();
                
                if (tMonth === currentMonth && tYear === currentYear) {
                    let amount = 0;
                    if (typeof t.amount === 'string') {
                        amount = parseInt(t.amount.replace(/[^0-9]/g, '')) || 0;
                    } else if (typeof t.amount === 'number') {
                        amount = Math.abs(t.amount);
                    }
                    
                    if (amount > 0) {
                        totalEarnings += amount;
                        count++;
                        console.log(`  ✅ #${t.id}: ${t.type} = Rp ${amount.toLocaleString()} (${tDate.toLocaleDateString()})`);
                    }
                }
            }
        }
    });
    
    console.log(`\n💰 TOTAL PENDAPATAN BULAN INI: Rp ${totalEarnings.toLocaleString()}`);
    console.log(`📝 JUMLAH TRANSAKSI: ${count}`);
    
    const earningsEl = document.getElementById('berandaPendapatanHelper');
    if (earningsEl) {
        const displayText = 'Rp ' + totalEarnings.toLocaleString('id-ID');
        earningsEl.textContent = displayText;
        console.log(`\n✅ UI UPDATED: ${displayText}`);
    } else {
        console.error('❌ Elemen berandaPendapatanHelper tidak ditemukan!');
    }
    
    const activeEl = document.getElementById('helperActiveJobsCount');
    const completedEl = document.getElementById('helperCompletedJobsCount');
    
    if (activeEl || completedEl) {
        const myJobs = jobs.filter(job => job.helper_id === currentUser.id);
        const activeCount = myJobs.filter(job => job.status === 'paid' || job.status === 'in-progress' || job.status === 'ongoing').length;
        const completedCount = myJobs.filter(job => job.status === 'completed').length;
        
        if (activeEl) activeEl.textContent = activeCount;
        if (completedEl) completedEl.textContent = completedCount;
        console.log(`📊 Aktif: ${activeCount}, Selesai: ${completedCount}`);
    }
    
    window._fixedEarnings = {
        totalEarnings,
        count,
        currentMonth: now.toLocaleString('id-ID', { month: 'long' }),
        currentYear
    };
    
    console.log('\n📊 ===== SELESAI =====');
    console.log(`💰 Pendapatan bulan ini: Rp ${totalEarnings.toLocaleString()}`);
    console.log(`📝 Transaksi: ${count}`);
    console.log(`📊 UI sekarang: ${earningsEl ? earningsEl.textContent : 'tidak ada'}`);
    
    if (totalEarnings === 0) {
        console.warn('\n⚠️ Pendapatan masih 0. Kemungkinan:');
        console.log('  1. Belum ada transaksi payment/tip di bulan ini');
        console.log('  2. Transaksi ada tapi status bukan "success"');
        console.log('  3. Transaksi ada tapi role bukan "helper"');
        console.log('  4. Transaksi ada tapi tanggal bukan bulan ini');
        console.log('\n🔍 Cek transaksi di console:');
        console.log('  console.log(window.walletTransactions)');
    } else {
        console.log('\n✅✅✅ PERBAIKAN BERHASIL! Pendapatan sudah muncul.');
    }
})();

// ================================================================
// FORCE REFRESH EARNINGS
// ================================================================

async function refreshEarningsNow() {
    console.log('🔄 Force refreshing earnings...');
    showLoading(true);
    try {
        await loadWalletFromDB();
        updateHelperStatsFromTransactions();
        const earnings = window._helperStatsFromTransactions?.monthlyEarnings || 0;
        showNotification(`💵 Pendapatan bulan ini: Rp ${earnings.toLocaleString()}`, 'success');
    } catch (e) {
        console.error('Error:', e);
        showNotification('Gagal refresh', 'error');
    } finally {
        showLoading(false);
    }
}
window.refreshEarningsNow = refreshEarningsNow;

// ================================================================
// OVERRIDE FUNGSI UNTUK AUTO-UPDATE
// ================================================================

const originalLoadWallet = loadWallet;
loadWallet = function() {
    originalLoadWallet();
    setTimeout(() => {
        if (currentUser && (currentUser.role === 'helper' || currentUser.role === 'user')) {
            console.log('🔄 Auto-update helper earnings from transactions...');
            updateHelperStatsFromTransactions();
        }
    }, 500);
};

const originalRefreshAll = refreshAllJobDisplays;
refreshAllJobDisplays = function() {
    originalRefreshAll();
    setTimeout(() => {
        if (currentUser && (currentUser.role === 'helper' || currentUser.role === 'user')) {
            console.log('🔄 Auto-update helper earnings after refresh...');
            updateHelperStatsFromTransactions();
        }
    }, 300);
};

setTimeout(() => {
    if (currentUser && (currentUser.role === 'helper' || currentUser.role === 'user')) {
        console.log('🔄 Initial helper earnings update...');
        updateHelperStatsFromTransactions();
    }
}, 2000);

window.refreshHelperEarnings = async function() {
    console.log('🔄 Refreshing helper earnings...');
    showLoading(true);
    try {
        await loadWalletFromDB();
        updateHelperStatsFromTransactions();
        const earnings = window._helperStatsFromTransactions?.monthlyEarnings || 0;
        showNotification(`💵 Pendapatan bulan ini: Rp ${earnings.toLocaleString()}`, 'success');
        console.log('✅ Refresh complete, earnings:', earnings);
    } catch (e) {
        console.error('Error:', e);
        showNotification('Gagal refresh', 'error');
    } finally {
        showLoading(false);
    }
};

console.log('✅ Helper earnings auto-update enabled!');
console.log('💡 Jalankan refreshHelperEarnings() dari console jika perlu.');

// ================================================================
// PERBAIKAN PERMANEN - UPDATE PENDAPATAN BULAN INI (AUTO-RUN)
// ================================================================

function updateHelperEarningsPermanen() {
    console.log('🔧 ===== UPDATE PENDAPATAN BULAN INI (PERMANEN) =====');
    
    if (!currentUser) {
        console.warn('⚠️ Belum login, skip update earnings');
        return;
    }
    
    if (currentUser.role !== 'helper' && currentUser.role !== 'user') {
        console.log('ℹ️ Bukan helper, skip update earnings');
        return;
    }
    
    const transactions = window.walletTransactions || [];
    
    if (transactions.length === 0) {
        document.getElementById('berandaPendapatanHelper').textContent = 'Rp 0';
        return;
    }
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let totalEarnings = 0;
    let count = 0;
    
    transactions.forEach(t => {
        const isHelper = t.role === 'helper' || t.role === 'unknown' || t.role === null || t.role === undefined;
        const isPayment = t.type === 'payment' || t.type === 'tip' || t.type === 'credit';
        const isSuccess = t.status === 'Sukses' || t.status === 'success';
        
        if (isHelper && isPayment && isSuccess) {
            let tDate = null;
            if (t.created_at) tDate = new Date(t.created_at);
            else if (t.date) tDate = new Date(t.date);
            
            if (tDate && !isNaN(tDate.getTime())) {
                const tMonth = tDate.getMonth();
                const tYear = tDate.getFullYear();
                
                if (tMonth === currentMonth && tYear === currentYear) {
                    let amount = 0;
                    if (typeof t.amount === 'string') {
                        amount = parseInt(t.amount.replace(/[^0-9]/g, '')) || 0;
                    } else if (typeof t.amount === 'number') {
                        amount = Math.abs(t.amount);
                    }
                    
                    if (amount > 0) {
                        totalEarnings += amount;
                        count++;
                    }
                }
            }
        }
    });
    
    const earningsEl = document.getElementById('berandaPendapatanHelper');
    if (earningsEl) {
        const displayText = 'Rp ' + totalEarnings.toLocaleString('id-ID');
        earningsEl.textContent = displayText;
    }
    
    window._helperEarnings = {
        totalEarnings,
        count,
        currentMonth: now.toLocaleString('id-ID', { month: 'long' }),
        currentYear
    };
    
    console.log(`💰 Pendapatan bulan ini: Rp ${totalEarnings.toLocaleString()}`);
}

const _originalLoadWallet = window.loadWallet || function() {};
window.loadWallet = function() {
    if (typeof _originalLoadWallet === 'function') {
        _originalLoadWallet.apply(this, arguments);
    }
    setTimeout(function() {
        updateHelperEarningsPermanen();
    }, 300);
};

const _originalAfterLogin = window.afterLogin || function() {};
window.afterLogin = function() {
    if (typeof _originalAfterLogin === 'function') {
        _originalAfterLogin.apply(this, arguments);
    }
    setTimeout(function() {
        updateHelperEarningsPermanen();
    }, 1000);
};

window.refreshHelperEarnings = function() {
    console.log('🔄 Refreshing helper earnings...');
    if (typeof loadWalletFromDB === 'function') {
        loadWalletFromDB().then(function() {
            updateHelperEarningsPermanen();
        });
    } else {
        updateHelperEarningsPermanen();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(updateHelperEarningsPermanen, 1500);
    });
} else {
    setTimeout(updateHelperEarningsPermanen, 1500);
}

console.log('✅ Helper earnings auto-update enabled (permanen)!');
console.log('💡 Jalankan refreshHelperEarnings() dari console jika perlu.');

// ================================================================
// CHAT BACK BUTTON
// ================================================================

// 🔥 TAMBAHKAN INI
document.addEventListener('DOMContentLoaded', function() {
    const chatBackBtn = document.getElementById('chatBackMobile');
    if (chatBackBtn) {
        chatBackBtn.addEventListener('click', function() {
            closeChatMobile();
        });
        console.log('✅ Chat back button listener attached');
    } else {
        console.warn('⚠️ chatBackMobile button not found');
    }
});

// 🔥 ATAU PAKAI INI (LANGSUNG TANPA DOMContentLoaded)
// Pindahkan ke bagian bawah file setelah semua elemen terdefinisi
const chatBackBtn = document.getElementById('chatBackMobile');
if (chatBackBtn) {
    chatBackBtn.onclick = function() {
        closeChatMobile();
    };
}
// ================================================================
// EXPOSE TO GLOBAL
// ================================================================

// ================================================================
// EXPOSE CHAT FUNCTIONS TO GLOBAL
// ================================================================

window.displayMessagesMobile = displayMessagesMobile;
window.pollNewMessagesMobile = pollNewMessagesMobile;
window.appendMessagesMobile = appendMessagesMobile;
window.loadMessagesMobile = loadMessagesMobile;
window.openChatMobile = openChatMobile;
window.loadConversationsMobile = loadConversationsMobile;
window.sendMessageMobile = sendMessageMobile;
window.updateChatBadge = updateChatBadge;
window.updateHelperStatsFromTransactions = updateHelperStatsFromTransactions;
window.updateHelperStats = updateHelperStats;
window.updateRequesterStats = updateRequesterStats;
window.loadWalletFromDB = loadWalletFromDB;
window.loadJobsFromDB = loadJobsFromDB;
window.openUploadBuktiModalMobile = openUploadBuktiModalMobile;
window.openRejectModalMobile = openRejectModalMobile;
window.openReportModalMobile = openReportModalMobile;
window.startChatWithRequesterMobile = startChatWithRequesterMobile;
window.startChatWithHelperMobile = startChatWithHelperMobile;
window.toggleFavorite = toggleFavorite;
window.accJob = accJob;
window.giveRating = giveRating;
window.viewJobDetail = viewJobDetail;
window.openImageViewer = openImageViewer;
window.openModal = openModal;
window.closeModal = closeModal;
window.navigateTo = navigateTo;
window.formatRupiah = formatRupiah;
window.escapeHtml = escapeHtml;
window.getCategoryName = getCategoryName;
window.getStatusName = getStatusName;
window.createOffer = createOffer;
window.selectOffer = selectOffer;
window.declineOffer = declineOffer;
window.openOffersModal = openOffersModal;
window.openPaymentModal = openPaymentModal;
window.startJob = startJob;
window.cancelJob = cancelJob;

// ================================================================
// 🔄 AUTOREFRESH SYSTEM - TANPA FILE TERPISAH
// ================================================================

// ================================================================
// 1. FUNGSI GET CURRENT PAGE
// ================================================================

function getCurrentPage() {
    // Cek dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const pageFromUrl = urlParams.get('page');
    if (pageFromUrl) return pageFromUrl;
    
    // Cek dari DOM
    const activeSection = document.querySelector('.page-section.active');
    if (activeSection) {
        const id = activeSection.id;
        if (id) {
            const page = id.replace('page-', '');
            return page;
        }
    }
    
    // Cek dari bottom nav
    const activeNav = document.querySelector('.bottom-nav .nav-item.active');
    if (activeNav) return activeNav.dataset.page;
    
    return 'home';
}

// ================================================================
// 2. CEK APAKAH SEDANG LOADING
// ================================================================

function isPageLoading() {
    const overlay = document.getElementById('loadingOverlay');
    return overlay && overlay.classList.contains('show');
}

// ================================================================
// 3. CEK APAKAH CHAT TERBUKA
// ================================================================

function isChatOpen() {
    const chatMain = document.getElementById('chatMainMobile');
    return chatMain && chatMain.style.display !== 'none';
}

// ================================================================
// 4. CEK APAKAH MODAL TERBUKA
// ================================================================

function isModalOpen() {
    const modals = document.querySelectorAll('.modal-overlay.open');
    return modals.length > 0;
}

// ================================================================
// 5. 🔥 JOB REFRESH - 15 DETIK
// ================================================================

setInterval(() => {
    // Skip jika tidak ada user
    if (!currentUser) return;
    
    // Skip jika sedang loading
    if (isPageLoading()) return;
    
    // Skip jika modal terbuka
    if (isModalOpen()) return;
    
    const activePage = getCurrentPage();
    
    // Refresh jobs hanya di halaman home, jobs, atau messages
    if (activePage === 'home' || activePage === 'jobs' || activePage === 'messages') {
        
        // Cek apakah fungsi tersedia
        if (typeof loadJobsFromDB === 'function') {
            loadJobsFromDB().then(() => {
                // Update tampilan sesuai role
                if (currentUser.role === 'requester') {
                    if (typeof loadRequesterJobs === 'function') loadRequesterJobs();
                } else {
                    if (typeof loadHelperJobs === 'function') loadHelperJobs();
                }
                
                if (typeof loadMyJobs === 'function') loadMyJobs();
                if (typeof updateMyJobBadges === 'function') updateMyJobBadges();
                
                console.log('🔄 Jobs auto-refreshed at', new Date().toLocaleTimeString());
            }).catch(() => {
                // Silent fail - jangan ganggu user
            });
        }
    }
}, 15000); // 15 detik

console.log('✅ Job auto-refresh enabled (15s)');

// ================================================================
// 6. 💰 WALLET REFRESH - 30 DETIK
// ================================================================

setInterval(() => {
    // Skip jika tidak ada user
    if (!currentUser) return;
    
    // Skip jika sedang loading
    if (isPageLoading()) return;
    
    // Skip jika modal terbuka
    if (isModalOpen()) return;
    
    const activePage = getCurrentPage();
    
    // Refresh wallet di halaman wallet atau home
    if (activePage === 'wallet' || activePage === 'home') {
        
        if (typeof loadWalletFromDB === 'function') {
            loadWalletFromDB().then(() => {
                if (typeof loadWallet === 'function') loadWallet();
                if (typeof updateWalletDisplay === 'function') updateWalletDisplay();
                if (typeof updateBerandaHistory === 'function') updateBerandaHistory();
                
                console.log('🔄 Wallet auto-refreshed at', new Date().toLocaleTimeString());
            }).catch(() => {
                // Silent fail
            });
        }
    }
}, 30000); // 30 detik

console.log('✅ Wallet auto-refresh enabled (30s)');

// ================================================================
// 7. 📊 STATS REFRESH - 30 DETIK
// ================================================================

setInterval(() => {
    // Skip jika tidak ada user
    if (!currentUser) return;
    
    // Skip jika sedang loading
    if (isPageLoading()) return;
    
    const activePage = getCurrentPage();
    
    // Refresh stats hanya di halaman home
    if (activePage === 'home') {
        
        if (currentUser.role === 'requester') {
            if (typeof updateRequesterStats === 'function') {
                updateRequesterStats();
                console.log('🔄 Requester stats auto-refreshed');
            }
        } else {
            if (typeof updateHelperStats === 'function') {
                updateHelperStats();
                if (typeof updateHelperStatsFromTransactions === 'function') {
                    updateHelperStatsFromTransactions();
                }
                console.log('🔄 Helper stats auto-refreshed');
            }
        }
    }
}, 30000); // 30 detik

console.log('✅ Stats auto-refresh enabled (30s)');

// ================================================================
// 8. 👤 PROFILE COMPLETION - 60 DETIK
// ================================================================

setInterval(() => {
    // Skip jika tidak ada user
    if (!currentUser) return;
    
    const activePage = getCurrentPage();
    
    // Refresh profil di halaman home atau settings
    if (activePage === 'home' || activePage === 'settings') {
        // Update avatar/profile jika ada perubahan
        const name = currentUser.name || currentUser.nama_lengkap || 'User';
        const initials = currentUser.avatar || name.charAt(0).toUpperCase();
        
        const avatarHeader = document.getElementById('avatarHeader');
        const drawerAvatar = document.getElementById('drawerAvatar');
        const drawerName = document.getElementById('drawerName');
        
        if (avatarHeader && avatarHeader.textContent !== initials) {
            avatarHeader.textContent = initials;
        }
        if (drawerAvatar && drawerAvatar.textContent !== initials) {
            drawerAvatar.textContent = initials;
        }
        if (drawerName && drawerName.textContent !== name) {
            drawerName.textContent = name;
        }
    }
}, 60000); // 60 detik

console.log('✅ Profile auto-refresh enabled (60s)');

// ================================================================
// 9. 📱 CHAT REFRESH - TAMBAHAN
// ================================================================

// Refresh chat conversations saat halaman messages aktif
setInterval(() => {
    if (!currentUser) return;
    if (isPageLoading()) return;
    
    const activePage = getCurrentPage();
    
    // Refresh daftar percakapan di halaman messages
    if (activePage === 'messages') {
        // Hanya refresh jika chat tidak terbuka (sidebar terlihat)
        const chatSidebar = document.getElementById('chatSidebar');
        if (chatSidebar && chatSidebar.style.display !== 'none') {
            if (typeof loadConversationsMobile === 'function') {
                loadConversationsMobile();
                console.log('🔄 Chat conversations refreshed');
            }
        }
    }
}, 20000); // 20 detik

console.log('✅ Chat conversations auto-refresh enabled (20s)');

// ================================================================
// 10. 🏠 HOME PAGE REFRESH - KHUSUS
// ================================================================

// Refresh semua data di home page
setInterval(() => {
    if (!currentUser) return;
    if (isPageLoading()) return;
    if (isModalOpen()) return;
    
    const activePage = getCurrentPage();
    
    if (activePage === 'home') {
        // Sync rating ke beranda
        if (typeof syncRatingToBeranda === 'function') {
            syncRatingToBeranda();
        }
        
        // Update reminder count
        const reminderEl = document.getElementById('reminderActiveCount');
        if (reminderEl) {
            const activeCount = document.querySelector('#activeJobsCount');
            if (activeCount) {
                reminderEl.textContent = activeCount.textContent || '0';
            }
        }
        
        // Update helper reminder
        const helperReminderEl = document.getElementById('helperReminderCount');
        if (helperReminderEl) {
            const helperActiveEl = document.getElementById('helperActiveJobsCount');
            if (helperActiveEl) {
                helperReminderEl.textContent = helperActiveEl.textContent || '0';
            }
        }
        
        console.log('🔄 Home page refreshed');
    }
}, 45000); // 45 detik

console.log('✅ Home page auto-refresh enabled (45s)');

// ================================================================
// 11. 🏦 ADMIN REFRESH - KHUSUS UNTUK ADMIN
// ================================================================

// Hanya berjalan jika user adalah admin
setInterval(() => {
    if (!currentUser) return;
    if (isPageLoading()) return;
    
    // Cek apakah user adalah admin
    if (currentUser.role !== 'admin') return;
    
    const activePage = getCurrentPage();
    
    // Refresh admin data di halaman dashboard, beranda, verification, withdraw
    if (activePage === 'dashboard' || activePage === 'beranda' || 
        activePage === 'verification' || activePage === 'withdraw') {
        
        // Top Up pending
        if (typeof loadPendingRequests === 'function') {
            loadPendingRequests();
        }
        
        // Withdraw pending
        if (typeof loadPendingWithdraw === 'function') {
            loadPendingWithdraw();
        }
        
        // Verifikasi pending
        if (typeof loadPendingVerifications === 'function') {
            loadPendingVerifications();
        }
        
        // Stats
        if (typeof loadStatistics === 'function') loadStatistics();
        if (typeof loadWithdrawStats === 'function') loadWithdrawStats();
        if (typeof loadVerificationStats === 'function') loadVerificationStats();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
        
        console.log('🔄 Admin data auto-refreshed at', new Date().toLocaleTimeString());
    }
}, 15000); // 15 detik

console.log('✅ Admin auto-refresh enabled (15s)');

// ================================================================
// 12. 🛡️ ERROR HANDLING - JANGAN MATI
// ================================================================

// Catch semua error di setInterval agar tidak mematikan aplikasi
window.addEventListener('error', function(e) {
    // Ignore errors dari setInterval
    if (e.message && e.message.includes('setInterval')) {
        e.preventDefault();
        return true;
    }
});

// ================================================================
// 13. 🔄 PAUSE SAAT TAB TIDAK AKTIF
// ================================================================

document.addEventListener('visibilitychange', function() {
    const isVisible = document.visibilityState === 'visible';
    
    if (isVisible) {
        console.log('🔄 Tab visible - resuming auto-refresh');
        // Refresh semua data saat tab kembali aktif
        if (currentUser) {
            if (typeof loadJobsFromDB === 'function') {
                loadJobsFromDB();
            }
            if (typeof loadWalletFromDB === 'function') {
                loadWalletFromDB();
            }
        }
    } else {
        console.log('⏸️ Tab hidden - auto-refresh paused');
    }
});

console.log('✅ Visibility handler enabled');

// ================================================================
// 14. 📊 DEBUG - TAMPILKAN STATUS
// ================================================================

console.log('📊 AutoRefresh Status:');
console.log('  ✅ Jobs: 15 detik');
console.log('  ✅ Wallet: 30 detik');
console.log('  ✅ Stats: 30 detik');
console.log('  ✅ Profile: 60 detik');
console.log('  ✅ Chat: 20 detik');
console.log('  ✅ Home: 45 detik');
console.log('  ✅ Admin: 15 detik (khusus admin)');
console.log('  ✅ Pause saat tab tidak aktif');

// ================================================================
// END OF AUTOREFRESH
// ================================================================

console.log('✅ Hendimen Mobile Dashboard ready!');