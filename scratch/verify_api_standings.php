<?php
$sock = '/Applications/MAMP/tmp/mysql/mysql.sock';
$dbname = 'jumbara_db';
$user = 'root';
$pass = 'root';
try {
    $pdo = new PDO("mysql:unix_socket={$sock};dbname={$dbname};charset=utf8mb4", $user, $pass);
    
    // Test 1: All standings
    $sqlAll = "
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
    $all = $pdo->query($sqlAll)->fetchAll(PDO::FETCH_ASSOC);
    echo "=== TEST 1: ALL STANDINGS (" . count($all) . " units) ===\n";
    $ksr = null;
    $pmi = null;
    foreach ($all as $idx => $u) {
        if (strpos($u['unit_name'], 'KSR') !== false) $ksr = ['rank' => $idx + 1, 'data' => $u];
        if (strpos($u['unit_name'], 'PMI') !== false) $pmi = ['rank' => $idx + 1, 'data' => $u];
    }
    echo "KSR Rank: #{$ksr['rank']} | Emas: {$ksr['data']['emas']}, Perak: {$ksr['data']['perak']}, Perunggu: {$ksr['data']['perunggu']}, Avg: {$ksr['data']['avg_score']}\n";
    echo "PMI Rank: #{$pmi['rank']} | Emas: {$pmi['data']['emas']}, Perak: {$pmi['data']['perak']}, Perunggu: {$pmi['data']['perunggu']}, Avg: {$pmi['data']['avg_score']}\n";

    // Test 2: Filter non-sekolah
    $sqlNonSchool = "
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
        WHERE (un.level_category NOT LIKE '%Wira%' AND un.level_category NOT LIKE '%Madya%' AND un.level_category NOT LIKE '%Mula%')
        GROUP BY un.id, un.name, un.level_category
        ORDER BY emas DESC, perak DESC, perunggu DESC, total_score DESC, avg_score DESC, un.name ASC
    ";
    $nonSchool = $pdo->query($sqlNonSchool)->fetchAll(PDO::FETCH_ASSOC);
    echo "\n=== TEST 2: NON-SCHOOL STANDINGS (" . count($nonSchool) . " units) ===\n";
    foreach ($nonSchool as $idx => $ns) {
        echo "#" . ($idx + 1) . " {$ns['unit_name']} ({$ns['level_category']}) => 🥇: {$ns['emas']}, 🥈: {$ns['perak']}, 🥉: {$ns['perunggu']} | Avg: {$ns['avg_score']}\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

