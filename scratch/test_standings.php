<?php
$sock = '/Applications/MAMP/tmp/mysql/mysql.sock';
$dbname = 'jumbara_db';
$user = 'root';
$pass = 'root';
try {
    $pdo = new PDO("mysql:unix_socket={$sock};dbname={$dbname};charset=utf8mb4", $user, $pass);

    $sql = "
        SELECT 
            un.id AS unit_id,
            un.name AS unit_name,
            un.level_category,
            SUM(CASE WHEN s.grade = 'Emas' THEN 1 ELSE 0 END) AS emas,
            SUM(CASE WHEN s.grade = 'Perak' THEN 1 ELSE 0 END) AS perak,
            SUM(CASE WHEN s.grade = 'Perunggu' THEN 1 ELSE 0 END) AS perunggu,
            COUNT(s.id) AS total_lomba,
            COALESCE(ROUND(AVG(s.score_val), 1), 0) AS avg_score,
            COALESCE(ROUND(SUM(s.score_val), 1), 0) AS total_score
        FROM units un
        LEFT JOIN scores s ON (un.id = s.unit_id OR (s.unit_id IS NULL AND s.participant_id IN (SELECT id FROM participants WHERE unit_id = un.id)))
        GROUP BY un.id, un.name, un.level_category
        ORDER BY emas DESC, perak DESC, perunggu DESC, total_score DESC, avg_score DESC, un.name ASC
    ";
    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "TOTAL UNITS IN STANDINGS: " . count($rows) . "\n";
    foreach ($rows as $idx => $r) {
        $rank = $idx + 1;
        echo "#{$rank} | {$r['unit_name']} ({$r['level_category']}) | 🥇: {$r['emas']} | 🥈: {$r['perak']} | 🥉: {$r['perunggu']} | Total Skor: {$r['total_score']} | Avg: {$r['avg_score']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

