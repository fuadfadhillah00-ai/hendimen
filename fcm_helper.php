<?php
// fcm_helper.php - Helper untuk FCM Push Notification
// Gunakan dari file PHP mana pun dengan include_once 'fcm_helper.php';

/**
 * Dapatkan Access Token dari service-account.json
 */
function getFCMAccessToken() {
    $serviceAccountPath = __DIR__ . '/service-account.json';
    
    if (!file_exists($serviceAccountPath)) {
        error_log("❌ service-account.json tidak ditemukan");
        return false;
    }
    
    $serviceAccount = json_decode(file_get_contents($serviceAccountPath), true);
    
    if (!$serviceAccount || !isset($serviceAccount['client_email']) || !isset($serviceAccount['private_key'])) {
        error_log("❌ service-account.json tidak valid");
        return false;
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
    
    // Tukar JWT dengan Access Token
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
        error_log("❌ Gagal dapat access token: HTTP $httpCode");
        return false;
    }
    
    $data = json_decode($response, true);
    
    if (isset($data['access_token'])) {
        error_log("✅ Access token FCM berhasil didapatkan");
        return $data['access_token'];
    }
    
    error_log("❌ Gagal dapat access token: " . $response);
    return false;
}

/**
 * Kirim FCM ke satu device token
 */
function sendFCMToToken($deviceToken, $title, $body, $data = []) {
    $projectId = 'hendimen-fe7f3';
    $accessToken = getFCMAccessToken();
    
    if (!$accessToken) {
        return ['success' => false, 'message' => 'Access token failed'];
    }
    
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
    
    if ($httpCode === 200) {
        error_log("✅ FCM terkirim ke: " . substr($deviceToken, 0, 20) . "...");
        return ['success' => true, 'response' => json_decode($response, true)];
    } else {
        error_log("❌ FCM error ($httpCode): " . substr($response, 0, 200));
        return ['success' => false, 'message' => $response];
    }
}

/**
 * Kirim FCM ke semua token milik user tertentu
 */
function sendFCMToUser($userId, $title, $body, $data = []) {
    global $conn;
    
    $stmt = $conn->prepare("SELECT token FROM fcm_tokens WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $success_count = 0;
    $fail_count = 0;
    
    while ($row = $result->fetch_assoc()) {
        $res = sendFCMToToken($row['token'], $title, $body, $data);
        if ($res['success']) {
            $success_count++;
        } else {
            $fail_count++;
        }
    }
    $stmt->close();
    
    error_log("📤 FCM ke user #{$userId}: {$success_count} sukses, {$fail_count} gagal");
    return ['success' => $success_count, 'fail' => $fail_count];
}

/**
 * Kirim FCM ke semua helper (role = 'user')
 */
function sendFCMToAllHelpers($title, $body, $data = []) {
    global $conn;
    
    $stmt = $conn->prepare("
        SELECT DISTINCT ft.token 
        FROM fcm_tokens ft
        JOIN users u ON ft.user_id = u.id
        WHERE u.role = 'user'
    ");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $success_count = 0;
    $fail_count = 0;
    
    while ($row = $result->fetch_assoc()) {
        $res = sendFCMToToken($row['token'], $title, $body, $data);
        if ($res['success']) {
            $success_count++;
        } else {
            $fail_count++;
        }
    }
    $stmt->close();
    
    error_log("📤 FCM broadcast ke semua helper: {$success_count} sukses, {$fail_count} gagal");
    return ['success' => $success_count, 'fail' => $fail_count];
}

/**
 * Kirim FCM ke semua requester (role = 'requester' / user yang pernah membuat job)
 */
function sendFCMToAllRequesters($title, $body, $data = []) {
    global $conn;
    
    $stmt = $conn->prepare("
        SELECT DISTINCT ft.token 
        FROM fcm_tokens ft
        JOIN users u ON ft.user_id = u.id
        WHERE u.role IN ('requester', 'user')
        AND EXISTS (SELECT 1 FROM jobs j WHERE j.user_id = u.id)
    ");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $success_count = 0;
    $fail_count = 0;
    
    while ($row = $result->fetch_assoc()) {
        $res = sendFCMToToken($row['token'], $title, $body, $data);
        if ($res['success']) {
            $success_count++;
        } else {
            $fail_count++;
        }
    }
    $stmt->close();
    
    error_log("📤 FCM broadcast ke semua requester: {$success_count} sukses, {$fail_count} gagal");
    return ['success' => $success_count, 'fail' => $fail_count];
}

/**
 * Kirim FCM ke user berdasarkan role
 * @param string $role 'helper' atau 'requester'
 */
function sendFCMByRole($role, $title, $body, $data = []) {
    if ($role === 'helper') {
        return sendFCMToAllHelpers($title, $body, $data);
    } elseif ($role === 'requester') {
        return sendFCMToAllRequesters($title, $body, $data);
    }
    return ['success' => 0, 'fail' => 0];
}

/**
 * Format data FCM untuk notifikasi
 */
function buildFCMData($type, $jobId, $extra = []) {
    return array_merge([
        'type' => $type,
        'job_id' => (string)$jobId,
        'timestamp' => date('Y-m-d H:i:s')
    ], $extra);
}
?>