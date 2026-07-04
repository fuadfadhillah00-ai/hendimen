<?php
// admin_get_verifications.php - Perbaikan
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

$status = isset($_GET['status']) ? $_GET['status'] : 'pending';

try {
    if ($status === 'pending') {
        $query = "SELECT id, nama_lengkap, email, no_telepon, ktp_file, 
                         verification_status, rejection_reason, created_at 
                  FROM users 
                  WHERE role = 'user' AND verification_status = 'pending'
                  ORDER BY created_at ASC";
    } else {
        $query = "SELECT u.id, u.nama_lengkap, u.email, u.no_telepon, u.ktp_file,
                         u.verification_status, u.rejection_reason, u.verified_at,
                         adm.nama_lengkap as verified_by_name
                  FROM users u
                  LEFT JOIN users adm ON u.verified_by = adm.id
                  WHERE u.role = 'user' AND u.verification_status IN ('verified', 'rejected')
                  ORDER BY u.verified_at DESC";
    }
    
    $result = $conn->query($query);
    $users = [];
    
    while ($row = $result->fetch_assoc()) {
        $row['ktp_preview_url'] = $row['ktp_file'] ? 'get_ktp.php?user_id=' . $row['id'] : null;
        $row['ktp_download_url'] = $row['ktp_file'] ? 'get_ktp.php?user_id=' . $row['id'] . '&download=1' : null;
        $users[] = $row;
    }
    
    echo json_encode(['success' => true, 'users' => $users]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>