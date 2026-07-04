<?php
// save_favorite.php
require_once 'config.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method tidak diizinkan');
    }

    $user_id = intval($_POST['user_id'] ?? 0);
    $job_id = intval($_POST['job_id'] ?? 0);
    $action = $_POST['action'] ?? 'toggle';

    if (!$user_id || !$job_id) {
        throw new Exception('User ID atau Job ID tidak valid');
    }

    $success = false;
    $is_favorite = false;
    $message = '';

    if ($action === 'add') {
        $check = $conn->prepare("SELECT id FROM favorites WHERE user_id = ? AND job_id = ?");
        $check->bind_param("ii", $user_id, $job_id);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows === 0) {
            $insert = $conn->prepare("INSERT INTO favorites (user_id, job_id) VALUES (?, ?)");
            $insert->bind_param("ii", $user_id, $job_id);
            
            if ($insert->execute()) {
                $success = true;
                $is_favorite = true;
                $message = 'Pekerjaan ditambahkan ke favorit';
            } else {
                throw new Exception('Gagal menambahkan ke favorit');
            }
            $insert->close();
        } else {
            $success = true;
            $is_favorite = true;
            $message = 'Pekerjaan sudah ada di favorit';
        }
        $check->close();
        
    } elseif ($action === 'remove') {
        $delete = $conn->prepare("DELETE FROM favorites WHERE user_id = ? AND job_id = ?");
        $delete->bind_param("ii", $user_id, $job_id);
        
        if ($delete->execute()) {
            $success = true;
            $is_favorite = false;
            $message = 'Pekerjaan dihapus dari favorit';
        } else {
            throw new Exception('Gagal menghapus dari favorit');
        }
        $delete->close();
        
    } else {
        // Toggle
        $check = $conn->prepare("SELECT id FROM favorites WHERE user_id = ? AND job_id = ?");
        $check->bind_param("ii", $user_id, $job_id);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows > 0) {
            $delete = $conn->prepare("DELETE FROM favorites WHERE user_id = ? AND job_id = ?");
            $delete->bind_param("ii", $user_id, $job_id);
            if ($delete->execute()) {
                $success = true;
                $is_favorite = false;
                $message = 'Dihapus dari favorit';
            }
            $delete->close();
        } else {
            $insert = $conn->prepare("INSERT INTO favorites (user_id, job_id) VALUES (?, ?)");
            $insert->bind_param("ii", $user_id, $job_id);
            if ($insert->execute()) {
                $success = true;
                $is_favorite = true;
                $message = 'Ditambahkan ke favorit';
            }
            $insert->close();
        }
        $check->close();
    }

    echo json_encode([
        'success' => $success,
        'is_favorite' => $is_favorite,
        'message' => $message
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