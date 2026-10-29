<?php
$sock = '/Applications/MAMP/tmp/mysql/mysql.sock';
$dbname = 'jumbara_db';
$user = 'root';
$pass = 'root';
try {
    $pdo = new PDO("mysql:unix_socket={$sock};dbname={$dbname};charset=utf8mb4", $user, $pass);
    
    $stmt = $pdo->query("DESCRIBE events");
    echo "COLUMNS IN EVENTS:\n";
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $c) {
        echo $c['Field'] . ' (' . $c['Type'] . ")\n";
    }

    $stmt2 = $pdo->query("SELECT id, title, category, pmr_level FROM events");
    echo "\nEVENTS:\n";
    foreach ($stmt2->fetchAll(PDO::FETCH_ASSOC) as $ev) {
        echo "ID: {$ev['id']} | Title: {$ev['title']} | Cat: {$ev['category']} | PMR Level: {$ev['pmr_level']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
