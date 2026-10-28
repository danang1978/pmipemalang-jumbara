<?php
// ==========================================================================
// API OPTIONS (DYNAMIC MASTER DATA FOR FORM DROPDOWNS FROM MYSQL DATABASE)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // 1. Fetch Units from MySQL Table (including address and phone for auto-fill biodata)
    $stmtUnits = $pdo->query("SELECT id, code, name, level_category, address, phone FROM units ORDER BY name ASC");
    $units = $stmtUnits->fetchAll();

    // 2. Fetch Master Option Settings from MySQL Table
    $stmtSettings = $pdo->query("SELECT `key`, `value` FROM settings WHERE `key` LIKE 'option_%'");
    $settingsRaw = $stmtSettings->fetchAll(PDO::FETCH_KEY_PAIR);

    $religions = isset($settingsRaw['option_religions']) 
        ? json_decode($settingsRaw['option_religions'], true) 
        : ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];

    $bloodTypes = isset($settingsRaw['option_blood_types']) 
        ? json_decode($settingsRaw['option_blood_types'], true) 
        : ['O', 'A', 'B', 'AB', 'Belum Tahu'];

    $genders = isset($settingsRaw['option_genders']) 
        ? json_decode($settingsRaw['option_genders'], true) 
        : [
            ['value' => 'L', 'label' => 'Laki-laki'],
            ['value' => 'P', 'label' => 'Perempuan']
          ];

    // 3. Fetch Dynamic Unsur Categories & Quotas from MySQL Table
    $stmtUnsur = $pdo->query("SELECT id, name, quota, description FROM unsur_categories ORDER BY id ASC");
    $unsurList = $stmtUnsur->fetchAll();

    if (!empty($unsurList)) {
        $levels = array_map(function($u) {
            return [
                'value' => $u['name'],
                'label' => $u['name'] . ($u['quota'] > 0 ? " (Kuota: {$u['quota']} / Kontingen)" : ''),
                'quota' => (int)$u['quota'],
                'description' => $u['description']
            ];
        }, $unsurList);
    } else {
        $levels = isset($settingsRaw['option_levels']) 
            ? json_decode($settingsRaw['option_levels'], true) 
            : [
                ['value' => 'Wira', 'label' => 'Wira (SMA / SMK / MA)'],
                ['value' => 'Madya', 'label' => 'Madya (SMP / MTs)'],
                ['value' => 'Mula', 'label' => 'Mula (SD / MI)']
              ];
    }

    $disabilityStatuses = isset($settingsRaw['option_disability_statuses']) 
        ? json_decode($settingsRaw['option_disability_statuses'], true) 
        : [
            ['value' => 'Tidak', 'label' => 'Tidak (Non-Disabilitas)'],
            ['value' => 'Ya', 'label' => 'Ya (Penyandang Disabilitas)']
          ];

    $disabilityTypes = isset($settingsRaw['option_disability_types']) 
        ? json_decode($settingsRaw['option_disability_types'], true) 
        : ['Tidak Ada', 'Disabilitas Fisik / Daksa', 'Disabilitas Netra', 'Disabilitas Rungu / Wicara', 'Disabilitas Intelektual / Grahita', 'Disabilitas Mental', 'Lainnya'];

    jsonResponse([
        'units' => $units,
        'religions' => $religions,
        'blood_types' => $bloodTypes,
        'genders' => $genders,
        'levels' => $levels,
        'disability_statuses' => $disabilityStatuses,
        'disability_types' => $disabilityTypes
    ]);
}

if ($method === 'POST') {
    requireUser(['kabupaten']);
    $input = getJsonInput();

    $allowedKeys = [
        'option_religions',
        'option_blood_types',
        'option_genders',
        'option_levels',
        'option_disability_statuses',
        'option_disability_types'
    ];

    $stmt = $pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");

    foreach ($allowedKeys as $k) {
        if (isset($input[$k])) {
            $val = is_array($input[$k]) ? json_encode($input[$k]) : trim($input[$k]);
            $stmt->execute([$k, $val]);
        }
    }

    jsonResponse(['message' => 'Master Data pilihan formulir berhasil diperbarui!']);
}

jsonResponse(['error' => 'Method not allowed.'], 405);
