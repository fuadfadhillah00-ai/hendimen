<?php
// get_ktp.php - Mengambil file KTP (hanya untuk admin)
session_start();
require_once 'config.php';

// Cek login dan role admin
if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    die('Akses ditolak');
}

$check_role = $conn->prepare("SELECT role FROM users WHERE id = ?");
$check_role->bind_param("i", $_SESSION['user_id']);
$check_role->execute();
$user_role = $check_role->get_result()->fetch_assoc();

if (!$user_role || $user_role['role'] !== 'admin') {
    http_response_code(403);
    die('Akses ditolak - Admin only');
}

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if (!$user_id) {
    http_response_code(400);
    die('User ID required');
}

// Ambil path file KTP dari database
$stmt = $conn->prepare("SELECT ktp_file FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user || empty($user['ktp_file'])) {
    http_response_code(404);
    die('File KTP tidak ditemukan');
}

$file_path = $user['ktp_file'];

// Cek apakah file benar-benar ada
if (!file_exists($file_path)) {
    http_response_code(404);
    die('File KTP tidak ditemukan di server');
}

// Tentukan MIME type
$extension = strtolower(pathinfo($file_path, PATHINFO_EXTENSION));
switch ($extension) {
    case 'jpg':
    case 'jpeg':
        $mime = 'image/jpeg';
        break;
    case 'png':
        $mime = 'image/png';
        break;
    case 'pdf':
        $mime = 'application/pdf';
        break;
    default:
        $mime = 'application/octet-stream';
}

header('Content-Type: ' . $mime);
header('Content-Disposition: inline; filename="ktp_user_' . $user_id . '.' . $extension . '"');
header('Cache-Control: public, max-age=3600');

readfile($file_path);
exit;
?>