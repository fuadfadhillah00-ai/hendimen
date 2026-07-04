<?php
// upload_completion.php - UPDATE: tambah validasi status 'paid'
header('Content-Type: application/json');
session_start();

// Koneksi database
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit;
}

// Ambil data
$job_id = isset($_POST['job_id']) ? intval($_POST['job_id']) : 0;
$user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 0;

if (!$job_id || !$user_id) {
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
    exit;
}

// Cek apakah helper ini benar-benar yang mengerjakan job tersebut
$check_job = $conn->prepare("SELECT id, helper_id, status FROM jobs WHERE id = ?");
$check_job->bind_param("i", $job_id);
$check_job->execute();
$job_data = $check_job->get_result()->fetch_assoc();

if (!$job_data) {
    echo json_encode(['success' => false, 'message' => 'Pekerjaan tidak ditemukan']);
    exit;
}

if ($job_data['helper_id'] != $user_id) {
    echo json_encode(['success' => false, 'message' => 'Anda bukan helper yang bertugas untuk pekerjaan ini']);
    exit;
}

// ================================================================
// 🔥 PERBAIKAN: Izinkan status 'paid', 'in-progress', 'ongoing', ATAU 'perbaikan'
// ================================================================
if ($job_data['status'] !== 'in-progress' && 
    $job_data['status'] !== 'ongoing' && 
    $job_data['status'] !== 'perbaikan' && 
    $job_data['status'] !== 'paid') {
    echo json_encode([
        'success' => false, 
        'message' => 'Pekerjaan harus dalam status "Sedang Berjalan" atau "Perlu Perbaikan" untuk upload bukti. Status saat ini: ' . $job_data['status']
    ]);
    exit;
}

// Cek apakah file diupload
if (!isset($_FILES['bukti_file']) || $_FILES['bukti_file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'File bukti gambar wajib diunggah']);
    exit;
}

$file = $_FILES['bukti_file'];
$allowed_types = ['image/jpeg', 'image/png', 'image/jpg'];
if (!in_array($file['type'], $allowed_types)) {
    echo json_encode(['success' => false, 'message' => 'Format file harus JPG atau PNG']);
    exit;
}

if ($file['size'] > 5 * 1024 * 1024) {
    echo json_encode(['success' => false, 'message' => 'Ukuran file maksimal 5MB']);
    exit;
}

// Upload file
$upload_dir = 'uploads/completion/';
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'completion_' . $job_id . '_' . time() . '.' . $extension;
$filepath = $upload_dir . $filename;

if (move_uploaded_file($file['tmp_name'], $filepath)) {
    // Update database - set completion_image baru dan status ke pending_acc
    $query = "UPDATE jobs SET completion_image = ?, status = 'pending_acc', reject_reason = NULL WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('si', $filepath, $job_id);
    
    if ($stmt->execute()) {
        // Kirim notifikasi ke requester
        $get_requester = $conn->prepare("SELECT user_id, title FROM jobs WHERE id = ?");
        $get_requester->bind_param("i", $job_id);
        $get_requester->execute();
        $job_info = $get_requester->get_result()->fetch_assoc();
        
        if ($job_info) {
            $notif_msg = "📸 Helper telah mengupload ULANG bukti penyelesaian untuk pekerjaan \"" . $job_info['title'] . "\". Silakan review kembali dan ACC untuk transfer dana.";
            $notif = $conn->prepare("INSERT INTO notifications (user_id, message, type, job_id, is_read, created_at) VALUES (?, ?, 'pending_acc', ?, 0, NOW())");
            $notif->bind_param("isi", $job_info['user_id'], $notif_msg, $job_id);
            $notif->execute();
        }

// ================================================================
// 🔥 FCM PUSH NOTIFICATION - Bukti Upload ke Requester
// ================================================================
require_once 'fcm_helper.php';

$fcm_title = "📸 Bukti Pekerjaan Diupload";
$fcm_body = "Helper telah mengupload bukti untuk \"" . $job_info['title'] . "\". Silakan review dan ACC.";
$fcm_data = buildFCMData('upload_proof', $job_id);

sendFCMToUser($job_info['user_id'], $fcm_title, $fcm_body, $fcm_data);

$notif->execute();

echo json_encode(['success' => true, 'message' => 'Bukti berhasil diupload, menunggu konfirmasi Requester']);

        echo json_encode(['success' => true, 'message' => 'Bukti berhasil diupload, menunggu konfirmasi Requester']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal update database: ' . $stmt->error]);
    }
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Gagal upload file']);
}

$conn->close();
?>