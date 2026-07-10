<?php
// test_broadcast.php - TEST FCM BROADCAST (TANPA TELEGRAM)
require_once 'config.php';
require_once 'fcm_helper.php';  // 🔥 PAKAI FCM HELPER

header('Content-Type: application/json');

echo "🚀 Testing FCM Broadcast...\n\n";

// ================================================================
// AMBIL SEMUA TOKEN FCM DARI DATABASE
// ================================================================

$query = "SELECT id, user_id, token, created_at FROM fcm_tokens WHERE user_id > 0";
$result = $conn->query($query);

if ($result->num_rows === 0) {
    die("❌ Tidak ada token FCM di database!\n");
}

echo "✅ Ditemukan " . $result->num_rows . " token FCM\n\n";

// ================================================================
// KIRIM NOTIFIKASI TEST
// ================================================================

$title = "📢 Test Broadcast Notification";
$body = "Halo! Ini adalah notifikasi test dari Hendimen. 🎉";

$success_count = 0;
$fail_count = 0;

while ($row = $result->fetch_assoc()) {
    $token = $row['token'];
    $user_id = $row['user_id'];
    
    echo "📤 Mengirim ke User ID: {$user_id}... ";
    
    $data = [
        'type' => 'test_broadcast',
        'user_id' => (string)$user_id,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    $response = sendFCMToToken($token, $title, $body, $data);
    
    if ($response['success']) {
        echo "✅ SUKSES\n";
        $success_count++;
    } else {
        echo "❌ GAGAL\n";
        $fail_count++;
    }
    
    // Delay 0.5 detik
    usleep(500000);
}

// ================================================================
// HASIL
// ================================================================

echo "\n========================================\n";
echo "📊 HASIL BROADCAST:\n";
echo "✅ Sukses: {$success_count}\n";
echo "❌ Gagal: {$fail_count}\n";
echo "📱 Total: " . ($success_count + $fail_count) . "\n";
echo "========================================\n";

if ($success_count > 0) {
    echo "\n🎉 Notifikasi broadcast berhasil dikirim ke {$success_count} user!";
} else {
    echo "\n⚠️ Tidak ada notifikasi yang terkirim.";
}

$conn->close();
?>