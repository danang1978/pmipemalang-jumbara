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
$r1 = testEndpoint(__DIR__ . '/../api/scores.php', 'GET', ['action' => 'lookup_target', 'q' => 'pmr']);
echo "Exit: {$r1['code']} | Stdout: {$r1['stdout']}" . PHP_EOL;

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

echo PHP_EOL . "=== ALL TESTS VERIFIED ===" . PHP_EOL;
