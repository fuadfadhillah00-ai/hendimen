<?php
// get_wallet.php - UPDATE dengan tipe transaksi baru
require_once 'config.php';

header('Content-Type: application/json');

try {
    $user_id = intval($_GET['user_id'] ?? 0);
    $role = $_GET['role'] ?? 'requester';
    
    if (!$user_id) {
        throw new Exception('User ID tidak valid');
    }
    
    $user_stmt = $conn->prepare("SELECT wallet_requester, wallet_helper FROM users WHERE id = ?");
    $user_stmt->bind_param("i", $user_id);
    $user_stmt->execute();
    $user_data = $user_stmt->get_result()->fetch_assoc();
    
    if (!$user_data) {
        throw new Exception('User tidak ditemukan');
    }
    
    // ===== AMBIL TRANSAKSI BERDASARKAN ROLE =====
    $query = "
        SELECT id, amount, description, type, status, created_at, reference_id, reference_type, role
        FROM transactions 
        WHERE user_id = ? AND role = ?
        ORDER BY created_at DESC 
        LIMIT 50
    ";
    
    $trans_stmt = $conn->prepare($query);
    $trans_stmt->bind_param("is", $user_id, $role);
    $trans_stmt->execute();
    $result = $trans_stmt->get_result();
    
    $transactions = [];
    
    while ($row = $result->fetch_assoc()) {
        $amount = floatval($row['amount']);
        
        $status_display = 'Sukses';
        if ($row['status'] === 'pending') $status_display = 'Pending';
        else if ($row['status'] === 'failed') $status_display = 'Gagal';
        
        // ================================================================
        // HANDLE TIPE TRANSAKSI BARU
        // ================================================================
        $type_map = [
            'service_fee' => '🧾 Service Fee 5%',
            'admin_fee' => '📋 Admin Fee',
            'emergency_fee' => '🚨 Emergency Fee',
            'helper_fee' => '🔴 Potongan Helper 5%',
            'debit' => '💳 Pembayaran Deal',
            'payment' => '💰 Pembayaran Masuk',
            'tip' => '💝 Tip',
            'topup' => '💎 Top Up',
            'withdrawal' => '🏦 Penarikan',
            'fee' => '📋 Biaya Admin',
            'komisi' => '🧾 Komisi'
        ];
        
        $label = $type_map[$row['type']] ?? $row['type'];
        
        // Format amount dengan prefix +/- 
        if ($amount >= 0) {
            $prefix = '+';
            $amount_display = $amount;
        } else {
            $prefix = '-';
            $amount_display = abs($amount);
        }
        
        $transactions[] = [
            'id' => $row['id'],
            'amount' => $prefix . 'Rp ' . number_format($amount_display, 0, ',', '.'),
            'description' => $row['description'] ?? 'Transaksi',
            'type' => $row['type'] ?? 'unknown',
            'type_label' => $label,
            'status' => $status_display,
            'created_at' => $row['created_at'],
            'date' => date('Y-m-d', strtotime($row['created_at'])),
            'role' => $row['role'] ?? 'unknown'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'wallet_requester' => floatval($user_data['wallet_requester']),
        'wallet_helper' => floatval($user_data['wallet_helper']),
        'balance' => $role === 'requester' ? floatval($user_data['wallet_requester']) : floatval($user_data['wallet_helper']),
        'transactions' => $transactions,
        'role' => $role,
        'total_transactions' => count($transactions)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?>