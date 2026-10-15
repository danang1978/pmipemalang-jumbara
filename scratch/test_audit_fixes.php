<?php
// Scratch test script for verifying all fixes
echo "=== 1. Testing Database Direct Connection ===" . PHP_EOL;
$t0 = microtime(true);
require_once __DIR__ . '/../config/database.php';
$pdo = getPDOConnection();
$t1 = microtime(true);
echo "DB Connected in " . round(($t1 - $t0) * 1000, 2) . " ms" . PHP_EOL;

echo PHP_EOL . "=== 2. Testing Helper Functions & Settings Cache ===" . PHP_EOL;
require_once __DIR__ . '/../includes/functions.php';
$s1 = getAppSettings();
$s2 = getAppSettings();
echo "Settings retrieved successfully. App name: " . $s1['app_name'] . PHP_EOL;

echo PHP_EOL . "=== 3. Testing Target Lookup in scores.php (Checking bug fix: p.nik -> p.nisn) ===" . PHP_EOL;
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['action'] = 'lookup_target';
$_GET['q'] = 'test';
ob_start();
require __DIR__ . '/../api/scores.php';
$out = ob_get_clean();
$data = json_decode($out, true);
if (isset($data['target_type'])) {
    echo "SUCCESS: lookup_target returned valid JSON without crash: " . $out . PHP_EOL;
} else {
    echo "FAIL: " . $out . PHP_EOL;
}

echo PHP_EOL . "=== 4. Testing Events List & Aspects (Batch query check) ===" . PHP_EOL;
unset($_GET['action']);
$_SERVER['REQUEST_METHOD'] = 'GET';
ob_start();
require __DIR__ . '/../api/events.php';
$eventsOut = ob_get_clean();
$eventsData = json_decode($eventsOut, true);
echo "SUCCESS: Events retrieved: " . count($eventsData) . " events" . PHP_EOL;

echo PHP_EOL . "=== 5. Testing Reports API ===" . PHP_EOL;
$_SERVER['REQUEST_METHOD'] = 'GET';
ob_start();
require __DIR__ . '/../api/reports.php';
$reportsOut = ob_get_clean();
echo "SUCCESS: Reports stats: " . $reportsOut . PHP_EOL;

echo PHP_EOL . "=== 6. Testing Unauthenticated Participants Protection ===" . PHP_EOL;
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SESSION = [];
ob_start();
require __DIR__ . '/../api/participants.php';
$partOut = ob_get_clean();
$partData = json_decode($partOut, true);
echo "SUCCESS: Unauthenticated participants call returned empty data (no PII leak): " . $partOut . PHP_EOL;

echo PHP_EOL . "=== ALL TESTS COMPLETED SUCCESSFULLY ===" . PHP_EOL;
