<?php
// send_notification.php - Kirim push notification dengan FCM API V1

function getAccessToken() {
    // Path ke file service account JSON yang sudah di-download
    $credentialsFile = __DIR__ . '/hendimen-fcm-credentials.json';
    
    if (!file_exists($credentialsFile)) {
        die("File credentials tidak ditemukan!");
    }
    
    $credentials = json_decode(file_get_contents($credentialsFile), true);
    
    // Buat JWT
    $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $claims = json_encode([
        'iss' => $credentials['client_email'],
        'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
        'aud' => 'https://oauth2.googleapis.com/token',
        'exp' => time() + 3600,
        'iat' => time()
    ]);
    $payload = base64_encode($claims);
    
    // Sign dengan private key
    $privateKey = openssl_pkey_get_private($credentials['private_key']);
    openssl_sign($header . '.' . $payload, $signature, $privateKey, OPENSSL_ALGO_SHA256);
    $signature = base64_encode($signature);
    
    $jwt = $header . '.' . $payload . '.' . $signature;
    
    // Dapatkan access token
    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion' => $jwt
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($response, true);
    return $data['access_token'] ?? null;
}

function sendFCMNotification($token, $title, $body, $projectId) {
    $accessToken = getAccessToken();
    
    if (!$accessToken) {
        return ['success' => false, 'message' => 'Gagal mendapatkan access token'];
    }
    
    $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";
    
    $data = [
        'message' => [
            'token' => $token,
            'notification' => [
                'title' => $title,
                'body' => $body
            ],
            'android' => [
                'notification' => [
                    'channel_id' => 'hendimen_channel'
                ]
            ]
        ]
    ];
    
    $headers = [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json'
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'success' => $httpCode === 200,
        'http_code' => $httpCode,
        'response' => json_decode($response, true)
    ];
}

// === CONTOH PENGGUNAAN ===
$token = 'eJ...'; // Ganti dengan FCM Token dari Android
$projectId = 'hendimen-xxxxx'; // Ganti dengan Project ID
$result = sendFCMNotification($token, 'Test Hendimen', 'Halo dari PHP!', $projectId);

print_r($result);
?>