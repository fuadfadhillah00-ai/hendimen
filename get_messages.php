<?php
// get_messages.php - PERBAIKAN: Deteksi user dan role yang benar + data lokasi
require_once 'config.php';
session_start();

header('Content-Type: application/json');

// ================================================================
// VALIDASI USER
// ================================================================

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = intval($_SESSION['user_id']);

// Ambil data user
$stmt = $conn->prepare("SELECT id, role, nama_lengkap FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
    exit;
}

// ================================================================
// AMBIL PARAMETER
// ================================================================

$job_id = intval($_GET['job_id'] ?? 0);
$other_id = intval($_GET['other_id'] ?? 0);
$role = trim($_GET['role'] ?? '');
$limit = max(1, min(200, intval($_GET['limit'] ?? 100)));
$offset = max(0, intval($_GET['offset'] ?? 0));
$last_message_id = intval($_GET['last_message_id'] ?? 0);

if (!$job_id || !$other_id) {
    echo json_encode(['success' => false, 'message' => 'Parameter tidak lengkap']);
    exit;
}

// ================================================================
// VALIDASI JOB
// ================================================================

$stmt = $conn->prepare("SELECT id, user_id, helper_id, status, title FROM jobs WHERE id = ?");
$stmt->bind_param("i", $job_id);
$stmt->execute();
$job = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$job) {
    echo json_encode(['success' => false, 'message' => 'Pekerjaan tidak ditemukan']);
    exit;
}

// Cek apakah user terlibat dalam job ini
$is_requester = ($job['user_id'] == $user_id);
$is_helper = ($job['helper_id'] == $user_id);

if (!$is_requester && !$is_helper) {
    echo json_encode(['success' => false, 'message' => 'Anda tidak terlibat dalam pekerjaan ini']);
    exit;
}

// Tentukan role user
$user_role = $is_requester ? 'requester' : 'helper';

// ================================================================
// AMBIL PESAN (DENGAN DATA LOKASI)
// ================================================================

if ($last_message_id > 0) {
    // Polling: hanya pesan baru
    $stmt = $conn->prepare("
        SELECT m.id, m.sender_id, m.receiver_id, m.message, m.type, m.is_read, m.created_at,
               m.location_data, m.latitude, m.longitude, m.location_address,
               DATE_FORMAT(m.created_at, '%H:%i') AS time_only,
               DATE_FORMAT(m.created_at, '%d/%m/%Y') AS date_only
        FROM chat_messages m
        WHERE m.job_id = ?
          AND m.id > ?
          AND ((m.sender_id = ? AND m.receiver_id = ?)
            OR (m.sender_id = ? AND m.receiver_id = ?))
        ORDER BY m.created_at ASC
    ");
    $stmt->bind_param("iiiiii", $job_id, $last_message_id, $user_id, $other_id, $other_id, $user_id);
} else {
    // Load awal dengan pagination
    $stmt = $conn->prepare("
        SELECT m.id, m.sender_id, m.receiver_id, m.message, m.type, m.is_read, m.created_at,
               m.location_data, m.latitude, m.longitude, m.location_address,
               DATE_FORMAT(m.created_at, '%H:%i') AS time_only,
               DATE_FORMAT(m.created_at, '%d/%m/%Y') AS date_only
        FROM chat_messages m
        WHERE m.job_id = ?
          AND ((m.sender_id = ? AND m.receiver_id = ?)
            OR (m.sender_id = ? AND m.receiver_id = ?))
        ORDER BY m.created_at ASC
        LIMIT ? OFFSET ?
    ");
    $stmt->bind_param("iiiiiii", $job_id, $user_id, $other_id, $other_id, $user_id, $limit, $offset);
}

$stmt->execute();
$result = $stmt->get_result();
$stmt->close();

$messages = [];
$newest_id = 0;

while ($row = $result->fetch_assoc()) {
    // Tentukan apakah pesan dari user atau dari lawan bicara
    $is_me = ($row['sender_id'] == $user_id);
    
    $messages[] = [
        'id' => (int)$row['id'],
        'sender_id' => (int)$row['sender_id'],
        'receiver_id' => (int)$row['receiver_id'],
        'message' => $row['message'],
        'type' => $row['type'] ?? 'text',
        'is_read' => (bool)$row['is_read'],
        'is_me' => $is_me,
        'created_at' => $row['created_at'],
        'time_only' => $row['time_only'],
        'date_only' => $row['date_only'],
        // ================================================================
        // 🔥🔥🔥 DATA LOKASI
        // ================================================================
        'location_data' => $row['location_data'],
        'latitude' => $row['latitude'] ? floatval($row['latitude']) : null,
        'longitude' => $row['longitude'] ? floatval($row['longitude']) : null,
        'location_address' => $row['location_address']
    ];
    
    if ((int)$row['id'] > $newest_id) $newest_id = (int)$row['id'];
}

// ================================================================
// TANDAI PESAN SEBAGAI DIBACA
// ================================================================

if (count($messages) > 0) {
    $mark = $conn->prepare("
        UPDATE chat_messages 
        SET is_read = 1
        WHERE job_id = ? AND receiver_id = ? AND is_read = 0
    ");
    $mark->bind_param("ii", $job_id, $user_id);
    $mark->execute();
    $mark->close();

    // Reset unread count
    if ($user_role === 'helper') {
        $upd = $conn->prepare("
            UPDATE chat_conversations 
            SET helper_unread_count = 0 
            WHERE job_id = ? AND helper_id = ?
        ");
        $upd->bind_param("ii", $job_id, $user_id);
    } else {
        $upd = $conn->prepare("
            UPDATE chat_conversations 
            SET requester_unread_count = 0 
            WHERE job_id = ? AND requester_id = ?
        ");
        $upd->bind_param("ii", $job_id, $user_id);
    }
    $upd->execute();
    $upd->close();
}

// ================================================================
// 🔥 RESPONSE
// ================================================================
echo json_encode([
    'success' => true,
    'messages' => $messages,
    'newest_id' => $newest_id,
    'total' => count($messages),
    'user_role' => $user_role,
    'is_requester' => $is_requester,
    'is_helper' => $is_helper
]);

if (isset($conn)) $conn->close();
?>