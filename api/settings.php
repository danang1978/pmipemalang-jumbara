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

    // Sensitive Data Protection: Never expose 3rd party API tokens or passwords to guests or non-super-admins
    if (!$user || !in_array($user['role'] ?? '', ['kabupaten'])) {
        unset($settings['fonnte_token']);
        unset($settings['smtp_pass']);
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

// POST Test SMTP Email Connection
if ($method === 'POST' && $action === 'test-smtp') {
    requireUser(['kabupaten']);
    $input = getJsonInput();
    $toEmail = trim($input['to_email'] ?? '');

    if (!$toEmail || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['error' => 'Alamat email tujuan pengujian wajib diisi dan harus berupa email valid.'], 400);
    }

    $settings = getAppSettings();

    // Use parameters from test payload if provided, otherwise fallback to saved DB settings
    $smtpConfig = [
        'smtp_enabled' => '1',
        'smtp_host' => !empty($input['smtp_host']) ? trim($input['smtp_host']) : ($settings['smtp_host'] ?? ''),
        'smtp_port' => !empty($input['smtp_port']) ? intval($input['smtp_port']) : intval($settings['smtp_port'] ?? 587),
        'smtp_secure' => !empty($input['smtp_secure']) ? trim($input['smtp_secure']) : ($settings['smtp_secure'] ?? 'tls'),
        'smtp_user' => isset($input['smtp_user']) ? trim($input['smtp_user']) : ($settings['smtp_user'] ?? ''),
        'smtp_pass' => (isset($input['smtp_pass']) && $input['smtp_pass'] !== '') ? $input['smtp_pass'] : ($settings['smtp_pass'] ?? ''),
        'smtp_from_email' => !empty($input['smtp_from_email']) ? trim($input['smtp_from_email']) : ($settings['smtp_from_email'] ?? ''),
        'smtp_from_name' => !empty($input['smtp_from_name']) ? trim($input['smtp_from_name']) : ($settings['smtp_from_name'] ?? 'PMI Kabupaten Pemalang'),
        'organizer_name' => $settings['organizer_name'] ?? 'Palang Merah Indonesia',
        'contact_email' => $settings['contact_email'] ?? 'sekretariat@jumbara-pmi.or.id'
    ];

    if (empty($smtpConfig['smtp_host'])) {
        jsonResponse(['error' => 'Host SMTP server wajib diisi sebelum melakukan pengujian (Contoh: smtp.gmail.com).'], 400);
    }

    // Save temporary credentials into settings if provided
    if (!empty($input['save_credentials'])) {
        $stmtSave = $pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");
        $stmtSave->execute(['smtp_enabled', '1']);
        $stmtSave->execute(['smtp_host', $smtpConfig['smtp_host']]);
        $stmtSave->execute(['smtp_port', (string)$smtpConfig['smtp_port']]);
        $stmtSave->execute(['smtp_secure', $smtpConfig['smtp_secure']]);
        $stmtSave->execute(['smtp_user', $smtpConfig['smtp_user']]);
        if (!empty($smtpConfig['smtp_pass'])) {
            $stmtSave->execute(['smtp_pass', $smtpConfig['smtp_pass']]);
        }
        if (!empty($smtpConfig['smtp_from_email'])) {
            $stmtSave->execute(['smtp_from_email', $smtpConfig['smtp_from_email']]);
        }
        if (!empty($smtpConfig['smtp_from_name'])) {
            $stmtSave->execute(['smtp_from_name', $smtpConfig['smtp_from_name']]);
        }
    }

    $subject = 'Tes Konfigurasi Gateway Email SMTP - JUMBARA PMR 2026';
    $appName = $settings['app_name'] ?? 'JUMBARA PMR TINGKAT KABUPATEN 2026';
    $timeStr = date('d F Y H:i:s T');

    $html = '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Uji Koneksi SMTP Berhasil</title></head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #334155;">
    <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 22px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px;">✅ UJI KONEKSI EMAIL SMTP BERHASIL</h2>
            <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">' . htmlspecialchars($appName) . '</p>
        </div>
        <div style="padding: 24px;">
            <p style="font-size: 15px; margin-top: 0;">Halo Administrator Jumbara,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Ini adalah email uji coba resmi dari sistem <strong>JUMBARA PMR</strong>. Konfigurasi <strong>Gateway Email SMTP</strong> Anda telah berhasil diverifikasi dan terhubung ke mail server secara optimal!
            </p>
            <table width="100%" cellspacing="0" cellpadding="8" style="background: #f1f5f9; border-radius: 8px; font-size: 13px; margin: 20px 0;">
                <tr><td style="font-weight: 600; width: 38%; color: #64748b;">Host SMTP:</td><td style="color: #0f172a; font-family: monospace;">' . htmlspecialchars($smtpConfig['smtp_host']) . '</td></tr>
                <tr><td style="font-weight: 600; color: #64748b;">Port & Enkripsi:</td><td style="color: #0f172a; font-family: monospace;">' . htmlspecialchars($smtpConfig['smtp_port']) . ' (' . strtoupper($smtpConfig['smtp_secure']) . ')</td></tr>
                <tr><td style="font-weight: 600; color: #64748b;">Pengirim Email:</td><td style="color: #0f172a;">' . htmlspecialchars($smtpConfig['smtp_from_name']) . ' &lt;' . htmlspecialchars($smtpConfig['smtp_from_email']) . '&gt;</td></tr>
                <tr><td style="font-weight: 600; color: #64748b;">Waktu Pengujian:</td><td style="color: #0f172a;">' . htmlspecialchars($timeStr) . '</td></tr>
            </table>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
                Kini sistem akan otomatis mengirimkan bukti pendaftaran, kredensial login (username & password), serta notifikasi verifikasi peserta melalui email ini.
            </p>
        </div>
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
            Palang Merah Indonesia Kabupaten &bull; Structured Native Application
        </div>
    </div>
</body>
</html>';

    $result = sendSmtpMail($toEmail, $subject, $html, $smtpConfig);

    if (!empty($result['status'])) {
        jsonResponse([
            'message' => 'Tes kirim email SMTP ke ' . $toEmail . ' BERHASIL! Silakan periksa inbox / spam email Anda.',
            'result' => $result
        ]);
    } else {
        jsonResponse([
            'error' => 'Gagal mengirim email via SMTP: ' . ($result['error'] ?? 'Terjadi kesalahan pada mail server'),
            'result' => $result
        ], 400);
    }
}

