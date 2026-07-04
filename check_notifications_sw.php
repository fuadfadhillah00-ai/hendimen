<?php
// check_notifications_sw.php - Untuk Service Worker
session_start();
require_once 'config.php';
header('Content-Type: application/json');

$user_id = $_SESSION['user_id'] ?? 0;
$last_id = isset($_GET['last_id']) ? intval($_GET['last_id']) : 0;

if (!$user_id) {
    echo json_encode(['notifications' => []]);
    exit;
}

// Ambil notifikasi baru
$stmt = $conn->prepare("SELECT id, message, type, job_id FROM notifications 
                        WHERE user_id = ? AND id > ? AND is_read = 0 
                        ORDER BY id ASC LIMIT 10");
$stmt->bind_param("ii", $user_id, $last_id);
$stmt->execute();
$result = $stmt->get_result();

$notifications = [];
$max_id = $last_id;
while ($row = $result->fetch_assoc()) {
    $notifications[] = [
        'title' => getTitle($row['type']),
        'message' => $row['message'],
        'job_id' => $row['job_id'],
        'id' => $row['id']
    ];
    if ($row['id'] > $max_id) $max_id = $row['id'];
}

// Tandai sebagai sudah dibaca
if (!empty($notifications)) {
    $ids = array_column($notifications, 'id');
    $ids_str = implode(',', $ids);
    $conn->query("UPDATE notifications SET is_read = 1 WHERE id IN ($ids_str)");
}

echo json_encode([
    'notifications' => $notifications,
    'last_id' => $max_id
]);

function getTitle($type) {
    switch($type) {
        case 'payment': return '💰 Pembayaran';
        case 'pending_acc': return '⏰ Menunggu ACC';
        case 'reject': return '❌ Ditolak';
        default: return '🔔 Hendimen';
    }
}
?>