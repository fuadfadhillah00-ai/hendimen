<?php
// get_offers.php - PERBAIKAN: Pastikan data job lengkap
require_once 'config.php';
session_start();

header('Content-Type: application/json');

function sendResponse($success, $message, $data = []) {
    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message
    ], $data));
    exit;
}

// ================================================================
// VALIDASI USER
// ================================================================

if (!isset($_SESSION['user_id'])) {
    sendResponse(false, 'Unauthorized');
}

$stmt = $conn->prepare("SELECT id, role FROM users WHERE id = ?");
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user) {
    sendResponse(false, 'User tidak ditemukan');
}

// ================================================================
// AMBIL DATA TAWARAN
// ================================================================

$job_id = isset($_GET['job_id']) ? intval($_GET['job_id']) : 0;

if (!$job_id) {
    sendResponse(false, 'ID pekerjaan tidak valid');
}

// Cek job - AMBIL SEMUA DATA YANG DIPERLUKAN
$stmt = $conn->prepare("SELECT id, user_id, status, title, price FROM jobs WHERE id = ?");
$stmt->bind_param("i", $job_id);
$stmt->execute();
$job = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$job) {
    sendResponse(false, 'Pekerjaan tidak ditemukan');
}

// Cek akses
$is_requester = ($job['user_id'] == $user['id']);
$is_admin = ($user['role'] === 'admin');

if (!$is_requester && !$is_admin && $user['role'] === 'user') {
    // Helper hanya melihat tawarannya sendiri
    $stmt = $conn->prepare("
        SELECT o.*, u.nama_lengkap as helper_name, u.rating as helper_rating,
               (SELECT COUNT(*) FROM ratings WHERE target_id = u.id) as total_ratings
        FROM offers o
        JOIN users u ON o.helper_id = u.id
        WHERE o.job_id = ? AND o.helper_id = ?
        ORDER BY o.created_at DESC
    ");
    $stmt->bind_param("ii", $job_id, $user['id']);
} else {
    // Requester atau admin melihat semua tawaran
    $stmt = $conn->prepare("
        SELECT o.*, u.nama_lengkap as helper_name, u.rating as helper_rating,
               (SELECT COUNT(*) FROM ratings WHERE target_id = u.id) as total_ratings
        FROM offers o
        JOIN users u ON o.helper_id = u.id
        WHERE o.job_id = ? AND o.status != 'expired'
        ORDER BY o.offered_price ASC, o.created_at ASC
    ");
    $stmt->bind_param("i", $job_id);
}

$stmt->execute();
$result = $stmt->get_result();
$offers = [];

while ($row = $result->fetch_assoc()) {
    $row['helper_rating'] = floatval($row['helper_rating'] ?? 0);
    $row['total_ratings'] = intval($row['total_ratings'] ?? 0);
    $row['formatted_price'] = 'Rp ' . number_format($row['offered_price'], 0, ',', '.');
    $row['is_expired'] = !isOfferValid($row['created_at']);
    $row['is_your_offer'] = ($row['helper_id'] == $user['id']);
    $offers[] = $row;
}
$stmt->close();

// ================================================================
// 🔥 KIRIM DATA LENGKAP - TERMASUK JOB USER_ID
// ================================================================
sendResponse(true, 'Berhasil mengambil tawaran', [
    'offers' => $offers,
    'job' => [
        'id' => $job['id'],
        'user_id' => $job['user_id'],  // 🔥 PENTING: Untuk cek kepemilikan
        'title' => $job['title'],
        'status' => $job['status'],
        'status_display' => getJobStatusDisplay($job['status'])
    ]
]);
?>