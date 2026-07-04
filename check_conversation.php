<?php
// check_conversation.php
require_once 'config.php';
header('Content-Type: application/json');

try {
    $job_id       = intval($_GET['job_id']       ?? 0);
    $helper_id    = intval($_GET['helper_id']    ?? 0);
    $requester_id = intval($_GET['requester_id'] ?? 0);

    if (!$job_id) throw new Exception('Job ID tidak ditemukan');
    if (!$helper_id && !$requester_id) throw new Exception('helper_id atau requester_id harus diisi');

    if ($helper_id > 0 && $requester_id > 0) {
        $stmt = $conn->prepare("SELECT id FROM chat_conversations WHERE job_id = ? AND helper_id = ? AND requester_id = ?");
        $stmt->bind_param("iii", $job_id, $helper_id, $requester_id);
    } elseif ($helper_id > 0) {
        $stmt = $conn->prepare("SELECT id FROM chat_conversations WHERE job_id = ? AND helper_id = ?");
        $stmt->bind_param("ii", $job_id, $helper_id);
    } else {
        $stmt = $conn->prepare("SELECT id FROM chat_conversations WHERE job_id = ? AND requester_id = ?");
        $stmt->bind_param("ii", $job_id, $requester_id);
    }

    $stmt->execute();
    $row  = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    echo json_encode([
        'success'         => true,
        'exists'          => !empty($row),
        'conversation_id' => $row['id'] ?? null,
        'message'         => !empty($row) ? 'Percakapan sudah ada' : 'Belum ada percakapan'
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'exists' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>