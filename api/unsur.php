<?php
// ==========================================================================
// API UNSUR CATEGORIES & QUOTA MANAGEMENT
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET /api/unsur.php?action=export (Export Master Unsur & Kuota)
if ($method === 'GET' && ($action === 'export' || $action === 'export_unsur')) {
    requireUser(['kabupaten', 'unit', 'panitia', 'admin']);
    $unitId = (int)($_GET['unit_id'] ?? 0);

    $stmt = $pdo->query("SELECT * FROM unsur_categories ORDER BY id ASC");
    $items = $stmt->fetchAll();

    $stmtGlobal = $pdo->query("
        SELECT level, COUNT(*) AS total 
        FROM participants 
        WHERE status != 'rejected'
        GROUP BY level
    ");
    $globalMap = $stmtGlobal->fetchAll(PDO::FETCH_KEY_PAIR);

    $unitName = 'Semua Unit (Statistik Global)';
    if ($unitId > 0) {
        $stmtUnit = $pdo->prepare("SELECT name FROM units WHERE id = ?");
        $stmtUnit->execute([$unitId]);
        $unitName = $stmtUnit->fetchColumn() ?: $unitName;

        $stmtUsage = $pdo->prepare("
            SELECT level, COUNT(*) AS total 
            FROM participants 
            WHERE unit_id = ? AND status != 'rejected'
            GROUP BY level
        ");
        $stmtUsage->execute([$unitId]);
        $usageMap = $stmtUsage->fetchAll(PDO::FETCH_KEY_PAIR);

        foreach ($items as &$u) {
            $u['used_quota'] = (int)($usageMap[$u['name']] ?? 0);
            $u['remaining_quota'] = ($u['quota'] > 0) ? max(0, (int)$u['quota'] - $u['used_quota']) : null;
            $u['is_full'] = ($u['quota'] > 0 && $u['used_quota'] >= (int)$u['quota']);
            $u['total_global'] = (int)($globalMap[$u['name']] ?? 0);
        }
    } else {
        foreach ($items as &$u) {
            $u['total_global'] = (int)($globalMap[$u['name']] ?? 0);
            $u['used_quota'] = 0;
            $u['remaining_quota'] = null;
            $u['is_full'] = false;
        }
    }

    $filename = "master_unsur_kuota_" . date('Ymd_His') . ".xls";
    header("Content-Type: application/vnd.ms-excel; charset=utf-8");
    header("Content-Disposition: attachment; filename=\"$filename\"");
    header("Pragma: no-cache");
    header("Expires: 0");

    echo '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    echo '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
    echo '<style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 0.5pt solid #cbd5e1; padding: 8px 12px; vertical-align: middle; }
        th { background-color: #059669; color: #ffffff; font-weight: bold; text-align: center; }
        .kop-title { font-size: 14pt; font-weight: bold; color: #065f46; text-align: center; background-color: #d1fae5; }
        .kop-meta { font-size: 9.5pt; color: #64748b; background-color: #f8fafc; }
        .row-even { background-color: #ffffff; }
        .row-odd { background-color: #f8fafc; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
    </style></head><body>';
    echo '<table>';
    echo '<tr><th colspan="' . ($unitId ? '7' : '5') . '" class="kop-title">DATA MASTER UNSUR KONTINGEN & BATAS KUOTA JUMBARA 2026</th></tr>';
    echo '<tr><th colspan="' . ($unitId ? '7' : '5') . '" class="kop-meta">Tanggal Unduh: ' . date('d F Y, H:i') . ' WIB | Filter Unit: ' . htmlspecialchars($unitName) . '</th></tr>';
    echo '<tr style="height: 10px;"><td colspan="' . ($unitId ? '7' : '5') . '" style="border: none;"></td></tr>';
    echo '<tr>';
    echo '<th style="width: 50px;">No</th>';
    echo '<th>Nama Unsur Kontingen</th>';
    echo '<th>Batas Kuota / Unit</th>';
    if ($unitId) {
        echo '<th>Kuota Terpakai</th>';
        echo '<th>Sisa Kuota</th>';
        echo '<th>Status Pendaftaran</th>';
    } else {
        echo '<th>Total Peserta Global</th>';
    }
    echo '<th>Keterangan / Deskripsi</th>';
    echo '</tr>';

    foreach ($items as $idx => $u) {
        $rowClass = ($idx % 2 === 0) ? 'row-even' : 'row-odd';
        $quotaText = ($u['quota'] > 0) ? "Maks {$u['quota']} Orang / Unit" : "Tanpa Batas";
        echo "<tr class=\"$rowClass\">";
        echo "<td class=\"text-center\">" . ($idx + 1) . "</td>";
        echo "<td><strong>" . htmlspecialchars($u['name']) . "</strong></td>";
        echo "<td class=\"text-center\">$quotaText</td>";
        if ($unitId) {
            $remText = ($u['quota'] > 0) ? ($u['remaining_quota'] . " Orang") : "Tanpa Batas";
            $statusText = ($u['quota'] > 0) ? ($u['is_full'] ? "KUOTA PENUH" : "TERSEDIA") : "TANPA BATAS";
            echo "<td class=\"text-center\">{$u['used_quota']} Orang</td>";
            echo "<td class=\"text-center\">$remText</td>";
            echo "<td class=\"text-center\">$statusText</td>";
        } else {
            echo "<td class=\"text-center\">{$u['total_global']} Orang</td>";
        }
        echo "<td>" . htmlspecialchars($u['description'] ?? '-') . "</td>";
        echo "</tr>";
    }
    echo '</table></body></html>';
    exit;
}

// GET /api/unsur.php?action=export_matrix (Export Matriks Kuota Kontingen & Unsur)
if ($method === 'GET' && $action === 'export_matrix') {
    requireUser(['kabupaten', 'unit', 'panitia', 'admin']);

    $stmtUnsur = $pdo->query("SELECT * FROM unsur_categories ORDER BY id ASC");
    $unsurList = $stmtUnsur->fetchAll();

    $stmtUnits = $pdo->query("SELECT id, code, name, level_category FROM units ORDER BY level_category ASC, name ASC");
    $units = $stmtUnits->fetchAll();

    $stmtUsage = $pdo->query("
        SELECT unit_id, level, COUNT(*) as cnt 
        FROM participants 
        WHERE status != 'rejected' 
        GROUP BY unit_id, level
    ");
    $usageData = $stmtUsage->fetchAll();

    $matrix = [];
    foreach ($usageData as $row) {
        $uId = (int)$row['unit_id'];
        $lvl = strtoupper(trim($row['level']));
        if (!isset($matrix[$uId])) $matrix[$uId] = [];
        $matrix[$uId][$lvl] = (int)$row['cnt'];
    }

    $colCount = count($unsurList) + 5;
    $filename = "rekap_matriks_unsur_kontingen_kuota_" . date('Ymd_His') . ".xls";
    header("Content-Type: application/vnd.ms-excel; charset=utf-8");
    header("Content-Disposition: attachment; filename=\"$filename\"");
    header("Pragma: no-cache");
    header("Expires: 0");

    echo '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    echo '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
    echo '<style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 0.5pt solid #cbd5e1; padding: 7px 10px; vertical-align: middle; }
        th { background-color: #059669; color: #ffffff; font-weight: bold; text-align: center; }
        .kop-title { font-size: 14pt; font-weight: bold; color: #065f46; text-align: center; background-color: #d1fae5; }
        .kop-meta { font-size: 9.5pt; color: #64748b; background-color: #f8fafc; }
        .row-even { background-color: #ffffff; }
        .row-odd { background-color: #f8fafc; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .bg-green { background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center; }
        .bg-yellow { background-color: #fef3c7; color: #b45309; font-weight: bold; text-align: center; }
        .bg-red { background-color: #fee2e2; color: #dc2626; font-weight: bold; text-align: center; }
        .total-row { background-color: #334155; color: #ffffff; font-weight: bold; }
    </style></head><body>';
    echo '<table>';
    echo "<tr><th colspan=\"$colCount\" class=\"kop-title\">REKAPITULASI MATRIKS KUOTA & UNSUR KONTINGEN PESERTA JUMBARA PMR 2026</th></tr>";
    echo "<tr><th colspan=\"$colCount\" class=\"kop-meta\">Tanggal Unduh: " . date('d F Y, H:i') . " WIB | Total Kontingen: " . count($units) . " Unit</th></tr>";
    echo "<tr style=\"height: 10px;\"><td colspan=\"$colCount\" style=\"border: none;\"></td></tr>";
    echo '<tr>';
    echo '<th style="width: 50px;">No</th>';
    echo '<th>Kode Unit</th>';
    echo '<th>Nama Kontingen / Unit Sekolah</th>';
    echo '<th>Kategori / Tingkat</th>';
    foreach ($unsurList as $col) {
        $quotaTxt = $col['quota'] > 0 ? " (Maks {$col['quota']})" : " (Bebas)";
        echo '<th>' . htmlspecialchars($col['name'] . $quotaTxt) . '</th>';
    }
    echo '<th>Total Peserta</th>';
    echo '</tr>';

    $colTotals = array_fill(0, count($unsurList), 0);
    $grandTotal = 0;

    foreach ($units as $idx => $u) {
        $rowClass = ($idx % 2 === 0) ? 'row-even' : 'row-odd';
        $uId = (int)$u['id'];
        $unitTot = 0;
        echo "<tr class=\"$rowClass\">";
        echo "<td class=\"text-center\">" . ($idx + 1) . "</td>";
        echo "<td class=\"text-center\">" . htmlspecialchars($u['code'] ?? '-') . "</td>";
        echo "<td><strong>" . htmlspecialchars($u['name']) . "</strong></td>";
        echo "<td class=\"text-center\">" . htmlspecialchars($u['level_category'] ?? '-') . "</td>";

        foreach ($unsurList as $cIdx => $col) {
            $colKey = strtoupper(trim($col['name']));
            $cnt = $matrix[$uId][$colKey] ?? 0;
            if ($cnt === 0 && isset($matrix[$uId])) {
                foreach ($matrix[$uId] as $mKey => $mVal) {
                    if (strpos($mKey, $colKey) !== false || strpos($colKey, $mKey) !== false) {
                        $cnt = $mVal;
                        break;
                    }
                }
            }
            $unitTot += $cnt;
            $colTotals[$cIdx] += $cnt;

            $cellClass = 'text-center';
            if ($cnt > 0) {
                if ($col['quota'] > 0) {
                    $cellClass = ($cnt >= $col['quota']) ? 'bg-green' : 'bg-yellow';
                } else {
                    $cellClass = 'bg-green';
                }
            } else {
                $cellClass = ($col['quota'] > 0) ? 'bg-red' : 'text-center';
            }

            echo "<td class=\"$cellClass\">$cnt</td>";
        }
        $grandTotal += $unitTot;
        echo "<td class=\"text-center\" style=\"font-weight: bold;\">$unitTot</td>";
        echo "</tr>";
    }

    // Total Row
    echo "<tr class=\"total-row\">";
    echo "<td colspan=\"4\" style=\"text-align: right; padding-right: 15px; font-weight: bold;\">TOTAL KESELURUHAN</td>";
    foreach ($colTotals as $tot) {
        echo "<td class=\"text-center\" style=\"font-weight: bold;\">$tot</td>";
    }
    echo "<td class=\"text-center\" style=\"font-weight: bold;\">$grandTotal</td>";
    echo "</tr>";
    echo '</table></body></html>';
    exit;
}

// GET /api/unsur.php
if ($method === 'GET') {
    $unitId = (int)($_GET['unit_id'] ?? 0);

    $stmt = $pdo->query("SELECT * FROM unsur_categories ORDER BY id ASC");
    $items = $stmt->fetchAll();

    // Query global active participant count grouped by level
    $stmtGlobal = $pdo->query("
        SELECT level, COUNT(*) AS total 
        FROM participants 
        WHERE status != 'rejected'
        GROUP BY level
    ");
    $globalMap = $stmtGlobal->fetchAll(PDO::FETCH_KEY_PAIR);

    if ($unitId > 0) {
        $stmtUsage = $pdo->prepare("
            SELECT level, COUNT(*) AS total 
            FROM participants 
            WHERE unit_id = ? AND status != 'rejected'
            GROUP BY level
        ");
        $stmtUsage->execute([$unitId]);
        $usageMap = $stmtUsage->fetchAll(PDO::FETCH_KEY_PAIR);

        foreach ($items as &$u) {
            $u['used_quota'] = (int)($usageMap[$u['name']] ?? 0);
            $u['remaining_quota'] = ($u['quota'] > 0) ? max(0, (int)$u['quota'] - $u['used_quota']) : null;
            $u['is_full'] = ($u['quota'] > 0 && $u['used_quota'] >= (int)$u['quota']);
            $u['total_global'] = (int)($globalMap[$u['name']] ?? 0);
        }
    } else {
        foreach ($items as &$u) {
            $u['total_global'] = (int)($globalMap[$u['name']] ?? 0);
            $u['used_quota'] = 0;
            $u['remaining_quota'] = null;
            $u['is_full'] = false;
        }
    }

    jsonResponse($items);
}

// POST /api/unsur.php (Tambah Unsur Baru)
if ($method === 'POST') {
    requireUser(['kabupaten']);
    $input = getJsonInput();

    $name = trim($input['name'] ?? '');
    $quota = max(0, (int)($input['quota'] ?? 1));
    $description = trim($input['description'] ?? '');

    if (!$name) {
        jsonResponse(['error' => 'Nama unsur wajib diisi.'], 400);
    }

    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM unsur_categories WHERE LOWER(name) = LOWER(?)");
    $stmtCheck->execute([$name]);
    if ($stmtCheck->fetchColumn() > 0) {
        jsonResponse(['error' => "Nama unsur '{$name}' sudah ada."], 400);
    }

    $stmt = $pdo->prepare("INSERT INTO unsur_categories (name, quota, description) VALUES (?, ?, ?)");
    $stmt->execute([$name, $quota, $description ?: null]);

    jsonResponse([
        'message' => "Unsur baru '{$name}' dengan kuota {$quota} berhasil ditambahkan!",
        'id' => $pdo->lastInsertId()
    ]);
}

// PUT /api/unsur.php (Edit Unsur & Kuota)
if ($method === 'PUT') {
    requireUser(['kabupaten']);
    $input = getJsonInput();
    $id = (int)($input['id'] ?? $_GET['id'] ?? 0);
    $name = trim($input['name'] ?? '');
    $quota = max(0, (int)($input['quota'] ?? 1));
    $description = trim($input['description'] ?? '');

    if (!$id || !$name) {
        jsonResponse(['error' => 'ID dan nama unsur wajib diisi.'], 400);
    }

    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM unsur_categories WHERE LOWER(name) = LOWER(?) AND id != ?");
    $stmtCheck->execute([$name, $id]);
    if ($stmtCheck->fetchColumn() > 0) {
        jsonResponse(['error' => "Nama unsur '{$name}' sudah digunakan."], 400);
    }

    $stmt = $pdo->prepare("UPDATE unsur_categories SET name = ?, quota = ?, description = ? WHERE id = ?");
    $stmt->execute([$name, $quota, $description ?: null, $id]);

    jsonResponse(['message' => "Unsur '{$name}' berhasil diperbarui!"]);
}

// DELETE /api/unsur.php?id=X (Hapus Unsur)
if ($method === 'DELETE') {
    requireUser(['kabupaten']);
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'ID unsur wajib.'], 400);

    $stmtName = $pdo->prepare("SELECT name FROM unsur_categories WHERE id = ?");
    $stmtName->execute([$id]);
    $name = $stmtName->fetchColumn();

    if (!$name) jsonResponse(['error' => 'Unsur tidak ditemukan.'], 404);

    // Check if unsur is currently used by participants
    $stmtPartCount = $pdo->prepare("SELECT COUNT(*) FROM participants WHERE level = ?");
    $stmtPartCount->execute([$name]);
    $usedCount = (int)$stmtPartCount->fetchColumn();

    if ($usedCount > 0) {
        jsonResponse(['error' => "Unsur '{$name}' sedang digunakan oleh {$usedCount} data peserta. Tidak dapat dihapus."], 400);
    }

    $stmtDel = $pdo->prepare("DELETE FROM unsur_categories WHERE id = ?");
    $stmtDel->execute([$id]);

    jsonResponse(['message' => "Unsur '{$name}' berhasil dihapus!"]);
}

jsonResponse(['error' => 'Method not allowed.'], 405);
