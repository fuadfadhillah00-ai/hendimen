<?php
// get_google_config.php - Ambil konfigurasi Google Maps

require_once 'config.php';
session_start();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// 🔥 GANTI DENGAN API KEY ANDA
// Cara dapat API Key: AIzaSyCdAVl26_DjigDKPIhLIYoOOdaDPtJdHm0
$GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

echo json_encode([
    'success' => true,
    'api_key' => $GOOGLE_MAPS_API_KEY,
    'maps_url' => 'https://maps.googleapis.com/maps/api/js?key=' . $GOOGLE_MAPS_API_KEY . '&libraries=places'
]);
?>