<?php
// ==========================================================================
// API SETTINGS & FILE UPLOAD (LOGO, FAVICON, APP NAME, JUMBOTRON)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET Settings (Public access allowed for branding & schedule, sensitive tokens filtered)
if ($method === 'GET') {
    $settings = getAppSettings();
    $user = getCurrentUser();

    // Sensitive Data Protection: Never expose 3rd party API tokens to guests or non-super-admins
    if (!$user || !in_array($user['role'] ?? '', ['kabupaten'])) {
        unset($settings['fonnte_token']);
    }

    jsonResponse($settings);
}

// POST Upload File (Logo / Favicon / Jumbotron Hero)
if ($method === 'POST' && ($action === 'upload' || $action === 'upload-jumbotron')) {
    requireUser(['kabupaten']);

    $input = getJsonInput();
    $fileData = $input['file_data'] ?? '';
    $type = $input['type'] ?? ($action === 'upload-jumbotron' ? 'jumbotron' : 'logo');

    if (!$fileData) {
        jsonResponse(['error' => 'Data gambar base64 wajib diisi.'], 400);
    }

    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
    }
    if (!is_writable($uploadDir)) {
        @chmod($uploadDir, 0777);
    }
    if (!is_writable($uploadDir)) {
        jsonResponse(['error' => 'Folder uploads/ di server hosting tidak memiliki izin tulis (Permission Denied). Jalankan perintah berikut di terminal server: sudo chown -R www:www uploads && sudo chmod -R 775 uploads'], 500);
    }

    $relativeUrl = saveBase64File($fileData, $type);
    if (!$relativeUrl) {
        jsonResponse(['error' => 'Gagal mengunggah berkas. Format harus berupa gambar JPG, PNG, WEBP, atau SVG valid (Maks. 10MB).'], 400);
    }
    
    if ($action === 'upload-jumbotron' || $type === 'jumbotron') {
        // Fetch existing images array
        $stmtGet = $pdo->query("SELECT `value` FROM settings WHERE `key` = 'jumbotron_images'");
        $existingJson = $stmtGet->fetchColumn();
        $images = $existingJson ? json_decode($existingJson, true) : [];
        if (!is_array($images)) $images = [];
        
        $images[] = $relativeUrl;
        $newJson = json_encode(array_values($images));

        $stmtSave = $pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES ('jumbotron_images', ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");
        $stmtSave->execute([$newJson]);

        jsonResponse([
            'message' => 'Gambar Jumbotron Carousel berhasil diunggah & ditambahkan ke MySQL!',
            'url' => $relativeUrl,
            'images' => $images
        ]);
    } else {
        $dbKey = 'app_logo';
        if ($type === 'favicon') $dbKey = 'app_favicon';
        else if ($type === 'kop' || $type === 'app_kop') $dbKey = 'app_kop';
        else if ($type === 'event_logo' || $type === 'jumbara_logo' || $type === 'logo_jumbara') $dbKey = 'event_logo';
        else if ($type === 'idcard_template' || $type === 'template_idcard') $dbKey = 'idcard_template';

        // Delete old file from uploads directory if exists
        $stmtOld = $pdo->prepare("SELECT `value` FROM settings WHERE `key` = ?");
        $stmtOld->execute([$dbKey]);
        $oldFile = $stmtOld->fetchColumn();

        if ($oldFile && strpos($oldFile, 'uploads/') === 0) {
            $cleanFileName = basename($oldFile);
            $oldPath = __DIR__ . '/../uploads/' . $cleanFileName;
            if (file_exists($oldPath) && is_file($oldPath)) {
                @unlink($oldPath);
            }
        }

        $stmt = $pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");
        $stmt->execute([$dbKey, $relativeUrl]);

        jsonResponse([
            'message' => 'Berkas ' . strtoupper($type) . ' berhasil diunggah & disimpan ke MySQL!',
            'url' => $relativeUrl,
            'key' => $dbKey
        ]);
    }
}

