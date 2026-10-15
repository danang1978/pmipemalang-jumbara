<?php
// ==========================================================================
// API ANNOUNCEMENTS (PENGUMUMAN & INFORMASI)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];
$id = (int)($_GET['id'] ?? 0);

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM announcements ORDER BY priority DESC, created_at DESC");
    jsonResponse($stmt->fetchAll());
}

if ($method === 'POST') {
    requireUser(['kabupaten']);
    $input = getJsonInput();

    $title = trim($input['title'] ?? '');
    $content = trim($input['content'] ?? '');

    if (!$title || !$content) jsonResponse(['error' => 'Judul dan isi pengumuman wajib diisi.'], 400);

    $stmt = $pdo->prepare("
        INSERT INTO announcements (title, content, target_role, priority, author_name)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $title, $content,
        $input['target_role'] ?? 'all',
        $input['priority'] ?? 'normal',
        $input['author_name'] ?? 'Panitia PMI'
    ]);

    jsonResponse(['message' => 'Pengumuman berhasil dipublikasikan!']);
}

if ($method === 'DELETE') {
    requireUser(['kabupaten']);
    if (!$id) jsonResponse(['error' => 'ID Pengumuman wajib.'], 400);

    $stmt = $pdo->prepare("DELETE FROM announcements WHERE id = ?");
    $stmt->execute([$id]);
    jsonResponse(['message' => 'Pengumuman dihapus.']);
}
