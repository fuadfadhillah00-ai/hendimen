<?php
// save_subscription.php - Simpan subscription user ke database
require_once 'config.php';
header('Content-Type: application/json');
session_start();

$user_id = $_SESSION['user_id'] ?? 0;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$subscription = $input['subscription'] ?? null;

if (!$subscription || !isset($subscription['endpoint'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid subscription data']);
    exit;
}

$endpoint = $subscription['endpoint'];
$subscription_json = json_encode($subscription);

// Cek apakah sudah ada
$stmt = $conn->prepare("SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?");
$stmt->bind_param("is", $user_id, $endpoint);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    // Update
    $stmt = $conn->prepare("UPDATE push_subscriptions SET subscription = ?, updated_at = NOW() WHERE user_id = ? AND endpoint = ?");
    $stmt->bind_param("sis", $subscription_json, $user_id, $endpoint);
} else {
    // Insert
    $stmt = $conn->prepare("INSERT INTO push_subscriptions (user_id, endpoint, subscription, created_at) VALUES (?, ?, ?, NOW())");
    $stmt->bind_param("iss", $user_id, $endpoint, $subscription_json);
}

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Subscription saved']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
}
?>