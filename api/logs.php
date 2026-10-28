<?php
// ==========================================================================
// API SYSTEM AUDIT & ACTIVITY LOGS (LOG AKTIVITAS USER)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$currentUser = requireUser(['kabupaten']);
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Auto Ensure Table Exists
$pdo->exec("CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `username` VARCHAR(100) NULL,
  `role` VARCHAR(50) NULL,
  `action` VARCHAR(100) NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `description` TEXT NOT NULL,
  `details` LONGTEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_activity_created_at` (`created_at`),
  INDEX `idx_activity_user` (`user_id`),
  INDEX `idx_activity_action` (`action`),
  INDEX `idx_activity_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

// EXPORT LOGS (XLS / CSV)
if ($method === 'GET' && $action === 'export') {
    $format = strtolower($_GET['format'] ?? 'xls');
    $search = trim($_GET['search'] ?? '');
    $module = trim($_GET['module'] ?? '');
    $actFilter = trim($_GET['act'] ?? '');
    $role = trim($_GET['role'] ?? '');
    $dateStart = trim($_GET['date_start'] ?? '');
    $dateEnd = trim($_GET['date_end'] ?? '');

    $where = [];
    $params = [];

    if ($search !== '') {
        $where[] = "(username LIKE ? OR description LIKE ? OR action LIKE ? OR ip_address LIKE ?)";
        $term = "%{$search}%";
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    if ($module !== '' && $module !== 'all') {
        $where[] = "module = ?";
        $params[] = $module;
    }

    if ($actFilter !== '' && $actFilter !== 'all') {
        $where[] = "action = ?";
        $params[] = $actFilter;
    }

    if ($role !== '' && $role !== 'all') {
        $where[] = "role = ?";
        $params[] = $role;
    }

    if ($dateStart !== '') {
        $where[] = "DATE(created_at) >= ?";
        $params[] = $dateStart;
    }

    if ($dateEnd !== '') {
        $where[] = "DATE(created_at) <= ?";
        $params[] = $dateEnd;
    }

    $whereSql = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

    $stmt = $pdo->prepare("SELECT * FROM activity_logs {$whereSql} ORDER BY id DESC LIMIT 5000");
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $filename = 'Audit_Log_Aktivitas_Jumbara_' . date('Ymd_His');

    if ($format === 'csv') {
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '.csv"');
        header('Pragma: no-cache');
        header('Expires: 0');

        echo "\xEF\xBB\xBF"; // UTF-8 BOM
        $out = fopen('php://output', 'w');
        fputcsv($out, ['ID', 'Waktu (WIB)', 'User', 'Role', 'Modul', 'Aksi', 'Deskripsi Aktivitas', 'IP Address', 'User Agent']);

        foreach ($logs as $row) {
            fputcsv($out, [
                $row['id'],
                $row['created_at'],
                $row['username'],
                strtoupper($row['role'] ?? '-'),
                strtoupper($row['module'] ?? '-'),
                $row['action'],
                $row['description'],
                $row['ip_address'],
                $row['user_agent']
            ]);
        }
        fclose($out);
        exit;
    } else {
        // Excel HTML Spreadsheet (.xls)
        header('Content-Type: application/vnd.ms-excel; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '.xls"');
        header('Pragma: no-cache');
        header('Expires: 0');

        echo '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        echo '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
        echo '<style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; }
            th { background-color: #b91c1c; color: #ffffff; padding: 8px 10px; border: 1px solid #991b1b; text-align: left; }
            td { padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; }
            .header-info { margin-bottom: 12px; }
            .header-info h2 { margin: 0 0 4px 0; color: #b91c1c; }
        </style></head><body>';

        echo '<div class="header-info">';
        echo '<h2>LOG AUDIT & RIWAYAT AKTIVITAS SISTEM JUMBARA PMR 2026</h2>';
        echo '<p>Diekspor oleh: <strong>' . htmlspecialchars($currentUser['username']) . '</strong> pada ' . date('d F Y, H:i:s') . ' WIB | Total Rekaman: ' . count($logs) . '</p>';
        echo '</div>';

        echo '<table><thead><tr>';
        echo '<th>ID</th><th>Waktu Kejadian (WIB)</th><th>Pengguna</th><th>Peran (Role)</th><th>Modul</th><th>Jenis Tindakan</th><th>Deskripsi Lengkap Aktivitas</th><th>Alamat IP</th><th>Perangkat / Browser</th>';
        echo '</tr></thead><tbody>';

        foreach ($logs as $row) {
            echo '<tr>';
            echo '<td>' . htmlspecialchars($row['id']) . '</td>';
            echo '<td>' . htmlspecialchars($row['created_at']) . '</td>';
            echo '<td><strong>' . htmlspecialchars($row['username'] ?? '-') . '</strong></td>';
            echo '<td>' . htmlspecialchars(strtoupper($row['role'] ?? '-')) . '</td>';
            echo '<td>' . htmlspecialchars(strtoupper($row['module'] ?? '-')) . '</td>';
            echo '<td>' . htmlspecialchars($row['action']) . '</td>';
            echo '<td>' . htmlspecialchars($row['description']) . '</td>';
            echo '<td>' . htmlspecialchars($row['ip_address'] ?? '-') . '</td>';
            echo '<td>' . htmlspecialchars($row['user_agent'] ?? '-') . '</td>';
            echo '</tr>';
        }
        echo '</tbody></table></body></html>';
        exit;
    }
}

// CLEAR OLD LOGS
if ($method === 'POST' && $action === 'clear') {
    $input = getJsonInput();
    $days = (int)($input['days'] ?? 30);
    if ($days < 0) $days = 30;

    if ($days === 0) {
        // Clear all logs
        $count = $pdo->exec("TRUNCATE TABLE activity_logs");
        logActivity('clear_logs', 'system', "Admin {$currentUser['username']} membersihkan seluruh rekaman log aktivitas sistem");
        jsonResponse(['message' => 'Seluruh rekaman log aktivitas berhasil dibersihkan!']);
    } else {
        $stmt = $pdo->prepare("DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)");
        $stmt->execute([$days]);
        $deleted = $stmt->rowCount();
        logActivity('clear_logs', 'system', "Admin {$currentUser['username']} membersihkan {$deleted} rekaman log yang lebih dari {$days} hari");
        jsonResponse(['message' => "Berhasil menghapus {$deleted} rekaman log aktivitas yang lebih dari {$days} hari."]);
    }
}

// GET LOG LIST (FILTERED & PAGINATED)
if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $module = trim($_GET['module'] ?? '');
    $actFilter = trim($_GET['act'] ?? '');
    $role = trim($_GET['role'] ?? '');
    $dateStart = trim($_GET['date_start'] ?? '');
    $dateEnd = trim($_GET['date_end'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = max(1, min(100, (int)($_GET['limit'] ?? 25)));
    $offset = ($page - 1) * $limit;

    $where = [];
    $params = [];

    if ($search !== '') {
        $where[] = "(username LIKE ? OR description LIKE ? OR action LIKE ? OR ip_address LIKE ?)";
        $term = "%{$search}%";
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    if ($module !== '' && $module !== 'all') {
        $where[] = "module = ?";
        $params[] = $module;
    }

    if ($actFilter !== '' && $actFilter !== 'all') {
        $where[] = "action = ?";
        $params[] = $actFilter;
    }

    if ($role !== '' && $role !== 'all') {
        $where[] = "role = ?";
        $params[] = $role;
    }

    if ($dateStart !== '') {
        $where[] = "DATE(created_at) >= ?";
        $params[] = $dateStart;
    }

    if ($dateEnd !== '') {
        $where[] = "DATE(created_at) <= ?";
        $params[] = $dateEnd;
    }

    $whereSql = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

    // Count Total Matching
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM activity_logs {$whereSql}");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Fetch Paginated Logs
    $stmt = $pdo->prepare("SELECT * FROM activity_logs {$whereSql} ORDER BY id DESC LIMIT {$limit} OFFSET {$offset}");
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Summary Stats
    $statToday = (int)$pdo->query("SELECT COUNT(*) FROM activity_logs WHERE DATE(created_at) = CURDATE()")->fetchColumn();
    $statTotalAll = (int)$pdo->query("SELECT COUNT(*) FROM activity_logs")->fetchColumn();
    $statUniqueUsers = (int)$pdo->query("SELECT COUNT(DISTINCT username) FROM activity_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();

    // Distinct Filter Options
    $modules = $pdo->query("SELECT DISTINCT module FROM activity_logs WHERE module IS NOT NULL AND module != '' ORDER BY module ASC")->fetchAll(PDO::FETCH_COLUMN);
    $actions = $pdo->query("SELECT DISTINCT action FROM activity_logs WHERE action IS NOT NULL AND action != '' ORDER BY action ASC LIMIT 50")->fetchAll(PDO::FETCH_COLUMN);
    $roles = $pdo->query("SELECT DISTINCT role FROM activity_logs WHERE role IS NOT NULL AND role != '' ORDER BY role ASC")->fetchAll(PDO::FETCH_COLUMN);

    jsonResponse([
        'data' => $logs,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => (int)ceil($total / $limit) ?: 1
        ],
        'stats' => [
            'total_all' => $statTotalAll,
            'today' => $statToday,
            'active_users_7d' => $statUniqueUsers
        ],
        'filter_options' => [
            'modules' => $modules,
            'actions' => $actions,
            'roles' => $roles
        ]
    ]);
}

jsonResponse(['error' => 'Metode request tidak didukung.'], 405);

