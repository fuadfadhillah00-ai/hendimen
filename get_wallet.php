<?php
// get_wallet.php - FIX: Status resi dari transactions, bukan withdraw_requests

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
    
    // ===== AMBIL TRANSAKSI =====
    $query = "
        SELECT id, amount, description, type, status, created_at, 
               reference_id, reference_type, role
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
        
        if ($amount >= 0) {
            $prefix = '+';
            $amount_display = $amount;
        } else {
            $prefix = '-';
            $amount_display = abs($amount);
        }
        
        // ================================================================
        // 🔥 AMBIL DATA RESI
        // ================================================================
        $receipt_data = null;
        
        // 🔥 CEK: Jika tipe = withdrawal, CARI DI TABEL withdraw_requests
        if ($row['type'] === 'withdrawal') {
            
            $withdraw_id = $row['reference_id'] ?? 0;
            
            if ($withdraw_id == 0) {
                // Cari withdraw terbaru user dengan created_at yang sama
                $wd_stmt = $conn->prepare("
                    SELECT id, nominal, admin_fee, bank, account_number, account_name, 
                           status, admin_note, created_at, processed_at 
                    FROM withdraw_requests 
                    WHERE user_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT 1
                ");
                $wd_stmt->bind_param("i", $user_id);
                $wd_stmt->execute();
                $wd_result = $wd_stmt->get_result();
                $withdraw = $wd_result->fetch_assoc();
                $wd_stmt->close();
            } else {
                $wd_stmt = $conn->prepare("
                    SELECT id, nominal, admin_fee, bank, account_number, account_name, 
                           status, admin_note, created_at, processed_at 
                    FROM withdraw_requests 
                    WHERE id = ?
                ");
                $wd_stmt->bind_param("i", $withdraw_id);
                $wd_stmt->execute();
                $wd_result = $wd_stmt->get_result();
                $withdraw = $wd_result->fetch_assoc();
                $wd_stmt->close();
            }
            
            if ($withdraw) {
                $net_amount = $withdraw['nominal'] - $withdraw['admin_fee'];
                $receipt_data = [
                    'type' => 'withdraw',
                    'withdraw_id' => $withdraw['id'],
                    'nominal' => floatval($withdraw['nominal']),
                    'admin_fee' => floatval($withdraw['admin_fee']),
                    'net_amount' => $net_amount,
                    'formatted_nominal' => 'Rp ' . number_format($withdraw['nominal'], 0, ',', '.'),
                    'formatted_admin_fee' => 'Rp ' . number_format($withdraw['admin_fee'], 0, ',', '.'),
                    'formatted_net' => 'Rp ' . number_format($net_amount, 0, ',', '.'),
                    'bank' => $withdraw['bank'] ?? '-',
                    'account_number' => $withdraw['account_number'] ?? '-',
                    'account_name' => $withdraw['account_name'] ?? '-',
                    // 🔥🔥🔥 PERBAIKAN: Status RESI diambil dari TRANSACTION, bukan withdraw_requests
                    'status' => $row['status'], // ← PAKAI STATUS DARI TRANSACTIONS
                    'admin_note' => $withdraw['admin_note'] ?? '',
                    'created_at' => $withdraw['created_at'] ?? $row['created_at'],
                    'processed_at' => $withdraw['processed_at'] ?? null
                ];
            }
        }
        
        // 🔥 Jika tipe = job atau ada reference_type = job
        else if ($row['reference_type'] === 'job' || $row['type'] === 'debit' || $row['type'] === 'payment') {
            $job_id = $row['reference_id'] ?? 0;
            
            if ($job_id > 0) {
                $job_stmt = $conn->prepare("SELECT id, title, price, status, created_at FROM jobs WHERE id = ?");
                $job_stmt->bind_param("i", $job_id);
                $job_stmt->execute();
                $job_result = $job_stmt->get_result();
                $job = $job_result->fetch_assoc();
                $job_stmt->close();
                
                if ($job) {
                    $receipt_data = [
                        'type' => 'job',
                        'job_id' => $job['id'],
                        'title' => $job['title'],
                        'price' => floatval($job['price']),
                        'status' => $job['status'],
                        'created_at' => $job['created_at'],
                        'formatted_price' => 'Rp ' . number_format($job['price'], 0, ',', '.')
                    ];
                }
            }
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
            'role' => $row['role'] ?? 'unknown',
            'reference_id' => $row['reference_id'] ? intval($row['reference_id']) : null,
            'reference_type' => $row['reference_type'] ?? null,
            'receipt' => $receipt_data
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