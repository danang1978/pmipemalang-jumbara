<?php
// ==========================================================================
// HELPER FUNCTIONS & SESSION MANAGEMENT
// ==========================================================================

if (!ob_get_level()) {
    ob_start();
}

if (session_status() === PHP_SESSION_NONE) {
    if (!headers_sent()) {
        $cookieParams = [
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
            'httponly' => true,
            'samesite' => 'Lax'
        ];
        session_set_cookie_params($cookieParams);
        session_start();
    } else {
        @session_start();
    }
}

require_once __DIR__ . '/../config/database.php';

// Dynamic Base URL Helper (Supports MAMP subfolders like /jumbara/ regardless of trailing slash)
function getBaseUrl() {
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '/index.php';
    $dir = dirname($scriptName);
    $dir = str_replace('\\', '/', $dir);
    if (basename($dir) === 'api' || basename($dir) === 'includes') {
        $dir = dirname($dir);
    }
    $dir = rtrim(str_replace('\\', '/', $dir), '/');
    return ($dir === '' || $dir === '.') ? '/' : $dir . '/';
}

// Send JSON Response Helper
function jsonResponse($data, $statusCode = 200) {
    if (ob_get_length()) {
        ob_clean();
    }
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

// Get JSON Input Helper
function getJsonInput() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

// Get Current Logged-in User
function getCurrentUser() {
    return $_SESSION['user'] ?? null;
}

// Require Login Guard
function requireUser($allowedRoles = []) {
    $user = getCurrentUser();
    if (!$user) {
        jsonResponse(['error' => 'Akses ditolak. Silakan login terlebih dahulu.'], 401);
    }
    if (!empty($allowedRoles) && !in_array($user['role'], $allowedRoles)) {
        jsonResponse(['error' => 'Anda tidak memiliki hak akses untuk tindakan ini.'], 403);
    }
    return $user;
}

// Fetch all settings from MySQL table with static in-memory caching
function getAppSettings($forceRefresh = false) {
    static $cachedSettings = null;
    if ($cachedSettings !== null && !$forceRefresh) {
        return $cachedSettings;
    }

    $pdo = getPDOConnection();
    try {
        $stmt = $pdo->query("SELECT `key`, `value` FROM settings");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $settings = [
            'app_name' => 'JUMBARA PMR TINGKAT KABUPATEN 2026',
            'organizer_name' => 'Palang Merah Indonesia Kabupaten',
            'jumbotron_title' => 'Jumpa Bakti Gembira Palang Merah Remaja',
            'jumbotron_subtitle' => 'Ajang Silaturahmi, Edukasi, Pengabdian, dan Kompetisi Tri Bakti PMR (Mula, Madya, Wira)',
            'event_dates' => '15 - 17 Oktober 2026',
            'event_location' => 'Buperta Utama PMI Kabupaten',
            'event_location_address' => 'Markas PMI Kabupaten Pemalang, Jl. Gatot Subroto No. 23, Bojongbata, Pemalang',
            'event_map_embed' => 'https://maps.google.com/maps?q=Markas+PMI+Kabupaten+Pemalang&t=&z=15&ie=UTF8&iwloc=&output=embed',
            'event_map_url' => 'https://maps.google.com/?q=Markas+PMI+Kabupaten+Pemalang',
            'contact_phone' => '(021) 555-PMR-2026',
            'contact_email' => 'sekretariat@jumbara-pmi.or.id',
            'contact_address' => 'Jl. Palang Merah No. 1, Markas PMI Kabupaten',
            'contact_hours' => 'Senin - Jumat: 08.00 - 16.00 WIB',
            'contact_wa' => '081234567890',
            'footer_about' => 'Ajang evaluasi dan pembinaan generasi muda Palang Merah Remaja (Mula, Madya, Wira) dalam mewujudkan Tri Bakti PMR.',
            'footer_copyright' => '© 2026 Palang Merah Indonesia Kabupaten. Structured Native PHP & MySQL Application.',
            'app_logo' => 'frontend/images/logo-pmi.svg',
            'event_logo' => 'frontend/images/logo-jumbara-xii.png',
            'app_favicon' => 'frontend/favicon.svg',
            'app_kop' => '',
            'reg_deadline' => '2026-10-14T23:59',
            'reg_active' => '1',
            'idcard_template' => '',
            'idcard_event_title' => 'JUMBARA PMR IX',
            'idcard_event_subtitle' => 'PALANG MERAH INDONESIA TAHUN 2026',
            'idcard_motto' => '#JUMBARAPMR2026',
            'idcard_date' => 'Kabupaten, 2026',
            'idcard_cat_y' => '138',
            'idcard_photo_x' => '0',
            'idcard_photo_y' => '0',
            'idcard_photo_w' => '110',
            'idcard_photo_h' => '145',
            'idcard_name_y' => '0',
            'idcard_name_size' => '17',
            'idcard_unit_y' => '0',
            'idcard_unit_size' => '13',
            'idcard_qr_x' => '0',
            'idcard_qr_y' => '0',
            'idcard_qr_size' => '55',
            'idcard_paper_size' => 'a4',
            'idcard_grid_cols' => '2',
            'fonnte_token' => '',
            'fonnte_enabled' => '0',
            'smtp_enabled' => '0',
            'smtp_host' => '',
            'smtp_port' => '587',
            'smtp_secure' => 'tls',
            'smtp_user' => '',
            'smtp_pass' => '',
            'smtp_from_email' => '',
            'smtp_from_name' => 'PMI Kabupaten Pemalang',
            'menu_config' => '{}',
            'menu_settings' => '{}',
            'jumbotron_images' => json_encode([
                'frontend/images/jumbotron-tema1-cerdas.jpg',
                'frontend/images/jumbotron-tema2-ceria.jpg',
                'frontend/images/jumbotron-tema3-bersahabat.jpg'
            ]),
            'piagam_header_logo' => '',
            'piagam_title_top' => 'Menyampaikan',
            'piagam_title_main' => 'PENGHARGAAN',
            'piagam_number_format' => '{NO}/02.05/JUMBARA-PMR/X/2026',
            'piagam_text_given_to' => 'Diberikan kepada:',
            'piagam_text_as' => 'Sebagai',
            'piagam_event_line1' => 'Jumbara & Temu Karya PMI Daerah Istimewa Yogyakarta Tahun 2026',
            'piagam_event_line2' => 'Jaka Garong, 27-29 September 2026',
            'piagam_city_date' => 'Yogyakarta, 29 September 2026',
            'piagam_org_line1' => 'Pengurus Daerah',
            'piagam_org_line2' => 'PALANG MERAH INDONESIA',
            'piagam_org_line3' => 'Daerah Istimewa Yogyakarta',
            'piagam_signer_title' => 'Ketua,',
            'piagam_signer_name' => 'GBPH. H. Prabukusumo, S.Psi.',
            'piagam_signature_image' => '',
            'piagam_stamp_image' => '',
            'piagam_show_qr' => '1'
        ];
        foreach ($rows as $r) {
            $settings[$r['key']] = $r['value'];
        }
        $cachedSettings = $settings;
        return $settings;
    } catch (Exception $e) {
        return [
            'app_name' => 'JUMBARA PMR TINGKAT KABUPATEN 2026',
            'organizer_name' => 'Palang Merah Indonesia Kabupaten',
            'app_logo' => 'frontend/images/logo-pmi.svg',
            'event_logo' => 'frontend/images/logo-jumbara-xii.png',
            'app_favicon' => 'frontend/favicon.svg',
            'app_kop' => '',
            'idcard_template' => '',
            'idcard_event_title' => 'JUMBARA PMR IX',
            'idcard_event_subtitle' => 'PALANG MERAH INDONESIA TAHUN 2026',
            'idcard_motto' => '#JUMBARAPMR2026',
            'event_dates' => '15 - 17 Oktober 2026',
            'event_location' => 'Buperta Utama PMI Kabupaten',
            'event_location_address' => 'Markas PMI Kabupaten Pemalang, Jl. Gatot Subroto No. 23, Bojongbata, Pemalang',
            'event_map_embed' => 'https://maps.google.com/maps?q=Markas+PMI+Kabupaten+Pemalang&t=&z=15&ie=UTF8&iwloc=&output=embed',
            'event_map_url' => 'https://maps.google.com/?q=Markas+PMI+Kabupaten+Pemalang',
            'contact_phone' => '(021) 555-PMR-2026',
            'contact_email' => 'sekretariat@jumbara-pmi.or.id',
            'contact_address' => 'Jl. Palang Merah No. 1, Markas PMI Kabupaten',
            'contact_hours' => 'Senin - Jumat: 08.00 - 16.00 WIB',
            'contact_wa' => '081234567890',
            'footer_about' => 'Ajang evaluasi dan pembinaan generasi muda Palang Merah Remaja (Mula, Madya, Wira) dalam mewujudkan Tri Bakti PMR.',
            'footer_copyright' => '© 2026 Palang Merah Indonesia Kabupaten. Structured Native PHP & MySQL Application.',
            'reg_deadline' => '2026-10-14T23:59',
            'reg_active' => '1',
            'fonnte_token' => '',
            'fonnte_enabled' => '0',
            'smtp_enabled' => '0',
            'smtp_host' => '',
            'smtp_port' => '587',
            'smtp_secure' => 'tls',
            'smtp_user' => '',
            'smtp_pass' => '',
            'smtp_from_email' => '',
            'smtp_from_name' => 'PMI Kabupaten Pemalang',
            'jumbotron_images' => json_encode([
                'frontend/images/jumbotron-tema1-cerdas.jpg',
                'frontend/images/jumbotron-tema2-ceria.jpg',
                'frontend/images/jumbotron-tema3-bersahabat.jpg'
            ])
        ];
    }
}

// Secure Base64 File Saver Helper with Whitelisting & XSS Protection
if (!function_exists('saveBase64File')) {
    function saveBase64File($fileData, $prefix = 'file') {
        if (!$fileData || strpos($fileData, 'data:') !== 0) {
            return null;
        }
        if (!preg_match('/^data:([^;]+);base64,(.+)$/', $fileData, $matches)) {
            return null;
        }

        $mime = strtolower(trim($matches[1]));
        $base64 = $matches[2];

        // Safe extension mapping (JPG and PNG are primary formats)
        $ext = null;
        if (strpos($mime, 'jpeg') !== false || strpos($mime, 'jpg') !== false) {
            $ext = 'jpg';
        } else if (strpos($mime, 'png') !== false) {
            $ext = 'png';
        } else if (strpos($mime, 'webp') !== false) {
            $ext = 'webp';
        } else if ((strpos($mime, 'icon') !== false || strpos($mime, 'ico') !== false) && $prefix === 'favicon') {
            $ext = 'ico';
        } else if (strpos($mime, 'pdf') !== false && ($prefix === 'surattugas' || $prefix === 'file')) {
            $ext = 'pdf';
        } else if (strpos($mime, 'svg') !== false && ($prefix === 'logo' || $prefix === 'favicon' || $prefix === 'event_logo' || $prefix === 'jumbara_logo' || $prefix === 'kop' || $prefix === 'app_kop')) {
            $ext = 'svg';
        }

        // Reject disallowed extensions or executable mime types
        if (!$ext) {
            return null;
        }

        $decoded = base64_decode($base64, true);
        if ($decoded === false) {
            return null;
        }

        // Limit file size to 10MB maximum
        if (strlen($decoded) > 10 * 1024 * 1024) {
            return null;
        }

        // Extra sanitization for SVG files to block stored XSS
        if ($ext === 'svg') {
            if (stripos($decoded, '<script') !== false || stripos($decoded, 'javascript:') !== false || preg_match('/on[a-z]+\s*=/i', $decoded)) {
                return null;
            }
        }

        $uploadDir = __DIR__ . '/../uploads/';
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0777, true);
        }
        if (!is_writable($uploadDir)) {
            @chmod($uploadDir, 0777);
        }

        $safePrefix = preg_replace('/[^a-zA-Z0-9_-]/', '', $prefix);
        $randomHex = bin2hex(random_bytes(4));
        $fileName = $safePrefix . '_' . time() . '_' . $randomHex . '.' . $ext;
        $filePath = $uploadDir . $fileName;

        if (@file_put_contents($filePath, $decoded) !== false) {
            @chmod($filePath, 0666);
            return 'uploads/' . $fileName;
        }
        return null;
    }
}

