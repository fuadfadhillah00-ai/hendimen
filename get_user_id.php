<?php
// get_user_id.php - Ambil user_id dari session
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

echo json_encode([
    'success' => true,
    'user_id' => (int)$_SESSION['user_id'],
    'name' => $_SESSION['user_name'] ?? ''
]);
?>