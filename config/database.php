<?php
// ==========================================================================
// JUMBARA PMR 2026 - PDO MYSQL DATABASE CONFIGURATION
// ==========================================================================

// Load local database configuration if exists (e.g. on production hosting)
if (file_exists(__DIR__ . '/database.local.php')) {
    require_once __DIR__ . '/database.local.php';
}

// Default configuration (MAMP / Local Development)
if (!defined('DB_HOST')) define('DB_HOST', '127.0.0.1');
if (!defined('DB_PORT')) define('DB_PORT', '8889');
if (!defined('DB_NAME')) define('DB_NAME', 'jumbara_db');
if (!defined('DB_USER')) define('DB_USER', 'root');
if (!defined('DB_PASS')) define('DB_PASS', 'root');

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
            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            // Fallback 1: Try default port 3306 if 8889 fails
            if ($port === '8889') {
                try {
                    $dsnFallback = "mysql:host={$host};port=3306;dbname={$dbname};charset=utf8mb4";
                    $pdo = new PDO($dsnFallback, $user, ($pass === 'root' ? '' : $pass), $options);
                    return $pdo;
                } catch (PDOException $e2) {}
            }

            // Fallback 2: Try localhost socket
            if ($host === '127.0.0.1') {
                try {
                    $dsnSocket = "mysql:host=localhost;dbname={$dbname};charset=utf8mb4";
                    $pdo = new PDO($dsnSocket, $user, $pass, $options);
                    return $pdo;
                } catch (PDOException $eSocket) {}
            }

            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Koneksi MySQL Gagal: ' . $e->getMessage()]);
            exit;
        }
    }

    return $pdo;
}
