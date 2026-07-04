<?php
// topup_confirm.php
require_once 'config.php';
session_start();

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method tidak diizinkan');
    }

    $request_id = intval($_POST['request_id'] ?? 0);
    $action = $_POST['action'] ?? '';

    if (!$request_id) {
        throw new Exception('Request ID tidak valid');
    }

    if ($action === 'confirm_payment') {
        // Update status atau catat bahwa user sudah konfirmasi
        // Status tetap 'pending' sampai admin approve
        
        // Cek apakah request ada
        $check = $conn->prepare("SELECT id, status FROM topup_requests WHERE id = ?");
        $check->bind_param("i", $request_id);
        $check->execute();
        $request = $check->get_result()->fetch_assoc();
        
        if (!$request) {
            throw new Exception('Request tidak ditemukan');
        }
        
        if ($request['status'] !== 'pending') {
            throw new Exception('Request sudah diproses');
        }
        
        // Optional: Simpan waktu konfirmasi user
        $update = $conn->prepare("UPDATE topup_requests SET status = 'pending' WHERE id = ?");
        $update->bind_param("i", $request_id);
        $update->execute();
        
        echo json_encode([
            'success' => true,
            'message' => 'Pembayaran dikonfirmasi. Menunggu verifikasi admin.'
        ]);
        
    } else {
        throw new Exception('Aksi tidak dikenal');
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?>