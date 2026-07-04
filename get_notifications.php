<?php
// get_notifications.php
require_once 'config.php';

header('Content-Type: application/json');

try {
    $user_id = intval($_GET['user_id'] ?? 0);
    if (!$user_id) throw new Exception('User ID tidak valid');

    $stmt = $conn->prepare("SELECT id, message, type, job_id, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $notifs = [];
    while ($row = $result->fetch_assoc()) {
        $notifs[] = [
            'id'         => $row['id'],
            'message'    => $row['message'],
            'type'       => $row['type'],
            'job_id'     => $row['job_id'],
            'is_read'    => (bool)$row['is_read'],
            'created_at' => $row['created_at'],
            'time_ago'   => timeAgo($row['created_at'])
        ];
    }

    echo json_encode(['success' => true, 'notifications' => $notifs]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}

function timeAgo($datetime) {
    $diff = time() - strtotime($datetime);
    if ($diff < 60) return 'Baru saja';
    if ($diff < 3600) return floor($diff/60) . ' menit lalu';
    if ($diff < 86400) return floor($diff/3600) . ' jam lalu';
    return floor($diff/86400) . ' hari lalu';
}
?>