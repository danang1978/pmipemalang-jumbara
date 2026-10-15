<?php
// ==========================================================================
// API EVENTS & SCHEDULE (JADWAL KEGIATAN JUMBARA)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = getJsonInput();
$id = (int)($_GET['id'] ?? $input['id'] ?? 0);

if ($method === 'GET' && $action === 'unit_events') {
    $user = requireUser(['unit', 'kabupaten']);
    $unitId = ($user['role'] === 'unit') ? (int)$user['unit_id'] : (int)($_GET['unit_id'] ?? $user['unit_id'] ?? 0);

    $stmtEvt = $pdo->query("SELECT * FROM events ORDER BY event_date ASC, start_time ASC");
    $events = $stmtEvt->fetchAll();

    $stmtUnitPart = $pdo->prepare("SELECT id, code, full_name, level, sub_categories, photo_url FROM participants WHERE unit_id = ? AND status = 'verified_kabupaten' ORDER BY full_name ASC");
    $stmtUnitPart->execute([$unitId]);
    $unitParticipants = $stmtUnitPart->fetchAll();

    $stmtRegs = $pdo->prepare("
        SELECT er.event_id, er.participant_id 
        FROM event_registrations er 
        JOIN participants p ON er.participant_id = p.id 
        WHERE p.unit_id = ?
    ");
    $stmtRegs->execute([$unitId]);
    $regs = $stmtRegs->fetchAll();

    $regMap = [];
    foreach ($regs as $r) {
        $regMap[$r['event_id']][] = (int)$r['participant_id'];
    }

    $result = [];
    foreach ($events as $e) {
        $eid = (int)$e['id'];
        $explicitIds = $regMap[$eid] ?? [];
        $maxQuota = (int)($e['max_participants_per_unit'] ?? 0);

        if (!empty($explicitIds)) {
            $registeredIds = $explicitIds;
        } else {
            $registeredIds = [];
            foreach ($unitParticipants as $up) {
                $pid = (int)$up['id'];

                $isMatch = false;
                if (!empty($up['sub_categories'])) {
                    $subs = is_string($up['sub_categories']) ? json_decode($up['sub_categories'], true) : $up['sub_categories'];
                    if (is_array($subs)) {
                        foreach ($subs as $s) {
                            if (stripos($e['title'], $s) !== false || stripos($s, $e['title']) !== false || stripos($e['category'], $s) !== false) {
                                $isMatch = true;
                                break;
                            }
                        }
                    }
                }
                if (!$isMatch) {
                    if ($e['pmr_level'] === 'Semua' || $e['category'] === 'Umum') {
                        $isMatch = true;
                    } else if (strtolower($e['pmr_level']) === strtolower($up['level'])) {
                        $isMatch = true;
                    }
                }
                if ($isMatch) {
                    $registeredIds[] = $pid;
                    if ($maxQuota > 0 && count($registeredIds) >= $maxQuota) {
                        break;
                    }
                }
            }
        }

        $e['registered_participant_ids'] = array_values(array_unique($registeredIds));
        $e['explicit_registered_ids'] = array_values(array_unique($explicitIds));
        $e['registered_count'] = count($e['registered_participant_ids']);
        $result[] = $e;
    }

    jsonResponse([
        'events' => $result,
        'unit_participants' => $unitParticipants
    ]);
}

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM events ORDER BY event_date ASC, start_time ASC");
    $events = $stmt->fetchAll();
    
    // Batch fetch all aspects in 1 query to prevent N+1 overhead
    $stmtAspects = $pdo->query("SELECT id, event_id, aspect_name, max_score, weight FROM event_aspects ORDER BY id ASC");
    $aspectsGrouped = [];
    while ($asp = $stmtAspects->fetch()) {
        $aspectsGrouped[$asp['event_id']][] = [
            'id' => $asp['id'],
            'aspect_name' => $asp['aspect_name'],
            'max_score' => $asp['max_score'],
            'weight' => $asp['weight']
        ];
    }
    
    foreach ($events as &$e) {
        $e['aspects'] = $aspectsGrouped[$e['id']] ?? [];
    }
    unset($e);
    
    jsonResponse($events);
}

