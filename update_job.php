<?php
// update_job.php - UPDATE dengan sistem 1 putaran negosiasi
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt');

require_once 'config.php';
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan. Gunakan POST.']);
    exit;
}

function sendResponse($success, $message, $extra = []) {
    $response = array_merge(['success' => $success, 'message' => $message], $extra);
    echo json_encode($response);
    exit;
}

try {
    $job_id = isset($_POST['job_id']) ? intval($_POST['job_id']) : 0;
    $action = isset($_POST['action']) ? $_POST['action'] : '';
    $user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;

    error_log("update_job.php - action: $action, job_id: $job_id, user_id: $user_id");

    if (!$job_id) throw new Exception('ID pekerjaan tidak valid');
    if (!$action) throw new Exception('Aksi tidak ditentukan');
    if (!$user_id) throw new Exception('User ID tidak valid');

    $conn->begin_transaction();

    // ================================================================
    // ACTION: PAY - Requester membayar setelah deal
    // ================================================================
    if ($action === 'pay') {
        $stmt = $conn->prepare("SELECT user_id, helper_id, price, tip, title, status, emergency FROM jobs WHERE id = ?");
        $stmt->bind_param("i", $job_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $job = $result->fetch_assoc();
        $stmt->close();

        if (!$job) throw new Exception('Pekerjaan tidak ditemukan');
        if ($job['user_id'] != $user_id) throw new Exception('Anda bukan requester pekerjaan ini');
        if ($job['status'] !== 'selected') throw new Exception('Pekerjaan belum deal atau sudah dibayar');

        // Hitung total biaya untuk requester
        $is_emergency = $job['emergency'] ?? 0;
        $cost = calculateRequesterCost($job['price'], $is_emergency);
        $total = $cost['total'];

        // Cek saldo requester
        $balance_stmt = $conn->prepare("SELECT wallet_requester FROM users WHERE id = ?");
        $balance_stmt->bind_param("i", $user_id);
        $balance_stmt->execute();
        $user_balance = $balance_stmt->get_result()->fetch_assoc();
        $balance_stmt->close();

        if ($user_balance['wallet_requester'] < $total) {
            throw new Exception('Saldo tidak cukup. Total: Rp ' . number_format($total, 0, ',', '.') . 
                               ', Saldo: Rp ' . number_format($user_balance['wallet_requester'], 0, ',', '.'));
        }

        // PROSES PEMBAYARAN
        // 1. Kurangi saldo requester (total)
        $update_balance = $conn->prepare("UPDATE users SET wallet_requester = wallet_requester - ? WHERE id = ?");
        $update_balance->bind_param("di", $total, $user_id);
        $update_balance->execute();
        $update_balance->close();

        // 2. Update job status
        $update_job = $conn->prepare("UPDATE jobs SET status = 'paid' WHERE id = ?");
        $update_job->bind_param("i", $job_id);
        $update_job->execute();
        $update_job->close();

        // 3. Catat transaksi - DEBIT (harga deal)
        $desc = "Pembayaran deal pekerjaan: " . $job['title'];
        $stmt = $conn->prepare("
            INSERT INTO transactions (user_id, role, amount, description, type, status, reference_id, reference_type, created_at) 
            VALUES (?, 'requester', ?, ?, 'debit', 'success', ?, 'job', NOW())
        ");
        $debit_amount = -$job['price'];
        $stmt->bind_param("idsi", $user_id, $debit_amount, $desc, $job_id);
        $stmt->execute();
        $stmt->close();

        // 4. Catat SERVICE FEE
        $service_fee = $job['price'] * (SERVICE_FEE_PERCENT / 100);
        $desc = "Service fee " . SERVICE_FEE_PERCENT . "% dari pekerjaan: " . $job['title'];
        $stmt = $conn->prepare("
            INSERT INTO transactions (user_id, role, amount, description, type, status, reference_id, reference_type, created_at) 
            VALUES (?, 'requester', ?, ?, 'service_fee', 'success', ?, 'job', NOW())
        ");
        $fee_amount = -$service_fee;
        $stmt->bind_param("idsi", $user_id, $fee_amount, $desc, $job_id);
        $stmt->execute();
        $stmt->close();

        // 5. Catat ADMIN FEE
        $desc = "Admin fee pekerjaan: " . $job['title'];
        $stmt = $conn->prepare("
            INSERT INTO transactions (user_id, role, amount, description, type, status, reference_id, reference_type, created_at) 
            VALUES (?, 'requester', ?, ?, 'admin_fee', 'success', ?, 'job', NOW())
        ");
        $admin_amount = -ADMIN_FEE;
        $stmt->bind_param("idsi", $user_id, $admin_amount, $desc, $job_id);
        $stmt->execute();
        $stmt->close();

        // 6. Jika emergency
        if ($is_emergency) {
            $desc = "Emergency fee pekerjaan: " . $job['title'];
            $stmt = $conn->prepare("
                INSERT INTO transactions (user_id, role, amount, description, type, status, reference_id, reference_type, created_at) 
                VALUES (?, 'requester', ?, ?, 'emergency_fee', 'success', ?, 'job', NOW())
            ");
            $emergency_amount = -EMERGENCY_FEE;
            $stmt->bind_param("idsi", $user_id, $emergency_amount, $desc, $job_id);
            $stmt->execute();
            $stmt->close();
        }

        // Notifikasi ke helper
        $notif = $conn->prepare("
            INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) 
            VALUES (?, ?, 'payment', ?, 0, NOW())
        ");
        $msg = "💳 Pembayaran untuk \"" . $job['title'] . "\" telah diterima! Silakan mulai bekerja.";
        $notif->bind_param("isi", $job['helper_id'], $msg, $job_id);
        $notif->execute();
        $notif->close();
        
        // ================================================================
// 🔥 FCM PUSH NOTIFICATION - Pembayaran Berhasil ke Helper
// ================================================================
require_once 'fcm_helper.php';

$fcm_title = "💳 Pembayaran Diterima!";
$fcm_body = "Pembayaran untuk \"" . $job['title'] . "\" telah diterima. Segera mulai bekerja!";
$fcm_data = buildFCMData('payment', $job_id, [
    'price' => (string)$job['price']
]);

sendFCMToUser($job['helper_id'], $fcm_title, $fcm_body, $fcm_data);

$conn->commit();
sendResponse(true, 'Pembayaran berhasil! Pekerjaan siap dimulai.', [
    'total' => $total,
    'new_balance' => $user_balance['wallet_requester'] - $total
]);
        
        $conn->commit();
        sendResponse(true, 'Pembayaran berhasil! Pekerjaan siap dimulai.', [
            'total' => $total,
            'new_balance' => $user_balance['wallet_requester'] - $total
        ]);

    // ================================================================
    // ACTION: START - Helper mulai bekerja (setelah dibayar)
    // ================================================================
    } elseif ($action === 'start') {
        $stmt = $conn->prepare("SELECT helper_id, status, title, user_id FROM jobs WHERE id = ?");
        $stmt->bind_param("i", $job_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $job = $result->fetch_assoc();
        $stmt->close();

        if (!$job) throw new Exception('Pekerjaan tidak ditemukan');
        if ($job['helper_id'] != $user_id) throw new Exception('Anda bukan helper pekerjaan ini');
        if ($job['status'] !== 'paid') throw new Exception('Pekerjaan belum dibayar');

        $update = $conn->prepare("UPDATE jobs SET status = 'in-progress' WHERE id = ?");
        $update->bind_param("i", $job_id);
        $update->execute();
        $update->close();

        // Notifikasi ke requester
        $notif = $conn->prepare("
            INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) 
            VALUES (?, ?, 'info', ?, 0, NOW())
        ");
        $msg = "🔧 Helper sudah mulai mengerjakan \"" . $job['title'] . "\".";
        $notif->bind_param("isi", $job['user_id'], $msg, $job_id);
        $notif->execute();
        $notif->close();

        // ================================================================
// 🔥 FCM PUSH NOTIFICATION - Helper Mulai Bekerja ke Requester
// ================================================================
require_once 'fcm_helper.php';

$fcm_title = "🔧 Helper Mulai Bekerja";
$fcm_body = "Helper sudah mulai mengerjakan \"" . $job['title'] . "\".";
$fcm_data = buildFCMData('job_start', $job_id);

sendFCMToUser($job['user_id'], $fcm_title, $fcm_body, $fcm_data);

$conn->commit();
sendResponse(true, 'Pekerjaan dimulai!');

        $conn->commit();
        sendResponse(true, 'Pekerjaan dimulai!');

    // ================================================================
    // ACTION: COMPLETE - Helper selesai & upload bukti (via upload_completion.php)
    // ================================================================
    // Note: Upload bukti sudah ditangani oleh upload_completion.php
    // Ini hanya untuk fallback jika ingin menggunakan endpoint ini

    // ================================================================
    // ACTION: ACC - Requester menyetujui pekerjaan
    // ================================================================
    } elseif ($action === 'acc') {
        $stmt = $conn->prepare("SELECT user_id, helper_id, price, tip, title, status FROM jobs WHERE id = ?");
        $stmt->bind_param("i", $job_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $job = $result->fetch_assoc();
        $stmt->close();

        if (!$job) throw new Exception('Pekerjaan tidak ditemukan');
        if ($job['user_id'] != $user_id) throw new Exception('Anda bukan requester pekerjaan ini');
        if ($job['status'] !== 'pending_acc') throw new Exception('Pekerjaan bukan status pending_acc');

        $deal_price = floatval($job['price']);
        
        // Hitung pendapatan helper (dipotong helper fee)
        $earnings = calculateHelperEarnings($deal_price);
        $net_amount = $earnings['net_earnings'];
        $helper_fee = $earnings['helper_fee'];

        // Update job status
        $update = $conn->prepare("UPDATE jobs SET status = 'completed' WHERE id = ?");
        $update->bind_param("i", $job_id);
        $update->execute();
        $update->close();

        // Transfer ke helper (net)
        $update_balance = $conn->prepare("UPDATE users SET wallet_helper = wallet_helper + ? WHERE id = ?");
        $update_balance->bind_param("di", $net_amount, $job['helper_id']);
        $update_balance->execute();
        $update_balance->close();

        // Catat transaksi PAYMENT untuk helper
        $desc = "Pembayaran dari pekerjaan: " . $job['title'] . " (setelah potongan " . HELPER_FEE_PERCENT . "%)";
        $stmt = $conn->prepare("
            INSERT INTO transactions (user_id, role, amount, description, type, status, reference_id, reference_type, created_at) 
            VALUES (?, 'helper', ?, ?, 'payment', 'success', ?, 'job', NOW())
        ");
        $stmt->bind_param("idsi", $job['helper_id'], $net_amount, $desc, $job_id);
        $stmt->execute();
        $stmt->close();

        // Catat transaksi HELPER FEE (potongan)
        $desc = "Potongan " . HELPER_FEE_PERCENT . "% biaya platform dari pekerjaan: " . $job['title'];
        $fee_amount = -$helper_fee;
        $stmt = $conn->prepare("
            INSERT INTO transactions (user_id, role, amount, description, type, status, reference_id, reference_type, created_at) 
            VALUES (?, 'helper', ?, ?, 'helper_fee', 'success', ?, 'job', NOW())
        ");
        $stmt->bind_param("idsi", $job['helper_id'], $fee_amount, $desc, $job_id);
        $stmt->execute();
        $stmt->close();

        // Jika ada tip
        if (isset($job['tip']) && $job['tip'] > 0) {
            $tip_amount = $job['tip'];
            $desc = "Tip dari pekerjaan: " . $job['title'];
            $stmt = $conn->prepare("
                INSERT INTO transactions (user_id, role, amount, description, type, status, reference_id, reference_type, created_at) 
                VALUES (?, 'helper', ?, ?, 'tip', 'success', ?, 'job', NOW())
            ");
            $stmt->bind_param("idsi", $job['helper_id'], $tip_amount, $desc, $job_id);
            $stmt->execute();
            $stmt->close();
        }

        // Notifikasi ke helper
        $notif = $conn->prepare("
            INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) 
            VALUES (?, ?, 'payment', ?, 0, NOW())
        ");
        $msg = "🎉 Pekerjaan \"" . $job['title'] . "\" telah disetujui! Rp " . 
               number_format($net_amount, 0, ',', '.') . " masuk ke wallet Helper Anda.";
        if ($helper_fee > 0) {
            $msg .= " (Potongan " . HELPER_FEE_PERCENT . "%: Rp " . number_format($helper_fee, 0, ',', '.') . ")";
        }
        $notif->bind_param("isi", $job['helper_id'], $msg, $job_id);
        $notif->execute();
        $notif->close();

        // ================================================================
// 🔥 FCM PUSH NOTIFICATION - Pekerjaan Disetujui ke Helper
// ================================================================
require_once 'fcm_helper.php';

$fcm_title = "✅ Pekerjaan Disetujui!";
$fcm_body = "Pekerjaan \"" . $job['title'] . "\" telah disetujui. Dana Rp " . number_format($net_amount, 0, ',', '.') . " masuk ke wallet Anda.";
$fcm_data = buildFCMData('job_acc', $job_id, [
    'amount' => (string)$net_amount
]);

sendFCMToUser($job['helper_id'], $fcm_title, $fcm_body, $fcm_data);

$conn->commit();
sendResponse(true, 'Pekerjaan disetujui! Dana telah ditransfer ke Helper.');

        $conn->commit();
        sendResponse(true, 'Pekerjaan disetujui! Dana telah ditransfer ke Helper.');

    // ================================================================
    // ACTION: REJECT - Requester menolak bukti
    // ================================================================
    } elseif ($action === 'reject') {
        $alasan = isset($_POST['alasan']) ? trim($_POST['alasan']) : '';
        if (empty($alasan)) throw new Exception('Alasan reject wajib diisi');

        $stmt = $conn->prepare("SELECT user_id, helper_id, title FROM jobs WHERE id = ? AND status = 'pending_acc'");
        $stmt->bind_param("i", $job_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $job = $result->fetch_assoc();
        $stmt->close();

        if (!$job) throw new Exception('Pekerjaan tidak ditemukan');
        if ($job['user_id'] != $user_id) throw new Exception('Anda bukan requester pekerjaan ini');

        $stmt = $conn->prepare("UPDATE jobs SET status = 'perbaikan', reject_reason = ? WHERE id = ?");
        $stmt->bind_param("si", $alasan, $job_id);
        $stmt->execute();
        $stmt->close();

        $notif_msg = "⚠️ Pekerjaan \"" . $job['title'] . "\" ditolak. Alasan: " . $alasan;
        $notif = $conn->prepare("INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) VALUES (?, ?, 'reject', ?, 0, NOW())");
        $notif->bind_param("isi", $job['helper_id'], $notif_msg, $job_id);
        $notif->execute();
        $notif->close();

        // ================================================================
// 🔥 FCM PUSH NOTIFICATION - Pekerjaan Ditolak ke Helper
// ================================================================
require_once 'fcm_helper.php';

$fcm_title = "❌ Bukti Ditolak";
$fcm_body = "Bukti untuk \"" . $job['title'] . "\" ditolak. Alasan: " . $alasan . ". Silakan upload ulang bukti.";
$fcm_data = buildFCMData('job_reject', $job_id, [
    'reason' => $alasan
]);

sendFCMToUser($job['helper_id'], $fcm_title, $fcm_body, $fcm_data);

$conn->commit();
sendResponse(true, 'Bukti ditolak');

        $conn->commit();
        sendResponse(true, 'Bukti ditolak');

    // ================================================================
    // ACTION: RATE - Rating
    // ================================================================
    } elseif ($action === 'rate') {
        $rating = isset($_POST['rating']) ? intval($_POST['rating']) : 0;
        $ulasan = isset($_POST['ulasan']) ? trim($_POST['ulasan']) : '';
        $rater_role = isset($_POST['rater_role']) ? $_POST['rater_role'] : '';
        $target_id = isset($_POST['target_id']) ? intval($_POST['target_id']) : 0;

        if ($rating < 1 || $rating > 5) throw new Exception('Rating harus 1-5');
        if (!$target_id) throw new Exception('Target user tidak valid');

        $stmt = $conn->prepare("SELECT status, title FROM jobs WHERE id = ?");
        $stmt->bind_param("i", $job_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $job = $result->fetch_assoc();
        $stmt->close();

        if (!$job || $job['status'] !== 'completed') {
            throw new Exception('Rating hanya untuk pekerjaan selesai');
        }

        $stmt = $conn->prepare("SELECT id FROM ratings WHERE job_id = ? AND rater_id = ?");
        $stmt->bind_param("ii", $job_id, $user_id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            $stmt->close();
            throw new Exception('Anda sudah memberi rating');
        }
        $stmt->close();

        $stmt = $conn->prepare("INSERT INTO ratings (job_id, rater_id, target_id, rater_role, rating, ulasan, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmt->bind_param("iiisis", $job_id, $user_id, $target_id, $rater_role, $rating, $ulasan);
        $stmt->execute();
        $stmt->close();

        $stmt = $conn->prepare("SELECT AVG(rating) as avg_rating FROM ratings WHERE target_id = ?");
        $stmt->bind_param("i", $target_id);
        $stmt->execute();
        $avg_data = $stmt->get_result()->fetch_assoc();
        $avg = round(floatval($avg_data['avg_rating']), 1);
        $stmt->close();

        $stmt = $conn->prepare("UPDATE users SET rating = ? WHERE id = ?");
        $stmt->bind_param("di", $avg, $target_id);
        $stmt->execute();
        $stmt->close();

        $conn->commit();
        sendResponse(true, 'Rating berhasil disimpan');

    // ================================================================
    // ACTION: REPORT
    // ================================================================
    } elseif ($action === 'report') {
        $pesan = isset($_POST['pesan']) ? trim($_POST['pesan']) : '';
        $role = isset($_POST['role']) ? $_POST['role'] : '';
        
        if (empty($pesan)) throw new Exception('Pesan laporan wajib diisi');

        $conn->query("CREATE TABLE IF NOT EXISTS job_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            job_id INT NOT NULL,
            reporter_id INT NOT NULL,
            reporter_role VARCHAR(20) NOT NULL,
            message TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'open',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        $stmt = $conn->prepare("INSERT INTO job_reports (job_id, reporter_id, reporter_role, message, status, created_at) VALUES (?, ?, ?, ?, 'open', NOW())");
        $stmt->bind_param("iiss", $job_id, $user_id, $role, $pesan);
        $stmt->execute();
        $stmt->close();

        $conn->commit();
        sendResponse(true, 'Laporan terkirim');

    // ================================================================
    // ACTION: CANCEL - Batalkan pekerjaan (hanya requester)
    // ================================================================
    } elseif ($action === 'cancel') {
        $stmt = $conn->prepare("SELECT user_id, status, title FROM jobs WHERE id = ?");
        $stmt->bind_param("i", $job_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $job = $result->fetch_assoc();
        $stmt->close();

        if (!$job) throw new Exception('Pekerjaan tidak ditemukan');
        if ($job['user_id'] != $user_id) throw new Exception('Anda bukan requester pekerjaan ini');
        
        $cancelable_statuses = ['open', 'offered'];
        if (!in_array($job['status'], $cancelable_statuses)) {
            throw new Exception('Pekerjaan sudah tidak bisa dibatalkan');
        }

        $update = $conn->prepare("UPDATE jobs SET status = 'cancelled' WHERE id = ?");
        $update->bind_param("i", $job_id);
        $update->execute();
        $update->close();

        // Notifikasi ke semua helper yang sudah menawar
        $helper_stmt = $conn->prepare("SELECT DISTINCT helper_id FROM offers WHERE job_id = ? AND status = 'pending'");
        $helper_stmt->bind_param("i", $job_id);
        $helper_stmt->execute();
        $helpers = $helper_stmt->get_result();
        
        while ($helper = $helpers->fetch_assoc()) {
            $notif = $conn->prepare("
                INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) 
                VALUES (?, ?, 'info', ?, 0, NOW())
            ");
            $msg = "❌ Pekerjaan \"" . $job['title'] . "\" telah dibatalkan oleh Requester.";
            $notif->bind_param("isi", $helper['helper_id'], $msg, $job_id);
            $notif->execute();
            $notif->close();
        }
        $helper_stmt->close();

        // Update semua tawaran pending menjadi expired
        $update_offers = $conn->prepare("UPDATE offers SET status = 'expired' WHERE job_id = ? AND status = 'pending'");
        $update_offers->bind_param("i", $job_id);
        $update_offers->execute();
        $update_offers->close();

        $conn->commit();
        sendResponse(true, 'Pekerjaan dibatalkan');

    } else {
        throw new Exception('Aksi tidak dikenali: ' . $action);
    }

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    error_log("update_job.php Exception: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} catch (Error $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    error_log("update_job.php Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>