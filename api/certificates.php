<?php
// ==========================================================================
// API CERTIFICATES / PIAGAM PENGHARGAAN (CONFIG, BATCH NUMBER GENERATOR & PRINTING)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Note: Schema updates are managed via database migrations, not runtime requests.

// --------------------------------------------------------------------------
// 1. GET /api/certificates.php?action=config
// --------------------------------------------------------------------------
if ($method === 'GET' && $action === 'config') {
    $settings = getAppSettings();

    // Count stats
    $totalVerified = (int)$pdo->query("SELECT COUNT(*) FROM participants WHERE status = 'verified_kabupaten'")->fetchColumn();
    $totalGenerated = (int)$pdo->query("SELECT COUNT(*) FROM participants WHERE status = 'verified_kabupaten' AND certificate_number IS NOT NULL AND certificate_number != ''")->fetchColumn();

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

    jsonResponse([
        'message' => "Berhasil memicu pembuatan nomor piagam secara masal!",
        'total_processed' => count($participants),
        'total_updated' => $updatedCount
    ]);
}

// --------------------------------------------------------------------------
// 5. GET /api/certificates.php?action=participants (List for preview/print selection)
// --------------------------------------------------------------------------
if ($method === 'GET' && $action === 'participants') {
    $user = requireUser(['kabupaten', 'unit']);
    $unitId = (int)($_GET['unit_id'] ?? 0);
    $search = trim($_GET['search'] ?? '');
    $roleFilter = trim($_GET['role'] ?? '');

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

    $stmt = $pdo->prepare("
        SELECT p.id, p.code, p.full_name, p.level, p.sub_categories, p.certificate_number, p.photo_url, un.name AS unit_name 
        FROM participants p 
        LEFT JOIN units un ON p.unit_id = un.id 
        $whereSql 
        ORDER BY un.name ASC, p.full_name ASC
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'total' => count($rows),
        'participants' => $rows
    ]);
}

jsonResponse(['error' => 'Action tidak ditemukan.'], 404);
