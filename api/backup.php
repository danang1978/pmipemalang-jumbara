<?php
// ==========================================================================
// API DATABASE BACKUP & RESTORE UTILITY (FULL SQL EXPORTER)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$currentUser = requireUser(['kabupaten']);
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Ensure Backup Directory Exists & Secured
$backupDir = __DIR__ . '/../backups/';
if (!is_dir($backupDir)) {
    @mkdir($backupDir, 0755, true);
}
// Create security barrier
$htaccessFile = $backupDir . '.htaccess';
if (!file_exists($htaccessFile)) {
    @file_put_contents($htaccessFile, "Order allow,deny\nDeny from all\n");
}
$indexFile = $backupDir . 'index.html';
if (!file_exists($indexFile)) {
    @file_put_contents($indexFile, '<!DOCTYPE html><html><head><title>403 Forbidden</title></head><body><h1>Directory access is forbidden.</h1></body></html>');
}

/**
 * Generate Full SQL Dump of MySQL Database
 * Pure PHP implementation: 100% compatible across shared hosting, VPS, MAMP, XAMPP, and aaPanel
 */
function generateSqlDump($pdo) {
    $dbName = DB_NAME;
    $dateStr = date('Y-m-d H:i:s');
    $phpVersion = PHP_VERSION;

    $sql = "-- ==========================================================================\n";
    $sql .= "-- JUMBARA PMR 2026 - COMPLETE DATABASE SQL BACKUP\n";
    $sql .= "-- Host: " . DB_HOST . ":" . DB_PORT . "\n";
    $sql .= "-- Database: " . $dbName . "\n";
    $sql .= "-- Generation Time: " . $dateStr . " WIB\n";
    $sql .= "-- PHP Version: " . $phpVersion . "\n";
    $sql .= "-- ==========================================================================\n\n";
    $sql .= "SET FOREIGN_KEY_CHECKS=0;\n";
    $sql .= "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n";
    $sql .= "SET NAMES utf8mb4;\n\n";

    // Get all tables
    $tables = [];
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }

    foreach ($tables as $table) {
        $sql .= "-- --------------------------------------------------------\n";
        $sql .= "-- Table structure for table `{$table}`\n";
        $sql .= "-- --------------------------------------------------------\n";
        $sql .= "DROP TABLE IF EXISTS `{$table}`;\n";

        $createStmt = $pdo->query("SHOW CREATE TABLE `{$table}`");
        $createRow = $createStmt->fetch(PDO::FETCH_NUM);
        $sql .= $createRow[1] . ";\n\n";

        // Dump data
        $sql .= "-- Dumping data for table `{$table}`\n";
        $dataStmt = $pdo->query("SELECT * FROM `{$table}`");
        $rowCount = 0;
        $batch = [];

        while ($row = $dataStmt->fetch(PDO::FETCH_ASSOC)) {
            $rowCount++;
            $values = [];
            foreach ($row as $val) {
                if ($val === null) {
                    $values[] = "NULL";
                } else {
                    $values[] = $pdo->quote($val);
                }
            }
            $batch[] = "(" . implode(", ", $values) . ")";

            // Write in batches of 100 rows
            if (count($batch) >= 100) {
                $cols = array_map(function($c) { return "`{$c}`"; }, array_keys($row));
                $sql .= "INSERT INTO `{$table}` (" . implode(", ", $cols) . ") VALUES\n" . implode(",\n", $batch) . ";\n";
                $batch = [];
            }
        }

        if (count($batch) > 0) {
            $cols = array_map(function($c) { return "`{$c}`"; }, array_keys($row));
            $sql .= "INSERT INTO `{$table}` (" . implode(", ", $cols) . ") VALUES\n" . implode(",\n", $batch) . ";\n";
        }

        $sql .= "\n-- Table `{$table}`: {$rowCount} rows exported.\n\n";
    }

    $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
    $sql .= "-- Backup completed successfully at " . date('Y-m-d H:i:s') . " WIB\n";

    return $sql;
}

