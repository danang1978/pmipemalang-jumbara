<?php
// ==========================================================================
// API SCORES & ASPEK PENILAIAN KEGIATAN (MULTI-PENILAI & VALIDASI ADMIN KAB)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Note: Aspect tables and score columns are maintained by database migrations, not runtime requests.

// --------------------------------------------------------------------------
// 1. GET: Ambil Aspek Penilaian per Kegiatan
// --------------------------------------------------------------------------
if ($method === 'GET' && $action === 'event_aspects') {
    $eventId = (int)($_GET['event_id'] ?? 0);
    if (!$eventId) {
        jsonResponse(['error' => 'ID Kegiatan (event_id) wajib disertakan.'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM event_aspects WHERE event_id = ? ORDER BY id ASC");
    $stmt->execute([$eventId]);
    jsonResponse($stmt->fetchAll());
}

// --------------------------------------------------------------------------
// 2. POST: Simpan / Edit Aspek Penilaian per Kegiatan
// --------------------------------------------------------------------------
if ($method === 'POST' && $action === 'save_event_aspects') {
    requireUser(['kabupaten', 'admin', 'panitia', 'unit', 'penilai', 'juri']);
    $input = getJsonInput();

    $eventId = (int)($input['event_id'] ?? 0);
    $aspects = $input['aspects'] ?? [];

    if (!$eventId) {
        jsonResponse(['error' => 'ID Kegiatan wajib diisi.'], 400);
    }

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $pdo->beginTransaction();
    try {
        $stmtDel = $pdo->prepare("DELETE FROM event_aspects WHERE event_id = ?");
        $stmtDel->execute([$eventId]);

        $stmtIns = $pdo->prepare("INSERT INTO event_aspects (event_id, aspect_name, max_score, weight) VALUES (?, ?, ?, ?)");
        foreach ($aspects as $asp) {
            $name = trim($asp['aspect_name'] ?? '');
            $maxScore = (float)($asp['max_score'] ?? 100);
            $weight = (float)($asp['weight'] ?? 1.0);
            if (!empty($name)) {
                $stmtIns->execute([$eventId, $name, $maxScore, $weight]);
            }
        }
        $pdo->commit();
        jsonResponse(['message' => 'Aspek penilaian kegiatan berhasil disimpan!']);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonResponse(['error' => 'Gagal menyimpan aspek penilaian: ' . $e->getMessage()], 500);
    }
}

// --------------------------------------------------------------------------
// 3. GET: Lookup Target (Scan QR Code / Search NIK, Code, Peserta, Unit)
// --------------------------------------------------------------------------
if ($method === 'GET' && $action === 'lookup_target') {
    $q = trim($_GET['q'] ?? $_GET['code'] ?? '');
    $targetType = $_GET['target_type'] ?? 'peserta';

    if (!$q) {
        jsonResponse(['error' => 'Kode atau Kata Kunci Pencarian wajib diisi.'], 400);
    }

    if ($targetType === 'kontingen') {
        $stmt = $pdo->prepare("
            SELECT u.*, u.id AS unit_id, u.name AS unit_name, u.level_category,
                   (SELECT COUNT(*) FROM participants WHERE unit_id = u.id AND status = 'verified_kabupaten') AS participant_count
            FROM units u 
            WHERE u.name LIKE ? OR CAST(u.id AS CHAR) = ?
            LIMIT 5
        ");
        $stmt->execute(['%' . $q . '%', $q]);
        $units = $stmt->fetchAll();
        jsonResponse(['target_type' => 'kontingen', 'results' => $units]);
    } else {
        $stmt = $pdo->prepare("
            SELECT p.*, u.name AS unit_name, u.level_category
            FROM participants p
            JOIN units u ON p.unit_id = u.id
            WHERE p.code = ? OR p.nisn = ? OR p.full_name LIKE ?
            LIMIT 10
        ");
        $stmt->execute([$q, $q, '%' . $q . '%']);
        $participants = $stmt->fetchAll();
        jsonResponse(['target_type' => 'peserta', 'results' => $participants]);
    }
}

// --------------------------------------------------------------------------
// 4. GET: Klasemen Juara Umum
// --------------------------------------------------------------------------
if ($method === 'GET' && $action === 'standings') {
    $sql = "
        SELECT 
            un.id AS unit_id,
            un.name AS unit_name,
            un.level_category,
            SUM(CASE WHEN s.grade = 'Emas' THEN 1 ELSE 0 END) AS emas,
            SUM(CASE WHEN s.grade = 'Perak' THEN 1 ELSE 0 END) AS perak,
            SUM(CASE WHEN s.grade = 'Perunggu' THEN 1 ELSE 0 END) AS perunggu,
            COUNT(s.id) AS total_lomba
        FROM units un
        LEFT JOIN scores s ON un.id = s.unit_id
        GROUP BY un.id, un.name, un.level_category
        ORDER BY emas DESC, perak DESC, perunggu DESC, total_lomba DESC
    ";
    $stmt = $pdo->query($sql);
    jsonResponse($stmt->fetchAll());
}

// --------------------------------------------------------------------------
// 5. POST: Validasi / Finalisasi Nilai (Khusus Admin Kabupaten)
// --------------------------------------------------------------------------
if ($method === 'POST' && $action === 'validate') {
    $user = requireUser(['kabupaten']);
    $input = getJsonInput();
    $scoreId = (int)($input['score_id'] ?? 0);
    $scoreIds = $input['score_ids'] ?? [];
    $eventId = (int)($input['event_id'] ?? 0);

    if (!empty($scoreIds) && is_array($scoreIds)) {
        $inQuery = implode(',', array_map('intval', $scoreIds));
        $stmt = $pdo->prepare("UPDATE scores SET status = 'validated', validated_at = NOW(), validated_by = ? WHERE id IN ($inQuery)");
        $stmt->execute([$user['id']]);
        jsonResponse(['message' => 'Berhasil memvalidasi ' . count($scoreIds) . ' penilaian! Nilai telah terkunci untuk Penilai.']);
    } else if ($eventId > 0) {
        $stmt = $pdo->prepare("UPDATE scores SET status = 'validated', validated_at = NOW(), validated_by = ? WHERE event_id = ?");
        $stmt->execute([$user['id'], $eventId]);
        jsonResponse(['message' => 'Berhasil memvalidasi seluruh penilaian untuk kegiatan ini! Nilai telah terkunci.']);
    } else if ($scoreId > 0) {
        $stmt = $pdo->prepare("UPDATE scores SET status = 'validated', validated_at = NOW(), validated_by = ? WHERE id = ?");
        $stmt->execute([$user['id'], $scoreId]);
        jsonResponse(['message' => 'Penilaian berhasil divalidasi dan dikunci! Penilai tidak dapat mengubah nilai ini.']);
    } else {
        jsonResponse(['error' => 'Harap tentukan ID Penilaian atau Kegiatan yang akan divalidasi.'], 400);
    }
}

// --------------------------------------------------------------------------
// 6. POST: Buka Kunci Nilai (Khusus Admin Kabupaten)
// --------------------------------------------------------------------------
if ($method === 'POST' && $action === 'unlock') {
    $user = requireUser(['kabupaten']);
    $input = getJsonInput();
    $scoreId = (int)($input['score_id'] ?? 0);

    if ($scoreId > 0) {
        $stmt = $pdo->prepare("UPDATE scores SET status = 'draft', validated_at = NULL, validated_by = NULL WHERE id = ?");
        $stmt->execute([$scoreId]);
        jsonResponse(['message' => 'Kunci penilaian berhasil dibuka! Penilai kini dapat merevisi nilai ini.']);
    } else {
        jsonResponse(['error' => 'ID Penilaian wajib disertakan.'], 400);
    }
}

// --------------------------------------------------------------------------
// 7. POST: Hapus Nilai (Memeriksa Status Kunci)
// --------------------------------------------------------------------------
if ($method === 'POST' && $action === 'delete') {
    $user = requireUser(['kabupaten', 'penilai', 'juri', 'panitia', 'admin']);
    $input = getJsonInput();
    $scoreId = (int)($input['score_id'] ?? 0);

    if (!$scoreId) {
        jsonResponse(['error' => 'ID Penilaian wajib diisi.'], 400);
    }

    $stmtCheck = $pdo->prepare("SELECT * FROM scores WHERE id = ?");
    $stmtCheck->execute([$scoreId]);
    $existing = $stmtCheck->fetch();

    if (!$existing) {
        jsonResponse(['error' => 'Data penilaian tidak ditemukan.'], 404);
    }

    if (($existing['status'] === 'validated' || $existing['status'] === 'final') && $user['role'] !== 'kabupaten') {
        jsonResponse(['error' => 'Gagal Menghapus: Penilaian ini telah divalidasi/difinalkan oleh Admin Kabupaten dan sudah TERKUNCI.'], 403);
    }

    $stmtDel = $pdo->prepare("DELETE FROM scores WHERE id = ?");
    $stmtDel->execute([$scoreId]);
    jsonResponse(['message' => 'Data penilaian berhasil dihapus.']);
}

// --------------------------------------------------------------------------
// 8. GET: Daftar Semua Skor
// --------------------------------------------------------------------------
if ($method === 'GET') {
    $unitId = (int)($_GET['unit_id'] ?? 0);
    $category = $_GET['category'] ?? '';

    $where = [];
    $params = [];
    if ($unitId) {
        $where[] = "s.unit_id = ?";
        $params[] = $unitId;
    }
    if ($category) {
        $where[] = "s.category_type = ?";
        $params[] = $category;
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $stmt = $pdo->prepare("
        SELECT s.*, un.name AS unit_name, p.full_name AS participant_name, p.code AS participant_code,
               e.title AS event_title, u_eval.username AS evaluator_username
        FROM scores s 
        JOIN units un ON s.unit_id = un.id 
        LEFT JOIN participants p ON s.participant_id = p.id 
        LEFT JOIN events e ON s.event_id = e.id
        LEFT JOIN users u_eval ON s.evaluator_user_id = u_eval.id
        $whereSql 
        ORDER BY s.id DESC
    ");
    $stmt->execute($params);
    $scores = $stmt->fetchAll();

    if (!empty($scores)) {
        $scoreIds = array_column($scores, 'id');
        $placeholders = implode(',', array_fill(0, count($scoreIds), '?'));
        $stmtAspects = $pdo->prepare("
            SELECT sad.score_id, sad.score_val, ea.aspect_name, ea.max_score 
            FROM score_aspect_details sad
            JOIN event_aspects ea ON sad.aspect_id = ea.id
            WHERE sad.score_id IN ($placeholders)
        ");
        $stmtAspects->execute($scoreIds);
        $aspectMap = [];
        while ($row = $stmtAspects->fetch()) {
            $aspectMap[$row['score_id']][] = [
                'score_val' => $row['score_val'],
                'aspect_name' => $row['aspect_name'],
                'max_score' => $row['max_score']
            ];
        }
        foreach ($scores as &$score) {
            $score['aspect_details'] = $aspectMap[$score['id']] ?? [];
        }
        unset($score);
    }

    jsonResponse($scores);
}

// --------------------------------------------------------------------------
// 9. POST: Submit / Edit Penilaian (Banyak Penilai & Proteksi Kunci Admin Kab)
// --------------------------------------------------------------------------
if ($method === 'POST') {
    $user = requireUser(['kabupaten', 'penilai', 'juri', 'panitia', 'admin', 'unit']);
    $input = getJsonInput();

    $scoreId = !empty($input['id']) ? (int)$input['id'] : (!empty($input['score_id']) ? (int)$input['score_id'] : 0);
    $eventId = !empty($input['event_id']) ? (int)$input['event_id'] : null;
    $unitId = (int)($input['unit_id'] ?? 0);
    $participantId = !empty($input['participant_id']) ? (int)$input['participant_id'] : null;
    $targetType = $input['target_type'] ?? ($participantId ? 'peserta' : 'kontingen');
    $cat = $input['category_type'] ?? 'Jumpa';
    $branch = trim($input['branch_name'] ?? '');
    $level = $input['pmr_level'] ?? 'Wira';
    $judgeName = trim($input['judge_name'] ?? ($user['full_name'] ?? ($user['username'] ?? 'Penilai PMI')));
    $notes = trim($input['notes'] ?? '');
    $aspectScores = $input['aspect_scores'] ?? [];

    if (!$unitId || !$branch) {
        jsonResponse(['error' => 'Unit/Kontingen dan Cabang Lomba/Kegiatan wajib diisi.'], 400);
    }

    // Checking validation status if updating existing score
    if ($scoreId > 0) {
        $stmtChk = $pdo->prepare("SELECT status FROM scores WHERE id = ?");
        $stmtChk->execute([$scoreId]);
        $existingStatus = $stmtChk->fetchColumn();

        if (($existingStatus === 'validated' || $existingStatus === 'final') && $user['role'] !== 'kabupaten') {
            jsonResponse([
                'error' => 'Akses Ditolak: Penilaian ini telah DIVALIDASI / DIFINALKAN oleh Admin Kabupaten dan sudah TERKUNCI. Perubahan nilai hanya dapat dilakukan oleh Admin Kabupaten.'
            ], 403);
        }
    }

    // Calculate score value
    $totalScore = 0.0;
    if (!empty($aspectScores) && is_array($aspectScores)) {
        foreach ($aspectScores as $aspId => $val) {
            $totalScore += (float)$val;
        }
    } else {
        $totalScore = (float)($input['score_val'] ?? 0);
    }

    if ($totalScore <= 0) {
        jsonResponse(['error' => 'Nilai kegiatan harus lebih besar dari 0.'], 400);
    }

    // Determine Grade based on score
    $grade = 'Peserta';
    if ($totalScore >= 90.0) $grade = 'Emas';
    else if ($totalScore >= 80.0) $grade = 'Perak';
    else if ($totalScore >= 70.0) $grade = 'Perunggu';

    $pdo->beginTransaction();
    try {
        if ($scoreId > 0) {
            $stmt = $pdo->prepare("
                UPDATE scores SET 
                event_id = ?, unit_id = ?, participant_id = ?, target_type = ?, 
                category_type = ?, branch_name = ?, pmr_level = ?, score_val = ?, 
                grade = ?, judge_name = ?, notes = ?, evaluator_user_id = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $eventId, $unitId, $participantId, $targetType,
                $cat, $branch, $level, $totalScore,
                $grade, $judgeName, $notes, $user['id'], $scoreId
            ]);
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO scores 
                (event_id, unit_id, participant_id, target_type, category_type, branch_name, pmr_level, score_val, grade, judge_name, notes, evaluator_user_id, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
            ");
            $stmt->execute([
                $eventId, $unitId, $participantId, $targetType,
                $cat, $branch, $level, $totalScore,
                $grade, $judgeName, $notes, $user['id']
            ]);
            $scoreId = (int)$pdo->lastInsertId();
        }

        // Save aspect breakdown
        if (!empty($aspectScores) && is_array($aspectScores)) {
            $pdo->prepare("DELETE FROM score_aspect_details WHERE score_id = ?")->execute([$scoreId]);
            $stmtAsp = $pdo->prepare("INSERT INTO score_aspect_details (score_id, aspect_id, score_val) VALUES (?, ?, ?)");
            foreach ($aspectScores as $aspId => $val) {
                $stmtAsp->execute([$scoreId, (int)$aspId, (float)$val]);
            }
        }

        $pdo->commit();

        jsonResponse([
            'message' => 'Penilaian kegiatan berhasil disimpan oleh ' . htmlspecialchars($judgeName) . '! Medali: ' . $grade,
            'score_id' => $scoreId,
            'score_val' => $totalScore,
            'grade' => $grade
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => 'Gagal menyimpan penilaian: ' . $e->getMessage()], 500);
    }
}

jsonResponse(['error' => 'Action tidak ditemukan.'], 404);
