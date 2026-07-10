<?php
// google_maps_proxy.php - Proxy untuk Google Maps API (CORS bypass)

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// API Key Anda
$API_KEY = 'AIzaSyCdAVl26_DjigDKPIhLIYoOOdaDPtJdHm0';

// Ambil parameter
$action = isset($_GET['action']) ? $_GET['action'] : '';
$query = isset($_GET['query']) ? trim($_GET['query']) : '';
$place_id = isset($_GET['place_id']) ? trim($_GET['place_id']) : '';
$lat = isset($_GET['lat']) ? floatval($_GET['lat']) : null;
$lng = isset($_GET['lng']) ? floatval($_GET['lng']) : null;
$input = isset($_GET['input']) ? trim($_GET['input']) : '';

// ================================================================
// 🔍 ACTION: AUTOCOMPLETE
// ================================================================
if ($action === 'autocomplete' && !empty($input)) {
    $url = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
    $url .= "?input=" . urlencode($input);
    $url .= "&types=geocode|establishment";
    $url .= "&key=" . $API_KEY;
    $url .= "&language=id";
    
    $response = file_get_contents($url);
    echo $response;
    exit;
}

// ================================================================
// 📍 ACTION: PLACE DETAILS
// ================================================================
if ($action === 'details' && !empty($place_id)) {
    $url = "https://maps.googleapis.com/maps/api/place/details/json";
    $url .= "?place_id=" . urlencode($place_id);
    $url .= "&key=" . $API_KEY;
    $url .= "&language=id";
    
    $response = file_get_contents($url);
    echo $response;
    exit;
}

// ================================================================
// 📍 ACTION: GEOCODE (reverse)
// ================================================================
if ($action === 'geocode' && $lat !== null && $lng !== null) {
    $url = "https://maps.googleapis.com/maps/api/geocode/json";
    $url .= "?latlng=" . urlencode($lat . ',' . $lng);
    $url .= "&key=" . $API_KEY;
    $url .= "&language=id";
    
    $response = file_get_contents($url);
    echo $response;
    exit;
}

// ================================================================
// 🗺️ ACTION: STATIC MAP
// ================================================================
if ($action === 'staticmap' && $lat !== null && $lng !== null) {
    $zoom = isset($_GET['zoom']) ? intval($_GET['zoom']) : 15;
    $width = isset($_GET['width']) ? intval($_GET['width']) : 400;
    $height = isset($_GET['height']) ? intval($_GET['height']) : 200;
    
    $url = "https://maps.googleapis.com/maps/api/staticmap";
    $url .= "?center=" . urlencode($lat . ',' . $lng);
    $url .= "&zoom=" . $zoom;
    $url .= "&size=" . $width . 'x' . $height;
    $url .= "&markers=color:red%7C" . urlencode($lat . ',' . $lng);
    $url .= "&key=" . $API_KEY;
    
    // Redirect ke static map (bisa langsung ditampilkan sebagai img)
    header('Location: ' . $url);
    exit;
}

// ================================================================
// ❌ DEFAULT - ERROR
// ================================================================
http_response_code(400);
echo json_encode([
    'status' => 'ERROR',
    'message' => 'Parameter tidak lengkap atau action tidak dikenal'
]);
?>