<?php
// test_fcm_simple.php - Test FCM dengan debug detail

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<pre>";
echo "🚀 TESTING FCM SIMPLE\n";
echo "========================\n\n";

// ================================================================
// 1. CEK FILE SERVICE ACCOUNT
// ================================================================
echo "📁 1. CHECK SERVICE ACCOUNT FILE\n";
$file = __DIR__ . '/service-account.json';

if (!file_exists($file)) {
    die("❌ FILE TIDAK DITEMUKAN: $file\n");
}
echo "✅ File ditemukan\n";

$content = file_get_contents($file);
$data = json_decode($content, true);

if (!$data) {
    die("❌ FILE BUKAN JSON VALID\n");
}
echo "✅ JSON valid\n";
echo "   project_id: " . ($data['project_id'] ?? 'TIDAK ADA') . "\n";
echo "   client_email: " . ($data['client_email'] ?? 'TIDAK ADA') . "\n\n";

// ================================================================
// 2. CEK ACCESS TOKEN
// ================================================================
echo "🔑 2. GET ACCESS TOKEN\n";

$header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
$now = time();
$payload = json_encode([
    'iss' => $data['client_email'],
    'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
    'aud' => 'https://oauth2.googleapis.com/token',
    'exp' => $now + 3600,
    'iat' => $now,
]);

$base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
$base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
$signatureInput = $base64Header . '.' . $base64Payload;

$privateKey = $data['private_key'];
if (!openssl_sign($signatureInput, $signature, $privateKey, 'SHA256')) {
    die("❌ GAGAL SIGN JWT\n");
}
echo "✅ JWT signed\n";

$base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
$jwt = $signatureInput . '.' . $base64Signature;

// ================================================================
// 3. TUKAR JWT KE ACCESS TOKEN
// ================================================================
echo "📤 3. EXCHANGE JWT TO ACCESS TOKEN\n";

$ch = curl_init('https://oauth2.googleapis.com/token');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    'assertion' => $jwt,
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "   HTTP Code: " . $httpCode . "\n";

if ($httpCode !== 200) {
    echo "❌ GAGAL: " . $response . "\n";
    if ($curlError) echo "   CURL Error: " . $curlError . "\n";
    die("❌ STOP - ACCESS TOKEN GAGAL\n");
}

$tokenData = json_decode($response, true);
if (!isset($tokenData['access_token'])) {
    die("❌ TIDAK ADA ACCESS_TOKEN DI RESPONSE\n");
}

echo "✅ Access token berhasil: " . substr($tokenData['access_token'], 0, 30) . "...\n\n";

// ================================================================
// 4. CEK TOKEN FCM DI DATABASE
// ================================================================
echo "📱 4. CHECK FCM TOKENS IN DATABASE\n";

require_once 'config.php';
$result = $conn->query("SELECT id, user_id, token FROM fcm_tokens WHERE user_id > 0 LIMIT 1");

if ($result->num_rows === 0) {
    die("❌ TIDAK ADA TOKEN FCM DI DATABASE\n");
}

$row = $result->fetch_assoc();
echo "✅ Token ditemukan\n";
echo "   User ID: " . $row['user_id'] . "\n";
echo "   Token: " . substr($row['token'], 0, 30) . "...\n\n";

// ================================================================
// 5. KIRIM TEST NOTIFIKASI
// ================================================================
echo "📤 5. SEND TEST NOTIFICATION\n";

$projectId = 'hendimen-fe7f3';
$url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

$payload = [
    'message' => [
        'token' => $row['token'],
        'notification' => [
            'title' => '🔧 Test FCM',
            'body' => 'Jika Anda melihat ini, FCM berhasil!'
        ],
        'android' => [
            'priority' => 'high'
        ]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $tokenData['access_token'],
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "   HTTP Code: " . $httpCode . "\n";

if ($httpCode === 200) {
    echo "✅✅✅ NOTIFIKASI BERHASIL TERKIRIM!\n";
    echo "   Response: " . substr($response, 0, 200) . "\n";
} else {
    echo "❌ GAGAL!\n";
    echo "   Response: " . $response . "\n";
    if ($curlError) echo "   CURL Error: " . $curlError . "\n";
    
    // Parse error
    $errorData = json_decode($response, true);
    if ($errorData && isset($errorData['error'])) {
        echo "\n   📋 ERROR DETAIL:\n";
        echo "   Message: " . ($errorData['error']['message'] ?? 'Tidak ada') . "\n";
        echo "   Status: " . ($errorData['error']['status'] ?? 'Tidak ada') . "\n";
        echo "   Code: " . ($errorData['error']['code'] ?? 'Tidak ada') . "\n";
    }
}

echo "\n========================\n";
echo "✅ TEST SELESAI\n";
echo "</pre>";
?>