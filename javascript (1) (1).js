// ========== Data Global ==========
let currentUser = null;
let jobs = [];
let walletTransactions = [];
let walletBalance = 0;
let reviews = [];
let notifications = [];
let referralCount = 0;
let currentRatingTargetId = null;

// Variabel untuk peta
let map = null;
let marker = null;
let currentLat = null;
let currentLng = null;
let currentAddress = '';

// Variabel untuk homepage map
let homepageMap = null;
let homepageMarker = null;

// Tambahkan di PALING ATAS file javascript (1) (1).js, sebelum kode lainnya

// ========== FORCE DESKTOP MODE - EKSTREM ==========
(function forceDesktopModeStrict() {
    console.log('🔥 FORCE DESKTOP MODE STRICT - Version 2.0');
    
    // 1. Set viewport ke lebar desktop
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', 'width=1200, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
    } else {
        const newViewport = document.createElement('meta');
        newViewport.name = 'viewport';
        newViewport.content = 'width=1200, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
        document.head.appendChild(newViewport);
    }
    
    // 2. Set minimum width body
    document.documentElement.style.minWidth = '1200px';
    document.body.style.minWidth = '1200px';
    document.body.style.overflowX = 'auto';
    
    // 3. Set container width
    const container = document.querySelector('.container');
    if (container) {
        container.style.minWidth = '1200px';
        container.style.width = '1200px';
    }
    
    // 4. Paksa sidebar fixed position
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.position = 'fixed';
        sidebar.style.left = '0';
        sidebar.style.top = '0';
        sidebar.style.width = '260px';
        sidebar.style.height = '100vh';
        sidebar.style.overflowY = 'auto';
    }
    
    // 5. Atur margin untuk main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.marginLeft = '260px';
        mainContent.style.width = 'calc(100% - 260px)';
    }
    
    // 6. Nonaktifkan semua media query yang mengganggu dengan CSS injection
    const style = document.createElement('style');
    style.textContent = `
        /* FORCE DESKTOP - OVERRIDE ALL MEDIA QUERIES */
        @media (max-width: 2000px) {
            .dashboard { flex-direction: row !important; }
            .sidebar { 
                position: fixed !important; 
                width: 260px !important; 
                left: 0 !important;
                top: 0 !important;
                transform: none !important;
                display: block !important;
            }
            .main-content { margin-left: 260px !important; width: calc(100% - 260px) !important; }
            .container { 
                margin-left: 130px !important; 
                width: calc(100% - 260px) !important;
                min-width: auto !important;
            }
            .mobile-menu-btn, .bottom-nav, .mobile-overlay { display: none !important; }
            .user-profile span { display: inline-block !important; }
            .role-switch { flex-direction: row !important; }
            .navbar { flex-direction: row !important; justify-content: flex-end !important; }
            .logo-container { display: none !important; }
        }
        
        /* Fix untuk zoom */
        body { 
            zoom: 1 !important;
            -webkit-text-size-adjust: 100% !important;
        }
        
        /* Pastikan sidebar tidak pernah hilang */
        @media screen and (max-width: 1200px) {
            body { min-width: 1200px !important; overflow-x: auto !important; }
            .container { min-width: 1200px !important; }
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Force desktop mode strict applied');
})();

// Panggil saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    updateNotificationBadge();

    
    
    
// Fungsi untuk handle redirect dari landing page
function handleLandingRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const showAuth = urlParams.get('show');
    
    if (showAuth === 'auth' && currentUser) {
        // Jika sudah login dan mencoba akses auth page, redirect ke dashboard
        window.location.href = 'index.html';
    }
}
    
    // Setup semua event listeners
    setupEventListeners();
});

// ========== PERBAIKAN TOPUP - SALDO DITERIMA = NOMINAL ==========
document.getElementById('topupNominal')?.addEventListener('input', function(e) {
    let nilaiMurni = this.value.replace(/\D/g, '');
    
    if (nilaiMurni && nilaiMurni !== '') {
        let nominalAngka = parseInt(nilaiMurni, 10);
        let biayaAdmin = 2500;
        
        // PERHITUNGAN YANG BENAR
        let totalDibayar = nominalAngka + biayaAdmin;  // 100.000 + 2.500 = 102.500
        let saldoDiterima = nominalAngka;              // 100.000 (SALDO YANG DITERIMA = NOMINAL)
        
        // Format input dengan titik ribuan
        this.value = new Intl.NumberFormat('id-ID').format(nominalAngka);
        
        // Update ringkasan
        const summaryNominal = document.getElementById('summaryNominal');
        const totalPaymentAmount = document.getElementById('totalPaymentAmount');
        const topupReceivedAmount = document.getElementById('topupReceivedAmount');
        const totalPaymentDisplay = document.getElementById('totalPaymentDisplay');
        
        if (summaryNominal) summaryNominal.textContent = 'Rp ' + new Intl.NumberFormat('id-ID').format(nominalAngka);
        if (totalPaymentAmount) totalPaymentAmount.textContent = 'Rp ' + new Intl.NumberFormat('id-ID').format(totalDibayar);
        if (topupReceivedAmount) {
            topupReceivedAmount.textContent = 'Rp ' + new Intl.NumberFormat('id-ID').format(saldoDiterima);
            topupReceivedAmount.style.color = '#16a34a';
        }
        if (totalPaymentDisplay) totalPaymentDisplay.innerHTML = 'Total Dibayar: Rp ' + new Intl.NumberFormat('id-ID').format(totalDibayar);
        
    } else {
        this.value = '';
        if (document.getElementById('summaryNominal')) document.getElementById('summaryNominal').textContent = 'Rp 0';
        if (document.getElementById('totalPaymentAmount')) document.getElementById('totalPaymentAmount').textContent = 'Rp 0';
        if (document.getElementById('topupReceivedAmount')) document.getElementById('topupReceivedAmount').textContent = 'Rp 0';
        if (document.getElementById('totalPaymentDisplay')) document.getElementById('totalPaymentDisplay').innerHTML = 'Total Dibayar: Rp 0';
    }
});

    console.log('Setting up event listeners...');
    
    // Tombol Buat Permintaan (open modal)
    const openModalBtn = document.querySelector('[onclick="openModal(\'createJobModal\')"]');
    if (openModalBtn) {
        openModalBtn.addEventListener('click', function() {
            const requesterBalance = currentUser?.wallet_requester || 0;
            const modalWalletBalance = document.getElementById('modalWalletBalance');
            if (modalWalletBalance) {
                modalWalletBalance.textContent = 'Rp ' + formatRupiah(requesterBalance);
            }
            
            renderIndicatorDropdowns();
            
            const emergencyCheck = document.getElementById('emergencyJob');
            if (emergencyCheck) {
                emergencyCheck.checked = false;
            }
            
            const locationPreview = document.getElementById('locationPreview');
            if (locationPreview) {
                locationPreview.style.display = 'none';
            }
            
            const jobLatitude = document.getElementById('jobLatitude');
            if (jobLatitude) {
                jobLatitude.value = '';
            }
            
            const jobLongitude = document.getElementById('jobLongitude');
            if (jobLongitude) {
                jobLongitude.value = '';
            }
            
            updatePriceCalculation();
        });
    }

    // Tip dropdown
    const tipDropdown = document.getElementById('tipDropdown');
    if (tipDropdown) {
        tipDropdown.addEventListener('change', updatePriceCalculation);
    }

    const emergencyCheck = document.getElementById('emergencyJob');
    if (emergencyCheck) {
        emergencyCheck.removeEventListener('change', updatePriceCalculation);
        emergencyCheck.addEventListener('change', updatePriceCalculation);
        console.log('Emergency checkbox listener attached');
    }
    
    // Form submit
    const createJobForm = document.getElementById('createJobForm');
    if (createJobForm) {
        createJobForm.removeEventListener('submit', handleFormSubmit);
        createJobForm.addEventListener('submit', handleFormSubmit);
        console.log('Form submit listener attached');
    } else {
        console.error('createJobForm TIDAK DITEMUKAN!');
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        console.log('Form submitted');
        saveJobToDatabase();
    }
    
    // Tombol Close Modal Peta
    const closeOsmMapModal = document.getElementById('closeOsmMapModal');
    if (closeOsmMapModal) {
        closeOsmMapModal.addEventListener('click', closeOsmMapModalFunc);
    }
    
    const closeOsmMapBtn = document.getElementById('closeOsmMapBtn');
    if (closeOsmMapBtn) {
        closeOsmMapBtn.addEventListener('click', closeOsmMapModalFunc);
    }
    
    // Tombol Refresh Location
    const refreshLocationBtn = document.getElementById('refreshLocationBtn');
    if (refreshLocationBtn) {
        refreshLocationBtn.addEventListener('click', refreshMapLocation);
    }
    
    // Tombol Copy Koordinat
    const copyOsmCoordinateBtn = document.getElementById('copyOsmCoordinateBtn');
    if (copyOsmCoordinateBtn) {
        copyOsmCoordinateBtn.addEventListener('click', copyOsmCoordinates);
    }
    
    // Tombol Konfirmasi Lokasi
    const confirmOsmLocationBtn = document.getElementById('confirmOsmLocationBtn');
    if (confirmOsmLocationBtn) {
        confirmOsmLocationBtn.addEventListener('click', confirmOsmLocation);
    }
    
    // Tombol Pusatkan Peta (di halaman utama)
    const centerMapBtn = document.getElementById('centerMapBtn');
    if (centerMapBtn) {
        centerMapBtn.addEventListener('click', centerHomepageMap);
    }
    
    // Klik di luar modal untuk menutup
    const osmMapModal = document.getElementById('osmMapModal');
    if (osmMapModal) {
        osmMapModal.addEventListener('click', function(e) {
            if (e.target === osmMapModal) {
                closeOsmMapModalFunc();
            }
        });
    }
    
    // Observer untuk halaman home
    observeHomePage();
    
    setupSidebarLinks();

// ========== SIDEBAR LINKS SETUP ==========
function setupSidebarLinks() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            setActiveMenu(this.dataset.page);
        });
    });
}

// ========== OBSERVE HOME PAGE ==========
function observeHomePage() {
    const homePage = document.getElementById('homePage');
    if (!homePage) return;
    
    if (homePage.style.display !== 'none') {
        setTimeout(() => {
            initHomepageMap();
        }, 500);
    }
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.style.display === 'block') {
                setTimeout(() => {
                    initHomepageMap();
                }, 300);
            }
        });
    });
    
    observer.observe(homePage, { attributes: true, attributeFilter: ['style'] });
}

setTimeout(() => {
    if (currentUser) {
        updateWalletVisibility();
    }
}, 500);

// ========== KOORDINAT DEFAULT ==========
const pekanbaruCoords = [0.5071, 101.4478];

// ========== Loading Animation ==========
function showLoading(show) {
    const loader = document.getElementById('loadingBackdrop');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// ========== Navigasi & Sidebar ==========
document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        setActiveMenu(this.dataset.page);
        // Di desktop, tidak perlu toggle mobile menu
    });
});

document.querySelectorAll('.bottom-nav-item').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        setActiveMenu(this.dataset.page);
    });
});

// ========== PERBAIKAN: Ubah function setActiveMenu menjadi async ==========
async function setActiveMenu(pageId) {
    // Sembunyikan semua halaman
    document.querySelectorAll('.page-main').forEach(p => {
        p.style.display = 'none';
    });

    // Load rating saat buka halaman Rating & Ulasan
    if (pageId === 'ratingPage') {
        if (currentUser && typeof loadReviews === 'function') {
            setTimeout(() => {
                loadReviews();
            }, 100);
        }
    }

    // Tampilkan halaman yang dipilih
    const targetEl = document.getElementById(pageId);
    if (targetEl) {
        targetEl.style.display = 'block';
        
        // Pastikan semua parent element tidak hidden
        let parent = targetEl.parentElement;
        while (parent && parent !== document.body) {
            const computed = window.getComputedStyle(parent);
            if (computed.display === 'none') {
                parent.style.display = 'block';
            }
            parent = parent.parentElement;
        }
    }

    // Update active state sidebar
    document.querySelectorAll('.sidebar-link').forEach(a => a.classList.remove('active'));
    document.querySelectorAll(`[data-page="${pageId}"]`).forEach(el => el.classList.add('active'));

    // Redirect analytics jika role requester
    if (currentUser && currentUser.role === 'requester' && pageId === 'analyticsPage') {
        document.getElementById('analyticsPage').style.display = 'none';
        setActiveMenu('homePage');
        alert('Halaman analitik hanya tersedia untuk Helper');
        return;
    }

    // Bersihkan konten job list saat bukan di jobsPage
    if (pageId !== 'jobsPage') {
        const tabbedMenus = document.querySelectorAll('.tabbed-menu');
        tabbedMenus.forEach(menu => {
            if (menu.closest('.page-main')?.id !== pageId) {
                // Jika menu ini bukan milik halaman yang aktif, pastikan tidak mengganggu
            }
        });
    }

    // Isi dropdown saat buka halaman Upload Bukti
    if (pageId === 'uploadBuktiPage') {
        if (typeof populateActiveJobsDropdown === 'function') {
            populateActiveJobsDropdown();
        }
    }

    // Load percakapan saat buka halaman Pesan
    if (pageId === 'messagesPage') {
        if (currentUser && typeof loadConversationsModern === 'function') {
            setTimeout(() => {
                loadConversationsModern();
            }, 100);
        }
    }

    // ========== PERBAIKAN: Load wallet saat buka halaman Dompet ==========
    if (pageId === 'walletPage') {
        if (currentUser) {
            // Gunakan loadWalletFromDB yang sudah ada, tapi tanpa await karena ini async
            // Atau gunakan .then() untuk menghindari error
            loadWalletFromDB().then(() => {
                loadWallet();
            }).catch(err => {
                console.error('Error loading wallet:', err);
            });
        }
    }
    
    // Load rating saat buka halaman Rating & Ulasan
    if (pageId === 'ratingPage') {
        if (currentUser && typeof loadReviews === 'function') {
            setTimeout(() => {
                loadReviews();
            }, 100);
        }
    }
    
    // TAMBAHKAN: Load rating saat buka beranda
    if (pageId === 'homePage') {
        if (currentUser && typeof syncRatingToBeranda === 'function') {
            setTimeout(() => {
                syncRatingToBeranda();
            }, 100);
        }
    }
    
    // Load pekerjaan saat buka halaman Pekerjaan Saya
    if (pageId === 'jobsPage') {
        if (typeof loadMyJobs === 'function') {
            loadMyJobs();
        }
    }
}

// ========== NOTIFIKASI YANG LEBIH BAIK ==========
function showNotification(message, type = 'info') {
    console.log('Showing notification:', { message, type });
    
    // Hapus notifikasi lama
    const existingNotification = document.querySelector('.custom-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Buat elemen notifikasi
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icon}"></i>
            <span>${escapeHtml(message)}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Styling
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '100000',
        background: type === 'success' ? 'linear-gradient(135deg, #4CAF50, #388E3C)' : 
                    (type === 'error' ? 'linear-gradient(135deg, #f44336, #d32f2f)' : 
                    'linear-gradient(135deg, #2196F3, #1976D2)'),
        color: 'white',
        padding: '14px 20px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px',
        minWidth: '300px',
        maxWidth: '450px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        animation: 'slideInRight 0.3s ease',
        fontSize: '0.9rem',
        fontFamily: 'Inter, sans-serif'
    });
    
    const contentDiv = notification.querySelector('.notification-content');
    if (contentDiv) {
        Object.assign(contentDiv.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        });
    }
    
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '1.3rem',
            cursor: 'pointer',
            padding: '0 5px',
            opacity: '0.8',
            transition: 'opacity 0.2s'
        });
        closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
        closeBtn.onmouseout = () => closeBtn.style.opacity = '0.8';
        closeBtn.onclick = () => notification.remove();
    }
    
    document.body.appendChild(notification);
    
    // Auto remove setelah 5 detik
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) notification.remove();
            }, 300);
        }
    }, 5000);
}

// Tambahkan CSS untuk animasi notifikasi
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .custom-notification {
        font-family: 'Inter', sans-serif;
    }
    
    .custom-notification.error {
        background: linear-gradient(135deg, #f44336, #d32f2f);
    }
    
    .custom-notification.success {
        background: linear-gradient(135deg, #4CAF50, #388E3C);
    }
    
    .custom-notification.info {
        background: linear-gradient(135deg, #2196F3, #1976D2);
    }
`;
document.head.appendChild(notificationStyle);

// ========== AFTER LOGIN - DENGAN FALLBACK KE SESSIONSTORAGE ==========
async function afterLogin() {
    console.log('afterLogin dipanggil', currentUser);
    
    // Jika currentUser null, coba ambil dari sessionStorage
    if (!currentUser) {
        console.log('currentUser is null, trying sessionStorage');
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
                window.currentUser = currentUser;
                console.log('✅ Loaded currentUser from sessionStorage:', currentUser);
            } catch(e) {
                console.error('Failed to parse stored user:', e);
            }
        }
    }
    
    if (!currentUser) {
        console.error('currentUser is null, cannot proceed');
        window.location.href = 'auth.html';
        return;
    }
    
    // Update profile elements
    const profileName = document.getElementById('profileName');
    const profileAvatar = document.getElementById('profileAvatar');
    
    if (profileName) {
        profileName.textContent = currentUser.name || currentUser.nama_lengkap || 'User';
        console.log('Profile name updated to:', profileName.textContent);
    }
    if (profileAvatar) {
        const name = currentUser.name || currentUser.nama_lengkap || 'U';
        profileAvatar.textContent = currentUser.avatar || name.charAt(0).toUpperCase();
        console.log('Profile avatar updated to:', profileAvatar.textContent);
    }
    
    // Cek apakah admin (seharusnya sudah di-redirect sebelumnya)
    if (currentUser.role === 'admin') {
        console.log('Admin detected in afterLogin, redirecting...');
        window.location.href = 'admin_dashboard.html';
        return;
    }
    
    // Set default role untuk user biasa
    if (currentUser.role === 'user') {
        currentUser.role = 'requester';
    }
    
    // Update wallet visibility
    const requesterBtn = document.getElementById('requesterBtn');
    const helperBtn = document.getElementById('helperBtn');
    const requesterView = document.getElementById('requesterView');
    const helperView = document.getElementById('helperView');
    
    if (requesterBtn && helperBtn && requesterView && helperView) {
        requesterBtn.classList.add('active');
        helperBtn.classList.remove('active');
        requesterView.style.display = 'block';
        helperView.style.display = 'none';
    }
    
    document.querySelectorAll('.helper-only').forEach(el => {
        el.style.display = 'none';
    });
    
    // Load data
    try {
        await loadWalletFromDB();
        updateWalletDisplay();
        updateWalletVisibility();
        await loadJobsFromDB();
        updateNotificationBadge();
        await syncRatingToBeranda();
        startNotificationPolling();
        if (typeof injectNotifBell === 'function') injectNotifBell();
    } catch(e) {
        console.error('Error loading data:', e);
    }
    
            // ===== UPDATE STATS =====
        setTimeout(() => {
            if (currentUser.role === 'helper') {
                updateHelperStats();
                // 🔥 JANGAN panggil updateHelperStatsFromTransactions di sini!
                // Nanti dipanggil di loadWallet() setelah data siap
            } else {
                updateRequesterStats();
            }
        }, 500);

    
    console.log('afterLogin selesai');
}

// ========== LOGOUT FUNCTION ==========
async function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        showLoading(true);
        try {
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

// Event listener untuk tombol logout di header
document.getElementById('logoutBtnHeader')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

// Update event listener requesterBtn
document.getElementById('requesterBtn').addEventListener('click', function() {
    document.getElementById('requesterView').style.display = 'block';
    document.getElementById('helperView').style.display = 'none';
    document.getElementById('requesterBtn').classList.add('active');
    document.getElementById('helperBtn').classList.remove('active');
    
    document.querySelectorAll('.helper-only').forEach(el => {
        el.style.display = 'none';
    });
    
    if (currentUser) {
        currentUser.role = 'requester';
    }
    
    updateWalletVisibility();
    updateWalletByRole();      // ← TAMBAHKAN: Update wallet berdasarkan role baru
    loadWallet();              // ← TAMBAHKAN: Refresh tampilan wallet
    loadRequesterJobs();
});

// Update event listener helperBtn
document.getElementById('helperBtn').addEventListener('click', function() {
    document.getElementById('requesterView').style.display = 'none';
    document.getElementById('helperView').style.display = 'block';
    document.getElementById('helperBtn').classList.add('active');
    document.getElementById('requesterBtn').classList.remove('active');
    
    document.querySelectorAll('.helper-only').forEach(el => {
        el.style.display = 'block';
    });
    
    if (currentUser) {
        currentUser.role = 'helper';
    }
    
    updateWalletVisibility();
    updateWalletByRole();      // ← TAMBAHKAN: Update wallet berdasarkan role baru
    loadWallet();              // ← TAMBAHKAN: Refresh tampilan wallet
    loadHelperJobs();
});

// ========== Modal ==========
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// openTopupModal didefinisikan di bawah (baris ~3228) — versi tunggal

function handleTopupSubmit(amount) {
    if (currentUser && currentUser.role === 'helper') {
        alert('Fitur Top Up hanya tersedia untuk akun Requester!');
        return;
    }
    
    // Validasi nominal khusus requester
    if (amount < 10000) {
        alert('Minimal Top Up untuk Requester adalah Rp 10.000');
        return;
    }
    if (amount > 1000000) {
        alert('Maksimal Top Up untuk Requester adalah Rp 1.0000.000');
        return;
    }
    
    // Lanjutkan proses fetch ke backend topup.php Anda...
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

async function processTopupDirect(nominal) {
    const fd = new FormData();
    fd.append('user_id', currentUser.id);
    fd.append('nominal', nominal);
    fd.append('method', 'qris');
    fd.append('target_role', 'requester');
    
    const response = await fetch('topup.php', { method: 'POST', body: fd });
    const result = await response.json();
    
    if (result.success) {
        alert('Top up berhasil!');
        await loadWalletFromDB();
        location.reload();
    } else {
        alert('Gagal: ' + result.message);
    }
}
    
// TAMPILKAN MODAL QRIS - VERSI SEDERHANA
function showQRISModal(requestId, nominal) {
    console.log('Menampilkan modal QRIS');
    
    // Ambil modal
    const modal = document.getElementById('qrisPaymentModal');
    
    if (!modal) {
        console.error('❌ Modal qrisPaymentModal tidak ditemukan!');
        alert('Error: Modal tidak ditemukan. Silakan refresh halaman.');
        return;
    }
    
    // Update info nominal
    const totalPayment = nominal + 2500;
    const amountDisplay = document.getElementById('qrisTotalAmount');
    if (amountDisplay) {
        amountDisplay.textContent = 'Rp ' + totalPayment.toLocaleString('id-ID');
    }
    
    // Update status
    const statusDiv = document.getElementById('paymentStatus');
    if (statusDiv) {
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '<span style="color: #d97706;">⏳ Menunggu Verifikasi Admin...</span>';
    }
    
    // Tampilkan modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Tutup modal topup
    const topupModal = document.getElementById('topupModal');
    if (topupModal) {
        topupModal.style.display = 'none';
    }
    
    console.log('✅ Modal QRIS ditampilkan untuk request:', requestId);
}

// ========== BUAT MODAL QRIS JIKA BELUM ADA ==========
function createQRISModal() {
    // Cek apakah modal sudah ada
    if (document.getElementById('qrisPaymentModal')) return;
    
    const modalHtml = `
    <div id="qrisPaymentModal" class="modal" style="display: none; position: fixed; z-index: 10001; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); align-items: center; justify-content: center;">
        <div class="modal-content" style="max-width: 450px; text-align: center; padding: 20px; background: white; border-radius: 16px;">
            <span class="close-modal" onclick="closeQRISModal()" style="float: right; font-size: 24px; cursor: pointer;">&times;</span>
            <h3 style="color: var(--primary); margin-bottom: 15px;">
                <i class="fas fa-qrcode"></i> Scan QRIS untuk Membayar
            </h3>
            
            <div id="qrisPaymentInfo" style="background: #f0f7ff; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                <div style="font-size: 1rem; margin-bottom: 5px;">Total yang harus dibayar:</div>
                <div id="qrisTotalAmount" style="font-size: 1.8rem; font-weight: 800; color: var(--primary);">Rp 0</div>
                <div style="font-size: 0.8rem; color: var(--gray); margin-top: 5px;">(Sudah termasuk biaya admin Rp 2.500)</div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 16px; border: 2px dashed var(--primary); margin-bottom: 20px;">
                <img id="qrisImage" src="qris2.jpeg" alt="QRIS Code" style="max-width: 250px; width: 100%; height: auto; margin: 0 auto; display: block;">
                <p style="margin-top: 15px; font-size: 0.8rem; color: var(--gray);">
                    Scan QR Code di atas menggunakan aplikasi mobile banking atau e-wallet
                </p>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button type="button" class="btn btn-outline" onclick="closeQRISModal()" style="flex: 1;">Batal</button>
                <button type="button" id="confirmPaymentBtn" class="btn btn-success" onclick="confirmTopupPayment()" style="flex: 2;">
                    <i class="fas fa-check-circle"></i> Konfirmasi Pembayaran
                </button>
            </div>
            
            <div id="paymentStatus" style="margin-top: 15px; display: none; padding: 10px; border-radius: 8px;"></div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    console.log('✅ Modal QRIS dibuat');
}

// Reset timer
function resetTopupTimer() {
    if (topupPaymentTimer) {
        clearInterval(topupPaymentTimer);
        topupPaymentTimer = null;
    }
    
    topupTimeLeft = 300;
    updateTopupTimerDisplay();
    
    topupPaymentTimer = setInterval(function() {
        topupTimeLeft--;
        updateTopupTimerDisplay();
        
        if (topupTimeLeft <= 0) {
            clearInterval(topupPaymentTimer);
            topupPaymentTimer = null;
            handleTopupPaymentExpired();
        }
    }, 1000);
}

function updateTopupTimerDisplay() {
    const minutes = Math.floor(topupTimeLeft / 60);
    const seconds = topupTimeLeft % 60;
    const timerElement = document.getElementById('paymentTimer');
    
    if (timerElement) {
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (topupTimeLeft <= 60) {
            timerElement.style.color = '#dc3545';
        } else {
            timerElement.style.color = '#28a745';
        }
    }
}

function handleTopupPaymentExpired() {
    const statusDiv = document.getElementById('paymentStatus');
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    
    if (statusDiv) {
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '<span style="color: #dc3545;"><i class="fas fa-times-circle"></i> Waktu pembayaran habis. Silakan ulangi proses top up.</span>';
    }
    
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
    }
}

// Confirm Topup Payment
async function confirmTopupPayment() {
    if (topupTimeLeft <= 0) {
        showNotification('Waktu pembayaran telah habis. Silakan ulangi proses top up.', 'error');
        closeQRISModal();
        return;
    }
    
    if (currentTopupNominal < 10000) {
        showNotification('Nominal tidak valid', 'error');
        return;
    }
    
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    const statusDiv = document.getElementById('paymentStatus');
    
    // Disable button and show loading
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    
    if (statusDiv) {
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '<span style="color: #17a2b8;"><i class="fas fa-spinner fa-spin"></i> Memverifikasi pembayaran...</span>';
    }
    
    // Show loading backdrop
    if (document.getElementById('loadingBackdrop')) {
        document.getElementById('loadingBackdrop').style.display = 'flex';
    }
    
    try {
        let formData = new FormData();
        formData.append('user_id', currentUser.id);
        formData.append('nominal', currentTopupNominal);
        formData.append('method', 'qris');
        formData.append('target_role', 'requester');
        
        let response = await fetch('topup.php', {
            method: 'POST',
            body: formData
        });
        
        let result = await response.json();
        
        if (result.success) {
            // Update status
            if (statusDiv) {
                statusDiv.innerHTML = '<span style="color: #28a745;"><i class="fas fa-check-circle"></i> Pembayaran berhasil! Memperbarui saldo...</span>';
            }
            
            // Refresh wallet data
            await loadWalletFromDB();
            
            // Show success notification
            showNotification(result.message || 'Top up berhasil! Saldo Anda telah bertambah.', 'success');
            
            // Close QRIS modal after delay
            setTimeout(() => {
                closeQRISModal();
                
                // Refresh wallet page if open
                if (document.getElementById('walletPage').style.display === 'block') {
                    loadWallet();
                }
            }, 1500);
            
        } else {
            // Show error
            if (statusDiv) {
                statusDiv.innerHTML = '<span style="color: #dc3545;"><i class="fas fa-exclamation-circle"></i> ' + (result.message || 'Pembayaran gagal') + '</span>';
            }
            showNotification('Top up gagal: ' + result.message, 'error');
            
            // Re-enable button
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Konfirmasi Pembayaran';
        }
        
    } catch (error) {
        console.error('Error:', error);
        if (statusDiv) {
            statusDiv.innerHTML = '<span style="color: #dc3545;"><i class="fas fa-exclamation-circle"></i> Terjadi kesalahan. Silakan coba lagi.</span>';
        }
        showNotification('Terjadi kesalahan saat memproses top up', 'error');
        
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Konfirmasi Pembayaran';
        
    } finally {
        if (document.getElementById('loadingBackdrop')) {
            document.getElementById('loadingBackdrop').style.display = 'none';
        }
        
        // Stop timer
        if (topupPaymentTimer) {
            clearInterval(topupPaymentTimer);
            topupPaymentTimer = null;
        }
    }
}

// Close QRIS Modal
function closeQRISModal() {
    // Reset timer
    if (topupPaymentTimer) {
        clearInterval(topupPaymentTimer);
        topupPaymentTimer = null;
    }
    
    // Reset status
    const statusDiv = document.getElementById('paymentStatus');
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    
    if (statusDiv) {
        statusDiv.style.display = 'none';
        statusDiv.innerHTML = '';
    }
    
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Konfirmasi Pembayaran';
    }
    
    // Reset current nominal
    currentTopupNominal = 0;
    
    // Close modal
    closeModal('qrisPaymentModal');
    
    // Reset form topup
    const topupInput = document.getElementById('topupNominal');
    if (topupInput) topupInput.value = '';
    
    const summaryNominal = document.getElementById('summaryNominal');
    const topupReceived = document.getElementById('topupReceivedAmount');
    if (summaryNominal) summaryNominal.textContent = 'Rp 0';
    if (topupReceived) topupReceived.textContent = 'Rp 0';
}

// ========== WALLET FUNCTIONS ==========
function formatRupiah(angka) {
    if (angka === undefined || angka === null) return '0';
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ========== PERBAIKAN loadWalletFromDB ==========
async function loadWalletFromDB() {
    if (!currentUser) {
        console.log('loadWalletFromDB: No current user');
        return;
    }
    
    console.log('Loading wallet for user:', currentUser.id, 'role:', currentUser.role);
    
    try {
        const response = await fetch(`get_wallet.php?user_id=${currentUser.id}&role=${currentUser.role}&t=${Date.now()}`);
        const result = await response.json();
        
        console.log('Wallet API response:', result);
        
        if (result.success) {
            // Update wallet balances
            if (result.wallet_requester !== undefined) {
                currentUser.wallet_requester = result.wallet_requester;
            }
            if (result.wallet_helper !== undefined) {
                currentUser.wallet_helper = result.wallet_helper;
            }
            
            // ========== PERBAIKAN: Ambil transaksi ==========
            // Langsung gunakan transactions dari response
            const transactions = result.transactions || [];
            
            // Simpan ke global variable
            window.walletTransactions = transactions;
            
            // Update balance berdasarkan role
            if (currentUser.role === 'requester') {
                walletBalance = currentUser.wallet_requester || 0;
            } else {
                walletBalance = currentUser.wallet_helper || 0;
            }
            
            console.log(`✅ Loaded ${transactions.length} transactions`);
            
            // Update UI
            updateWalletDisplay();
            
            // Refresh wallet history
            if (typeof loadWallet === 'function') {
                loadWallet();
            }
            
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

// ========== UPDATE WALLET BERDASARKAN ROLE ==========
function updateWalletByRole() {
    if (!currentUser) return;
    
    const isRequester = currentUser.role === 'requester';
    
    if (isRequester) {
        walletBalance = currentUser.wallet_requester || 0;
        walletTransactions = currentUser.wallet_requester_transactions || [];
        console.log('Using requester wallet, balance:', walletBalance, 'transactions:', walletTransactions.length);
    } else {
        walletBalance = currentUser.wallet_helper || 0;
        walletTransactions = currentUser.wallet_helper_transactions || [];
        console.log('Using helper wallet, balance:', walletBalance, 'transactions:', walletTransactions.length);
    }
}

// ========== loadWallet DENGAN FILTER ROLE ==========
// ========== LOAD WALLET DENGAN FILTER ROLE ==========
function loadWallet() {
    if (!currentUser) return;
    
    const role = currentUser.role;
    console.log(`Loading wallet for role: ${role}`);
    
    fetch(`get_wallet.php?user_id=${currentUser.id}&role=${role}&t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                console.error('Failed to load wallet:', data.message);
                return;
            }
            
            console.log('Wallet data received:', data);
            
            // Update transactions
            window.walletTransactions = data.transactions || [];
            
            // Update balance display berdasarkan role
            const balanceEl = document.getElementById('walletBalance');
            if (balanceEl) {
                balanceEl.textContent = 'Rp ' + (data.balance || 0).toLocaleString('id-ID');
            }
            
            // Update wallet cards
            const walletRequesterPage = document.getElementById('walletRequesterPage');
            const walletHelperPage = document.getElementById('walletHelperPage');
            
            if (walletRequesterPage && data.wallet_requester !== undefined) {
                walletRequesterPage.textContent = 'Rp ' + data.wallet_requester.toLocaleString('id-ID');
            }
            if (walletHelperPage && data.wallet_helper !== undefined) {
                walletHelperPage.textContent = 'Rp ' + data.wallet_helper.toLocaleString('id-ID');
            }
            
            // Update sidebar
            const walletRequesterSidebar = document.getElementById('walletRequesterSidebar');
            const walletHelperSidebar = document.getElementById('walletHelperSidebar');
            
            if (walletRequesterSidebar && data.wallet_requester !== undefined) {
                walletRequesterSidebar.textContent = 'Rp ' + data.wallet_requester.toLocaleString('id-ID');
            }
            if (walletHelperSidebar && data.wallet_helper !== undefined) {
                walletHelperSidebar.textContent = 'Rp ' + data.wallet_helper.toLocaleString('id-ID');
            }
            
            // Update history table
            const historyTable = document.getElementById('walletHistory');
            if (historyTable) {
                historyTable.innerHTML = '';
                
                if (data.transactions.length === 0) {
                    historyTable.innerHTML = `
                        <tr>
                            <td colspan="4" style="text-align:center;padding:40px;">
                                <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                                Belum ada transaksi untuk role ${role}
                            </td>
                        </tr>
                    `;
                } else {
                    data.transactions.forEach(trans => {
                        const row = historyTable.insertRow();
                        const isPositive = trans.amount.startsWith('+');
                        const amountClass = isPositive ? 'text-success' : 'text-danger';
                        const amountColor = isPositive ? '#28a745' : '#dc3545';
                        
                        row.innerHTML = `
                            <td style="padding:12px;">${trans.date || trans.created_at.split(' ')[0]}</td>
                            <td style="padding:12px;">${escapeHtml(trans.description)}</td>
                            <td style="padding:12px;text-align:right;color:${amountColor};font-weight:600;">${trans.amount}</td>
                            <td style="padding:12px;text-align:right;">
                                <span class="badge ${trans.status === 'Sukses' ? 'badge-success' : 'badge-warning'}">${trans.status}</span>
                            </td>
                        `;
                    });
                }
            }
            
                        // ================================================================
            // 🔥 UPDATE STATS - DIPANGGIL SETELAH DATA SIAP!
            // ================================================================
            if (currentUser.role === 'requester') {
                updateRequesterStats();
            } else if (currentUser.role === 'helper') {
                updateHelperStats();
                updateHelperStatsFromTransactions(); // 🔥 INI YANG UTAMA!
            }
            
            // Update visibility
            updateWalletVisibility();
            
            console.log(`✅ Loaded ${data.transactions.length} transactions for ${role}`);
        })
        .catch(err => console.error('Error loading wallet:', err));
}