// POST Reset Setting File to Default (Logo, Favicon, Kop, ID Card Template)
if ($method === 'POST' && $action === 'reset-file') {
    requireUser(['kabupaten']);
    $input = getJsonInput();
    $type = $input['type'] ?? 'logo';

    $dbKey = 'app_logo';
    $defaultVal = 'frontend/images/logo-pmi.svg';
    if ($type === 'event_logo' || $type === 'jumbara_logo' || $type === 'logo_jumbara') {
        $dbKey = 'event_logo';
        $defaultVal = 'frontend/images/logo-jumbara-xii.png';
    } else if ($type === 'favicon') {
        $dbKey = 'app_favicon';
        $defaultVal = 'frontend/favicon.svg';
    } else if ($type === 'kop' || $type === 'app_kop') {
        $dbKey = 'app_kop';
        $defaultVal = '';
    } else if ($type === 'idcard_template' || $type === 'template_idcard') {
        $dbKey = 'idcard_template';
        $defaultVal = '';
    }

    // Unlink old file if in uploads
    $stmtOld = $pdo->prepare("SELECT `value` FROM settings WHERE `key` = ?");
    $stmtOld->execute([$dbKey]);
    $oldFile = $stmtOld->fetchColumn();

    if ($oldFile && strpos($oldFile, 'uploads/') === 0) {
        $cleanFileName = basename($oldFile);
        $oldPath = __DIR__ . '/../uploads/' . $cleanFileName;
        if (file_exists($oldPath) && is_file($oldPath)) {
            @unlink($oldPath);
        }
    }

    $stmt = $pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");
    $stmt->execute([$dbKey, $defaultVal]);

    jsonResponse([
        'message' => 'File ' . strtoupper($type) . ' berhasil dikembalikan ke default!',
        'default_value' => $defaultVal
    ]);
}

// POST Test Fonnte WA Gateway Connection
if ($method === 'POST' && $action === 'test-fonnte') {
    requireUser(['kabupaten']);
    $input = getJsonInput();
    $phone = trim($input['phone'] ?? '');
    $message = trim($input['message'] ?? 'Tes Koneksi Fonnte WA Gateway JUMBARA PMR 2026 Berhasil!');

    if (!$phone) {
        jsonResponse(['error' => 'Nomor WhatsApp tujuan tes wajib diisi.'], 400);
    }

    // Save token if provided in payload temporarily
    if (!empty($input['fonnte_token'])) {
        $stmtSave = $pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES ('fonnte_token', ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");
        $stmtSave->execute([trim($input['fonnte_token'])]);
        $stmtSave2 = $pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES ('fonnte_enabled', '1') ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");
        $stmtSave2->execute();
    }

    $result = sendFonnteWhatsApp($phone, $message);

    if ($result['status']) {
        jsonResponse([
            'message' => 'Pesan tes WhatsApp Fonnte berhasil dikirim ke ' . $phone . '!',
            'result' => $result
        ]);
    } else {
        jsonResponse([
            'error' => 'Gagal mengirim pesan via Fonnte: ' . ($result['reason'] ?? 'Token tidak valid / WA belum terhubung'),
            'result' => $result
        ], 400);
    }
}

// POST Update Text Settings
if ($method === 'POST') {
    requireUser(['kabupaten']);
    $input = getJsonInput();

    $stmt = $pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");

    foreach ($input as $f => $valRaw) {
        if (preg_match('/^[a-z0-9_]+$/i', $f)) {
            $val = is_array($valRaw) ? json_encode($valRaw) : (is_string($valRaw) ? trim($valRaw) : (string)$valRaw);
            $stmt->execute([$f, $val]);
        }
    }

    jsonResponse(['message' => 'Pengaturan Jumbara & Fonnte WA Gateway berhasil diperbarui ke MySQL!']);
}

