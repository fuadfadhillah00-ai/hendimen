<?php
// admin_process_topup.php - FIXED
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$admin_id = $_SESSION['user_id'];

$check_role = $conn->prepare("SELECT role FROM users WHERE id = ?");
$check_role->bind_param("i", $admin_id);
$check_role->execute();
$user_role = $check_role->get_result()->fetch_assoc();

if (!$user_role || $user_role['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Admin only']);
    exit;
}

$request_id = isset($_POST['request_id']) ? intval($_POST['request_id']) : 0;
$action = isset($_POST['action']) ? $_POST['action'] : '';
$reason = isset($_POST['reason']) ? trim($_POST['reason']) : '';

if (!$request_id) {
    echo json_encode(['success' => false, 'message' => 'Request ID tidak valid']);
    exit;
}

try {
    $conn->begin_transaction();
    
    $stmt = $conn->prepare("SELECT user_id, nominal, status FROM topup_requests WHERE id = ?");
    $stmt->bind_param("i", $request_id);
    $stmt->execute();
    $request = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    if (!$request) {
        throw new Exception('Request tidak ditemukan');
    }
    
    if ($request['status'] !== 'pending') {
        throw new Exception('Request sudah diproses');
    }
    
    if ($action === 'approve') {
        // 🔥 SEMUA VARIABEL
        $status_approved = 'approved';
        
        $update = $conn->prepare("UPDATE topup_requests SET status = ?, approved_by = ?, processed_at = NOW() WHERE id = ?");
        $update->bind_param("sii", $status_approved, $admin_id, $request_id);
        $update->execute();
        $update->close();
        
        $update_balance = $conn->prepare("UPDATE users SET wallet_requester = wallet_requester + ? WHERE id = ?");
        $update_balance->bind_param("di", $request['nominal'], $request['user_id']);
        $update_balance->execute();
        $update_balance->close();
        
        $desc = "Top Up #" . $request_id;
        $role_requester = 'requester';
        $type_topup = 'topup';
        $status_success = 'success';
        
        $insert_trans = $conn->prepare("
            INSERT INTO transactions (user_id, role, amount, description, type, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $insert_trans->bind_param("isdsss", $request['user_id'], $role_requester, $request['nominal'], $desc, $type_topup, $status_success);
        $insert_trans->execute();
        $insert_trans->close();
        
        $notif_msg = "✅ Top up Rp " . number_format($request['nominal'], 0, ',', '.') . " telah disetujui! Saldo Anda bertambah.";
        $notif_type = 'payment';
        $is_read_zero = 0;
        
        $notif = $conn->prepare("
            INSERT INTO notifications (user_id, message, type, is_read, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $notif->bind_param("issi", $request['user_id'], $notif_msg, $notif_type, $is_read_zero);
        $notif->execute();
        $notif->close();
        
        // ================================================================
// 🔥 FCM PUSH NOTIFICATION - Top Up Disetujui ke User
// ================================================================
require_once 'fcm_helper.php';

$fcm_title = "💰 Top Up Disetujui!";
$fcm_body = "Top Up Rp " . number_format($request['nominal'], 0, ',', '.') . " telah disetujui. Saldo Anda bertambah.";
$fcm_data = buildFCMData('topup_status', 0, ['status' => 'approved']);

sendFCMToUser($request['user_id'], $fcm_title, $fcm_body, $fcm_data);

$notif->close();

echo json_encode(['success' => true, 'message' => 'Top up berhasil disetujui']);
        
        echo json_encode(['success' => true, 'message' => 'Top up berhasil disetujui']);
        
    } elseif ($action === 'reject') {
        if (empty($reason)) {
            throw new Exception('Alasan penolakan harus diisi');
        }
        
        // 🔥 SEMUA VARIABEL
        $status_rejected = 'rejected';
        
        $update = $conn->prepare("UPDATE topup_requests SET status = ?, approved_by = ?, reject_reason = ?, processed_at = NOW() WHERE id = ?");
        $update->bind_param("sisi", $status_rejected, $admin_id, $reason, $request_id);
        $update->execute();
        $update->close();
        
        $notif_msg = "❌ Top up Rp " . number_format($request['nominal'], 0, ',', '.') . " ditolak. Alasan: " . $reason;
        $notif_type = 'reject';
        $is_read_zero = 0;
        
        $notif = $conn->prepare("
            INSERT INTO notifications (user_id, message, type, is_read, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $notif->bind_param("issi", $request['user_id'], $notif_msg, $notif_type, $is_read_zero);
        $notif->execute();
        $notif->close();
        
        // ================================================================
// 🔥 FCM PUSH NOTIFICATION - Top Up Ditolak ke User
// ================================================================
require_once 'fcm_helper.php';

$fcm_title = "❌ Top Up Ditolak";
$fcm_body = "Top Up Rp " . number_format($request['nominal'], 0, ',', '.') . " ditolak. Alasan: " . $reason;
$fcm_data = buildFCMData('topup_status', 0, ['status' => 'rejected']);

sendFCMToUser($request['user_id'], $fcm_title, $fcm_body, $fcm_data);

$notif->close();

echo json_encode(['success' => true, 'message' => 'Top up ditolak']);
        
        echo json_encode(['success' => true, 'message' => 'Top up ditolak']);
        
    } else {
        throw new Exception('Aksi tidak dikenal');
    }
    
    $conn->commit();
    
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>