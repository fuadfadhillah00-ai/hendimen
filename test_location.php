<?php
// test_location.php - TEST SIMPAN LOKASI KE DATABASE

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';
session_start();

header('Content-Type: application/json');

// ================================================================
// 1. CEK KONEKSI DATABASE
// ================================================================
echo "✅ 1. Koneksi database: OK\n\n";

// ================================================================
// 2. CEK STRUKTUR TABEL
// ================================================================
echo "📋 2. CEK STRUKTUR TABEL chat_messages:\n";
$columns = [];
$colCheck = $conn->query("SHOW COLUMNS FROM chat_messages");
if ($colCheck) {
    while ($col = $colCheck->fetch_assoc()) {
        $columns[] = $col['Field'];
        echo "   - " . $col['Field'] . " (" . $col['Type'] . ")\n";
    }
}
echo "\n";

// ================================================================
// 3. CEK APAKAH KOLOM YANG DIBUTUHKAN ADA
// ================================================================
$required = ['type', 'location_data', 'latitude', 'longitude', 'location_address'];
$missing = [];
foreach ($required as $col) {
    if (!in_array($col, $columns)) {
        $missing[] = $col;
    }
}

if (!empty($missing)) {
    echo "❌ KOLOM YANG HILANG:\n";
    foreach ($missing as $col) {
        echo "   - $col\n";
    }
    echo "\n🔧 JALANKAN QUERY INI:\n";
    foreach ($missing as $col) {
        if ($col === 'type') {
            echo "ALTER TABLE chat_messages ADD COLUMN `type` VARCHAR(50) DEFAULT 'text';\n";
        } elseif ($col === 'location_data') {
            echo "ALTER TABLE chat_messages ADD COLUMN `location_data` TEXT NULL;\n";
        } elseif ($col === 'latitude') {
            echo "ALTER TABLE chat_messages ADD COLUMN `latitude` DECIMAL(10,8) NULL;\n";
        } elseif ($col === 'longitude') {
            echo "ALTER TABLE chat_messages ADD COLUMN `longitude` DECIMAL(11,8) NULL;\n";
        } elseif ($col === 'location_address') {
            echo "ALTER TABLE chat_messages ADD COLUMN `location_address` VARCHAR(255) NULL;\n";
        }
    }
    exit;
}

echo "✅ 3. Semua kolom yang dibutuhkan ADA\n\n";

// ================================================================
// 4. CEK SESSION
// ================================================================
if (!isset($_SESSION['user_id'])) {
    echo "❌ 4. Session: TIDAK ADA (login dulu)\n";
    exit;
}
$sender_id = $_SESSION['user_id'];
echo "✅ 4. Session user_id: $sender_id\n\n";

// ================================================================
// 5. AMBIL DATA POST
// ================================================================
$job_id = isset($_POST['job_id']) ? intval($_POST['job_id']) : 0;
$receiver_id = isset($_POST['receiver_id']) ? intval($_POST['receiver_id']) : 0;
$latitude = isset($_POST['latitude']) ? floatval($_POST['latitude']) : 0;
$longitude = isset($_POST['longitude']) ? floatval($_POST['longitude']) : 0;
$address = isset($_POST['address']) ? trim($_POST['address']) : '';
$place_name = isset($_POST['place_name']) ? trim($_POST['place_name']) : '';

echo "📤 5. DATA YANG DITERIMA:\n";
echo "   job_id: $job_id\n";
echo "   receiver_id: $receiver_id\n";
echo "   latitude: $latitude\n";
echo "   longitude: $longitude\n";
echo "   address: $address\n";
echo "   place_name: $place_name\n\n";

// ================================================================
// 6. VALIDASI DATA
// ================================================================
if (!$job_id || !$receiver_id || !$latitude || !$longitude) {
    echo "❌ 6. Validasi GAGAL: Data tidak lengkap\n";
    exit;
}
echo "✅ 6. Validasi: OK\n\n";

// ================================================================
// 7. CEK JOB
// ================================================================
$stmt = $conn->prepare("SELECT id, user_id, helper_id FROM jobs WHERE id = ?");
$stmt->bind_param("i", $job_id);
$stmt->execute();
$job = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$job) {
    echo "❌ 7. Job TIDAK DITEMUKAN\n";
    exit;
}
echo "✅ 7. Job ditemukan: user_id={$job['user_id']}, helper_id={$job['helper_id']}\n\n";

// ================================================================
// 8. 🔥🔥🔥 COBA INSERT SEDERHANA
// ================================================================
echo "📝 8. MENCoba INSERT...\n";

$display_name = !empty($place_name) ? $place_name : ($address ?: "Lokasi");
$message_text = "📍 " . $display_name;

$location_json = json_encode([
    'latitude' => $latitude,
    'longitude' => $longitude,
    'address' => $address,
    'place_name' => $place_name,
    'map_url' => "https://www.google.com/maps?q={$latitude},{$longitude}"
]);

// 🔥 INSERT DENGAN SEMUA KOLOM
$sql = "INSERT INTO chat_messages 
        (job_id, sender_id, receiver_id, message, type, location_data, latitude, longitude, location_address, is_read, created_at) 
        VALUES (?, ?, ?, ?, 'location', ?, ?, ?, ?, 0, NOW())";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo "❌ Prepare GAGAL: " . $conn->error . "\n";
    exit;
}

$stmt->bind_param(
    "iiisssdds", 
    $job_id, 
    $sender_id, 
    $receiver_id, 
    $message_text,
    $location_json,
    $latitude, 
    $longitude,
    $address
);

if ($stmt->execute()) {
    $message_id = $stmt->insert_id;
    echo "✅ INSERT BERHASIL! ID: $message_id\n\n";
    
    // Tampilkan data yang tersimpan
    $check = $conn->query("SELECT id, message, type, latitude, longitude, location_data FROM chat_messages WHERE id = $message_id");
    $row = $check->fetch_assoc();
    echo "📋 DATA TERSIMPAN:\n";
    print_r($row);
    
} else {
    echo "❌ INSERT GAGAL: " . $stmt->error . "\n";
}

$stmt->close();
echo "\n========================\n";
echo "✅ TEST SELESAI\n";
?>