// ========== TOPUP ==========
let selectedTopupMethod = null;

document.querySelectorAll('.topup-method').forEach(el => {
    el.onclick = function() {
        // Hapus class 'selected' sesuai dengan CSS aslimu
        document.querySelectorAll('.topup-method').forEach(m => m.classList.remove('selected'));
        this.classList.add('selected');
        
        selectedTopupMethod = this.dataset.method;
        
        // Logika Tampilkan/Sembunyikan Virtual Account Bank
        document.getElementById('topupVALIST').style.display = (selectedTopupMethod === 'va') ? 'block' : 'none';
        
        // LOGIKA BARU: Tampilkan/Sembunyikan Gambar QRIS secara dinamis
        const qrisContainer = document.getElementById('qrisPaymentContainer');
        if (qrisContainer) {
            qrisContainer.style.display = (selectedTopupMethod === 'qris') ? 'block' : 'none';
        }
    };
});

// Submit top up (Manual 1x24 Jam)
document.getElementById('topupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Anda harus login terlebih dahulu', 'error');
        return;
    }
    
    if (currentUser.role !== 'requester') {
        showNotification('Hanya Requester yang dapat melakukan top up', 'error');
        return;
    }
    
    let nominalString = document.getElementById('topupNominal').value.replace(/\./g, '');
    let nominal = parseInt(nominalString) || 0;
    
    if (nominal < 10000) {
        showNotification('Minimal top up Rp 10.000', 'error');
        return;
    }
    
    const walletTarget = document.getElementById('walletTarget')?.value || 'requester';
    let method = selectedTopupMethod;
    if (selectedTopupMethod === 'va') {
        let bank = document.getElementById('vaBank').value;
        method = 'va_' + bank;
    }
    
    if (!method) {
        showNotification('Pilih metode pembayaran terlebih dahulu', 'error');
        return;
    }
    
    showLoading();
    
    let formData = new FormData();
    formData.append('user_id', currentUser.id);
    formData.append('nominal', nominal);
    formData.append('method', method);
    formData.append('target_role', walletTarget);
    
    try {
        let response = await fetch('topup.php', {
            method: 'POST',
            body: formData
        });
        
        let result = await response.json();
        
        // Di dalam topupForm submit
// Di dalam topupForm submit
if (result.success) {
    closeModal('topupModal');
    showNotification(result.message || 'Top up berhasil!', 'success');
    
    // Refresh wallet data
    await loadWalletFromDB();
    
    // Also refresh jobs if needed
    if (typeof loadJobsFromDB === 'function') {
        await loadJobsFromDB();
    }
}
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan saat top up', 'error');
    } finally {
        document.getElementById('loadingBackdrop').style.display = 'none';
    }
});

// ========== DEBUG WALLET ==========
function debugWallet() {
    console.log('=== WALLET DEBUG ===');
    console.log('currentUser:', currentUser);
    console.log('walletBalance:', walletBalance);
    console.log('walletTransactions:', walletTransactions);
    console.log('Transactions count:', walletTransactions?.length);
    
    const historyEl = document.getElementById('walletHistory');
    console.log('walletHistory element:', historyEl);
    
    if (historyEl) {
        console.log('Current HTML:', historyEl.innerHTML.substring(0, 500));
    }
    
    // Test fetch langsung ke API
    if (currentUser) {
        fetch(`get_wallet.php?user_id=${currentUser.id}&role=${currentUser.role}`)
            .then(r => r.json())
            .then(data => {
                console.log('Raw API response:', data);
                console.log('Transactions from API:', data.transactions || data.history || data.data);
            })
            .catch(e => console.error('API fetch error:', e));
    }
}

// ========== UPDATE WALLET DISPLAY ==========
function updateWalletDisplay() {
    if (!currentUser) return;
    
    const format = (num) => 'Rp ' + formatRupiah(num || 0);
    
    console.log('Updating wallet display - Requester:', currentUser.wallet_requester, 'Helper:', currentUser.wallet_helper);
    
    // Update sidebar wallets
    const walletRequesterSidebar = document.getElementById('walletRequesterSidebar');
    const walletHelperSidebar = document.getElementById('walletHelperSidebar');
    
    if (walletRequesterSidebar) {
        walletRequesterSidebar.textContent = format(currentUser.wallet_requester);
    }
    if (walletHelperSidebar) {
        walletHelperSidebar.textContent = format(currentUser.wallet_helper);
    }
    
    // Update modal wallet balance
    const modalWalletBalance = document.getElementById('modalWalletBalance');
    if (modalWalletBalance) {
        modalWalletBalance.textContent = format(currentUser.wallet_requester);
    }
    
    // Update wallet page cards
    const walletRequesterPage = document.getElementById('walletRequesterPage');
    const walletHelperPage = document.getElementById('walletHelperPage');
    
    if (walletRequesterPage) {
        walletRequesterPage.textContent = format(currentUser.wallet_requester);
    }
    if (walletHelperPage) {
        walletHelperPage.textContent = format(currentUser.wallet_helper);
    }
    
    // Update modal wallet helper
    const modalWalletHelper = document.getElementById('modalWalletHelper');
    if (modalWalletHelper) {
        modalWalletHelper.textContent = format(currentUser.wallet_helper);
    }
    
    // Update active wallet balance
    const walletBalanceEl = document.getElementById('walletBalance');
    if (walletBalanceEl) {
        if (currentUser.role === 'requester') {
            walletBalanceEl.textContent = format(currentUser.wallet_requester);
        } else if (currentUser.role === 'helper') {
            walletBalanceEl.textContent = format(currentUser.wallet_helper);
        }
    }
    
    // Update visibility
    updateWalletVisibility();
}

// ========== BERANDA (homePage) ==========
function loadRequesterJobs() {
    const jobList = document.getElementById('requesterJobList');
    if (!jobList) return;
    jobList.innerHTML = '';
    
    let filteredJobs = jobs.filter(job => job.user_id === currentUser?.id);
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const catFilter = document.getElementById('categoryFilter')?.value || 'all';
    const sort = document.getElementById('sortFilter')?.value || 'newest';
    
    if (statusFilter !== 'all') filteredJobs = filteredJobs.filter(job => job.status === statusFilter);
    if (catFilter !== 'all') filteredJobs = filteredJobs.filter(job => job.category === catFilter);
    
    if (sort === 'newest') filteredJobs = filteredJobs.slice().reverse();
    if (sort === 'oldest') filteredJobs = filteredJobs.slice();
    if (sort === 'price-high') filteredJobs = filteredJobs.slice().sort((a, b) => b.price - a.price);
    if (sort === 'price-low') filteredJobs = filteredJobs.slice().sort((a, b) => a.price - b.price);
    
    const activeCount = document.getElementById('activeJobsCount');
    if (activeCount) activeCount.textContent = filteredJobs.length;
    
    if (filteredJobs.length === 0) {
        jobList.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 24px;">
        <i class="fas fa-inbox" style="font-size: 3.5rem; color: #cbd5e1; margin-bottom: 16px; display: block;"></i>
        <h3 style="font-size: 1.2rem; font-weight: 600; color: var(--dark); margin-bottom: 8px;">Tidak ada permintaan bantuan</h3>
        <p style="font-size: 0.9rem; color: var(--gray);">Buat permintaan pertama Anda dengan klik tombol "Buat Permintaan Bantuan"</p>
    </div>`;
        return;
    }
    
    filteredJobs.forEach(job => {
        const jobCard = createJobCard(job, job.status === 'in-progress');
        jobList.appendChild(jobCard);
    });
}


function loadHelperJobs() {
    console.log('loadHelperJobs dipanggil');
    
    const jobListContainer = document.getElementById('helperJobList');
    if (!jobListContainer) {
        console.error('helperJobList tidak ditemukan');
        return;
    }
    
    // Reset container
    jobListContainer.innerHTML = '';
    jobListContainer.style.cssText = '';
    jobListContainer.className = 'job-list';
    
    // PERBAIKAN: Filter jobs - HAPUS pending_acc dari helper jobs
    // Helper tidak boleh melihat pending_acc karena itu untuk requester ACC
    let openJobs = jobs.filter(job => job.status === 'open');
    let inProgressJobs = jobs.filter(job => ['in-progress','ongoing'].includes(job.status) && job.helper_id === currentUser?.id);
    let perbaikanJobs  = jobs.filter(job => job.status === 'perbaikan' && job.helper_id === currentUser?.id);
    // pending_acc TIDAK dimasukkan ke helper jobs
    
    // Filter kategori
    const cat = document.getElementById('helperCategoryFilter')?.value || 'all';
    const sort = document.getElementById('helperSortFilter')?.value || 'newest';
    
    if (cat !== 'all') {
        openJobs = openJobs.filter(job => job.category === cat);
        inProgressJobs = inProgressJobs.filter(job => job.category === cat);
    }
    
    // Sorting
    if (sort === 'newest') {
        openJobs = openJobs.slice().reverse();
        inProgressJobs = inProgressJobs.slice().reverse();
    } else if (sort === 'price-high') {
        openJobs = openJobs.slice().sort((a, b) => b.price - a.price);
        inProgressJobs = inProgressJobs.slice().sort((a, b) => b.price - a.price);
    } else if (sort === 'price-low') {
        openJobs = openJobs.slice().sort((a, b) => a.price - b.price);
        inProgressJobs = inProgressJobs.slice().sort((a, b) => a.price - b.price);
    }
    
    // Jika tidak ada pekerjaan
    if (openJobs.length === 0 && inProgressJobs.length === 0 && perbaikanJobs.length === 0) {
        jobListContainer.innerHTML = `
             <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 24px;">
            <i class="fas fa-search" style="font-size: 3.5rem; color: #cbd5e1; margin-bottom: 16px; display: block;"></i>
            <h3 style="font-size: 1.2rem; font-weight: 600; color: var(--dark); margin-bottom: 8px;">Tidak ada pekerjaan tersedia</h3>
            <p style="font-size: 0.9rem; color: var(--gray);">Saat ini tidak ada pekerjaan yang tersedia di sekitar Anda.</p>
        </div>
        `;
        return;
    }
    
    // Pekerjaan perlu perbaikan (upload ulang)
    if (perbaikanJobs.length > 0) {
        const hdr1 = document.createElement('div');
        hdr1.innerHTML = `<div style="grid-column:1/-1;padding:8px 4px;font-weight:700;color:#e67e22;font-size:13px;display:flex;align-items:center;gap:6px;"><i class="fas fa-exclamation-triangle"></i> Perlu Upload Ulang (${perbaikanJobs.length})</div>`;
        jobListContainer.appendChild(hdr1);
        perbaikanJobs.forEach(job => {
            const card = createJobCard(job, true);
            jobListContainer.appendChild(card);
        });
    }

    // Tampilkan pekerjaan sedang berjalan
    if (inProgressJobs.length > 0) {
        inProgressJobs.forEach(job => {
            jobListContainer.appendChild(createJobCard(job, true));
        });
    }
    
    // Tampilkan pekerjaan tersedia
    if (openJobs.length > 0) {
        openJobs.forEach(job => {
            jobListContainer.appendChild(createJobCard(job, false));
        });
    }
    
    console.log('Helper jobs loaded - total cards:', jobListContainer.children.length);
}

// Helper function untuk membuat job card
function createJobCard(job, isInProgress) {
    const jobCard = document.createElement('div');
    jobCard.className = 'job-card';
    jobCard.onclick = function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return;
        }
        viewJobDetail(job.id);
    };
    
    // Cek gambar
    let hasImage = false;
    let imageUrl = '';
    
    if (job.image_path && job.image_path !== null && job.image_path !== '') {
        imageUrl = job.image_path;
        hasImage = true;
    }
    
    // HTML untuk gambar
    let imageHtml = '';
    if (hasImage && imageUrl) {
        imageHtml = `<img src="${imageUrl}" alt="${escapeHtml(job.title)}" onerror="this.parentElement.innerHTML='<div class=\'no-image\'><i class=\'fas fa-image\'></i><span>Gambar error</span></div>'">`;
    } else {
        imageHtml = `
            <div class="no-image">
                <i class="fas fa-image"></i>
                <span>Tidak ada gambar</span>
            </div>
        `;
    }
    
    // Emergency badge
    const emergencyBadge = job.emergency ? '<div class="emergency-badge">🚨 Emergency</div>' : '';
    const statusBadge = isInProgress ? '<div class="emergency-badge" style="background: #ff9800;">🔄 Sedang Berjalan</div>' : '';
    
    // Format harga
    const formattedPrice = 'Rp ' + (job.price || 0).toLocaleString('id-ID');
    
    // ========== DESKRIPSI - MAX 20 KATA ==========
    let shortDescription = '';
    if (job.description) {
        // Pisahkan kata-kata
        const words = job.description.trim().split(/\s+/);
        if (words.length > 20) {
            // Ambil 20 kata pertama lalu tambah ...
            const limitedWords = words.slice(0, 20);
            shortDescription = limitedWords.join(' ') + '...';
        } else {
            shortDescription = job.description;
        }
        // Batasi juga panjang karakter maksimal 150 char
        if (shortDescription.length > 150) {
            shortDescription = shortDescription.substring(0, 150) + '...';
        }
    }
    
    // Lokasi pendek
    const shortLocation = job.location ? (job.location.length > 35 ? job.location.substring(0, 35) + '...' : job.location) : 'Lokasi tidak tersedia';
    
    // Actions
    let actionsHtml = '';
    const isHelper    = currentUser?.role === 'helper';
    const isRequester = currentUser?.role === 'requester';

    if (job.status === 'perbaikan' && isHelper && job.helper_id === currentUser?.id) {
        actionsHtml = `
        <div class="job-card-actions">
            <button class="btn btn-primary" style="background:#e67e22;border-color:#e67e22;" onclick="event.stopPropagation(); openUploadBuktiModal(${job.id})">
                <i class="fas fa-redo"></i> Upload Ulang
            </button>
            <button class="btn btn-outline" onclick="event.stopPropagation(); openReportModal(${job.id})">
                <i class="fas fa-flag"></i> Laporkan
            </button>
        </div>`;
    } else if (isInProgress) {
        actionsHtml = `
        <div class="job-card-actions">
            <button class="btn btn-primary" style="background-color: #3ECF8E; border-color: #3ECF8E;" onclick="event.stopPropagation(); openUploadBuktiModal(${job.id})">
                <i class="fas fa-cloud-upload-alt"></i> Selesai
            </button>
            <button class="btn btn-outline" onclick="event.stopPropagation(); startChatWithRequester(${job.id}, ${job.user_id}, '${escapeHtml(job.requester_name || 'Requester')}', '${escapeHtml(job.title)}')">
                <i class="fas fa-comment"></i> Chat
            </button>
        </div>`;
    } else {
        actionsHtml = `
        <div class="job-card-actions">
            <button class="btn btn-primary" onclick="event.stopPropagation(); takeJob(${job.id})">
                Ambil
            </button>
            <button class="favorite-btn ${job.favorite ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${job.id})">
                <i class="${job.favorite ? 'fas' : 'far'} fa-heart"></i>
            </button>
        </div>`;
    }
    jobCard.innerHTML = `
        <div class="job-card-image">
            ${emergencyBadge}
            ${statusBadge}
            ${imageHtml}
            <button class="favorite-btn-img ${job.favorite ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${job.id})">
                <i class="${job.favorite ? 'fas' : 'far'} fa-heart"></i>
            </button>
        </div>
        <div class="job-card-info">
            <div class="job-card-category">
                <i class="fas fa-tag"></i> ${getCategoryName(job.category)}
            </div>
            <div class="job-card-title">${escapeHtml(job.title)}</div>
            <div class="job-card-price">${formattedPrice}</div>
            <div class="job-card-location">
                <i class="fas fa-map-marker-alt"></i> <span>${escapeHtml(shortLocation)}</span>
            </div>
            <!-- DESKRIPSI - Maksimal 20 kata -->
            ${shortDescription ? `<div class="job-card-description">📝 ${escapeHtml(shortDescription)}</div>` : ''}
            <div class="job-card-footer">
                <div class="job-card-requester">
                    <i class="fas fa-user-circle"></i> ${escapeHtml(job.requester_name || 'Anonymous')}
                </div>
                ${actionsHtml}
            </div>
        </div>
    `;
    
    return jobCard;
}

function viewJobDetail(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    document.getElementById('detailJobTitle').textContent = job.title;
    document.getElementById('detailJobCategory').textContent = getCategoryName(job.category);
    document.getElementById('detailJobLocation').textContent = job.location;
    document.getElementById('detailJobPrice').textContent = `Rp ${job.price.toLocaleString('id-ID')}`;
    document.getElementById('detailJobDescription').textContent = job.description;
    document.getElementById('detailJobDate').textContent = job.date;
    document.getElementById('detailJobStatus').textContent = getStatusName(job.status);
    document.getElementById('detailJobBadge').innerHTML = job.emergency ? '<div class="emergency-badge">Emergency</div>' : '';
    
    const mapContainer = document.getElementById('detailJobMap');
    mapContainer.innerHTML = '<div id="jobMap" style="height:100%;"></div>';
    
    setTimeout(() => {
        const map = L.map('jobMap').setView(pekanbaruCoords, 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        const randomOffset = () => (Math.random() - 0.5) * 0.1;
        const jobCoords = [pekanbaruCoords[0] + randomOffset(), pekanbaruCoords[1] + randomOffset()];
        
        L.marker(jobCoords).addTo(map)
            .bindPopup(job.location)
            .openPopup();
    }, 100);
    
    const actionBtn = document.getElementById('detailActionBtn');
    const favoriteBtn = document.getElementById('detailFavoriteBtn');
    
    if (document.getElementById('requesterView').style.display !== 'none') {
        actionBtn.textContent = 'Edit';
        actionBtn.onclick = function() { editJob(jobId); };
        actionBtn.style.display = "inline-block";
    } else {
        actionBtn.textContent = 'Ambil Pekerjaan';
        actionBtn.onclick = function() { takeJob(jobId); };
        actionBtn.style.display = "inline-block";
    }
    
    favoriteBtn.innerHTML = job.favorite ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    favoriteBtn.className = `btn btn-outline favorite-btn ${job.favorite ? 'active' : ''}`;
    favoriteBtn.onclick = function() { toggleFavorite(jobId); };
    favoriteBtn.style.display = "inline-block";
    
    openModal('jobDetailModal');
}

async function takeJob(jobId) {
    if (!currentUser) {
        showNotification('Anda harus login terlebih dahulu', 'error');
        return;
    }
    
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
        showNotification('Pekerjaan tidak ditemukan', 'error');
        return;
    }
    
    if (!confirm(`Apakah Anda yakin ingin mengambil pekerjaan "${job.title}"?`)) {
        return;
    }
    
    showLoading();
    
    let formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('action', 'take');
    formData.append('user_id', currentUser.id);
    
    try {
        let response = await fetch('update_job.php', {
            method: 'POST',
            body: formData
        });
        
        let result = await response.json();
        
        if (result.success) {
            // Update status job di array jobs
            job.status = 'in-progress';
            job.helper_id = currentUser.id;
            
            showNotification(`Anda berhasil mengambil pekerjaan "${job.title}"!`, 'success');
            
            // Refresh semua data dari database
            await loadJobsFromDB();
            
            // Refresh tampilan MY JOBS (Pekerjaan Saya - tab Aktif)
            await loadMyJobs();
            
            // Refresh tampilan helper jobs di beranda
            await loadHelperJobs();
            
            // Refresh tampilan requester jobs di beranda
            await loadRequesterJobs();
            
            // Tutup modal detail jika terbuka
            closeModal('jobDetailModal');
            
        } else {
            showNotification('Gagal: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan saat mengambil pekerjaan', 'error');
    } finally {
        document.getElementById('loadingBackdrop').style.display = 'none';
    }
}

function editJob(jobId) {
    if (currentUser && currentUser.role === 'helper') {
        alert('Maaf, Helper tidak dapat mengedit pekerjaan. Fitur ini hanya tersedia untuk Requester.');
        return;
    }
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    alert(`Fitur edit untuk pekerjaan "${job.title}" akan segera tersedia!`);
    closeModal('jobDetailModal');
}

function filterJobs() { loadRequesterJobs(); }
function filterHelperJobs() { loadHelperJobs(); }

function getCategoryName(category) {
    const categories = { 
        'moving': 'Pindahan', 
        'delivery': 'Pengiriman', 
        'transport': 'Antar Jemput', 
        'event': 'Jaga Acara', 
        'other': 'Lainnya', 
        'tools': 'Perbaikan',
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
        'open':        'Terbuka',
        'in-progress': 'Dalam Proses',
        'ongoing':     'Dalam Proses',
        'pending_acc': 'Menunggu ACC',
        'perbaikan':   'Perlu Perbaikan',
        'completed':   'Selesai'
    };
    return statuses[status] || status;
}

async function loadJobsFromDB() {
    if (!currentUser) return;
    
    try {
        // 1. Load pekerjaan yang dibuat oleh user ini (untuk requester view)
        let myJobsResponse = await fetch(`get_jobs.php?type=requester&user_id=${currentUser.id}`);
        let myJobsResult = await myJobsResponse.json();
        
        // 2. Load SEMUA pekerjaan yang statusnya 'open' (untuk helper view)
        let openJobsResponse = await fetch('get_jobs.php?type=open');
        let openJobsResult = await openJobsResponse.json();
        
        // 3. Load pekerjaan yang sedang dikerjakan oleh user ini sebagai helper
        let helperJobsResponse = await fetch(`get_jobs.php?type=helper&user_id=${currentUser.id}`);
        let helperJobsResult = await helperJobsResponse.json();
        
        // PERBAIKAN: Load juga semua pending_acc jobs untuk requester
        let pendingJobsResponse = await fetch('get_jobs.php?type=pending');
        let pendingJobsResult = await pendingJobsResponse.json();
        
        let allJobs = [];
        
        if (myJobsResult.success) {
            allJobs = [...allJobs, ...myJobsResult.jobs];
        }
        
        if (openJobsResult.success) {
            for (let job of openJobsResult.jobs) {
                if (!allJobs.some(existing => existing.id === job.id)) {
                    allJobs.push(job);
                }
            }
        }
        
        if (helperJobsResult.success) {
            for (let job of helperJobsResult.jobs) {
                if (!allJobs.some(existing => existing.id === job.id)) {
                    allJobs.push(job);
                }
            }
        }
        
        // PERBAIKAN: Tambahkan pending jobs
        if (pendingJobsResult.success) {
            for (let job of pendingJobsResult.jobs) {
                if (!allJobs.some(existing => existing.id === job.id)) {
                    allJobs.push(job);
                }
            }
        }
        
        jobs = allJobs;
        
        console.log('=== JOBS DEBUG ===');
        console.log('Total jobs loaded:', jobs.length);
        console.log('Jobs with status pending_acc:', jobs.filter(j => j.status === 'pending_acc').length);
        console.log('Current user role:', currentUser.role);
        console.log('Current user id:', currentUser.id);
        
        // Log semua pending_acc jobs
        jobs.filter(j => j.status === 'pending_acc').forEach(job => {
            console.log(`- Pending ACC: Job #${job.id}, user_id:${job.user_id}, helper_id:${job.helper_id}, completion_image:${job.completion_image ? 'ADA' : 'TIDAK ADA'}`);
        });
        
        loadRequesterJobs();
        loadHelperJobs();
        loadMyJobs();      // PERBAIKAN: Panggil loadMyJobs setelah jobs diupdate
        loadHistory();
        loadFavorites();
        
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
}