// POST Update Text Settings
if ($method === 'POST') {
    requireUser(['kabupaten']);
    $input = getJsonInput();

    $stmt = $pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");

    // Fetch existing settings to protect uploaded assets from accidental reset
    $stmtProtected = $pdo->query("SELECT `key`, `value` FROM settings WHERE `key` IN ('app_logo', 'event_logo', 'app_favicon', 'app_kop', 'idcard_template')");
    $currentAssets = [];
    while ($row = $stmtProtected->fetch(PDO::FETCH_ASSOC)) {
        $currentAssets[$row['key']] = $row['value'];
    }

    foreach ($input as $f => $valRaw) {
        if (preg_match('/^[a-z0-9_]+$/i', $f)) {
            $val = is_array($valRaw) ? json_encode($valRaw) : (is_string($valRaw) ? trim($valRaw) : (string)$valRaw);

            // Protection: if this field is an asset (logo, kop, template) and the incoming value is empty or default,
            // while the DB already has a custom uploaded file, do NOT overwrite it!
            if (array_key_exists($f, $currentAssets) && !empty($currentAssets[$f])) {
                $cur = $currentAssets[$f];
                if (strpos($cur, 'uploads/') === 0) {
                    if (empty($val) || $val === 'frontend/images/logo-pmi.svg' || $val === 'frontend/images/logo-jumbara-xii.png' || $val === 'frontend/favicon.svg') {
                        continue; // Keep the existing uploaded asset!
                    }
                }
            }

            // Protection: do not overwrite smtp_pass with empty string if not changed by admin
            if ($f === 'smtp_pass' && ($val === '' || $val === null)) {
                continue;
            }

            $stmt->execute([$f, $val]);
        }
    }

    logActivity('update_settings', 'settings', "Admin memperbarui konfigurasi sistem & pengaturan database", array_keys($input));

    jsonResponse(['message' => 'Pengaturan Jumbara, Fonnte WA & SMTP Gateway berhasil diperbarui ke MySQL!']);
}

