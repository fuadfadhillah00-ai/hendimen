<?php
// check_session.php - DENGAN DETEKSI DESKTOP MODE + STATUS PEKERJAAN
error_reporting(E_ALL);
ini_set('display_errors', 1);

while (ob_get_level()) ob_end_clean();

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-validate');
header('Pragma: no-cache');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cache-Control');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$response = ['success' => false, 'user' => null];

if (!isset($_SESSION['user_id'])) {
    echo json_encode($response);
    exit;
}

$user_id = $_SESSION['user_id'];

$host = 'localhost';
$username = 'u352984455_hendimen';
$password = 'Gusto_Kita13';
$database = 'u352984455_hendimen';

$conn = new mysqli($host, $username, $password, $database);
$conn->set_charset("utf8");

if ($conn->connect_error) {
    $response['error'] = 'Database connection failed';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("SELECT id, nama_lengkap, email, no_telepon, role, 
                        wallet_requester, wallet_helper, verification_status 
                        FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    session_destroy();
    echo json_encode(['success' => false, 'user' => null]);
    exit;
}

// ================================================================
// VERIFIKASI DINONAKTIFKAN
// ================================================================

// ================================================================
// DETEKSI DEVICE + DESKTOP MODE
// ================================================================
function detectDevice() {
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    $isMobileAgent = preg_match('/(android|webos|iphone|ipad|ipod|blackberry|windows phone|opera mini|iemobile|mobile)/i', $userAgent);
    $isDesktopMode = isset($_SERVER['HTTP_SEC_CH_UA_PLATFORM']) && 
                     stripos($_SERVER['HTTP_SEC_CH_UA_PLATFORM'], 'Android') !== false &&
                     isset($_SERVER['HTTP_SEC_CH_UA_MOBILE']) && 
                     $_SERVER['HTTP_SEC_CH_UA_MOBILE'] === '?0';
    $screenWidth = isset($_COOKIE['screen_width']) ? intval($_COOKIE['screen_width']) : 0;
    $isWideScreen = $screenWidth > 768;
    $forceDesktop = isset($_COOKIE['force_desktop']) && $_COOKIE['force_desktop'] === 'true';
    
    if ($forceDesktop || $isDesktopMode || $isWideScreen) {
        return 'desktop';
    }
    
    if ($isMobileAgent) {
        return 'mobile';
    }
    
    return 'desktop';
}

$device = detectDevice();
$_SESSION['device'] = $device;

$_SESSION['user_role'] = $user['role'];
$_SESSION['user_name'] = $user['nama_lengkap'];

$initials = strtoupper(substr($user['nama_lengkap'], 0, 2));
if (strpos($user['nama_lengkap'], ' ') !== false) {
    $parts = explode(' ', $user['nama_lengkap']);
    $initials = strtoupper(substr($parts[0], 0, 1) . substr(end($parts), 0, 1));
}

$redirectUrl = 'dashboard_mobile.html';
if (strtolower($user['role']) === 'admin') {
    $redirectUrl = 'admin_dashboard.html';
} else {
    if ($device === 'mobile') {
        $redirectUrl = 'dashboard_mobile.html';
    } else {
        $redirectUrl = 'dashboard_mobile.html';
    }
}

// ================================================================
// AMBIL STATISTIK PEKERJAAN UNTUK USER
// ================================================================
$job_stats = [
    'total' => 0,
    'open' => 0,
    'offered' => 0,
    'selected' => 0,
    'paid' => 0,
    'in_progress' => 0,
    'pending_acc' => 0,
    'completed' => 0,
    'cancelled' => 0
];

$stats_stmt = $conn->prepare("
    SELECT status, COUNT(*) as count 
    FROM jobs 
    WHERE user_id = ? 
    GROUP BY status
");
$stats_stmt->bind_param("i", $user_id);
$stats_stmt->execute();
$stats_result = $stats_stmt->get_result();

while ($row = $stats_result->fetch_assoc()) {
    $stat_key = str_replace('-', '_', $row['status']);
    if (isset($job_stats[$stat_key])) {
        $job_stats[$stat_key] = (int)$row['count'];
    }
    $job_stats['total'] += (int)$row['count'];
}
$stats_stmt->close();

// ================================================================
// AMBIL JUMLAH TAWARAN MASUK (untuk requester)
// ================================================================
$offers_stmt = $conn->prepare("
    SELECT COUNT(*) as count 
    FROM offers o
    JOIN jobs j ON o.job_id = j.id
    WHERE j.user_id = ? AND o.status = 'pending'
");
$offers_stmt->bind_param("i", $user_id);
$offers_stmt->execute();
$offers_result = $offers_stmt->get_result();
$pending_offers = (int)$offers_result->fetch_assoc()['count'];
$offers_stmt->close();

$response = [
    'success' => true,
    'redirect' => $redirectUrl,
    'device' => $device,
    'pending_offers' => $pending_offers,
    'job_stats' => $job_stats,
    'user' => [
        'id' => $user['id'],
        'name' => $user['nama_lengkap'],
        'nama_lengkap' => $user['nama_lengkap'],
        'email' => $user['email'],
        'phone' => $user['no_telepon'] ?? '',
        'role' => strtolower($user['role']),
        'wallet_requester' => floatval($user['wallet_requester'] ?? 0),
        'wallet_helper' => floatval($user['wallet_helper'] ?? 0),
        'avatar' => $initials,
        'verification_status' => $user['verification_status'] ?? 'verified'
    ]
];

$stmt->close();
$conn->close();

echo json_encode($response);
?>