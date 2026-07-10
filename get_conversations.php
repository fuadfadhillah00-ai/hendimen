<?php
// get_conversations.php - PERBAIKAN: Deteksi user dan role yang benar
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
$stmt = $conn->prepare("SELECT id, role, nama_lengkap, profile_image FROM users WHERE id = ?");
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

$role = isset($_GET['role']) ? $_GET['role'] : '';

// ================================================================
// AMBIL KONVERSASI
// ================================================================

// Tentukan role user
$is_requester = ($role === 'requester');
$is_helper = ($role === 'helper');

// Jika role tidak dikirim, deteksi dari data
if (empty($role)) {
    // Cek apakah user pernah menjadi requester atau helper
    $check = $conn->prepare("
        SELECT 
            (SELECT COUNT(*) FROM jobs WHERE user_id = ?) as requester_count,
            (SELECT COUNT(*) FROM jobs WHERE helper_id = ?) as helper_count
    ");
    $check->bind_param("ii", $user_id, $user_id);
    $check->execute();
    $counts = $check->get_result()->fetch_assoc();
    $check->close();
    
    if ($counts['requester_count'] > 0) {
        $is_requester = true;
        $role = 'requester';
    } else if ($counts['helper_count'] > 0) {
        $is_helper = true;
        $role = 'helper';
    } else {
        $is_requester = true;
        $role = 'requester';
    }
}

// ================================================================
// BANGUN QUERY
// ================================================================

if ($is_requester) {
    // Requester: lihat percakapan dengan helper
    $query = "
        SELECT 
            c.*,
            u.nama_lengkap as other_party,
            u.id as other_party_id,
            u.profile_image as other_profile_image,
            j.title as job_title,
            j.id as job_id,
            c.requester_unread_count as unread_count
        FROM chat_conversations c
        JOIN users u ON c.helper_id = u.id
        JOIN jobs j ON c.job_id = j.id
        WHERE c.requester_id = ?
        ORDER BY c.last_message_time DESC
    ";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id);
} else {
    // Helper: lihat percakapan dengan requester
    $query = "
        SELECT 
            c.*,
            u.nama_lengkap as other_party,
            u.id as other_party_id,
            u.profile_image as other_profile_image,
            j.title as job_title,
            j.id as job_id,
            c.helper_unread_count as unread_count
        FROM chat_conversations c
        JOIN users u ON c.requester_id = u.id
        JOIN jobs j ON c.job_id = j.id
        WHERE c.helper_id = ?
        ORDER BY c.last_message_time DESC
    ";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id);
}

$stmt->execute();
$result = $stmt->get_result();
$conversations = [];

while ($row = $result->fetch_assoc()) {
    $conversations[] = [
        'id' => (int)$row['id'],
        'job_id' => (int)$row['job_id'],
        'job_title' => $row['job_title'],
        'other_party' => $row['other_party'],
        'other_party_id' => (int)$row['other_party_id'],
        'other_profile_image' => $row['other_profile_image'] ?? null,
        'last_message' => $row['last_message'],
        'last_message_time' => $row['last_message_time'],
        'unread_count' => (int)$row['unread_count'],
        'user_role' => $is_requester ? 'requester' : 'helper'
    ];
}

$stmt->close();

// ================================================================
// RESPONSE
// ================================================================
echo json_encode([
    'success' => true,
    'conversations' => $conversations,
    'total' => count($conversations),
    'user_id' => $user_id,
    'user_role' => $role,
    'is_requester' => $is_requester,
    'is_helper' => $is_helper
]);

if (isset($conn)) $conn->close();
?>