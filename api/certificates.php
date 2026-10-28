<?php
// ==========================================================================
// API CERTIFICATES / PIAGAM PENGHARGAAN (CONFIG, BATCH NUMBER GENERATOR & PRINTING)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// --------------------------------------------------------------------------
// 1. GET /api/certificates.php?action=config
// --------------------------------------------------------------------------
if ($method === 'GET' && $action === 'config') {
    $settings = getAppSettings();

    // Count stats (with self-healing if certificate_number is missing in legacy databases)
    $totalVerified = (int)$pdo->query("SELECT COUNT(*) FROM participants WHERE status = 'verified_kabupaten'")->fetchColumn();
    $totalGenerated = 0;
    try {
        $totalGenerated = (int)$pdo->query("SELECT COUNT(*) FROM participants WHERE status = 'verified_kabupaten' AND certificate_number IS NOT NULL AND certificate_number != ''")->fetchColumn();
    } catch (\Throwable $e) {
        $totalGenerated = 0;
    }

    jsonResponse([
        'settings' => $settings,
        'stats' => [
            'total_verified' => $totalVerified,
            'total_generated' => $totalGenerated
        ]
    ]);
}

// --------------------------------------------------------------------------
// 2. POST /api/certificates.php?action=save_config
// --------------------------------------------------------------------------
if ($method === 'POST' && $action === 'save_config') {
    requireUser(['kabupaten']);
    $input = getJsonInput();

    $keys = [
        'piagam_header_logo',
        'piagam_title_top',
        'piagam_title_main',
        'piagam_number_format',
        'piagam_text_given_to',
        'piagam_text_as',
        'piagam_event_line1',
        'piagam_event_line2',
        'piagam_city_date',
        'piagam_org_line1',
        'piagam_org_line2',
        'piagam_org_line3',
        'piagam_signer_title',
        'piagam_signer_name',
        'piagam_signature_image',
        'piagam_stamp_image',
        'piagam_show_qr'
    ];

    $stmtUpsert = $pdo->prepare("
        INSERT INTO settings (`key`, `value`) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)
    ");

    foreach ($keys as $k) {
        if (array_key_exists($k, $input)) {
            $val = is_array($input[$k]) ? json_encode($input[$k]) : (string)$input[$k];
            $stmtUpsert->execute([$k, $val]);
        }
    }

    jsonResponse(['message' => 'Pengaturan Piagam Penghargaan berhasil disimpan!']);
}

// --------------------------------------------------------------------------
// 3. POST /api/certificates.php?action=upload_asset (Signature / Stamp / Kop)
// --------------------------------------------------------------------------
if ($method === 'POST' && $action === 'upload_asset') {
    requireUser(['kabupaten']);
    $input = getJsonInput();
    $fileData = $input['file_data'] ?? '';
    $assetType = $input['asset_type'] ?? 'signature'; // signature, stamp, kop

    $relativeUrl = saveBase64File($fileData, 'piagam_' . $assetType);
    if (!$relativeUrl) {
        jsonResponse(['error' => 'Gagal mengunggah berkas. Format harus berupa gambar JPG, PNG, WEBP, atau SVG valid.'], 400);
    }

    $settingKey = 'piagam_' . ($assetType === 'kop' ? 'header_logo' : ($assetType === 'stamp' ? 'stamp_image' : 'signature_image'));

    $stmtUpsert = $pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");
    $stmtUpsert->execute([$settingKey, $relativeUrl]);

    jsonResponse([
        'message' => 'Gambar ' . $assetType . ' berhasil diunggah!',
        'url' => $relativeUrl,
        'key' => $settingKey
    ]);
}

