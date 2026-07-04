<?php
// broadcast_notif.php - Kirim notifikasi ke SEMUA token FCM di database
// Jalankan di browser: https://hendimen.my.id/broadcast_notif.php

require_once 'config.php';

// ================================================================
// FUNGSI DAPATKAN ACCESS TOKEN DARI SERVICE ACCOUNT
// ================================================================

function getAccessToken() {
    $serviceAccountPath = __DIR__ . '/service-account.json';
    
    if (!file_exists($serviceAccountPath)) {
        die("❌ service-account.json TIDAK DITEMUKAN");
    }
    
    $serviceAccount = json_decode(file_get_contents($serviceAccountPath), true);
    
    if (!$serviceAccount || !isset($serviceAccount['client_email'])) {
        die("❌ service-account.json tidak valid");
    }
    
    // Buat JWT
    $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
    $now = time();
    $payload = json_encode([
        'iss' => $serviceAccount['client_email'],
        'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
        'aud' => 'https://oauth2.googleapis.com/token',
        'exp' => $now + 3600,
        'iat' => $now,
    ]);
    
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signatureInput = $base64Header . '.' . $base64Payload;
    
    $privateKey = $serviceAccount['private_key'];
    openssl_sign($signatureInput, $signature, $privateKey, 'SHA256');
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    $jwt = $signatureInput . '.' . $base64Signature;
    
    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion' => $jwt,
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        die("❌ Gagal dapat access token: HTTP $httpCode");
    }
    
    $data = json_decode($response, true);
    
    if (isset($data['access_token'])) {
        return $data['access_token'];
    }
    
    die("❌ Gagal dapat access token");
}

// ================================================================
// FUNGSI KIRIM FCM KE 1 TOKEN
// ================================================================

function sendFCM($deviceToken, $title, $body, $data = []) {
    $projectId = 'hendimen-fe7f3';
    $accessToken = getAccessToken();
    
    $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";
    
    $payload = [
        'message' => [
            'token' => $deviceToken,
            'notification' => [
                'title' => $title,
                'body' => $body,
            ],
            'data' => (object)$data,
            'android' => [
                'priority' => 'high',
                'notification' => [
                    'sound' => 'default',
                ]
            ]
        ]
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'success' => $httpCode === 200,
        'http_code' => $httpCode,
        'response' => json_decode($response, true)
    ];
}

// ================================================================
// 🔥 AMBIL SEMUA TOKEN FCM DARI DATABASE
// ================================================================

echo "🚀 Memulai broadcast notifikasi...<br><br>";

// Ambil semua token yang user_id-nya > 0 (sudah login)
$query = "SELECT id, user_id, token, created_at FROM fcm_tokens WHERE user_id > 0";
$result = $conn->query($query);

if ($result->num_rows === 0) {
    die("❌ Tidak ada token FCM di database!<br>Pastikan user sudah login.");
}

echo "✅ Ditemukan " . $result->num_rows . " token FCM<br><br>";

// ================================================================
// KIRIM NOTIFIKASI KE SEMUA TOKEN
// ================================================================

$title = "📢 Broadcast Notification";
$body = "Halo! Ini adalah notifikasi broadcast ke semua user Hendimen! 🎉";

$success_count = 0;
$fail_count = 0;
$results = [];

while ($row = $result->fetch_assoc()) {
    $token = $row['token'];
    $user_id = $row['user_id'];
    
    echo "📤 Mengirim ke User ID: {$user_id} - " . substr($token, 0, 30) . "... ";
    
    $data = [
        'type' => 'broadcast',
        'user_id' => (string)$user_id,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    $response = sendFCM($token, $title, $body, $data);
    
    if ($response['success']) {
        echo "✅ SUKSES<br>";
        $success_count++;
    } else {
        echo "❌ GAGAL (HTTP " . $response['http_code'] . ")<br>";
        $fail_count++;
    }
    
    // Delay 0.5 detik agar tidak overload
    usleep(500000);
}

// ================================================================
// HASIL AKHIR
// ================================================================

echo "<br><br>========================================<br>";
echo "📊 HASIL BROADCAST:<br>";
echo "✅ Sukses: {$success_count}<br>";
echo "❌ Gagal: {$fail_count}<br>";
echo "📱 Total: " . ($success_count + $fail_count) . "<br>";
echo "========================================<br>";

if ($success_count > 0) {
    echo "<br>🎉 Notifikasi broadcast berhasil dikirim ke {$success_count} user!";
} else {
    echo "<br>⚠️ Tidak ada notifikasi yang terkirim.";
}

$conn->close();
?>