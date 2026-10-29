<?php
require_once __DIR__ . '/../config/database.php';
$pdo = getPDOConnection();
$stmt = $pdo->query('SELECT id, name, type, level_category FROM units');
$units = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total units: " . count($units) . "\n";
foreach ($units as $u) {
    echo "ID: {$u['id']} | Name: {$u['name']} | Type: " . ($u['type'] ?? 'null') . " | Level: " . ($u['level_category'] ?? 'null') . "\n";
}

$stmt2 = $pdo->query('SELECT DISTINCT grade FROM scores');
echo "\nGrades in scores: " . json_encode($stmt2->fetchAll(PDO::FETCH_COLUMN)) . "\n";

$stmt3 = $pdo->query("SELECT s.id, s.event_id, s.unit_id, s.participant_id, s.score_val, s.grade, u.name as unit_name, u.type, u.level_category FROM scores s LEFT JOIN units u ON s.unit_id = u.id LIMIT 10");
echo "\nSample scores:\n";
foreach ($stmt3->fetchAll(PDO::FETCH_ASSOC) as $s) {
    echo json_encode($s) . "\n";
}