window.addEventListener('resize', function() {
    console.log('Window resized - desktop mode active');
});

// ========== Pekerjaan Saya ==========
// ========== Pekerjaan Saya ==========
function loadMyJobs() {
    if (!currentUser) return;
    
    const isHelper = currentUser?.role === 'helper';
    
    // Filter pekerjaan aktif (in-progress/ongoing)
    let active = isHelper
        ? jobs.filter(j => (j.status === 'in-progress' || j.status === 'ongoing') && j.helper_id === currentUser?.id)
        : jobs.filter(j => (j.status === 'open' || j.status === 'in-progress' || j.status === 'ongoing') && j.user_id === currentUser?.id);
    
    // PERBAIKAN: Filter pending ACC - hanya untuk requester
    // Helper TIDAK perlu melihat pending_acc di tab mereka
    let pendingAcc = [];
    if (!isHelper) {
        // Requester melihat pending_acc dari job mereka
        pendingAcc = jobs.filter(j => {
            if (j.status !== 'pending_acc') return false;
            return j.user_id === currentUser?.id;
        });
    }
    
    // Filter perbaikan (hanya helper, untuk job yang perlu upload ulang)
    let perbaikan = isHelper
        ? jobs.filter(j => j.status === 'perbaikan' && j.helper_id === currentUser?.id)
        : [];
    
    // Filter selesai
    let complete = isHelper
        ? jobs.filter(j => j.status === 'completed' && j.helper_id === currentUser?.id)
        : jobs.filter(j => j.status === 'completed' && j.user_id === currentUser?.id);
    
    // Filter pencarian
    let q1 = (document.getElementById('myJobSearch') || { value: "" }).value.toLowerCase();
    let q2 = (document.getElementById('myJobDoneSearch') || { value: "" }).value.toLowerCase();
    if (q1) active = active.filter(j => j.title.toLowerCase().includes(q1));
    if (q2) complete = complete.filter(j => j.title.toLowerCase().includes(q2));
    
    // Render Tab Menunggu ACC (HANYA UNTUK REQUESTER)
    const accDiv = document.getElementById('pendingAccJobList');
    if (accDiv) {
        accDiv.innerHTML = '';
        if (pendingAcc.length === 0) {
            accDiv.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-hourglass-half"></i><h3>Tidak ada pekerjaan menunggu konfirmasi</h3></div>`;
        } else {
            pendingAcc.forEach(job => {
                const card = createRequesterAccCard(job);
                accDiv.appendChild(card);
            });
        }
    }
    
    // Render Tab Perbaikan
    const fixDiv = document.getElementById('perbaikanJobList');
    if (fixDiv) {
        fixDiv.innerHTML = '';
        if (!isHelper) {
            fixDiv.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-info-circle"></i><h3>Tab ini hanya untuk Helper</h3></div>`;
        } else if (perbaikan.length === 0) {
            fixDiv.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-tools"></i><h3>Tidak ada pekerjaan dalam perbaikan</h3></div>`;
        } else {
            perbaikan.forEach(job => {
                const card = createHelperPerbaikanCard(job);
                fixDiv.appendChild(card);
            });
        }
    }
    
    // Render Tab Aktif
    const activeDiv = document.getElementById('activeJobList');
    if (activeDiv) {
        activeDiv.innerHTML = '';
        if (active.length === 0) {
            activeDiv.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-briefcase"></i><h3>Belum ada pekerjaan aktif</h3></div>`;
        } else {
            active.forEach(job => {
                activeDiv.appendChild(createJobCard(job, job.status === 'in-progress' || job.status === 'ongoing'));
            });
        }
    }
    
    // Render Tab Selesai
    const compDiv = document.getElementById('completedJobList');
    if (compDiv) {
        compDiv.innerHTML = '';
        if (complete.length === 0) {
            compDiv.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-check-circle"></i><h3>Belum ada pekerjaan selesai</h3></div>`;
        } else {
            complete.forEach(job => {
                compDiv.appendChild(createJobCard(job, false));
            });
        }
    }
    
    // Update badge counts
    updateMyJobBadges();
}

function filterMyJobs() { loadMyJobs(); }

// Update badge counts on tabs
// Update badge counts on tabs
function updateMyJobBadges() {
    if (!currentUser) return;
    const isHelper = currentUser.role === 'helper';
    
    // PERBAIKAN: Badge "Menunggu ACC" - HANYA untuk requester
    let pendingCount = 0;
    if (!isHelper) {
        pendingCount = jobs.filter(j => {
            if (j.status !== 'pending_acc') return false;
            return j.user_id === currentUser.id;
        }).length;
    }
    
    // Badge "Perbaikan": hanya helper
    const perbaikanCount = isHelper
        ? jobs.filter(j => j.status === 'perbaikan' && j.helper_id === currentUser.id).length
        : 0;
    
    const el1 = document.getElementById('badgePendingAcc');
    const el2 = document.getElementById('badgePerbaikan');
    if (el1) { el1.textContent = pendingCount;   el1.style.display = pendingCount   ? 'inline-flex' : 'none'; }
    if (el2) { el2.textContent = perbaikanCount; el2.style.display = perbaikanCount ? 'inline-flex' : 'none'; }
}

function switchTab(tabId, el) {
    document.querySelectorAll('.tab-page').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    document.querySelectorAll('.tabbed-btn').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
}

async function completeJob(jobId) {
    if (!currentUser) return;
    
    let job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    showLoading();
    
    let formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('action', 'complete');
    formData.append('user_id', currentUser.id);
    
    try {
        let response = await fetch('update_job.php', {
            method: 'POST',
            body: formData
        });
        
        let result = await response.json();
        
        if (result.success) {
            job.status = 'completed';
            alert('Pekerjaan telah ditandai selesai!');
            loadMyJobs();
            loadRequesterJobs();
            loadHistory();
        } else {
            alert('Gagal: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan');
    } finally {
        document.getElementById('loadingBackdrop').style.display = 'none';
    }
}

// ========== FUNGSI UNTUK BINTANG RATING ==========
function litStars(upTo) {
    const stars = document.querySelectorAll('#starContainer .star-label');
    stars.forEach((star, index) => {
        if (index < upTo) {
            star.classList.add('lit');
            star.style.color = '#f59e0b';
        } else {
            star.classList.remove('lit');
            star.style.color = '#d1d5db';
        }
    });
}

function setDesc(val) {
    const descEl = document.getElementById('ratingLabel');
    if (!descEl) return;
    
    const descriptions = ['', 'Sangat Buruk 😞', 'Buruk 😕', 'Cukup 😐', 'Bagus 😊', 'Luar Biasa! 🤩'];
    
    if (val && val >= 1 && val <= 5) {
        descEl.textContent = descriptions[val];
        descEl.style.opacity = '1';
    } else {
        descEl.textContent = 'Pilih bintang';
        descEl.style.opacity = '0.5';
    }
}

// ========== EVENT LISTENER UNTUK BINTANG RATING ==========
document.addEventListener('DOMContentLoaded', function() {
    // Hover effect
    document.addEventListener('mouseover', function(e) {
        const star = e.target.closest('#starContainer .star-label');
        if (!star) return;
        const val = parseInt(star.dataset.val);
        litStars(val);
        setDesc(val);
    });
    
    document.addEventListener('mouseout', function(e) {
        const star = e.target.closest('#starContainer .star-label');
        if (!star) return;
        const checked = document.querySelector('input[name="rating"]:checked');
        const val = checked ? parseInt(checked.value) : 0;
        litStars(val);
        setDesc(val);
    });
    
    // Click untuk memilih rating
    document.addEventListener('click', function(e) {
        const star = e.target.closest('#starContainer .star-label');
        if (!star) return;
        const val = parseInt(star.dataset.val);
        
        const radio = document.getElementById('r' + val);
        if (radio) radio.checked = true;
        
        litStars(val);
        setDesc(val);
    });
});

function giveRating(jobId) {
    console.log('giveRating dipanggil untuk job:', jobId);
    
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
        showNotification('Pekerjaan tidak ditemukan', 'error');
        return;
    }

    const isRequester = currentUser?.role === 'requester';
    
    // Simpan target_id ke variable global
    currentRatingTargetId = isRequester ? job.helper_id : job.user_id;
    const targetName = isRequester ? (job.helper_name || 'Helper') : (job.requester_name || 'Requester');

    // Set judul modal
    const titleEl = document.getElementById('ratingModalTitle');
    if (titleEl) titleEl.textContent = `Beri Rating untuk ${targetName}`;
    
    // Simpan job_id ke hidden field
    const jobIdField = document.getElementById('ratingJobId');
    if (jobIdField) jobIdField.value = jobId;
    
    // Reset form rating
    const ratingRadios = document.querySelectorAll('input[name="rating"]');
    ratingRadios.forEach(r => r.checked = false);
    
    const reviewText = document.getElementById('reviewText');
    if (reviewText) reviewText.value = '';
    
    // Reset bintang
    litStars(0);
    setDesc(0);
    
    // Buka modal
    openModal('ratingModal');
}

async function submitRating() {
    console.log('submitRating dipanggil');
    
    const jobId = document.getElementById('ratingJobId')?.value;
    const ratingRadio = document.querySelector('input[name="rating"]:checked');
    const rating = ratingRadio ? ratingRadio.value : null;
    const reviewText = document.getElementById('reviewText')?.value;
    
    console.log('Job ID:', jobId, 'Rating:', rating, 'Target ID:', currentRatingTargetId);
    
    // Validasi
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
    
    // Tampilkan loading
    const loadingBackdrop = document.getElementById('loadingBackdrop');
    if (loadingBackdrop) loadingBackdrop.style.display = 'flex';
    
    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('action', 'rate');
    formData.append('user_id', currentUser.id);
    formData.append('rating', rating);
    formData.append('ulasan', reviewText || '');
    formData.append('rater_role', currentUser.role);
    formData.append('target_id', currentRatingTargetId);
    
    try {
        const response = await fetch('update_job.php', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('HTTP error ' + response.status);
        }
        
        const result = await response.json();
        console.log('Response:', result);
        
        if (result.success) {
            showNotification('Terima kasih atas rating Anda! ⭐', 'success');
            closeModal('ratingModal');
            
            // Reset form
            document.querySelectorAll('input[name="rating"]').forEach(r => r.checked = false);
            document.getElementById('reviewText').value = '';
            litStars(0);
            setDesc(0);
            currentRatingTargetId = null;
            
            // Refresh data
            await loadJobsFromDB();
        } else {
            showNotification(result.message || 'Gagal menyimpan rating', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        if (loadingBackdrop) loadingBackdrop.style.display = 'none';
    }
}

// ========== Favorit ==========
function toggleFavorite(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    job.favorite = !job.favorite;
    loadRequesterJobs();
    loadHelperJobs();
    loadMyJobs();
    loadFavorites();
}

function loadFavorites() {
    const favoritesList = document.getElementById('favoriteJobList');
    if (!favoritesList) return;
    favoritesList.innerHTML = '';
    
    const favoriteJobs = jobs.filter(job => job.favorite);
    
    if (favoriteJobs.length === 0) {
        favoritesList.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><i class="fas fa-heart"></i><h3>Belum ada pekerjaan favorit</h3><p>Klik ikon hati pada kartu pekerjaan untuk menyimpan ke favorit.</p></div>`;
        return;
    }
    
    favoriteJobs.forEach(job => {
        const jobCard = createJobCard(job, false);
        favoritesList.appendChild(jobCard);
    });
}

// ========== Ulasan ==========
// ========== LOAD RATING & ULASAN ==========
// ========== LOAD RATING & ULASAN ==========
async function loadReviews() {
    if (!currentUser) return;
    
    const reviewList = document.getElementById('reviewList');
    if (!reviewList) return;
    
    reviewList.innerHTML = '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Memuat ulasan...</div>';
    
    try {
        // Ambil rating yang diterima user ini (dari helper/requester lain)
        const response = await fetch(`get_ratings.php?user_id=${currentUser.id}&type=received`);
        const result = await response.json();
        
        console.log('Rating response:', result);
        
        if (!result.success) {
            reviewList.innerHTML = `<div class="empty-state"><i class="fas fa-star"></i><h3>Gagal memuat rating</h3><p>${result.message}</p></div>`;
            return;
        }
        
        const ratings = result.ratings;
        
        if (ratings.length === 0) {
            reviewList.innerHTML = `<div class="empty-state"><i class="fas fa-star"></i><h3>Belum ada rating</h3><p>Belum ada ulasan dari pengguna lain</p></div>`;
            return;
        }
        
            if (ratings.length === 0) {
        reviewList.innerHTML = `<div class="empty-state"><i class="fas fa-star"></i><h3>Belum ada rating</h3><p>Belum ada ulasan dari pengguna lain</p></div>`;
        updateRatingStats([]);
        await syncRatingToBeranda(); // ✅ TAMBAHKAN INI
        return;
    }
        
        // Tampilkan rating
        reviewList.innerHTML = '';
        
        ratings.forEach(r => {
            const reviewDiv = document.createElement('div');
            reviewDiv.className = 'review-item';
            reviewDiv.style.cssText = 'border-bottom: 1px solid var(--light-gray); padding: 15px 0; margin-bottom: 10px;';
            
            // Buat bintang
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= r.rating) {
                    starsHtml += '<i class="fas fa-star" style="color: #fbbf24;"></i>';
                } else {
                    starsHtml += '<i class="far fa-star" style="color: #d1d5db;"></i>';
                }
            }
            
            // Ambil inisial nama untuk avatar
            const initial = (r.rater_name || 'U').charAt(0).toUpperCase();
            
            reviewDiv.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <div style="width: 45px; height: 45px; background: linear-gradient(135deg, #2D63A3, #3A7BB0); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; flex-shrink: 0;">
                        ${initial}
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                            <div>
                                <strong>${escapeHtml(r.rater_name || 'Pengguna')}</strong>
                                <span style="color: var(--gray); font-size: 0.75rem; margin-left: 8px;">(${r.rater_role === 'requester' ? 'Requester' : 'Helper'})</span>
                            </div>
                            <div style="font-size: 0.7rem; color: var(--gray);">${formatDate(r.created_at)}</div>
                        </div>
                        <div style="margin: 6px 0 8px 0;">${starsHtml}</div>
                        <div style="color: var(--dark); font-size: 0.85rem; line-height: 1.5;">${escapeHtml(r.ulasan || '<em style="color: var(--gray);">Tidak ada ulasan</em>')}</div>
                        <div style="font-size: 0.7rem; color: var(--gray); margin-top: 6px;">
                            <i class="fas fa-briefcase"></i> Pekerjaan: ${escapeHtml(r.job_title || '#' + r.job_id)}
                        </div>
                    </div>
                </div>
            `;
            reviewList.appendChild(reviewDiv);
        });
        
        // Update statistik rating
        updateRatingStats(ratings);
        
            updateRatingStats(ratings);
    await syncRatingToBeranda(); // ✅ TAMBAHKAN INI
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewList.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error</h3><p>${error.message}</p></div>`;
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch(e) {
        return dateStr;
    }
}

function updateRatingStats(ratings) {
    if (!ratings || ratings.length === 0) return;
    
    // Hitung rata-rata
    let total = 0;
    ratings.forEach(r => total += r.rating);
    const avgRating = (total / ratings.length).toFixed(1);
    
    // Update stat card di halaman rating
    const avgEl = document.querySelector('#ratingPage .stat-card:first-child h3');
    const totalEl = document.querySelector('#ratingPage .stat-card:nth-child(2) h3');
    const satisfactionEl = document.querySelector('#ratingPage .stat-card:nth-child(3) h3');
    
    if (avgEl) avgEl.textContent = avgRating + ' ★';
    if (totalEl) totalEl.textContent = ratings.length;
    if (satisfactionEl) {
        const percent = (avgRating / 5) * 100;
        satisfactionEl.textContent = Math.round(percent) + '%';
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function updateRatingStats(ratings) {
    if (!ratings.length) return;
    
    // Hitung rata-rata
    let total = 0;
    ratings.forEach(r => total += r.rating);
    const avgRating = (total / ratings.length).toFixed(1);
    
    // Update stat card di halaman rating
    const avgEl = document.querySelector('#ratingPage .stat-card:first-child h3');
    const totalEl = document.querySelector('#ratingPage .stat-card:nth-child(2) h3');
    const satisfactionEl = document.querySelector('#ratingPage .stat-card:nth-child(3) h3');
    
    if (avgEl) avgEl.textContent = avgRating + ' ★';
    if (totalEl) totalEl.textContent = ratings.length;
    if (satisfactionEl) {
        const percent = (avgRating / 5) * 100;
        satisfactionEl.textContent = Math.round(percent) + '%';
    }
}

async function loadUserRating() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`get_user.php?user_id=${currentUser.id}`);
        const result = await response.json();
        
        if (result.success && result.user.rating) {
            const ratingAvg = parseFloat(result.user.rating).toFixed(1);
            
            // Tampilkan di sidebar atau profil
            const ratingBadge = document.querySelector('.user-profile .rating-badge');
            if (ratingBadge) {
                ratingBadge.innerHTML = `<i class="fas fa-star" style="color: #fbbf24;"></i> ${ratingAvg}`;
            }
        }
    } catch (error) {
        console.error('Error loading rating:', error);
    }
}

// ========== Riwayat ==========
function loadHistory() {
    let historyContainer = document.getElementById('historyList');
    if (!historyContainer) return;
    
    let q = (document.getElementById('historySearch') || { value: "" }).value.toLowerCase();
    let sort = (document.getElementById('historySort') || { value: 'newest' }).value;
    
    let hist = jobs.filter(j => j.status === 'completed' && j.user_id === currentUser?.id);
    
    if (q) hist = hist.filter(j => j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q));
    
    if (sort === 'newest') hist = hist.slice().reverse();
    if (sort === 'oldest') hist = hist.slice();
    if (sort === 'price-high') hist = hist.slice().sort((a, b) => b.price - a.price);
    if (sort === 'price-low') hist = hist.slice().sort((a, b) => a.price - b.price);
    
    historyContainer.innerHTML = '';
    
    if (hist.length === 0) {
        historyContainer.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><i class="fas fa-history"></i><h3>Belum ada histori pekerjaan</h3></div>`;
        return;
    }
    
    hist.forEach(job => {
        const jobCard = createJobCard(job, false);
        historyContainer.appendChild(jobCard);
    });
}

function filterHistory() { loadHistory(); }

// ========== Notifikasi ==========
function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
    
    document.querySelectorAll('.notification-badge').forEach(badge => {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

document.getElementById('notificationIcon').addEventListener('click', function(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    
    if (dropdown.style.display === 'block') {
        notifications.forEach(n => n.read = true);
        updateNotificationBadge();
    }
});

document.addEventListener('click', function() {
    document.getElementById('notificationDropdown').style.display = 'none';
});

// ========== Referral ==========
function copyReferralCode() {
    const code = "HENDI123";
    navigator.clipboard.writeText(code).then(function() {
        referralCount++;
        document.getElementById('referralCount').textContent = referralCount;
        alert('Kode referral berhasil disalin: ' + code);
    }, function(err) {
        console.error('Gagal menyalin kode: ', err);
        alert('Gagal menyalin kode referral');
    });
}

// ========== Dark Mode ==========
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    if (darkModeToggle) {
        darkModeToggle.checked = document.body.classList.contains('dark-mode');
    }
    
    // Update icon di sidebar
    const sidebarIcon = document.querySelector('#sidebarDarkModeToggle i');
    if (sidebarIcon) {
        if (document.body.classList.contains('dark-mode')) {
            sidebarIcon.className = 'fas fa-sun';
            document.querySelector('#sidebarDarkModeToggle').innerHTML = '<i class="fas fa-sun"></i> Mode Terang';
        } else {
            sidebarIcon.className = 'fas fa-moon';
            document.querySelector('#sidebarDarkModeToggle').innerHTML = '<i class="fas fa-moon"></i> Mode Gelap';
        }
    }
    
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Inisialisasi dark mode dari localStorage
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    if (darkModeToggle) {
        darkModeToggle.checked = true;
    }
    
    // Update icon sidebar
    const sidebarIcon = document.querySelector('#sidebarDarkModeToggle i');
    if (sidebarIcon) {
        sidebarIcon.className = 'fas fa-sun';
        document.querySelector('#sidebarDarkModeToggle').innerHTML = '<i class="fas fa-sun"></i> Mode Terang';
    }
}

// ========== Fungsi Pembayaran QRIS ==========
let pendingJobData = null;
let paymentTimer = null;
let paymentTimeLeft = 300;

function openPaymentModal(jobData) {
    console.log('Membuka modal payment dengan data:', jobData);
    
    pendingJobData = jobData;
    
    const serviceFee = 2500;
    const total = jobData.price + serviceFee;
    
    document.getElementById('paymentTotal').textContent = 'Rp ' + jobData.price.toLocaleString('id-ID');
    document.getElementById('serviceFee').textContent = 'Rp 2.500';
    document.getElementById('totalPayment').textContent = 'Rp ' + total.toLocaleString('id-ID');
    
    generateQRIS(jobData);
    resetPaymentTimer();
    
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    const statusDiv = document.getElementById('paymentStatus');
    
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> Konfirmasi Pembayaran';
    }
    
    if (statusDiv) {
        statusDiv.style.display = 'none';
        statusDiv.innerHTML = '';
    }
    
    openModal('paymentModal');
}

function generateQRIS(jobData) {
    const qrImg = document.getElementById('qrisImage');
    
    if (qrImg) {
        qrImg.src = 'qris2.jpeg?t=' + Date.now();
        qrImg.setAttribute('data-job-id', jobData.id);
        qrImg.setAttribute('data-job-price', jobData.price);
        qrImg.setAttribute('data-job-title', jobData.title);
        console.log('QRIS image set to:', qrImg.src);
    } else {
        console.error('Element qrisImage tidak ditemukan!');
    }
}

function resetPaymentTimer() {
    if (paymentTimer) {
        clearInterval(paymentTimer);
        paymentTimer = null;
    }
    
    paymentTimeLeft = 300;
    updateTimerDisplay();
    
    paymentTimer = setInterval(function() {
        paymentTimeLeft--;
        updateTimerDisplay();
        
        if (paymentTimeLeft <= 0) {
            clearInterval(paymentTimer);
            paymentTimer = null;
            handlePaymentExpired();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(paymentTimeLeft / 60);
    const seconds = paymentTimeLeft % 60;
    const timerElement = document.getElementById('paymentTimer');
    
    if (timerElement) {
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (paymentTimeLeft <= 60) {
            timerElement.style.color = 'var(--danger)';
        } else {
            timerElement.style.color = 'var(--primary)';
        }
    }
}

function handlePaymentExpired() {
    const statusDiv = document.getElementById('paymentStatus');
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    
    if (statusDiv) {
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '<span style="color: var(--danger);"><i class="fas fa-times-circle"></i> Waktu pembayaran habis. Silakan ulangi proses.</span>';
    }
    
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
    }
}

function confirmPayment() {
    if (paymentTimeLeft <= 0) {
        alert('Waktu pembayaran telah habis. Silakan ulangi proses.');
        closeModal('paymentModal');
        return;
    }
    
    showLoading(800);
    
    setTimeout(function() {
        const statusDiv = document.getElementById('paymentStatus');
        
        if (statusDiv) {
            statusDiv.style.display = 'block';
            statusDiv.innerHTML = '<span style="color: var(--success);"><i class="fas fa-check-circle"></i> Pembayaran berhasil! Memposting permintaan...</span>';
        }
        
        const confirmBtn = document.getElementById('confirmPaymentBtn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.style.opacity = '0.5';
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        }
        
        if (paymentTimer) {
            clearInterval(paymentTimer);
            paymentTimer = null;
        }
        
        setTimeout(function() {
            postJobAfterPayment();
        }, 1500);
    }, 800);
}

async function postJobAfterPayment() {
    if (!pendingJobData || !currentUser) {
        alert('Error: Data pekerjaan tidak ditemukan atau Anda belum login');
        closeModal('paymentModal');
        return;
    }
    
    showLoading();
    
    let formData = new FormData();
    formData.append('user_id', currentUser.id);
    formData.append('title', pendingJobData.title);
    formData.append('category', pendingJobData.category);
    formData.append('description', pendingJobData.description);
    formData.append('location', pendingJobData.location);
    formData.append('price', pendingJobData.price);
    
    if (pendingJobData.emergency) {
        formData.append('emergency', '1');
    }
    
    try {
        let response = await fetch('save_job.php', {
            method: 'POST',
            body: formData
        });
        
        let result = await response.json();
        
        if (result.success) {
            await loadWalletFromDB();
            await loadJobsFromDB();
            
            closeModal('paymentModal');
            document.getElementById('createJobForm').reset();
            
            alert('Permintaan berhasil diposting! Pekerjaan Anda sudah aktif.');
        } else {
            alert('Gagal posting: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat memposting pekerjaan');
    } finally {
        pendingJobData = null;
        document.getElementById('loadingBackdrop').style.display = 'none';
        
        const confirmBtn = document.getElementById('confirmPaymentBtn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = '1';
            confirmBtn.innerHTML = '<i class="fas fa-check"></i> Konfirmasi Pembayaran';
        }
    }
}

function closePaymentModal() {
    if (paymentTimer) {
        clearInterval(paymentTimer);
        paymentTimer = null;
    }
    
    pendingJobData = null;
    
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> Konfirmasi Pembayaran';
    }
    
    const statusDiv = document.getElementById('paymentStatus');
    if (statusDiv) {
        statusDiv.style.display = 'none';
        statusDiv.innerHTML = '';
    }
    
    closeModal('paymentModal');
}

// ========== CHAT - VERSI BARU (BERSIH) ==========
let chatState = {
    currentConversation: null,   // { job_id, other_id, other_name, job_title }
    lastMessageId: 0,
    pollingInterval: null,
    notifiedIds: new Set()
};

// ---- Helpers ----
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatChatTime(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr  = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);
        if (diffMin < 1)  return 'Baru saja';
        if (diffMin < 60) return diffMin + ' mnt';
        if (diffHr  < 24) return diffHr  + ' jam';
        if (diffDay < 7)  return diffDay + ' hari';
        return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short' });
    } catch(e) { return ''; }
}

function formatMsgTime(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
    } catch(e) { return ''; }
}

function formatMsgDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
        if (d.toDateString() === today.toDateString())     return 'Hari ini';
        if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
        return d.toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });
    } catch(e) { return ''; }
}

