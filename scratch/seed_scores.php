<?php
require_once __DIR__ . '/../config/database.php';
$pdo = getPDOConnection();

echo "=== SEEDING SAMPLE SCORES & MEDALS ===\n";

$branches = [
    ['branch' => 'Pertolongan Pertama (PP)', 'cat' => 'Jumpa', 'event_id' => 2],
    ['branch' => 'Perawatan Keluarga (PK)', 'cat' => 'Jumpa', 'event_id' => 2],
    ['branch' => 'Ayo Siaga Bencana (ASB)', 'cat' => 'Bakti', 'event_id' => 3],
    ['branch' => 'Tandu Darurat Cepat', 'cat' => 'Jumpa', 'event_id' => 2],
    ['branch' => 'Pentas Seni Budaya PMR', 'cat' => 'Gembira', 'event_id' => 4],
    ['branch' => 'Paduan Suara Mars PMI', 'cat' => 'Gembira', 'event_id' => 4],
    ['branch' => 'Kepemimpinan & Tri Bakti', 'cat' => 'Jumpa', 'event_id' => 2]
];

$units = $pdo->query("SELECT id, name, level_category FROM units WHERE level_category IN ('Wira (SMA)', 'Madya (SMP)', 'Mula (SD)')")->fetchAll(PDO::FETCH_ASSOC);

$grades = ['Emas', 'Perak', 'Perunggu'];
$judgeNames = ['dr. Siti Rahmawati', 'Ahmad Sudirman, S.Kep', 'Budi Santoso, S.Sos', 'Dewi Lestari, M.Pd'];

$stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM scores WHERE unit_id = ? AND branch_name = ?");
$stmtIns = $pdo->prepare("
    INSERT INTO scores (
        event_id, unit_id, target_type, category_type, branch_name, pmr_level,
        score_val, grade, judge_name, evaluator_user_id, notes, status, validated_at, validated_by, created_at
    ) VALUES (
        ?, ?, 'unit', ?, ?, ?,
        ?, ?, ?, 1, ?, 'validated', NOW(), 1, NOW()
    )
");

$inserted = 0;
foreach ($units as $u) {
    $lvl = strpos($u['level_category'], 'Wira') !== false ? 'Wira' : (strpos($u['level_category'], 'Madya') !== false ? 'Madya' : 'Mula');
    
    // Select 3 to 5 branches for this unit
    $selectedBranches = array_slice($branches, rand(0, 2), rand(3, 5));
    foreach ($selectedBranches as $b) {
        $stmtCheck->execute([$u['id'], $b['branch']]);
        if ($stmtCheck->fetchColumn() > 0) continue;

        $scoreVal = rand(78, 98) + (rand(0, 9) / 10);
        $grade = ($scoreVal >= 90) ? 'Emas' : (($scoreVal >= 83) ? 'Perak' : 'Perunggu');
        $judge = $judgeNames[array_rand($judgeNames)];

        $stmtIns->execute([
            $b['event_id'],
            $u['id'],
            $b['cat'],
            $b['branch'],
            $lvl,
            $scoreVal,
            $grade,
            $judge,
            "Penilaian resmi cabang {$b['branch']} Kontingen {$u['name']}"
        ]);
        $inserted++;
    }
}

echo "Berhasil menambahkan {$inserted} skor & medali untuk kontingen unit.\n";

