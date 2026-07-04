<?php
// config.php
// Pastikan TIDAK ADA spasi atau karakter sebelum <?php

// Matikan error reporting di output
error_reporting(0);
ini_set('display_errors', 0);

$host = 'localhost';
$username = 'u352984455_hendimen';
$password = 'Gusto_Kita13';
$database = 'u352984455_hendimen';

$conn = new mysqli($host, $username, $password, $database);
$conn->set_charset("utf8");

if ($conn->connect_error) {
    header('Content-Type: application/json');
    die(json_encode([
        'success' => false,
        'message' => 'Koneksi database gagal: ' . $conn->connect_error
    ]));
}

// Set timezone
date_default_timezone_set('Asia/Jakarta');

// ================================================================
// KONSTANTA SISTEM NEGOSIASI 1 PUTARAN
// ================================================================

// Batas waktu helper menawar (detik)
define('OFFER_TIMEOUT', 86400); // 24 jam

// Batas waktu requester memilih tawaran (detik)
define('SELECT_TIMEOUT', 86400); // 24 jam

// Biaya emergency
define('EMERGENCY_FEE', 10000);

// Service Fee (persen dari harga deal, dibayar requester)
define('SERVICE_FEE_PERCENT', 5);

// Admin Fee
define('ADMIN_FEE', 2500);

// Helper Fee (persen dari harga deal, dipotong dari helper)
define('HELPER_FEE_PERCENT', 5);

// Status pekerjaan yang valid
define('JOB_STATUS_OPEN', 'open');
define('JOB_STATUS_OFFERED', 'offered');
define('JOB_STATUS_SELECTED', 'selected');
define('JOB_STATUS_PAID', 'paid');
define('JOB_STATUS_IN_PROGRESS', 'in-progress');
define('JOB_STATUS_PENDING_ACC', 'pending_acc');
define('JOB_STATUS_PERBAIKAN', 'perbaikan');
define('JOB_STATUS_COMPLETED', 'completed');
define('JOB_STATUS_CANCELLED', 'cancelled');

// Status tawaran
define('OFFER_STATUS_PENDING', 'pending');
define('OFFER_STATUS_ACCEPTED', 'accepted');
define('OFFER_STATUS_DECLINED', 'declined');
define('OFFER_STATUS_EXPIRED', 'expired');

// ================================================================
// FUNGSI BANTUAN UNTUK NEGOSIASI
// ================================================================

/**
 * Cek apakah tawaran masih valid (belum expired)
 */
function isOfferValid($created_at) {
    $now = time();
    $created = strtotime($created_at);
    return ($now - $created) < OFFER_TIMEOUT;
}

/**
 * Cek apakah pekerjaan masih dalam masa pemilihan tawaran
 */
function isJobSelectable($created_at) {
    $now = time();
    $created = strtotime($created_at);
    return ($now - $created) < SELECT_TIMEOUT;
}

/**
 * Format rupiah
 */
function formatRupiah($amount) {
    return 'Rp ' . number_format($amount, 0, ',', '.');
}

/**
 * Hitung komponen biaya untuk requester
 */
function calculateRequesterCost($deal_price, $is_emergency = false) {
    $service_fee = $deal_price * (SERVICE_FEE_PERCENT / 100);
    $admin_fee = ADMIN_FEE;
    $emergency_fee = $is_emergency ? EMERGENCY_FEE : 0;
    
    return [
        'deal_price' => $deal_price,
        'service_fee' => $service_fee,
        'admin_fee' => $admin_fee,
        'emergency_fee' => $emergency_fee,
        'total' => $deal_price + $service_fee + $admin_fee + $emergency_fee
    ];
}

/**
 * Hitung komponen biaya untuk helper (dipotong)
 */
function calculateHelperEarnings($deal_price) {
    $helper_fee = $deal_price * (HELPER_FEE_PERCENT / 100);
    return [
        'deal_price' => $deal_price,
        'helper_fee' => $helper_fee,
        'net_earnings' => $deal_price - $helper_fee
    ];
}

/**
 * Mendapatkan status display untuk job
 */
function getJobStatusDisplay($status) {
    $statuses = [
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
    return $statuses[$status] ?? $status;
}

?>