// Fonnte WhatsApp API Integration Helper
if (!function_exists('sendFonnteWhatsApp')) {
    function sendFonnteWhatsApp($targetPhone, $message) {
        $settings = getAppSettings();
        $enabled = !empty($settings['fonnte_enabled']) && ($settings['fonnte_enabled'] === '1' || $settings['fonnte_enabled'] === 1 || $settings['fonnte_enabled'] === true);
        $token = trim($settings['fonnte_token'] ?? '');

        if (!$enabled || !$token || !$targetPhone || !$message) {
            return [
                'status' => false,
                'reason' => 'Fonnte WA Gateway dinonaktifkan atau Token API belum diisi.'
            ];
        }

        $phone = preg_replace('/[^0-9]/', '', $targetPhone);
        if (strpos($phone, '0') === 0) {
            $phone = '62' . substr($phone, 1);
        }

        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://api.fonnte.com/send',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => array(
                'target' => $phone,
                'message' => $message,
                'countryCode' => '62'
            ),
            CURLOPT_HTTPHEADER => array(
                'Authorization: ' . $token
            ),
        ));

        $response = curl_exec($curl);
        $err = curl_error($curl);
        curl_close($curl);

        if ($err) {
            return ['status' => false, 'reason' => 'cURL Error: ' . $err];
        }

        $result = json_decode($response, true);
        return [
            'status' => isset($result['status']) ? (bool)$result['status'] : true,
            'response' => $result
        ];
    }
}

