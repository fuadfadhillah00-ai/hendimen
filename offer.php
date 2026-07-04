<?php
// offer.php - CRUD tawaran untuk sistem 1 putaran negosiasi
require_once 'config.php';
session_start();

header('Content-Type: application/json');

// ================================================================
// FUNGSI BANTUAN
// ================================================================

function sendResponse($success, $message, $data = []) {
    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message
    ], $data));
    exit;
}

function validateUser($conn) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(false, 'Unauthorized');
    }
    
    $stmt = $conn->prepare("SELECT id, role, nama_lengkap FROM users WHERE id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    if (!$user) {
        sendResponse(false, 'User tidak ditemukan');
    }
    
    return $user;
}

function validateJob($conn, $job_id) {
    $stmt = $conn->prepare("SELECT id, user_id, status, price, emergency, title FROM jobs WHERE id = ?");
    $stmt->bind_param("i", $job_id);
    $stmt->execute();
    $job = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    if (!$job) {
        sendResponse(false, 'Pekerjaan tidak ditemukan');
    }
    
    return $job;
}

// ================================================================
// CREATE OFFER - Helper membuat tawaran (HANYA 1 KALI)
// ================================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create') {
    $user = validateUser($conn);
    
    // Hanya helper yang bisa menawar (role di database adalah 'user')
    if ($user['role'] !== 'user') {
        sendResponse(false, 'Hanya helper yang bisa menawar');
    }
    
    $job_id = isset($_POST['job_id']) ? intval($_POST['job_id']) : 0;
    $offered_price = isset($_POST['price']) ? floatval($_POST['price']) : 0;
    $message = isset($_POST['message']) ? trim($_POST['message']) : '';
    
    if (!$job_id) sendResponse(false, 'ID pekerjaan tidak valid');
    if ($offered_price < 10000) sendResponse(false, 'Harga tawaran minimal Rp 10.000');
    
    // Cek job
    $job = validateJob($conn, $job_id);
    
    // Cek apakah job masih open / offered (bisa ditawar)
    if ($job['status'] !== 'open' && $job['status'] !== 'offered') {
        sendResponse(false, 'Pekerjaan sudah tidak menerima tawaran');
    }
    
    // Cek apakah requester mencoba menawar pekerjaannya sendiri
    if ($job['user_id'] == $user['id']) {
        sendResponse(false, 'Anda tidak bisa menawar pekerjaan sendiri');
    }
    
    // ================================================================
    // CEK: Apakah helper sudah pernah menawar pekerjaan ini?
    // ================================================================
    $check_stmt = $conn->prepare("SELECT id FROM offers WHERE job_id = ? AND helper_id = ? AND status IN ('pending', 'accepted')");
    $check_stmt->bind_param("ii", $job_id, $user['id']);
    $check_stmt->execute();
    $existing = $check_stmt->get_result()->fetch_assoc();
    $check_stmt->close();
    
    if ($existing) {
        sendResponse(false, 'Anda sudah menawar pekerjaan ini (hanya 1 kali)');
    }
    
    // ================================================================
    // SIMPAN TAWARAN
    // ================================================================
    $conn->begin_transaction();
    
    try {
        // Insert offer
        $stmt = $conn->prepare("
            INSERT INTO offers (job_id, helper_id, offered_price, message, status, created_at) 
            VALUES (?, ?, ?, ?, 'pending', NOW())
        ");
        $stmt->bind_param("iids", $job_id, $user['id'], $offered_price, $message);
        $stmt->execute();
        $offer_id = $stmt->insert_id;
        $stmt->close();
        
        // Update job status menjadi 'offered' jika masih 'open'
        if ($job['status'] === 'open') {
            $update = $conn->prepare("UPDATE jobs SET status = 'offered' WHERE id = ?");
            $update->bind_param("i", $job_id);
            $update->execute();
            $update->close();
            error_log("offer.php: Job #{$job_id} status updated to 'offered'");
        }
        
        // Notifikasi ke requester
        $notif_msg = "💰 " . $user['nama_lengkap'] . " menawar pekerjaan \"" . $job['title'] . "\" sebesar Rp " . number_format($offered_price, 0, ',', '.') . ".";
        if (!empty($message)) {
            $notif_msg .= " Pesan: " . $message;
        }
        $notif = $conn->prepare("INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) VALUES (?, ?, 'offer', ?, 0, NOW())");
        $notif->bind_param("isi", $job['user_id'], $notif_msg, $job_id);
        $notif->execute();
        $notif->close();
        
        $conn->commit();
        
        // ================================================================
// 🔥 FCM PUSH NOTIFICATION - Tawaran Baru ke Requester
// ================================================================
require_once 'fcm_helper.php';

$fcm_title = "💰 Tawaran Baru!";
$fcm_body = $user['nama_lengkap'] . " menawar \"" . $job['title'] . "\" sebesar Rp " . number_format($offered_price, 0, ',', '.');
$fcm_data = buildFCMData('offer', $job_id, [
    'offer_id' => (string)$offer_id,
    'helper_name' => $user['nama_lengkap'],
    'price' => (string)$offered_price
]);

sendFCMToUser($job['user_id'], $fcm_title, $fcm_body, $fcm_data);

$conn->commit();
sendResponse(true, 'Tawaran berhasil dikirim! Menunggu respon Requester.', [
    'offer_id' => $offer_id,
    'job_id' => $job_id,
    'job_status' => 'offered'
]);
        
        sendResponse(true, 'Tawaran berhasil dikirim! Menunggu respon Requester.', [
            'offer_id' => $offer_id,
            'job_id' => $job_id,
            'job_status' => 'offered'
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        sendResponse(false, 'Gagal menyimpan tawaran: ' . $e->getMessage());
    }
}

// ================================================================
// GET OFFERS - Mendapatkan semua tawaran untuk satu job
// ================================================================

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'list') {
    $user = validateUser($conn);
    $job_id = isset($_GET['job_id']) ? intval($_GET['job_id']) : 0;
    
    if (!$job_id) sendResponse(false, 'ID pekerjaan tidak valid');
    
    // Cek job
    $job = validateJob($conn, $job_id);
    
    // Cek akses: hanya requester pekerjaan atau admin yang bisa melihat semua tawaran
    $is_requester = ($job['user_id'] == $user['id']);
    $is_admin = ($user['role'] === 'admin');
    
    // Helper hanya bisa melihat tawarannya sendiri
    if (!$is_requester && !$is_admin && $user['role'] === 'user') {
        $stmt = $conn->prepare("
            SELECT o.*, u.nama_lengkap as helper_name, u.rating as helper_rating,
                   (SELECT COUNT(*) FROM ratings WHERE target_id = u.id) as total_ratings
            FROM offers o
            JOIN users u ON o.helper_id = u.id
            WHERE o.job_id = ? AND o.helper_id = ?
            ORDER BY o.created_at DESC
        ");
        $stmt->bind_param("ii", $job_id, $user['id']);
    } else {
        // Requester atau admin melihat semua tawaran, diurutkan dari termurah
        $stmt = $conn->prepare("
            SELECT o.*, u.nama_lengkap as helper_name, u.rating as helper_rating,
                   (SELECT COUNT(*) FROM ratings WHERE target_id = u.id) as total_ratings
            FROM offers o
            JOIN users u ON o.helper_id = u.id
            WHERE o.job_id = ? AND o.status != 'expired'
            ORDER BY o.offered_price ASC, o.created_at ASC
        ");
        $stmt->bind_param("i", $job_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $offers = [];
    
    while ($row = $result->fetch_assoc()) {
        $row['helper_rating'] = floatval($row['helper_rating'] ?? 0);
        $row['total_ratings'] = intval($row['total_ratings'] ?? 0);
        $row['formatted_price'] = 'Rp ' . number_format($row['offered_price'], 0, ',', '.');
        $row['is_expired'] = !isOfferValid($row['created_at']);
        $offers[] = $row;
    }
    $stmt->close();
    
    sendResponse(true, 'Berhasil mengambil tawaran', ['offers' => $offers]);
}

// ================================================================
// SELECT OFFER - Requester memilih tawaran (DEAL!)
// ================================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'select') {
    $user = validateUser($conn);
    
    // Hanya requester yang bisa memilih tawaran
    if ($user['role'] !== 'user') {
        sendResponse(false, 'Hanya requester yang bisa memilih tawaran');
    }
    
    $offer_id = isset($_POST['offer_id']) ? intval($_POST['offer_id']) : 0;
    
    if (!$offer_id) sendResponse(false, 'ID tawaran tidak valid');
    
    // Ambil data tawaran
    $stmt = $conn->prepare("
        SELECT o.*, j.user_id as job_owner_id, j.id as job_id, j.title as job_title, j.emergency
        FROM offers o
        JOIN jobs j ON o.job_id = j.id
        WHERE o.id = ?
    ");
    $stmt->bind_param("i", $offer_id);
    $stmt->execute();
    $offer = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    if (!$offer) sendResponse(false, 'Tawaran tidak ditemukan');
    
    // Cek apakah user adalah pemilik pekerjaan
    if ($offer['job_owner_id'] != $user['id']) {
        sendResponse(false, 'Anda bukan pemilik pekerjaan ini');
    }
    
    // Cek apakah tawaran masih pending
    if ($offer['status'] !== 'pending') {
        sendResponse(false, 'Tawaran sudah tidak tersedia');
    }
    
    // Cek apakah tawaran masih valid (belum expired)
    if (!isOfferValid($offer['created_at'])) {
        sendResponse(false, 'Tawaran sudah expired (lebih dari 24 jam)');
    }
    
    // Cek apakah job masih dalam status yang memungkinkan
    $job = validateJob($conn, $offer['job_id']);
    if ($job['status'] !== 'open' && $job['status'] !== 'offered') {
        sendResponse(false, 'Pekerjaan sudah tidak tersedia untuk dipilih');
    }
    
    // ================================================================
    // PROSES SELECT OFFER
    // ================================================================
    $conn->begin_transaction();
    
    try {
        // 1. Update offer status menjadi 'accepted'
        $update_offer = $conn->prepare("UPDATE offers SET status = 'accepted' WHERE id = ?");
        $update_offer->bind_param("i", $offer_id);
        $update_offer->execute();
        $update_offer->close();
        
        // 2. Reject semua tawaran lain untuk job ini
        $reject_others = $conn->prepare("
            UPDATE offers SET status = 'declined' 
            WHERE job_id = ? AND id != ? AND status = 'pending'
        ");
        $reject_others->bind_param("ii", $offer['job_id'], $offer_id);
        $reject_others->execute();
        $reject_others->close();
        
        // 3. Update job status menjadi 'selected' (menunggu pembayaran)
        $update_job = $conn->prepare("
            UPDATE jobs 
            SET status = 'selected', 
                helper_id = ?, 
                price = ?,
                selected_offer_id = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $update_job->bind_param("idii", $offer['helper_id'], $offer['offered_price'], $offer_id, $offer['job_id']);
        $update_job->execute();
        $update_job->close();
        
        // 4. Notifikasi ke helper bahwa tawarannya dipilih
        $notif_helper = $conn->prepare("
            INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) 
            VALUES (?, ?, 'success', ?, 0, NOW())
        ");
        $msg = "🎉 Selamat! Tawaran Anda untuk \"" . $offer['job_title'] . "\" dipilih! Silakan tunggu instruksi pembayaran dari Requester.";
        $notif_helper->bind_param("isi", $offer['helper_id'], $msg, $offer['job_id']);
        $notif_helper->execute();
        $notif_helper->close();
        
        // 5. Notifikasi ke requester bahwa sudah memilih
        $notif_req = $conn->prepare("
            INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) 
            VALUES (?, ?, 'info', ?, 0, NOW())
        ");
        $req_msg = "✅ Anda telah memilih tawaran dari " . $offer['helper_name'] . " sebesar Rp " . number_format($offer['offered_price'], 0, ',', '.') . 
                   " untuk \"" . $offer['job_title'] . "\". Silakan lakukan pembayaran untuk mulai pekerjaan.";
        $notif_req->bind_param("isi", $user['id'], $req_msg, $offer['job_id']);
        $notif_req->execute();
        $notif_req->close();
        
        $conn->commit();
        
        // ================================================================
// 🔥 FCM PUSH NOTIFICATION - Tawaran Dipilih ke Helper
// ================================================================
require_once 'fcm_helper.php';

$fcm_title = "🎉 Tawaran Anda Dipilih!";
$fcm_body = "Tawaran Anda untuk \"" . $offer['job_title'] . "\" dipilih! Silakan tunggu pembayaran dari Requester.";
$fcm_data = buildFCMData('offer_selected', $offer['job_id'], [
    'price' => (string)$offer['offered_price']
]);

sendFCMToUser($offer['helper_id'], $fcm_title, $fcm_body, $fcm_data);

$conn->commit();
sendResponse(true, 'Tawaran berhasil dipilih!', [
    'job_id' => $offer['job_id'],
    'selected_price' => $offer['offered_price'],
    'helper_id' => $offer['helper_id']
]);
        
        sendResponse(true, 'Tawaran berhasil dipilih!', [
            'job_id' => $offer['job_id'],
            'selected_price' => $offer['offered_price'],
            'helper_id' => $offer['helper_id']
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        sendResponse(false, 'Gagal memilih tawaran: ' . $e->getMessage());
    }
}

// ================================================================
// DECLINE OFFER - Requester menolak tawaran (opsional)
// ================================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'decline') {
    $user = validateUser($conn);
    
    // Hanya requester yang bisa menolak tawaran
    if ($user['role'] !== 'user') {
        sendResponse(false, 'Hanya requester yang bisa menolak tawaran');
    }
    
    $offer_id = isset($_POST['offer_id']) ? intval($_POST['offer_id']) : 0;
    $reason = isset($_POST['reason']) ? trim($_POST['reason']) : '';
    
    if (!$offer_id) sendResponse(false, 'ID tawaran tidak valid');
    
    // Ambil data tawaran
    $stmt = $conn->prepare("
        SELECT o.*, j.user_id as job_owner_id, j.title as job_title, u.nama_lengkap as helper_name
        FROM offers o
        JOIN jobs j ON o.job_id = j.id
        JOIN users u ON o.helper_id = u.id
        WHERE o.id = ?
    ");
    $stmt->bind_param("i", $offer_id);
    $stmt->execute();
    $offer = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    if (!$offer) sendResponse(false, 'Tawaran tidak ditemukan');
    
    // Cek apakah user adalah pemilik pekerjaan
    if ($offer['job_owner_id'] != $user['id']) {
        sendResponse(false, 'Anda bukan pemilik pekerjaan ini');
    }
    
    // Cek apakah tawaran masih pending
    if ($offer['status'] !== 'pending') {
        sendResponse(false, 'Tawaran sudah tidak tersedia');
    }
    
    $conn->begin_transaction();
    
    try {
        // Update offer status
        $update = $conn->prepare("UPDATE offers SET status = 'declined' WHERE id = ?");
        $update->bind_param("i", $offer_id);
        $update->execute();
        $update->close();
        
        // Notifikasi ke helper
        $notif = $conn->prepare("
            INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) 
            VALUES (?, ?, 'reject', ?, 0, NOW())
        ");
        $msg = "❌ Tawaran Anda untuk \"" . $offer['job_title'] . "\" ditolak oleh Requester.";
        if (!empty($reason)) {
            $msg .= " Alasan: " . $reason;
        }
        $notif->bind_param("isi", $offer['helper_id'], $msg, $offer['job_id']);
        $notif->execute();
        $notif->close();
        
        $conn->commit();
        
        sendResponse(true, 'Tawaran ditolak');
        
    } catch (Exception $e) {
        $conn->rollback();
        sendResponse(false, 'Gagal menolak tawaran: ' . $e->getMessage());
    }
}

// ================================================================
// DEFAULT - Method tidak dikenali
// ================================================================

sendResponse(false, 'Method atau action tidak dikenali');
?>