<?php
// CLI Tool: Koreksi Data Presensi dari UTC (+00:00) ke WIB (Asia/Jakarta, +07:00)
require_once __DIR__ . '/../config/database.php';

$pdo = getPDOConnection();
echo "Memeriksa data presensi di database...\n";

try {
    $stmtCheck = $pdo->query("
        SELECT id, participant_id, status, 
               DATE_FORMAT(COALESCE(timestamp, scanned_at), '%Y-%m-%d %H:%i:%s') AS raw_time 
        FROM attendance 
        WHERE (DATE(COALESCE(timestamp, scanned_at)) = '2026-11-20' AND HOUR(COALESCE(timestamp, scanned_at)) < 11)
           OR (DATE(COALESCE(timestamp, scanned_at)) < '2026-11-20' AND HOUR(COALESCE(timestamp, scanned_at)) < 17)
    ");
    $rows = $stmtCheck->fetchAll();
    echo "Ditemukan " . count($rows) . " data presensi dengan jam UTC yang perlu dikonversi ke WIB.\n";

    if (count($rows) > 0) {
        $count = $pdo->exec("
            UPDATE attendance 
            SET 
                timestamp = IF(timestamp IS NOT NULL, DATE_ADD(timestamp, INTERVAL 7 HOUR), NULL),
                scanned_at = IF(scanned_at IS NOT NULL, DATE_ADD(scanned_at, INTERVAL 7 HOUR), NULL)
            WHERE 
                (DATE(COALESCE(timestamp, scanned_at)) = '2026-11-20' AND HOUR(COALESCE(timestamp, scanned_at)) < 11)
                OR (DATE(COALESCE(timestamp, scanned_at)) < '2026-11-20' AND HOUR(COALESCE(timestamp, scanned_at)) < 17)
        ");
        $pdo->exec("CREATE TABLE IF NOT EXISTS `settings` (`key` VARCHAR(100) PRIMARY KEY, `value` LONGTEXT)");
        $pdo->exec("REPLACE INTO `settings` (`key`, `value`) VALUES ('attendance_tz_wib_fixed_v20261120', '1')");
        echo "SUKSES: Berhasil memperbarui $count baris presensi (+7 Jam ke WIB Asia/Jakarta)!\n";
    } else {
        echo "Data presensi sudah dalam zona WIB (atau sudah pernah diperbarui sebelumnya).\n";
    }
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
