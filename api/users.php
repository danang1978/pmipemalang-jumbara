<?php
// ==========================================================================
// API USER MANAGEMENT (ADMIN RESET PASSWORD, KELOLA USER & PERAN)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();

// Note: Column types and indexes are managed by database setup, not runtime requests.

$method = $_SERVER['REQUEST_METHOD'];
$currentUser = requireUser(['kabupaten']);
$action = $_GET['action'] ?? '';
$input = getJsonInput();

if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $role = trim($_GET['role'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = max(1, min(100, (int)($_GET['limit'] ?? 25)));
    $offset = ($page - 1) * $limit;

    $where = [];
    $params = [];

    if ($search !== '') {
        $where[] = "(u.username LIKE ? OR u.email LIKE ? OR un.name LIKE ? OR u.full_name LIKE ? OR p.full_name LIKE ? OR p.code LIKE ? OR p.phone LIKE ?)";
        $term = "%{$search}%";
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    if ($role !== '') {
        $where[] = "u.role = ?";
        $params[] = $role;
    }

    $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

    $countStmt = $pdo->prepare("
        SELECT COUNT(DISTINCT u.id) 
        FROM users u 
        LEFT JOIN units un ON u.unit_id = un.id 
        LEFT JOIN participants p ON p.user_id = u.id
        {$whereClause}
    ");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT u.id, u.username, u.email, u.role, u.unit_id, u.created_at,
               COALESCE(u.full_name, p.full_name) AS full_name,
               COALESCE(u.phone, p.phone) AS phone,
               p.id AS participant_id, p.code AS participant_code, p.level, p.status AS participant_status,
               un.name AS unit_name
        FROM users u
        LEFT JOIN units un ON u.unit_id = un.id
        LEFT JOIN participants p ON p.user_id = u.id
        {$whereClause}
        ORDER BY u.id DESC
        LIMIT {$limit} OFFSET {$offset}
    ");
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'data' => $users,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => (int)ceil($total / $limit) ?: 1
        ]
    ]);
}

if ($method === 'POST') {
    if ($action === 'reset-password') {
        $userId = (int)($input['user_id'] ?? 0);
        $newPassword = trim($input['new_password'] ?? '');

        if (!$userId || !$newPassword) {
            jsonResponse(['error' => 'ID User dan password baru wajib diisi.'], 400);
        }
        if (strlen($newPassword) < 6) {
            jsonResponse(['error' => 'Password baru minimal harus 6 karakter.'], 400);
        }

        $stmtCheck = $pdo->prepare("SELECT username FROM users WHERE id = ?");
        $stmtCheck->execute([$userId]);
        $targetUser = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$targetUser) {
            jsonResponse(['error' => 'User tidak ditemukan.'], 404);
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmtUpd = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmtUpd->execute([$newHash, $userId]);

        jsonResponse([
            'message' => "Password user '{$targetUser['username']}' berhasil di-reset!"
        ]);
    }

    if ($action === 'create') {
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');
        $email = trim($input['email'] ?? '');
        $role = trim($input['role'] ?? 'peserta');
        $fullName = trim($input['full_name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $unitId = !empty($input['unit_id']) ? (int)$input['unit_id'] : null;

        if (!$username || !$password) {
            jsonResponse(['error' => 'Username dan password wajib diisi.'], 400);
        }
        if (strlen($password) < 6) {
            jsonResponse(['error' => 'Password minimal 6 karakter.'], 400);
        }

        $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
        $stmtCheck->execute([$username]);
        if ($stmtCheck->fetchColumn() > 0) {
            jsonResponse(['error' => "Username '{$username}' sudah digunakan."], 400);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmtIns = $pdo->prepare("INSERT INTO users (username, password, email, role, unit_id, full_name, phone) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmtIns->execute([$username, $hash, $email ?: null, $role, $unitId, $fullName ?: null, $phone ?: null]);

        jsonResponse([
            'message' => "User baru '{$username}' dengan peran '{$role}' berhasil dibuat!",
            'id' => $pdo->lastInsertId()
        ]);
    }

    if ($action === 'update') {
        $userId = (int)($input['user_id'] ?? 0);
        $email = trim($input['email'] ?? '');
        $role = trim($input['role'] ?? '');
        $fullName = trim($input['full_name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $unitId = !empty($input['unit_id']) ? (int)$input['unit_id'] : null;

        if (!$userId || !$role) {
            jsonResponse(['error' => 'ID User dan Peran/Role wajib diisi.'], 400);
        }

        $stmtUpd = $pdo->prepare("UPDATE users SET email = ?, role = ?, unit_id = ?, full_name = ?, phone = ? WHERE id = ?");
        $stmtUpd->execute([$email ?: null, $role, $unitId, $fullName ?: null, $phone ?: null, $userId]);

        // If user is a participant, also update participant's full_name and phone
        $stmtPartUpd = $pdo->prepare("UPDATE participants SET full_name = ?, phone = ?, email = ? WHERE user_id = ?");
        $stmtPartUpd->execute([$fullName ?: null, $phone ?: null, $email ?: null, $userId]);

        jsonResponse(['message' => 'Data user dan peserta berhasil diperbarui!']);
    }
}

if ($method === 'DELETE') {
    $userId = (int)($_GET['id'] ?? 0);
    if (!$userId) {
        jsonResponse(['error' => 'ID User tidak valid.'], 400);
    }
    if ($userId === (int)$currentUser['id']) {
        jsonResponse(['error' => 'Anda tidak dapat menghapus akun Anda sendiri yang sedang terhubung.'], 400);
    }

    $stmtDel = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmtDel->execute([$userId]);

    jsonResponse(['message' => 'User berhasil dihapus dari sistem.']);
}
