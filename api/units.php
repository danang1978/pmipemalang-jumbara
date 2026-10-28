<?php
// ==========================================================================
// API UNITS (KONTINGEN UNIT PMR SEKOLAH)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM units ORDER BY name ASC");
    jsonResponse($stmt->fetchAll());
}

if ($method === 'POST') {
    requireUser(['kabupaten']);
    $input = getJsonInput();
    $action = $_GET['action'] ?? '';
    $unitId = (int)($_GET['id'] ?? $input['id'] ?? 0);

    if ($action === 'update' || $unitId > 0) {
        $name = trim($input['name'] ?? '');
        $levelCategory = $input['level_category'] ?? 'Wira (SMA)';
        $pembina = trim($input['pembina_name'] ?? '');

        if (!$name || !$pembina || !$unitId) {
            jsonResponse(['error' => 'ID Unit, Nama unit, dan Pembina wajib diisi.'], 400);
        }

        $stmt = $pdo->prepare("UPDATE units SET name = ?, level_category = ?, pembina_name = ?, phone = ?, address = ? WHERE id = ?");
        $stmt->execute([
            $name, $levelCategory, $pembina,
            $input['phone'] ?? null, $input['address'] ?? null,
            $unitId
        ]);

        logActivity('update_unit', 'units', "Memperbarui data unit kontingen: {$name} (ID: {$unitId})", [
            'unit_id' => $unitId,
            'name' => $name,
            'level' => $levelCategory
        ]);

        jsonResponse(['message' => 'Data Unit sekolah berhasil diperbarui!']);
    }

    $name = trim($input['name'] ?? '');
    $levelCategory = $input['level_category'] ?? 'Wira (SMA)';
    $pembina = trim($input['pembina_name'] ?? '');

    if (!$name || !$pembina) {
        jsonResponse(['error' => 'Nama unit dan Pembina wajib diisi.'], 400);
    }

    $maxId = (int)$pdo->query("SELECT MAX(id) FROM units")->fetchColumn() + 1;
    $unitCode = 'UNT-' . str_pad($maxId, 3, '0', STR_PAD_LEFT);
    $check = $pdo->prepare("SELECT COUNT(*) FROM units WHERE code = ?");
    $check->execute([$unitCode]);
    if ($check->fetchColumn() > 0) {
        $unitCode = 'UNT-' . str_pad($maxId . mt_rand(10, 99), 3, '0', STR_PAD_LEFT);
    }

    $stmt = $pdo->prepare("INSERT INTO units (code, name, level_category, pembina_name, phone, address) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $unitCode, $name, $levelCategory, $pembina,
        $input['phone'] ?? null, $input['address'] ?? null
    ]);

    logActivity('create_unit', 'units', "Menambahkan unit kontingen baru: {$name} ({$unitCode})", [
        'code' => $unitCode,
        'name' => $name,
        'level' => $levelCategory
    ]);

    jsonResponse(['message' => 'Unit sekolah berhasil ditambahkan!']);
}

if ($method === 'PUT') {
    requireUser(['kabupaten']);
    $input = getJsonInput();
    $unitId = (int)($_GET['id'] ?? $input['id'] ?? 0);

    $name = trim($input['name'] ?? '');
    $levelCategory = $input['level_category'] ?? 'Wira (SMA)';
    $pembina = trim($input['pembina_name'] ?? '');

    if (!$name || !$pembina || !$unitId) {
        jsonResponse(['error' => 'ID Unit, Nama unit, dan Pembina wajib diisi.'], 400);
    }

    $stmt = $pdo->prepare("UPDATE units SET name = ?, level_category = ?, pembina_name = ?, phone = ?, address = ? WHERE id = ?");
    $stmt->execute([
        $name, $levelCategory, $pembina,
        $input['phone'] ?? null, $input['address'] ?? null,
        $unitId
    ]);

    logActivity('update_unit', 'units', "Memperbarui data unit kontingen: {$name} (ID: {$unitId})", [
        'unit_id' => $unitId,
        'name' => $name,
        'level' => $levelCategory
    ]);

    jsonResponse(['message' => 'Data Unit sekolah berhasil diperbarui!']);
}

if ($method === 'DELETE') {
    requireUser(['kabupaten']);
    $unitId = (int)($_GET['id'] ?? 0);

    if (!$unitId) {
        jsonResponse(['error' => 'ID Unit wajib diisi.'], 400);
    }

    // Check if participants exist under this unit
    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM participants WHERE unit_id = ?");
    $stmtCheck->execute([$unitId]);
    if ($stmtCheck->fetchColumn() > 0) {
        jsonResponse(['error' => 'Unit tidak dapat dihapus karena masih memiliki data peserta terdaftar.'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM units WHERE id = ?");
    $stmt->execute([$unitId]);

    logActivity('delete_unit', 'units', "Menghapus unit kontingen ID: {$unitId}", ['unit_id' => $unitId]);

    jsonResponse(['message' => 'Unit sekolah berhasil dihapus!']);
}
