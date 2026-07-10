<?php
// get_jobs.php - UPDATE dengan foto profil requester & helper

error_reporting(0);
ini_set('display_errors', 0);

// ================================================================
// KONEKSI DATABASE LANGSUNG
// ================================================================
$host = 'localhost';
$username = 'u352984455_hendimen';
$password = 'Gusto_Kita13';
$database = 'u352984455_hendimen';

$conn = new mysqli($host, $username, $password, $database);
$conn->set_charset("utf8");

if ($conn->connect_error) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error,
        'jobs' => []
    ]);
    exit;
}

header('Content-Type: application/json');

// ================================================================
// FUNGSI STATUS
// ================================================================
function getStatusDisplay($status) {
    $map = [
        'open' => '📢 Terbuka',
        'offered' => '📩 Ada Tawaran',
        'selected' => '🎯 Menunggu Bayar',
        'paid' => '💳 Dibayar',
        'in-progress' => '🔄 Sedang Dikerjakan',
        'ongoing' => '🔄 Sedang Dikerjakan',
        'pending_acc' => '⏳ Menunggu ACC',
        'perbaikan' => '🔧 Perlu Perbaikan',
        'completed' => '✅ Selesai',
        'cancelled' => '❌ Dibatalkan'
    ];
    return $map[$status] ?? $status;
}

// ================================================================
// AMBIL PARAMETER
// ================================================================
$type = isset($_GET['type']) ? $_GET['type'] : 'all';
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

// ================================================================
// BANGUN QUERY - DENGAN PROFILE_IMAGE
// ================================================================
$query = "SELECT 
    j.id,
    j.user_id,
    j.helper_id,
    j.title,
    j.category,
    j.description,
    j.location,
    j.price,
    j.status,
    j.emergency,
    j.image_path,
    j.completion_image,
    j.reject_reason,
    j.created_at,
    j.budget_min,
    j.budget_max,
    u.nama_lengkap as requester_name,
    u.profile_image as requester_profile_image,
    h.nama_lengkap as helper_name,
    h.profile_image as helper_profile_image,
    DATE_FORMAT(j.created_at, '%d/%m/%Y') as date_formatted
FROM jobs j
LEFT JOIN users u ON j.user_id = u.id
LEFT JOIN users h ON j.helper_id = h.id
WHERE 1=1";

// ================================================================
// TAMBAHKAN FILTER
// ================================================================
if ($type === 'requester' && $user_id > 0) {
    $query .= " AND j.user_id = " . intval($user_id);
} elseif ($type === 'helper' && $user_id > 0) {
    $query .= " AND j.helper_id = " . intval($user_id);
} elseif ($type === 'open') {
    $query .= " AND j.status IN ('open', 'offered')";
} elseif ($type === 'pending') {
    $query .= " AND j.status = 'pending_acc'";
} elseif ($type === 'offered') {
    $query .= " AND j.status = 'offered'";
} elseif ($type === 'selected') {
    $query .= " AND j.status = 'selected'";
} elseif ($type === 'paid') {
    $query .= " AND j.status = 'paid'";
}

$query .= " ORDER BY j.created_at DESC";

// ================================================================
// EKSEKUSI QUERY
// ================================================================
$result = $conn->query($query);

$jobs = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Hitung jumlah tawaran
        $offer_count = 0;
        $lowest_offer = null;
        
        if ($row['status'] === 'offered' || $row['status'] === 'open') {
            $offer_query = "SELECT COUNT(*) as cnt, MIN(offered_price) as min_price FROM offers WHERE job_id = " . intval($row['id']) . " AND status = 'pending'";
            $offer_result = $conn->query($offer_query);
            if ($offer_result && $offer_result->num_rows > 0) {
                $offer_data = $offer_result->fetch_assoc();
                $offer_count = intval($offer_data['cnt'] ?? 0);
                $lowest_offer = $offer_data['min_price'] ? floatval($offer_data['min_price']) : null;
            }
        }
        
        $jobs[] = [
            'id' => intval($row['id']),
            'user_id' => intval($row['user_id']),
            'helper_id' => $row['helper_id'] ? intval($row['helper_id']) : null,
            'title' => $row['title'] ?? '',
            'category' => $row['category'] ?? '',
            'description' => $row['description'] ?? '',
            'location' => $row['location'] ?? '',
            'price' => floatval($row['price'] ?? 0),
            'budget_min' => floatval($row['budget_min'] ?? 0),
            'budget_max' => floatval($row['budget_max'] ?? 0),
            'status' => $row['status'] ?? 'open',
            'status_display' => getStatusDisplay($row['status'] ?? 'open'),
            'emergency' => intval($row['emergency'] ?? 0) === 1,
            'offer_count' => $offer_count,
            'lowest_offer' => $lowest_offer,
            'formatted_lowest_offer' => $lowest_offer ? 'Rp ' . number_format($lowest_offer, 0, ',', '.') : null,
            'date' => $row['date_formatted'] ?? date('d/m/Y'),
            'created_at' => $row['created_at'] ?? date('Y-m-d H:i:s'),
            'requester_name' => $row['requester_name'] ?? 'Anonymous',
            'requester_profile_image' => $row['requester_profile_image'] ?? null,
            'helper_name' => $row['helper_name'] ?? null,
            'helper_profile_image' => $row['helper_profile_image'] ?? null,
            'image_path' => $row['image_path'] ?? null,
            'completion_image' => $row['completion_image'] ?? null,
            'reject_reason' => $row['reject_reason'] ?? null,
            'can_offer' => ($row['status'] ?? '') === 'open' || ($row['status'] ?? '') === 'offered',
            'can_select' => ($row['status'] ?? '') === 'offered' && $offer_count > 0
        ];
    }
}

echo json_encode([
    'success' => true,
    'jobs' => $jobs,
    'total' => count($jobs)
], JSON_NUMERIC_CHECK);

$conn->close();
?>