// ---- UI helpers ----
function chatSetInputEnabled(enabled) {
    const inp = document.getElementById('chatInputModern');
    const sendBtn = document.getElementById('chatSendModern');
    const uploadBtn = document.getElementById('chatUploadBtn');
    
    if (inp) {
        inp.disabled = !enabled;
        inp.placeholder = enabled ? 'Ketik pesan...' : 'Pilih percakapan terlebih dahulu';
        if (enabled) setTimeout(() => inp.focus(), 100);
    }
    if (sendBtn) sendBtn.disabled = !enabled;
    if (uploadBtn) {
        // Upload button hanya aktif jika percakapan terbuka dan pekerjaan sedang berjalan
        if (enabled && chatState.currentConversation) {
            const job = jobs.find(j => j.id === chatState.currentConversation?.job_id);
            const isActiveJob = job && (job.status === 'in-progress' || job.status === 'ongoing');
            const isHelperWorker = currentUser?.role === 'helper' && job?.helper_id === currentUser?.id;
            uploadBtn.disabled = !(isActiveJob && isHelperWorker);
        } else {
            uploadBtn.disabled = true;
        }
    }
}

function chatScrollToBottom() {
    const el = document.getElementById('chatMessagesModern');
    if (el) el.scrollTop = el.scrollHeight;
}

function chatShowEmpty() {
    const el = document.getElementById('chatMessagesModern');
    if (el) el.innerHTML = `
        <div class="chat-empty-modern">
            <div class="chat-empty-icon"><i class="fas fa-comments"></i></div>
            <h4>Belum ada percakapan</h4>
            <p>Pilih percakapan dari sidebar untuk mulai chat</p>
        </div>`;
}

function chatShowLoading() {
    const el = document.getElementById('chatMessagesModern');
    if (el) el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--gray);">
        <i class="fas fa-spinner fa-spin" style="font-size:1.5rem;"></i>
        <p style="margin-top:10px;font-size:0.85rem;">Memuat pesan...</p></div>`;
}

// ---- Render message bubble ----
function chatRenderBubble(msg) {
    const isMe = !!msg.is_me;
    const time = msg.time_only || formatMsgTime(msg.created_at);
    return `
        <div class="message-modern ${isMe ? 'sent' : 'received'}" data-id="${msg.id}">
            <div class="message-bubble">${escapeHtml(msg.message)}</div>
            <div class="message-time-modern">${time}</div>
        </div>`;
}

// ---- Display full message list ----
function chatDisplayMessages(messages) {
    const el = document.getElementById('chatMessagesModern');
    if (!el) return;
    if (!messages || messages.length === 0) {
        el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--gray);font-size:0.85rem;">
            <i class="fas fa-comment-slash" style="font-size:2rem;margin-bottom:10px;display:block;"></i>
            Belum ada pesan. Mulai percakapan sekarang!</div>`;
        chatSetInputEnabled(true);
        return;
    }

    let html = '';
    let lastDate = '';
    messages.forEach(msg => {
        const dateStr = msg.date_only || formatMsgDate(msg.created_at);
        if (dateStr !== lastDate) {
            html += `<div class="message-date-modern"><span>${escapeHtml(dateStr)}</span></div>`;
            lastDate = dateStr;
        }
        html += chatRenderBubble(msg);
        if (msg.id > chatState.lastMessageId) chatState.lastMessageId = msg.id;
    });

    el.innerHTML = html;
    chatScrollToBottom();
    chatSetInputEnabled(true);
}

// ---- Append only new messages ----
function chatAppendMessages(messages) {
    if (!messages || messages.length === 0) return;
    const el = document.getElementById('chatMessagesModern');
    if (!el) return;

    // Remove empty-state if present
    const empty = el.querySelector('.chat-empty-modern, [data-empty]');
    if (empty) empty.remove();

    let lastDate = '';
    const allMsgs = el.querySelectorAll('.message-modern');
    if (allMsgs.length > 0) {
        // Get date of last bubble to avoid duplicate separator
        const lastBubble = allMsgs[allMsgs.length - 1];
        // We'll just check date freshly
    }

    messages.forEach(msg => {
        if (msg.id <= chatState.lastMessageId) return;

        // Date separator
        const dateStr = msg.date_only || formatMsgDate(msg.created_at);
        const lastSep = el.querySelector('.message-date-modern:last-of-type span');
        if (!lastSep || lastSep.textContent !== dateStr) {
            const sep = document.createElement('div');
            sep.className = 'message-date-modern';
            sep.innerHTML = `<span>${escapeHtml(dateStr)}</span>`;
            el.appendChild(sep);
        }

        const div = document.createElement('div');
        div.innerHTML = chatRenderBubble(msg);
        el.appendChild(div.firstElementChild);

        chatState.lastMessageId = Math.max(chatState.lastMessageId, msg.id);

        // Notification for received messages
        if (!msg.is_me && !chatState.notifiedIds.has(msg.id)) {
            chatState.notifiedIds.add(msg.id);
            chatShowPopupNotification(chatState.currentConversation?.other_name || 'Pesan', msg.message);
        }
    });

    chatScrollToBottom();
}

// ---- Show popup notification ----
let _notifTimer = null;
function chatShowPopupNotification(name, text) {
    let notif = document.getElementById('chatPopupNotif');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'chatPopupNotif';
        notif.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#2D63A3;color:#fff;padding:12px 18px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:9999;max-width:280px;font-size:0.85rem;cursor:pointer;transition:opacity 0.3s;';
        notif.onclick = () => { notif.style.opacity = '0'; };
        document.body.appendChild(notif);
    }
    notif.innerHTML = `<b><i class="fas fa-comment"></i> ${escapeHtml(name)}</b><br><span style="opacity:0.9;">${escapeHtml(text.length > 60 ? text.substring(0,60)+'…' : text)}</span>`;
    notif.style.opacity = '1';
    if (_notifTimer) clearTimeout(_notifTimer);
    _notifTimer = setTimeout(() => { notif.style.opacity = '0'; }, 4000);
}

// ---- Load conversations list ----
async function loadConversationsModern() {
    if (!currentUser) return;
    try {
        const res = await fetch(`get_conversations.php?user_id=${currentUser.id}&role=${currentUser.role}&t=${Date.now()}`);
        const data = await res.json();
        if (data.success) {
            chatRenderConversationList(data.conversations || []);
            chatUpdateBadge(data.conversations || []);
        }
    } catch(e) {
        console.error('loadConversationsModern error:', e);
    }
}

function chatRenderConversationList(convs) {
    const container = document.getElementById('chatConversationsList');
    if (!container) return;
    container.innerHTML = '';

    if (!convs || convs.length === 0) {
        container.innerHTML = `<div style="padding:40px 20px;text-align:center;color:var(--gray);font-size:0.85rem;">
            <i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:10px;"></i>
            Belum ada percakapan</div>`;
        return;
    }

    convs.forEach(conv => {
        const item = document.createElement('div');
        item.className = 'chat-list-item' + (chatState.currentConversation?.job_id === conv.job_id ? ' active' : '');
        const initials = (conv.other_party || '??').substring(0,2).toUpperCase();
        const unread = conv.unread_count > 0 ? `<span class="chat-badge">${conv.unread_count}</span>` : '';
        item.innerHTML = `
            <div class="chat-avatar">${initials}</div>
            <div class="chat-info">
                <div class="chat-name-row">
                    <span class="chat-name">${escapeHtml(conv.other_party)}</span>
                    <span class="chat-time">${formatChatTime(conv.last_message_time)}</span>
                </div>
                <div class="chat-job-title"><i class="fas fa-briefcase"></i> ${escapeHtml(conv.job_title)}</div>
                <div class="chat-last-message">${escapeHtml(conv.last_message || 'Belum ada pesan')}</div>
            </div>
            ${unread}`;
        item.onclick = () => chatOpenConversation(conv.job_id, conv.other_party, conv.other_party_id, conv.job_title);
        container.appendChild(item);
    });
}

function chatUpdateBadge(convs) {
    let total = 0;
    convs.forEach(c => { total += c.unread_count || 0; });
    const badge = document.querySelector('.sidebar-link[data-page="messagesPage"] .notification-badge');
    if (badge) {
        badge.textContent = total;
        badge.style.display = total > 0 ? 'flex' : 'none';
    }
    document.title = total > 0 ? `(${total}) Hendimen - Dashboard` : 'Hendimen - Dashboard';
}

// ---- Open a conversation ----
async function chatOpenConversation(jobId, otherName, otherId, jobTitle) {
    if (!currentUser) return;
    jobId   = parseInt(jobId);
    otherId = parseInt(otherId);
    if (!jobId || !otherId) { console.error('chatOpenConversation: parameter tidak lengkap'); return; }

    // Stop old polling
    if (chatState.pollingInterval) {
        clearInterval(chatState.pollingInterval);
        chatState.pollingInterval = null;
    }

    chatState.currentConversation = { job_id: jobId, other_id: otherId, other_name: otherName, job_title: jobTitle };
    chatState.lastMessageId = 0;
    chatState.notifiedIds.clear();

    // Mark active in list
    document.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
    
    // Update header
    const header = document.getElementById('chatHeaderModern');
    if (header) {
        const initials = (otherName || '??').substring(0,2).toUpperCase();
        const roleLabel = currentUser.role === 'helper' ? 'Requester' : 'Helper';
        header.innerHTML = `
            <div class="chat-header-avatar">${initials}</div>
            <div class="chat-header-info">
                <div class="chat-header-name">${escapeHtml(otherName)}</div>
                <div class="chat-header-role">${roleLabel}</div>
                <div class="chat-header-job"><i class="fas fa-briefcase"></i> ${escapeHtml(jobTitle)}</div>
            </div>
            <div class="chat-header-status">
                <span class="status-dot"></span><span>Terhubung</span>
            </div>`;
    }

    chatSetInputEnabled(false);
    chatShowLoading();

    // Load messages
    await chatLoadMessages(jobId, otherId);

    // Start polling every 2s
    chatState.pollingInterval = setInterval(() => {
        if (chatState.currentConversation) chatPollNew(jobId, otherId);
    }, 2000);

    chatSetInputEnabled(true);
}

// ---- Load messages (full) ----
async function chatLoadMessages(jobId, otherId) {
    try {
        const url = `get_messages.php?job_id=${jobId}&user_id=${currentUser.id}&other_id=${otherId}&role=${currentUser.role}&limit=100&offset=0`;
        const res  = await fetch(url);
        const data = await res.json();
        if (data.success) {
            chatDisplayMessages(data.messages || []);
            chatState.lastMessageId = data.newest_id || 0;
        } else {
            console.error('chatLoadMessages error:', data.message);
            chatShowEmpty();
        }
    } catch(e) {
        console.error('chatLoadMessages fetch error:', e);
        chatShowEmpty();
    }
}

// ---- Poll for new messages ----
async function chatPollNew(jobId, otherId) {
    if (!chatState.lastMessageId && chatState.lastMessageId !== 0) return;
    try {
        const url = `get_messages.php?job_id=${jobId}&user_id=${currentUser.id}&other_id=${otherId}&role=${currentUser.role}&last_message_id=${chatState.lastMessageId}`;
        const res  = await fetch(url);
        const data = await res.json();
        if (data.success && data.messages && data.messages.length > 0) {
            chatAppendMessages(data.messages);
            chatState.lastMessageId = data.newest_id;
            // Refresh sidebar to update unread counts
            loadConversationsModern();
        }
    } catch(e) {
        // silent fail on poll
    }
}

// ---- Send message ----
async function chatSend() {
    if (!currentUser || !chatState.currentConversation) {
        alert('Pilih percakapan terlebih dahulu');
        return;
    }
    const inp = document.getElementById('chatInputModern');
    if (!inp) return;
    const msg = inp.value.trim();
    if (!msg) return;

    inp.value = '';
    const btn = document.getElementById('chatSendModern');
    if (btn) btn.disabled = true;

    try {
        const fd = new FormData();
        fd.append('job_id',      chatState.currentConversation.job_id);
        fd.append('sender_id',   currentUser.id);
        fd.append('receiver_id', chatState.currentConversation.other_id);
        fd.append('message',     msg);
        fd.append('sender_role', currentUser.role);

        const res  = await fetch('send_message.php', { method:'POST', body: fd });
        const data = await res.json();

        if (data.success) {
            // Tampilkan langsung tanpa tunggu polling
            const newMsg = {
                id:         data.data.id,
                sender_id:  currentUser.id,
                message:    msg,
                is_me:      true,
                created_at: data.data.created_at,
                time_only:  formatMsgTime(data.data.created_at),
                date_only:  formatMsgDate(data.data.created_at)
            };
            chatAppendMessages([newMsg]);
            chatState.lastMessageId = Math.max(chatState.lastMessageId, data.data.id);
            loadConversationsModern();
        } else {
            alert('Gagal kirim: ' + (data.message || 'Error tidak diketahui'));
            inp.value = msg; // kembalikan pesan
        }
    } catch(e) {
        console.error('chatSend error:', e);
        alert('Gagal mengirim pesan. Cek koneksi internet.');
        inp.value = msg;
    } finally {
        if (btn) btn.disabled = false;
        if (inp) inp.focus();
    }
}

// ---- Helper/Requester: open chat from job card ----
async function startChatWithRequester(jobId, requesterId, requesterName, jobTitle) {
    if (!currentUser) return;
    setActiveMenu('messagesPage');
    await loadConversationsModern();
    await chatOpenConversation(jobId, requesterName, requesterId, jobTitle);
}

// Alias for requester side
async function startChatWithHelper(jobId, helperId, helperName, jobTitle) {
    if (!currentUser) return;
    setActiveMenu('messagesPage');
    await loadConversationsModern();
    await chatOpenConversation(jobId, helperName, helperId, jobTitle);
}

// ---- Event listeners ----
document.addEventListener('DOMContentLoaded', function() {
    const sendBtn = document.getElementById('chatSendModern');
    const chatInp = document.getElementById('chatInputModern');

    if (sendBtn) sendBtn.addEventListener('click', chatSend);

    if (chatInp) {
        chatInp.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                chatSend();
            }
        });
    }

// Event listener untuk tombol upload bukti di chat
const chatUploadBtn = document.getElementById('chatUploadBtn');
if (chatUploadBtn) {
    chatUploadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadBuktiFromChat();
    });
}

    // Search filter conversations
    const searchInp = document.getElementById('chatSearchInput');
    if (searchInp) {
        searchInp.addEventListener('input', function() {
            const term = this.value.toLowerCase();
            document.querySelectorAll('.chat-list-item').forEach(item => {
                const name = item.querySelector('.chat-name')?.textContent.toLowerCase() || '';
                const job  = item.querySelector('.chat-job-title')?.textContent.toLowerCase() || '';
                item.style.display = (name.includes(term) || job.includes(term)) ? '' : 'none';
            });
        });
    }
});

// Stop polling when leaving messages page
document.querySelectorAll('.sidebar-link, .bottom-nav-item').forEach(link => {
    link.addEventListener('click', function() {
        if (this.dataset.page !== 'messagesPage') {
            if (chatState.pollingInterval) {
                clearInterval(chatState.pollingInterval);
                chatState.pollingInterval = null;
            }
        }
    });
});

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    setTimeout(() => Notification.requestPermission(), 5000);
}

// ========== KALKULATOR HARGA ==========
const nilaiPerTingkat = 20800;
const hargaDasar = 50000;
const biayaAdmin = 2500;

const indicators = [
    { name: 'Waktu', icon: '⏳', options: [
        { text: '< 1 jam', skor: 1 },
        { text: '1 - 3 jam', skor: 2 },
        { text: '> 3 jam', skor: 3 }
    ]},
    { name: 'Beban', icon: '🏋️', options: [
        { text: '< 5 kg', skor: 1 },
        { text: '5 - 15 kg', skor: 2 },
        { text: '> 15 kg', skor: 3 }
    ]},
    { name: 'Keahlian', icon: '📘', options: [
        { text: 'Tidak perlu', skor: 1 },
        { text: 'Minimal arahan', skor: 2 },
        { text: 'Khusus/sertifikasi', skor: 3 }
    ]},
    { name: 'Risiko', icon: '⚠️', options: [
        { text: 'Rendah', skor: 1 },
        { text: 'Sedang', skor: 2 },
        { text: 'Tinggi', skor: 3 }
    ]},
    { name: 'Peralatan', icon: '🔧', options: [
        { text: 'Tidak perlu', skor: 1 },
        { text: 'Sederhana', skor: 2 },
        { text: 'Khusus/berat', skor: 3 }
    ]},
    { name: 'Mobilitas', icon: '🚚', options: [
        { text: '1 titik', skor: 1 },
        { text: '2-3 titik', skor: 2 },
        { text: '>3 titik/berpindah', skor: 3 }
    ]}
];

let currentSkor = [2, 1, 2, 1, 2, 1];
let dropdownElements = [];

function renderIndicatorDropdowns() {
    const gridEl = document.getElementById('indicatorGrid');
    if (!gridEl) return;
    
    gridEl.innerHTML = '';
    dropdownElements = [];

    indicators.forEach((ind, idx) => {
        const itemDiv = document.createElement('div');
        itemDiv.style.background = 'white';
        itemDiv.style.borderRadius = '16px';
        itemDiv.style.padding = '18px 20px';
        itemDiv.style.border = '1px solid var(--light-gray)';
        itemDiv.style.boxShadow = 'var(--shadow-1)';

        const labelDiv = document.createElement('div');
        labelDiv.style.display = 'flex';
        labelDiv.style.alignItems = 'center';
        labelDiv.style.gap = '10px';
        labelDiv.style.marginBottom = '15px';
        labelDiv.innerHTML = `<span style="font-size:1.8rem;">${ind.icon}</span><span style="font-weight:700; font-size:1.1rem; color:var(--primary);">${ind.name}</span>`;
        itemDiv.appendChild(labelDiv);

        const select = document.createElement('select');
        select.style.width = '100%';
        select.style.padding = '12px 15px';
        select.style.borderRadius = '8px';
        select.style.border = '1.5px solid var(--light-gray)';
        select.dataset.index = idx;

        ind.options.forEach((opt) => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.skor;
            optionEl.textContent = opt.text;
            if (opt.skor === currentSkor[idx]) {
                optionEl.selected = true;
            }
            select.appendChild(optionEl);
        });

        select.addEventListener('change', function(e) {
            currentSkor[parseInt(e.target.dataset.index)] = parseInt(e.target.value, 10);
            updatePriceCalculation();
        });

        itemDiv.appendChild(select);
        gridEl.appendChild(itemDiv);
        dropdownElements.push(select);
    });
}

function hitungTotalTambahan() {
    let total = 0;
    for (let skor of currentSkor) {
        if (skor === 1) total += 0;
        else if (skor === 2) total += nilaiPerTingkat;
        else if (skor === 3) total += nilaiPerTingkat * 2;
    }
    return total;
}

function getTipValue() {
    const tipDropdown = document.getElementById('tipDropdown');
    return tipDropdown ? parseInt(tipDropdown.value, 10) || 0 : 0;
}

function hitungSubtotal() {
    return hargaDasar + hitungTotalTambahan();
}

function hitungTotalAkhir() {
    return hitungSubtotal() + getTipValue() + biayaAdmin;
}

function updatePriceCalculation() {
    const tambahan = hitungTotalTambahan();
    const subtotal = hitungSubtotal();
    const tip = getTipValue();
    const totalAkhir = hitungTotalAkhir();
    
    const emergencyCheck = document.getElementById('emergencyJob');
    // PERBAIKAN: Pastikan nilai boolean yang benar
    const isEmergency = emergencyCheck ? emergencyCheck.checked === true : false;
    
    const emergencyFee = isEmergency ? 10000 : 0;
    
    const finalPrice = hargaDasar + tambahan + tip + emergencyFee;
    
    console.log('Update price - isEmergency:', isEmergency, 'emergencyFee:', emergencyFee);
    
    document.getElementById('hargaDasarDisplay').textContent = `Rp ${formatRupiah(hargaDasar)}`;
    document.getElementById('totalExtra').textContent = `Rp ${formatRupiah(tambahan)}`;
    document.getElementById('subtotalDisplay').textContent = `Rp ${formatRupiah(subtotal)}`;
    document.getElementById('tipAmountDisplay').textContent = `Rp ${formatRupiah(tip)}`;
    document.getElementById('tipDetailDisplay').textContent = `Rp ${formatRupiah(tip)}`;
    document.getElementById('finalPrice').textContent = `Rp ${formatRupiah(finalPrice)}`;
    document.getElementById('finalTotalDisplay').textContent = `Rp ${formatRupiah(totalAkhir + (isEmergency ? 10000 : 0))}`;
    
    const locationStatus = document.getElementById('locationStatus');
    const statusLocationText = document.getElementById('statusLocationText');
    
    if (locationStatus && statusLocationText) {
        if (isEmergency) {
            locationStatus.innerHTML = '<i class="fas fa-circle" style="color: #dc3545;"></i> <span id="statusLocationText">Emergency +Rp10.000</span>';
        } else {
            locationStatus.innerHTML = '<i class="fas fa-circle" style="color: #28a745;"></i> <span id="statusLocationText">Lokasi aktif</span>';
        }
    }
}

function formatRupiah(angka) {
    if (angka === undefined || angka === null) return '0';
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ========== OSM MAP FUNCTIONS ==========
async function reverseGeocode(lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`;
        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'HendimenApp/1.0',
                'Accept-Language': 'id'
            }
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.address) {
            const parts = [];
            if (data.address.road) parts.push(data.address.road);
            if (data.address.city || data.address.town || data.address.village) {
                parts.push(data.address.city || data.address.town || data.address.village);
            }
            if (data.address.state) parts.push(data.address.state);
            if (data.address.country) parts.push(data.address.country);
            
            return parts.join(', ') || data.display_name || 'Alamat tidak ditemukan';
        }
        
        return data.display_name || 'Alamat tidak ditemukan';
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return 'Gagal mendapatkan alamat';
    }
}

function useMyLocation() {
    console.log('useMyLocation dipanggil');
    
    if (!navigator.geolocation) {
        alert('Browser Anda tidak mendukung geolocation');
        return;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log('Lokasi ditemukan:', position.coords);
            
            currentLat = position.coords.latitude;
            currentLng = position.coords.longitude;
            
            reverseGeocode(currentLat, currentLng).then(address => {
                currentAddress = address;
                
                const displayLocation = address || `${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`;
                
                const jobLocation = document.getElementById('jobLocation');
                const jobLatitude = document.getElementById('jobLatitude');
                const jobLongitude = document.getElementById('jobLongitude');
                const locationPreviewText = document.getElementById('locationPreviewText');
                const locationPreview = document.getElementById('locationPreview');
                const latDisplay = document.getElementById('latDisplay');
                const lngDisplay = document.getElementById('lngDisplay');
                const coordinateBadge = document.getElementById('coordinateBadge');
                const statusLocationText = document.getElementById('statusLocationText');
                const openGoogleMapsLink = document.getElementById('openGoogleMapsLink');
                
                if (jobLocation) jobLocation.value = displayLocation;
                if (jobLatitude) jobLatitude.value = currentLat;
                if (jobLongitude) jobLongitude.value = currentLng;
                
                if (locationPreviewText) locationPreviewText.textContent = displayLocation;
                if (locationPreview) locationPreview.style.display = 'block';
                
                const mapsUrl = `https://www.google.com/maps?q=${currentLat},${currentLng}`;
                if (openGoogleMapsLink) {
                    openGoogleMapsLink.href = mapsUrl;
                    openGoogleMapsLink.style.display = 'inline-flex';
                }
                
                if (latDisplay) latDisplay.textContent = currentLat.toFixed(6);
                if (lngDisplay) lngDisplay.textContent = currentLng.toFixed(6);
                if (coordinateBadge) coordinateBadge.style.display = 'block';
                if (statusLocationText) statusLocationText.textContent = 'Lokasi aktif';
                
                if (homepageMarker) {
                    homepageMarker.setLatLng([currentLat, currentLng]);
                }
                if (homepageMap) {
                    homepageMap.setView([currentLat, currentLng], 15);
                }
                
                document.getElementById('loadingBackdrop').style.display = 'none';
                alert('Lokasi berhasil didapatkan: ' + displayLocation);
            }).catch(error => {
                console.error('Reverse geocode error:', error);
                const coordDisplay = `${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`;
                document.getElementById('jobLocation').value = coordDisplay;
                document.getElementById('jobLatitude').value = currentLat;
                document.getElementById('jobLongitude').value = currentLng;
                document.getElementById('locationPreviewText').textContent = coordDisplay;
                document.getElementById('locationPreview').style.display = 'block';
                
                document.getElementById('loadingBackdrop').style.display = 'none';
                alert('Lokasi berhasil didapatkan! (Koordinat)');
            });
        },
        (error) => {
            console.error('Geolocation error:', error);
            document.getElementById('loadingBackdrop').style.display = 'none';
            
            let errorMessage = 'Gagal mendapatkan lokasi: ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Izin lokasi ditolak. Silakan izinkan akses lokasi.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Informasi lokasi tidak tersedia.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Waktu permintaan lokasi habis.';
                    break;
                default:
                    errorMessage += error.message;
            }
            alert(errorMessage);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function resetLocation() {
    currentLat = null;
    currentLng = null;
    currentAddress = '';
    
    const jobLocation = document.getElementById('jobLocation');
    const jobLatitude = document.getElementById('jobLatitude');
    const jobLongitude = document.getElementById('jobLongitude');
    const jobFormattedAddress = document.getElementById('jobFormattedAddress');
    const locationPreview = document.getElementById('locationPreview');
    
    if (jobLocation) jobLocation.value = '';
    if (jobLatitude) jobLatitude.value = '';
    if (jobLongitude) jobLongitude.value = '';
    if (jobFormattedAddress) jobFormattedAddress.value = '';
    if (locationPreview) locationPreview.style.display = 'none';
    
    closeOsmMapModalFunc();
}

// Fungsi dummy untuk OSM (tetap ada agar tidak error)
function closeOsmMapModalFunc() {
    console.log('closeOsmMapModalFunc dipanggil');
    const osmMapModal = document.getElementById('osmMapModal');
    if (osmMapModal) {
        osmMapModal.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
}

function refreshMapLocation() {
    console.log('refreshMapLocation dipanggil');
    if (currentLat && currentLng) {
        alert(`Koordinat saat ini: ${currentLat}, ${currentLng}`);
    } else {
        alert('Belum ada lokasi yang dipilih');
    }
}

function copyOsmCoordinates() {
    console.log('copyOsmCoordinates dipanggil');
    if (currentLat && currentLng) {
        const coordText = `${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`;
        navigator.clipboard.writeText(coordText).then(() => {
            alert('Koordinat berhasil disalin!');
        });
    } else {
        alert('Belum ada koordinat untuk disalin');
    }
}

function confirmOsmLocation() {
    console.log('confirmOsmLocation dipanggil');
    alert('Fitur peta sedang dalam pengembangan');
    closeOsmMapModalFunc();
}

function centerHomepageMap() {
    console.log('centerHomepageMap dipanggil');
    if (homepageMap && currentLat && currentLng) {
        homepageMap.setView([currentLat, currentLng], 15);
    }
}

function initHomepageMap() {
    console.log('initHomepageMap dipanggil - fitur ditunda');
}

// ========== LOKASI SEDERHANA ==========
function setupLocationButton() {
    const btn = document.getElementById('simpleLocationBtn');
    if (!btn) {
        console.log('Tombol belum ada, coba lagi nanti...');
        setTimeout(setupLocationButton, 500);
        return;
    }
    
    console.log('Tombol ditemukan, memasang event listener...');
    
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Tombol DIKLIK!');
        
        if (!navigator.geolocation) {
            alert('Browser tidak mendukung geolocation');
            return;
        }
        
        document.getElementById('loadingBackdrop').style.display = 'flex';
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                console.log('Sukses:', position.coords);
                
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                document.getElementById('jobLatitude').value = lat;
                document.getElementById('jobLongitude').value = lng;
                document.getElementById('jobLocation').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                
                const preview = document.getElementById('simpleLocationPreview');
                const previewText = document.getElementById('simpleLocationText');
                if (preview && previewText) {
                    previewText.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    preview.style.display = 'block';
                }
                
                const googleDiv = document.getElementById('simpleGoogleLink');
                const googleLink = document.getElementById('simpleGoogleMapsLink');
                if (googleDiv && googleLink) {
                    googleLink.href = `https://www.google.com/maps?q=${lat},${lng}`;
                    googleDiv.style.display = 'block';
                }
                
                document.getElementById('loadingBackdrop').style.display = 'none';
                alert('Lokasi berhasil didapatkan!');
            },
            function(error) {
                console.error('Error:', error);
                document.getElementById('loadingBackdrop').style.display = 'none';
                
                let msg = 'Gagal: ';
                switch(error.code) {
                    case 1: msg += 'Izin ditolak'; break;
                    case 2: msg += 'Lokasi tidak tersedia'; break;
                    case 3: msg += 'Waktu habis'; break;
                    default: msg += error.message;
                }
                alert(msg);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });
    
    console.log('Selesai!');
}

function updateEmergencyDisplay() {
    console.log('updateEmergencyDisplay dipanggil');
}

