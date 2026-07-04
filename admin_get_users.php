<?php
// admin_get_users.php - Ambil data user untuk admin
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
$result = $check_role->get_result();
$user_role = $result->fetch_assoc();

if (!$user_role || $user_role['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Admin only']);
    exit;
}

try {
    $query = "SELECT id, nama_lengkap, email, no_telepon, role, wallet_requester, wallet_helper, rating, verification_status, created_at 
              FROM users 
              ORDER BY id DESC";
    
    $result = $conn->query($query);
    $users = [];
    
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'users' => $users,
        'total' => count($users)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?>