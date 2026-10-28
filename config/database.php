<?php
// ==========================================================================
// JUMBARA PMR 2026 - SMART DUAL ENVIRONMENT DATABASE CONFIGURATION
// Otomatis mengenali Server Hosting (Produksi) vs Komputer Lokal (MAMP/XAMPP)
// Bebas konflik saat update git push & git pull!
// ==========================================================================

// 1. Prioritas Utama: Muat konfigurasi manual khusus jika ada (database.local.php)
if (file_exists(__DIR__ . '/database.local.php')) {
    require_once __DIR__ . '/database.local.php';
}

// 2. Deteksi Otomatis Lingkungan (Server Hosting vs Local MAMP)
if (!defined('DB_NAME')) {
    $httpHost = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '';
    $dirPath  = __DIR__;

    // Cek apakah sedang berjalan di server hosting jumbara.pmipemalang.or.id atau direktori /www/wwwroot
    $isHosting = (
        strpos($httpHost, 'pmipemalang.or.id') !== false ||
        strpos($dirPath, '/www/wwwroot') !== false ||
        strpos($dirPath, '/var/www') !== false
    );

    if ($isHosting) {
        // --- KONFIGURASI SERVER HOSTING (PRODUKSI) ---
        define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
        define('DB_PORT', getenv('DB_PORT') ?: '3306');
        define('DB_NAME', getenv('DB_NAME') ?: 'sql_jumbara_pmipemalang_or_id');
        define('DB_USER', getenv('DB_USER') ?: 'sql_jumbara_pmipemalang_or_id');
        define('DB_PASS', getenv('DB_PASS') ?: 'e827ebce734fa');
    } else {
        // --- KONFIGURASI LOCAL DEVELOPMENT (MAMP / XAMPP) ---
        $isMamp = file_exists('/Applications/MAMP');
        define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
        define('DB_PORT', getenv('DB_PORT') ?: ($isMamp ? '8889' : '3306'));
        define('DB_NAME', getenv('DB_NAME') ?: 'jumbara_db');
        define('DB_USER', getenv('DB_USER') ?: 'root');
        define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : ($isMamp ? 'root' : ''));
    }
}

function getPDOConnection() {
    static $pdo = null;

    if ($pdo === null) {
        $host = DB_HOST;
        $port = DB_PORT;
        $dbname = DB_NAME;
        $user = DB_USER;
        $pass = DB_PASS;

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];

        try {
            // Koneksi langsung sesuai konfigurasi aktif
            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            // Fallback 1: Jika di lokal MAMP port 8889 gagal, coba port standar 3306
            if ($port === '8889') {
                try {
                    $dsnFallback = "mysql:host={$host};port=3306;dbname={$dbname};charset=utf8mb4";
                    $pdo = new PDO($dsnFallback, $user, ($pass === 'root' ? '' : $pass), $options);
                    return $pdo;
                } catch (PDOException $e2) {}
            }

            // Fallback 2: Coba koneksi via socket UNIX lokal jika TCP dibatasi oleh server
            if ($host === '127.0.0.1' || $host === 'localhost') {
                try {
                    $dsnSocket = "mysql:host=localhost;dbname={$dbname};charset=utf8mb4";
                    $pdo = new PDO($dsnSocket, $user, $pass, $options);
                    return $pdo;
                } catch (PDOException $eSocket) {}
            }

            error_log('[JUMBARA DB ERROR] ' . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            // Cegah kebocoran path dan kredensial internal database di respon API
            $isDev = (strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false || strpos($_SERVER['HTTP_HOST'] ?? '', '127.0.0.1') !== false);
            $errMsg = $isDev ? ('Koneksi MySQL Gagal: ' . $e->getMessage()) : 'Koneksi ke database server gagal. Silakan hubungi Administrator Sistem.';
            echo json_encode(['error' => $errMsg]);
            exit;
        }
    }

    // Auto-Migration Check (Safe & Idempotent): Ensure users table has full_name & phone
    static $schemaChecked = false;
    if (!$schemaChecked) {
        $schemaChecked = true;
        try {
            $cols = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
            if (!empty($cols)) {
                if (!in_array('full_name', $cols)) {
                    $pdo->exec("ALTER TABLE users ADD COLUMN full_name VARCHAR(150) NULL AFTER unit_id");
                }
                if (!in_array('phone', $cols)) {
                    $pdo->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL AFTER full_name");
                }
                if (!in_array('email', $cols)) {
                    $pdo->exec("ALTER TABLE users ADD COLUMN email VARCHAR(100) NULL AFTER password");
                }
            }
            // Ensure units.level_category supports KSR, TSR, PMI Kab without ENUM restrictions
            try {
                $pdo->exec("ALTER TABLE units MODIFY COLUMN level_category VARCHAR(100) NOT NULL DEFAULT 'Wira (SMA)'");
            } catch (Exception $eUnits) {}

            // Auto-Migration for participants table (Guarantees no SQLSTATE[42S22] Column not found errors)
            $pCols = $pdo->query("SHOW COLUMNS FROM participants")->fetchAll(PDO::FETCH_COLUMN);
            if (!empty($pCols)) {
                $pColsMap = array_flip($pCols);
                if (!isset($pColsMap['class_name'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN class_name VARCHAR(50) NULL DEFAULT NULL AFTER level"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['last_education'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN last_education VARCHAR(100) NULL DEFAULT NULL AFTER class_name"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['organizations'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN organizations TEXT NULL DEFAULT NULL AFTER last_education"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['school_address'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN school_address TEXT NULL DEFAULT NULL AFTER unit_id"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['school_phone'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN school_phone VARCHAR(50) NULL DEFAULT NULL AFTER school_address"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['parent_name'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN parent_name VARCHAR(255) NULL DEFAULT NULL AFTER emergency_contact"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['parent_address'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN parent_address TEXT NULL DEFAULT NULL AFTER parent_name"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['parent_phone'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN parent_phone VARCHAR(50) NULL DEFAULT NULL AFTER parent_address"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['parent_job'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN parent_job VARCHAR(150) NULL DEFAULT NULL AFTER parent_phone"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['email'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN email VARCHAR(100) NULL DEFAULT NULL"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['certificate_number'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN certificate_number VARCHAR(100) NULL DEFAULT NULL"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['registration_type'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN registration_type VARCHAR(50) DEFAULT 'Peserta'"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['reject_reason'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN reject_reason TEXT NULL DEFAULT NULL"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['assignment_letter_url'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN assignment_letter_url VARCHAR(255) NULL DEFAULT NULL"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['sub_categories'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN sub_categories TEXT NULL DEFAULT NULL"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['religion'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN religion VARCHAR(50) NULL DEFAULT 'Islam'"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['is_disabled'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN is_disabled VARCHAR(20) NULL DEFAULT 'Tidak'"); } catch (Exception $e) {}
                }
                if (!isset($pColsMap['disability_type'])) {
                    try { $pdo->exec("ALTER TABLE participants ADD COLUMN disability_type VARCHAR(100) NULL DEFAULT 'Tidak Ada'"); } catch (Exception $e) {}
                }
            }
        } catch (Exception $eMigrate) {
            // Silently ignore if table users/participants doesn't exist yet or permissions restricted
        }
    }

    return $pdo;
}