// ========== PERBAIKAN SAVE JOB TO DATABASE ==========
async function saveJobToDatabase() {
    console.log('saveJobToDatabase dipanggil!');
    
    // Validasi login
    if (!currentUser) {
        showNotification('Anda harus login terlebih dahulu', 'error');
        return false;
    }
    
    // Validasi role (hanya requester)
    if (currentUser.role !== 'requester') {
        showNotification('Hanya Requester yang dapat memposting pekerjaan!', 'error');
        return false;
    }
    
    // Ambil nilai dari form
    const jobTitleEl = document.getElementById('jobTitle');
    const jobCategoryEl = document.getElementById('jobCategory');
    const jobDescriptionEl = document.getElementById('jobDescription');
    const jobLocationEl = document.getElementById('jobLocation');
    const jobLatitudeEl = document.getElementById('jobLatitude');
    const jobLongitudeEl = document.getElementById('jobLongitude');
    const emergencyJobEl = document.getElementById('emergencyJob');
    const jobImageEl = document.getElementById('jobImage');
    
    // Validasi elemen form
    if (!jobTitleEl || !jobCategoryEl || !jobDescriptionEl || !jobLocationEl) {
        showNotification('Terjadi kesalahan: Form tidak lengkap. Silakan refresh halaman.', 'error');
        return false;
    }
    
    // Ambil nilai
    const title = jobTitleEl.value.trim();
    const category = jobCategoryEl.value;
    const description = jobDescriptionEl.value.trim();
    const location = jobLocationEl.value.trim();
    const latitude = jobLatitudeEl ? jobLatitudeEl.value : '';
    const longitude = jobLongitudeEl ? jobLongitudeEl.value : '';
    const jobImage = jobImageEl ? jobImageEl.files[0] : null;
    
    // Emergency
    let emergency = 0;
    if (emergencyJobEl) {
        emergency = emergencyJobEl.checked ? 1 : 0;
    }
    
    // Ambil tip dari dropdown
    const tip = getTipValue();
    
    // Validasi input
    if (!title) {
        showNotification('Judul pekerjaan harus diisi!', 'error');
        return false;
    }
    
    if (!category) {
        showNotification('Kategori harus dipilih!', 'error');
        return false;
    }
    
    if (!description) {
        showNotification('Deskripsi pekerjaan harus diisi!', 'error');
        return false;
    }
    
    if (!location) {
        showNotification('Alamat lokasi pekerjaan harus diisi!', 'error');
        return false;
    }
    
    // Validasi gambar (opsional)
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
    
    // Koordinat default Jakarta jika tidak ada
    const finalLatitude = latitude || '-6.2088';
    const finalLongitude = longitude || '106.8456';
    
    // Hitung harga
    const tambahan = hitungTotalTambahan();
    const subtotal = hitungSubtotal();
    const tipVal = getTipValue();
    const emergencyFee = emergency === 1 ? 10000 : 0;
    const totalPrice = hargaDasar + tambahan + tipVal + emergencyFee;
    
    if (totalPrice < 10000) {
        showNotification('Minimal upah Rp 10.000', 'error');
        return false;
    }
    
    const requesterBalance = currentUser.wallet_requester || 0;
    const biayaAdmin = 2500;
    
    if (requesterBalance < biayaAdmin) {
        const confirmTopup = confirm(`Saldo Requester Anda tidak cukup untuk biaya admin Rp ${biayaAdmin.toLocaleString('id-ID')}. Apakah ingin top up sekarang?`);
        if (confirmTopup) {
            closeModal('createJobModal');
            openTopupModal();
        }
        return false;
    }
    
    // Tampilkan loading
    showLoading();
    
    const formData = new FormData();
    formData.append('user_id', currentUser.id);
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('location', location);
    formData.append('latitude', finalLatitude);
    formData.append('longitude', finalLongitude);
    formData.append('price', totalPrice);
    formData.append('tip', tipVal);
    formData.append('emergency', emergency);
    formData.append('admin_fee', biayaAdmin);
    
    if (jobImage) {
        formData.append('job_image', jobImage);
    }
    
    try {
        const response = await fetch('save_job.php', {
            method: 'POST',
            credentials: 'same-origin',
            body: formData
        });
        
        console.log('Response status:', response.status);
        
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('JSON parse error:', e);
            throw new Error('Server mengembalikan response tidak valid: ' + responseText.substring(0, 200));
        }
        
        if (result.success) {
            // Update saldo requester di frontend
            if (result.new_balance !== undefined) {
                currentUser.wallet_requester = result.new_balance;
            }
            
            // ========== PERBAIKAN: Refresh semua data ==========
            // 1. Refresh wallet
            await loadWalletFromDB();
            
            // 2. Refresh jobs dari database (dengan timestamp untuk hindari cache)
            await loadJobsFromDB();
            
            // 3. Refresh tampilan berdasarkan role aktif
            if (currentUser.role === 'requester') {
                loadRequesterJobs();
            } else {
                loadHelperJobs();
            }
            
            // 4. Refresh my jobs
            loadMyJobs();
            
            // 5. Tutup modal
            closeModal('createJobModal');
            
            // 6. Reset form
            document.getElementById('createJobForm').reset();
            currentSkor = [2, 1, 2, 1, 2, 1];
            const tipDropdown = document.getElementById('tipDropdown');
            if (tipDropdown) tipDropdown.value = '0';
            if (emergencyJobEl) emergencyJobEl.checked = false;
            removeImage();
            
            const locationPreview = document.getElementById('simpleLocationPreview');
            if (locationPreview) locationPreview.style.display = 'none';
            
            const googleLink = document.getElementById('simpleGoogleLink');
            if (googleLink) googleLink.style.display = 'none';
            
            updatePriceCalculation();
            updateWalletDisplay();
            
            showNotification('Permintaan berhasil diposting!', 'success');
            
            // ========== TAMBAHAN: Force refresh halaman beranda ==========
            // Pindah ke halaman beranda jika tidak di sana
            const homePage = document.getElementById('homePage');
            if (homePage && homePage.style.display !== 'block') {
                setActiveMenu('homePage');
            }
            
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
        document.getElementById('loadingBackdrop').style.display = 'none';
    }
}

function openTopupModal() {
    if (currentUser.role !== 'requester') {
        alert('Hanya Requester yang dapat melakukan top up. Helper hanya bisa menarik saldo.');
        return;
    }
    openModal('topupModal');
}

function openWithdrawModal() {
    if (currentUser.role !== 'helper') {
        alert('Hanya Helper yang dapat menarik saldo.');
        return;
    }
    openModal('withdrawModal');
}

// ===== WITHDRAW - Kalkulasi real-time =====
const BIAYA_ADMIN_WITHDRAW = 2500;

function updateWithdrawCalc(inputEl) {
    // Format input sebagai angka dengan titik ribuan
    let nilaiMurni = (inputEl.value || '').replace(/\D/g, '');
    if (nilaiMurni) {
        inputEl.value = formatRupiah(nilaiMurni);
    } else {
        inputEl.value = '';
    }

    let nominal = parseInt(nilaiMurni) || 0;
    let diterima = nominal > BIAYA_ADMIN_WITHDRAW ? nominal - BIAYA_ADMIN_WITHDRAW : 0;

    const elNominal = document.getElementById('withdrawSummaryNominal');
    const elNet     = document.getElementById('withdrawNetAmount');

    if (elNominal) elNominal.textContent = 'Rp ' + (nominal ? formatRupiah(nominal.toString()) : '0');
    if (elNet) {
        elNet.textContent = 'Rp ' + (diterima ? formatRupiah(diterima.toString()) : '0');
        elNet.style.color = diterima > 0 ? '#1a6b3c' : '#e74c3c';
    }
}

// Submit withdraw
document.getElementById('withdrawForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!currentUser || currentUser.role !== 'helper') {
        alert('Hanya Helper yang dapat menarik saldo');
        return;
    }

    // Ambil nilai murni dari input yang sudah diformat
    let nominalRaw = (document.getElementById('withdrawNominal').value || '').replace(/\D/g, '');
    let nominal    = parseInt(nominalRaw) || 0;
    let bank          = document.getElementById('withdrawBank').value;
    let accountNumber = document.getElementById('withdrawAccountNumber').value;
    let accountName   = document.getElementById('withdrawAccountName').value;

    if (nominal < 50000) {
        alert('Minimal penarikan Rp 50.000');
        return;
    }

    if (nominal > (currentUser.wallet_helper || 0)) {
        alert('Saldo helper tidak mencukupi');
        return;
    }

    showLoading();

    let formData = new FormData();
    formData.append('user_id', currentUser.id);
    formData.append('nominal', nominal);
    formData.append('bank', bank);
    formData.append('account_number', accountNumber);
    formData.append('account_name', accountName);

    try {
        let response = await fetch('withdraw.php', {
            method: 'POST',
            body: formData
        });

        let result = await response.json();

        // Di dalam withdrawForm submit
if (result.success) {
    // Update local user data
    if (result.new_balance !== undefined) {
        currentUser.wallet_helper = result.new_balance;
    }
    
    // Refresh wallet from database (to get transaction history)
    await loadWalletFromDB();
    
    closeModal('withdrawModal');
    
    if (typeof showNotification === 'function') {
        showNotification(result.message || 'Permintaan penarikan berhasil diajukan!', 'success');
    } else {
        alert('Permintaan penarikan berhasil diajukan!');
    }
}
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan');
    } finally {
        document.getElementById('loadingBackdrop').style.display = 'none';
    }
});

 // ========== UPDATE WALLET VISIBILITY - BENAR-BENAR HILANG ==========
function updateWalletVisibility() {
    if (!currentUser) return;
    
    const isRequester = (currentUser.role === 'requester');
    const isHelper = (currentUser.role === 'helper');
    
    console.log('Updating wallet visibility - Role:', currentUser.role);
    
    // Update class di body untuk CSS
    if (isRequester) {
        document.body.classList.add('requester-mode');
        document.body.classList.remove('helper-mode');
    } else if (isHelper) {
        document.body.classList.add('helper-mode');
        document.body.classList.remove('requester-mode');
    } else {
        // Default untuk role 'user' - set ke requester
        document.body.classList.add('requester-mode');
        document.body.classList.remove('helper-mode');
        currentUser.role = 'requester';
    }
    
    // Update wallet cards visibility - langsung manipulasi DOM
    const walletRequesterCard = document.getElementById('walletRequesterCard');
    const walletHelperCard = document.getElementById('walletHelperCard');
    const walletRequesterPage = document.getElementById('walletRequesterPage');
    const walletHelperPage = document.getElementById('walletHelperPage');
    
    if (isRequester) {
        // Sembunyikan wallet helper, tampilkan wallet requester
        if (walletHelperCard) walletHelperCard.style.display = 'none';
        if (walletRequesterCard) walletRequesterCard.style.display = 'block';
        if (walletHelperPage) walletHelperPage.closest('.wallet-helper')?.setAttribute('style', 'display: none !important');
        
        // Update active wallet card
        const activeWalletCard = document.getElementById('activeWalletCard');
        const walletBalance = document.getElementById('walletBalance');
        const walletRoleHint = document.getElementById('walletRoleHint');
        const walletRoleIcon = document.getElementById('walletRoleIcon');
        const walletRoleIconIcon = document.getElementById('walletRoleIconIcon');
        const historyRoleHint = document.getElementById('historyRoleHint');
        const activeTopupBtn = document.getElementById('activeTopupBtn');
        const activeWithdrawBtn = document.getElementById('activeWithdrawBtn');
        
        if (activeWalletCard) activeWalletCard.style.background = 'linear-gradient(135deg, #e9f0ff, #d9e6ff)';
        if (activeWalletCard) activeWalletCard.style.borderLeft = '4px solid var(--primary)';
        if (walletBalance) walletBalance.style.color = 'var(--primary)';
        if (walletRoleHint) walletRoleHint.textContent = 'Mode: Requester';
        if (walletRoleHint) walletRoleHint.style.color = 'var(--primary)';
        if (walletRoleIcon) walletRoleIcon.style.background = 'var(--primary)';
        if (walletRoleIconIcon) {
            walletRoleIconIcon.className = 'fas fa-user-tie';
            walletRoleIconIcon.style.color = 'white';
        }
        if (historyRoleHint) historyRoleHint.textContent = '(Transaksi Requester)';
        if (activeTopupBtn) activeTopupBtn.style.display = 'flex';
        if (activeWithdrawBtn) activeWithdrawBtn.style.display = 'none';
        if (walletBalance && currentUser.wallet_requester !== undefined) {
            walletBalance.textContent = 'Rp ' + formatRupiah(currentUser.wallet_requester);
        }
        
    } else if (isHelper) {
        // Sembunyikan wallet requester, tampilkan wallet helper
        if (walletRequesterCard) walletRequesterCard.style.display = 'none';
        if (walletHelperCard) walletHelperCard.style.display = 'block';
        if (walletRequesterPage) walletRequesterPage.closest('.wallet-requester')?.setAttribute('style', 'display: none !important');
        
        // Update active wallet card
        const activeWalletCard = document.getElementById('activeWalletCard');
        const walletBalance = document.getElementById('walletBalance');
        const walletRoleHint = document.getElementById('walletRoleHint');
        const walletRoleIcon = document.getElementById('walletRoleIcon');
        const walletRoleIconIcon = document.getElementById('walletRoleIconIcon');
        const historyRoleHint = document.getElementById('historyRoleHint');
        const activeTopupBtn = document.getElementById('activeTopupBtn');
        const activeWithdrawBtn = document.getElementById('activeWithdrawBtn');
        
        if (activeWalletCard) activeWalletCard.style.background = 'linear-gradient(135deg, #e6f7e6, #d4f0d4)';
        if (activeWalletCard) activeWalletCard.style.borderLeft = '4px solid var(--success)';
        if (walletBalance) walletBalance.style.color = 'var(--success)';
        if (walletRoleHint) walletRoleHint.textContent = 'Mode: Helper';
        if (walletRoleHint) walletRoleHint.style.color = 'var(--success)';
        if (walletRoleIcon) walletRoleIcon.style.background = 'var(--success)';
        if (walletRoleIconIcon) {
            walletRoleIconIcon.className = 'fas fa-hands-helping';
            walletRoleIconIcon.style.color = 'white';
        }
        if (historyRoleHint) historyRoleHint.textContent = '(Transaksi Helper)';
        if (activeTopupBtn) activeTopupBtn.style.display = 'none';
        if (activeWithdrawBtn) activeWithdrawBtn.style.display = 'flex';
        if (walletBalance && currentUser.wallet_helper !== undefined) {
            walletBalance.textContent = 'Rp ' + formatRupiah(currentUser.wallet_helper);
        }
    }
    
    // Update wallet elements di sidebar dan其他地方
    const requesterWallets = document.querySelectorAll('.wallet-requester');
    const helperWallets = document.querySelectorAll('.wallet-helper');
    
    requesterWallets.forEach(el => {
        if (el) {
            el.style.display = isRequester ? 'flex' : 'none';
        }
    });
    
    helperWallets.forEach(el => {
        if (el) {
            el.style.display = isHelper ? 'flex' : 'none';
        }
    });
    
    console.log('Wallet visibility updated - Requester mode:', isRequester, 'Helper mode:', isHelper);
}

window.testMap = function() {
    console.log('=== TEST MAP ===');
    console.log('CurrentUser:', currentUser);
    console.log('CurrentLat:', currentLat);
    console.log('CurrentLng:', currentLng);
    
    const mapContainer = document.getElementById('openstreetmap');
    console.log('Map container:', mapContainer);
    if (mapContainer) {
        console.log('Container dimensions:', mapContainer.clientHeight, 'x', mapContainer.clientWidth);
        console.log('Container visible:', mapContainer.offsetParent !== null);
    }
    
    const osmContainer = document.getElementById('osmMapContainer');
    console.log('OSM Modal container:', osmContainer);
    
    console.log('HomepageMap exists:', !!homepageMap);
    console.log('Map exists:', !!map);
    
    console.log('Mencoba inisialisasi ulang...');
    initHomepageMap();
};

// Setup location button saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM siap - Setup tombol lokasi');
    setupLocationButton();
    setupSidebarLinks();
});

// ========== Init ==========
updateNotificationBadge();

// ========== UPLOAD GAMBAR PREVIEW ==========
// Preview gambar sebelum upload
document.getElementById('jobImage')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const previewDiv = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImg');
            previewImg.src = event.target.result;
            previewDiv.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

function removeImage() {
    document.getElementById('jobImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewImg').src = '#';
}

// ==========================================================
// FUNGSI KHUSUS MENU UTAMA UPLOAD BUKTI DUKUNG (SIDEBAR)
// ==========================================================

// Membuka modal upload bukti dari tombol Selesai di job card
function openUploadBuktiModal(jobId) {
    if (!currentUser) { alert('Anda harus login terlebih dahulu.'); return; }
    if (!jobId) { alert('ID pekerjaan tidak valid.'); return; }

    // Isi hidden field job_id
    const hiddenJobId = document.getElementById('modalBuktiJobId');
    if (hiddenJobId) hiddenJobId.value = jobId;

    // Tampilkan info pekerjaan
    const job = jobs.find(j => parseInt(j.id) === parseInt(jobId));
    const jobInfo  = document.getElementById('uploadBuktiJobInfo');
    const jobTitle = document.getElementById('uploadBuktiJobTitle');
    if (jobInfo && jobTitle) {
        jobTitle.textContent = job ? `#${job.id} — ${job.title}` : `Pekerjaan #${jobId}`;
        jobInfo.style.display = 'flex';
        jobInfo.style.alignItems = 'center';
        jobInfo.style.gap = '8px';
    }

    // Reset form sebelum buka
    const form = document.getElementById('formUploadBuktiModal');
    if (form) form.reset();
    clearBuktiFile();

    const btn = document.getElementById('btnKirimBukti');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Bukti'; }

    // Buka modal
    const modal = document.getElementById('uploadBuktiModal');
    if (modal) { modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}

// Reset preview file gambar di modal
function clearBuktiFile() {
    const fileInput = document.getElementById('buktiFileUtama');
    const preview   = document.getElementById('buktiFilePreview');
    const thumb     = document.getElementById('buktiImageThumb');
    const thumbImg  = document.getElementById('buktiThumbImg');
    const label     = document.getElementById('buktiFileLabel');
    if (fileInput) fileInput.value = '';
    if (preview)   preview.style.display = 'none';
    if (thumb)     thumb.style.display = 'none';
    if (thumbImg)  thumbImg.src = '';
    if (label)     { label.style.borderColor = '#b0c4e8'; label.style.background = '#f8faff'; }
}

async function populateActiveJobsDropdown() {
    const dropdown = document.getElementById('buktiSelectJob');
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">-- Memuat pekerjaan... --</option>';

    if (!currentUser || !currentUser.id) {
        dropdown.innerHTML = '<option value="">-- Anda harus login terlebih dahulu --</option>';
        return;
    }

    try {
        let response = await fetch(`get_jobs.php?type=helper&user_id=${currentUser.id}`);
        let result   = await response.json();

        if (result.success && result.jobs) {
            const activeJobs = result.jobs.filter(
                job => job.status === 'ongoing' || job.status === 'in-progress'
            );
            if (activeJobs.length === 0) {
                dropdown.innerHTML = '<option value="">-- Tidak ada pekerjaan aktif --</option>';
            } else {
                let html = '<option value="">-- Pilih Pekerjaan yang Selesai --</option>';
                activeJobs.forEach(job => {
                    html += `<option value="${job.id}">#${job.id} — ${job.title} (Rp ${parseInt(job.price).toLocaleString('id-ID')})</option>`;
                });
                dropdown.innerHTML = html;
            }
        } else {
            dropdown.innerHTML = '<option value="">-- Gagal memuat daftar pekerjaan --</option>';
        }
    } catch (error) {
        console.error('Error populateActiveJobsDropdown:', error);
        dropdown.innerHTML = '<option value="">-- Terjadi kesalahan sistem --</option>';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const formUploadBuktiUtama = document.getElementById('formUploadBuktiUtama');
    if (formUploadBuktiUtama) {
        formUploadBuktiUtama.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const jobId = document.getElementById('buktiSelectJob').value;
            const fileInput = document.getElementById('buktiFileUtama');

            if (!jobId) {
                alert('Silakan pilih pekerjaan terlebih dahulu!');
                return;
            }
            if (fileInput.files.length === 0) {
                alert('Silakan pilih file gambar bukti penyelesaian!');
                return;
            }

            // Tampilkan backdrop loading jika ada di sistem Anda
            if (document.getElementById('loadingBackdrop')) {
                document.getElementById('loadingBackdrop').style.display = 'flex';
            }

            const formData = new FormData(this);
            // Pastikan job_id terkirim dengan benar
            formData.set('job_id', jobId);

            try {
                let response = await fetch('upload_completion.php', {
                    method: 'POST',
                    body: formData
                });
                
                let result = await response.json();
                
                if (document.getElementById('loadingBackdrop')) {
                    document.getElementById('loadingBackdrop').style.display = 'none';
                }

                if (result.success) {
                    alert(result.message);
                    // Reset form dan segarkan dropdown serta data halaman
                    formUploadBuktiUtama.reset();
                    populateActiveJobsDropdown();
                    
                    // ========== PERBAIKAN: Tambahkan ini ==========
                    // Refresh semua data dari database
                    if (typeof loadJobsFromDB === 'function') {
                        await loadJobsFromDB();  // Ini akan refresh variable jobs
                    }
                    
                    // Refresh tampilan My Jobs (termasuk tab Menunggu ACC)
                    if (typeof loadMyJobs === 'function') {
                        loadMyJobs();
                    }
                    
                    // Refresh tampilan helper jobs juga
                    if (typeof loadHelperJobs === 'function') {
                        loadHelperJobs();
                    }
                    
                    // Refresh tampilan requester jobs
                    if (typeof loadRequesterJobs === 'function') {
                        loadRequesterJobs();
                    }
                    // ========== END PERBAIKAN ==========
                    
                    if (typeof checkSession === 'function') checkSession(); // Refresh statistik/saldo dashboard
                } else {
                    alert('Gagal mengirim bukti: ' + result.message);
                }
            } catch (error) {
                console.error('Error submitting completion form:', error);
                alert('Terjadi kesalahan sistem saat mengirim data.');
                if (document.getElementById('loadingBackdrop')) {
                    document.getElementById('loadingBackdrop').style.display = 'none';
                }
            }
        });
    }
    // ── Preview file saat dipilih di modal ──────────────────────────────
    const buktiFileInput = document.getElementById('buktiFileUtama');
    if (buktiFileInput) {
        buktiFileInput.addEventListener('change', function () {
            const file     = this.files[0];
            const preview  = document.getElementById('buktiFilePreview');
            const nameText = document.getElementById('buktiFileNameText');
            const thumb    = document.getElementById('buktiImageThumb');
            const thumbImg = document.getElementById('buktiThumbImg');
            const label    = document.getElementById('buktiFileLabel');

            if (!file) { clearBuktiFile(); return; }

            if (file.size > 10 * 1024 * 1024) {
                alert('Ukuran file terlalu besar. Maksimal 10MB.');
                this.value = ''; clearBuktiFile(); return;
            }
            const ext = file.name.split('.').pop().toLowerCase();
            if (!['jpg','jpeg','png'].includes(ext)) {
                alert('Format file tidak didukung. Gunakan JPG atau PNG.');
                this.value = ''; clearBuktiFile(); return;
            }

            if (preview && nameText) {
                nameText.textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
                preview.style.display = 'flex';
            }
            if (label) { label.style.borderColor = '#2D63A3'; label.style.background = '#eef3ff'; }
            if (thumb && thumbImg) {
                const reader = new FileReader();
                reader.onload = e => { thumbImg.src = e.target.result; thumb.style.display = 'block'; };
                reader.readAsDataURL(file);
            }
        });
    }

    // ── Submit handler modal upload bukti ───────────────────────────────
    const formModal = document.getElementById('formUploadBuktiModal');
    if (formModal) {
        formModal.addEventListener('submit', async function (e) {
            e.preventDefault();

            const jobId     = document.getElementById('modalBuktiJobId')?.value;
            const fileInput = document.getElementById('buktiFileUtama');
            const btn       = document.getElementById('btnKirimBukti');

            if (!jobId || parseInt(jobId) <= 0) {
                alert('ID pekerjaan tidak valid. Tutup modal dan buka dari tombol Selesai.');
                return;
            }
            if (!fileInput || fileInput.files.length === 0) {
                alert('Silakan pilih foto bukti penyelesaian terlebih dahulu.');
                return;
            }

            if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...'; }
            const backdrop = document.getElementById('loadingBackdrop');
            if (backdrop) backdrop.style.display = 'flex';

            const formData = new FormData(this);
            formData.set('job_id', jobId);

            try {
                const response = await fetch('upload_completion.php', { method: 'POST', body: formData });
                if (!response.ok) throw new Error('Server error: HTTP ' + response.status);
                const result = await response.json();

                if (result.success) {
                    closeModal('uploadBuktiModal');
                    if (typeof showNotification === 'function') {
                        showNotification(result.message || 'Bukti berhasil dikirim!', 'success');
                    } else { alert(result.message || 'Bukti berhasil dikirim!'); }
                    if (typeof loadJobsFromDB === 'function') await loadJobsFromDB();
                    if (typeof populateActiveJobsDropdown === 'function') populateActiveJobsDropdown();
                } else {
                    if (typeof showNotification === 'function') {
                        showNotification('Gagal: ' + result.message, 'error');
                    } else { alert('Gagal: ' + result.message); }
                    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Bukti'; }
                }
            } catch (err) {
                console.error('Error upload bukti modal:', err);
                alert('Terjadi kesalahan sistem: ' + err.message);
                if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Bukti'; }
            } finally {
                if (backdrop) backdrop.style.display = 'none';
            }
        });
    }
});



// =================================================================
// FUNGSI BARU: ACC / REJECT / REPORT / NOTIFIKASI / HELPER PENDING
// =================================================================

// ── Card requester saat menunggu ACC ────────────────────────────
function createRequesterAccCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.style.cssText = 'border-left:4px solid #2980b9;';

    const formattedPrice = 'Rp ' + (job.price||0).toLocaleString('id-ID');
    
    // PERBAIKAN: Pastikan completion_image ditampilkan dengan benar
    const completionImage = job.completion_image || '';
    const imgHtml = completionImage && completionImage !== ''
        ? `<img src="${completionImage}" alt="Bukti Pekerjaan" style="width:100%;height:160px;object-fit:cover;border-radius:8px;margin-bottom:10px;cursor:pointer;" onclick="event.stopPropagation(); openImageViewer('${completionImage}')">`
        : `<div style="background:#f1f5f9;border-radius:8px;padding:20px;text-align:center;margin-bottom:10px;color:#94a3b8;font-size:13px;"><i class="fas fa-image fa-2x"></i><br>Belum ada foto bukti</div>`;

    const rejectReason = job.reject_reason
        ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:10px;margin-bottom:10px;font-size:12px;color:#dc2626;"><i class="fas fa-exclamation-triangle"></i> <b>Alasan reject sebelumnya:</b> ${escapeHtml(job.reject_reason)}</div>`
        : '';

    card.innerHTML = `
        <div class="job-card-image" style="overflow:visible;padding:10px;">
            <div style="background:#dbeafe;color:#1d4ed8;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px;margin-bottom:8px;">
                <i class="fas fa-clock"></i> Menunggu ACC Anda
            </div>
            ${imgHtml}
        </div>
        <div class="job-card-info">
            <div class="job-card-title">${escapeHtml(job.title)}</div>
            <div class="job-card-price">${formattedPrice}</div>
            <div style="font-size:12px;color:#64748b;margin-bottom:4px;"><i class="fas fa-user"></i> Helper: ${escapeHtml(job.helper_name || '—')}</div>
            <div style="font-size:12px;color:#64748b;margin-bottom:10px;"><i class="fas fa-calendar"></i> ${job.date}</div>
            ${rejectReason}
            <div class="job-card-footer">
                <div style="display:flex;gap:8px;width:100%;flex-wrap:wrap;">
                    <button class="btn btn-primary" style="flex:1;background:#27ae60;border-color:#27ae60;font-size:12px;" onclick="event.stopPropagation(); accJob(${job.id})">
                        <i class="fas fa-check"></i> ACC / Setujui
                    </button>
                    <button class="btn btn-outline" style="flex:1;font-size:12px;color:#e74c3c;border-color:#e74c3c;" onclick="event.stopPropagation(); openRejectModal(${job.id})">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
                <button class="btn btn-outline" style="width:100%;margin-top:6px;font-size:11px;" onclick="event.stopPropagation(); openReportModal(${job.id})">
                    <i class="fas fa-flag"></i> Laporkan Masalah
                </button>
            </div>
        </div>`;
    return card;
}

