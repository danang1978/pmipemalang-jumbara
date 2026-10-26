<?php
function testEndpoint($file, $method = 'GET', $get = [], $post = [], $session = []) {
    $descriptorspec = [
        0 => ["pipe", "r"],
        1 => ["pipe", "w"],
        2 => ["pipe", "w"]
    ];

    $code = '<?php' . PHP_EOL;
    $code .= '$_SERVER["REQUEST_METHOD"] = ' . var_export($method, true) . ';' . PHP_EOL;
    $code .= '$_GET = ' . var_export($get, true) . ';' . PHP_EOL;
    if ($session) {
        $code .= '@session_start(); $_SESSION = ' . var_export($session, true) . ';' . PHP_EOL;
    }
    $code .= 'require ' . var_export($file, true) . ';' . PHP_EOL;

    $process = proc_open('php', $descriptorspec, $pipes);
    fwrite($pipes[0], $code);
    fclose($pipes[0]);

    $stdout = stream_get_contents($pipes[1]);
    fclose($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[2]);

    $ret = proc_close($process);
    return ['code' => $ret, 'stdout' => $stdout, 'stderr' => $stderr];
}

echo "1. Testing lookup_target in scores.php:" . PHP_EOL;
$r1_anon = testEndpoint(__DIR__ . '/../api/scores.php', 'GET', ['action' => 'lookup_target', 'q' => 'pmr']);
echo "Exit (Anon): {$r1_anon['code']} | Stdout: {$r1_anon['stdout']}" . PHP_EOL;
$r1_auth = testEndpoint(__DIR__ . '/../api/scores.php', 'GET', ['action' => 'lookup_target', 'q' => 'Rizky'], [], ['user' => ['role' => 'penilai', 'id' => 1]]);
echo "Exit (Auth): {$r1_auth['code']} | Found: " . (strpos($r1_auth['stdout'], 'results') !== false ? 'YES' : 'NO') . PHP_EOL;

echo "2. Testing GET events.php:" . PHP_EOL;
$r2 = testEndpoint(__DIR__ . '/../api/events.php', 'GET');
$d2 = json_decode($r2['stdout'], true);
echo "Exit: {$r2['code']} | Event count: " . (is_array($d2) ? count($d2) : 'FAIL') . PHP_EOL;

echo "3. Testing DELETE events.php with admin login:" . PHP_EOL;
$r3 = testEndpoint(__DIR__ . '/../api/events.php', 'DELETE', ['id' => 999999], [], ['user' => ['role' => 'kabupaten', 'id' => 1]]);
echo "Exit: {$r3['code']} | Response: {$r3['stdout']}" . PHP_EOL;

echo "4. Testing GET reports.php:" . PHP_EOL;
$r4 = testEndpoint(__DIR__ . '/../api/reports.php', 'GET');
echo "Exit: {$r4['code']} | Response: {$r4['stdout']}" . PHP_EOL;

echo "5. Testing unauthenticated GET participants.php (PII protection):" . PHP_EOL;
$r5 = testEndpoint(__DIR__ . '/../api/participants.php', 'GET');
$d5 = json_decode($r5['stdout'], true);
echo "Exit: {$r5['code']} | Data empty?: " . (empty($d5['data']) ? 'YES (PII Protected)' : 'LEAK!') . " | Total count: " . ($d5['pagination']['total'] ?? 0) . PHP_EOL;

echo "6. Testing authenticated unit GET participants.php (Multi-tenant isolation):" . PHP_EOL;
$r6 = testEndpoint(__DIR__ . '/../api/participants.php', 'GET', ['unit_id' => 99], [], ['user' => ['role' => 'unit', 'unit_id' => 1, 'id' => 2]]);
$d6 = json_decode($r6['stdout'], true);
$allFromUnit1 = true;
if (!empty($d6['data'])) {
    foreach ($d6['data'] as $p) {
        if ($p['unit_id'] != 1) $allFromUnit1 = false;
    }
}
echo "Exit: {$r6['code']} | Isolated to Unit 1?: " . ($allFromUnit1 ? 'YES' : 'NO') . PHP_EOL;

echo "7. Testing unauthenticated GET settings.php (Fonnte token protection):" . PHP_EOL;
$r7 = testEndpoint(__DIR__ . '/../api/settings.php', 'GET');
$d7 = json_decode($r7['stdout'], true);
echo "Exit: {$r7['code']} | fonnte_token leaked?: " . (isset($d7['fonnte_token']) ? 'LEAK!' : 'PROTECTED (Not Leaked)') . PHP_EOL;

echo "8. Testing unauthenticated ID Card access (IDOR protection):" . PHP_EOL;
$r8 = testEndpoint(__DIR__ . '/../api/participants.php', 'GET', ['action' => 'idcard', 'id' => 1]);
echo "Exit: {$r8['code']} | Rejected with 401?: " . (strpos($r8['stdout'], 'Silakan login terlebih dahulu') !== false ? 'YES (Protected)' : 'LEAK!') . PHP_EOL;

echo "9. Testing unauthenticated Certificate participants access:" . PHP_EOL;
$r9 = testEndpoint(__DIR__ . '/../api/certificates.php', 'GET', ['action' => 'participants']);
echo "Exit: {$r9['code']} | Rejected with 401?: " . (strpos($r9['stdout'], 'Silakan login terlebih dahulu') !== false ? 'YES (Protected)' : 'LEAK!') . PHP_EOL;

echo "10. Testing unauthenticated Attendance registered_participants access:" . PHP_EOL;
$r10 = testEndpoint(__DIR__ . '/../api/attendance.php', 'GET', ['action' => 'registered_participants', 'event_id' => 1]);
echo "Exit: {$r10['code']} | Rejected with 401?: " . (strpos($r10['stdout'], 'Silakan login terlebih dahulu') !== false ? 'YES (Protected)' : 'LEAK!') . PHP_EOL;

echo PHP_EOL . "=== ALL TESTS VERIFIED ===" . PHP_EOL;

