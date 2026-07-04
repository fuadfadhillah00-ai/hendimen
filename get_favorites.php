<?php
// get_favorites.php
require_once 'config.php';

header('Content-Type: application/json');

try {
    $user_id = intval($_GET['user_id'] ?? 0);

    if (!$user_id) {
        throw new Exception('User ID tidak ditemukan');
    }

    $query = "SELECT job_id FROM favorites WHERE user_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $favorite_ids = [];
    while ($row = $result->fetch_assoc()) {
        $favorite_ids[] = $row['job_id'];
    }

    echo json_encode([
        'success' => true,
        'favorite_ids' => $favorite_ids
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'favorite_ids' => []
    ]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>