if (!function_exists('buildWhatsAppRegistrationMessage')) {
    function buildWhatsAppRegistrationMessage($fullName, $participantCode, $level, $registrationType, $unitName, $username, $password, $loginUrl = '') {
        $settings = getAppSettings();
        $appName = $settings['app_name'] ?? 'JUMBARA PMR TINGKAT KABUPATEN 2026';
        $orgName = $settings['organizer_name'] ?? 'PMI Kabupaten Pemalang';

        if (!$loginUrl) {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8888';
            $scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
            $baseDir = rtrim(str_replace(['/api', '\\api'], '', $scriptDir), '/');
            $loginUrl = $protocol . $host . $baseDir . '/#login';
        }

        return "Halo *{$fullName}*,\n\n"
            . "Pendaftaran Anda untuk kegiatan *{$appName}* ({$orgName}) telah *BERHASIL DITERIMA & DIDAFTARKAN!*\n\n"
            . "📋 *RINCIAN PENDAFTARAN RESMI:*\n"
            . "• Kode Registrasi: *{$participantCode}*\n"
            . "• Nama Lengkap: *{$fullName}*\n"
            . "• Kategori / Unsur: *{$registrationType}* ({$level})\n"
            . "• Kontingen Unit: *{$unitName}*\n\n"
            . "================================\n"
            . "🔑 *AKUN LOGIN PORTAL RESMI ANDA:*\n"
            . "• Username: *{$username}*\n"
            . "• Password: *{$password}*\n"
            . "• Link Login: {$loginUrl}\n"
            . "================================\n\n"
            . "📌 *Panduan Login & Akses:*\n"
            . "1. Gunakan Username dan Password di atas untuk login ke portal resmi.\n"
            . "2. Anda juga dapat login menggunakan Username, Alamat Email, atau Kode Registrasi ({$participantCode}).\n"
            . "3. Melalui portal, Anda dapat memantau status verifikasi berkas, presensi QR code, jadwal kegiatan, dan mencetak ID Card resmi.\n\n"
            . "Salam Kemanusiaan,\n"
            . "*Panitia Pelaksana Jumbara PMR*\n"
            . "*{$orgName}*";
    }
}

