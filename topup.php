<?php
// topup.php
require_once 'config.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method tidak diizinkan');
    }

    $user_id = intval($_POST['user_id'] ?? 0);
    $nominal = floatval($_POST['nominal'] ?? 0);
    $method = $_POST['method'] ?? 'qris';

    if (!$user_id) throw new Exception('User ID tidak valid');
    if ($nominal < 10000) throw new Exception('Minimal top up Rp 10.000');

    // Cek user
    $check_user = $conn->prepare("SELECT id, nama_lengkap FROM users WHERE id = ?");
    $check_user->bind_param("i", $user_id);
    $check_user->execute();
    $user_data = $check_user->get_result()->fetch_assoc();
    
    if (!$user_data) {
        throw new Exception('User tidak ditemukan');
    }

    $admin_fee = 2500;
    $total_dibayar = $nominal + $admin_fee;

    // Cek apakah tabel topup_requests ada
    $table_check = $conn->query("SHOW TABLES LIKE 'topup_requests'");
    if ($table_check->num_rows === 0) {
        $conn->query("
            CREATE TABLE topup_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                nominal INT NOT NULL,
                admin_fee INT DEFAULT 2500,
                total_dibayar INT NOT NULL,
                payment_method VARCHAR(50) DEFAULT 'qris',
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
    }

    $conn->begin_transaction();

    // Insert request topup
    $insert = $conn->prepare("
        INSERT INTO topup_requests (user_id, nominal, admin_fee, total_dibayar, payment_method, status, created_at) 
        VALUES (?, ?, ?, ?, ?, 'pending', NOW())
    ");
    $insert->bind_param("iiids", $user_id, $nominal, $admin_fee, $total_dibayar, $method);
    
    if (!$insert->execute()) {
        throw new Exception('Gagal membuat request');
    }
    
    $request_id = $insert->insert_id;
    $insert->close();

    // Notifikasi ke user
    $notif_msg = "💰 Request top up Rp " . number_format($nominal, 0, ',', '.') . " telah diajukan. Menunggu verifikasi admin.";
    $notif = $conn->prepare("INSERT INTO notifications (user_id, message, type, is_read, created_at) VALUES (?, ?, 'pending', 0, NOW())");
    $notif->bind_param("is", $user_id, $notif_msg);
    $notif->execute();
    $notif->close();
    
    // ================================================================
// 🔥 FCM PUSH NOTIFICATION - Request Top Up ke Admin
// ================================================================
require_once 'fcm_helper.php';

$fcm_title = "💰 Request Top Up Baru";
$fcm_body = "User " . $user_data['nama_lengkap'] . " request top up Rp " . number_format($nominal, 0, ',', '.');
$fcm_data = buildFCMData('topup_request', 0, [
    'user_id' => (string)$user_id,
    'nominal' => (string)$nominal,
    'request_id' => (string)$request_id
]);

// Kirim ke admin (user_id = 40)
sendFCMToUser(40, $fcm_title, $fcm_body, $fcm_data);

$notif->close();

$conn->commit();

echo json_encode([
    'success' => true,
    'message' => 'Request top up berhasil! Menunggu verifikasi admin.',
    'request_id' => $request_id,
    'status' => 'pending'
]);
    
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Request top up berhasil! Menunggu verifikasi admin.',
        'request_id' => $request_id,
        'status' => 'pending'
    ]);

} catch (Exception $e) {
    if (isset($conn)) $conn->rollback();
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?>