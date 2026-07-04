<?php
// admin_get_verification_stats.php - Statistik verifikasi user
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Cek login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Cek role admin
$check_role = $conn->prepare("SELECT role FROM users WHERE id = ?");
$check_role->bind_param("i", $_SESSION['user_id']);
$check_role->execute();
$user_role = $check_role->get_result()->fetch_assoc();

if (!$user_role || $user_role['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Admin only']);
    exit;
}

try {
    $stats = [
        'pending' => 0,
        'verified' => 0,
        'rejected' => 0,
        'total' => 0
    ];
    
    // Hitung pending
    $result = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'user' AND verification_status = 'pending'");
    $stats['pending'] = $result->fetch_assoc()['count'];
    
    // Hitung verified
    $result = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'user' AND verification_status = 'verified'");
    $stats['verified'] = $result->fetch_assoc()['count'];
    
    // Hitung rejected
    $result = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'user' AND verification_status = 'rejected'");
    $stats['rejected'] = $result->fetch_assoc()['count'];
    
    // Total user (role user)
    $result = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    $stats['total'] = $result->fetch_assoc()['count'];
    
    echo json_encode(['success' => true, 'stats' => $stats]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>