if (!function_exists('buildWhatsAppRegistrationUrl')) {
    function buildWhatsAppRegistrationUrl($targetPhone, $fullName, $participantCode, $level, $registrationType, $unitName, $username, $password, $loginUrl = '') {
        $message = buildWhatsAppRegistrationMessage($fullName, $participantCode, $level, $registrationType, $unitName, $username, $password, $loginUrl);
        $phone = preg_replace('/[^0-9]/', '', $targetPhone);
        if (strpos($phone, '0') === 0) {
            $phone = '62' . substr($phone, 1);
        } elseif (strpos($phone, '8') === 0) {
            $phone = '62' . $phone;
        }
        return 'https://api.whatsapp.com/send?phone=' . $phone . '&text=' . rawurlencode($message);
    }
}

if (!function_exists('sendRegistrationEmail')) {
    function sendRegistrationEmail($toEmail, $fullName, $participantCode, $level, $registrationType, $unitName, $username, $password, $loginUrl = '') {
        if (empty($toEmail) || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $settings = getAppSettings();
        $appName = $settings['app_name'] ?? 'JUMBARA PMR TINGKAT KABUPATEN 2026';
        $orgName = $settings['organizer_name'] ?? 'Palang Merah Indonesia Kabupaten Pemalang';
        $contactEmail = $settings['contact_email'] ?? 'sekretariat@jumbara-pmi.or.id';
        $contactPhone = $settings['contact_phone'] ?? '(0284) 321-PMI';
        $contactAddress = $settings['contact_address'] ?? 'Markas PMI Kabupaten Pemalang';

        if (!$loginUrl) {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8888';
            $scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
            $baseDir = rtrim(str_replace(['/api', '\\api'], '', $scriptDir), '/');
            $loginUrl = $protocol . $host . $baseDir . '/#login';
        }

        $subject = "Bukti Pendaftaran & Akun Login {$appName} - [{$participantCode}]";

        $html = '<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . htmlspecialchars($subject) . '</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 20px 10px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                    
                    <!-- HEADER KOP RESMI -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%); padding: 26px 24px; text-align: center; color: #ffffff;">
                            <div style="font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #fecaca; margin-bottom: 4px;">
                                ' . htmlspecialchars($orgName) . '
                            </div>
                            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                                ' . htmlspecialchars($appName) . '
                            </h1>
                            <div style="font-size: 12px; margin-top: 6px; color: #fee2e2;">
                                Surat Konfirmasi Pendaftaran & Akun Portal Resmi
                            </div>
                        </td>
                    </tr>

                    <!-- CONTENT BODY -->
                    <tr>
                        <td style="padding: 28px 24px;">
                            <p style="margin-top: 0; font-size: 15px; color: #334155;">
                                Halo <strong>' . htmlspecialchars($fullName) . '</strong>,
                            </p>
                            <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
                                Selamat! Pendaftaran Anda sebagai <strong>' . htmlspecialchars($registrationType) . '</strong> pada kegiatan <strong>' . htmlspecialchars($appName) . '</strong> telah <strong>BERHASIL DITERIMA</strong> di sistem pusat.
                            </p>

                            <!-- KODE PENDAFTARAN BADGE -->
                            <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 22px;">
                                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px;">
                                    Kode Registrasi Resmi Peserta
                                </div>
                                <div style="font-size: 22px; font-weight: 800; color: #b91c1c; letter-spacing: 1.5px; margin-top: 4px;">
                                    ' . htmlspecialchars($participantCode) . '
                                </div>
                            </div>

                            <!-- TABEL RINCIAN -->
                            <table width="100%" cellspacing="0" cellpadding="8" border="0" style="font-size: 13px; border-collapse: collapse; margin-bottom: 22px; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 6px;">
                                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                    <td style="width: 38%; color: #64748b; font-weight: 600;">Nama Lengkap</td>
                                    <td style="color: #0f172a; font-weight: 700;">' . htmlspecialchars($fullName) . '</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="color: #64748b; font-weight: 600;">Kategori / Unsur</td>
                                    <td style="color: #0f172a;">' . htmlspecialchars($registrationType) . ' (' . htmlspecialchars($level) . ')</td>
                                </tr>
                                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                    <td style="color: #64748b; font-weight: 600;">Kontingen / Unit</td>
                                    <td style="color: #0f172a;">' . htmlspecialchars($unitName) . '</td>
                                </tr>
                                <tr>
                                    <td style="color: #64748b; font-weight: 600;">Status Saat Ini</td>
                                    <td><span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 12px;">Menunggu Verifikasi Unit & PMI</span></td>
                                </tr>
                            </table>

                            <!-- BOX AKUN LOGIN PORTAL -->
                            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #93c5fd; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
                                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                                    <span style="font-size: 16px; font-weight: 800; color: #1e40af;">
                                        🔑 AKUN LOGIN PORTAL RESMI ANDA
                                    </span>
                                </div>
                                <table width="100%" cellspacing="0" cellpadding="6" border="0" style="font-size: 14px; background: #ffffff; border-radius: 8px; border: 1px solid #bfdbfe; margin-bottom: 12px;">
                                    <tr>
                                        <td style="width: 35%; color: #475569; font-weight: 600; padding-left: 12px;">Username:</td>
                                        <td style="color: #1e3a8a; font-weight: 800; font-family: monospace; font-size: 15px;">' . htmlspecialchars($username) . '</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #475569; font-weight: 600; padding-left: 12px;">Password:</td>
                                        <td style="color: #1e3a8a; font-weight: 800; font-family: monospace; font-size: 15px;">' . htmlspecialchars($password) . '</td>
                                    </tr>
                                </table>
                                <p style="margin: 0; font-size: 12px; color: #3b82f6; line-height: 1.4;">
                                    💡 <em>Anda juga dapat login ke portal menggunakan Username, Alamat Email ini, atau Kode Registrasi (' . htmlspecialchars($participantCode) . ') dengan password di atas.</em>
                                </p>
                            </div>

                            <!-- TOMBOL LOGIN PORTAL -->
                            <div style="text-align: center; margin-bottom: 24px;">
                                <a href="' . htmlspecialchars($loginUrl) . '" target="_blank" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 10px rgba(220,38,38,0.25);">
                                    🚀 Masuk / Login ke Portal Peserta
                                </a>
                            </div>

                            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
                                Harap simpan email ini sebagai bukti pendaftaran resmi. Untuk keamanan akun Anda, jangan berikan kredensial password di atas kepada pihak lain.
                            </p>
                        </td>
                    </tr>

                    <!-- FOOTER RESMI -->
                    <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
                            <div style="font-weight: 700; color: #64748b; margin-bottom: 4px;">
                                Panitia Pelaksana ' . htmlspecialchars($appName) . '
                            </div>
                            <div>
                                ' . htmlspecialchars($orgName) . ' | Telp: ' . htmlspecialchars($contactPhone) . ' | Email: ' . htmlspecialchars($contactEmail) . '
                            </div>
                            <div style="margin-top: 6px; font-size: 11px;">
                                ' . htmlspecialchars($contactAddress) . '
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>';

        $fromEmail = !empty($settings['smtp_from_email']) ? trim($settings['smtp_from_email']) : (!empty($contactEmail) ? $contactEmail : 'no-reply@jumbara-pmi.or.id');
        $fromName = !empty($settings['smtp_from_name']) ? trim($settings['smtp_from_name']) : ($settings['organizer_name'] ?? 'PMI Kabupaten Pemalang');

        // 1. Try sending via SMTP Gateway if enabled
        $smtpEnabled = ($settings['smtp_enabled'] ?? '0') === '1' || ($settings['smtp_enabled'] ?? 0) === 1;
        if ($smtpEnabled && !empty($settings['smtp_host'])) {
            $smtpResult = sendSmtpMail($toEmail, $subject, $html, $settings);
            if (!empty($smtpResult['status'])) {
                return true;
            }
            error_log('[JUMBARA SMTP REGISTRATION EMAIL ERROR] ' . ($smtpResult['error'] ?? 'Unknown SMTP error'));
        }

        // 2. Fallback to PHP native mail()
        $headers = [];
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-type: text/html; charset=UTF-8';
        $headers[] = 'From: ' . $fromName . ' <' . $fromEmail . '>';
        $headers[] = 'Reply-To: ' . $contactEmail;
        $headers[] = 'X-Mailer: PHP/' . phpversion();

        $sent = @mail($toEmail, $subject, $html, implode("\r\n", $headers));
        return $sent;
    }
}

