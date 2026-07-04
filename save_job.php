<?php
// save_job.php - UPDATE dengan budget range + FCM Push Notification (cURL version)
// TANPA COMPOSER! Hanya perlu service-account.json

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt');

require_once 'config.php';
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

function customErrorHandler($errno, $errstr, $errfile, $errline) {
    echo json_encode([
        'success' => false,
        'message' => "PHP Error: $errstr in $errfile line $errline"
    ]);
    exit;
}
set_error_handler('customErrorHandler');

// ================================================================
// 🔥 FUNGSI DAPATKAN ACCESS TOKEN dari service-account.json
// ================================================================

function getAccessToken() {
    $serviceAccountPath = __DIR__ . '/service-account.json';
    
    if (!file_exists($serviceAccountPath)) {
        error_log("❌ service-account.json tidak ditemukan di: " . $serviceAccountPath);
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
    
    // Sign dengan private key
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
        error_log("❌ Gagal dapat access token: HTTP $httpCode - $response");
        return false;
    }
    
    $data = json_decode($response, true);
    
    if (isset($data['access_token'])) {
        error_log("✅ Access token berhasil didapatkan");
        return $data['access_token'];
    }
    
    error_log("❌ Gagal dapat access token: " . $response);
    return false;
}

// ================================================================
// 🔥 FUNGSI KIRIM FCM PAKAI CURL (Tanpa Library)
// ================================================================

