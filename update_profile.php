<?php
// update_profile.php - Update profil user (nama, telepon, foto, hapus foto, hapus akun)
require_once 'config.php';
session_start();

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

// ================================================================
// CEK LOGIN
// ================================================================

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Silakan login terlebih dahulu']);
    exit;
}

$user_id = $_SESSION['user_id'];

// ================================================================
// 🔥🔥🔥 AMBIL DATA DARI POST (PASTIKAN DI AWAL)
// ================================================================

$action = isset($_POST['action']) ? $_POST['action'] : '';

// ================================================================
// 🔥🔥🔥 ACTION: DELETE_ACCOUNT (HAPUS AKUN) - HARUS DI AWAL
// ================================================================

if ($action === 'delete_account') {
    
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    if (empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Password harus diisi']);
        exit;
    }
    
    try {
        // Ambil data user
        $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();
        
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
            exit;
        }
        
        // Verifikasi password
        if (!password_verify($password, $user['password'])) {
            echo json_encode(['success' => false, 'message' => 'Password salah!']);
            exit;
        }
        
        // ================================================================
        // 🔥 MULAI TRANSACTION - HAPUS SEMUA DATA USER
        // ================================================================
        $conn->begin_transaction();
        
        // 1. Hapus notifikasi
        $stmt = $conn->prepare("DELETE FROM notifications WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();
        
        // 2. Hapus chat messages
        $stmt = $conn->prepare("DELETE FROM chat_messages WHERE sender_id = ? OR receiver_id = ?");
        $stmt->bind_param("ii", $user_id, $user_id);
        $stmt->execute();
        $stmt->close();
        
        // 3. Hapus chat conversations
        $stmt = $conn->prepare("DELETE FROM chat_conversations WHERE helper_id = ? OR requester_id = ?");
        $stmt->bind_param("ii", $user_id, $user_id);
        $stmt->execute();
        $stmt->close();
        
        // 4. Hapus offers
        $stmt = $conn->prepare("DELETE FROM offers WHERE helper_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();
        
        // 5. Hapus favorites
        $stmt = $conn->prepare("DELETE FROM favorites WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();
        
        // 6. Hapus ratings
        $stmt = $conn->prepare("DELETE FROM ratings WHERE rater_id = ? OR target_id = ?");
        $stmt->bind_param("ii", $user_id, $user_id);
        $stmt->execute();
        $stmt->close();
        
        // 7. Hapus transactions
        $stmt = $conn->prepare("DELETE FROM transactions WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();
        
        // 8. Hapus topup_requests
        $stmt = $conn->prepare("DELETE FROM topup_requests WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();
        
        // 9. Hapus withdraw_requests
        $stmt = $conn->prepare("DELETE FROM withdraw_requests WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();
        
        // 10. Hapus jobs
        $stmt = $conn->prepare("DELETE FROM jobs WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();
        
        // 11. Hapus FCM tokens
        $stmt = $conn->prepare("DELETE FROM fcm_tokens WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();
        
        // 12. Hapus foto profil jika ada
        $stmt = $conn->prepare("SELECT profile_image FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user_data = $result->fetch_assoc();
        $stmt->close();
        
        if ($user_data && !empty($user_data['profile_image']) && file_exists($user_data['profile_image'])) {
            unlink($user_data['profile_image']);
        }
        
        // 13. 🔥 HAPUS USER
        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();
        
        // ================================================================
        // COMMIT
        // ================================================================
        $conn->commit();
        
        // Hapus session
        session_destroy();
        
        echo json_encode([
            'success' => true,
            'message' => 'Akun berhasil dihapus. Semua data telah dihapus permanen.'
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        error_log("delete_account error: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Terjadi kesalahan: ' . $e->getMessage()
        ]);
    }
    exit;
}

// ================================================================
// AMBIL DATA LAINNYA (UNTUK ACTION LAIN)
// ================================================================

$nama_lengkap = isset($_POST['nama_lengkap']) ? trim($_POST['nama_lengkap']) : '';
$no_telepon = isset($_POST['no_telepon']) ? trim($_POST['no_telepon']) : '';

// ================================================================
// ACTION: DELETE_PHOTO (Hapus foto profil)
// ================================================================

if ($action === 'delete_photo') {
    
    try {
        // Ambil foto profil lama
        $stmt = $conn->prepare("SELECT profile_image FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();

        if ($user && !empty($user['profile_image']) && file_exists($user['profile_image'])) {
            unlink($user['profile_image']);
        }

        $stmt = $conn->prepare("UPDATE users SET profile_image = NULL WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();

        echo json_encode([
            'success' => true,
            'message' => '✅ Foto profil berhasil dihapus'
        ]);

    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Terjadi kesalahan: ' . $e->getMessage()
        ]);
    }
    exit;
}

// ================================================================
// ACTION: UPDATE_PROFILE (Update data diri)
// ================================================================

if ($action === 'update_profile') {
    
    if (empty($nama_lengkap)) {
        echo json_encode(['success' => false, 'message' => 'Nama lengkap harus diisi']);
        exit;
    }

    if (strlen($nama_lengkap) < 3) {
        echo json_encode(['success' => false, 'message' => 'Nama lengkap minimal 3 karakter']);
        exit;
    }

    try {
        $stmt = $conn->prepare("UPDATE users SET nama_lengkap = ?, no_telepon = ? WHERE id = ?");
        $stmt->bind_param("ssi", $nama_lengkap, $no_telepon, $user_id);
        $stmt->execute();
        $stmt->close();

        $_SESSION['user_name'] = $nama_lengkap;

        $stmt = $conn->prepare("SELECT profile_image FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();

        echo json_encode([
            'success' => true,
            'message' => '✅ Profil berhasil diperbarui',
            'data' => [
                'nama_lengkap' => $nama_lengkap,
                'no_telepon' => $no_telepon,
                'profile_image' => $user['profile_image'] ?? null
            ]
        ]);

    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Terjadi kesalahan: ' . $e->getMessage()
        ]);
    }
    exit;
}

// ================================================================
// ACTION: UPLOAD_PHOTO (Upload foto profil)
// ================================================================

if ($action === 'upload_photo') {
    
    if (!isset($_FILES['profile_image']) || $_FILES['profile_image']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'File tidak valid atau tidak ada']);
        exit;
    }

    $file = $_FILES['profile_image'];
    $allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];

    if (!in_array($file['type'], $allowed_types)) {
        echo json_encode(['success' => false, 'message' => 'Format file harus JPG, PNG, GIF, atau WEBP']);
        exit;
    }

    if ($file['size'] > 2 * 1024 * 1024) {
        echo json_encode(['success' => false, 'message' => 'Ukuran file maksimal 2MB']);
        exit;
    }

    try {
        $upload_dir = 'uploads/profiles/';
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $filename = 'profile_' . $user_id . '_' . time() . '.' . $extension;
        $filepath = $upload_dir . $filename;

        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            
            $stmt = $conn->prepare("SELECT profile_image FROM users WHERE id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            $stmt->close();

            if ($user && !empty($user['profile_image']) && file_exists($user['profile_image']) && $user['profile_image'] !== $filepath) {
                unlink($user['profile_image']);
            }

            $stmt = $conn->prepare("UPDATE users SET profile_image = ? WHERE id = ?");
            $stmt->bind_param("si", $filepath, $user_id);
            $stmt->execute();
            $stmt->close();

            echo json_encode([
                'success' => true,
                'message' => '✅ Foto profil berhasil diupload',
                'image_url' => $filepath
            ]);

        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Gagal upload file'
            ]);
        }

    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Terjadi kesalahan: ' . $e->getMessage()
        ]);
    }
    exit;
}

// ================================================================
// Jika action tidak dikenal
// ================================================================

echo json_encode([
    'success' => false,
    'message' => 'Aksi tidak dikenal: ' . $action
]);

if (isset($conn)) $conn->close();
?>