// ==========================================================================
// SOCKET-BASED NATIVE SMTP CLIENT HELPER
// Mendukung SSL/TLS, AUTH LOGIN, RFC 5321 Dot-Stuffing tanpa dependensi composer
// ==========================================================================
if (!function_exists('sendSmtpMail')) {
    function sendSmtpMail($to, $subject, $htmlBody, $customConfig = null) {
        $settings = is_array($customConfig) ? $customConfig : getAppSettings();

        $host = trim($settings['smtp_host'] ?? '');
        $port = intval($settings['smtp_port'] ?? 587);
        if ($port <= 0) $port = 587;
        $secure = strtolower(trim($settings['smtp_secure'] ?? 'tls')); // 'ssl', 'tls', or 'none'
        $user = trim($settings['smtp_user'] ?? '');
        $pass = $settings['smtp_pass'] ?? '';
        $fromEmail = trim($settings['smtp_from_email'] ?? '');
        if (!$fromEmail) {
            $fromEmail = !empty($user) && filter_var($user, FILTER_VALIDATE_EMAIL) ? $user : ($settings['contact_email'] ?? 'no-reply@jumbara-pmi.or.id');
        }
        $fromName = trim($settings['smtp_from_name'] ?? '');
        if (!$fromName) {
            $fromName = $settings['organizer_name'] ?? 'PMI Kabupaten Pemalang';
        }

        if (empty($host)) {
            return [
                'status' => false,
                'error' => 'SMTP Host belum dikonfigurasi di pengaturan sistem.'
            ];
        }

        $timeout = 15;
        $errNo = 0;
        $errStr = '';

        $protocol = ($secure === 'ssl') ? 'ssl://' : 'tcp://';

        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);

        $socket = @stream_socket_client(
            $protocol . $host . ':' . $port,
            $errNo,
            $errStr,
            $timeout,
            STREAM_CLIENT_CONNECT,
            $context
        );

        if (!$socket) {
            return [
                'status' => false,
                'error' => "Gagal terhubung ke SMTP server ($host:$port): $errStr ($errNo)"
            ];
        }

        stream_set_timeout($socket, $timeout);

        $readResponse = function() use ($socket) {
            $response = '';
            while (!feof($socket)) {
                $line = fgets($socket, 1024);
                if ($line === false) break;
                $response .= $line;
                if (strlen($line) >= 4 && substr($line, 3, 1) === ' ') {
                    break;
                }
            }
            return trim($response);
        };

        $sendCommand = function($cmd, $expectedCode) use ($socket, $readResponse) {
            fputs($socket, $cmd . "\r\n");
            $res = $readResponse();
            $code = substr($res, 0, 3);
            if ($code != $expectedCode) {
                throw new Exception("SMTP Error [$cmd]: Harapan kode $expectedCode, respon server: $res");
            }
            return $res;
        };

        try {
            $greeting = $readResponse();
            if (substr($greeting, 0, 3) != '220') {
                throw new Exception("SMTP Greeting gagal: $greeting");
            }

            $clientHost = !empty($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'localhost';
            $sendCommand("EHLO $clientHost", 250);

            if ($secure === 'tls') {
                $sendCommand("STARTTLS", 220);
                $crypto = @stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                if (!$crypto) {
                    throw new Exception("Gagal mengaktifkan enkripsi TLS pada koneksi SMTP.");
                }
                $sendCommand("EHLO $clientHost", 250);
            }

            if (!empty($user)) {
                $sendCommand("AUTH LOGIN", 334);
                $sendCommand(base64_encode($user), 334);
                $sendCommand(base64_encode($pass), 235);
            }

            $cleanFromEmail = trim(preg_replace('/[^\w\.\@\-\+]/', '', $fromEmail));
            $sendCommand("MAIL FROM:<$cleanFromEmail>", 250);

            $cleanTo = trim(preg_replace('/[^\w\.\@\-\+]/', '', $to));
            $sendCommand("RCPT TO:<$cleanTo>", 250);

            $sendCommand("DATA", 354);

            $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
            $encodedFromName = '=?UTF-8?B?' . base64_encode($fromName) . '?=';
            $messageId = '<' . time() . '.' . md5($cleanTo . uniqid()) . '@' . $clientHost . '>';
            $date = date('r');

            $headers = [];
            $headers[] = "Date: $date";
            $headers[] = "Message-ID: $messageId";
            $headers[] = "From: $encodedFromName <$cleanFromEmail>";
            $headers[] = "Reply-To: $cleanFromEmail";
            $headers[] = "To: <$cleanTo>";
            $headers[] = "Subject: $encodedSubject";
            $headers[] = "MIME-Version: 1.0";
            $headers[] = "Content-Type: text/html; charset=UTF-8";
            $headers[] = "Content-Transfer-Encoding: 8bit";
            $headers[] = "X-Mailer: Jumbara-PMR-SMTP/1.0";

            $normalizedBody = str_replace(["\r\n", "\r"], "\n", $htmlBody);
            $lines = explode("\n", $normalizedBody);
            foreach ($lines as &$line) {
                if (isset($line[0]) && $line[0] === '.') {
                    $line = '.' . $line;
                }
            }
            $finalBody = implode("\r\n", $lines);

            $payload = implode("\r\n", $headers) . "\r\n\r\n" . $finalBody . "\r\n.";
            fputs($socket, $payload . "\r\n");

            $dataRes = $readResponse();
            if (substr($dataRes, 0, 3) != '250') {
                throw new Exception("SMTP Gagal mengirim data pesan: $dataRes");
            }

            @fputs($socket, "QUIT\r\n");
            @fclose($socket);

            return [
                'status' => true,
                'message' => 'Email berhasil dikirim via SMTP server.'
            ];
        } catch (Exception $ex) {
            @fputs($socket, "QUIT\r\n");
            @fclose($socket);
            return [
                'status' => false,
                'error' => $ex->getMessage()
            ];
        }
    }
}