// ========== FUNGSI REJECT ==========
function openRejectModal(jobId) {
    console.log('openRejectModal dipanggil untuk job:', jobId);
    
    // Cari data job
    const job = jobs.find(j => j.id === parseInt(jobId));
    if (!job) {
        console.error('Job tidak ditemukan:', jobId);
        showNotification('Pekerjaan tidak ditemukan', 'error');
        return;
    }
    
    // Set job id ke hidden field
    const jobIdField = document.getElementById('rejectJobId');
    if (jobIdField) {
        jobIdField.value = jobId;
    }
    
    // Set judul job di modal
    const titleEl = document.getElementById('rejectJobTitle');
    if (titleEl) {
        titleEl.textContent = job.title || `Pekerjaan #${jobId}`;
    }
    
    // Reset textarea
    const alasanEl = document.getElementById('rejectAlasan');
    if (alasanEl) {
        alasanEl.value = '';
    }
    
    // Buka modal
    openModal('rejectModal');
}

async function submitReject() {
    console.log('submitReject dipanggil');
    
    const jobId = document.getElementById('rejectJobId')?.value;
    const alasan = document.getElementById('rejectAlasan')?.value.trim();
    
    console.log('Job ID:', jobId, 'Alasan:', alasan);
    
    if (!jobId) {
        showNotification('ID pekerjaan tidak valid', 'error');
        return;
    }
    
    if (!alasan) {
        showNotification('Alasan reject wajib diisi', 'error');
        return;
    }
    
    if (!currentUser) {
        showNotification('Anda harus login terlebih dahulu', 'error');
        return;
    }
    
    showLoading();
    
    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('action', 'reject');
    formData.append('user_id', currentUser.id);
    formData.append('alasan', alasan);
    
    try {
        const response = await fetch('update_job.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        console.log('Response reject:', result);
        
        if (result.success) {
            showNotification('Bukti ditolak. Helper akan mendapat notifikasi untuk upload ulang.', 'warning');
            closeModal('rejectModal');
            
            // Refresh semua data
            await loadJobsFromDB();
            loadMyJobs();
            loadHelperJobs();
            loadRequesterJobs();
        } else {
            showNotification('Gagal: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error reject:', error);
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        document.getElementById('loadingBackdrop').style.display = 'none';
    }
}

// Panggil di awal saat DOM ready
function buildRejectModal() {
    // Cek apakah modal sudah ada
    if (document.getElementById('rejectModal')) {
        return;
    }
    
    const modalHtml = `
    <div id="rejectModal" class="modal">
        <div class="modal-content" style="max-width:420px;border-radius:18px;padding:0;overflow:visible;box-shadow:0 20px 60px rgba(185,28,28,.16);border:none;">
            <div class="modal-blue-header" style="background:linear-gradient(135deg,#b91c1c,#ef4444);border-radius:18px 18px 0 0;padding:20px 26px;position:relative;">
                <span class="close-modal" onclick="closeModal('rejectModal')" style="position:absolute;top:14px;right:18px;color:#fff;font-size:24px;cursor:pointer;opacity:.8;">&times;</span>
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:42px;height:42px;background:rgba(255,255,255,.18);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-times-circle" style="color:#fff;font-size:20px;"></i>
                    </div>
                    <div>
                        <div style="color:rgba(255,255,255,.72);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Tolak Bukti</div>
                        <div id="rejectJobTitle" style="color:#fff;font-size:15px;font-weight:700;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>
                    </div>
                </div>
            </div>
            <div class="modal-blue-body" style="padding:22px 26px;background:#fff;border-radius:0 0 18px 18px;">
                <input type="hidden" id="rejectJobId">
                <div style="background:#fff1f2;border:1.5px solid #fecdd3;border-radius:10px;padding:10px 13px;margin-bottom:16px;font-size:12px;color:#b91c1c;display:flex;gap:8px;align-items:flex-start;">
                    <i class="fas fa-exclamation-circle" style="margin-top:1px;flex-shrink:0;"></i>
                    <span>Helper akan mendapat notifikasi dan diminta untuk <b>upload ulang bukti</b> atau memperbaiki pekerjaan.</span>
                </div>
                <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:7px;text-transform:uppercase;letter-spacing:.4px;">
                    Alasan Penolakan <span style="color:#e74c3c;">*</span>
                </label>
                <textarea id="rejectAlasan" rows="4" placeholder="Jelaskan mengapa bukti ditolak (misal: foto tidak jelas, area belum bersih, pekerjaan belum selesai...)" class="modal-blue-input" style="width:100%;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;color:#334155;background:#f8faff;outline:none;resize:vertical;box-sizing:border-box;font-family:inherit;"></textarea>
                <div class="modal-blue-footer" style="display:flex;gap:10px;margin-top:20px;">
                    <button type="button" onclick="closeModal('rejectModal')" class="modal-btn-cancel" style="flex:1;padding:11px;border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;color:#64748b;font-size:14px;font-weight:600;cursor:pointer;">Batal</button>
                    <button type="button" onclick="submitReject()" class="modal-btn-submit" style="flex:2;padding:11px;border:none;border-radius:10px;background:linear-gradient(135deg,#b91c1c,#ef4444);color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 3px 12px rgba(185,28,28,.25);">
                        <i class="fas fa-times"></i> Tolak Bukti
                    </button>
                </div>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Panggil di DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    buildRejectModal();
    buildReportModal();
    // ... kode lainnya
});

// ── Card helper saat menunggu ACC (view only) ────────────────────
function createHelperPendingCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.style.cssText = 'border-left:4px solid #2563eb;background:linear-gradient(145deg,#eff6ff,#fff);';
    const formattedPrice = 'Rp ' + (job.price||0).toLocaleString('id-ID');
    const imgHtml = job.completion_image
        ? `<img src="${job.completion_image}" alt="Bukti" style="width:100%;max-height:140px;object-fit:cover;border-radius:8px;margin-top:8px;border:1.5px solid #bfdbfe;">`
        : '';
    card.innerHTML = `
        <div style="background:linear-gradient(90deg,#2563eb,#3b82f6);padding:8px 12px;display:flex;align-items:center;gap:7px;">
            <i class="fas fa-hourglass-half" style="color:#fff;font-size:13px;"></i>
            <span style="color:#fff;font-size:12px;font-weight:700;">Sedang Ditinjau Requester</span>
        </div>
        <div style="padding:12px;">
            <div class="job-card-title" style="font-size:0.85rem;margin-bottom:4px;">${escapeHtml(job.title)}</div>
            <div class="job-card-price">${formattedPrice}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:8px;"><i class="fas fa-calendar"></i> ${job.date}</div>
            <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:8px;padding:9px 12px;font-size:12px;color:#1d4ed8;display:flex;align-items:flex-start;gap:7px;">
                <i class="fas fa-info-circle" style="margin-top:1px;flex-shrink:0;"></i>
                <span>Bukti Anda sudah terkirim dan sedang menunggu persetujuan Requester. Dana masuk ke wallet setelah disetujui.</span>
            </div>
            ${imgHtml}
            <button onclick="event.stopPropagation();openReportModal(${job.id})"
                style="width:100%;margin-top:10px;padding:7px;background:#f8faff;color:#64748b;border:1.5px solid #e2e8f0;border-radius:9px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;"
                onmouseover="this.style.borderColor='#2563eb';this.style.color='#2563eb'" onmouseout="this.style.borderColor='#e2e8f0';this.style.color='#64748b'">
                <i class="fas fa-flag"></i> Laporkan Masalah
            </button>
        </div>`;
    return card;
}

// ── Card Helper: Perbaikan (perlu upload ulang bukti) ──────────────
function createHelperPerbaikanCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.style.cssText = 'border-left:4px solid #d97706;background:linear-gradient(145deg,#fff7ed,#fff);';
    const formattedPrice = 'Rp ' + (job.price||0).toLocaleString('id-ID');
    const rejectNote = job.reject_reason
        ? `<div style="background:#fef3c7;border:1.5px solid #fde68a;border-radius:8px;padding:9px 12px;margin-bottom:10px;font-size:12px;color:#92400e;display:flex;gap:7px;align-items:flex-start;">
               <i class="fas fa-comment-alt" style="margin-top:1px;flex-shrink:0;"></i>
               <span><b>Alasan reject:</b><br>${escapeHtml(job.reject_reason)}</span>
           </div>`
        : '';
    card.innerHTML = `
        <div style="background:linear-gradient(90deg,#d97706,#f59e0b);padding:8px 12px;display:flex;align-items:center;gap:7px;">
            <i class="fas fa-exclamation-triangle" style="color:#fff;font-size:13px;"></i>
            <span style="color:#fff;font-size:12px;font-weight:700;">Perlu Upload Ulang Bukti</span>
        </div>
        <div style="padding:12px;">
            <div class="job-card-title" style="font-size:0.85rem;margin-bottom:4px;">${escapeHtml(job.title)}</div>
            <div class="job-card-price">${formattedPrice}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:8px;"><i class="fas fa-calendar"></i> ${job.date}</div>
            ${rejectNote}
            <button onclick="event.stopPropagation(); goToUploadBukti(${job.id})"
                style="width:100%;padding:10px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;"
                onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
                <i class="fas fa-cloud-upload-alt"></i> Upload Ulang Bukti
            </button>
            <button onclick="event.stopPropagation();openReportModal(${job.id})"
                style="width:100%;margin-top:7px;padding:7px;background:#fff7ed;color:#92400e;border:1.5px solid #fde68a;border-radius:9px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;"
                onmouseover="this.style.borderColor='#d97706'" onmouseout="this.style.borderColor='#fde68a'">
                <i class="fas fa-flag"></i> Laporkan Masalah
            </button>
        </div>`;
    return card;
}

// ── Helper: klik "Upload Ulang Bukti" → navigasi ke halaman upload ─
// ========== FUNGSI UPLOAD ULANG BUKTI ==========
function goToUploadBukti(jobId) {
    console.log('goToUploadBukti dipanggil untuk job:', jobId);
    
    if (!currentUser) {
        showNotification('Anda harus login terlebih dahulu', 'error');
        return;
    }
    
    if (currentUser.role !== 'helper') {
        showNotification('Hanya Helper yang dapat mengupload bukti', 'error');
        return;
    }
    
    // Cek apakah job ada dan statusnya perbaikan
    const job = jobs.find(j => j.id == jobId);
    if (!job) {
        showNotification('Pekerjaan tidak ditemukan', 'error');
        return;
    }
    
    if (job.status !== 'perbaikan') {
        showNotification('Pekerjaan ini tidak memerlukan upload ulang', 'error');
        return;
    }
    
    if (job.helper_id != currentUser.id) {
        showNotification('Anda bukan helper untuk pekerjaan ini', 'error');
        return;
    }
    
    // Method 1: Buka modal upload langsung (RECOMMENDED)
    openUploadBuktiModal(jobId);
    
    // Method 2: Navigasi ke halaman upload bukti (alternatif)
    // Jika ingin pindah halaman, uncomment kode di bawah:
    /*
    // Set job id ke dropdown di halaman uploadBuktiPage
    const selectJob = document.getElementById('buktiSelectJob');
    if (selectJob) {
        // Tunggu dropdown terisi dulu
        setTimeout(() => {
            selectJob.value = jobId;
            selectJob.dispatchEvent(new Event('change'));
        }, 500);
    }
    
    // Pindah ke halaman upload bukti
    const uploadPageLink = document.querySelector('.sidebar-link[data-page="uploadBuktiPage"]');
    if (uploadPageLink) {
        uploadPageLink.click();
    } else {
        // Fallback: buka modal langsung
        openUploadBuktiModal(jobId);
    }
    */
}

// ── ACC job ──────────────────────────────────────────────────────
async function accJob(jobId) {
    if (!currentUser) return;
    const job = jobs.find(j => j.id === jobId);
    if (!confirm(`Setujui pekerjaan "${job?.title}" dan transfer dana ke Helper?`)) return;

    showLoading();
    const fd = new FormData();
    fd.append('job_id',  jobId);
    fd.append('action',  'acc');
    fd.append('user_id', currentUser.id);

    try {
        const res  = await fetch('update_job.php', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) {
            showNotification('Pekerjaan disetujui! Dana telah ditransfer ke Helper. ✅', 'success');
            // PERBAIKAN: Refresh jobs dan reload halaman untuk update status
            await loadJobsFromDB();
            // Refresh my jobs untuk update tab
            loadMyJobs();
            loadHelperJobs();
            loadRequesterJobs();
            // Tawarkan rating
            setTimeout(() => { if (job) giveRating(jobId); }, 800);
        } else {
            showNotification(data.message, 'error');
        }
    } catch(err) {
        showNotification('Terjadi kesalahan: ' + err.message, 'error');
    } finally {
        document.getElementById('loadingBackdrop').style.display = 'none';
    }
}

// ── Buka modal reject ────────────────────────────────────────────
async function submitReject() {
    const jobId  = parseInt(document.getElementById('rejectJobId').value);
    const alasan = document.getElementById('rejectAlasan').value.trim();
    if (!alasan) { showNotification('Alasan reject wajib diisi', 'error'); return; }

    showLoading();
    const fd = new FormData();
    fd.append('job_id',  jobId);
    fd.append('action',  'reject');
    fd.append('user_id', currentUser.id);
    fd.append('alasan',  alasan);

    try {
        const res  = await fetch('update_job.php', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) {
            showNotification('Bukti ditolak. Helper akan menerima notifikasi untuk upload ulang.', 'warning');
            closeModal('rejectModal');
            // PERBAIKAN: Refresh semua data
            await loadJobsFromDB();
            loadMyJobs();
            loadHelperJobs();
            loadRequesterJobs();
        } else {
            showNotification(data.message, 'error');
        }
    } catch(err) {
        showNotification('Terjadi kesalahan: ' + err.message, 'error');
    } finally {
        document.getElementById('loadingBackdrop').style.display = 'none';
    }
}

// ── Buka modal laporan masalah ────────────────────────────────────
function openReportModal(jobId) {
    const job = jobs.find(j => j.id === jobId);
    const el  = document.getElementById('reportModal');
    if (!el) { buildReportModal(); }

    document.getElementById('reportJobId').value = jobId;
    document.getElementById('reportJobTitle').textContent = job?.title || `#${jobId}`;
    document.getElementById('reportPesan').value = '';
    openModal('reportModal');
}

async function submitReport() {
    const jobId = parseInt(document.getElementById('reportJobId').value);
    const pesan = document.getElementById('reportPesan').value.trim();
    if (!pesan) { showNotification('Pesan laporan wajib diisi', 'error'); return; }

    showLoading();
    const fd = new FormData();
    fd.append('job_id',  jobId);
    fd.append('action',  'report');
    fd.append('user_id', currentUser.id);
    fd.append('role',    currentUser.role);
    fd.append('pesan',   pesan);

    try {
        const res  = await fetch('update_job.php', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) {
            showNotification('Laporan berhasil dikirim. Tim kami akan meninjau dalam 1x24 jam.', 'success');
            closeModal('reportModal');
        } else {
            showNotification(data.message, 'error');
        }
    } catch(err) {
        showNotification('Terjadi kesalahan', 'error');
    } finally {
        document.getElementById('loadingBackdrop').style.display = 'none';
    }
}

// ── Build modal reject (inject ke DOM jika belum ada) ────────────
function buildRejectModal() {
    const div = document.createElement('div');
    div.innerHTML = `
    <div id="rejectModal" class="modal">
      <div class="modal-content" style="max-width:420px;border-radius:16px;padding:0;overflow:visible;">
        <div style="background:linear-gradient(135deg,#c0392b,#e74c3c);padding:20px 24px;border-radius:16px 16px 0 0;position:relative;">
          <span class="close-modal" onclick="closeModal('rejectModal')" style="position:absolute;top:14px;right:18px;color:#fff;font-size:22px;cursor:pointer;">&times;</span>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:38px;height:38px;background:rgba(255,255,255,.18);border-radius:10px;display:flex;align-items:center;justify-content:center;">
              <i class="fas fa-times-circle" style="color:#fff;font-size:18px;"></i>
            </div>
            <div>
              <div style="color:rgba(255,255,255,.75);font-size:11px;font-weight:600;text-transform:uppercase;">Tolak Bukti</div>
              <div id="rejectJobTitle" style="color:#fff;font-size:15px;font-weight:700;"></div>
            </div>
          </div>
        </div>
        <div style="padding:20px 24px;background:#fff;border-radius:0 0 16px 16px;">
          <input type="hidden" id="rejectJobId">
          <label style="display:block;font-size:12px;font-weight:700;color:#444;margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px;">Alasan Penolakan <span style="color:#e74c3c;">*</span></label>
          <textarea id="rejectAlasan" rows="4" placeholder="Jelaskan mengapa bukti ditolak (misal: foto tidak jelas, pekerjaan belum selesai, dll)..."
            style="width:100%;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;color:#333;background:#fafafa;outline:none;resize:vertical;box-sizing:border-box;"
            onfocus="this.style.borderColor='#e74c3c'" onblur="this.style.borderColor='#e2e8f0'"></textarea>
          <div style="margin-top:4px;font-size:11px;color:#888;"><i class="fas fa-info-circle"></i> Helper akan mendapat notifikasi dan diminta upload ulang bukti</div>
          <div style="display:flex;gap:10px;margin-top:18px;">
            <button onclick="closeModal('rejectModal')" style="flex:1;padding:11px;border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;color:#555;font-size:14px;font-weight:600;cursor:pointer;">Batal</button>
            <button onclick="submitReject()" style="flex:2;padding:11px;border:none;border-radius:10px;background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
              <i class="fas fa-times"></i> Tolak Bukti
            </button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(div.firstElementChild);
}

// ── Build modal laporan masalah ──────────────────────────────────
function buildReportModal() {
    const div = document.createElement('div');
    div.innerHTML = `
    <div id="reportModal" class="modal">
      <div class="modal-content" style="max-width:420px;border-radius:16px;padding:0;overflow:visible;">
        <div style="background:linear-gradient(135deg,#7f8c8d,#95a5a6);padding:20px 24px;border-radius:16px 16px 0 0;position:relative;">
          <span class="close-modal" onclick="closeModal('reportModal')" style="position:absolute;top:14px;right:18px;color:#fff;font-size:22px;cursor:pointer;">&times;</span>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:38px;height:38px;background:rgba(255,255,255,.18);border-radius:10px;display:flex;align-items:center;justify-content:center;">
              <i class="fas fa-flag" style="color:#fff;font-size:18px;"></i>
            </div>
            <div>
              <div style="color:rgba(255,255,255,.75);font-size:11px;font-weight:600;text-transform:uppercase;">Laporkan Masalah</div>
              <div id="reportJobTitle" style="color:#fff;font-size:15px;font-weight:700;"></div>
            </div>
          </div>
        </div>
        <div style="padding:20px 24px;background:#fff;border-radius:0 0 16px 16px;">
          <input type="hidden" id="reportJobId">
          <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:12px;color:#92400e;">
            <i class="fas fa-shield-alt"></i> Laporan Anda bersifat rahasia dan akan ditinjau tim dalam 1×24 jam.
          </div>
          <label style="display:block;font-size:12px;font-weight:700;color:#444;margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px;">Deskripsi Masalah <span style="color:#e74c3c;">*</span></label>
          <textarea id="reportPesan" rows="4" placeholder="Ceritakan masalah yang Anda alami secara detail..."
            style="width:100%;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;color:#333;background:#fafafa;outline:none;resize:vertical;box-sizing:border-box;"
            onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e2e8f0'"></textarea>
          <div style="display:flex;gap:10px;margin-top:18px;">
            <button onclick="closeModal('reportModal')" style="flex:1;padding:11px;border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;color:#555;font-size:14px;font-weight:600;cursor:pointer;">Batal</button>
            <button onclick="submitReport()" style="flex:2;padding:11px;border:none;border-radius:10px;background:linear-gradient(135deg,#475569,#64748b);color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
              <i class="fas fa-paper-plane"></i> Kirim Laporan
            </button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(div.firstElementChild);
}

// ── Notifikasi bell ──────────────────────────────────────────────
let notifPolling = null;

async function loadNotifications() {
    if (!currentUser) return;
    try {
        const res  = await fetch(`get_notifications.php?user_id=${currentUser.id}`);
        const data = await res.json();
        if (!data.success) return;

        const notifs   = data.notifications || [];
        const unread   = notifs.filter(n => !n.is_read).length;
        const badge    = document.getElementById('notifBadge');
        const list     = document.getElementById('notifList');

        if (badge) {
            badge.textContent = unread > 0 ? unread : '';
            badge.style.display = unread > 0 ? 'flex' : 'none';
        }

        if (list) {
            if (notifs.length === 0) {
                list.innerHTML = `<div style="padding:20px;text-align:center;color:#94a3b8;font-size:13px;"><i class="fas fa-bell-slash fa-2x" style="margin-bottom:8px;display:block;"></i>Tidak ada notifikasi</div>`;
            } else {
                list.innerHTML = notifs.map(n => `
                    <div onclick="markNotifRead(${n.id})" style="padding:12px 16px;border-bottom:1px solid #f1f5f9;cursor:pointer;background:${n.is_read ? '#fff' : '#eff6ff'};display:flex;gap:10px;align-items:flex-start;">
                        <div style="width:32px;height:32px;border-radius:50%;background:${getNotifColor(n.type)};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <i class="fas ${getNotifIcon(n.type)}" style="color:#fff;font-size:13px;"></i>
                        </div>
                        <div>
                            <div style="font-size:13px;color:#1e293b;line-height:1.4;">${escapeHtml(n.message)}</div>
                            <div style="font-size:11px;color:#94a3b8;margin-top:3px;">${n.time_ago}</div>
                        </div>
                    </div>`).join('');
            }
        }
    } catch(err) {
        console.error('loadNotifications error:', err);
    }
}

function getNotifColor(type) {
    const colors = { payment:'#27ae60', pending_acc:'#2980b9', reject:'#e74c3c', info:'#7f8c8d' };
    return colors[type] || '#7f8c8d';
}
function getNotifIcon(type) {
    const icons = { payment:'fa-wallet', pending_acc:'fa-clock', reject:'fa-times-circle', info:'fa-bell' };
    return icons[type] || 'fa-bell';
}

async function markNotifRead(notifId) {
    if (!currentUser) return;
    const fd = new FormData();
    fd.append('notif_id', notifId);
    fd.append('user_id',  currentUser.id);
    await fetch('mark_notification_read.php', { method: 'POST', body: fd });
    loadNotifications();
}

function toggleNotifPanel() {
    const panel = document.getElementById('notifPanel');
    if (!panel) { buildNotifPanel(); toggleNotifPanel(); return; }
    const isOpen = panel.style.display === 'block';
    panel.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) loadNotifications();
}

function buildNotifPanel() {
    const div = document.createElement('div');
    div.innerHTML = `
    <div id="notifPanel" style="display:none;position:fixed;top:60px;right:16px;width:340px;max-height:420px;background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.15);z-index:9999;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="padding:14px 16px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:700;font-size:14px;color:#1e293b;"><i class="fas fa-bell" style="margin-right:6px;color:#3b82f6;"></i>Notifikasi</span>
        <button onclick="toggleNotifPanel()" style="border:none;background:none;cursor:pointer;color:#94a3b8;font-size:18px;">&times;</button>
      </div>
      <div id="notifList" style="overflow-y:auto;max-height:360px;"></div>
    </div>`;
    document.body.appendChild(div.firstElementChild);
}

// ── Image viewer (klik foto bukti) ──────────────────────────────
function openImageViewer(src) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
    overlay.innerHTML = `<img src="${src}" style="max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 4px 32px rgba(0,0,0,.4);">`;
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
}

// ── Start notif polling setelah login ────────────────────────────
function startNotifPolling() {
    if (notifPolling) clearInterval(notifPolling);
    loadNotifications();
    notifPolling = setInterval(loadNotifications, 30000); // tiap 30 detik
}

// Inject notif bell ke header/navbar saat user login
function injectNotifBell() {
    if (document.getElementById('notifBellBtn')) return;
    const userProfile = document.querySelector('.user-profile');
    if (!userProfile) return;
    const btn = document.createElement('button');
    btn.id = 'notifBellBtn';
    btn.style.cssText = 'position:relative;background:none;border:none;cursor:pointer;padding:6px 10px;font-size:20px;color:#2D63A3;';
    btn.innerHTML = `<i class="fas fa-bell"></i><span id="notifBadge" style="display:none;position:absolute;top:2px;right:4px;background:#e74c3c;color:#fff;font-size:10px;font-weight:700;padding:1px 5px;border-radius:10px;min-width:16px;text-align:center;"></span>`;
    btn.onclick = toggleNotifPanel;
    // Sisipkan setelah avatar+nama, sebelum tombol Keluar
    const keluarBtn = userProfile.querySelector('button');
    userProfile.insertBefore(btn, keluarBtn);
}


// Handler bersih untuk cleanup chat saat pindah halaman
// Stop polling saat pindah halaman (navigasi utama ditangani setActiveMenu)
document.querySelectorAll('.sidebar-link, .bottom-nav-item').forEach(link => {
    link.addEventListener('click', function() {
        if (this.dataset.page !== 'messagesPage') {
            if (chatState.pollingInterval) {
                clearInterval(chatState.pollingInterval);
                chatState.pollingInterval = null;
            }
        }
    });
});

// ========== UPLOAD BUKTI DARI CHAT ==========

