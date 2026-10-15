<?php
// ==========================================================================
// API REPORTS & DASHBOARD STATS
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $totalUnits = (int)$pdo->query("SELECT COUNT(*) FROM units")->fetchColumn();
    $totalScores = (int)$pdo->query("SELECT COUNT(*) FROM scores")->fetchColumn();

    $partStats = $pdo->query("
        SELECT 
            COUNT(*) AS total_participants,
            SUM(CASE WHEN status = 'verified_unit' THEN 1 ELSE 0 END) AS verified_unit,
            SUM(CASE WHEN status = 'verified_kabupaten' THEN 1 ELSE 0 END) AS verified_kabupaten
        FROM participants
    ")->fetch();

    jsonResponse([
        'total_units' => $totalUnits,
        'total_participants' => (int)($partStats['total_participants'] ?? 0),
        'verified_unit' => (int)($partStats['verified_unit'] ?? 0),
        'verified_kabupaten' => (int)($partStats['verified_kabupaten'] ?? 0),
        'total_scores' => $totalScores
    ]);
}
