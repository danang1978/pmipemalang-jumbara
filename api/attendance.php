<?php
// ==========================================================================
// API ATTENDANCE (PRESENSI MASUK & KELUAR QR SCANNER DENGAN VALIDASI EVENT)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'scan') {
    $user = requireUser(['kabupaten', 'unit', 'panitia', 'admin']);
    $input = getJsonInput();

    $code = trim($input['participant_code'] ?? $input['code'] ?? '');
    $eventId = (int)($input['event_id'] ?? 0);
    $type = strtolower(trim($input['type'] ?? $input['status'] ?? 'masuk')); // 'masuk' or 'keluar'

    if (!in_array($type, ['masuk', 'keluar', 'hadir', 'izin', 'sakit'])) {
        $type = 'masuk';
    }

    if (!$code || !$eventId) {
        jsonResponse(['error' => 'Kode peserta dan ID kegiatan wajib diisi.'], 400);
    }

    // 1. Fetch Event Info
    $stmtEvt = $pdo->prepare("SELECT * FROM events WHERE id = ?");
    $stmtEvt->execute([$eventId]);
    $event = $stmtEvt->fetch();
    if (!$event) {
        jsonResponse(['error' => 'Kegiatan / Agenda Jumbara tidak ditemukan!'], 404);
    }

    // 2. Fetch Participant Info with Unit & User
    $stmtPart = $pdo->prepare("
        SELECT p.*, un.name AS unit_name 
        FROM participants p 
        LEFT JOIN units un ON p.unit_id = un.id 
        WHERE p.code = ?
    ");
    $stmtPart->execute([$code]);
    $part = $stmtPart->fetch();

    if (!$part) {
        jsonResponse(['error' => 'Peserta dengan kode "' . $code . '" tidak ditemukan dalam sistem!'], 404);
    }

    // 3. Verify Participant Verification Status
    if ($part['status'] !== 'verified_kabupaten') {
        jsonResponse([
            'error' => 'Presensi Ditolak: Peserta ' . $part['full_name'] . ' (' . $code . ') BELUM terverifikasi oleh Admin Kabupaten!',
            'participant' => $part,
            'event' => $event
        ], 400);
    }

    // 4. VERIFIKASI PENDAFTARAN KEGIATAN (Check if participant is registered for this event)
    $isRegistered = false;

    // Check 4a: Explicit table event_registrations
    $stmtReg = $pdo->prepare("SELECT COUNT(*) FROM event_registrations WHERE event_id = ? AND participant_id = ?");
    $stmtReg->execute([$eventId, $part['id']]);
    if ($stmtReg->fetchColumn() > 0) {
        $isRegistered = true;
    }

    // Check 4b: Check sub_categories JSON array in participant record
    if (!$isRegistered && !empty($part['sub_categories'])) {
        $subs = is_string($part['sub_categories']) ? json_decode($part['sub_categories'], true) : $part['sub_categories'];
        if (is_array($subs)) {
            foreach ($subs as $s) {
                if (stripos($event['title'], $s) !== false || stripos($s, $event['title']) !== false || stripos($event['category'], $s) !== false) {
                    $isRegistered = true;
                    break;
                }
            }
        }
    }

    // Check 4c: Check PMR level match or 'Umum'/'Semua' category
    if (!$isRegistered) {
        if ($event['pmr_level'] === 'Semua' || $event['category'] === 'Umum') {
            $isRegistered = true;
        } else if (strtolower($event['pmr_level']) === strtolower($part['level'])) {
            $isRegistered = true;
        }
    }

    if (!$isRegistered) {
        jsonResponse([
            'error' => 'Presensi Ditolak: Peserta ' . $part['full_name'] . ' (' . $code . ') BELUM TERDAFTAR dalam kegiatan "' . $event['title'] . '"!',
            'participant' => $part,
            'event' => $event,
            'is_registered' => false
        ], 400);
    }

    // 5. CHECK PREVIOUS ATTENDANCE RECORD (Masuk / Keluar)
    $stmtCheckLast = $pdo->prepare("
        SELECT * FROM attendance 
        WHERE event_id = ? AND participant_id = ? 
        ORDER BY id DESC LIMIT 1
    ");
    $stmtCheckLast->execute([$eventId, $part['id']]);
    $lastAttendance = $stmtCheckLast->fetch();

    $formattedLastTime = '';
    if ($lastAttendance) {
        $rawTime = $lastAttendance['scanned_at'] ?? $lastAttendance['created_at'] ?? null;
        if ($rawTime) {
            $ts = strtotime($rawTime);
            if ($ts !== false) {
                $formattedLastTime = date('H:i, d-m-Y', $ts);
            }
        }
        if (!$formattedLastTime) {
            $formattedLastTime = date('H:i, d-m-Y');
        }
    }

    if ($type === 'masuk') {
        // Check if participant is currently checked-in at another event without checking out
        $stmtActiveOther = $pdo->prepare("
            SELECT a.event_id, a.status, a.scanned_at, e.title AS event_title 
            FROM attendance a 
            JOIN events e ON a.event_id = e.id 
            WHERE a.participant_id = ? AND a.event_id != ? 
            AND a.id IN (
                SELECT MAX(id) FROM attendance WHERE participant_id = ? GROUP BY event_id
            )
            AND a.status IN ('masuk', 'hadir')
            ORDER BY a.id DESC LIMIT 1
        ");
        $stmtActiveOther->execute([$part['id'], $eventId, $part['id']]);
        $activeOther = $stmtActiveOther->fetch();

        if ($activeOther) {
            $otherTime = '';
            if (!empty($activeOther['scanned_at'])) {
                $ts = strtotime($activeOther['scanned_at']);
                if ($ts) $otherTime = ' pada jam ' . date('H:i', $ts);
            }
            jsonResponse([
                'error' => 'Presensi Ditolak: Peserta ' . $part['full_name'] . ' (' . $code . ') MASIH TERCATAT MASUK pada kegiatan lain ("' . $activeOther['event_title'] . '"' . $otherTime . '). Peserta harus Presensi Keluar (Check-Out) dari kegiatan sebelumnya terlebih dahulu!',
                'participant' => $part,
                'event' => $event,
                'active_other_event' => $activeOther
            ], 400);
        }

        if ($lastAttendance && ($lastAttendance['status'] === 'masuk' || $lastAttendance['status'] === 'hadir')) {
            jsonResponse([
                'error' => 'Peserta ' . $part['full_name'] . ' (' . $code . ') SUDAH melakukan Presensi Masuk sebelumnya pada kegiatan ini pada ' . $formattedLastTime . '!',
                'participant' => $part,
                'event' => $event,
                'attendance' => $lastAttendance
            ], 400);
        }
    } else if ($type === 'keluar') {
        if (!$lastAttendance || ($lastAttendance['status'] !== 'masuk' && $lastAttendance['status'] !== 'hadir')) {
            jsonResponse([
                'error' => 'Presensi Ditolak: Peserta ' . $part['full_name'] . ' (' . $code . ') BELUM melakukan Presensi Masuk untuk kegiatan ini!',
                'participant' => $part,
                'event' => $event
            ], 400);
        }
        if ($lastAttendance['status'] === 'keluar') {
            jsonResponse([
                'error' => 'Peserta ' . $part['full_name'] . ' (' . $code . ') SUDAH melakukan Presensi Keluar sebelumnya pada ' . $formattedLastTime . '!',
                'participant' => $part,
                'event' => $event,
                'attendance' => $lastAttendance
            ], 400);
        }
    }

    // 6. RECORD ATTENDANCE
    $stmtAtt = $pdo->prepare("INSERT INTO attendance (event_id, participant_id, status, scanned_by) VALUES (?, ?, ?, ?)");
    $stmtAtt->execute([$eventId, $part['id'], $type, $user['username']]);

    $actionText = ($type === 'masuk') ? 'PRESENSI MASUK (Check-In)' : (($type === 'keluar') ? 'PRESENSI KELUAR (Check-Out)' : strtoupper($type));

    jsonResponse([
        'message' => 'BERHASIL! ' . $actionText . ' untuk ' . $part['full_name'] . ' (' . $code . ') pada kegiatan "' . $event['title'] . '".',
        'participant' => $part,
        'event' => $event,
        'type' => $type,
        'timestamp' => date('H:i:s, d-m-Y')
    ]);
}

if ($method === 'GET' && $action === 'my_attendance') {
    $user = requireUser(['peserta', 'unit', 'kabupaten', 'panitia', 'peninjau', 'tamu', 'media']);
    
    $stmtP = $pdo->prepare("SELECT id, code, full_name FROM participants WHERE user_id = ? OR email = ? OR code = ? ORDER BY id DESC LIMIT 1");
    $stmtP->execute([$user['id'], $user['email'] ?? '', $user['username'] ?? '']);
    $part = $stmtP->fetch();

    if (!$part) {
        jsonResponse(['history' => []]);
    }

    $stmtAtt = $pdo->prepare("
        SELECT a.*, e.title AS event_title, e.location AS event_location, e.event_date
        FROM attendance a
        JOIN events e ON a.event_id = e.id
        WHERE a.participant_id = ?
        ORDER BY a.scanned_at ASC
    ");
    $stmtAtt->execute([$part['id']]);
    $rows = $stmtAtt->fetchAll();

    $historyMap = [];
    foreach ($rows as $r) {
        $eid = $r['event_id'];
        if (!isset($historyMap[$eid])) {
            $historyMap[$eid] = [
                'event_id' => $eid,
                'event_title' => $r['event_title'],
                'event_location' => $r['event_location'],
                'event_date' => $r['event_date'],
                'jam_masuk' => null,
                'jam_keluar' => null,
                'status' => 'belum'
            ];
        }
        $st = strtolower($r['status']);
        if ($st === 'masuk' || $st === 'hadir') {
            $historyMap[$eid]['jam_masuk'] = $r['scanned_at'];
            if (!$historyMap[$eid]['jam_keluar']) {
                $historyMap[$eid]['status'] = 'masuk';
            }
        } else if ($st === 'keluar') {
            $historyMap[$eid]['jam_keluar'] = $r['scanned_at'];
            $historyMap[$eid]['status'] = 'keluar';
        }
    }

    jsonResponse([
        'participant' => $part,
        'history' => array_values($historyMap)
    ]);
}

if ($method === 'GET' && $action === 'registered_participants') {
    $eventId = (int)($_GET['event_id'] ?? 0);
    if (!$eventId) jsonResponse(['event' => null, 'total' => 0, 'participants' => []]);

    $stmtEvt = $pdo->prepare("SELECT * FROM events WHERE id = ?");
    $stmtEvt->execute([$eventId]);
    $event = $stmtEvt->fetch();
    if (!$event) jsonResponse(['error' => 'Kegiatan tidak ditemukan.'], 404);

    // Fetch attendance status map for this event
    $stmtAtt = $pdo->prepare("SELECT participant_id, status, scanned_at FROM attendance WHERE event_id = ? ORDER BY id ASC");
    $stmtAtt->execute([$eventId]);
    $attRows = $stmtAtt->fetchAll();
    
    $attMap = [];
    foreach ($attRows as $ar) {
        $pid = $ar['participant_id'];
        if (!isset($attMap[$pid])) {
            $attMap[$pid] = [
                'has_masuk' => false,
                'has_keluar' => false,
                'latest_status' => 'belum',
                'last_scanned_at' => null
            ];
        }
        $st = strtolower($ar['status']);
        if ($st === 'masuk' || $st === 'hadir') {
            $attMap[$pid]['has_masuk'] = true;
            $attMap[$pid]['latest_status'] = 'masuk';
        } else if ($st === 'keluar') {
            $attMap[$pid]['has_keluar'] = true;
            $attMap[$pid]['latest_status'] = 'keluar';
        }
        $attMap[$pid]['last_scanned_at'] = $ar['scanned_at'];
    }

    // Registered Participants
    $stmtRegPart = $pdo->prepare("SELECT participant_id FROM event_registrations WHERE event_id = ?");
    $stmtRegPart->execute([$eventId]);
    $registeredIds = array_map('intval', $stmtRegPart->fetchAll(PDO::FETCH_COLUMN));

    $stmtAllVerified = $pdo->query("
        SELECT p.id, p.code, p.full_name, p.level, p.photo_url, p.phone, p.sub_categories, p.unit_id, un.name AS unit_name 
        FROM participants p 
        LEFT JOIN units un ON p.unit_id = un.id 
        WHERE p.status = 'verified_kabupaten' 
        ORDER BY p.full_name ASC
    ");
    $allVerified = $stmtAllVerified->fetchAll();

    $maxQuota = (int)($event['max_participants_per_unit'] ?? 0);

    // Group participants by unit_id to enforce max_participants_per_unit per school
    $groupedByUnit = [];
    foreach ($allVerified as $p) {
        $uid = (int)($p['unit_id'] ?? 0);
        $groupedByUnit[$uid][] = $p;
    }

    $registeredList = [];
    foreach ($groupedByUnit as $uid => $uParts) {
        $unitCount = 0;

        // Check explicit registrations for this unit first
        $explicitForUnit = array_filter($uParts, function($p) use ($registeredIds) {
            return in_array((int)$p['id'], $registeredIds);
        });

        if (!empty($explicitForUnit)) {
            foreach ($explicitForUnit as $p) {
                if ($maxQuota > 0 && $unitCount >= $maxQuota) {
                    break;
                }
                $info = $attMap[$p['id']] ?? [
                    'has_masuk' => false,
                    'has_keluar' => false,
                    'latest_status' => 'belum',
                    'last_scanned_at' => null
                ];
                $p['has_masuk'] = $info['has_masuk'];
                $p['has_keluar'] = $info['has_keluar'];
                $p['attendance_status'] = $info['latest_status'];
                $p['last_scanned_at'] = $info['last_scanned_at'];
                $registeredList[] = $p;
                $unitCount++;
            }
        } else {
            // Implicit matching for this unit capped at maxQuota
            foreach ($uParts as $p) {
                if ($maxQuota > 0 && $unitCount >= $maxQuota) {
                    break;
                }
                $isReg = false;
                if (!empty($p['sub_categories'])) {
                    $subs = is_string($p['sub_categories']) ? json_decode($p['sub_categories'], true) : $p['sub_categories'];
                    if (is_array($subs)) {
                        foreach ($subs as $s) {
                            if (stripos($event['title'], $s) !== false || stripos($s, $event['title']) !== false || stripos($event['category'], $s) !== false) {
                                $isReg = true;
                                break;
                            }
                        }
                    }
                }
                if (!$isReg) {
                    if ($event['pmr_level'] === 'Semua' || $event['category'] === 'Umum') {
                        $isReg = true;
                    } else if (strtolower($event['pmr_level']) === strtolower($p['level'])) {
                        $isReg = true;
                    }
                }
                if ($isReg) {
                    $info = $attMap[$p['id']] ?? [
                        'has_masuk' => false,
                        'has_keluar' => false,
                        'latest_status' => 'belum',
                        'last_scanned_at' => null
                    ];
                    $p['has_masuk'] = $info['has_masuk'];
                    $p['has_keluar'] = $info['has_keluar'];
                    $p['attendance_status'] = $info['latest_status'];
                    $p['last_scanned_at'] = $info['last_scanned_at'];
                    $registeredList[] = $p;
                    $unitCount++;
                }
            }
        }
    }

    jsonResponse([
        'event' => $event,
        'total' => count($registeredList),
        'participants' => $registeredList
    ]);
}

if ($method === 'GET') {
    $user = requireUser(['kabupaten', 'unit', 'panitia', 'admin', 'penilai', 'juri']);
    $eventId = (int)($_GET['event_id'] ?? 0);
    if (!$eventId) jsonResponse(['logs' => [], 'stats' => null]);

    // 1. Fetch Event Info
    $stmtEvt = $pdo->prepare("SELECT * FROM events WHERE id = ?");
    $stmtEvt->execute([$eventId]);
    $event = $stmtEvt->fetch();

    // 2. Fetch Logs
    $stmt = $pdo->prepare("
        SELECT a.*, p.full_name, p.code AS participant_code, p.level, p.photo_url, un.name AS unit_name 
        FROM attendance a 
        JOIN participants p ON a.participant_id = p.id 
        JOIN units un ON p.unit_id = un.id 
        WHERE a.event_id = ? 
        ORDER BY a.scanned_at DESC
    ");
    $stmt->execute([$eventId]);
    $logs = $stmt->fetchAll();

    // 3. Stats calculations: Presensi Masuk & Keluar
    $stmtMasuk = $pdo->prepare("SELECT COUNT(DISTINCT participant_id) FROM attendance WHERE event_id = ? AND (status = 'masuk' OR status = 'hadir')");
    $stmtMasuk->execute([$eventId]);
    $totalMasuk = (int)$stmtMasuk->fetchColumn();

    $stmtKeluar = $pdo->prepare("SELECT COUNT(DISTINCT participant_id) FROM attendance WHERE event_id = ? AND status = 'keluar'");
    $stmtKeluar->execute([$eventId]);
    $totalKeluar = (int)$stmtKeluar->fetchColumn();

    // 4. Calculate total registered / eligible participants for this event
    $stmtRegPart = $pdo->prepare("SELECT participant_id FROM event_registrations WHERE event_id = ?");
    $stmtRegPart->execute([$eventId]);
    $registeredIds = $stmtRegPart->fetchAll(PDO::FETCH_COLUMN);

    $stmtAllVerified = $pdo->query("SELECT id, full_name, code, level, sub_categories FROM participants WHERE status = 'verified_kabupaten'");
    $allVerified = $stmtAllVerified->fetchAll();

    $totalRegistered = 0;
    foreach ($allVerified as $p) {
        $isReg = false;
        if (in_array($p['id'], $registeredIds)) {
            $isReg = true;
        }
        if (!$isReg && !empty($p['sub_categories'])) {
            $subs = is_string($p['sub_categories']) ? json_decode($p['sub_categories'], true) : $p['sub_categories'];
            if (is_array($subs)) {
                foreach ($subs as $s) {
                    if ($event && (stripos($event['title'], $s) !== false || stripos($s, $event['title']) !== false || stripos($event['category'], $s) !== false)) {
                        $isReg = true;
                        break;
                    }
                }
            }
        }
        if (!$isReg && $event) {
            if ($event['pmr_level'] === 'Semua' || $event['category'] === 'Umum') {
                $isReg = true;
            } else if (strtolower($event['pmr_level']) === strtolower($p['level'])) {
                $isReg = true;
            }
        }
        if ($isReg) {
            $totalRegistered++;
        }
    }

    $belumPresensi = max(0, $totalRegistered - $totalMasuk);
    $percentage = $totalRegistered > 0 ? round(($totalMasuk / $totalRegistered) * 100) : 0;

    jsonResponse([
        'logs' => $logs,
        'stats' => [
            'total_registered' => $totalRegistered,
            'total_masuk' => $totalMasuk,
            'total_keluar' => $totalKeluar,
            'belum_presensi' => $belumPresensi,
            'percentage' => $percentage
        ],
        'event' => $event
    ]);
}

