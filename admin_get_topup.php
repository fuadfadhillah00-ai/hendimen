<?php
// admin_get_topup.php - PERBAIKAN
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
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$status = isset($_GET['status']) ? $_GET['status'] : 'pending';

try {
    if ($status === 'pending') {
        $query = "SELECT tr.*, u.nama_lengkap as user_name 
                  FROM topup_requests tr 
                  JOIN users u ON tr.user_id = u.id 
                  WHERE tr.status = 'pending' 
                  ORDER BY tr.created_at ASC";
    } elseif ($status === 'processed') {
        $query = "SELECT tr.*, u.nama_lengkap as user_name, 
                         adm.nama_lengkap as approved_by_name
                  FROM topup_requests tr 
                  JOIN users u ON tr.user_id = u.id 
                  LEFT JOIN users adm ON tr.approved_by = adm.id 
                  WHERE tr.status IN ('approved', 'rejected') 
                  ORDER BY tr.processed_at DESC";
    } else {
        $query = "SELECT tr.*, u.nama_lengkap as user_name, 
                         adm.nama_lengkap as approved_by_name
                  FROM topup_requests tr 
                  JOIN users u ON tr.user_id = u.id 
                  LEFT JOIN users adm ON tr.approved_by = adm.id 
                  ORDER BY tr.created_at DESC";
    }
    
    $result = $conn->query($query);
    $requests = [];
    
    while ($row = $result->fetch_assoc()) {
        $requests[] = $row;
    }
    
    echo json_encode(['success' => true, 'requests' => $requests]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>