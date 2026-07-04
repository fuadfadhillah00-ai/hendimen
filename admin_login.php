<?php
// admin_login.php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit;
}

$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Email dan password harus diisi']);
    exit;
}

// Cek user dengan role admin
$stmt = $conn->prepare("SELECT id, nama_lengkap, email, password, role FROM users WHERE (email = ? OR no_telepon = ?) AND role = 'admin'");
$stmt->bind_param("ss", $email, $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'Akun admin tidak ditemukan']);
    exit;
}

// Verifikasi password (asumsi pakai password_hash)
if (!password_verify($password, $user['password'])) {
    echo json_encode(['success' false, 'message' => 'Password salah']);
    exit;
}

$_SESSION['admin_id'] = $user['id'];
$_SESSION['admin_name'] = $user['nama_lengkap'];
$_SESSION['admin_email'] = $user['email'];
$_SESSION['admin_role'] = $user['role'];

echo json_encode([
    'success' => true,
    'message' => 'Login berhasil',
    'redirect' => 'admin_dashboard.html'
]);
?>