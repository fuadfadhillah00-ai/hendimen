<?php
// admin_get_dashboard_stats.php - PERBAIKAN STATISTIK PENDAPATAN
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Cek role admin
$check_role = $conn->prepare("SELECT role FROM users WHERE id = ?");
$check_role->bind_param("i", $_SESSION['user_id']);
$check_role->execute();
$user_role = $check_role->get_result()->fetch_assoc();

if (!$user_role || $user_role['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Admin only']);
    exit;
}

try {
    $stats = [];
    
    // ================================================================
    // 1. TOTAL USER
    // ================================================================
    $result = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    $stats['total_users'] = (int)$result->fetch_assoc()['count'];
    
    // ================================================================
    // 2. TOTAL PEKERJAAN
    // ================================================================
    $result = $conn->query("SELECT COUNT(*) as count FROM jobs");
    $stats['total_jobs'] = (int)$result->fetch_assoc()['count'];
    
    // ================================================================
    // 3. PEKERJAAN SELESAI
    // ================================================================
    $result = $conn->query("SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'");
    $stats['pekerjaan_selesai'] = (int)$result->fetch_assoc()['count'];
    
    // ================================================================
    // 4. PEKERJAAN AKTIF
    // ================================================================
    $result = $conn->query("
        SELECT COUNT(*) as count 
        FROM jobs 
        WHERE status IN ('in-progress', 'paid', 'pending_acc', 'perbaikan')
    ");
    $stats['pekerjaan_aktif'] = (int)$result->fetch_assoc()['count'];
    
    // ================================================================
    // 5. PEKERJAAN TERBUKA
    // ================================================================
    $result = $conn->query("SELECT COUNT(*) as count FROM jobs WHERE status = 'open'");
    $stats['pekerjaan_terbuka'] = (int)$result->fetch_assoc()['count'];
    
    // ================================================================
    // 6. PEKERJAAN OFFERED
    // ================================================================
    $result = $conn->query("SELECT COUNT(*) as count FROM jobs WHERE status = 'offered'");
    $stats['pekerjaan_offered'] = (int)$result->fetch_assoc()['count'];
    
    // ================================================================
    // 7. TOTAL TAWARAN
    // ================================================================
    $result = $conn->query("SELECT COUNT(*) as count FROM offers WHERE status = 'pending'");
    $stats['total_offers'] = (int)$result->fetch_assoc()['count'];
    
    // ================================================================
    // 8. TOTAL TAWARAN DIPILIH
    // ================================================================
    $result = $conn->query("SELECT COUNT(*) as count FROM offers WHERE status = 'accepted'");
    $stats['offers_accepted'] = (int)$result->fetch_assoc()['count'];
    
    // ================================================================
    // 🔥 9. PENDAPATAN BIAYA ADMIN (dari transaksi)
    // ================================================================
    // Admin Fee dari transaksi (semua yang type = 'fee' atau 'admin_fee')
    $result = $conn->query("
        SELECT SUM(ABS(amount)) as total 
        FROM transactions 
        WHERE type IN ('fee', 'admin_fee') AND status = 'success'
    ");
    $row = $result->fetch_assoc();
    $stats['pendapatan_biaya_admin'] = floatval($row['total'] ?? 0);
    
    // ================================================================
    // 🔥 10. PENDAPATAN KOMISI (service_fee + helper_fee + komisi)
    // ================================================================
    $result = $conn->query("
        SELECT SUM(ABS(amount)) as total 
        FROM transactions 
        WHERE type IN ('service_fee', 'helper_fee', 'komisi') AND status = 'success'
    ");
    $row = $result->fetch_assoc();
    $stats['pendapatan_komisi'] = floatval($row['total'] ?? 0);
    
    // ================================================================
    // 🔥 11. TOTAL PENDAPATAN
    // ================================================================
    $stats['total_pendapatan'] = $stats['pendapatan_biaya_admin'] + $stats['pendapatan_komisi'];
    
    // ================================================================
    // 🔥 12. TOTAL PENDAPATAN DARI SEMUA TRANSAKSI (opsional)
    // ================================================================
    $result = $conn->query("
        SELECT SUM(ABS(amount)) as total 
        FROM transactions 
        WHERE status = 'success'
    ");
    $row = $result->fetch_assoc();
    $stats['total_transaksi_success'] = floatval($row['total'] ?? 0);
    
    // ================================================================
    // LOGGING UNTUK DEBUG
    // ================================================================
    error_log("=== DASHBOARD STATS (FIXED) ===");
    error_log("total_users: " . $stats['total_users']);
    error_log("total_jobs: " . $stats['total_jobs']);
    error_log("pekerjaan_selesai: " . $stats['pekerjaan_selesai']);
    error_log("pekerjaan_aktif: " . $stats['pekerjaan_aktif']);
    error_log("pendapatan_biaya_admin: " . $stats['pendapatan_biaya_admin']);
    error_log("pendapatan_komisi: " . $stats['pendapatan_komisi']);
    error_log("total_pendapatan: " . $stats['total_pendapatan']);
    
    echo json_encode([
        'success' => true, 
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    error_log("Error in admin_get_dashboard_stats: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?>