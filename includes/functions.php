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