// ==========================================================================
// SYSTEM AUDIT & ACTIVITY LOGGER
// ==========================================================================
function logActivity($action, $module, $description, $details = null, $userId = null, $username = null, $role = null) {
    try {
        $pdo = getPDOConnection();
        static $activityTableReady = false;
        if (!$activityTableReady) {
            $pdo->exec("CREATE TABLE IF NOT EXISTS `activity_logs` (
              `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
              `user_id` INT NULL,
              `username` VARCHAR(100) NULL,
              `role` VARCHAR(50) NULL,
              `action` VARCHAR(100) NOT NULL,
              `module` VARCHAR(50) NOT NULL,
              `description` TEXT NOT NULL,
              `details` LONGTEXT NULL,
              `ip_address` VARCHAR(45) NULL,
              `user_agent` VARCHAR(255) NULL,
              `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              INDEX `idx_activity_created_at` (`created_at`),
              INDEX `idx_activity_user` (`user_id`),
              INDEX `idx_activity_action` (`action`),
              INDEX `idx_activity_module` (`module`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
            $activityTableReady = true;
        }

        if (session_status() === PHP_SESSION_NONE) {
            @session_start();
        }

        $sessionUser = $_SESSION['user'] ?? null;
        if ($userId === null && $sessionUser) {
            $userId = $sessionUser['id'] ?? null;
        }
        if ($username === null && $sessionUser) {
            $username = $sessionUser['username'] ?? ($sessionUser['full_name'] ?? null);
        }
        if ($role === null && $sessionUser) {
            $role = $sessionUser['role'] ?? null;
        }

        // Tangkap IP Address asli
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        if (strpos($ip, ',') !== false) {
            $ip = trim(explode(',', $ip)[0]);
        }
        $ip = substr($ip, 0, 45);

        // User agent singkat & informatif
        $userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', 0, 255);

        // Details formatting
        $detailsJson = null;
        if ($details !== null) {
            if (is_string($details)) {
                $detailsJson = $details;
            } else {
                $detailsJson = json_encode($details, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }
        }

        $stmt = $pdo->prepare("
            INSERT INTO `activity_logs` 
            (`user_id`, `username`, `role`, `action`, `module`, `description`, `details`, `ip_address`, `user_agent`, `created_at`) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $userId,
            $username ?: 'System/Guest',
            $role ?: 'guest',
            $action,
            $module,
            $description,
            $detailsJson,
            $ip,
            $userAgent
        ]);
        return true;
    } catch (Throwable $e) {
        error_log('[ACTIVITY LOGGER ERROR] ' . $e->getMessage());
        return false;
    }
}

