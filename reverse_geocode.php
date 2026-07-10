<?php
// reverse_geocode.php - Konversi lat/lng ke alamat (pakai Google Geocoding API)

require_once 'config.php';
session_start();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$latitude = isset($_GET['lat']) ? floatval($_GET['lat']) : 0;
$longitude = isset($_GET['lng']) ? floatval($_GET['lng']) : 0;

if (!$latitude || !$longitude) {
    echo json_encode(['success' => false, 'message' => 'Koordinat tidak valid']);
    exit;
}

// 🔥 GANTI DENGAN API KEY ANDA
$API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

$url = "https://maps.googleapis.com/maps/api/geocode/json?latlng={$latitude},{$longitude}&key={$API_KEY}&language=id";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo json_encode(['success' => false, 'message' => 'Gagal menghubungi Google API']);
    exit;
}

$data = json_decode($response, true);

if ($data['status'] !== 'OK') {
    echo json_encode(['success' => false, 'message' => 'Gagal reverse geocode: ' . $data['status']]);
    exit;
}

// Ambil alamat terbaik
$address = '';
$place_name = '';
$full_address = '';

if (isset($data['results'][0])) {
    $result = $data['results'][0];
    $full_address = $result['formatted_address'] ?? '';
    
    // Cari nama tempat (establishment)
    foreach ($result['address_components'] ?? [] as $component) {
        if (in_array('establishment', $component['types'] ?? [])) {
            $place_name = $component['long_name'];
            break;
        }
    }
    
    // Jika tidak ada establishment, pakai alamat lengkap
    if (empty($place_name)) {
        $place_name = $full_address;
    }
    
    $address = $full_address;
}

echo json_encode([
    'success' => true,
    'address' => $address,
    'place_name' => $place_name,
    'full_address' => $full_address,
    'latitude' => $latitude,
    'longitude' => $longitude
]);
?>