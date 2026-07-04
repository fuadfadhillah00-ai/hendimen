<?php
// admin_get_chart_data.php - PERBAIKAN GRAFIK
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$check_role = $conn->prepare("SELECT role FROM users WHERE id = ?");
$check_role->bind_param("i", $_SESSION['user_id']);
$check_role->execute();
$user_role = $check_role->get_result()->fetch_assoc();

if (!$user_role || $user_role['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Admin only']);
    exit;
}

try {
    $days = 30;
    $labels = [];
    $user_data = [];
    $transaction_data = [];
    $revenue_data = [];
    $offer_data = [];
    
    for ($i = $days - 1; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $labels[] = date('d/m', strtotime($date));
        
        // 1. Total User (cumulative)
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user' AND DATE(created_at) <= ?");
        $stmt->bind_param("s", $date);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $user_data[] = (int)($row['count'] ?? 0);
        $stmt->close();
        
        // 2. Pekerjaan Selesai (cumulative)
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'completed' AND DATE(created_at) <= ?");
        $stmt->bind_param("s", $date);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $transaction_data[] = (int)($row['count'] ?? 0);
        $stmt->close();
        
        // 3. Total Tawaran per hari
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM offers WHERE DATE(created_at) = ?");
        $stmt->bind_param("s", $date);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $offer_data[] = (int)($row['count'] ?? 0);
        $stmt->close();
        
        // 4. 🔥 Total Pendapatan per hari (dari transaksi)
        $stmt = $conn->prepare("
            SELECT 
                COALESCE(SUM(ABS(amount)), 0) as total 
            FROM transactions 
            WHERE status = 'success' 
            AND DATE(created_at) = ?
        ");
        $stmt->bind_param("s", $date);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $revenue_data[] = (float)($row['total'] ?? 0);
        $stmt->close();
    }
    
    echo json_encode([
        'success' => true,
        'labels' => $labels,
        'users' => $user_data,
        'transactions' => $transaction_data,
        'revenue' => $revenue_data,
        'offers' => $offer_data
    ]);
    
} catch (Exception $e) {
    error_log("Error in admin_get_chart_data: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>