// Fungsi utama untuk membuka modal upload bukti
// ========== OPEN UPLOAD BUKTI MODAL ==========
function openUploadBuktiModal(jobId) {
    console.log('openUploadBuktiModal dipanggil untuk job:', jobId);
    
    if (!currentUser) {
        showNotification('Anda harus login terlebih dahulu', 'error');
        return;
    }
    
    if (!jobId) {
        showNotification('ID pekerjaan tidak valid', 'error');
        return;
    }
    
    // Cari data job
    const job = jobs.find(j => j.id == jobId);
    if (!job) {
        showNotification('Data pekerjaan tidak ditemukan', 'error');
        return;
    }
    
    // Validasi: hanya helper yang mengerjakan job ini yang bisa upload
    if (currentUser.role !== 'helper') {
        showNotification('Hanya Helper yang dapat mengupload bukti penyelesaian', 'error');
        return;
    }
    
    if (job.helper_id != currentUser.id) {
        showNotification('Anda bukan helper yang bertugas untuk pekerjaan ini', 'error');
        return;
    }
    
    // Validasi status job (bisa in-progress/ongoing ATAU perbaikan)
    if (job.status !== 'in-progress' && job.status !== 'ongoing' && job.status !== 'perbaikan') {
        showNotification('Pekerjaan harus dalam status "Sedang Berjalan" atau "Perlu Perbaikan" untuk upload bukti', 'error');
        return;
    }
    
    // Buat atau dapatkan modal
    let modal = document.getElementById('uploadBuktiModalNew');
    if (!modal) {
        modal = createUploadBuktiModalNew();
    }
    
    // Set data job di modal
    const hiddenJobId = document.getElementById('uploadBuktiJobId');
    if (hiddenJobId) hiddenJobId.value = jobId;
    
    const jobTitleEl = document.getElementById('uploadBuktiJobTitleDisplay');
    if (jobTitleEl) jobTitleEl.textContent = `#${job.id} - ${job.title}`;
    
    // Tampilkan info alasan reject jika status perbaikan
    const rejectInfoDiv = document.getElementById('uploadBuktiRejectInfo');
    if (rejectInfoDiv) {
        if (job.status === 'perbaikan' && job.reject_reason) {
            rejectInfoDiv.style.display = 'block';
            const rejectReasonSpan = document.getElementById('uploadBuktiRejectReason');
            if (rejectReasonSpan) rejectReasonSpan.textContent = job.reject_reason;
        } else {
            rejectInfoDiv.style.display = 'none';
        }
    }
    
    // Reset form
    const form = document.getElementById('formUploadBuktiModalNew');
    if (form) form.reset();
    
    // Reset file input
    const fileInput = document.getElementById('uploadBuktiFileInput');
    if (fileInput) fileInput.value = '';
    
    // Reset preview
    const previewContainer = document.getElementById('uploadBuktiPreview');
    if (previewContainer) previewContainer.style.display = 'none';
    
    const previewImg = document.getElementById('uploadBuktiPreviewImg');
    if (previewImg) previewImg.src = '';
    
    // Reset tombol
    const submitBtn = document.getElementById('uploadBuktiSubmitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Bukti';
    }
    
    // Tampilkan modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Fungsi untuk membuat modal upload bukti baru
function createUploadBuktiModalNew() {
    // Hapus modal lama jika ada
    const oldModal = document.getElementById('uploadBuktiModalNew');
    if (oldModal) oldModal.remove();
    
    const modalHtml = `
    <div id="uploadBuktiModalNew" class="modal" style="display: none; position: fixed; z-index: 10001; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); align-items: center; justify-content: center;">
        <div class="modal-content" style="background: #ffffff; border-radius: 16px; width: 90%; max-width: 450px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2D63A3, #3A7BB0); padding: 20px 24px; color: white;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-cloud-upload-alt" style="font-size: 24px;"></i>
                    <div>
                        <h3 style="margin: 0; font-size: 1.2rem;">Upload Bukti Pengerjaan</h3>
                        <p style="margin: 4px 0 0 0; font-size: 0.8rem; opacity: 0.9;">Selesaikan pekerjaan dengan mengunggah bukti</p>
                    </div>
                </div>
                <button class="close-modal" onclick="closeUploadBuktiModalNew()" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 20px; cursor: pointer; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">&times;</button>
            </div>
            
            <!-- Body -->
            <div style="padding: 24px;">
                <!-- Info Alasan Reject (jika status perbaikan) -->
                <div id="uploadBuktiRejectInfo" style="display: none; background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="font-weight: 600; color: #856404; margin-bottom: 5px;">
                        <i class="fas fa-exclamation-triangle"></i> Pekerjaan Ditolak Requester
                    </div>
                    <div style="font-size: 0.85rem; color: #856404;">
                        Alasan: <span id="uploadBuktiRejectReason"></span>
                    </div>
                    <div style="font-size: 0.8rem; color: #856404; margin-top: 8px;">
                        Silakan perbaiki pekerjaan sesuai alasan di atas, lalu upload bukti baru.
                    </div>
                </div>
                
                <form id="formUploadBuktiModalNew" enctype="multipart/form-data">
                    <input type="hidden" id="uploadBuktiJobId" name="job_id">
                    
                    <!-- Info Pekerjaan -->
                    <div style="background: #f0f7ff; padding: 12px 16px; border-radius: 12px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-briefcase" style="color: #2D63A3;"></i>
                            <span style="font-weight: 600;">Pekerjaan:</span>
                            <span id="uploadBuktiJobTitleDisplay" style="color: #2D63A3; font-weight: 500;">-</span>
                        </div>
                    </div>
                    
                    <!-- Upload Area -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                            <i class="fas fa-image"></i> Foto Bukti Pengerjaan
                        </label>
                        <div id="uploadBuktiDropZone" style="border: 2px dashed #cbd5e1; border-radius: 12px; padding: 30px 20px; text-align: center; cursor: pointer; transition: all 0.2s; background: #f8fafc;">
                            <i class="fas fa-cloud-upload-alt" style="font-size: 40px; color: #94a3b8; margin-bottom: 8px;"></i>
                            <p style="margin: 0; color: #64748b;">Klik atau drag & drop file</p>
                            <small style="color: #94a3b8;">Format JPG, PNG (Max 5MB)</small>
                        </div>
                        <input type="file" id="uploadBuktiFileInput" name="bukti_file" accept=".jpg,.jpeg,.png" style="display: none;" required>
                        
                        <!-- Preview Area -->
                        <div id="uploadBuktiPreview" style="display: none; margin-top: 16px; position: relative;">
                            <img id="uploadBuktiPreviewImg" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <button type="button" onclick="clearUploadBuktiPreview()" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Submit Button -->
                    <button type="submit" id="uploadBuktiSubmitBtn" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #2D63A3, #3A7BB0); border: none; border-radius: 10px; color: white; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;">
                        <i class="fas fa-paper-plane"></i> Kirim Bukti
                    </button>
                </form>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Setup event listeners
    const modal = document.getElementById('uploadBuktiModalNew');
    const dropZone = document.getElementById('uploadBuktiDropZone');
    const fileInput = document.getElementById('uploadBuktiFileInput');
    const form = document.getElementById('formUploadBuktiModalNew');
    
    // Klik drop zone untuk upload file
    if (dropZone) {
        dropZone.onclick = () => fileInput.click();
        
        // Drag & drop
        dropZone.ondragover = (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#2D63A3';
            dropZone.style.background = '#eef2ff';
        };
        dropZone.ondragleave = (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#cbd5e1';
            dropZone.style.background = '#f8fafc';
        };
        dropZone.ondrop = (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#cbd5e1';
            dropZone.style.background = '#f8fafc';
            const files = e.dataTransfer.files;
            if (files.length) {
                fileInput.files = files;
                handleFilePreview(files[0]);
            }
        };
    }
    
    // File input change
    if (fileInput) {
        fileInput.onchange = (e) => {
            if (e.target.files.length) {
                handleFilePreview(e.target.files[0]);
            }
        };
    }
    
    // Form submit
    if (form) {
// Di dalam createUploadBuktiModalNew, bagian form.onsubmit
form.onsubmit = async (e) => {
    e.preventDefault();
    
    const jobId = document.getElementById('uploadBuktiJobId').value;
    const fileInput = document.getElementById('uploadBuktiFileInput');
    const file = fileInput.files[0];
    
    console.log('Submitting - Job ID:', jobId);
    console.log('File:', file);
    
    if (!jobId) {
        showNotification('ID pekerjaan tidak valid', 'error');
        return;
    }
    if (!file) {
        showNotification('Silakan pilih foto bukti terlebih dahulu', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('uploadBuktiSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    
    if (document.getElementById('loadingBackdrop')) {
        document.getElementById('loadingBackdrop').style.display = 'flex';
    }
    
    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('bukti_file', file);
    
    try {
        // PASTIKAN endpoint yang benar
        const response = await fetch('upload_completion.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        console.log('Response:', result);
        
        if (result.success) {
            closeUploadBuktiModalNew();
            showNotification(result.message || 'Bukti berhasil dikirim! Menunggu konfirmasi Requester.', 'success');
            
            // Refresh semua data
            await loadJobsFromDB();
            await loadMyJobs();
            await loadHelperJobs();
            await loadRequesterJobs();
        } else {
            showNotification('Gagal: ' + result.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Bukti';
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan saat mengirim bukti: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Bukti';
    } finally {
        if (document.getElementById('loadingBackdrop')) {
            document.getElementById('loadingBackdrop').style.display = 'none';
        }
    }
};
    }
    
    return modal;
}

// Handle preview file
function handleFilePreview(file) {
    if (!file) return;
    
    // Validasi type
    if (!file.type.startsWith('image/')) {
        showNotification('File harus berupa gambar', 'error');
        document.getElementById('uploadBuktiFileInput').value = '';
        return;
    }
    
    // Validasi size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Ukuran file maksimal 5MB', 'error');
        document.getElementById('uploadBuktiFileInput').value = '';
        return;
    }
    
    const previewContainer = document.getElementById('uploadBuktiPreview');
    const previewImg = document.getElementById('uploadBuktiPreviewImg');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Clear preview
function clearUploadBuktiPreview() {
    const fileInput = document.getElementById('uploadBuktiFileInput');
    const previewContainer = document.getElementById('uploadBuktiPreview');
    const previewImg = document.getElementById('uploadBuktiPreviewImg');
    const dropZone = document.getElementById('uploadBuktiDropZone');
    
    if (fileInput) fileInput.value = '';
    if (previewContainer) previewContainer.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (dropZone) {
        dropZone.style.borderColor = '#cbd5e1';
        dropZone.style.background = '#f8fafc';
    }
}

// Tutup modal upload bukti
function closeUploadBuktiModalNew() {
    const modal = document.getElementById('uploadBuktiModalNew');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Upload bukti dari chat
async function uploadBuktiFromChat() {
    if (!currentUser) {
        showNotification('Anda harus login terlebih dahulu', 'error');
        return;
    }
    
    if (!chatState.currentConversation) {
        showNotification('Pilih percakapan terlebih dahulu', 'error');
        return;
    }
    
    const jobId = chatState.currentConversation.job_id;
    const job = jobs.find(j => j.id == jobId);
    
    if (!job) {
        showNotification('Data pekerjaan tidak ditemukan', 'error');
        return;
    }
    
    // Validasi
    if (currentUser.role !== 'helper') {
        showNotification('Hanya Helper yang dapat mengupload bukti penyelesaian', 'error');
        return;
    }
    
    if (job.helper_id != currentUser.id) {
        showNotification('Anda bukan helper yang bertugas untuk pekerjaan ini', 'error');
        return;
    }
    
    if (job.status !== 'in-progress' && job.status !== 'ongoing') {
        showNotification('Pekerjaan harus dalam status "Sedang Berjalan" untuk upload bukti', 'error');
        return;
    }
    
    // Buka modal
    openUploadBuktiModal(jobId);
}

// =============================================
// POLLING NOTIFIKASI - VERSI DENGAN notifHelper
// =============================================

let lastNotificationId = 0;
let notificationPolling = null;
let isProcessing = false;

function startNotificationPolling() {
    if (notificationPolling) clearInterval(notificationPolling);
    
    const savedId = localStorage.getItem('lastNotificationId');
    if (savedId) lastNotificationId = parseInt(savedId);
    
    console.log('✅ Polling notifikasi dimulai, lastId:', lastNotificationId);
    
    notificationPolling = setInterval(async () => {
        if (!currentUser) return;
        if (isProcessing) return;
        
        isProcessing = true;
        
        try {
            const response = await fetch(`check_notifications.php?last_id=${lastNotificationId}&t=${Date.now()}`);
            const data = await response.json();
            
            if (data.success && data.notifications && data.notifications.length > 0) {
                console.log(`📢 Ada ${data.notifications.length} notifikasi baru`);
                
                for (const notif of data.notifications) {
                    if (notif.id > lastNotificationId) {
                        console.log(`📢 Menampilkan notifikasi ID:${notif.id} - ${notif.message.substring(0, 50)}`);
                        
                        // 🔥 PERUBAHAN: Ganti hendimenNotifier dengan notifHelper
                        if (typeof notifHelper !== 'undefined') {
                            let title = "Hendimen";
                            if (notif.type === 'payment') title = "💰 Pembayaran";
                            else if (notif.type === 'pending_acc') title = "⏰ Menunggu ACC";
                            else if (notif.type === 'reject') title = "❌ Ditolak";
                            else title = "🔔 Hendimen";
                            
                            notifHelper.show(title, notif.message);
                        } else if (typeof hendimenNotifier !== 'undefined') {
                            // Fallback ke yang lama
                            let title = "Hendimen";
                            if (notif.type === 'payment') title = "💰 Pembayaran";
                            else if (notif.type === 'pending_acc') title = "⏰ Menunggu ACC";
                            else if (notif.type === 'reject') title = "❌ Ditolak";
                            else title = "🔔 Hendimen";
                            
                            hendimenNotifier.show(title, notif.message, notif.type, notif.job_id);
                        } else {
                            console.log('⚠️ Tidak ada notifHelper atau hendimenNotifier!');
                        }
                        
                        if (notif.id > lastNotificationId) {
                            lastNotificationId = notif.id;
                            localStorage.setItem('lastNotificationId', lastNotificationId);
                        }
                    }
                }
                
                // Refresh badge notifikasi
                if (typeof loadNotifications === 'function') loadNotifications();
                if (typeof updateNotificationBadge === 'function') updateNotificationBadge();
            }
        } catch(e) { 
            console.log('Polling error:', e); 
        } finally {
            isProcessing = false;
        }
    }, 5000);
}

// Panggil fungsi ini setelah login
if (currentUser) {
    startNotificationPolling();
}

// 🔥 RESET LAST ID (jika perlu) - Panggil jika user logout
function resetNotificationLastId() {
    lastNotificationId = 0;
    localStorage.removeItem('lastNotificationId');
    console.log('Last notification ID direset');
}

// =============================================
// SINKRONISASI RATING KE BERANDA
// =============================================

async function syncRatingToBeranda() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`get_ratings.php?user_id=${currentUser.id}&type=received`);
        const result = await response.json();
        
        if (result.success) {
            const ratings = result.ratings || [];
            
            // Hitung rata-rata rating
            let totalRating = 0;
            ratings.forEach(r => totalRating += parseInt(r.rating));
            const avgRating = ratings.length > 0 ? (totalRating / ratings.length).toFixed(1) : '0.0';
            const totalUlasan = ratings.length;
            
            // Update di beranda (helper view)
            const ratingHelper = document.getElementById('berandaRatingHelper');
            const ulasanHelper = document.getElementById('berandaUlasanHelper');
            if (ratingHelper) ratingHelper.textContent = avgRating + ' ★';
            if (ulasanHelper) ulasanHelper.textContent = totalUlasan;
            
            // Update di beranda (requester view) - jika ada
            const ratingReq = document.getElementById('berandaRatingReq');
            const ulasanReq = document.getElementById('berandaUlasanReq');
            if (ratingReq) ratingReq.textContent = avgRating + ' ★';
            if (ulasanReq) ulasanReq.textContent = totalUlasan;
            
            console.log(`✅ Rating sinkron: ${avgRating} ★ (${totalUlasan} ulasan)`);
        }
    } catch (error) {
        console.error('Error sync rating:', error);
    }
}

// Reset saat resize (pastikan tetap desktop)
window.addEventListener('resize', function() {
    if (window.innerWidth < 1200) {
        document.body.style.minWidth = '1200px';
        document.documentElement.style.minWidth = '1200px';
    }
});

// Tambahkan di file javascript (1) (1).js - Update statistik beranda

// Update statistik requester di beranda
async function updateRequesterStats() {
    if (!currentUser || currentUser.role !== 'requester') return;
    
    const myJobs = jobs.filter(job => job.user_id === currentUser.id);
    const activeCount = myJobs.filter(job => job.status === 'open' || job.status === 'in-progress' || job.status === 'ongoing').length;
    const completedCount = myJobs.filter(job => job.status === 'completed').length;
    const totalSpent = myJobs.filter(job => job.status === 'completed').reduce((sum, job) => sum + (job.price || 0), 0);
    
    const activeCountEl = document.getElementById('activeJobsCount');
    const completedCountEl = document.getElementById('requesterCompletedCount');
    const spentEl = document.getElementById('requesterSpent');
    const reminderEl = document.getElementById('reminderActiveCount');
    
    if (activeCountEl) activeCountEl.textContent = activeCount;
    if (completedCountEl) completedCountEl.textContent = completedCount;
    if (spentEl) spentEl.textContent = 'Rp ' + totalSpent.toLocaleString('id-ID');
    if (reminderEl) reminderEl.textContent = activeCount;
}

// Update statistik helper di beranda
async function updateHelperStats() {
    if (!currentUser || currentUser.role !== 'helper') return;
    
    const myJobs = jobs.filter(job => job.helper_id === currentUser.id);
    const activeCount = myJobs.filter(job => job.status === 'in-progress' || job.status === 'ongoing').length;
    const completedCount = myJobs.filter(job => job.status === 'completed').length;
    const monthlyEarnings = myJobs.filter(job => {
        if (job.status !== 'completed') return false;
        const jobDate = new Date(job.date);
        const now = new Date();
        return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear();
    }).reduce((sum, job) => sum + (job.price || 0), 0);
    
    const activeCountEl = document.getElementById('helperActiveJobsCount');
    const completedCountEl = document.getElementById('helperCompletedJobsCount');
    const earningsEl = document.getElementById('berandaPendapatanHelper');
    const reminderEl = document.getElementById('helperReminderCount');
    
    if (activeCountEl) activeCountEl.textContent = activeCount;
    if (completedCountEl) completedCountEl.textContent = completedCount;
    if (earningsEl) earningsEl.textContent = 'Rp ' + monthlyEarnings.toLocaleString('id-ID');
    if (reminderEl) reminderEl.textContent = activeCount;
}

// ========== PERBAIKAN LOAD JOBS FROM DB ==========
async function loadJobsFromDB() {
    if (!currentUser) {
        console.log('loadJobsFromDB: No current user');
        return;
    }
    
    console.log('🔄 Loading jobs from database...');
    
    try {
        // 1. Load SEMUA pekerjaan yang statusnya 'open' (untuk helper view)
        const openJobsResponse = await fetch(`get_jobs.php?type=open&t=${Date.now()}`);
        const openJobsResult = await openJobsResponse.json();
        
        // 2. Load pekerjaan yang dibuat oleh user ini (untuk requester view)
        const myJobsResponse = await fetch(`get_jobs.php?type=requester&user_id=${currentUser.id}&t=${Date.now()}`);
        const myJobsResult = await myJobsResponse.json();
        
        // 3. Load pekerjaan yang sedang dikerjakan oleh user ini sebagai helper
        const helperJobsResponse = await fetch(`get_jobs.php?type=helper&user_id=${currentUser.id}&t=${Date.now()}`);
        const helperJobsResult = await helperJobsResponse.json();
        
        // 4. Load pending_acc jobs untuk requester
        const pendingJobsResponse = await fetch(`get_jobs.php?type=pending&t=${Date.now()}`);
        const pendingJobsResult = await pendingJobsResponse.json();
        
        // Gabungkan semua jobs
        let allJobs = [];
        const jobIds = new Set();
        
        // Helper function to add unique jobs
        const addUniqueJobs = (jobs) => {
            if (!jobs) return;
            jobs.forEach(job => {
                if (!jobIds.has(job.id)) {
                    jobIds.add(job.id);
                    allJobs.push(job);
                }
            });
        };
        
        addUniqueJobs(openJobsResult.jobs);
        addUniqueJobs(myJobsResult.jobs);
        addUniqueJobs(helperJobsResult.jobs);
        addUniqueJobs(pendingJobsResult.jobs);
        
        // Update global jobs array
        jobs = allJobs;
        
        console.log(`✅ Jobs loaded: ${jobs.length} total`);
        console.log(`   - Open: ${openJobsResult.jobs?.length || 0}`);
        console.log(`   - My jobs: ${myJobsResult.jobs?.length || 0}`);
        console.log(`   - Helper jobs: ${helperJobsResult.jobs?.length || 0}`);
        console.log(`   - Pending: ${pendingJobsResult.jobs?.length || 0}`);
        
        // Refresh semua tampilan yang bergantung pada jobs
        refreshAllJobDisplays();
        
        return true;
        
    } catch (error) {
        console.error('Error loading jobs:', error);
        return false;
    }
}

// ========== FUNGSI REFRESH SEMUA TAMPILAN JOB ==========
function refreshAllJobDisplays() {
    console.log('🔄 Refreshing all job displays...');
    
    // Refresh requester jobs
    if (document.getElementById('requesterView') && document.getElementById('requesterView').style.display !== 'none') {
        if (typeof loadRequesterJobs === 'function') {
            loadRequesterJobs();
            console.log('✅ Requester jobs refreshed');
        }
    }
    
    // Refresh helper jobs
    if (document.getElementById('helperView') && document.getElementById('helperView').style.display !== 'none') {
        if (typeof loadHelperJobs === 'function') {
            loadHelperJobs();
            console.log('✅ Helper jobs refreshed');
        }
    }
    
    // Refresh my jobs (Pekerjaan Saya)
    if (typeof loadMyJobs === 'function') {
        loadMyJobs();
        console.log('✅ My jobs refreshed');
    }
    
    // Refresh favorites
    if (typeof loadFavorites === 'function') {
        loadFavorites();
    }
    
    // Refresh history
    if (typeof loadHistory === 'function') {
        loadHistory();
    }
    
    // Update statistik
    if (typeof updateRequesterStats === 'function') {
        updateRequesterStats();
    }
    if (typeof updateHelperStats === 'function') {
        updateHelperStats();
    }
    
    console.log('✅ All job displays refreshed');
}

// Update rating stats di beranda
async function syncRatingToBeranda() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`get_ratings.php?user_id=${currentUser.id}&type=received`);
        const result = await response.json();
        
        if (result.success) {
            const ratings = result.ratings || [];
            
            let totalRating = 0;
            ratings.forEach(r => totalRating += parseInt(r.rating));
            const avgRating = ratings.length > 0 ? (totalRating / ratings.length).toFixed(1) : '0.0';
            const totalUlasan = ratings.length;
            
            // Update rating di beranda helper
            const ratingHelper = document.getElementById('berandaRatingHelper');
            const ulasanHelper = document.getElementById('berandaUlasanHelper');
            if (ratingHelper) ratingHelper.textContent = avgRating + ' ★';
            if (ulasanHelper) ulasanHelper.textContent = totalUlasan;
            
            // Update rating di beranda requester
            const ratingReq = document.getElementById('requesterRating');
            if (ratingReq) ratingReq.textContent = avgRating + ' ★';
            
            console.log(`✅ Rating sinkron: ${avgRating} ★ (${totalUlasan} ulasan)`);
        }
    } catch (error) {
        console.error('Error sync rating:', error);
    }
}

// ========== DESKTOP MODE PREFERENCE ==========
const DESKTOP_MODE_KEY = 'hendimen_desktop_mode';

function saveDesktopPreference() {
    localStorage.setItem(DESKTOP_MODE_KEY, 'true');
    localStorage.setItem('force_desktop', 'enabled');
    localStorage.setItem('desktop_mode_version', '2.0');
}

function isDesktopModeForced() {
    return localStorage.getItem(DESKTOP_MODE_KEY) === 'true' || 
           localStorage.getItem('force_desktop') === 'enabled';
}

function applyDesktopMode() {
    // Terapkan semua style desktop
    document.documentElement.style.minWidth = '1200px';
    document.body.style.minWidth = '1200px';
    document.body.style.overflowX = 'auto';
    
    // Set container
    const container = document.querySelector('.container');
    if (container) {
        container.style.minWidth = '1200px';
    }
    
    // Set sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.position = 'fixed';
        sidebar.style.left = '0';
        sidebar.style.top = '0';
        sidebar.style.width = '260px';
        sidebar.style.height = '100vh';
        sidebar.style.overflowY = 'auto';
    }
    
    // Set main content margin
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.marginLeft = '260px';
        mainContent.style.width = 'calc(100% - 260px)';
    }
}

// Panggil saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Simpan preferensi untuk user baru
    if (!isDesktopModeForced()) {
        saveDesktopPreference();
    }
    
    // Terapkan mode desktop
    applyDesktopMode();
    
    // Hapus semua class/mode mobile
    document.body.classList.remove('mobile-mode');
    document.body.classList.add('desktop-mode');
    
    // Nonaktifkan event listener mobile
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.style.display = 'none';
    }
    
    const mobileOverlay = document.getElementById('mobileOverlay');
    if (mobileOverlay) {
        mobileOverlay.style.display = 'none';
    }
});

// ========== RESET UNTUK USER BARU ==========
// Pastikan user baru tidak terpengaruh cache lama

(function resetForNewUser() {
    // Cek apakah ini pertama kali user mengakses versi baru
    const hasSeenDesktopVersion = localStorage.getItem('hendimen_desktop_v2');
    
    if (!hasSeenDesktopVersion) {
        console.log('🆕 First time user - setting desktop mode');
        
        // Bersihkan cache layout lama
        localStorage.removeItem('sidebarCollapsed');
        localStorage.removeItem('mobileModeEnabled');
        
        // Set flag bahwa user sudah melihat versi desktop
        localStorage.setItem('hendimen_desktop_v2', 'true');
        localStorage.setItem('force_desktop', 'enabled');
        
        // Reload untuk memastikan layout baru
        setTimeout(() => {
            if (confirm('Mode Desktop telah diaktifkan untuk pengalaman terbaik. Reload halaman?')) {
                window.location.reload();
            }
        }, 500);
    }
})();

// ========== NOTIFICATION FIX FOR CHROME ==========
// Tambahkan di file javascript (1) (1).js

let notificationPermissionGranted = false;
let notificationRequested = false;

// Fungsi request notifikasi dengan user gesture
async function requestNotificationPermission() {
    // Cek apakah sudah pernah diminta
    if (notificationRequested) return notificationPermissionGranted;
    
    // Untuk Chrome, notifikasi harus dipicu oleh user gesture
    if (!('Notification' in window)) {
        console.log('Browser tidak mendukung notifikasi');
        return false;
    }
    
    // Cek permission yang sudah ada
    if (Notification.permission === 'granted') {
        notificationPermissionGranted = true;
        notificationRequested = true;
        return true;
    }
    
    if (Notification.permission === 'denied') {
        console.log('Notifikasi sudah ditolak oleh user');
        return false;
    }
    
    // Request permission - HARUS dari user gesture (klik tombol)
    try {
        const permission = await Notification.requestPermission();
        notificationPermissionGranted = permission === 'granted';
        notificationRequested = true;
        
        if (notificationPermissionGranted) {
            console.log('✅ Notifikasi diizinkan');
            // Tes notifikasi
            new Notification('Hendimen', {
                body: 'Notifikasi berhasil diaktifkan!',
                icon: '/favicon.ico'
            });
        } else {
            console.log('❌ Notifikasi ditolak');
        }
        
        return notificationPermissionGranted;
    } catch (error) {
        console.error('Error requesting notification:', error);
        return false;
    }
}

// Fungsi untuk menampilkan notifikasi (dengan fallback ke toast)
async function showBrowserNotification(title, message, type = 'info') {
    // Pastikan permission sudah granted
    const hasPermission = await requestNotificationPermission();
    
    if (hasPermission && Notification.permission === 'granted') {
        try {
            const notification = new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                silent: false,
                vibrate: [200, 100, 200] // Untuk mobile
            });
            
            // Klik notifikasi
            notification.onclick = function() {
                window.focus();
                notification.close();
            };
            
            // Auto close setelah 5 detik
            setTimeout(() => notification.close(), 5000);
            
            console.log('✅ Browser notification shown');
            return true;
        } catch (e) {
            console.error('Error showing notification:', e);
        }
    }
    
    // Fallback ke toast notification
    showToastNotification(title, message, type);
    return false;
}

// Toast notification sebagai fallback
function showToastNotification(title, message, type = 'info') {
    // Hapus toast lama
    const oldToast = document.querySelector('.custom-toast');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    
    let icon = '🔔';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    // Style toast
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: type === 'success' ? '#4CAF50' : (type === 'error' ? '#f44336' : '#2D63A3'),
        color: 'white',
        padding: '12px 16px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: '10000',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        maxWidth: '350px',
        transform: 'translateX(400px)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(toast);
    
    // Animasi masuk
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Tombol close
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.onclick = () => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        };
    }
    
    // Auto close setelah 5 detik
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Tombol untuk request izin notifikasi (di settings page)
function createNotificationRequestButton() {
    const settingsPage = document.getElementById('settingsPage');
    if (!settingsPage) return;
    
    const buttonHtml = `
        <div class="form-group" id="notificationSettings">
            <label>Notifikasi Browser</label>
            <div>
                <button type="button" id="requestNotifBtn" class="btn btn-outline">
                    <i class="fas fa-bell"></i> Aktifkan Notifikasi
                </button>
                <span id="notifStatus" style="margin-left: 10px; font-size: 0.8rem;"></span>
            </div>
            <small>Izinkan notifikasi untuk menerima update pekerjaan dan pesan</small>
        </div>
    `;
    
    // Cari tempat untuk menambahkan
    const existingNotif = document.getElementById('notificationSettings');
    if (!existingNotif) {
        const notifGroup = document.querySelector('#settingsPage .form-group');
        if (notifGroup) {
            notifGroup.insertAdjacentHTML('afterend', buttonHtml);
        }
    }
    
    // Event listener untuk tombol
    const requestBtn = document.getElementById('requestNotifBtn');
    if (requestBtn) {
        requestBtn.onclick = async () => {
            const granted = await requestNotificationPermission();
            const statusSpan = document.getElementById('notifStatus');
            if (granted) {
                statusSpan.innerHTML = '<i class="fas fa-check-circle" style="color: #4CAF50;"></i> Aktif';
                showToastNotification('Berhasil', 'Notifikasi browser telah diaktifkan', 'success');
            } else {
                statusSpan.innerHTML = '<i class="fas fa-times-circle" style="color: #f44336;"></i> Tidak diizinkan';
                showToastNotification('Gagal', 'Notifikasi tidak diizinkan. Cek pengaturan browser Anda.', 'error');
            }
        };
    }
    
    // Update status
    const statusSpan = document.getElementById('notifStatus');
    if (statusSpan && Notification.permission === 'granted') {
        statusSpan.innerHTML = '<i class="fas fa-check-circle" style="color: #4CAF50;"></i> Aktif';
    }
}

// Panggil saat halaman settings dibuka
function initNotificationSettings() {
    if (document.getElementById('settingsPage').style.display !== 'none') {
        createNotificationRequestButton();
    }
}

// Tambahkan observer untuk settings page
const settingsObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.target.id === 'settingsPage' && mutation.target.style.display === 'block') {
            createNotificationRequestButton();
        }
    });
});
settingsObserver.observe(document.getElementById('settingsPage'), { attributes: true });

// ========== SERVICE WORKER FOR CHROME NOTIFICATION ==========
// Register service worker untuk notifikasi di Chrome
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            
            // Request permission setelah service worker siap
            if (Notification.permission === 'default') {
                // Jangan langsung request, tunggu user gesture
                console.log('Notification permission not granted yet');
            }
            
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
    return null;
}

// Panggil saat user login/berinteraksi
async function enablePushNotifications() {
    const sw = await registerServiceWorker();
    if (sw && Notification.permission === 'granted') {
        // Subscribe to push
        const subscription = await sw.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
        });
        
        // Send to server
        await fetch('save_subscription.php', {
            method: 'POST',
            body: JSON.stringify({ subscription }),
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// ========== FIX NOTIFICATION FOR CHROME ==========
// Tambahkan di akhir file

// Request permission dengan user gesture
window.requestNotificationPermission = async function() {
    if (!('Notification' in window)) {
        console.log('Browser tidak support notifikasi');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        return true;
    }
    
    if (Notification.permission === 'denied') {
        alert('Notifikasi sudah ditolak. Silakan izinkan di pengaturan browser.');
        return false;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        new Notification('Hendimen', { body: 'Notifikasi berhasil diaktifkan!' });
        return true;
    }
    return false;
};

// Override notifHelper
if (window.notifHelper) {
    const originalShow = window.notifHelper.show;
    window.notifHelper.show = async function(title, message, type = 'info') {
        // Coba browser notification
        if (Notification.permission === 'granted') {
            new Notification(title, { body: message, icon: '/favicon.ico' });
        }
        
        // Always show toast as fallback
        let toast = document.querySelector('.custom-toast');
        if (toast) toast.remove();
        
        toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${type === 'success' ? '✅' : '🔔'}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: type === 'success' ? '#4CAF50' : '#2D63A3',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '12px',
            zIndex: '10000',
            maxWidth: '350px',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(toast);
        setTimeout(() => toast.style.transform = 'translateX(0)', 100);
        setTimeout(() => toast.remove(), 5000);
        
        // Audio feedback
        try {
            new Audio('/sound/notification.mp3').play();
        } catch(e) {}
    };
    
    console.log('✅ notifHelper updated for Chrome support');
}

// ========== KHUSUS UNTUK CHROME HP ==========
// Tambahkan di file javascript (1) (1).js

function createMobileNotificationButton() {
    console.log('Creating notification button for mobile...');
    
    // Cari container settings
    const settingsPage = document.getElementById('settingsPage');
    if (!settingsPage) {
        console.log('Settings page not found');
        return;
    }
    
    // Cek apakah tombol sudah ada
    if (document.getElementById('mobileNotifBtn')) {
        console.log('Button already exists');
        return;
    }
    
    // Buat container baru untuk mobile
    const mobileNotifDiv = document.createElement('div');
    mobileNotifDiv.className = 'form-group';
    mobileNotifDiv.id = 'mobileNotificationSettings';
    mobileNotifDiv.style.cssText = `
        margin-bottom: 18px;
        padding: 16px;
        background: #f0f7ff;
        border-radius: 12px;
        border: 1px solid var(--primary);
    `;
    
    mobileNotifDiv.innerHTML = `
        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <i class="fas fa-bell" style="color: var(--primary);"></i>
            <strong>Notifikasi Browser</strong>
        </label>
        <div>
            <button type="button" id="mobileNotifBtn" class="btn btn-primary" style="width: 100%; padding: 14px;">
                <i class="fas fa-bell"></i> Aktifkan Notifikasi
            </button>
            <div id="mobileNotifStatus" style="margin-top: 10px; font-size: 0.8rem; text-align: center;"></div>
        </div>
        <small style="display: block; margin-top: 10px; color: var(--gray);">
            🔔 Aktifkan notifikasi untuk mendapat pemberitahuan pesan dan update pekerjaan
        </small>
    `;
    
    // Cari tempat untuk menyisipkan (di awal settings page)
    const settingsContent = settingsPage.querySelector('div:first-child');
    if (settingsContent) {
        settingsContent.insertBefore(mobileNotifDiv, settingsContent.firstChild);
    } else {
        settingsPage.appendChild(mobileNotifDiv);
    }
    
    // Tambahkan event listener
    const notifBtn = document.getElementById('mobileNotifBtn');
    if (notifBtn) {
        notifBtn.addEventListener('click', async function() {
            console.log('Mobile notification button clicked');
            await requestNotificationForMobile();
        });
    }
    
    // Update status
    updateMobileNotificationStatus();
}

// Fungsi khusus untuk request notifikasi di mobile
async function requestNotificationForMobile() {
    console.log('Requesting notification permission on mobile...');
    
    const statusDiv = document.getElementById('mobileNotifStatus');
    
    // Cek dukungan browser
    if (!('Notification' in window)) {
        statusDiv.innerHTML = '<span style="color: red;">❌ Browser tidak mendukung notifikasi</span>';
        return;
    }
    
    // Cek permission
    if (Notification.permission === 'granted') {
        statusDiv.innerHTML = '<span style="color: green;">✅ Notifikasi sudah aktif</span>';
        showToastNotification('Info', 'Notifikasi sudah aktif', 'info');
        return;
    }
    
    if (Notification.permission === 'denied') {
        statusDiv.innerHTML = `
            <span style="color: red;">❌ Notifikasi diblokir</span>
            <br>
            <small>Silakan aktifkan manual di Pengaturan Browser > Notifikasi > Izinkan</small>
        `;
        showToastNotification('Info', 'Buka pengaturan browser untuk mengaktifkan notifikasi', 'warning');
        return;
    }
    
    // Request permission (harus dari user gesture - klik tombol)
    statusDiv.innerHTML = '<span style="color: orange;">⏳ Meminta izin...</span>';
    
    try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            statusDiv.innerHTML = '<span style="color: green;">✅ Notifikasi berhasil diaktifkan!</span>';
            showToastNotification('Berhasil', 'Notifikasi browser telah diaktifkan', 'success');
            
            // Tes notifikasi
            new Notification('Hendimen', {
                body: 'Notifikasi berhasil diaktifkan! Anda akan menerima update pekerjaan.',
                icon: '/favicon.ico',
                vibrate: [200, 100, 200]
            });
            
            // Simpan ke localStorage
            localStorage.setItem('notification_enabled', 'true');
            
        } else if (permission === 'denied') {
            statusDiv.innerHTML = `
                <span style="color: red;">❌ Izin notifikasi ditolak</span>
                <br>
                <small>Buka Pengaturan Chrome > Notifikasi > Izinkan hendimen</small>
            `;
            showToastNotification('Gagal', 'Izin notifikasi ditolak. Cek pengaturan browser.', 'error');
        } else {
            statusDiv.innerHTML = '<span style="color: orange;">⚠️ Izin tidak diberikan</span>';
        }
        
    } catch (error) {
        console.error('Error requesting notification:', error);
        statusDiv.innerHTML = '<span style="color: red;">❌ Gagal meminta izin notifikasi</span>';
    }
}

// Update status notifikasi di mobile
function updateMobileNotificationStatus() {
    const statusDiv = document.getElementById('mobileNotifStatus');
    if (!statusDiv) return;
    
    if (Notification.permission === 'granted') {
        statusDiv.innerHTML = '<span style="color: green;">✅ Notifikasi aktif</span>';
    } else if (Notification.permission === 'denied') {
        statusDiv.innerHTML = '<span style="color: red;">❌ Notifikasi diblokir</span>';
    } else {
        statusDiv.innerHTML = '<span style="color: orange;">⚡ Klik tombol untuk mengaktifkan</span>';
    }
}

// Panggil saat settings page dibuka (untuk mobile)
function initMobileNotification() {
    const settingsPage = document.getElementById('settingsPage');
    if (settingsPage && settingsPage.style.display === 'block') {
        // Cek apakah di mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            console.log('Mobile device detected, creating notification button');
            setTimeout(createMobileNotificationButton, 500);
        }
    }
}

// Observer untuk settings page
const mobileNotifObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        const settingsPage = document.getElementById('settingsPage');
        if (settingsPage && settingsPage.style.display === 'block') {
            initMobileNotification();
        }
    });
});

const settingsPageEl = document.getElementById('settingsPage');
if (settingsPageEl) {
    mobileNotifObserver.observe(settingsPageEl, { attributes: true });
}

// Panggil juga saat DOM ready
document.addEventListener('DOMContentLoaded', function() {
    initMobileNotification();
});

// ========== TOP UP - LANGSUNG QRIS DI MODAL YANG SAMA ==========

// Update nominal saat diinput
const topupNominalInput = document.getElementById('topupNominal');
if (topupNominalInput) {
    topupNominalInput.addEventListener('input', function(e) {
        let nilaiMurni = this.value.replace(/\D/g, '');
        
        if (nilaiMurni) {
            this.value = formatRupiah(nilaiMurni);
            let nominalAngka = parseInt(nilaiMurni) || 0;
            let saldoDiterima = nominalAngka;
            
            document.getElementById('summaryNominal').textContent = 'Rp ' + formatRupiah(nominalAngka.toString());
            
            const receivedEl = document.getElementById('topupReceivedAmount');
            if (saldoDiterima > 0) {
                receivedEl.textContent = 'Rp ' + formatRupiah(saldoDiterima.toString());
                receivedEl.style.color = '#28a745';
            } else {
                receivedEl.textContent = 'Rp 0';
                receivedEl.style.color = '#dc3545';
            }
            
            // Update total payment display
            document.getElementById('totalPaymentDisplay').innerHTML = 'Total Dibayar: Rp ' + (nominalAngka + 2500).toLocaleString('id-ID');
        } else {
            this.value = '';
            document.getElementById('summaryNominal').textContent = 'Rp 0';
            document.getElementById('topupReceivedAmount').textContent = 'Rp 0';
        }
    });
}

// Fungsi utama request topup
async function showQRISPayment() {
    console.log('Request top up dipanggil');
    
    if (!currentUser) {
        showNotification('Anda harus login terlebih dahulu', 'error');
        return;
    }
    
    if (currentUser.role !== 'requester') {
        showNotification('Hanya Requester yang dapat melakukan top up', 'error');
        return;
    }
    
    let nominalString = document.getElementById('topupNominal').value.replace(/\./g, '');
    let nominal = parseInt(nominalString) || 0;
    
    if (nominal < 10000) {
        showNotification('Minimal top up Rp 10.000', 'error');
        return;
    }
    
    // Tampilkan loading di tombol
    const btn = document.getElementById('topupPayBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    
    try {
        const formData = new FormData();
        formData.append('user_id', currentUser.id);
        formData.append('nominal', nominal);
        formData.append('method', 'qris');
        
        const response = await fetch('topup.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Tampilkan QRIS section
            const qrisSection = document.getElementById('qrisSection');
            const qrisImg = document.getElementById('qrisImage');
            const statusMsg = document.getElementById('topupStatusMessage');
            
            // Update QRIS image dengan timestamp
            qrisImg.src = 'qris2.jpeg?t=' + Date.now();
            
            // Update total payment
            document.getElementById('totalPaymentDisplay').innerHTML = 'Total Dibayar: Rp ' + (nominal + 2500).toLocaleString('id-ID');
            
            // Tampilkan status sukses
            statusMsg.innerHTML = '<span style="color: #28a745;"><i class="fas fa-check-circle"></i> Request berhasil diajukan! Menunggu verifikasi admin (1x24 jam).</span>';
            statusMsg.style.background = '#d1fae5';
            
            // Tampilkan QRIS section
            qrisSection.style.display = 'block';
            
            // Ubah tombol
            btn.innerHTML = '<i class="fas fa-check"></i> Selesai';
            btn.disabled = false;
            
            // Reset form
            document.getElementById('topupNominal').value = '';
            document.getElementById('summaryNominal').textContent = 'Rp 0';
            document.getElementById('topupReceivedAmount').textContent = 'Rp 0';
            
            showNotification('Request top up berhasil! Menunggu verifikasi admin (1x24 jam).', 'success');
            
        } else {
            showNotification('Gagal: ' + result.message, 'error');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Pasang event listener
document.addEventListener('DOMContentLoaded', function() {
    const topupBtn = document.getElementById('topupPayBtn');
    if (topupBtn) {
        topupBtn.onclick = function(e) {
            e.preventDefault();
            showQRISPayment();
        };
    }
});

// Fungsi untuk menutup QRIS section (jika perlu)
function resetTopupForm() {
    document.getElementById('qrisSection').style.display = 'none';
    document.getElementById('topupStatusMessage').innerHTML = '';
    document.getElementById('topupNominal').value = '';
    document.getElementById('summaryNominal').textContent = 'Rp 0';
    document.getElementById('topupReceivedAmount').textContent = 'Rp 0';
}

// ========== REQUEST TOP UP - DENGAN GANTI EVENT LISTENER ==========
let topupSuccess = false;

async function requestTopUp() {
    console.log('requestTopUp dipanggil, topupSuccess =', topupSuccess);
    
    // JIKA SUDAH SUKSES, LANGSUNG TUTUP MODAL
    if (topupSuccess === true) {
        console.log('Mode Selesai - menutup modal tanpa validasi');
        closeModal('topupModal');
        resetTopupModal();
        return;
    }
    
    // ========== VALIDASI UNTUK REQUEST BARU ==========
    console.log('Mode Request - melakukan validasi');
    
    if (!currentUser) {
        showNotification('Anda harus login terlebih dahulu', 'error');
        return;
    }
    
    if (currentUser.role !== 'requester') {
        showNotification('Hanya Requester yang dapat melakukan top up', 'error');
        return;
    }
    
    let nominalString = document.getElementById('topupNominal').value.replace(/\./g, '');
    let nominal = parseInt(nominalString, 10) || 0;
    
    if (nominal < 10000) {
        showNotification('Minimal top up Rp 10.000', 'error');
        return;
    }
    
    const btn = document.getElementById('topupPayBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    
    try {
        const formData = new FormData();
        formData.append('user_id', currentUser.id);
        formData.append('nominal', nominal);
        formData.append('method', 'qris');
        
        const response = await fetch('topup.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            const qrisSection = document.getElementById('qrisSection');
            const qrisImg = document.getElementById('qrisImage');
            const statusMsg = document.getElementById('topupStatusMessage');
            const totalDibayar = nominal + 2500;
            
            if (qrisImg) qrisImg.src = 'qris2.jpeg?t=' + Date.now();
            if (statusMsg) {
                statusMsg.innerHTML = '<span style="color: #16a34a;"><i class="fas fa-check-circle"></i> ✅ Request berhasil! Total dibayar: Rp ' + totalDibayar.toLocaleString('id-ID') + '<br>Silakan scan QRIS untuk membayar.</span>';
                statusMsg.style.background = '#dcfce7';
                statusMsg.style.border = '1px solid #16a34a';
                statusMsg.style.padding = '10px';
                statusMsg.style.borderRadius = '8px';
            }
            if (qrisSection) qrisSection.style.display = 'block';
            
            const totalDisplay = document.getElementById('totalPaymentDisplay');
            if (totalDisplay) totalDisplay.innerHTML = 'Total Dibayar: Rp ' + totalDibayar.toLocaleString('id-ID');
            
            // RESET input
            document.getElementById('topupNominal').value = '';
            document.getElementById('summaryNominal').textContent = 'Rp 0';
            document.getElementById('totalPaymentAmount').textContent = 'Rp 0';
            document.getElementById('topupReceivedAmount').textContent = 'Rp 0';
            
            // 🔥 GANTI TOMBOL MENJADI "SELESAI" DAN GANTI EVENT LISTENERNYA
            topupSuccess = true;
            btn.innerHTML = '<i class="fas fa-check"></i> Selesai';
            btn.style.background = 'linear-gradient(135deg, #16a34a, #15803d)';
            btn.disabled = false;
            
            // 🔥 HAPUS EVENT LISTENER LAMA DAN PASANG YANG BARU
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Pasang event listener baru untuk tombol Selesai (LANGSUNG TUTUP MODAL)
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Tombol Selesai diklik - menutup modal');
                closeModal('topupModal');
                resetTopupModal();
            });
            
            // Update reference
            document.getElementById('topupPayBtn');
            
            showNotification('Request top up berhasil!', 'success');
            
        } else {
            showNotification('Gagal: ' + result.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Request Top Up';
        }
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Request Top Up';
    }
}

function resetTopupModal() {
    console.log('resetTopupModal dipanggil');
    topupSuccess = false;
    
    const qrisSection = document.getElementById('qrisSection');
    const statusMsg = document.getElementById('topupStatusMessage');
    const nominalInput = document.getElementById('topupNominal');
    const topupBtn = document.getElementById('topupPayBtn');
    
    if (qrisSection) qrisSection.style.display = 'none';
    if (statusMsg) {
        statusMsg.innerHTML = '';
        statusMsg.style.background = '';
        statusMsg.style.border = '';
    }
    if (nominalInput) {
        nominalInput.value = '';
        const summary = document.getElementById('summaryNominal');
        const totalPayment = document.getElementById('totalPaymentAmount');
        const received = document.getElementById('topupReceivedAmount');
        if (summary) summary.textContent = 'Rp 0';
        if (totalPayment) totalPayment.textContent = 'Rp 0';
        if (received) received.textContent = 'Rp 0';
    }
    
    // 🔥 RESET TOMBOL KE SEMULA (Request Top Up)
    if (topupBtn && topupBtn.innerHTML.includes('Selesai')) {
        const newBtn = topupBtn.cloneNode(true);
        topupBtn.parentNode.replaceChild(newBtn, topupBtn);
        
        newBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Request Top Up';
        newBtn.style.background = '';
        newBtn.disabled = false;
        
        // Pasang event listener baru untuk mode request
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            requestTopUp();
        });
        
        // Update reference
        document.getElementById('topupPayBtn');
    }
}

// Override closeModal
const originalCloseModal = window.closeModal;
window.closeModal = function(modalId) {
    if (modalId === 'topupModal') {
        resetTopupModal();
    }
    if (originalCloseModal) {
        originalCloseModal(modalId);
    } else {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
};

// Event listener awal untuk tombol (hanya sekali)
document.addEventListener('DOMContentLoaded', function() {
    const topupBtn = document.getElementById('topupPayBtn');
    if (topupBtn) {
        // Hapus event listener lama dengan clone
        const newBtn = topupBtn.cloneNode(true);
        topupBtn.parentNode.replaceChild(newBtn, topupBtn);
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            requestTopUp();
        });
    }
});

function resetTopupModal() {
    console.log('resetTopupModal dipanggil');
    topupSuccess = false;
    
    const qrisSection = document.getElementById('qrisSection');
    const statusMsg = document.getElementById('topupStatusMessage');
    const nominalInput = document.getElementById('topupNominal');
    const topupBtn = document.getElementById('topupPayBtn');
    
    if (qrisSection) qrisSection.style.display = 'none';
    if (statusMsg) {
        statusMsg.innerHTML = '';
        statusMsg.style.background = '';
        statusMsg.style.border = '';
    }
    if (nominalInput) {
        nominalInput.value = '';
        const summary = document.getElementById('summaryNominal');
        const totalPayment = document.getElementById('totalPaymentAmount');
        const received = document.getElementById('topupReceivedAmount');
        if (summary) summary.textContent = 'Rp 0';
        if (totalPayment) totalPayment.textContent = 'Rp 0';
        if (received) received.textContent = 'Rp 0';
    }
    if (topupBtn) {
        topupBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Request Top Up';
        topupBtn.style.background = '';
        topupBtn.disabled = false;
    }
}

// Reset function untuk topup modal
function resetTopupModal() {
    console.log('Resetting topup modal...');
    topupSuccess = false;
    const qrisSection = document.getElementById('qrisSection');
    const statusMsg = document.getElementById('topupStatusMessage');
    const nominalInput = document.getElementById('topupNominal');
    const topupBtn = document.getElementById('topupPayBtn');
    
    if (qrisSection) qrisSection.style.display = 'none';
    if (statusMsg) {
        statusMsg.innerHTML = '';
        statusMsg.style.background = '';
        statusMsg.style.border = '';
    }
    if (nominalInput) {
        nominalInput.value = '';
        const summaryEl = document.getElementById('summaryNominal');
        const totalPaymentEl = document.getElementById('totalPaymentAmount');
        const receivedEl = document.getElementById('topupReceivedAmount');
        if (summaryEl) summaryEl.textContent = 'Rp 0';
        if (totalPaymentEl) totalPaymentEl.textContent = 'Rp 0';
        if (receivedEl) receivedEl.textContent = 'Rp 0';
    }
    if (topupBtn) {
        topupBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Request Top Up';
        topupBtn.style.background = '';
        topupBtn.disabled = false;
    }
}

// Reset function untuk topup modal
function resetTopupModal() {
    topupSuccess = false;
    const qrisSection = document.getElementById('qrisSection');
    const statusMsg = document.getElementById('topupStatusMessage');
    const nominalInput = document.getElementById('topupNominal');
    const topupBtn = document.getElementById('topupPayBtn');
    
    if (qrisSection) qrisSection.style.display = 'none';
    if (statusMsg) {
        statusMsg.innerHTML = '';
        statusMsg.style.background = '';
        statusMsg.style.border = '';
    }
    if (nominalInput) {
        nominalInput.value = '';
        document.getElementById('summaryNominal').textContent = 'Rp 0';
        document.getElementById('totalPaymentAmount').textContent = 'Rp 0';
        document.getElementById('topupReceivedAmount').textContent = 'Rp 0';
    }
    if (topupBtn) {
        topupBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Request Top Up';
        topupBtn.style.background = '';
        topupBtn.disabled = false;
    }
}

const topupPayBtn = document.getElementById('topupPayBtn');
if (topupPayBtn) {
    topupPayBtn.addEventListener('click', function(e) {
        e.preventDefault();
        requestTopUp();
    });
}

// Reset modal saat ditutup
function resetTopupModal() {
    const qrisSection = document.getElementById('qrisSection');
    const statusMsg = document.getElementById('topupStatusMessage');
    const nominalInput = document.getElementById('topupNominal');
    
    if (qrisSection) qrisSection.style.display = 'none';
    if (statusMsg) {
        statusMsg.innerHTML = '';
        statusMsg.style.background = '';
    }
    if (nominalInput) {
        nominalInput.value = '';
        document.getElementById('summaryNominal').textContent = 'Rp 0';
        document.getElementById('totalPaymentAmount').textContent = 'Rp 0';
        document.getElementById('topupReceivedAmount').textContent = 'Rp 0';
    }
}

// ================================================================
// UPDATE HELPER STATS - DARI TRANSAKSI (SINKRON DENGAN RIWAYAT)
// ================================================================

function updateHelperStatsFromTransactions() {
    if (!currentUser || currentUser.role !== 'helper') {
        console.log('updateHelperStatsFromTransactions: Bukan helper atau tidak login');
        return;
    }

    console.log('🔄 UPDATE HELPER STATS FROM TRANSACTIONS');

    // ===== AMBIL TRANSAKSI DARI WALLET =====
    const transactions = window.walletTransactions || [];
    console.log('📊 Total transaksi di wallet:', transactions.length);

    if (transactions.length === 0) {
        console.warn('⚠️ Tidak ada transaksi di wallet!');
        document.getElementById('berandaPendapatanHelper').textContent = 'Rp 0';
        return;
    }

    // ===== FILTER TRANSAKSI HELPER (PAYMENT + TIP + SUCCESS) =====
    const helperTx = transactions.filter(t => {
        const isHelper = t.role === 'helper' || t.role === 'unknown' || t.role === null || t.role === undefined;
        const isPayment = t.type === 'payment' || t.type === 'tip' || t.type === 'credit';
        const isSuccess = t.status === 'Sukses' || t.status === 'success';
        return isHelper && isPayment && isSuccess;
    });

    console.log('📊 Transaksi helper (payment + tip):', helperTx.length);
    if (helperTx.length > 0) {
        console.log('  Detail:', helperTx);
    }

    if (helperTx.length === 0) {
        console.warn('⚠️ Tidak ada transaksi payment/tip untuk helper!');
        document.getElementById('berandaPendapatanHelper').textContent = 'Rp 0';
        return;
    }

    // ===== HITUNG PENDAPATAN BULAN INI =====
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    console.log(`📅 Bulan: ${now.toLocaleString('id-ID', { month: 'long' })} ${currentYear}`);

    let monthlyEarnings = 0;
    let monthlyCount = 0;
    let details = [];

    helperTx.forEach(t => {
        // Parse tanggal
        let tDate = null;
        if (t.created_at) {
            tDate = new Date(t.created_at);
        } else if (t.date) {
            tDate = new Date(t.date);
        }

        if (!tDate || isNaN(tDate.getTime())) {
            console.warn('  ⏭️ Transaksi #' + t.id + ' tanggal tidak valid');
            return;
        }

        const tMonth = tDate.getMonth();
        const tYear = tDate.getFullYear();

        if (tMonth === currentMonth && tYear === currentYear) {
            // Ambil nominal
            let amount = 0;
            if (typeof t.amount === 'string') {
                // Hapus semua karakter non-digit
                const clean = t.amount.replace(/[^0-9]/g, '');
                amount = parseInt(clean) || 0;
                console.log(`  🔍 Parsing string: "${t.amount}" → ${amount}`);
            } else if (typeof t.amount === 'number') {
                amount = Math.abs(t.amount);
                console.log(`  🔍 Parsing number: ${t.amount} → ${amount}`);
            }

            if (amount > 0) {
                monthlyEarnings += amount;
                monthlyCount++;
                details.push({
                    id: t.id,
                    type: t.type,
                    amount: amount,
                    description: t.description,
                    date: tDate.toLocaleDateString('id-ID')
                });
                console.log(`  ✅ #${t.id}: +Rp ${amount.toLocaleString()} (${t.type})`);
            }
        }
    });

    console.log(`💰 Pendapatan bulan ini: Rp ${monthlyEarnings.toLocaleString()}`);
    console.log(`📝 Jumlah transaksi: ${monthlyCount}`);
    if (details.length > 0) {
        console.log('  Detail:', details);
    }

    // ===== UPDATE UI =====
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

    // ===== SIMPAN KE GLOBAL =====
    window._helperStatsFromTransactions = {
        monthlyEarnings,
        monthlyCount,
        currentMonth: now.toLocaleString('id-ID', { month: 'long' }),
        currentYear,
        details,
        totalTransactions: helperTx.length
    };

    console.log('✅ Helper stats from transactions updated:', window._helperStatsFromTransactions);
}

