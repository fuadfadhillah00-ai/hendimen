<?php
// get_ratings.php - Mendapatkan rating dan ulasan dengan foto profil rater

require_once 'config.php';
session_start();

header('Content-Type: application/json');

try {
    $user_id = intval($_GET['user_id'] ?? 0);
    $type = $_GET['type'] ?? 'received';
    $job_id = isset($_GET['job_id']) ? intval($_GET['job_id']) : null;
    
    if (!$user_id) {
        throw new Exception('User ID tidak valid');
    }
    
    // ================================================================
    // BUILD QUERY - DENGAN PROFILE_IMAGE
    // ================================================================
    $query = "SELECT r.*, 
                     u.nama_lengkap as rater_name, 
                     u.role as rater_role,
                     u.profile_image as rater_profile_image,
                     j.title as job_title
              FROM ratings r
              LEFT JOIN users u ON r.rater_id = u.id
              LEFT JOIN jobs j ON r.job_id = j.id
              WHERE 1=1";
    
    $params = [];
    $types = "";
    
    if ($type === 'received') {
        $query .= " AND r.target_id = ?";
        $params[] = $user_id;
        $types .= "i";
    } else if ($type === 'given') {
        $query .= " AND r.rater_id = ?";
        $params[] = $user_id;
        $types .= "i";
    }
    
    if ($job_id) {
        $query .= " AND r.job_id = ?";
        $params[] = $job_id;
        $types .= "i";
    }
    
    $query .= " ORDER BY r.created_at DESC LIMIT 50";
    
    $stmt = $conn->prepare($query);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $ratings = [];
    while ($row = $result->fetch_assoc()) {
        $ratings[] = [
            'id' => intval($row['id']),
            'job_id' => intval($row['job_id']),
            'job_title' => $row['job_title'] ?? 'Pekerjaan #' . $row['job_id'],
            'rater_id' => intval($row['rater_id']),
            'rater_name' => $row['rater_name'] ?? 'Pengguna',
            'rater_profile_image' => $row['rater_profile_image'] ?? null,
            'rater_role' => $row['rater_role'] ?? 'user',
            'target_id' => intval($row['target_id']),
            'rating' => intval($row['rating']),
            'ulasan' => $row['ulasan'] ?? '',
            'created_at' => $row['created_at']
        ];
    }
    $stmt->close();
    
    // ================================================================
    // HITUNG STATISTIK
    // ================================================================
    $total = count($ratings);
    $avg = 0;
    if ($total > 0) {
        $sum = 0;
        foreach ($ratings as $r) {
            $sum += $r['rating'];
        }
        $avg = round($sum / $total, 1);
    }
    
    // Hitung distribusi rating
    $distribution = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
    foreach ($ratings as $r) {
        if (isset($distribution[$r['rating']])) {
            $distribution[$r['rating']]++;
        }
    }
    
    // Hitung kepuasan (rating >= 4)
    $satisfaction = 0;
    if ($total > 0) {
        $good = $distribution[4] + $distribution[5];
        $satisfaction = round(($good / $total) * 100);
    }
    
    echo json_encode([
        'success' => true,
        'ratings' => $ratings,
        'total' => $total,
        'average' => $avg,
        'distribution' => $distribution,
        'satisfaction' => $satisfaction
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'ratings' => []
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?>