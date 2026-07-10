<?php
// send_message.php - FULL: Kirim pesan chat termasuk lokasi

while (ob_get_level()) ob_end_clean();
error_reporting(0);
ini_set('display_errors', 0);

session_start();
require_once 'config.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');
header('Access-Control-Allow-Origin: *');

// ================================================================
// FUNGSI SEND RESPONSE
// ================================================================
function sendJsonResponse($data) {
    while (ob_get_level()) ob_end_clean();
    echo json_encode($data);
    exit;
}

// ================================================================
// VALIDASI USER
// ================================================================

if (!isset($_SESSION['user_id'])) {
    sendJsonResponse(['success' => false, 'message' => 'Unauthorized - Silakan login terlebih dahulu']);
}

$sender_id = intval($_SESSION['user_id']);

// Ambil data sender
$stmt = $conn->prepare("SELECT id, role, nama_lengkap FROM users WHERE id = ?");
$stmt->bind_param("i", $sender_id);
$stmt->execute();
$sender = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$sender) {
    sendJsonResponse(['success' => false, 'message' => 'User tidak ditemukan']);
}

// ================================================================
// AMBIL DATA DARI POST
// ================================================================

$job_id = isset($_POST['job_id']) ? intval($_POST['job_id']) : 0;
$receiver_id = isset($_POST['receiver_id']) ? intval($_POST['receiver_id']) : 0;
$message = isset($_POST['message']) ? trim($_POST['message']) : '';
$sender_role = isset($_POST['sender_role']) ? $_POST['sender_role'] : '';
$type = isset($_POST['type']) ? $_POST['type'] : 'text';

// 🔥 DATA LOKASI (jika ada)
$location_name = isset($_POST['location_name']) ? trim($_POST['location_name']) : '';
$location_address = isset($_POST['location_address']) ? trim($_POST['location_address']) : '';
$location_lat = isset($_POST['location_lat']) ? floatval($_POST['location_lat']) : null;
$location_lng = isset($_POST['location_lng']) ? floatval($_POST['location_lng']) : null;
$is_location = isset($_POST['is_location']) ? intval($_POST['is_location']) : 0;

// ================================================================
// 🔥🔥🔥 FORCE: PERBAIKI DATA LOKASI DI SISI SERVER
// ================================================================

if ($is_location == 1 || $type === 'location') {
    $type = 'location';
    
    // 🔥 1. PASTIKAN KOORDINAT VALID
    if ($location_lat === null || $location_lng === null || $location_lat == 0 || $location_lng == 0) {
        sendJsonResponse(['success' => false, 'message' => 'Data lokasi tidak valid (koordinat 0)']);
    }
    
    // 🔥 2. BUAT location_data (NAMA LOKASI)
    // Jika location_name kosong atau '0' atau 'Lokasi Saya' atau hanya koordinat, buat dari koordinat
    $clean_name = trim($location_name);
    if (empty($clean_name) || $clean_name === '0' || $clean_name === 'Lokasi Saya' || is_numeric($clean_name)) {
        // Cek apakah location_name berupa koordinat (ada koma)
        if (strpos($clean_name, ',') !== false) {
            // Ini koordinat, kita buat nama yang lebih baik
            $location_data = '📍 ' . $location_lat . ', ' . $location_lng;
        } else {
            $location_data = '📍 ' . $location_lat . ', ' . $location_lng;
        }
    } else {
        $location_data = $location_name;
    }
    
    // 🔥 3. BUAT location_address (ALAMAT LENGKAP)
    $clean_address = trim($location_address);
    if (empty($clean_address) || $clean_address === '0' || $clean_address === '') {
        // Buat dari koordinat
        $loc_address = $location_lat . ', ' . $location_lng;
    } else {
        $loc_address = $location_address;
    }
    
    // 🔥 4. BUAT MESSAGE (TAMPILAN DI CHAT)
    if (empty($message) || $message === '📍 ' . $location_name) {
        $message = '📍 ' . $location_data;
    }
    
    // 🔥 5. KOORDINAT
    $lat = $location_lat;
    $lng = $location_lng;
    
} else {
    // 🔥 PESAN TEKS: semua lokasi NULL
    $location_data = null;
    $lat = null;
    $lng = null;
    $loc_address = null;
}

// ================================================================
// VALIDASI BASIC
// ================================================================

if (!$job_id || !$receiver_id) {
    sendJsonResponse(['success' => false, 'message' => 'Data tidak lengkap: job_id atau receiver_id kosong']);
}

if (empty($message) && $type !== 'location') {
    sendJsonResponse(['success' => false, 'message' => 'Pesan tidak boleh kosong']);
}

// Jika pesan lokasi, pastikan ada data
if ($type === 'location' && (empty($location_data) || $lat === null || $lng === null)) {
    sendJsonResponse(['success' => false, 'message' => 'Data lokasi tidak lengkap']);
}

// ================================================================
// VALIDASI JOB
// ================================================================

$stmt = $conn->prepare("SELECT id, user_id, helper_id, title FROM jobs WHERE id = ?");
$stmt->bind_param("i", $job_id);
$stmt->execute();
$job = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$job) {
    sendJsonResponse(['success' => false, 'message' => 'Pekerjaan tidak ditemukan']);
}

