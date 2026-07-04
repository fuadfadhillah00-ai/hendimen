<?php
// test_withdraw.php - Test langsung proses withdraw
require_once 'config.php';
session_start();

header('Content-Type: application/json');

// Pastikan user login sebagai admin
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Silakan login sebagai admin']);
    exit;
}

$admin_id = $_SESSION['user_id'];

// Cek role
$check = $conn->prepare("SELECT role FROM users WHERE id = ?");
$check->bind_param("i", $admin_id);
$check->execute();
$user = $check->get_result()->fetch_assoc();

if (!$user || $user['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Hanya admin yang bisa mengakses']);
    exit;
}

// Ambil 1 withdraw pending
$stmt = $conn->prepare("SELECT id, user_id, nominal, status FROM withdraw_requests WHERE status = 'pending' LIMIT 1");
$stmt->execute();
$result = $stmt->get_result();
$withdraw = $result->fetch_assoc();
$stmt->close();

if (!$withdraw) {
    echo json_encode(['success' => false, 'message' => 'Tidak ada withdraw pending']);
    exit;
}

echo json_encode([
    'success' => true,
    'withdraw' => $withdraw,
    'message' => 'Ada withdraw pending, siap di-process'
]);
?>