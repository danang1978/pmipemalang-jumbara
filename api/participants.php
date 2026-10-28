<?php
// ==========================================================================
// API PARTICIPANTS (DATA PESERTA, STATUS VERIFIKASI, IDCARD)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = (int)($_GET['id'] ?? 0);

function getParticipantSelectColumns(PDO $pdo): string {
    return "p.id, p.code, p.user_id, p.unit_id, p.full_name, p.nisn, p.level, p.gender, p.blood_type, p.phone, p.photo_url, p.status, p.created_at, p.class_name, p.last_education, p.organizations, p.birth_place, p.birth_date, p.religion, p.address, p.school_address, p.school_phone, p.parent_name, p.parent_address, p.parent_phone, p.parent_job, p.is_disabled, p.disability_type, p.emergency_contact, p.assignment_letter_url, p.registration_type, p.reject_reason, p.email, p.certificate_number, p.sub_categories, un.name AS unit_name, un.code AS unit_code, un.address AS unit_address, un.phone AS unit_phone";
}

// GET /api/participants.php?action=me
if ($method === 'GET' && $action === 'me') {
    $user = requireUser(['peserta', 'panitia', 'peninjau', 'pendamping', 'tamu', 'media']);
    $stmt = $pdo->prepare("
        SELECT p.*, un.name AS unit_name, un.code AS unit_code 
        FROM participants p 
        LEFT JOIN units un ON p.unit_id = un.id 
        WHERE p.user_id = ?
    ");
    $stmt->execute([$user['id']]);
    $part = $stmt->fetch();
    if (!$part) {
        $prefix = ($user['role'] === 'peninjau') ? 'PNJ-2026-' : (($user['role'] === 'pendamping') ? 'PDP-2026-' : (($user['role'] === 'panitia') ? 'PNT-2026-' : 'JMB-2026-'));
        $code = $prefix . str_pad($user['id'], 4, '0', STR_PAD_LEFT);
        $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" . urlencode($code);
        jsonResponse([
            'id' => 0,
            'code' => $code,
            'user_id' => $user['id'],
            'full_name' => $user['full_name'] ?? $user['username'],
            'registration_type' => ucfirst($user['role']),
            'registration_code' => $code,
            'level' => ($user['role'] === 'peninjau' ? 'Peninjau' : ($user['role'] === 'pendamping' ? 'Pendamping' : 'Umum')),
            'status' => 'verified_kabupaten',
            'sub_categories' => [],
            'unit_name' => $user['unit_name'] ?? ($user['role'] === 'peninjau' ? 'Peninjau PMI Kabupaten' : ($user['role'] === 'pendamping' ? 'Pendamping Kontingen' : 'Kontingen PMI')),
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
    $user = requireUser(['kabupaten', 'unit', 'peserta', 'panitia', 'admin', 'penilai', 'juri', 'peninjau', 'pendamping']);
    if (!$id) {
        $prefix = ($user['role'] === 'peninjau') ? 'PNJ-2026-' : (($user['role'] === 'pendamping') ? 'PDP-2026-' : 'JMB-2026-');
        $code = $prefix . str_pad($user['id'], 4, '0', STR_PAD_LEFT);
        $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" . urlencode($code);
        jsonResponse([
            'id' => 0,
            'code' => $code,
            'user_id' => $user['id'],
            'full_name' => $user['full_name'] ?? $user['username'],
            'registration_type' => ucfirst($user['role']),
            'level' => ($user['role'] === 'peninjau' ? 'Peninjau' : ($user['role'] === 'pendamping' ? 'Pendamping' : 'Umum')),
            'unit_name' => $user['unit_name'] ?? ($user['role'] === 'peninjau' ? 'Peninjau PMI Kabupaten' : ($user['role'] === 'pendamping' ? 'Pendamping Kontingen' : 'Kontingen PMI')),
            'status' => 'verified_kabupaten',
            'qr_code_base64' => $qrUrl,
            'photo_url' => null
        ]);
    }

    $stmt = $pdo->prepare("
        SELECT p.*, un.name AS unit_name, un.level_category, un.address AS unit_address, un.phone AS unit_phone 
        FROM participants p 
        LEFT JOIN units un ON p.unit_id = un.id 
        WHERE p.id = ?
    ");
    $stmt->execute([$id]);
    $part = $stmt->fetch();
    if (!$part) jsonResponse(['error' => 'Data peserta tidak ditemukan.'], 404);

    // Multi-tenant & Role-based Authorization:
    // Peserta, Peninjau & Pendamping can only view their own ID card
    if (in_array($user['role'], ['peserta', 'peninjau', 'pendamping']) && (int)($part['user_id'] ?? 0) !== (int)$user['id']) {
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

// GET /api/participants.php?action=export&unit_id=123&format=excel
if ($method === 'GET' && $action === 'export') {
    $user = requireUser(['kabupaten', 'unit', 'panitia', 'admin']);
    $unitId = (int)($_GET['unit_id'] ?? 0);
    if ($user['role'] === 'unit') {
        $unitId = (int)$user['unit_id'];
    }

    $status = $_GET['status'] ?? '';
    $level = $_GET['level'] ?? '';
    $registrationType = trim($_GET['registration_type'] ?? $_GET['category'] ?? '');
    $search = trim($_GET['search'] ?? '');
    $format = strtolower($_GET['format'] ?? 'excel');

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
    $columns = getParticipantSelectColumns($pdo);

    $sql = "
        SELECT $columns 
        FROM participants p 
        LEFT JOIN units un ON p.unit_id = un.id 
        $whereSql 
        ORDER BY 
            CASE 
                WHEN p.registration_type = 'Pendamping' THEN 1 
                WHEN p.level = 'Mula' THEN 2 
                WHEN p.level = 'Madya' THEN 3 
                WHEN p.level = 'Wira' THEN 4 
                ELSE 5 
            END ASC,
            p.full_name ASC
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $participants = $stmt->fetchAll();

    // Fetch Unit Info if single unit
    $unitInfo = null;
    if ($unitId) {
        $stmtU = $pdo->prepare("SELECT * FROM units WHERE id = ?");
        $stmtU->execute([$unitId]);
        $unitInfo = $stmtU->fetch();
    }

    $unitName = $unitInfo ? $unitInfo['name'] : 'Semua Unit Kontingen';
    $safeFilename = 'Data_Peserta_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $unitName) . '_' . date('Ymd_His');

    // EXCEL (.xls styled spreadsheet compatible with Excel, LibreOffice, Google Sheets)
    header('Content-Type: application/vnd.ms-excel; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $safeFilename . '.xls"');
    header('Pragma: no-cache');
    header('Expires: 0');

    // Aggregate stats for header
    $totalCount = count($participants);
    $mulaCount = 0; $madyaCount = 0; $wiraCount = 0; $pdpCount = 0;
    $maleCount = 0; $femaleCount = 0; $verifiedKabCount = 0;

    foreach ($participants as $p) {
        if (($p['registration_type'] ?? '') === 'Pendamping') $pdpCount++;
        elseif (($p['level'] ?? '') === 'Mula') $mulaCount++;
        elseif (($p['level'] ?? '') === 'Madya') $madyaCount++;
        elseif (($p['level'] ?? '') === 'Wira') $wiraCount++;

        if (($p['gender'] ?? '') === 'L') $maleCount++; else $femaleCount++;
        if (($p['status'] ?? '') === 'verified_kabupaten') $verifiedKabCount++;
    }

    // Output HTML Table formatted for Excel
    echo '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    echo '<head>';
    echo '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
    echo '<style>';
    echo 'body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }';
    echo 'table { border-collapse: collapse; width: 100%; }';
    echo 'th, td { border: 0.5pt solid #94a3b8; padding: 6px 8px; vertical-align: middle; }';
    echo 'th { background-color: #b91c1c; color: #ffffff; font-weight: bold; text-align: center; }';
    echo '.text-center { text-align: center; }';
    echo '.text-left { text-align: left; }';
    echo '.text-num { mso-number-format: "\@"; text-align: center; }';
    echo '.text-telp { mso-number-format: "\@"; text-align: left; }';
    echo '.row-even { background-color: #ffffff; }';
    echo '.row-odd { background-color: #f8fafc; }';
    echo '.title-kop { font-size: 15pt; font-weight: bold; color: #b91c1c; text-align: center; }';
    echo '.subtitle-kop { font-size: 12pt; font-weight: bold; text-align: center; }';
    echo '.meta-box { background-color: #f1f5f9; font-size: 10pt; }';
    echo '.badge-verified { background-color: #dcfce7; color: #166534; font-weight: bold; text-align: center; }';
    echo '.badge-pending { background-color: #fef9c3; color: #854d0e; text-align: center; }';
    echo '</style>';
    echo '</head>';
    echo '<body>';

    echo '<table>';
    echo '<tr><td colspan="17" class="title-kop">PALANG MERAH INDONESIA KABUPATEN PEMALANG</td></tr>';
    echo '<tr><td colspan="17" class="subtitle-kop">JUMBARA PMR KABUPATEN PEMALANG TAHUN 2026</td></tr>';
    echo '<tr><td colspan="17" style="text-align: center; font-size: 11pt; padding-bottom: 12px;">DAFTAR REKAPITULASI PESERTA & PEMBINA PENDAMPING KONTINGEN</td></tr>';
    echo '<tr><td colspan="17" style="border: none;"></td></tr>';

    // Kontingen Details
    echo '<tr class="meta-box"><td colspan="3" style="font-weight: bold;">Nama Kontingen / Unit:</td><td colspan="6" style="font-weight: bold; font-size: 12pt; color: #b91c1c;">' . htmlspecialchars($unitName) . '</td><td colspan="3" style="font-weight: bold;">Tanggal Export:</td><td colspan="5">' . date('d F Y, H:i') . ' WIB</td></tr>';
    if ($unitInfo) {
        echo '<tr class="meta-box"><td colspan="3" style="font-weight: bold;">Tingkat Kategori:</td><td colspan="6">' . htmlspecialchars($unitInfo['level_category'] ?? '-') . '</td><td colspan="3" style="font-weight: bold;">Pembina / Pendamping:</td><td colspan="5">' . htmlspecialchars($unitInfo['lead_name'] ?? '-') . ' (' . htmlspecialchars($unitInfo['lead_phone'] ?? '-') . ')</td></tr>';
        echo '<tr class="meta-box"><td colspan="3" style="font-weight: bold;">Alamat Pangkalan / Sekolah:</td><td colspan="14">' . htmlspecialchars($unitInfo['address'] ?? '-') . '</td></tr>';
    }
    echo '<tr class="meta-box"><td colspan="3" style="font-weight: bold;">Statistik Kontingen:</td><td colspan="14">Total: <strong>' . $totalCount . ' Orang</strong> | Mula: <strong>' . $mulaCount . '</strong> | Madya: <strong>' . $madyaCount . '</strong> | Wira: <strong>' . $wiraCount . '</strong> | Pembina: <strong>' . $pdpCount . '</strong> | L: <strong>' . $maleCount . '</strong>, P: <strong>' . $femaleCount . '</strong> | Verifikasi Kab: <strong>' . $verifiedKabCount . ' Disetujui</strong></td></tr>';
    echo '<tr><td colspan="17" style="border: none;"></td></tr>';

    // Header Table
    echo '<thead>';
    echo '<tr>';
    echo '<th style="width: 40px;">No</th>';
    echo '<th style="width: 120px;">Kode Peserta</th>';
    echo '<th style="width: 130px;">NIK / NISN</th>';
    echo '<th style="width: 220px;">Nama Lengkap</th>';
    echo '<th style="width: 120px;">Kategori</th>';
    echo '<th style="width: 80px;">Tingkat</th>';
    echo '<th style="width: 130px;">Kelas / Pend.</th>';
    echo '<th style="width: 50px;">JK</th>';
    echo '<th style="width: 60px;">Gol. Darah</th>';
    echo '<th style="width: 180px;">Tempat, Tgl Lahir</th>';
    echo '<th style="width: 80px;">Agama</th>';
    echo '<th style="width: 130px;">No. WhatsApp</th>';
    echo '<th style="width: 130px;">Kontak Darurat</th>';
    echo '<th style="width: 180px;">Nama Orang Tua / Wali</th>';
    echo '<th style="width: 250px;">Alamat Domisili</th>';
    echo '<th style="width: 140px;">Status Verifikasi</th>';
    echo '<th style="width: 180px;">Unit / Kontingen</th>';
    echo '</tr>';
    echo '</thead>';
    echo '<tbody>';

    if (empty($participants)) {
        echo '<tr><td colspan="17" class="text-center" style="padding: 20px; font-style: italic; color: #64748b;">Belum ada data peserta yang terdaftar pada kontingen ini.</td></tr>';
    } else {
        $no = 1;
        foreach ($participants as $idx => $p) {
            $rowClass = ($idx % 2 === 0) ? 'row-even' : 'row-odd';
            $isPdp = ($p['registration_type'] === 'Pendamping');
            $catLabel = $isPdp ? 'Pembina Pendamping' : ($p['registration_type'] ?? 'Peserta');
            $eduOrClass = $isPdp ? ($p['last_education'] ?? '-') : ($p['class_name'] ? ('Kelas ' . $p['class_name']) : '-');
            
            $statusBadgeClass = ($p['status'] === 'verified_kabupaten') ? 'badge-verified' : 'badge-pending';
            $statusLabel = [
                'pending_unit' => 'Menunggu Unit',
                'verified_unit' => 'Disetujui Unit',
                'verified_kabupaten' => 'Terverifikasi Kab',
                'revision' => 'Revisi',
                'rejected' => 'Ditolak'
            ][$p['status'] ?? ''] ?? ($p['status'] ?? '-');

            $ttl = trim(($p['birth_place'] ?? '') . ', ' . ($p['birth_date'] ?? ''));
            if ($ttl === ',') $ttl = '-';

            echo '<tr class="' . $rowClass . '">';
            echo '<td class="text-center">' . $no++ . '</td>';
            echo '<td class="text-num" style="font-weight: bold; color: #0284c7;">' . htmlspecialchars($p['code'] ?? '-') . '</td>';
            echo '<td class="text-num">' . htmlspecialchars($p['nisn'] ?? '-') . '</td>';
            echo '<td class="text-left" style="font-weight: bold;">' . htmlspecialchars($p['full_name'] ?? '-') . '</td>';
            echo '<td class="text-center">' . htmlspecialchars($catLabel) . '</td>';
            echo '<td class="text-center">' . htmlspecialchars($p['level'] ?? '-') . '</td>';
            echo '<td class="text-left">' . htmlspecialchars($eduOrClass) . '</td>';
            echo '<td class="text-center">' . htmlspecialchars($p['gender'] ?? '-') . '</td>';
            echo '<td class="text-center" style="font-weight: bold;">' . htmlspecialchars($p['blood_type'] ?? '-') . '</td>';
            echo '<td class="text-left">' . htmlspecialchars($ttl) . '</td>';
            echo '<td class="text-center">' . htmlspecialchars($p['religion'] ?? '-') . '</td>';
            echo '<td class="text-telp">' . htmlspecialchars($p['phone'] ?? '-') . '</td>';
            echo '<td class="text-telp">' . htmlspecialchars($p['emergency_contact'] ?? '-') . '</td>';
            echo '<td class="text-left">' . htmlspecialchars($p['parent_name'] ?? '-') . '</td>';
            echo '<td class="text-left">' . htmlspecialchars($p['address'] ?? '-') . '</td>';
            echo '<td class="' . $statusBadgeClass . '">' . htmlspecialchars($statusLabel) . '</td>';
            echo '<td class="text-left">' . htmlspecialchars($p['unit_name'] ?? '-') . '</td>';
            echo '</tr>';
        }
    }

    echo '</tbody>';
    echo '</table>';

    // Signature Area
    echo '<br /><br />';
    echo '<table>';
    echo '<tr>';
    echo '<td colspan="8" style="border: none; text-align: center; vertical-align: top; width: 50%;">';
    echo 'Mengetahui,<br /><strong>Pembina / Pendamping Kontingen</strong><br /><br /><br /><br /><br />';
    echo '<strong>(' . htmlspecialchars($unitInfo['lead_name'] ?? '.........................................') . ')</strong><br />';
    echo 'NIP/NRP: .......................................';
    echo '</td>';
    echo '<td colspan="9" style="border: none; text-align: center; vertical-align: top; width: 50%;">';
    echo 'Pemalang, ' . date('d F Y') . '<br /><strong>Panitia Pelaksana Jumbara PMR 2026<br />PMI Kabupaten Pemalang</strong><br /><br /><br /><br /><br />';
    echo '<strong>( .................................................... )</strong><br />';
    echo 'Bidang Registrasi & Verifikasi';
    echo '</td>';
    echo '</tr>';
    echo '</table>';

    echo '</body>';
    echo '</html>';
    exit;
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

    $columns = getParticipantSelectColumns($pdo);

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

    logActivity('verify_participant', 'participants', "Memperbarui status verifikasi peserta {$part['full_name']} ({$part['code']}) menjadi '{$newStatus}'" . ($reason ? " (Catatan: {$reason})" : ""), [
        'participant_id' => $partId,
        'code' => $part['code'],
        'name' => $part['full_name'],
        'status' => $newStatus,
        'reason' => $reason
    ]);

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
    $user = requireUser(['peserta', 'panitia', 'peninjau', 'pendamping', 'tamu', 'media']);
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
    $lastEducation = trim($input['last_education'] ?? $part['last_education'] ?? '');
    $organizations = trim($input['organizations'] ?? $part['organizations'] ?? '');

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
            last_education = ?, organizations = ?,
            photo_url = ?, assignment_letter_url = ?, status = ?
        WHERE id = ?
    ");
    $stmtUpdate->execute([
        $fullName, $nisn, $religion, $gender, $bloodType,
        $isDisabled, $disabilityType, $address, $phone, $emergencyContact,
        $lastEducation ?: null, $organizations ?: null,
        $photoUrl, $assignmentLetterUrl, $newStatus, $part['id']
    ]);

    // Keep users table in sync with participant's contact and name
    if (!empty($part['user_id'])) {
        try {
            $stmtUpdUser = $pdo->prepare("UPDATE users SET full_name = ?, phone = ? WHERE id = ?");
            $stmtUpdUser->execute([$fullName, $phone ?: null, $part['user_id']]);
        } catch (PDOException $e) {
            // Ignore if columns do not exist yet
        }
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
    
    $className = trim($input['class_name'] ?? $part['class_name'] ?? '');
    $schoolAddress = trim($input['school_address'] ?? $part['school_address'] ?? '');
    $schoolPhone = trim($input['school_phone'] ?? $part['school_phone'] ?? '');
    $parentName = trim($input['parent_name'] ?? $part['parent_name'] ?? '');
    $parentAddress = trim($input['parent_address'] ?? $part['parent_address'] ?? '');
    $parentPhone = trim($input['parent_phone'] ?? $part['parent_phone'] ?? '');
    $parentJob = trim($input['parent_job'] ?? $part['parent_job'] ?? '');

    $lastEducation = trim($input['last_education'] ?? $part['last_education'] ?? '');
    $organizations = trim($input['organizations'] ?? $part['organizations'] ?? '');

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

    $fields = [
        'full_name' => $fullName,
        'nisn' => $nisn,
        'registration_type' => $registrationType,
        'level' => $level,
        'class_name' => $className ?: null,
        'gender' => $gender,
        'blood_type' => $bloodType,
        'phone' => $phone,
        'emergency_contact' => $emergencyContact,
        'status' => $status,
        'photo_url' => $photoUrl,
        'assignment_letter_url' => $assignmentLetterUrl,
        'birth_place' => $birthPlace,
        'birth_date' => $birthDate,
        'religion' => $religion,
        'is_disabled' => $isDisabled,
        'disability_type' => $disabilityType,
        'address' => $address,
        'email' => $email,
        'school_address' => $schoolAddress ?: null,
        'school_phone' => $schoolPhone ?: null,
        'parent_name' => $parentName ?: null,
        'parent_address' => $parentAddress ?: null,
        'parent_phone' => $parentPhone ?: null,
        'parent_job' => $parentJob ?: null,
        'last_education' => $lastEducation ?: null,
        'organizations' => $organizations ?: null,
        'sub_categories' => $subCategories
    ];

    $setSql = [];
    $updateParams = [];
    foreach ($fields as $colName => $val) {
        $setSql[] = "`$colName` = ?";
        $updateParams[] = $val;
    }
    $updateParams[] = $id;

    $stmtUpdate = $pdo->prepare("UPDATE participants SET " . implode(', ', $setSql) . " WHERE id = ?");
    $stmtUpdate->execute($updateParams);


    // Keep users table in sync with participant's contact, name and email
    if (!empty($part['user_id'])) {
        try {
            $stmtUpdUser = $pdo->prepare("UPDATE users SET full_name = ?, phone = ?, email = ? WHERE id = ?");
            $stmtUpdUser->execute([$fullName, $phone ?: null, $email ?: null, $part['user_id']]);
        } catch (PDOException $e) {
            try {
                $stmtUpdUser = $pdo->prepare("UPDATE users SET email = ? WHERE id = ?");
                $stmtUpdUser->execute([$email ?: null, $part['user_id']]);
            } catch (PDOException $e2) {}
        }
    }

    logActivity('update_participant', 'participants', "Memperbarui data lengkap peserta: {$fullName} ({$part['code']})", [
        'participant_id' => $id,
        'code' => $part['code'],
        'name' => $fullName,
        'unit_id' => $unitId
    ]);

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

        logActivity('delete_participant', 'participants', "Menghapus data peserta: {$part['full_name']} ({$part['code']})", [
            'participant_id' => $partId,
            'code' => $part['code'],
            'name' => $part['full_name'],
            'unit_id' => $part['unit_id']
        ]);

        jsonResponse(['message' => 'Data peserta dan akun pengguna berhasil dihapus.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => 'Gagal menghapus data peserta: ' . $e->getMessage()], 500);
    }
}
