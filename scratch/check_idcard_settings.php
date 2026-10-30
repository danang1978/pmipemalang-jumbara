<?php
require_once __DIR__ . '/../config/database.php';
$pdo = getPDOConnection();
$stmt = $pdo->query("SELECT `key`, `value` FROM settings WHERE `key` LIKE '%idcard%'");
while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $r['key'] . " => " . $r['value'] . "\n";
}
