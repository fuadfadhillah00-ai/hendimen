<?php
// register.php - VERIFIKASI DINONAKTIFKAN
require_once 'config.php';

// Hapus semua output buffer
while (ob_get_level()) ob_end_clean();

header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method tidak diizinkan');
    }

    // Ambil data dari form
    $nama_lengkap = trim($_POST['nama_lengkap'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $no_telepon = trim($_POST['no_telepon'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    
    $role = 'user';

    // ========== VALIDASI ==========
    if (empty($nama_lengkap)) throw new Exception('Nama lengkap harus diisi');
    if (strlen($nama_lengkap) < 3) throw new Exception('Nama lengkap minimal 3 karakter');
    
    if (empty($email)) throw new Exception('Email harus diisi');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new Exception('Format email tidak valid');
    
    if (empty($no_telepon)) throw new Exception('Nomor telepon harus diisi');
    if (strlen($no_telepon) < 10 || strlen($no_telepon) > 15) throw new Exception('Nomor telepon harus 10-15 digit');
    
    if (empty($password)) throw new Exception('Password harus diisi');
    if (strlen($password) < 6) throw new Exception('Password minimal 6 karakter');
    
    if ($password !== $confirm_password) throw new Exception('Password dan konfirmasi password tidak cocok');

    // ========== CEK DUPLIKAT ==========
    $check_email = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $check_email->bind_param("s", $email);
    $check_email->execute();
    if ($check_email->get_result()->num_rows > 0) throw new Exception('Email sudah terdaftar');
    $check_email->close();

    $check_phone = $conn->prepare("SELECT id FROM users WHERE no_telepon = ?");
    $check_phone->bind_param("s", $no_telepon);
    $check_phone->execute();
    if ($check_phone->get_result()->num_rows > 0) throw new Exception('Nomor telepon sudah terdaftar');
    $check_phone->close();

    // ========== UPLOAD KTP (WAJIB) ==========
    $ktp_path = null;
    if (isset($_FILES['ktp_file']) && $_FILES['ktp_file']['error'] === UPLOAD_ERR_OK) {
        $ktp_file = $_FILES['ktp_file'];
        $file_extension = strtolower(pathinfo($ktp_file['name'], PATHINFO_EXTENSION));
        $allowed_extensions = ['jpg', 'jpeg', 'png', 'pdf'];
        
        if (!in_array($file_extension, $allowed_extensions)) {
            throw new Exception('File KTP harus berupa JPG, JPEG, PNG, atau PDF');
        }
        
        if ($ktp_file['size'] > 5 * 1024 * 1024) {
            throw new Exception('Ukuran file KTP maksimal 5MB');
        }
        
        $target_dir = "uploads/ktp/";
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }
        
        $new_filename = time() . '_' . uniqid() . '.' . $file_extension;
        $target_file = $target_dir . $new_filename;
        $ktp_path = $target_file;
        
        if (!move_uploaded_file($ktp_file['tmp_name'], $target_file)) {
            throw new Exception('Gagal mengupload file KTP');
        }
    }

    // ========== HASH PASSWORD ==========
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // ================================================================
    // 🔥 VERIFIKASI DINONAKTIFKAN - LANGSUNG VERIFIED
    // ================================================================
    $verification_status = 'verified'; // 🔥 LANGSUNG VERIFIED, TIDAK PENDING
    
    $insert = $conn->prepare("INSERT INTO users 
        (role, nama_lengkap, email, no_telepon, password, ktp_file, 
         verification_status, wallet_requester, wallet_helper, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, NOW())");
    $insert->bind_param("sssssss", $role, $nama_lengkap, $email, $no_telepon, $hashed_password, $ktp_path, $verification_status);
    
    if (!$insert->execute()) {
        if ($ktp_path && file_exists($ktp_path)) unlink($ktp_path);
        throw new Exception('Gagal menyimpan data: ' . $insert->error);
    }
    
    $user_id = $insert->insert_id;
    $insert->close();

    // ================================================================
    // NOTIFIKASI KE ADMIN (TETAP DIKIRIM TAPI TIDAK MEMBLOKIR)
    // ================================================================
    $admin_notif_msg = "🆕 User baru terdaftar (auto-verified):\n";
    $admin_notif_msg .= "Nama: " . $nama_lengkap . "\n";
    $admin_notif_msg .= "Email: " . $email . "\n";
    $admin_notif_msg .= "Status: Langsung aktif (verifikasi dimatikan)";
    
    $notif_admin = $conn->prepare("INSERT INTO notifications (user_id, message, type, is_read, created_at) VALUES (0, ?, 'admin', 0, NOW())");
    $notif_admin->bind_param("s", $admin_notif_msg);
    $notif_admin->execute();
    $notif_admin->close();

    // ========== KIRIM RESPONSE ==========
    ob_clean();
    echo json_encode([
        'success' => true,
        'message' => 'Registrasi berhasil! Silakan login.',
        'requires_verification' => false, // 🔥 TIDAK PERLU VERIFIKASI
        'data' => [
            'email' => $email,
            'user_id' => $user_id
        ]
    ]);

} catch (Exception $e) {
    ob_clean();
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
exit;
?>