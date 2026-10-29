<?php
$sock = '/Applications/MAMP/tmp/mysql/mysql.sock';
$dbname = 'jumbara_db';
$user = 'root';
$pass = 'root';
try {
    $pdo = new PDO("mysql:unix_socket={$sock};dbname={$dbname};charset=utf8mb4", $user, $pass);
    
    $osmEmbed = 'https://www.openstreetmap.org/export/embed.html?bbox=109.378%2C-6.916%2C109.388%2C-6.907&layer=mapnik&marker=-6.911763%2C109.383437';
    $gmapsUrl = 'https://maps.google.com/?q=Markas+PMI+Kabupaten+Pemalang';
    
    $stmt = $pdo->prepare("UPDATE settings SET value = ? WHERE `key` = 'event_map_embed'");
    $stmt->execute([$osmEmbed]);
    
    $stmt2 = $pdo->prepare("UPDATE settings SET value = ? WHERE `key` = 'event_map_url'");
    $stmt2->execute([$gmapsUrl]);
    
    echo "Settings updated successfully!\n";
    $stmt3 = $pdo->query("SELECT * FROM settings WHERE `key` LIKE '%map%'");
    foreach ($stmt3->fetchAll(PDO::FETCH_ASSOC) as $s) {
        echo "{$s['key']} => {$s['value']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

