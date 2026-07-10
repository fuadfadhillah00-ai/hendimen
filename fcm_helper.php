<?php
// fcm_helper.php - FCM HELPER TANPA COMPOSER (PHP 8 COMPATIBLE)

/**
 * Dapatkan Access Token dari service-account.json
 * Method: JWT dengan RS256
 */
function getFCMAccessToken() {
    // ================================================================
    // 1. BACA SERVICE ACCOUNT
    // ================================================================
    $serviceAccountPath = __DIR__ . '/service-account.json';
    
    if (!file_exists($serviceAccountPath)) {
        error_log("❌ FCM: service-account.json tidak ditemukan di: " . $serviceAccountPath);
        return false;
    }
    
    $content = file_get_contents($serviceAccountPath);
    $serviceAccount = json_decode($content, true);
    
    if (!$serviceAccount || !isset($serviceAccount['client_email']) || !isset($serviceAccount['private_key'])) {
        error_log("❌ FCM: service-account.json tidak valid");
        return false;
    }
    
    $clientEmail = $serviceAccount['client_email'];
    $privateKey = $serviceAccount['private_key'];
    
    // ================================================================
    // 2. PERBAIKI PRIVATE KEY (PASTIKAN FORMAT BENAR)
    // ================================================================
    $privateKey = trim($privateKey);
    
    if (strpos($privateKey, '-----BEGIN PRIVATE KEY-----') === false) {
        $privateKey = "-----BEGIN PRIVATE KEY-----\n" . $privateKey;
    }
    
    if (strpos($privateKey, '-----END PRIVATE KEY-----') === false) {
        $privateKey = $privateKey . "\n-----END PRIVATE KEY-----";
    }
    
    if (substr($privateKey, -1) !== "\n") {
        $privateKey .= "\n";
    }
    
    // ================================================================
    // 3. BUAT JWT HEADER
    // ================================================================
    $header = [
        'alg' => 'RS256',
        'typ' => 'JWT'
    ];
    $headerJson = json_encode($header);
    $headerBase64 = base64UrlEncode($headerJson);
    
    // ================================================================
    // 4. BUAT JWT PAYLOAD (CLAIM)
    // ================================================================
    $now = time();
    $payload = [
        'iss' => $clientEmail,
        'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
        'aud' => 'https://oauth2.googleapis.com/token',
        'exp' => $now + 3600,
        'iat' => $now,
    ];
    $payloadJson = json_encode($payload);
    $payloadBase64 = base64UrlEncode($payloadJson);
    
    // ================================================================
    // 5. BUAT SIGNATURE INPUT
    // ================================================================
    $signatureInput = $headerBase64 . '.' . $payloadBase64;
    
    // ================================================================
    // 6. SIGN DENGAN PRIVATE KEY (PHP 8 COMPATIBLE - TANPA openssl_free_key)
    // ================================================================
    $key = openssl_pkey_get_private($privateKey);
    if ($key === false) {
        error_log("❌ FCM: Gagal membaca private key - " . openssl_error_string());
        return false;
    }
    
    $signature = '';
    if (!openssl_sign($signatureInput, $signature, $key, OPENSSL_ALGO_SHA256)) {
        error_log("❌ FCM: Gagal sign JWT - " . openssl_error_string());
        // 🔥 PHP 8: otomatis garbage collect, tidak perlu openssl_free_key
        return false;
    }
    
    // 🔥 PHP 8: otomatis garbage collect, tidak perlu openssl_free_key
    
    // ================================================================
    // 7. ENCODE SIGNATURE KE BASE64URL
    // ================================================================
    $signatureBase64 = base64UrlEncode($signature);
    
    // ================================================================
    // 8. GABUNGKAN JWT
    // ================================================================
    $jwt = $headerBase64 . '.' . $payloadBase64 . '.' . $signatureBase64;
    
    // ================================================================
    // 9. TUKAR JWT KE ACCESS TOKEN
    // ================================================================
    $postData = http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion' => $jwt,
    ]);
    
    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded',
        'User-Agent: Hendimen-FCM/2.0'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        error_log("❌ FCM: Gagal dapat access token - HTTP $httpCode");
        error_log("❌ FCM: Response - " . substr($response, 0, 500));
        if ($curlError) {
            error_log("❌ FCM: CURL Error - $curlError");
        }
        return false;
    }
    
    $data = json_decode($response, true);
    
    if (isset($data['access_token'])) {
        error_log("✅ FCM: Access token berhasil didapatkan");
        return $data['access_token'];
    }
    
    error_log("❌ FCM: Tidak ada access_token di response - " . $response);
    return false;
}

/**
 * Encode data ke Base64URL (RFC 4648)
 * Base64URL = Base64 dengan + diganti -, / diganti _, = dihapus
 */
function base64UrlEncode($data) {
    $base64 = base64_encode($data);
    $base64Url = str_replace(['+', '/', '='], ['-', '_', ''], $base64);
    return $base64Url;
}

/**
 * Kirim FCM ke satu device token
 */
function sendFCMToToken($deviceToken, $title, $body, $data = []) {
    $projectId = 'hendimen-fe7f3';
    $accessToken = getFCMAccessToken();
    
    if (!$accessToken) {
        error_log("❌ FCM: Tidak ada access token");
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
        'Content-Type: application/json',
        'User-Agent: Hendimen-FCM/2.0'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($httpCode === 200) {
        error_log("✅ FCM terkirim ke: " . substr($deviceToken, 0, 20) . "...");
        return ['success' => true, 'response' => json_decode($response, true)];
    } else {
        error_log("❌ FCM error ($httpCode): " . substr($response, 0, 200));
        if ($curlError) {
            error_log("❌ FCM CURL Error: $curlError");
        }
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
 * Kirim FCM ke semua requester
 */
function sendFCMToAllRequesters($title, $body, $data = []) {
    global $conn;
    
    $stmt = $conn->prepare("
        SELECT DISTINCT ft.token 
        FROM fcm_tokens ft
        JOIN users u ON ft.user_id = u.id
        WHERE u.role = 'requester'
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
 * Format data FCM
 */
function buildFCMData($type, $jobId, $extra = []) {
    return array_merge([
        'type' => $type,
        'job_id' => (string)$jobId,
        'timestamp' => date('Y-m-d H:i:s')
    ], $extra);
}
?>