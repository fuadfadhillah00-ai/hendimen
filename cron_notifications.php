<?php
// cron_notifications.php - Jalankan setiap hari via cron job
// Cara setting cron: 0 9 * * * php /path/to/cron_notifications.php

require_once 'config.php';

date_default_timezone_set('Asia/Jakarta');

// ✅ NOTIFIKASI 1: Pengingat pekerjaan pending ACC (lebih dari 2 hari)
$pendingJobs = $conn->query("
    SELECT j.id, j.title, j.user_id, j.created_at, u.nama_lengkap as requester_name
    FROM jobs j
    JOIN users u ON j.user_id = u.id
    WHERE j.status = 'pending_acc' 
    AND j.created_at < DATE_SUB(NOW(), INTERVAL 2 DAY)
    AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.job_id = j.id AND n.type = 'reminder_pending_acc' 
        AND n.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
    )
");

while ($job = $pendingJobs->fetch_assoc()) {
    $notif_msg = "⏰ Pekerjaan \"" . $job['title'] . "\" sudah " . round((time() - strtotime($job['created_at'])) / 86400) . " hari menunggu ACC Anda. Segera review bukti dari helper.";
    $notif = $conn->prepare("INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) VALUES (?, ?, 'warning', ?, 0, NOW())");
    $notif->bind_param("isi", $job['user_id'], $notif_msg, $job['id']);
    $notif->execute();
}

// ✅ NOTIFIKASI 2: Pengingat pekerjaan in-progress (lebih dari 3 hari)
$inProgressJobs = $conn->query("
    SELECT j.id, j.title, j.helper_id, j.created_at, u.nama_lengkap as helper_name
    FROM jobs j
    JOIN users u ON j.helper_id = u.id
    WHERE j.status IN ('in-progress', 'ongoing')
    AND j.created_at < DATE_SUB(NOW(), INTERVAL 3 DAY)
    AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.job_id = j.id AND n.type = 'reminder_in_progress' 
        AND n.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
    )
");

while ($job = $inProgressJobs->fetch_assoc()) {
    $notif_msg = "⏰ Pekerjaan \"" . $job['title'] . "\" masih dalam proses. Jangan lupa segera selesaikan dan upload bukti.";
    $notif = $conn->prepare("INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) VALUES (?, ?, 'warning', ?, 0, NOW())");
    $notif->bind_param("isi", $job['helper_id'], $notif_msg, $job['id']);
    $notif->execute();
}

echo "Cron job selesai dijalankan pada " . date('Y-m-d H:i:s') . "\n";
?>