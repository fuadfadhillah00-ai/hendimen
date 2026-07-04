<?php
// send_message.php - PERBAIKAN DENGAN CLEAN OUTPUT
// 🔥 PASTIKAN TIDAK ADA SPASI ATAU KARAKTER SEBELUM <?php

// Hapus semua output buffer yang mungkin ada
while (ob_get_level()) ob_end_clean();
error_reporting(0);
ini_set('display_errors', 0);

session_start();
require_once 'config.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');
header('Access-Control-Allow-Origin: *');

// ================================================================
// FUNGSI SEND RESPONSE YANG AMAN
// ================================================================
function sendJsonResponse($data) {
    // Bersihkan semua output yang mungkin sudah terkirim
    while (ob_get_level()) ob_end_clean();
    echo json_encode($data);
    exit;
}

// ================================================================
// VALIDASI USER
// ================================================================

if (!isset($_SESSION['user_id'])) {
    sendJsonResponse(['success' => false, 'message' => 'Unauthorized']);
}

$sender_id = intval($_SESSION['user_id']);

// Ambil data sender
$stmt = $conn->prepare("SELECT id, role, nama_lengkap FROM users WHERE id = ?");
$stmt->bind_param("i", $sender_id);
$stmt->execute();
$sender = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$sender) {
    sendJsonResponse(['success' => false, 'message' => 'User tidak ditemukan']);
}

// ================================================================
// AMBIL DATA DARI POST
// ================================================================

$job_id = isset($_POST['job_id']) ? intval($_POST['job_id']) : 0;
$receiver_id = isset($_POST['receiver_id']) ? intval($_POST['receiver_id']) : 0;
$message = isset($_POST['message']) ? trim($_POST['message']) : '';
$sender_role = isset($_POST['sender_role']) ? $_POST['sender_role'] : '';

if (!$job_id || !$receiver_id || empty($message)) {
    sendJsonResponse(['success' => false, 'message' => 'Data tidak lengkap']);
}

// ================================================================
// VALIDASI JOB
// ================================================================

$stmt = $conn->prepare("SELECT id, user_id, helper_id, title FROM jobs WHERE id = ?");
$stmt->bind_param("i", $job_id);
$stmt->execute();
$job = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$job) {
    sendJsonResponse(['success' => false, 'message' => 'Pekerjaan tidak ditemukan']);
}

// Cek apakah sender terlibat dalam job ini
$is_requester = ($job['user_id'] == $sender_id);
$is_helper = ($job['helper_id'] == $sender_id);

if (!$is_requester && !$is_helper) {
    sendJsonResponse(['success' => false, 'message' => 'Anda tidak terlibat dalam pekerjaan ini']);
}

// Tentukan role sender yang sebenarnya
if (empty($sender_role)) {
    $sender_role = $is_requester ? 'requester' : 'helper';
}

// ================================================================
// SIMPAN PESAN
// ================================================================

$conn->begin_transaction();

try {
    // Insert message
    $stmt = $conn->prepare("
        INSERT INTO chat_messages (job_id, sender_id, receiver_id, message, is_read, created_at) 
        VALUES (?, ?, ?, ?, 0, NOW())
    ");
    $stmt->bind_param("iiis", $job_id, $sender_id, $receiver_id, $message);
    $stmt->execute();
    $message_id = $stmt->insert_id;
    $stmt->close();

    // Update conversation
    $stmt = $conn->prepare("
        INSERT INTO chat_conversations (job_id, helper_id, requester_id, last_message, last_message_time) 
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
            last_message = VALUES(last_message),
            last_message_time = VALUES(last_message_time)
    ");
    
    $helper_id = $job['helper_id'] ?: 0;
    $requester_id = $job['user_id'];
    
    $stmt->bind_param("iiis", $job_id, $helper_id, $requester_id, $message);
    $stmt->execute();
    $stmt->close();

    // Update unread count untuk receiver
    $is_receiver_requester = ($receiver_id == $job['user_id']);
    
    if ($is_receiver_requester) {
        $update = $conn->prepare("
            UPDATE chat_conversations 
            SET requester_unread_count = requester_unread_count + 1 
            WHERE job_id = ?
        ");
    } else {
        $update = $conn->prepare("
            UPDATE chat_conversations 
            SET helper_unread_count = helper_unread_count + 1 
            WHERE job_id = ?
        ");
    }
    $update->bind_param("i", $job_id);
    $update->execute();
    $update->close();

    // ================================================================
    // 🔥 FCM PUSH NOTIFICATION - Pesan Baru ke Receiver
    // ================================================================
    require_once 'fcm_helper.php';

    $sender_name = $sender['nama_lengkap'] ?? 'Pengguna';

    $fcm_title = "💬 Pesan dari " . $sender_name;
    $fcm_body = substr($message, 0, 100) . (strlen($message) > 100 ? '...' : '');
    $fcm_data = buildFCMData('chat_message', $job_id, [
        'sender_id' => (string)$sender_id,
        'sender_name' => $sender_name,
        'message' => $message,
        'job_title' => $job['title']
    ]);

    // Kirim ke receiver
    sendFCMToUser($receiver_id, $fcm_title, $fcm_body, $fcm_data);

    $conn->commit();

    // ================================================================
    // RESPONSE YANG AMAN
    // ================================================================
    sendJsonResponse([
        'success' => true,
        'message' => 'Pesan terkirim',
        'data' => [
            'id' => $message_id,
            'sender_id' => $sender_id,
            'sender_role' => $sender_role,
            'receiver_id' => $receiver_id,
            'message' => $message,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);

} catch (Exception $e) {
    $conn->rollback();
    sendJsonResponse([
        'success' => false,
        'message' => 'Gagal menyimpan pesan: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?>