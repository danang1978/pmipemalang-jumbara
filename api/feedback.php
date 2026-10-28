<?php
// ==========================================================================
// API FEEDBACK / KOTAK SARAN & ASPIRASI JUMBARA
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = (int)($_GET['id'] ?? 0);

// --------------------------------------------------------------------------
// 1. POST /api/feedback.php (Publik: Kirim Saran & Aspirasi)
// --------------------------------------------------------------------------
if ($method === 'POST') {
    $input = getJsonInput();

    $message = trim($input['message'] ?? '');
    if (!$message || mb_strlen($message) < 5) {
        jsonResponse(['error' => 'Pesan saran atau aspirasi minimal berisi 5 karakter.'], 400);
    }
    if (mb_strlen($message) > 3000) {
        jsonResponse(['error' => 'Pesan saran maksimal 3.000 karakter.'], 400);
    }

    $isAnonymous = !empty($input['is_anonymous']) && ($input['is_anonymous'] === true || $input['is_anonymous'] === 1 || $input['is_anonymous'] === '1');
    $rawName = trim($input['sender_name'] ?? '');
    $senderName = $isAnonymous ? 'Anonim' : ($rawName ?: 'Anonim');
    $unitName = trim($input['unit_name'] ?? '');
    $senderRole = trim($input['sender_role'] ?? 'Peserta PMR');
    $category = trim($input['category'] ?? 'Saran Umum');
    $rating = max(1, min(5, (int)($input['rating'] ?? 5)));

    // Client IP & Anti-Spam Rate Limiting (Max 5 submissions per IP per 10 minutes)
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    try {
        $stmtRate = $pdo->prepare("
            SELECT COUNT(*) FROM feedback 
            WHERE ip_address = ? AND created_at >= (NOW() - INTERVAL 10 MINUTE)
        ");
        $stmtRate->execute([$ip]);
        if ((int)$stmtRate->fetchColumn() >= 6) {
            jsonResponse(['error' => 'Terlalu banyak saran yang dikirim dalam waktu singkat. Silakan tunggu beberapa menit.'], 429);
        }
    } catch (Exception $e) {}

    $stmt = $pdo->prepare("
        INSERT INTO feedback (sender_name, is_anonymous, unit_name, sender_role, category, rating, message, status, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'unread', ?)
    ");
    $stmt->execute([
        $senderName,
        $isAnonymous ? 1 : 0,
        $unitName ?: null,
        $senderRole,
        $category,
        $rating,
        $message,
        $ip
    ]);

    jsonResponse([
        'message' => 'Terima kasih! Saran & aspirasi Anda berhasil dikirim ke Panitia Jumbara PMI.',
        'id' => $pdo->lastInsertId(),
        'created_at' => date('Y-m-d H:i:s')
    ]);
}

// --------------------------------------------------------------------------
// 2. GET /api/feedback.php (Admin Kabupaten: Rekap Kotak Saran Masuk)
// --------------------------------------------------------------------------
if ($method === 'GET') {
    // Only Admin Kabupaten or Super Admin can view feedback list
    requireUser(['kabupaten', 'admin_kabupaten', 'super_admin']);

    $status = trim($_GET['status'] ?? '');
    $category = trim($_GET['category'] ?? '');
    $search = trim($_GET['search'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $whereClauses = [];
    $params = [];

    if ($status && $status !== 'all' && $status !== 'Semua') {
        $whereClauses[] = "status = ?";
        $params[] = $status;
    }

    if ($category && $category !== 'all' && $category !== 'Semua') {
        $whereClauses[] = "category = ?";
        $params[] = $category;
    }

    if ($search) {
        $whereClauses[] = "(sender_name LIKE ? OR unit_name LIKE ? OR message LIKE ? OR category LIKE ?)";
        $term = "%{$search}%";
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    $whereSql = !empty($whereClauses) ? ('WHERE ' . implode(' AND ', $whereClauses)) : '';

    // Data & Stats with safe fallback
    $totalRecords = 0;
    $feedbacks = [];
    $totalAll = 0;
    $unreadCount = 0;
    $followupCount = 0;
    $avgRating = 5.0;
    $catCounts = [];

    try {
        // Total Count
        $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM feedback $whereSql");
        $stmtCount->execute($params);
        $totalRecords = (int)$stmtCount->fetchColumn();

        // Data List
        $sql = "SELECT * FROM feedback $whereSql ORDER BY id DESC LIMIT $limit OFFSET $offset";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $feedbacks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Overall Stats
        $totalAll = (int)$pdo->query("SELECT COUNT(*) FROM feedback")->fetchColumn();
        $unreadCount = (int)$pdo->query("SELECT COUNT(*) FROM feedback WHERE status = 'unread'")->fetchColumn();
        $followupCount = (int)$pdo->query("SELECT COUNT(*) FROM feedback WHERE status = 'followup'")->fetchColumn();
        $avgRating = (float)$pdo->query("SELECT COALESCE(ROUND(AVG(rating), 1), 5.0) FROM feedback")->fetchColumn();

        $catCountsStmt = $pdo->query("SELECT category, COUNT(*) as count FROM feedback GROUP BY category ORDER BY count DESC");
        $catCounts = $catCountsStmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (\PDOException $e) {
        if ($e->getCode() === '42S02' || strpos($e->getMessage(), "doesn't exist") !== false) {
            // Table doesn't exist yet, return empty data
        } else {
            throw $e;
        }
    }

    jsonResponse([
        'data' => $feedbacks,
        'stats' => [
            'total' => $totalAll,
            'unread' => $unreadCount,
            'followup' => $followupCount,
            'avg_rating' => $avgRating,
            'categories' => $catCounts
        ],
        'pagination' => [
            'total' => $totalRecords,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => (int)ceil($totalRecords / $limit) ?: 1
        ]
    ]);
}

// --------------------------------------------------------------------------
// 3. PUT /api/feedback.php?id=X (Admin Kabupaten: Update Status & Catatan)
// --------------------------------------------------------------------------
if ($method === 'PUT') {
    requireUser(['kabupaten', 'admin_kabupaten', 'super_admin']);
    if ($id <= 0) {
        jsonResponse(['error' => 'ID kotak saran tidak valid.'], 400);
    }

    $input = getJsonInput();
    $status = trim($input['status'] ?? 'read');
    $adminNotes = trim($input['admin_notes'] ?? '');

    if (!in_array($status, ['unread', 'read', 'followup'])) {
        $status = 'read';
    }

    $stmt = $pdo->prepare("UPDATE feedback SET status = ?, admin_notes = ? WHERE id = ?");
    $stmt->execute([$status, $adminNotes ?: null, $id]);

    jsonResponse(['message' => 'Status saran berhasil diperbarui!']);
}

// --------------------------------------------------------------------------
// 4. DELETE /api/feedback.php?id=X (Admin Kabupaten: Hapus Saran)
// --------------------------------------------------------------------------
if ($method === 'DELETE') {
    requireUser(['kabupaten', 'admin_kabupaten', 'super_admin']);
    if ($id <= 0) {
        jsonResponse(['error' => 'ID kotak saran tidak valid.'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM feedback WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(['message' => 'Saran berhasil dihapus.']);
}
