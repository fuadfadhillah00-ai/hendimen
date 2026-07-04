<?php
// admin_get_withdraw_stats.php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

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
        'completed' => 0,
        'rejected' => 0,
        'total_nominal' => 0
    ];
    
    $result = $conn->query("SELECT COUNT(*) as count FROM withdraw_requests WHERE status = 'pending'");
    $stats['pending'] = $result->fetch_assoc()['count'];
    
    $result = $conn->query("SELECT COUNT(*) as count FROM withdraw_requests WHERE status = 'completed'");
    $stats['completed'] = $result->fetch_assoc()['count'];
    
    $result = $conn->query("SELECT COUNT(*) as count FROM withdraw_requests WHERE status = 'rejected'");
    $stats['rejected'] = $result->fetch_assoc()['count'];
    
    $result = $conn->query("SELECT SUM(nominal) as total FROM withdraw_requests WHERE status = 'completed'");
    $row = $result->fetch_assoc();
    $stats['total_nominal'] = floatval($row['total'] ?? 0);
    
    echo json_encode([
        'success' => true,
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>