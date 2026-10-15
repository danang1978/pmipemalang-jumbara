<?php
// ==========================================================================
// API UNSUR CATEGORIES & QUOTA MANAGEMENT
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET /api/unsur.php
if ($method === 'GET') {
    $unitId = (int)($_GET['unit_id'] ?? 0);

    $stmt = $pdo->query("SELECT * FROM unsur_categories ORDER BY id ASC");
    $items = $stmt->fetchAll();

    // Query global active participant count grouped by level
    $stmtGlobal = $pdo->query("
        SELECT level, COUNT(*) AS total 
        FROM participants 
        WHERE status != 'rejected'
        GROUP BY level
    ");
    $globalMap = $stmtGlobal->fetchAll(PDO::FETCH_KEY_PAIR);

    if ($unitId > 0) {
        $stmtUsage = $pdo->prepare("
            SELECT level, COUNT(*) AS total 
            FROM participants 
            WHERE unit_id = ? AND status != 'rejected'
            GROUP BY level
        ");
        $stmtUsage->execute([$unitId]);
        $usageMap = $stmtUsage->fetchAll(PDO::FETCH_KEY_PAIR);

        foreach ($items as &$u) {
            $u['used_quota'] = (int)($usageMap[$u['name']] ?? 0);
            $u['remaining_quota'] = ($u['quota'] > 0) ? max(0, (int)$u['quota'] - $u['used_quota']) : null;
            $u['is_full'] = ($u['quota'] > 0 && $u['used_quota'] >= (int)$u['quota']);
            $u['total_global'] = (int)($globalMap[$u['name']] ?? 0);
        }
    } else {
        foreach ($items as &$u) {
            $u['total_global'] = (int)($globalMap[$u['name']] ?? 0);
            $u['used_quota'] = 0;
            $u['remaining_quota'] = null;
            $u['is_full'] = false;
        }
    }

    jsonResponse($items);
}

// POST /api/unsur.php (Tambah Unsur Baru)
if ($method === 'POST') {
    requireUser(['kabupaten']);
    $input = getJsonInput();

    $name = trim($input['name'] ?? '');
    $quota = max(0, (int)($input['quota'] ?? 1));
    $description = trim($input['description'] ?? '');

    if (!$name) {
        jsonResponse(['error' => 'Nama unsur wajib diisi.'], 400);
    }

    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM unsur_categories WHERE LOWER(name) = LOWER(?)");
    $stmtCheck->execute([$name]);
    if ($stmtCheck->fetchColumn() > 0) {
        jsonResponse(['error' => "Nama unsur '{$name}' sudah ada."], 400);
    }

    $stmt = $pdo->prepare("INSERT INTO unsur_categories (name, quota, description) VALUES (?, ?, ?)");
    $stmt->execute([$name, $quota, $description ?: null]);

    jsonResponse([
        'message' => "Unsur baru '{$name}' dengan kuota {$quota} berhasil ditambahkan!",
        'id' => $pdo->lastInsertId()
    ]);
}

// PUT /api/unsur.php (Edit Unsur & Kuota)
if ($method === 'PUT') {
    requireUser(['kabupaten']);
    $input = getJsonInput();
    $id = (int)($input['id'] ?? $_GET['id'] ?? 0);
    $name = trim($input['name'] ?? '');
    $quota = max(0, (int)($input['quota'] ?? 1));
    $description = trim($input['description'] ?? '');

    if (!$id || !$name) {
        jsonResponse(['error' => 'ID dan nama unsur wajib diisi.'], 400);
    }

    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM unsur_categories WHERE LOWER(name) = LOWER(?) AND id != ?");
    $stmtCheck->execute([$name, $id]);
    if ($stmtCheck->fetchColumn() > 0) {
        jsonResponse(['error' => "Nama unsur '{$name}' sudah digunakan."], 400);
    }

    $stmt = $pdo->prepare("UPDATE unsur_categories SET name = ?, quota = ?, description = ? WHERE id = ?");
    $stmt->execute([$name, $quota, $description ?: null, $id]);

    jsonResponse(['message' => "Unsur '{$name}' berhasil diperbarui!"]);
}

// DELETE /api/unsur.php?id=X (Hapus Unsur)
if ($method === 'DELETE') {
    requireUser(['kabupaten']);
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'ID unsur wajib.'], 400);

    $stmtName = $pdo->prepare("SELECT name FROM unsur_categories WHERE id = ?");
    $stmtName->execute([$id]);
    $name = $stmtName->fetchColumn();

    if (!$name) jsonResponse(['error' => 'Unsur tidak ditemukan.'], 404);

    // Check if unsur is currently used by participants
    $stmtPartCount = $pdo->prepare("SELECT COUNT(*) FROM participants WHERE level = ?");
    $stmtPartCount->execute([$name]);
    $usedCount = (int)$stmtPartCount->fetchColumn();

    if ($usedCount > 0) {
        jsonResponse(['error' => "Unsur '{$name}' sedang digunakan oleh {$usedCount} data peserta. Tidak dapat dihapus."], 400);
    }

    $stmtDel = $pdo->prepare("DELETE FROM unsur_categories WHERE id = ?");
    $stmtDel->execute([$id]);

    jsonResponse(['message' => "Unsur '{$name}' berhasil dihapus!"]);
}

jsonResponse(['error' => 'Method not allowed.'], 405);
