<?php
// send_push.php - Kirim push notification ke user
require_once 'config.php';

// WebPush library (install via composer: composer require minishlink/web-push)
require_once 'vendor/autoload.php';

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

// GANTI DENGAN VAPID KEY DARI GENERATE_VAPID.PHP
$VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';
$VAPID_PRIVATE_KEY = 'YOUR_VAPID_PRIVATE_KEY_HERE';

function sendPushNotification($user_id, $title, $body, $type = 'info', $job_id = null) {
    global $conn, $VAPID_PUBLIC_KEY, $VAPID_PRIVATE_KEY;
    
    // Ambil semua subscription user
    $stmt = $conn->prepare("SELECT subscription FROM push_subscriptions WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return false;
    }
    
    // Konfigurasi WebPush
    $auth = [
        'VAPID' => [
            'subject' => 'https://hendimen.my.id',
            'publicKey' => $VAPID_PUBLIC_KEY,
            'privateKey' => $VAPID_PRIVATE_KEY
        ]
    ];
    
    $webPush = new WebPush($auth);
    
    // Pilihan suara berdasarkan tipe
    $sound = 'notification.mp3';
    if ($type === 'payment') $sound = 'payment.mp3';
    if ($type === 'reject') $sound = 'error.mp3';
    
    $payload = json_encode([
        'title' => $title,
        'body' => $body,
        'icon' => '/icon-192.png',
        'badge' => '/badge-icon.png',
        'tag' => 'hendimen-' . $type,
        'vibrate' => [200, 100, 200],
        'requireInteraction' => true,
        'data' => [
            'url' => '/dashboard.html',
            'job_id' => $job_id,
            'type' => $type
        ],
        'sound' => '/sound/' . $sound
    ]);
    
    while ($row = $result->fetch_assoc()) {
        $subscriptionData = json_decode($row['subscription'], true);
        
        if ($subscriptionData && isset($subscriptionData['endpoint'])) {
            $subscription = Subscription::create($subscriptionData);
            $webPush->queueNotification($subscription, $payload);
        }
    }
    
    // Kirim semua notifikasi
    foreach ($webPush->flush() as $report) {
        if (!$report->isSuccess()) {
            error_log("Push notification failed: " . $report->getReason());
        }
    }
    
    return true;
}

// Contoh penggunaan (panggil dari file lain)
// sendPushNotification(1, 'Hendimen', 'Helper telah mengambil pekerjaan Anda', 'info', 123);
?>