<?php
// ==========================================================================
// API PARTICIPANTS (DATA PESERTA, STATUS VERIFIKASI, IDCARD)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = (int)($_GET['id'] ?? 0);

// GET /api/participants.php?action=me
if ($method === 'GET' && $action === 'me') {
    $user = requireUser(['peserta', 'panitia', 'peninjau', 'tamu', 'media']);
    $stmt = $pdo->prepare("
        SELECT p.*, un.name AS unit_name, un.code AS unit_code 
        FROM participants p 
        LEFT JOIN units un ON p.unit_id = un.id 
        WHERE p.user_id = ?
    ");
    $stmt->execute([$user['id']]);
    $part = $stmt->fetch();
    if (!$part) {
        $prefix = ($user['role'] === 'peninjau') ? 'PNJ-2026-' : (($user['role'] === 'panitia') ? 'PNT-2026-' : 'JMB-2026-');
        $code = $prefix . str_pad($user['id'], 4, '0', STR_PAD_LEFT);
        $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" . urlencode($code);
        jsonResponse([
            'id' => 0,
            'code' => $code,
            'user_id' => $user['id'],
            'full_name' => $user['full_name'] ?? $user['username'],
            'registration_type' => ucfirst($user['role']),
            'registration_code' => $code,
            'level' => ($user['role'] === 'peninjau' ? 'Peninjau' : 'Umum'),
            'status' => 'verified_kabupaten',
            'sub_categories' => [],
            'unit_name' => $user['unit_name'] ?? ($user['role'] === 'peninjau' ? 'Peninjau PMI Kabupaten' : 'Kontingen PMI'),
            'qr_code_base64' => $qrUrl,
            'photo_url' => null
        ]);
    }
    if (isset($part['sub_categories']) && is_string($part['sub_categories'])) {
        $part['sub_categories'] = json_decode($part['sub_categories'], true) ?: [];
    }
    if (empty($part['qr_code_base64'])) {
        $qrData = $part['code'] ?? ('JMB-2026-' . str_pad($part['id'], 4, '0', STR_PAD_LEFT));
        $part['qr_code_base64'] = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" . urlencode($qrData);
    }
    jsonResponse($part);
}

// GET /api/participants.php?action=idcard&id=123 (Protected with Role & Ownership Authorization)
if ($method === 'GET' && $action === 'idcard') {
    $user = requireUser(['kabupaten', 'unit', 'peserta', 'panitia', 'admin', 'penilai', 'juri', 'peninjau']);
    if (!$id) {
        $prefix = ($user['role'] === 'peninjau') ? 'PNJ-2026-' : 'JMB-2026-';
        $code = $prefix . str_pad($user['id'], 4, '0', STR_PAD_LEFT);
        $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" . urlencode($code);
        jsonResponse([
            'id' => 0,
            'code' => $code,
            'user_id' => $user['id'],
            'full_name' => $user['full_name'] ?? $user['username'],
            'registration_type' => ucfirst($user['role']),
            'level' => ($user['role'] === 'peninjau' ? 'Peninjau' : 'Umum'),
            'unit_name' => $user['unit_name'] ?? ($user['role'] === 'peninjau' ? 'Peninjau PMI Kabupaten' : 'Kontingen PMI'),
            'status' => 'verified_kabupaten',
            'qr_code_base64' => $qrUrl,
            'photo_url' => null
        ]);
    }

    $stmt = $pdo->prepare("
        SELECT p.*, un.name AS unit_name, un.level_category 
        FROM participants p 
        LEFT JOIN units un ON p.unit_id = un.id 
        WHERE p.id = ?
    ");
    $stmt->execute([$id]);
    $part = $stmt->fetch();
    if (!$part) jsonResponse(['error' => 'Data peserta tidak ditemukan.'], 404);

    // Multi-tenant & Role-based Authorization:
    // Peserta & Peninjau can only view their own ID card
    if (in_array($user['role'], ['peserta', 'peninjau']) && (int)($part['user_id'] ?? 0) !== (int)$user['id']) {
        jsonResponse(['error' => 'Akses ditolak. Anda hanya dapat melihat ID Card Anda sendiri.'], 403);
    }
    // Unit admin can only view ID cards of participants belonging to their unit
    if ($user['role'] === 'unit' && (int)($part['unit_id'] ?? 0) !== (int)($user['unit_id'] ?? 0)) {
        jsonResponse(['error' => 'Akses ditolak. Anda hanya dapat mencetak ID Card peserta dari unit sekolah Anda sendiri.'], 403);
    }

    // Generate QR Code URL
    $qrData = $part['code'];
    $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" . urlencode($qrData);
    $part['qr_code_base64'] = $qrUrl;

    jsonResponse($part);
}

// GET /api/participants.php?action=stats (Statistik jumlah peserta per status untuk counter dashboard)
if ($method === 'GET' && $action === 'stats') {
    $user = getCurrentUser();
    if (!$user) {
        jsonResponse(['error' => 'Akses ditolak.'], 401);
    }
    $targetUnitId = ($user['role'] === 'unit') ? (int)($user['unit_id'] ?? 0) : (int)($_GET['unit_id'] ?? 0);
    $where = [];
    $params = [];
    if ($targetUnitId > 0) {
        $where[] = "unit_id = ?";
        $params[] = $targetUnitId;
    }
    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'pending_unit' THEN 1 ELSE 0 END) AS pending_unit,
            SUM(CASE WHEN status = 'verified_unit' THEN 1 ELSE 0 END) AS verified_unit,
            SUM(CASE WHEN status = 'verified_kabupaten' THEN 1 ELSE 0 END) AS verified_kabupaten,
            SUM(CASE WHEN status = 'revision' THEN 1 ELSE 0 END) AS revision,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
        FROM participants
        $whereSql
    ");
    $stmt->execute($params);
    $counts = $stmt->fetch() ?: [
        'total' => 0, 'pending_unit' => 0, 'verified_unit' => 0, 
        'verified_kabupaten' => 0, 'revision' => 0, 'rejected' => 0
    ];
    foreach ($counts as $k => $v) {
        $counts[$k] = (int)$v;
    }
    jsonResponse($counts);
}

// GET /api/participants.php (Protected with Multi-Tenant & Role Authorization)
if ($method === 'GET') {
    $user = getCurrentUser();

    // If unauthenticated, only allow aggregate count query for public landing page stats
    $noPaginate = isset($_GET['all']) && $_GET['all'] === 'true';
    $limit = min(100, max(1, (int)($_GET['limit'] ?? 25)));

    if (!$user) {
        // Count total participants for public display without leaking personal data
        $stmtCount = $pdo->query("SELECT COUNT(*) FROM participants WHERE status != 'rejected'");
        $totalRecords = (int)$stmtCount->fetchColumn();

        jsonResponse([
            'data' => [],
            'pagination' => [
                'total' => $totalRecords,
                'page' => 1,
                'limit' => $limit,
                'total_pages' => (int)ceil($totalRecords / $limit) ?: 1
            ]
        ]);
    }

    $unitId = (int)($_GET['unit_id'] ?? 0);
    // Strict multi-tenant isolation: Unit Admin can ONLY see participants from their own unit
    if ($user['role'] === 'unit') {
        $unitId = (int)$user['unit_id'];
    }

    $status = $_GET['status'] ?? '';
    $level = $_GET['level'] ?? '';
    $search = trim($_GET['search'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $offset = ($page - 1) * $limit;

    $where = [];
    $params = [];

    if ($unitId) {
        $where[] = "p.unit_id = ?";
        $params[] = $unitId;
    }
    if ($status) {
        $where[] = "p.status = ?";
        $params[] = $status;
    }
    if ($level) {
        $where[] = "p.level = ?";
        $params[] = $level;
    }
    $registrationType = trim($_GET['registration_type'] ?? $_GET['category'] ?? '');
    if ($registrationType !== '') {
        $where[] = "p.registration_type = ?";
        $params[] = $registrationType;
    }
    if ($search !== '') {
        $where[] = "(p.full_name LIKE ? OR p.code LIKE ? OR p.nisn LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // Fast count total records using database indexes
    $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM participants p $whereSql");
    $stmtCount->execute($params);
    $totalRecords = (int)$stmtCount->fetchColumn();

    $columns = "
        p.id, p.code, p.user_id, p.unit_id, p.full_name, p.nisn, p.level, 
        p.gender, p.blood_type, p.phone, p.photo_url, p.status, p.created_at, 
        p.assignment_letter_url, p.registration_type,
        un.name AS unit_name, un.code AS unit_code
    ";

    if ($noPaginate) {
        // Safe cap to prevent memory exhaustion on huge datasets (100k+ records)
        $capLimit = 1000;
        $sql = "
            SELECT $columns 
            FROM participants p 
            LEFT JOIN units un ON p.unit_id = un.id 
            $whereSql 
            ORDER BY p.id DESC
            LIMIT $capLimit
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        jsonResponse([
            'data' => $items,
            'pagination' => [
                'total' => $totalRecords,
                'page' => 1,
                'limit' => count($items),
                'total_pages' => 1
            ]
        ]);
    } else {
        $sql = "
            SELECT $columns 
            FROM participants p 
            LEFT JOIN units un ON p.unit_id = un.id 
            $whereSql 
            ORDER BY p.id DESC
            LIMIT $limit OFFSET $offset
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        jsonResponse([
            'data' => $items,
            'pagination' => [
                'total' => $totalRecords,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => (int)ceil($totalRecords / $limit) ?: 1
            ]
        ]);
    }
}

// PATCH /api/participants.php?id=123 (Update Status Verifikasi / Revisi / Penolakan)
if (($method === 'POST' || $method === 'PATCH') && $action === 'status') {
    $user = requireUser(['unit', 'kabupaten']);
    $input = getJsonInput();
    $partId = (int)($input['id'] ?? $id);
    $newStatus = $input['status'] ?? '';
    $reason = trim($input['reject_reason'] ?? '');

    if (!$partId || !$newStatus) {
        jsonResponse(['error' => 'ID dan status baru wajib diisi.'], 400);
    }

    if (($newStatus === 'rejected' || $newStatus === 'revision') && empty($reason)) {
        jsonResponse(['error' => 'Harap masukkan catatan perbaikan atau alasan penolakan.'], 400);
    }

    // Fetch participant info for WA message & authorization check
    $stmtP = $pdo->prepare("SELECT p.*, un.name AS unit_name FROM participants p LEFT JOIN units un ON p.unit_id = un.id WHERE p.id = ?");
    $stmtP->execute([$partId]);
    $part = $stmtP->fetch();

    if (!$part) {
        jsonResponse(['error' => 'Data peserta tidak ditemukan.'], 404);
    }

    // Role check: Admin unit can only update status for participants in their own unit
    if ($user['role'] === 'unit') {
        if ($part['unit_id'] != $user['unit_id']) {
            jsonResponse(['error' => 'Anda tidak memiliki hak akses untuk memverifikasi peserta dari unit sekolah lain.'], 403);
        }
        if ($newStatus !== 'verified_unit' && $newStatus !== 'revision' && $newStatus !== 'rejected') {
            jsonResponse(['error' => 'Admin Unit hanya dapat menyetujui, meminta revisi, atau menolak verifikasi.'], 403);
        }
    }

    $stmt = $pdo->prepare("UPDATE participants SET status = ?, reject_reason = ? WHERE id = ?");
    $stmt->execute([$newStatus, $reason ?: null, $partId]);

    $waUrl = null;
    if ($part && !empty($part['phone'])) {
        $phone = preg_replace('/[^0-9]/', '', $part['phone']);
        if (strpos($phone, '0') === 0) {
            $phone = '62' . substr($phone, 1);
        }

        if ($newStatus === 'verified_kabupaten') {
            $statusTitle = "DITERIMA & DISETUJUI RESMI PMI KABUPATEN";
            $detailMsg = "Pendaftaran Anda telah terverifikasi penuh. Silakan login ke portal resmi untuk mengunduh ID Card QR Code Anda.";
        } else if ($newStatus === 'verified_unit') {
            $statusTitle = "DIVERIFIKASI PEMBINA UNIT";
            $detailMsg = "Pendaftaran Anda telah disetujui Pembina Unit Sekolah dan diteruskan ke PMI Kabupaten.";
        } else if ($newStatus === 'revision') {
            $statusTitle = "MINTA PERBAIKAN / REVISI BERKAS";
            $detailMsg = "📝 *Catatan Perbaikan dari Admin:*\n\"{$reason}\"\n\nSilakan login ke Portal Peserta untuk memperbarui data / berkas foto & surat tugas Anda.";
        } else {
            $statusTitle = "DITOLAK";
            $detailMsg = "📝 *Alasan Penolakan:*\n\"{$reason}\"\n\nSilakan hubungi Pembina Unit Sekolah Anda untuk informasi lebih lanjut.";
        }

        $waMsg = "Halo *{$part['full_name']}*,\n\nStatus pendaftaran JUMBARA PMR 2026 Anda pada unit *{$part['unit_name']}* telah diperbarui menjadi: *{$statusTitle}*.\n\n📌 Kode Peserta: *{$part['code']}*\n{$detailMsg}\n\nPalang Merah Indonesia (PMI) Kabupaten";

        $waUrl = "https://api.whatsapp.com/send?phone={$phone}&text=" . urlencode($waMsg);

        // Auto-send via Fonnte WhatsApp Gateway API if enabled
        $fonnteResult = sendFonnteWhatsApp($phone, $waMsg);
    }

    jsonResponse([
        'message' => 'Status verifikasi peserta berhasil diperbarui!',
        'wa_url' => $waUrl,
        'fonnte_status' => $fonnteResult ?? null
    ]);
}

// POST /api/participants.php?action=update-me (Peserta update data & berkas untuk revisi)
if (($method === 'POST' || $method === 'PUT') && $action === 'update-me') {
    $user = requireUser(['peserta', 'panitia', 'peninjau', 'tamu', 'media']);
    $input = getJsonInput();

    $stmtP = $pdo->prepare("SELECT * FROM participants WHERE user_id = ?");
    $stmtP->execute([$user['id']]);
    $part = $stmtP->fetch();
    if (!$part) jsonResponse(['error' => 'Data peserta tidak ditemukan.'], 404);

    $fullName = trim($input['full_name'] ?? $part['full_name']);
    $nisn = trim($input['nisn'] ?? $part['nisn']);
    $religion = trim($input['religion'] ?? $part['religion']);
    $gender = $input['gender'] ?? $part['gender'];
    $bloodType = $input['blood_type'] ?? $part['blood_type'];
    $isDisabled = $input['is_disabled'] ?? $part['is_disabled'];
    $disabilityType = trim($input['disability_type'] ?? $part['disability_type']);
    $address = trim($input['address'] ?? $part['address']);
    $phone = trim($input['phone'] ?? $part['phone']);
    $emergencyContact = trim($input['emergency_contact'] ?? $part['emergency_contact']);

    $photoUrl = $part['photo_url'];
    if (!empty($input['photo_data'])) {
        $uploadedPhoto = saveBase64File($input['photo_data'], 'pasfoto');
        if ($uploadedPhoto) $photoUrl = $uploadedPhoto;
    }

    $assignmentLetterUrl = $part['assignment_letter_url'];
    if (!empty($input['assignment_letter_data'])) {
        $uploadedLetter = saveBase64File($input['assignment_letter_data'], 'surattugas');
        if ($uploadedLetter) $assignmentLetterUrl = $uploadedLetter;
    }

    // Reset status to pending_unit if it was in revision
    $newStatus = ($part['status'] === 'revision') ? 'pending_unit' : $part['status'];

    $stmtUpdate = $pdo->prepare("
        UPDATE participants SET 
            full_name = ?, nisn = ?, religion = ?, gender = ?, blood_type = ?,
            is_disabled = ?, disability_type = ?, address = ?, phone = ?, emergency_contact = ?,
            photo_url = ?, assignment_letter_url = ?, status = ?
        WHERE id = ?
    ");
    $stmtUpdate->execute([
        $fullName, $nisn, $religion, $gender, $bloodType,
        $isDisabled, $disabilityType, $address, $phone, $emergencyContact,
        $photoUrl, $assignmentLetterUrl, $newStatus, $part['id']
    ]);

    // Keep users table in sync with participant's contact and name
    if (!empty($part['user_id'])) {
        $stmtUpdUser = $pdo->prepare("UPDATE users SET full_name = ?, phone = ? WHERE id = ?");
        $stmtUpdUser->execute([$fullName, $phone ?: null, $part['user_id']]);
    }

    jsonResponse(['message' => 'Data dan berkas pendaftaran Anda telah berhasil diperbarui!']);
}

// POST /api/participants.php?action=admin_update (Admin Unit & Admin Kab edit participant data & status)
if (($method === 'POST' || $method === 'PUT') && $action === 'admin_update') {
    $user = requireUser(['unit', 'kabupaten']);
    $input = getJsonInput();

    $id = (int)($input['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'ID Peserta wajib diisi.'], 400);

    $stmtP = $pdo->prepare("SELECT * FROM participants WHERE id = ?");
    $stmtP->execute([$id]);
    $part = $stmtP->fetch();
    if (!$part) jsonResponse(['error' => 'Data peserta tidak ditemukan.'], 404);

    // Security check: unit admin can only edit participants from their own unit
    if ($user['role'] === 'unit' && (int)$part['unit_id'] !== (int)$user['unit_id']) {
        jsonResponse(['error' => 'Akses ditolak. Anda hanya dapat mengedit peserta dari unit sekolah Anda sendiri.'], 403);
    }

    $fullName = trim($input['full_name'] ?? $part['full_name']);
    $nisn = trim($input['nisn'] ?? $part['nisn']);
    $registrationType = $input['registration_type'] ?? $part['registration_type'];
    $level = $input['level'] ?? $part['level'];
    $gender = $input['gender'] ?? $part['gender'];
    $bloodType = $input['blood_type'] ?? $part['blood_type'];
    $phone = trim($input['phone'] ?? $part['phone']);
    $emergencyContact = trim($input['emergency_contact'] ?? $part['emergency_contact']);
    $status = $input['status'] ?? $part['status'];

    $birthPlace = trim($input['birth_place'] ?? $part['birth_place'] ?? '');
    $birthDate = trim($input['birth_date'] ?? $part['birth_date'] ?? '');
    $religion = trim($input['religion'] ?? $part['religion'] ?? 'Islam');
    $isDisabled = $input['is_disabled'] ?? $part['is_disabled'] ?? 'Tidak';
    $disabilityType = trim($input['disability_type'] ?? $part['disability_type'] ?? 'Tidak Ada');
    $address = trim($input['address'] ?? $part['address'] ?? '');
    $email = trim($input['email'] ?? $part['email'] ?? '');
    
    $subCategories = $part['sub_categories'];
    if (isset($input['sub_categories'])) {
        $subCategories = is_array($input['sub_categories']) ? json_encode($input['sub_categories']) : $input['sub_categories'];
    }

    $photoUrl = $part['photo_url'];
    if (!empty($input['photo_data'])) {
        $uploadedPhoto = saveBase64File($input['photo_data'], 'pasfoto');
        if ($uploadedPhoto) $photoUrl = $uploadedPhoto;
    }

    $assignmentLetterUrl = $part['assignment_letter_url'];
    if (!empty($input['assignment_letter_data'])) {
        $uploadedLetter = saveBase64File($input['assignment_letter_data'], 'surattugas');
        if ($uploadedLetter) $assignmentLetterUrl = $uploadedLetter;
    }

    $stmtUpdate = $pdo->prepare("
        UPDATE participants SET 
            full_name = ?, nisn = ?, registration_type = ?, level = ?, gender = ?, blood_type = ?,
            phone = ?, emergency_contact = ?, status = ?, photo_url = ?, assignment_letter_url = ?,
            birth_place = ?, birth_date = ?, religion = ?, is_disabled = ?, disability_type = ?,
            address = ?, email = ?, sub_categories = ?
        WHERE id = ?
    ");
    $stmtUpdate->execute([
        $fullName, $nisn, $registrationType, $level, $gender, $bloodType,
        $phone, $emergencyContact, $status, $photoUrl, $assignmentLetterUrl,
        $birthPlace, $birthDate, $religion, $isDisabled, $disabilityType,
        $address, $email, $subCategories, $id
    ]);

    // Keep users table in sync with participant's contact, name and email
    if (!empty($part['user_id'])) {
        $stmtUpdUser = $pdo->prepare("UPDATE users SET full_name = ?, phone = ?, email = ? WHERE id = ?");
        $stmtUpdUser->execute([$fullName, $phone ?: null, $email ?: null, $part['user_id']]);
    }

    jsonResponse(['message' => 'Data dan berkas peserta berhasil diperbarui!']);
}

// DELETE /api/participants.php?id=123 (Hapus Peserta & Akun User Terkait)
if ($method === 'DELETE') {
    $user = requireUser(['kabupaten', 'unit']);
    $partId = (int)($_GET['id'] ?? 0);
    if (!$partId) jsonResponse(['error' => 'ID peserta wajib.'], 400);

    $stmtCheck = $pdo->prepare("SELECT * FROM participants WHERE id = ?");
    $stmtCheck->execute([$partId]);
    $part = $stmtCheck->fetch();
    if (!$part) jsonResponse(['error' => 'Data peserta tidak ditemukan.'], 404);

    if ($user['role'] === 'unit') {
        if ((int)$part['unit_id'] !== (int)$user['unit_id']) {
            jsonResponse(['error' => 'Akses ditolak. Anda hanya dapat mengelola peserta unit sendiri.'], 403);
        }
        if ($part['status'] === 'verified_kabupaten') {
            jsonResponse(['error' => 'Peserta yang telah disetujui Kabupaten tidak dapat dihapus oleh Unit sekolah.'], 403);
        }
    }

    $pdo->beginTransaction();
    try {
        if (!empty($part['user_id'])) {
            $stmtDelU = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmtDelU->execute([$part['user_id']]);
        }
        $stmtDelP = $pdo->prepare("DELETE FROM participants WHERE id = ?");
        $stmtDelP->execute([$partId]);
        $pdo->commit();

        jsonResponse(['message' => 'Data peserta dan akun pengguna berhasil dihapus.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => 'Gagal menghapus data peserta: ' . $e->getMessage()], 500);
    }
}
