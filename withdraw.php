<?php
// withdraw.php - TRANSAKSI TIDAK TAMPIL SAAT PENDING
require_once 'config.php';
session_start();

header('Content-Type: application/json');

define('BIAYA_ADMIN', 2500);

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method tidak diizinkan');
    }

    // Cek session
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Anda harus login terlebih dahulu');
    }

    $user_id = intval($_SESSION['user_id']);
    $nominal = floatval($_POST['nominal'] ?? 0);
    $bank = trim($_POST['bank'] ?? '');
    $account_number = trim($_POST['account_number'] ?? '');
    $account_name = trim($_POST['account_name'] ?? '');

    // ========== VALIDASI ==========
    if ($nominal < 50000) {
        throw new Exception('Minimal penarikan Rp 50.000');
    }
    if (empty($bank)) {
        throw new Exception('Pilih bank tujuan');
    }
    if (empty($account_number)) {
        throw new Exception('Nomor rekening harus diisi');
    }
    if (empty($account_name)) {
        throw new Exception('Nama pemilik rekening harus diisi');
    }

    // ========== CEK USER & SALDO ==========
    $check_user = $conn->prepare("SELECT id, wallet_helper, nama_lengkap FROM users WHERE id = ?");
    $check_user->bind_param("i", $user_id);
    $check_user->execute();
    $user_data = $check_user->get_result()->fetch_assoc();

    if (!$user_data) {
        throw new Exception('User tidak ditemukan');
    }

    $total_potong = $nominal + BIAYA_ADMIN;

    if ($user_data['wallet_helper'] < $total_potong) {
        throw new Exception(
            'Saldo Helper tidak cukup. Saldo: Rp ' . number_format($user_data['wallet_helper'], 0, ',', '.') .
            ', Dibutuhkan: Rp ' . number_format($total_potong, 0, ',', '.')
        );
    }

    // ========== MULAI TRANSACTION ==========
    $conn->begin_transaction();

    // 🔥 SEMUA VARIABEL
    $now = date('Y-m-d H:i:s');
    $status_pending = 'pending';
    $notif_type_info = 'info';
    $notif_type_admin = 'admin';
    $is_read_0 = 0;
    $admin_user_id = 40;
    $admin_fee_value = BIAYA_ADMIN;
    $role_helper = 'helper';
    $type_withdrawal = 'withdrawal';
    $type_fee = 'fee';

    // 1. INSERT ke withdraw_requests (SALDO BELUM DIPOTONG)
    $insert_request = $conn->prepare("
        INSERT INTO withdraw_requests (user_id, nominal, admin_fee, bank, account_number, account_name, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $insert_request->bind_param("iddsssss", $user_id, $nominal, $admin_fee_value, $bank, $account_number, $account_name, $status_pending, $now);
    $insert_request->execute();
    $withdraw_id = $insert_request->insert_id;
    $insert_request->close();

    // 🔥 2. TIDAK INSERT TRANSAKSI KE TABEL transactions!
    // Biarkan kosong, hanya akan diinsert saat approve
    
    // 3. Notifikasi ke user
    $diterima = $nominal - BIAYA_ADMIN;
    $notif_msg_user = "💸 Permintaan penarikan Rp " . number_format($nominal, 0, ',', '.') . 
                      " ke rekening " . $bank . " (****" . substr($account_number, -4) . ") diajukan. " .
                      "Menunggu verifikasi admin. Dana akan masuk rekening: Rp " . number_format($diterima, 0, ',', '.') . 
                      " (setelah admin Rp " . number_format(BIAYA_ADMIN, 0, ',', '.') . ")";

    $notif_user = $conn->prepare("
        INSERT INTO notifications (user_id, title, message, type, is_read, created_at) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $notif_title_user = 'Penarikan Saldo - Pending';
    $notif_user->bind_param("isssis", $user_id, $notif_title_user, $notif_msg_user, $notif_type_info, $is_read_0, $now);
    $notif_user->execute();
    $notif_user->close();

    // 4. Notifikasi ke Admin
    $admin_msg = "🏦 Permintaan withdraw dari User ID " . $user_id . 
                 " (" . $user_data['nama_lengkap'] . ") sebesar Rp " . 
                 number_format($nominal, 0, ',', '.') . 
                 " ke rekening " . $bank . " (" . $account_number . " - " . $account_name . ")";

    $notif_admin = $conn->prepare("
        INSERT INTO notifications (user_id, title, message, type, is_read, created_at) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $notif_title_admin = 'Withdraw Request - Pending';
    $notif_admin->bind_param("isssis", $admin_user_id, $notif_title_admin, $admin_msg, $notif_type_admin, $is_read_0, $now);
    $notif_admin->execute();
    $notif_admin->close();

    // ========== COMMIT ==========
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Permintaan penarikan saldo berhasil diajukan. Menunggu verifikasi admin (1x24 jam).',
        'withdraw_id' => $withdraw_id,
        'nominal' => $nominal,
        'admin_fee' => BIAYA_ADMIN,
        'net' => $diterima,
        'status' => 'pending'
    ]);

} catch (Exception $e) {
    if (isset($conn) && $conn->connect_errno === 0) {
        $conn->rollback();
    }
    error_log("Withdraw error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} catch (Error $e) {
    if (isset($conn) && $conn->connect_errno === 0) {
        $conn->rollback();
    }
    error_log("Withdraw error (Error): " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan server: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?>