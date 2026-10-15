<?php
// ==========================================================================
// JUMBARA PMR 2026 - PDO MYSQL DATABASE CONFIGURATION (MAMP COMPATIBLE)
// ==========================================================================

define('DB_HOST', '127.0.0.1');
define('DB_PORT', '8889');
define('DB_NAME', 'jumbara_db');
define('DB_USER', 'root');
define('DB_PASS', 'root');

function getPDOConnection() {
    static $pdo = null;

    if ($pdo === null) {
        $host = defined('DB_HOST') ? DB_HOST : '127.0.0.1';
        $port = defined('DB_PORT') ? DB_PORT : '8889';
        $dbname = defined('DB_NAME') ? DB_NAME : 'jumbara_db';
        $user = defined('DB_USER') ? DB_USER : 'root';
        $pass = defined('DB_PASS') ? DB_PASS : 'root';

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];

        try {
            // Fast single connection directly to database
            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            // Fallback 1: Try default port 3306 if 8889 fails
            try {
                $dsnFallback = "mysql:host={$host};port=3306;dbname={$dbname};charset=utf8mb4";
                $pdo = new PDO($dsnFallback, $user, ($pass === 'root' ? '' : $pass), $options);
            } catch (PDOException $e2) {
                // Fallback 2: Check if database doesn't exist yet (Error 1049) and create it
                if ($e->getCode() == 1049 || $e2->getCode() == 1049) {
                    try {
                        $activePort = ($e2->getCode() == 1049) ? '3306' : $port;
                        $activePass = ($activePort === '3306' && $pass === 'root') ? '' : $pass;
                        $tmpPdo = new PDO("mysql:host={$host};port={$activePort};charset=utf8mb4", $user, $activePass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
                        $tmpPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                        $pdo = new PDO("mysql:host={$host};port={$activePort};dbname={$dbname};charset=utf8mb4", $user, $activePass, $options);
                        return $pdo;
                    } catch (PDOException $eCreate) {}
                }

                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['error' => 'Koneksi MySQL Gagal: ' . $e->getMessage()]);
                exit;
            }
        }
    }

    return $pdo;
}
