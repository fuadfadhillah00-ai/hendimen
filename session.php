<?php
// session.php - PERBAIKAN
if (session_status() === PHP_SESSION_NONE) {
    // Konfigurasi session sebelum start
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_secure', 0); // Set ke 1 jika pakai HTTPS
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.cookie_lifetime', 2592000); // 30 hari
    ini_set('session.gc_maxlifetime', 2592000); // 30 hari
    
    session_start();
}

// Session timeout dalam detik (30 hari)
define('SESSION_TIMEOUT', 2592000);

function isLoggedIn() {
    if (!isset($_SESSION['user_id'])) {
        return false;
    }
    
    // Cek timeout
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity']) > SESSION_TIMEOUT) {
        logoutUser();
        return false;
    }
    
    // Update last activity
    $_SESSION['last_activity'] = time();
    
    return true;
}

function loginUser($userId) {
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
    $_SESSION['login_time'] = time();
    $_SESSION['last_activity'] = time();
    return true;
}

function logoutUser() {
    $_SESSION = array();
    
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    session_destroy();
    return true;
}

function getCurrentUser() {
    if (!isLoggedIn()) return null;
    
    global $conn;
    $stmt = $conn->prepare("SELECT id, role, nama_lengkap, email, no_telepon, 
                            wallet_requester, wallet_helper, rating 
                            FROM users WHERE id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->fetch_assoc();
}

function isAdmin() {
    $user = getCurrentUser();
    return $user && isset($user['role']) && strtolower($user['role']) === 'admin';
}

function getInitials($name) {
    $parts = explode(' ', $name);
    $initials = '';
    foreach ($parts as $part) {
        if (!empty($part)) $initials .= strtoupper(substr($part, 0, 1));
    }
    return substr($initials, 0, 2) ?: 'U';
}
?>