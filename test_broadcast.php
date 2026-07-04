<?php
// test_broadcast.php
require_once 'telegram_notify.php';

echo "📤 Mengirim notifikasi test ke SEMUA subscriber...\n";

$result = sendTelegramNotification(
    999, 
    'TEST - Notifikasi Broadcast Otomatis', 
    100000, 
    'test', 
    'Testing Lokasi', 
    false, 
    'Admin Hendimen'
);

if ($result['success']) {
    echo "✅ Notifikasi terkirim ke {$result['sent']} subscriber!\n";
    echo "📊 Total: {$result['total']}, Gagal: {$result['failed']}\n";
} else {
    echo "❌ Gagal: " . ($result['error'] ?? 'Unknown error') . "\n";
}