<?php
// take_job.php
require_once 'config.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method tidak diizinkan');
    }

    $job_id = intval($_POST['job_id'] ?? 0);
    $helper_id = intval($_POST['helper_id'] ?? 0);

    if (!$job_id || !$helper_id) {
        throw new Exception('Data pekerjaan atau ID Helper tidak lengkap');
    }

    // 1. Cek status pekerjaan saat ini di database
    $stmt = $conn->prepare("SELECT helper_id, status, user_id FROM jobs WHERE id = ?");
    $stmt->bind_param("i", $job_id);
    $stmt->execute();
    $job = $stmt->get_result()->fetch_assoc();

    if (!$job) {
        throw new Exception('Pekerjaan tidak ditemukan');
    }

    // Mencegah pembuat lowongan mengambil pekerjaannya sendiri
    if ($job['user_id'] == $helper_id) {
        throw new Exception('Anda tidak bisa mengambil pekerjaan yang Anda buat sendiri');
    }

    // Cek jika pekerjaan sudah diambil helper lain
    if (!empty($job['helper_id'])) {
        throw new Exception('Pekerjaan ini sudah diambil oleh helper lain');
    }

    // 2. Eksekusi UPDATE untuk mendaftarkan helper ke pekerjaan ini
    // Mengubah status pekerjaan dari 'open' menjadi 'ongoing'
    $update = $conn->prepare("UPDATE jobs SET helper_id = ?, status = 'ongoing' WHERE id = ?");
    $update->bind_param("ii", $helper_id, $job_id);
    
    if ($update->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Berhasil mengambil pekerjaan! Silakan koordinasi melalui chat.',
            'requester_id' => intval($job['user_id']) // Kirim balik ID pemesan untuk keperluan chat
        ]);
    } else {
        throw new Exception('Gagal memperbarui status pekerjaan di sistem');
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($update)) $update->close();
    if (isset($conn)) $conn->close();
}
?>