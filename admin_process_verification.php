<?php
// admin_process_verification.php - Perbaikan
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$admin_id = $_SESSION['user_id'];

$check_role = $conn->prepare("SELECT role, nama_lengkap FROM users WHERE id = ?");
$check_role->bind_param("i", $admin_id);
$check_role->execute();
$admin_data = $check_role->get_result()->fetch_assoc();

if (!$admin_data || $admin_data['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Admin only']);
    exit;
}

$user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
$action = isset($_POST['action']) ? $_POST['action'] : '';
$rejection_reason = isset($_POST['rejection_reason']) ? trim($_POST['rejection_reason']) : '';

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'User ID tidak valid']);
    exit;
}

if (!in_array($action, ['approve', 'reject'])) {
    echo json_encode(['success' => false, 'message' => 'Aksi tidak valid']);
    exit;
}

if ($action === 'reject' && empty($rejection_reason)) {
    echo json_encode(['success' => false, 'message' => 'Alasan penolakan harus diisi']);
    exit;
}

try {
    $conn->begin_transaction();
    
    // Ambil data user sebelum update
    $stmt = $conn->prepare("SELECT nama_lengkap, email, verification_status FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    if (!$user) {
        throw new Exception('User tidak ditemukan');
    }
    
    if ($user['verification_status'] !== 'pending') {
        throw new Exception('User sudah diproses sebelumnya');
    }
    
    if ($action === 'approve') {
        // Approve: set status jadi verified
        $status_verified = 'verified';
        $update = $conn->prepare("UPDATE users SET verification_status = ?, verified_at = NOW(), verified_by = ? WHERE id = ?");
        $update->bind_param("sii", $status_verified, $admin_id, $user_id);
        $update->execute();
        $update->close();
        
        // Notifikasi ke user
        $notif_msg = "✅ Selamat! Verifikasi identitas Anda telah disetujui. Akun Anda sekarang sudah aktif. Silakan login dan gunakan semua fitur Hendimen.";
        $notif_type = 'success';
        $is_read = 0;
        
        $notif = $conn->prepare("
            INSERT INTO notifications (user_id, message, type, is_read, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $notif->bind_param("issi", $user_id, $notif_msg, $notif_type, $is_read);
        $notif->execute();
        $notif->close();
        
        // ================================================================
// 🔥 FCM PUSH NOTIFICATION - Verifikasi Disetujui ke User
// ================================================================
require_once 'fcm_helper.php';

$fcm_title = "✅ Verifikasi Disetujui!";
$fcm_body = "Selamat! Verifikasi identitas Anda telah disetujui. Akun Anda sekarang aktif.";
$fcm_data = buildFCMData('verification_status', 0, ['status' => 'approved']);

sendFCMToUser($user_id, $fcm_title, $fcm_body, $fcm_data);

$notif->close();

$response_message = 'Verifikasi berhasil disetujui';
        
        $response_message = 'Verifikasi berhasil disetujui';
        
    } else {
        // Reject: set status jadi rejected dengan alasan
        $status_rejected = 'rejected';
        $update = $conn->prepare("
            UPDATE users 
            SET verification_status = ?, rejection_reason = ?, verified_at = NOW(), verified_by = ? 
            WHERE id = ?
        ");
        $update->bind_param("ssii", $status_rejected, $rejection_reason, $admin_id, $user_id);
        $update->execute();
        $update->close();
        
        // Notifikasi ke user
        $notif_msg = "❌ Verifikasi identitas Anda ditolak.\nAlasan: " . $rejection_reason . "\n\nSilakan hubungi support untuk informasi lebih lanjut atau daftar ulang dengan KTP yang valid.";
        $notif_type = 'reject';
        $is_read = 0;
        
        $notif = $conn->prepare("
            INSERT INTO notifications (user_id, message, type, is_read, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $notif->bind_param("issi", $user_id, $notif_msg, $notif_type, $is_read);
        $notif->execute();
        $notif->close();
        
        // ================================================================
// 🔥 FCM PUSH NOTIFICATION - Verifikasi Ditolak ke User
// ================================================================
require_once 'fcm_helper.php';

$fcm_title = "❌ Verifikasi Ditolak";
$fcm_body = "Verifikasi identitas Anda ditolak. Alasan: " . $rejection_reason;
$fcm_data = buildFCMData('verification_status', 0, ['status' => 'rejected']);

sendFCMToUser($user_id, $fcm_title, $fcm_body, $fcm_data);

$notif->close();

$response_message = 'Verifikasi ditolak';
        
        $response_message = 'Verifikasi ditolak';
    }
    
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => $response_message
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?>