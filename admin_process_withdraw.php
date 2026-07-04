<?php
// admin_process_withdraw.php - REJECT TAMPIL DI RIWAYAT DENGAN STATUS DITOLAK
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Cek login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$admin_id = $_SESSION['user_id'];

// Cek role admin
$check_role = $conn->prepare("SELECT role, nama_lengkap FROM users WHERE id = ?");
$check_role->bind_param("i", $admin_id);
$check_role->execute();
$admin_data = $check_role->get_result()->fetch_assoc();

if (!$admin_data || $admin_data['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Admin only']);
    exit;
}

$withdraw_id = isset($_POST['withdraw_id']) ? intval($_POST['withdraw_id']) : 0;
$action = isset($_POST['action']) ? $_POST['action'] : '';
$admin_note = isset($_POST['admin_note']) ? trim($_POST['admin_note']) : '';

if (!$withdraw_id || !$action) {
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
    exit;
}

if ($action === 'reject' && empty($admin_note)) {
    echo json_encode(['success' => false, 'message' => 'Alasan penolakan harus diisi']);
    exit;
}

try {
    $conn->begin_transaction();
    
    // Ambil data withdraw
    $stmt = $conn->prepare("SELECT user_id, nominal, admin_fee, status FROM withdraw_requests WHERE id = ?");
    $stmt->bind_param("i", $withdraw_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $withdraw = $result->fetch_assoc();
    $stmt->close();
    
    if (!$withdraw) {
        throw new Exception('Withdraw request tidak ditemukan');
    }
    
    if ($withdraw['status'] !== 'pending') {
        throw new Exception('Request sudah diproses sebelumnya');
    }
    
    $admin_fee = $withdraw['admin_fee'] ?? 2500;
    $total_potong = $withdraw['nominal'] + $admin_fee;
    
    // 🔥 SEMUA VARIABEL
    $now = date('Y-m-d H:i:s');
    $status_completed = 'completed';
    $status_rejected = 'rejected';
    $status_success = 'success';
    $status_failed = 'failed';
    $notif_type_info = 'info';
    $is_read_0 = 0;
    $role_helper = 'helper';
    $type_withdrawal = 'withdrawal';
    $type_fee = 'fee';
    
    if ($action === 'approve') {
        // ============================================================
        // 1. KURANGI SALDO USER (nominal + admin fee)
        // ============================================================
        $update_balance = $conn->prepare("UPDATE users SET wallet_helper = wallet_helper - ? WHERE id = ?");
        $update_balance->bind_param("di", $total_potong, $withdraw['user_id']);
        $update_balance->execute();
        $update_balance->close();
        
        // ============================================================
        // 2. UPDATE STATUS WITHDRAW MENJADI 'completed'
        // ============================================================
        $update = $conn->prepare("
            UPDATE withdraw_requests 
            SET status = ?, admin_note = ?, processed_at = ?, processed_by = ? 
            WHERE id = ?
        ");
        $update->bind_param("sssii", $status_completed, $admin_note, $now, $admin_id, $withdraw_id);
        $update->execute();
        $update->close();
        
        // ============================================================
        // 3. INSERT TRANSAKSI WITHDRAW (NEGATIF)
        // ============================================================
        $desc_withdraw = "Penarikan saldo ke rekening (disetujui admin)";
        $nominal_negatif = -$withdraw['nominal'];
        
        $insert_trans = $conn->prepare("
            INSERT INTO transactions (user_id, role, amount, description, type, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $insert_trans->bind_param("isdssss", $withdraw['user_id'], $role_helper, $nominal_negatif, $desc_withdraw, $type_withdrawal, $status_success, $now);
        $insert_trans->execute();
        $insert_trans->close();
        
        // ============================================================
        // 4. INSERT BIAYA ADMIN (NEGATIF)
        // ============================================================
        $desc_fee = "Biaya admin penarikan";
        $admin_fee_negatif = -$admin_fee;
        
        $insert_fee = $conn->prepare("
            INSERT INTO transactions (user_id, role, amount, description, type, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $insert_fee->bind_param("isdssss", $withdraw['user_id'], $role_helper, $admin_fee_negatif, $desc_fee, $type_fee, $status_success, $now);
        $insert_fee->execute();
        $insert_fee->close();
        
        // ============================================================
        // 5. Notifikasi ke user
        // ============================================================
        $notif_msg = "✅ Penarikan saldo Rp " . number_format($withdraw['nominal'], 0, ',', '.') . 
                     " telah berhasil diproses dan ditransfer ke rekening Anda. " .
                     "(Admin fee: Rp " . number_format($admin_fee, 0, ',', '.') . ")";
        
        $notif = $conn->prepare("
            INSERT INTO notifications (user_id, title, message, type, is_read, created_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $notif_title = 'Withdraw Berhasil';
        $notif->bind_param("isssis", $withdraw['user_id'], $notif_title, $notif_msg, $notif_type_info, $is_read_0, $now);
        $notif->execute();
        $notif->close();
        
        // ================================================================
// 🔥 FCM PUSH NOTIFICATION - Withdraw Disetujui ke User
// ================================================================
require_once 'fcm_helper.php';

$fcm_title = "🏦 Withdraw Disetujui!";
$fcm_body = "Penarikan Rp " . number_format($withdraw['nominal'], 0, ',', '.') . " telah diproses. Dana akan segera masuk rekening.";
$fcm_data = buildFCMData('withdraw_status', 0, ['status' => 'approved']);

sendFCMToUser($withdraw['user_id'], $fcm_title, $fcm_body, $fcm_data);

$notif->close();

echo json_encode([
    'success' => true,
    'message' => 'Withdraw berhasil disetujui. Saldo dipotong Rp ' . number_format($total_potong, 0, ',', '.')
]);
        
        $response_message = 'Withdraw berhasil disetujui. Saldo dipotong Rp ' . number_format($total_potong, 0, ',', '.');
        
    } elseif ($action === 'reject') {
        // ============================================================
        // 1. UPDATE STATUS WITHDRAW MENJADI 'rejected'
        // ============================================================
        $update = $conn->prepare("
            UPDATE withdraw_requests 
            SET status = ?, admin_note = ?, processed_at = ?, processed_by = ? 
            WHERE id = ?
        ");
        $update->bind_param("sssii", $status_rejected, $admin_note, $now, $admin_id, $withdraw_id);
        $update->execute();
        $update->close();
        
        // ============================================================
        // 2. INSERT TRANSAKSI WITHDRAW (NEGATIF) - TAMPIL DI RIWAYAT DENGAN STATUS FAILED
        // ============================================================
        $desc_withdraw = "Penarikan saldo ke rekening (DITOLAK) - " . $admin_note;
        $nominal_negatif = -$withdraw['nominal'];
        
        $insert_trans = $conn->prepare("
            INSERT INTO transactions (user_id, role, amount, description, type, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $insert_trans->bind_param("isdssss", $withdraw['user_id'], $role_helper, $nominal_negatif, $desc_withdraw, $type_withdrawal, $status_failed, $now);
        $insert_trans->execute();
        $insert_trans->close();
        
        // ============================================================
        // 3. INSERT BIAYA ADMIN (NEGATIF) - TAMPIL DI RIWAYAT DENGAN STATUS FAILED
        // ============================================================
        $desc_fee = "Biaya admin penarikan (DITOLAK)";
        $admin_fee_negatif = -$admin_fee;
        
        $insert_fee = $conn->prepare("
            INSERT INTO transactions (user_id, role, amount, description, type, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $insert_fee->bind_param("isdssss", $withdraw['user_id'], $role_helper, $admin_fee_negatif, $desc_fee, $type_fee, $status_failed, $now);
        $insert_fee->execute();
        $insert_fee->close();
        
        // ============================================================
        // 4. Notifikasi ke user
        // ============================================================
        $notif_msg = "❌ Penarikan saldo Rp " . number_format($withdraw['nominal'], 0, ',', '.') . 
                     " ditolak.\nAlasan: " . $admin_note . 
                     "\n\nSaldo Anda tidak berubah karena belum dipotong.";
        
        $notif = $conn->prepare("
            INSERT INTO notifications (user_id, title, message, type, is_read, created_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $notif_title = 'Withdraw Ditolak';
        $notif->bind_param("isssis", $withdraw['user_id'], $notif_title, $notif_msg, $notif_type_info, $is_read_0, $now);
        $notif->execute();
        $notif->close();
        
        // ================================================================
// 🔥 FCM PUSH NOTIFICATION - Withdraw Ditolak ke User
// ================================================================
require_once 'fcm_helper.php';

$fcm_title = "❌ Withdraw Ditolak";
$fcm_body = "Penarikan Rp " . number_format($withdraw['nominal'], 0, ',', '.') . " ditolak. Alasan: " . $admin_note;
$fcm_data = buildFCMData('withdraw_status', 0, ['status' => 'rejected']);

sendFCMToUser($withdraw['user_id'], $fcm_title, $fcm_body, $fcm_data);

$notif->close();

echo json_encode([
    'success' => true,
    'message' => 'Withdraw ditolak. Saldo tidak berubah.'
]);
        
        $response_message = 'Withdraw ditolak. Saldo tidak berubah.';
    } else {
        throw new Exception('Aksi tidak dikenal');
    }
    
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => $response_message
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    error_log("admin_process_withdraw.php error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan: ' . $e->getMessage()
    ]);
} catch (Error $e) {
    $conn->rollback();
    error_log("admin_process_withdraw.php Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan server: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?>