// ================================================================
// UPDATE HELPER STATS - DARI JOBS (BACKUP)
// ================================================================

function updateHelperStats() {
    if (!currentUser || currentUser.role !== 'helper') {
        console.log('updateHelperStats: Bukan helper');
        return;
    }

    console.log('🔄 UPDATING HELPER STATS FROM JOBS');

    const myJobs = jobs.filter(job => job.helper_id === currentUser.id);
    const activeCount = myJobs.filter(job => 
        job.status === 'in-progress' || job.status === 'ongoing'
    ).length;
    const completedCount = myJobs.filter(job => job.status === 'completed').length;

    // ===== HITUNG PENDAPATAN BULAN INI DARI JOBS =====
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthlyEarnings = 0;
    let monthlyJobCount = 0;

    myJobs.filter(job => job.status === 'completed').forEach(job => {
        let jobDate = null;
        if (job.created_at) {
            jobDate = new Date(job.created_at);
        } else if (job.date) {
            try {
                const parts = job.date.split('/');
                if (parts.length === 3) {
                    jobDate = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            } catch(e) {}
        }

        if (!jobDate || isNaN(jobDate.getTime())) {
            jobDate = new Date();
        }

        if (jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear) {
            const price = parseFloat(job.price) || 0;
            monthlyEarnings += price;
            monthlyJobCount++;
        }
    });

    console.log(`💰 Pendapatan bulan ini dari jobs: Rp ${monthlyEarnings.toLocaleString()}`);

    // ===== UPDATE UI =====
    const activeEl = document.getElementById('helperActiveJobsCount');
    const completedEl = document.getElementById('helperCompletedJobsCount');
    const earningsEl = document.getElementById('berandaPendapatanHelper');
    const reminderEl = document.getElementById('helperReminderCount');

    if (activeEl) activeEl.textContent = activeCount;
    if (completedEl) completedEl.textContent = completedCount;
    if (earningsEl) {
        // Hanya update jika belum diupdate oleh transaksi
        if (!window._helperStatsFromTransactions || window._helperStatsFromTransactions.monthlyEarnings === 0) {
            earningsEl.textContent = 'Rp ' + monthlyEarnings.toLocaleString('id-ID');
        }
    }
    if (reminderEl) reminderEl.textContent = activeCount;

    window._helperStats = {
        activeCount,
        completedCount,
        monthlyEarnings,
        monthlyJobCount,
        currentMonth: now.toLocaleString('id-ID', { month: 'long' }),
        currentYear,
        totalJobs: myJobs.length
    };

    console.log('✅ Helper stats updated:', window._helperStats);
}

// ================================================================
// EXPOSE FUNGSI KE GLOBAL (AGAR BISA DIPANGGIL DARI CONSOLE)
// ================================================================

window.updateHelperStatsFromTransactions = updateHelperStatsFromTransactions;
window.updateHelperStats = updateHelperStats;
window.updateRequesterStats = updateRequesterStats;
window.loadWalletFromDB = loadWalletFromDB;
window.loadJobsFromDB = loadJobsFromDB;

console.log('✅ Helper functions exposed to global scope');