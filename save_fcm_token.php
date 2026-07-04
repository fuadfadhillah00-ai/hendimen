<?php
// save_fcm_token.php - UPDATE: Auto-detect user_id
require_once 'config.php';
session_start();

header('Content-Type: application/json');

$fcm_token = isset($_POST['fcm_token']) ? trim($_POST['fcm_token']) : '';
$user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;

if (empty($fcm_token)) {
    echo json_encode(['success' => false, 'message' => 'Token kosong']);
    exit;
}

// 🔥 JIKA USER_ID = 0, COBA AMBIL DARI SESSION
if ($user_id == 0 && isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
    error_log("🔍 User ID dari session: " . $user_id);
}

// 🔥 JIKA USER_ID = 0, COBA AMBIL DARI DATABASE (berdasarkan email)
if ($user_id == 0) {
    // Coba cari user yang sedang login via session
    if (isset($_SESSION['user_email'])) {
        $find_user = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $find_user->bind_param("s", $_SESSION['user_email']);
        $find_user->execute();
        $result = $find_user->get_result();
        if ($row = $result->fetch_assoc()) {
            $user_id = $row['id'];
            error_log("🔍 User ID dari email: " . $user_id);
        }
        $find_user->close();
    }
}

// Cek apakah token sudah ada
$check = $conn->prepare("SELECT id FROM fcm_tokens WHERE token = ?");
$check->bind_param("s", $fcm_token);
$check->execute();
$result = $check->get_result();

if ($result->num_rows === 0) {
    // Simpan dengan user_id
    $stmt = $conn->prepare("INSERT INTO fcm_tokens (user_id, token, device_type, created_at) VALUES (?, ?, 'android', NOW())");
    $stmt->bind_param("is", $user_id, $fcm_token);
    
    if ($stmt->execute()) {
        error_log("✅ FCM Token tersimpan untuk user_id: " . $user_id);
        echo json_encode(['success' => true, 'message' => 'Token saved']);
    } else {
        echo json_encode(['success' => false, 'message' => $stmt->error]);
    }
    $stmt->close();
} else {
    // Update user_id
    $row = $result->fetch_assoc();
    $update = $conn->prepare("UPDATE fcm_tokens SET user_id = ?, updated_at = NOW() WHERE id = ?");
    $update->bind_param("ii", $user_id, $row['id']);
    $update->execute();
    $update->close();
    error_log("✅ FCM Token diupdate ke user_id: " . $user_id);
    echo json_encode(['success' => true, 'message' => 'Token updated']);
}

$check->close();
$conn->close();
?>