function sendFCM($deviceToken, $title, $body, $data = []) {
    // Ambil access token
    $accessToken = getAccessToken();
    
    if (!$accessToken) {
        error_log("❌ Gagal mendapatkan access token untuk FCM");
        return ['success' => false, 'message' => 'Access token failed'];
    }
    
    $projectId = 'hendimen-fe7f3'; // 🔥 GANTI DENGAN PROJECT ID ANDA!
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

// ================================================================
// 🔥 FUNGSI BROADCAST KE SEMUA HELPER
// ================================================================

function broadcastToHelpers($conn, $title, $body, $data = []) {
    // Ambil semua token FCM dari helper (role = 'user')
    $token_query = $conn->prepare("
        SELECT DISTINCT ft.token 
        FROM fcm_tokens ft
        JOIN users u ON ft.user_id = u.id
        WHERE u.role = 'user'
    ");
    
    if (!$token_query) {
        error_log("❌ Gagal prepare query token: " . $conn->error);
        return ['success' => 0, 'fail' => 0];
    }
    
    $token_query->execute();
    $tokens = $token_query->get_result();
    
    $success_count = 0;
    $fail_count = 0;
    
    while ($row = $tokens->fetch_assoc()) {
        $result = sendFCM($row['token'], $title, $body, $data);
        if ($result['success']) {
            $success_count++;
        } else {
            $fail_count++;
        }
    }
    
    error_log("📤 FCM broadcast: {$success_count} sukses, {$fail_count} gagal");
    return ['success' => $success_count, 'fail' => $fail_count];
}

// ================================================================
// MULAI PROSES SAVE JOB
// ================================================================

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method tidak diizinkan. Gunakan POST.');
    }

    $user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
    $title = isset($_POST['title']) ? trim($_POST['title']) : '';
    $category = isset($_POST['category']) ? trim($_POST['category']) : '';
    $description = isset($_POST['description']) ? trim($_POST['description']) : '';
    $location = isset($_POST['location']) ? trim($_POST['location']) : '';
    
    // ================================================================
    // BUDGET RANGE
    // ================================================================
    $budget_min = isset($_POST['budget_min']) ? floatval($_POST['budget_min']) : 0;
    $budget_max = isset($_POST['budget_max']) ? floatval($_POST['budget_max']) : 0;
    $estimated_price = isset($_POST['price']) ? floatval($_POST['price']) : 0;
    
    // Emergency
    $emergency = 0;
    if (isset($_POST['emergency'])) {
        $emergency_val = $_POST['emergency'];
        if ($emergency_val === '1' || $emergency_val === 1 || $emergency_val === 'on' || $emergency_val === true) {
            $emergency = 1;
        }
    }
    
    $latitude = null;
    $longitude = null;
    if (isset($_POST['latitude']) && $_POST['latitude'] !== '') {
        $latitude = floatval($_POST['latitude']);
    }
    if (isset($_POST['longitude']) && $_POST['longitude'] !== '') {
        $longitude = floatval($_POST['longitude']);
    }

    // ========== VALIDASI ==========
    if ($user_id <= 0) throw new Exception("User ID tidak valid");
    if (empty($title)) throw new Exception("Judul harus diisi");
    if (empty($category)) throw new Exception("Kategori harus dipilih");
    if (empty($description)) throw new Exception("Deskripsi harus diisi");
    if (empty($location)) throw new Exception("Lokasi harus diisi");
    if ($budget_min < 10000) throw new Exception("Budget minimum minimal Rp 10.000");
    if ($budget_max < $budget_min) throw new Exception("Budget maksimum harus lebih besar dari minimum");
    if ($estimated_price < 10000) throw new Exception("Minimal estimasi budget Rp 10.000");

    // ===== CEK USER =====
    $check_user = $conn->prepare("SELECT id, wallet_requester, wallet_helper, nama_lengkap FROM users WHERE id = ?");
    if (!$check_user) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }
    $check_user->bind_param("i", $user_id);
    if (!$check_user->execute()) {
        throw new Exception('Execute failed: ' . $check_user->error);
    }
    $result = $check_user->get_result();
    $user_data = $result->fetch_assoc();
    $check_user->close();
    
    if (!$user_data) {
        throw new Exception('User tidak ditemukan');
    }

    // ========== UPLOAD GAMBAR ==========
    $image_path = null;
    if (isset($_FILES['job_image']) && $_FILES['job_image']['error'] === UPLOAD_ERR_OK) {
        $target_dir = "uploads/jobs/";
        if (!file_exists($target_dir)) {
            if (!mkdir($target_dir, 0777, true)) {
                throw new Exception('Gagal membuat direktori uploads/jobs/');
            }
        }
        
        $file_extension = strtolower(pathinfo($_FILES['job_image']['name'], PATHINFO_EXTENSION));
        $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        if (!in_array($file_extension, $allowed_extensions)) {
            throw new Exception('File gambar harus berupa JPG, JPEG, PNG, GIF, atau WEBP');
        }
        
        if ($_FILES['job_image']['size'] > 5 * 1024 * 1024) {
            throw new Exception('Ukuran gambar maksimal 5MB');
        }
        
        $new_filename = time() . '_' . uniqid() . '.' . $file_extension;
        $target_file = $target_dir . $new_filename;
        
        if (!move_uploaded_file($_FILES['job_image']['tmp_name'], $target_file)) {
            throw new Exception('Gagal upload gambar');
        }
        
        $image_path = $target_file;
        error_log("image uploaded: $image_path");
    }

    // ========== MULAI TRANSACTION ==========
    $conn->begin_transaction();

    // ================================================================
    // INSERT JOB
    // ================================================================
    
    $has_image = ($image_path !== null && $image_path !== '');
    
    if ($has_image) {
        $insert = $conn->prepare("
            INSERT INTO jobs (
                user_id, title, category, description, location, 
                latitude, longitude, price, budget_min, budget_max,
                emergency, status, image_path, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, NOW())
        ");
        
        if (!$insert) {
            throw new Exception('Prepare insert failed: ' . $conn->error);
        }
        
        $insert->bind_param(
            "issssdddddisss", 
            $user_id, $title, $category, $description, $location, 
            $latitude, $longitude, $estimated_price, $budget_min, $budget_max,
            $emergency, $image_path
        );
        
        if (!$insert->execute()) {
            throw new Exception('Gagal menyimpan pekerjaan: ' . $insert->error);
        }
        
        $job_id = $insert->insert_id;
        $insert->close();
    } else {
        $insert = $conn->prepare("
            INSERT INTO jobs (
                user_id, title, category, description, location, 
                latitude, longitude, price, budget_min, budget_max,
                emergency, status, image_path, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', NULL, NOW())
        ");
        
        if (!$insert) {
            throw new Exception('Prepare insert failed: ' . $conn->error);
        }
        
        $insert->bind_param(
            "issssdddddi", 
            $user_id, $title, $category, $description, $location, 
            $latitude, $longitude, $estimated_price, $budget_min, $budget_max,
            $emergency
        );
        
        if (!$insert->execute()) {
            throw new Exception('Gagal menyimpan pekerjaan: ' . $insert->error);
        }
        
        $job_id = $insert->insert_id;
        $insert->close();
    }
    
    error_log("job inserted, id: $job_id, budget_min: $budget_min, budget_max: $budget_max");

    // ================================================================
    // NOTIFIKASI KE DATABASE (SEMUA HELPER)
    // ================================================================
    $getHelpers = $conn->prepare("SELECT id FROM users WHERE role = 'user'");
    if ($getHelpers) {
        $getHelpers->execute();
        $helpers = $getHelpers->get_result();
        
        $notif_stmt = $conn->prepare("
            INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) 
            VALUES (?, ?, 'new_job', ?, 0, NOW())
        ");
        
        if ($notif_stmt) {
            $emergency_text = $emergency == 1 ? " [🚨 EMERGENCY]" : "";
            $notif_message = "📢 Pekerjaan baru{$emergency_text}: " . $title . " - Budget: Rp " . number_format($budget_min, 0, ',', '.') . " - Rp " . number_format($budget_max, 0, ',', '.');
            
            while ($helper = $helpers->fetch_assoc()) {
                $notif_stmt->bind_param("isi", $helper['id'], $notif_message, $job_id);
                $notif_stmt->execute();
            }
            $notif_stmt->close();
        }
        $getHelpers->close();
    }

    // ================================================================
    // NOTIFIKASI KE REQUESTER
    // ================================================================
    $notif_requester = $conn->prepare("
        INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) 
        VALUES (?, ?, 'info', ?, 0, NOW())
    ");
    if ($notif_requester) {
        $req_notif_msg = "✅ Pekerjaan \"{$title}\" berhasil diposting!\n\n" .
                         "💰 Budget: Rp " . number_format($budget_min, 0, ',', '.') . " - Rp " . number_format($budget_max, 0, ',', '.') . "\n" .
                         "📌 Status: Menunggu tawaran dari Helper\n" .
                         "⏰ Masa pemilihan tawaran: 24 jam";
        $notif_requester->bind_param("isi", $user_id, $req_notif_msg, $job_id);
        $notif_requester->execute();
        $notif_requester->close();
    }

    $conn->commit();

// ================================================================
// 🔥 FCM PUSH NOTIFICATION - PAKAI fcm_helper.php
// ================================================================

if ($job_id) {
    require_once 'fcm_helper.php';
    
    $fcm_title = "📢 Pekerjaan Baru";
    $fcm_body = $title . " - Budget: Rp " . number_format($budget_max, 0, ',', '.');
    $fcm_data = buildFCMData('new_job', $job_id, [
        'title' => $title,
        'budget_min' => (string)$budget_min,
        'budget_max' => (string)$budget_max,
        'emergency' => (string)$emergency
    ]);
    
    // Kirim ke semua helper
    $result = sendFCMToAllHelpers($fcm_title, $fcm_body, $fcm_data);
    error_log("📤 FCM broadcast untuk job #{$job_id}: {$result['success']} sukses, {$result['fail']} gagal");
}

    // ================================================================
    // KIRIM NOTIFIKASI KE WHATSAPP (Opsional)
    // ================================================================
    function sendToWhatsAppBot($job_id, $title, $price, $category, $location, $emergency = false, $requester_name = 'Requester') {
        $BOT_URL = 'http://localhost:3000/send-notification';
        $SECRET_KEY = 'HENDIMEN_SECRET_KEY_12345';
        
        $data = [
            'job_id' => $job_id,
            'title' => $title,
            'price' => $price,
            'category' => $category,
            'location' => $location,
            'emergency' => $emergency,
            'requester_name' => $requester_name,
            'secret' => $SECRET_KEY
        ];
        
        $ch = curl_init($BOT_URL);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($httpCode === 200) {
            error_log("✅ WhatsApp notifikasi terkirim untuk job #{$job_id}");
            return ['success' => true, 'response' => json_decode($response, true)];
        } else {
            error_log("❌ WhatsApp notifikasi gagal: " . ($error ?: $response));
            return ['success' => false, 'error' => $error ?: $response];
        }
    }

    if ($job_id) {
        sendToWhatsAppBot(
            $job_id,
            $title,
            $budget_max,
            $category,
            $location,
            $emergency,
            $user_data['nama_lengkap'] ?? 'Requester'
        );
    }

    // ========== RESPONSE ==========
    echo json_encode([
        'success' => true,
        'message' => 'Pekerjaan berhasil diposting! Menunggu tawaran dari Helper.',
        'job_id' => $job_id,
        'emergency' => $emergency,
        'image_path' => $image_path,
        'budget_min' => $budget_min,
        'budget_max' => $budget_max,
        'estimated_price' => $estimated_price,
        'status' => 'open'
    ]);

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    error_log("save_job.php Exception: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} catch (Error $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    error_log("save_job.php Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
    restore_error_handler();
}
?>