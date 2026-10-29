<?php
$sock = '/Applications/MAMP/tmp/mysql/mysql.sock';
$dbname = 'jumbara_db';
$user = 'root';
$pass = 'root';
try {
    $pdo = new PDO("mysql:unix_socket={$sock};dbname={$dbname};charset=utf8mb4", $user, $pass);

    $unitKsr = $pdo->query("SELECT id, name FROM units WHERE name LIKE '%KSR%' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    $unitPmi = $pdo->query("SELECT id, name FROM units WHERE name LIKE '%PMI Kabupaten%' LIMIT 1")->fetch(PDO::FETCH_ASSOC);

    echo "KSR: " . json_encode($unitKsr) . "\n";
    echo "PMI: " . json_encode($unitPmi) . "\n";

    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM scores WHERE unit_id = ? AND branch_name = ?");
    $stmtIns = $pdo->prepare("
        INSERT INTO scores (
            event_id, unit_id, target_type, category_type, branch_name, pmr_level,
            score_val, grade, judge_name, evaluator_user_id, notes, status, validated_at, validated_by, created_at
        ) VALUES (
            ?, ?, 'kontingen', ?, ?, ?,
            ?, ?, ?, 1, ?, 'validated', NOW(), 1, NOW()
        )
    ");

    $items = [
        // KSR
        ['unit_id' => $unitKsr['id'], 'event_id' => 3, 'cat' => 'Bakti', 'branch' => 'Simulasi & Evakuasi Ayo Siaga Bencana (ASB)', 'lvl' => 'KSR', 'score' => 94.5, 'grade' => 'Emas', 'judge' => 'Ahmad Sudirman, S.Kep', 'notes' => 'Kesiapsiagaan dan ketangkasan tim KSR sangat prima.'],
        ['unit_id' => $unitKsr['id'], 'event_id' => 4, 'cat' => 'Gembira', 'branch' => 'Gembira PMR & Pentas Seni Remaja', 'lvl' => 'KSR', 'score' => 88.0, 'grade' => 'Perak', 'judge' => 'Dewi Lestari, M.Pd', 'notes' => 'Penampilan kekompakan dan kreasi seni luar biasa.'],
        ['unit_id' => $unitKsr['id'], 'event_id' => 1, 'cat' => 'Umum', 'branch' => 'Upacara Pembukaan Jumbara PMR 2026', 'lvl' => 'KSR', 'score' => 91.0, 'grade' => 'Emas', 'judge' => 'Budi Santoso, S.Sos', 'notes' => 'Kedisiplinan barisan dan kelengkapan personel.'],

        // PMI Kabupaten Pemalang
        ['unit_id' => $unitPmi['id'], 'event_id' => 1, 'cat' => 'Umum', 'branch' => 'Upacara Pembukaan Jumbara PMR 2026', 'lvl' => 'PMI Kab', 'score' => 95.0, 'grade' => 'Emas', 'judge' => 'dr. Siti Rahmawati', 'notes' => 'Koordinasi dan kepemimpinan kontingen pangkalan Markas PMI.'],
        ['unit_id' => $unitPmi['id'], 'event_id' => 3, 'cat' => 'Bakti', 'branch' => 'Simulasi & Evakuasi Ayo Siaga Bencana (ASB)', 'lvl' => 'PMI Kab', 'score' => 86.5, 'grade' => 'Perak', 'judge' => 'Ahmad Sudirman, S.Kep', 'notes' => 'Partisipasi simulasi posko dan dapur umum.'],
        ['unit_id' => $unitPmi['id'], 'event_id' => 4, 'cat' => 'Gembira', 'branch' => 'Gembira PMR & Pentas Seni Remaja', 'lvl' => 'PMI Kab', 'score' => 81.0, 'grade' => 'Perunggu', 'judge' => 'Dewi Lestari, M.Pd', 'notes' => 'Semangat kebersamaan dan persaudaraan tinggi.']
    ];

    $added = 0;
    foreach ($items as $item) {
        $stmtCheck->execute([$item['unit_id'], $item['branch']]);
        if ($stmtCheck->fetchColumn() == 0) {
            $stmtIns->execute([
                $item['event_id'],
                $item['unit_id'],
                $item['cat'],
                $item['branch'],
                $item['lvl'],
                $item['score'],
                $item['grade'],
                $item['judge'],
                $item['notes']
            ]);
            $added++;
        }
    }

    echo "Added {$added} scores for non-school units!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