if ($method === 'POST' && $action === 'save_unit_event_registrations') {
    $user = requireUser(['unit', 'kabupaten']);
    $input = getJsonInput();

    $eventId = (int)($input['event_id'] ?? 0);
    $unitId = (int)($input['unit_id'] ?? $user['unit_id'] ?? 0);
    $participantIds = is_array($input['participant_ids'] ?? null) ? array_filter(array_map('intval', $input['participant_ids'])) : [];

    if (!$eventId || !$unitId) {
        jsonResponse(['error' => 'ID Kegiatan dan ID Unit Sekolah wajib diisi.'], 400);
    }

    // Check event quota per unit
    $stmtEvt = $pdo->prepare("SELECT title, max_participants_per_unit FROM events WHERE id = ?");
    $stmtEvt->execute([$eventId]);
    $evt = $stmtEvt->fetch();

    if (!$evt) {
        jsonResponse(['error' => 'Kegiatan tidak ditemukan.'], 404);
    }

    $maxQuota = (int)($evt['max_participants_per_unit'] ?? 0);
    $selectedCount = count($participantIds);

    if ($maxQuota > 0 && $selectedCount > $maxQuota) {
        jsonResponse([
            'error' => "Pendaftaran Ditolak System! Kegiatan \"{$evt['title']}\" membatasi kuota maksimal {$maxQuota} peserta per unit sekolah (Anda memilih {$selectedCount} peserta)."
        ], 400);
    }

    // 1. Delete existing unit registrations for this event
    $stmtDel = $pdo->prepare("
        DELETE FROM event_registrations 
        WHERE event_id = ? AND participant_id IN (SELECT id FROM participants WHERE unit_id = ?)
    ");
    $stmtDel->execute([$eventId, $unitId]);

    // 2. Insert new participant registrations
    if (!empty($participantIds)) {
        $stmtIns = $pdo->prepare("INSERT INTO event_registrations (event_id, participant_id) VALUES (?, ?)");
        foreach ($participantIds as $pid) {
            if ($pid > 0) {
                $stmtIns->execute([$eventId, $pid]);
            }
        }
    }

    jsonResponse([
        'message' => 'Pendaftaran peserta kontingen unit untuk kegiatan ini berhasil diperbarui!'
    ]);
}

if ($method === 'POST') {
    requireUser(['kabupaten', 'unit', 'panitia']);
    $input = getJsonInput();

    $id = (int)($input['id'] ?? 0);
    $title = trim($input['title'] ?? '');
    $date = $input['event_date'] ?? date('Y-m-d');
    $startTime = $input['start_time'] ?? '08:00';
    $endTime = $input['end_time'] ?? '10:00';
    $maxQuota = max(0, (int)($input['max_participants_per_unit'] ?? 0));

    if (!$title) jsonResponse(['error' => 'Judul kegiatan wajib diisi.'], 400);

    if ($id > 0) {
        $stmt = $pdo->prepare("
            UPDATE events 
            SET title = ?, category = ?, pmr_level = ?, max_participants_per_unit = ?, location = ?, event_date = ?, start_time = ?, end_time = ?, description = ?, pic_name = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $title, $input['category'] ?? 'Umum', $input['pmr_level'] ?? 'Semua',
            $maxQuota, $input['location'] ?? 'Buperta PMI', $date, $startTime, $endTime,
            $input['description'] ?? '', $input['pic_name'] ?? 'Panitia', $id
        ]);
        jsonResponse(['message' => 'Jadwal kegiatan & kuota berhasil diperbarui!']);
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO events (title, category, pmr_level, max_participants_per_unit, location, event_date, start_time, end_time, description, pic_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $title, $input['category'] ?? 'Umum', $input['pmr_level'] ?? 'Semua',
            $maxQuota, $input['location'] ?? 'Buperta PMI', $date, $startTime, $endTime,
            $input['description'] ?? '', $input['pic_name'] ?? 'Panitia'
        ]);
        jsonResponse(['message' => 'Jadwal kegiatan berhasil ditambahkan!']);
    }
}

if ($method === 'DELETE') {
    requireUser(['kabupaten']);
    if (!$id) jsonResponse(['error' => 'ID Kegiatan wajib.'], 400);

    $stmt = $pdo->prepare("DELETE FROM events WHERE id = ?");
    $stmt->execute([$id]);
    $event = null;
    jsonResponse(['message' => 'Jadwal kegiatan berhasil dihapus.']);
}
