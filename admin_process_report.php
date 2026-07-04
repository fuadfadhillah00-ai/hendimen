<?php
// admin_process_report.php - Hanya untuk admin
require_once 'config.php';
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    die(json_encode(['success' => false, 'message' => 'Akses ditolak']));
}

$report_id = isset($_POST['report_id']) ? intval($_POST['report_id']) : 0;
$action = isset($_POST['action']) ? $_POST['action'] : '';
$admin_note = isset($_POST['admin_note']) ? trim($_POST['admin_note']) : '';

if (!$report_id || !$action) {
    die(json_encode(['success' => false, 'message' => 'Data tidak lengkap']));
}

try {
    $stmt = $conn->prepare("SELECT reporter_id, job_id, message FROM job_reports WHERE id = ? AND status = 'open'");
    $stmt->bind_param("i", $report_id);
    $stmt->execute();
    $report = $stmt->get_result()->fetch_assoc();
    
    if (!$report) {
        throw new Exception('Laporan tidak ditemukan');
    }
    
    $new_status = ($action === 'resolve') ? 'resolved' : 'rejected';
    
    $stmt = $conn->prepare("UPDATE job_reports SET status = ?, admin_note = ?, resolved_at = NOW() WHERE id = ?");
    $stmt->bind_param("ssi", $new_status, $admin_note, $report_id);
    $stmt->execute();
    
    $status_text = ($action === 'resolve') ? 'selesai diproses' : 'ditolak';
    $notif_msg = "📋 Laporan Anda untuk pekerjaan #" . $report['job_id'] . " telah " . $status_text . ".\n";
    if (!empty($admin_note)) {
        $notif_msg .= "Catatan admin: " . $admin_note;
    }
    
    $notif = $conn->prepare("INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) VALUES (?, ?, 'info', ?, 0, NOW())");
    $notif->bind_param("isi", $report['reporter_id'], $notif_msg, $report['job_id']);
    $notif->execute();
    
    echo json_encode(['success' => true, 'message' => 'Laporan diproses']);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>