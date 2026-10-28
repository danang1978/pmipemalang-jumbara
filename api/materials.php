<?php
// ==========================================================================
// API MATERIALS / PUSAT MATERI & DOKUMEN JUMBARA
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = (int)($_GET['id'] ?? 0);

// --------------------------------------------------------------------------
// 1. GET /api/materials.php (Publik: Unduh Materi & Daftar Materi)
// --------------------------------------------------------------------------
if ($method === 'GET') {
    // Action: Track Download
    if ($action === 'download' && $id > 0) {
        $stmt = $pdo->prepare("SELECT id, title, file_url, download_count FROM materials WHERE id = ?");
        $stmt->execute([$id]);
        $mat = $stmt->fetch();
        if (!$mat) {
            jsonResponse(['error' => 'Berkas materi tidak ditemukan.'], 404);
        }

        $pdo->prepare("UPDATE materials SET download_count = download_count + 1 WHERE id = ?")->execute([$id]);
        $newCount = (int)$mat['download_count'] + 1;

        jsonResponse([
            'success' => true,
            'download_count' => $newCount,
            'file_url' => $mat['file_url'],
            'title' => $mat['title']
        ]);
    }

    $category = trim($_GET['category'] ?? '');
    $search = trim($_GET['search'] ?? '');

    $whereClauses = [];
    $params = [];

    if ($category && $category !== 'all' && $category !== 'Semua') {
        $whereClauses[] = "category = ?";
        $params[] = $category;
    }

    if ($search) {
        $whereClauses[] = "(title LIKE ? OR description LIKE ? OR category LIKE ?)";
        $term = "%{$search}%";
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    $whereSql = !empty($whereClauses) ? ('WHERE ' . implode(' AND ', $whereClauses)) : '';

    $materials = [];
    $categories = [];

    try {
        $stmt = $pdo->prepare("SELECT * FROM materials $whereSql ORDER BY id ASC");
        $stmt->execute($params);
        $materials = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch unique categories list for filter tabs
        $categoriesStmt = $pdo->query("SELECT DISTINCT category FROM materials ORDER BY category ASC");
        $categories = $categoriesStmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (\PDOException $e) {
        $materials = [];
        $categories = [];
    }

    jsonResponse([
        'data' => $materials,
        'categories' => $categories,
        'total' => count($materials)
    ]);
}

// --------------------------------------------------------------------------
// 2. POST /api/materials.php (Admin Kabupaten: Tambah / Upload Materi)
// --------------------------------------------------------------------------
if ($method === 'POST') {
    $user = requireUser(['kabupaten', 'admin_kabupaten', 'super_admin']);
    $input = getJsonInput();

    $title = trim($input['title'] ?? '');
    $category = trim($input['category'] ?? 'Buku Panduan & Juknis');
    $description = trim($input['description'] ?? '');
    $fileUrl = trim($input['file_url'] ?? '');
    $fileSize = trim($input['file_size'] ?? '1.5 MB');
    $fileType = strtolower(trim($input['file_type'] ?? 'pdf'));

    if (!$title) {
        jsonResponse(['error' => 'Judul dokumen/materi wajib diisi.'], 400);
    }

    // Support base64 file upload if provided
    if (!empty($input['file_data']) && strpos($input['file_data'], 'data:') === 0) {
        $uploadedPath = saveBase64File($input['file_data'], 'materi');
        if ($uploadedPath) {
            $fileUrl = $uploadedPath;
            $ext = pathinfo($uploadedPath, PATHINFO_EXTENSION);
            if ($ext) $fileType = strtolower($ext);
        }
    }

    if (!$fileUrl) {
        jsonResponse(['error' => 'URL berkas materi atau unggahan file dokumen wajib diisi.'], 400);
    }

    $fileName = basename($fileUrl);

    $stmt = $pdo->prepare("
        INSERT INTO materials (title, category, description, file_url, file_name, file_size, file_type, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $title,
        $category,
        $description,
        $fileUrl,
        $fileName,
        $fileSize,
        $fileType,
        $user['full_name'] ?? 'Panitia Kabupaten PMI'
    ]);

    jsonResponse([
        'message' => 'Materi berhasil ditambahkan ke portal!',
        'id' => $pdo->lastInsertId()
    ]);
}

// --------------------------------------------------------------------------
// 3. DELETE /api/materials.php?id=X (Admin Kabupaten: Hapus Materi)
// --------------------------------------------------------------------------
if ($method === 'DELETE') {
    requireUser(['kabupaten', 'admin_kabupaten', 'super_admin']);
    if ($id <= 0) {
        jsonResponse(['error' => 'ID materi tidak valid.'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM materials WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(['message' => 'Materi berhasil dihapus dari portal.']);
}
