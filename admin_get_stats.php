<?php
// admin_get_stats.php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$stats = [
    'pending' => 0,
    'approved' => 0,
    'rejected' => 0,
    'total_nominal' => 0
];

$result = $conn->query("SELECT status, SUM(nominal) as total_nominal FROM topup_requests GROUP BY status");

while ($row = $result->fetch_assoc()) {
    if ($row['status'] === 'pending') $stats['pending'] = $row['total_nominal'] ? 1 : 0;
    if ($row['status'] === 'approved') {
        $stats['approved'] = $row['total_nominal'] ? 1 : 0;
        $stats['total_nominal'] = $row['total_nominal'] ?? 0;
    }
    if ($row['status'] === 'rejected') $stats['rejected'] = $row['total_nominal'] ? 1 : 0;
}

// Hitung jumlah request, bukan nominal
$count_pending = $conn->query("SELECT COUNT(*) as count FROM topup_requests WHERE status = 'pending'")->fetch_assoc();
$count_approved = $conn->query("SELECT COUNT(*) as count FROM topup_requests WHERE status = 'approved'")->fetch_assoc();
$count_rejected = $conn->query("SELECT COUNT(*) as count FROM topup_requests WHERE status = 'rejected'")->fetch_assoc();

$stats['pending'] = $count_pending['count'];
$stats['approved'] = $count_approved['count'];
$stats['rejected'] = $count_rejected['count'];

echo json_encode(['success' => true, 'stats' => $stats]);
?>