// Cek apakah sender terlibat dalam job ini
$is_requester = ($job['user_id'] == $sender_id);
$is_helper = ($job['helper_id'] == $sender_id);

if (!$is_requester && !$is_helper) {
    sendJsonResponse(['success' => false, 'message' => 'Anda tidak terlibat dalam pekerjaan ini']);
}

// Tentukan role sender
if (empty($sender_role)) {
    $sender_role = $is_requester ? 'requester' : 'helper';
}

// ================================================================
// SIMPAN PESAN KE DATABASE
// ================================================================

$conn->begin_transaction();

try {
    // ================================================================
    // 🔥 BUAT VARIABLE BANTUAN UNTUK BIND_PARAM
    // ================================================================
    $is_read_value = 0;
    $location_data_value = $location_data;
    $lat_value = $lat;
    $lng_value = $lng;
    $loc_address_value = $loc_address;

    // ================================================================
    // 🔥 INSERT MESSAGE
    // ================================================================
    $stmt = $conn->prepare("
        INSERT INTO chat_messages (
            job_id, sender_id, receiver_id, message, type, is_read, 
            location_data, latitude, longitude, location_address, 
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    // 🔥 11 KOLOM = 11 PARAMETER
    $stmt->bind_param(
        "iiisssidds",
        $job_id,              // i
        $sender_id,           // i
        $receiver_id,         // i
        $message,             // s
        $type,                // s
        $is_read_value,       // i
        $location_data_value, // s
        $lat_value,           // d
        $lng_value,           // d
        $loc_address_value    // s
    );
    $stmt->execute();
    $message_id = $stmt->insert_id;
    $stmt->close();

    // ================================================================
    // UPDATE CONVERSATION
    // ================================================================
    $stmt = $conn->prepare("
        INSERT INTO chat_conversations (job_id, helper_id, requester_id, last_message, last_message_time) 
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
            last_message = VALUES(last_message),
            last_message_time = VALUES(last_message_time)
    ");
    
    $helper_id = $job['helper_id'] ?: 0;
    $requester_id = $job['user_id'];
    
    $stmt->bind_param("iiis", $job_id, $helper_id, $requester_id, $message);
    $stmt->execute();
    $stmt->close();

    // ================================================================
    // UPDATE UNREAD COUNT
    // ================================================================
    $is_receiver_requester = ($receiver_id == $job['user_id']);
    
    if ($is_receiver_requester) {
        $update = $conn->prepare("
            UPDATE chat_conversations 
            SET requester_unread_count = requester_unread_count + 1 
            WHERE job_id = ?
        ");
    } else {
        $update = $conn->prepare("
            UPDATE chat_conversations 
            SET helper_unread_count = helper_unread_count + 1 
            WHERE job_id = ?
        ");
    }
    $update->bind_param("i", $job_id);
    $update->execute();
    $update->close();

    // ================================================================
    // 🔥 FCM PUSH NOTIFICATION
    // ================================================================
    require_once 'fcm_helper.php';

    $sender_name = $sender['nama_lengkap'] ?? 'Pengguna';

    if ($type === 'location') {
        $fcm_title = "📍 Lokasi dari " . $sender_name;
        $fcm_body = $location_data ?: "Mengirimkan lokasi";
    } else {
        $fcm_title = "💬 Pesan dari " . $sender_name;
        $fcm_body = substr($message, 0, 100) . (strlen($message) > 100 ? '...' : '');
    }

    $fcm_data = buildFCMData('chat_message', $job_id, [
        'sender_id' => (string)$sender_id,
        'sender_name' => $sender_name,
        'message' => $message,
        'job_title' => $job['title'],
        'type' => $type,
        'location_name' => $location_data,
        'location_address' => $loc_address,
        'latitude' => (string)$lat,
        'longitude' => (string)$lng
    ]);

    sendFCMToUser($receiver_id, $fcm_title, $fcm_body, $fcm_data);

    // ================================================================
    // COMMIT
    // ================================================================
    $conn->commit();

    // ================================================================
    // RESPONSE
    // ================================================================
    $responseData = [
        'id' => $message_id,
        'sender_id' => $sender_id,
        'sender_role' => $sender_role,
        'receiver_id' => $receiver_id,
        'message' => $message,
        'type' => $type,
        'created_at' => date('Y-m-d H:i:s'),
        'location_name' => $location_data,
        'location_address' => $loc_address,
        'latitude' => $lat,
        'longitude' => $lng
    ];

    sendJsonResponse([
        'success' => true,
        'message' => 'Pesan terkirim',
        'data' => $responseData
    ]);

} catch (Exception $e) {
    $conn->rollback();
    error_log("send_message.php Exception: " . $e->getMessage());
    sendJsonResponse([
        'success' => false,
        'message' => 'Gagal menyimpan pesan: ' . $e->getMessage()
    ]);
} catch (Error $e) {
    $conn->rollback();
    error_log("send_message.php Error: " . $e->getMessage());
    sendJsonResponse([
        'success' => false,
        'message' => 'Terjadi kesalahan server: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?>