// ACTION 1: DIRECT DOWNLOAD SQL DUMP
if ($action === 'download_sql' || ($method === 'GET' && $action === 'download')) {
    $filename = 'backup_jumbara_' . DB_NAME . '_' . date('Y-m-d_His') . '.sql';

    // Clear output buffer
    if (ob_get_length()) {
        ob_clean();
    }

    header('Content-Type: application/sql; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    $dump = generateSqlDump($pdo);
    echo $dump;

    logActivity('download_backup', 'backup', "Admin '{$currentUser['username']}' mengunduh langsung berkas backup database ({$filename})");
    exit;
}

// ACTION 2: CREATE SNAPSHOT ON SERVER (backups/ folder)
if ($method === 'POST' && $action === 'create_snapshot') {
    $filename = 'backup_jumbara_' . DB_NAME . '_' . date('Y-m-d_His') . '.sql';
    $filepath = $backupDir . $filename;

    $dump = generateSqlDump($pdo);
    $bytes = @file_put_contents($filepath, $dump);

    if ($bytes === false) {
        jsonResponse(['error' => 'Gagal menulis berkas backup ke folder server. Periksa izin direktori backups/.'], 500);
    }

    $sizeKb = round($bytes / 1024, 2);
    logActivity('create_backup', 'backup', "Admin '{$currentUser['username']}' membuat snapshot backup database lokal di server: {$filename} ({$sizeKb} KB)", [
        'filename' => $filename,
        'size_bytes' => $bytes
    ]);

    jsonResponse([
        'message' => "Snapshot backup database berhasil dibuat ({$sizeKb} KB)!",
        'filename' => $filename,
        'size_kb' => $sizeKb,
        'created_at' => date('d M Y, H:i:s')
    ]);
}

// ACTION 3: DOWNLOAD SNAPSHOT FILE FROM SERVER
if ($method === 'GET' && $action === 'download_snapshot') {
    $file = basename($_GET['file'] ?? '');
    if (!$file || !preg_match('/^backup_jumbara_.*\.sql$/i', $file)) {
        jsonResponse(['error' => 'Nama berkas backup tidak valid.'], 400);
    }

    $filepath = $backupDir . $file;
    if (!file_exists($filepath) || !is_file($filepath)) {
        jsonResponse(['error' => 'Berkas backup tidak ditemukan di server.'], 404);
    }

    if (ob_get_length()) {
        ob_clean();
    }

    header('Content-Type: application/sql; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $file . '"');
    header('Content-Length: ' . filesize($filepath));
    header('Pragma: no-cache');
    header('Expires: 0');

    readfile($filepath);
    logActivity('download_backup', 'backup', "Admin '{$currentUser['username']}' mengunduh snapshot backup: {$file}");
    exit;
}

// ACTION 4: DELETE SNAPSHOT FILE
if ($method === 'POST' && $action === 'delete_snapshot') {
    $input = getJsonInput();
    $file = basename($input['filename'] ?? '');

    if (!$file || !preg_match('/^backup_jumbara_.*\.sql$/i', $file)) {
        jsonResponse(['error' => 'Nama berkas backup tidak valid.'], 400);
    }

    $filepath = $backupDir . $file;
    if (file_exists($filepath)) {
        @unlink($filepath);
        logActivity('delete_backup', 'backup', "Admin '{$currentUser['username']}' menghapus berkas snapshot backup: {$file}");
        jsonResponse(['message' => "Berkas backup '{$file}' berhasil dihapus dari server."]);
    } else {
        jsonResponse(['error' => 'Berkas backup tidak ditemukan.'], 404);
    }
}

// ACTION 5: GET DATABASE STATUS & SNAPSHOT LIST
if ($method === 'GET') {
    // 1. Database table statistics
    $tables = [];
    $totalRows = 0;
    $stmtTables = $pdo->query("SHOW TABLES");
    while ($row = $stmtTables->fetch(PDO::FETCH_NUM)) {
        $tblName = $row[0];
        $countStmt = $pdo->query("SELECT COUNT(*) FROM `{$tblName}`");
        $rowCount = (int)$countStmt->fetchColumn();
        $totalRows += $rowCount;

        $tables[] = [
            'name' => $tblName,
            'rows' => $rowCount
        ];
    }

    // Database size query
    $dbSizeMb = '0.00';
    try {
        $stmtSize = $pdo->prepare("
            SELECT SUM(data_length + index_length) / 1024 / 1024 AS size_mb 
            FROM information_schema.TABLES 
            WHERE table_schema = ?
        ");
        $stmtSize->execute([DB_NAME]);
        $rawMb = (float)$stmtSize->fetchColumn();
        $dbSizeMb = number_format($rawMb, 2);
    } catch (Exception $e) {}

    // 2. Scan snapshot files in backups/ folder
    $snapshots = [];
    if (is_dir($backupDir)) {
        $files = scandir($backupDir);
        foreach ($files as $f) {
            if ($f === '.' || $f === '..' || $f === '.htaccess' || $f === 'index.html') continue;
            if (preg_match('/\.sql$/i', $f)) {
                $fPath = $backupDir . $f;
                $snapshots[] = [
                    'filename' => $f,
                    'size_bytes' => filesize($fPath),
                    'size_formatted' => round(filesize($fPath) / 1024, 2) . ' KB',
                    'created_at' => date('d M Y, H:i:s', filemtime($fPath)),
                    'timestamp' => filemtime($fPath)
                ];
            }
        }
        usort($snapshots, function($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });
    }

    jsonResponse([
        'db_info' => [
            'name' => DB_NAME,
            'host' => DB_HOST,
            'port' => DB_PORT,
            'total_tables' => count($tables),
            'total_rows' => $totalRows,
            'estimated_size_mb' => $dbSizeMb . ' MB',
            'tables' => $tables
        ],
        'snapshots' => $snapshots
    ]);
}

jsonResponse(['error' => 'Metode request tidak didukung.'], 405);

