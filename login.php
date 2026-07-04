<?php
// login.php - LENGKAP DENGAN FCM TOKEN USER_ID UPDATE
error_reporting(E_ALL);
ini_set('display_errors', 1);

while (ob_get_level()) ob_end_clean();

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-validate');
header('Pragma: no-cache');

$host = 'localhost';
$username = 'u352984455_hendimen';
$password = 'Gusto_Kita13';
$database = 'u352984455_hendimen';

$conn = new mysqli($host, $username, $password, $database);
$conn->set_charset("utf8");

if ($conn->connect_error) {
    echo json_encode([
        'success' => false, 
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit;
}

$email = trim($_POST['email'] ?? '');
$password_input = $_POST['password'] ?? '';
$fcm_token = isset($_POST['fcm_token']) ? trim($_POST['fcm_token']) : '';

if (empty($email) || empty($password_input)) {
    echo json_encode(['success' => false, 'message' => 'Email/No Telepon dan password harus diisi']);
    exit;
}

// Cek user
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ? OR no_telepon = ?");
$stmt->bind_param("ss", $email, $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'Email/No Telepon atau password salah']);
    exit;
}

// Verifikasi password
if (!password_verify($password_input, $user['password'])) {
    echo json_encode(['success' => false, 'message' => 'Email/No Telepon atau password salah']);
    exit;
}

// ================================================================
// DETEKSI DEVICE
// ================================================================
function detectDevice() {
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $isMobileAgent = preg_match('/(android|webos|iphone|ipad|ipod|blackberry|windows phone|opera mini|iemobile|mobile)/i', $userAgent);
    $screenWidth = isset($_COOKIE['screen_width']) ? intval($_COOKIE['screen_width']) : 0;
    $isWideScreen = $screenWidth > 768;
    $forceDesktop = isset($_COOKIE['force_desktop']) && $_COOKIE['force_desktop'] === 'true';
    
    if ($forceDesktop || $isWideScreen) {
        return 'desktop';
    }
    if ($isMobileAgent) {
        return 'mobile';
    }
    return 'desktop';
}

$device = detectDevice();

// ================================================================
// LOGIN SUKSES
// ================================================================
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $user['nama_lengkap'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['user_role'] = $user['role'];
$_SESSION['login_time'] = time();
$_SESSION['device'] = $device;

function getInitials($name) {
    if (empty($name)) return 'U';
    $parts = explode(' ', $name);
    if (count($parts) >= 2) {
        return strtoupper(substr($parts[0], 0, 1) . substr(end($parts), 0, 1));
    }
    return strtoupper(substr($name, 0, 2));
}

// ================================================================
// 🔥 UPDATE USER_ID PADA FCM TOKEN YANG SUDAH TERSIMPAN
// ================================================================

if (!empty($fcm_token)) {
    // Cek apakah token ada di database
    $check_token = $conn->prepare("SELECT id, user_id FROM fcm_tokens WHERE token = ?");
    $check_token->bind_param("s", $fcm_token);
    $check_token->execute();
    $token_result = $check_token->get_result();
    
    if ($token_result->num_rows > 0) {
        // Token sudah ada, update user_id
        $row = $token_result->fetch_assoc();
        $update_token = $conn->prepare("UPDATE fcm_tokens SET user_id = ?, updated_at = NOW() WHERE id = ?");
        $update_token->bind_param("ii", $user['id'], $row['id']);
        $update_token->execute();
        $update_token->close();
        error_log("✅ FCM Token diupdate untuk user ID: " . $user['id'] . " (sebelumnya user_id: " . $row['user_id'] . ")");
    } else {
        // Token belum ada, simpan dengan user_id
        $insert_token = $conn->prepare("INSERT INTO fcm_tokens (user_id, token, device_type, created_at) VALUES (?, ?, 'android', NOW())");
        $insert_token->bind_param("is", $user['id'], $fcm_token);
        $insert_token->execute();
        $insert_token->close();
        error_log("✅ FCM Token baru disimpan untuk user ID: " . $user['id']);
    }
    $check_token->close();
} else {
    error_log("⚠️ Tidak ada FCM token dikirim saat login untuk user ID: " . $user['id']);
}

// ================================================================
// REDIRECT
// ================================================================
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

$response = [
    'success' => true,
    'message' => 'Login berhasil',
    'redirect' => $redirectUrl,
    'device' => $device,
    'user' => [
        'id' => $user['id'],
        'name' => $user['nama_lengkap'],
        'nama_lengkap' => $user['nama_lengkap'],
        'email' => $user['email'],
        'phone' => $user['no_telepon'] ?? '',
        'role' => strtolower($user['role']),
        'wallet_requester' => floatval($user['wallet_requester'] ?? 0),
        'wallet_helper' => floatval($user['wallet_helper'] ?? 0),
        'avatar' => getInitials($user['nama_lengkap']),
        'verification_status' => $user['verification_status'] ?? 'verified'
    ]
];

echo json_encode($response);

$stmt->close();
$conn->close();
?>