// --------------------------------------------------------------------------
// 4. POST /api/certificates.php?action=generate_numbers
// --------------------------------------------------------------------------
if ($method === 'POST' && $action === 'generate_numbers') {
    requireUser(['kabupaten']);
    $input = getJsonInput();
    $force = !empty($input['force']); // overwrite existing numbers
    $startNo = (int)($input['start_no'] ?? 1);
    if ($startNo < 1) $startNo = 1;

    $settings = getAppSettings();
    $pattern = $settings['piagam_number_format'] ?: '{NO}/02.05/JUMTEK-II/IX/2025';

    // Fetch verified participants
    $unitId = (int)($input['unit_id'] ?? 0);
    $whereSql = "WHERE p.status = 'verified_kabupaten'";
    $params = [];
    if ($unitId > 0) {
        $whereSql .= " AND p.unit_id = ?";
        $params[] = $unitId;
    }

    try {
        $stmtP = $pdo->prepare("
            SELECT p.id, p.full_name, p.certificate_number, un.name AS unit_name 
            FROM participants p 
            LEFT JOIN units un ON p.unit_id = un.id 
            $whereSql 
            ORDER BY p.unit_id ASC, p.full_name ASC
        ");
        $stmtP->execute($params);
        $participants = $stmtP->fetchAll(PDO::FETCH_ASSOC);

        $counter = $startNo;
        $updatedCount = 0;

        $pdo->beginTransaction();
        $stmtUp = $pdo->prepare("UPDATE participants SET certificate_number = ? WHERE id = ?");

        foreach ($participants as $p) {
            if ($force || empty($p['certificate_number'])) {
                $formattedNo = sprintf('%04d', $counter);
                $certNum = str_replace('{NO}', $formattedNo, $pattern);
                $stmtUp->execute([$certNum, $p['id']]);
                $updatedCount++;
                $counter++;
            }
        }
        $pdo->commit();

        jsonResponse([
            'message' => "Berhasil memicu pembuatan nomor piagam secara masal!",
            'total_processed' => count($participants),
            'total_updated' => $updatedCount
        ]);
    } catch (\PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonResponse([
            'error' => 'Gagal memproses nomor piagam: ' . $e->getMessage()
        ], 500);
    }
}

// --------------------------------------------------------------------------
// 5. GET /api/certificates.php?action=participants (List for preview/print selection)
// --------------------------------------------------------------------------
if ($method === 'GET' && $action === 'participants') {
    $user = requireUser(['kabupaten', 'unit']);
    $unitId = (int)($_GET['unit_id'] ?? 0);
    $search = trim($_GET['search'] ?? '');
    $roleFilter = trim($_GET['role'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $all = isset($_GET['all']) && $_GET['all'] === 'true';
    $limit = $all ? 1000 : max(1, min(200, (int)($_GET['limit'] ?? 100)));
    $offset = ($page - 1) * $limit;

    $whereSql = "WHERE p.status = 'verified_kabupaten'";
    $params = [];

    // If logged in as unit admin, strictly restrict to own unit
    if ($user['role'] === 'unit') {
        $whereSql .= " AND p.unit_id = ?";
        $params[] = $user['unit_id'];
    } else if ($unitId > 0) {
        $whereSql .= " AND p.unit_id = ?";
        $params[] = $unitId;
    }

    if ($search) {
        $whereSql .= " AND (p.full_name LIKE ? OR p.code LIKE ? OR p.certificate_number LIKE ?)";
        $s = "%$search%";
        $params[] = $s;
        $params[] = $s;
        $params[] = $s;
    }

    if ($roleFilter) {
        $whereSql .= " AND (p.level = ? OR p.sub_categories LIKE ?)";
        $params[] = $roleFilter;
        $params[] = "%$roleFilter%";
    }

    try {
        $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM participants p $whereSql");
        $stmtCount->execute($params);
        $totalRecords = (int)$stmtCount->fetchColumn();

        $stmt = $pdo->prepare("
            SELECT p.id, p.code, p.full_name, p.level, p.sub_categories, p.certificate_number, p.photo_url, un.name AS unit_name 
            FROM participants p 
            LEFT JOIN units un ON p.unit_id = un.id 
            $whereSql 
            ORDER BY un.name ASC, p.full_name ASC
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse([
            'total' => $totalRecords,
            'participants' => $rows,
            'pagination' => [
                'total' => $totalRecords,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => (int)ceil($totalRecords / $limit) ?: 1
            ]
        ]);
    } catch (\PDOException $e) {
        jsonResponse(['error' => 'Gagal memuat peserta piagam: ' . $e->getMessage()], 500);
    }
}

jsonResponse(['error' => 'Action tidak ditemukan.'], 404);
