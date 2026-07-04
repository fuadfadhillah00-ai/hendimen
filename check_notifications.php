<?php
// check_notifications.php - PERBAIKAN: Hanya ambil notifikasi baru
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Cek login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];
$last_id = isset($_GET['last_id']) ? intval($_GET['last_id']) : 0;

try {
    // 🔥 Hanya ambil notifikasi dengan ID > last_id
    $stmt = $conn->prepare("
        SELECT id, message, type, job_id, is_read, created_at 
        FROM notifications 
        WHERE user_id = ? AND id > ? 
        ORDER BY id ASC
    ");
    $stmt->bind_param("ii", $user_id, $last_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $notifications = [];
    while ($row = $result->fetch_assoc()) {
        $notifications[] = [
            'id' => intval($row['id']),
            'message' => $row['message'],
            'type' => $row['type'],
            'job_id' => intval($row['job_id']),
            'is_read' => (bool)$row['is_read'],
            'created_at' => $row['created_at']
        ];
    }
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'notifications' => $notifications,
        'last_id' => $last_id,
        'total' => count($notifications)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?>