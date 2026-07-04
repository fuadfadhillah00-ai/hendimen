<?php
// mark_notification_read.php
require_once 'config.php';

header('Content-Type: application/json');

$notif_id = intval($_POST['notif_id'] ?? 0);
$user_id  = intval($_POST['user_id'] ?? 0);

if ($notif_id && $user_id) {
    $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $notif_id, $user_id);
    $stmt->execute();
}
echo json_encode(['success' => true]);
$conn->close();
?>