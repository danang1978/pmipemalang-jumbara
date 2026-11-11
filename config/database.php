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
            // Fallback 1: Jika di hosting atau lokal host 127.0.0.1 gagal, coba localhost
            if ($host === '127.0.0.1') {
                try {
                    $dsnFallback = "mysql:host=localhost;port={$port};dbname={$dbname};charset=utf8mb4";
                    $pdo = new PDO($dsnFallback, $user, $pass, $options);
                } catch (PDOException $eHost) {}
            }

            // Fallback 2: Jika di lokal MAMP port 8889 gagal, coba port standar 3306
            if (!$pdo && $port === '8889') {
                try {
                    $dsnFallback = "mysql:host={$host};port=3306;dbname={$dbname};charset=utf8mb4";
                    $pdo = new PDO($dsnFallback, $user, ($pass === 'root' ? '' : $pass), $options);
                } catch (PDOException $e2) {}
            }

            // Fallback 3: Coba koneksi via socket UNIX lokal jika TCP dibatasi oleh server
            if (!$pdo) {
                $socketPaths = ['/tmp/mysql.sock', '/var/run/mysqld/mysqld.sock', '/Applications/MAMP/tmp/mysql/mysql.sock'];
                foreach ($socketPaths as $sock) {
                    if (file_exists($sock)) {
                        try {
                            $dsnSocket = "mysql:unix_socket={$sock};dbname={$dbname};charset=utf8mb4";
                            $pdo = new PDO($dsnSocket, $user, $pass, $options);
                            break;
                        } catch (PDOException $eSocket) {}
                    }
                }
            }

            if (!$pdo) {
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

        // --- SELF-HEALING DATABASE SCHEMA (Mencegah SQLSTATE[01000] Warning 1265 Data truncated) ---
        static $schemaHealed = false;
        if (!$schemaHealed && $pdo) {
            $schemaHealed = true;
            try {
                // Pastikan kolom users.role adalah VARCHAR(50) untuk mendukung seluruh role (pendamping, peninjau, dll)
                $pdo->exec("ALTER TABLE `users` MODIFY COLUMN `role` VARCHAR(50) NOT NULL DEFAULT 'peserta'");
            } catch (\Throwable $eUsersRole) {}

            try {
                // Pastikan kolom activity_logs.role mendukung VARCHAR(50)
                $pdo->exec("ALTER TABLE `activity_logs` MODIFY COLUMN `role` VARCHAR(50) NULL DEFAULT NULL");
            } catch (\Throwable $eActRole) {}

            try {
                // Pastikan kolom participants.registration_type dan level tidak terpotong oleh enum sempit
                $pdo->exec("ALTER TABLE `participants` MODIFY COLUMN `registration_type` VARCHAR(50) NOT NULL DEFAULT 'Peserta'");
                $pdo->exec("ALTER TABLE `participants` MODIFY COLUMN `level` VARCHAR(100) NOT NULL DEFAULT 'Wira'");
            } catch (\Throwable $ePart) {}
        }
    }

    return $pdo;
}
