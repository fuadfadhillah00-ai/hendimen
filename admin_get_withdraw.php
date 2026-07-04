<?php
// admin_get_withdraw.php
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
    $status = isset($_GET['status']) ? $_GET['status'] : 'pending';
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if ($id > 0) {
        $query = "SELECT w.*, u.nama_lengkap as user_name 
                  FROM withdraw_requests w
                  JOIN users u ON w.user_id = u.id
                  WHERE w.id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $withdraw = $result->fetch_assoc();
        $stmt->close();
        
        echo json_encode(['success' => true, 'withdraw' => $withdraw]);
        exit;
    }
    
    if ($status === 'pending') {
        $query = "SELECT w.*, u.nama_lengkap as user_name 
                  FROM withdraw_requests w
                  JOIN users u ON w.user_id = u.id
                  WHERE w.status = 'pending'
                  ORDER BY w.created_at ASC";
    } elseif ($status === 'completed') {
        $query = "SELECT w.*, u.nama_lengkap as user_name 
                  FROM withdraw_requests w
                  JOIN users u ON w.user_id = u.id
                  WHERE w.status = 'completed'
                  ORDER BY w.processed_at DESC";
    } elseif ($status === 'rejected') {
        $query = "SELECT w.*, u.nama_lengkap as user_name 
                  FROM withdraw_requests w
                  JOIN users u ON w.user_id = u.id
                  WHERE w.status = 'rejected'
                  ORDER BY w.processed_at DESC";
    } else {
        $query = "SELECT w.*, u.nama_lengkap as user_name 
                  FROM withdraw_requests w
                  JOIN users u ON w.user_id = u.id
                  WHERE w.status IN ('completed', 'rejected')
                  ORDER BY w.processed_at DESC";
    }
    
    $result = $conn->query($query);
    $withdraws = [];
    while ($row = $result->fetch_assoc()) {
        $withdraws[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'withdraws' => $withdraws,
        'total' => count($withdraws)
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>