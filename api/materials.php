<?php
// ==========================================================================
// API MATERIALS / PUSAT MATERI & DOKUMEN JUMBARA
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$pdo = getPDOConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = (int)($_GET['id'] ?? 0);

// Auto-migration: Ensure table materials exists
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS materials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL DEFAULT 'Buku Panduan',
            description TEXT,
            file_url VARCHAR(255) NOT NULL,
            file_name VARCHAR(255) DEFAULT NULL,
            file_size VARCHAR(50) DEFAULT '1.5 MB',
            file_type VARCHAR(50) DEFAULT 'pdf',
            download_count INT NOT NULL DEFAULT 0,
            uploaded_by VARCHAR(100) DEFAULT 'Panitia Jumbara PMI',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            KEY idx_mat_cat (category),
            KEY idx_mat_created (created_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    ");

    // Auto-seed initial materials if table is empty
    $count = (int)$pdo->query("SELECT COUNT(*) FROM materials")->fetchColumn();
    if ($count === 0) {
        $stmtSeed = $pdo->prepare("
            INSERT INTO materials (title, category, description, file_url, file_name, file_size, file_type, download_count, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $initials = [
            [
                'Juklak & Juknis Jumbara XII PMR Kabupaten 2026',
                'Buku Panduan & Juknis',
                'Buku pedoman resmi petunjuk pelaksanaan dan petunjuk teknis kegiatan Jumbara XII, ketentuan umum, hak & kewajiban kontingen, serta tata tertib perkemahan.',
                'uploads/materi/juklak_jumbara_2026.pdf',
                'juklak_jumbara_2026.pdf',
                '2.4 MB',
                'pdf',
                184,
                'Sekretariat Panitia PMI'
            ],
            [
                'Buku Saku 7 Materi Pokok PMR (Mula, Madya, Wira)',
                'Materi Pokok PMR',
                'Ringkasan kurikulum resmi Palang Merah Remaja: Gerakan Kepalangmerahan, Kepemimpinan, Pertolongan Pertama, Sanitasi & Kesehatan, Remaja Sehat Peduli Sesama, Donor Darah, dan Kesiapsiagaan Bencana.',
                'uploads/materi/buku_saku_7_materi_pmr.pdf',
                'buku_saku_7_materi_pmr.pdf',
                '3.8 MB',
                'pdf',
                245,
                'Bidang Diklat PMI'
            ],
            [
                'Kisi-Kisi Lomba & Rubrik Standar Penilaian Juri',
                'Lomba & Penilaian',
                'Pedoman kriteria, aspek, bobot skor, dan tata cara penilaian dewan juri untuk seluruh cabang lomba wahana prestasi Jumpa, Bakti, dan Gembira.',
                'uploads/materi/kisi_kisi_lomba_jumbara.pdf',
                'kisi_kisi_lomba_jumbara.pdf',
                '1.2 MB',
                'pdf',
                312,
                'Koordinator Juri Jumbara'
            ],
            [
                'Denah Buperta, Kavling Tenda & Jalur Evakuasi',
                'Buku Panduan & Juknis',
                'Peta denah pembagian kavling tenda unit sekolah, lokasi panggung utama, posko kesehatan, dapur umum, sanitasi, dan titik kumpul darurat.',
                'uploads/materi/denah_buperta_dan_tenda.pdf',
                'denah_buperta_dan_tenda.pdf',
                '1.9 MB',
                'pdf',
                156,
                'Sie Sarpras & Akomodasi'
            ],
            [
                'Blangko Format Surat Tugas & Surat Izin Orang Tua',
                'Formulir & Administrasi',
                'Format resmi surat tugas dari Kepala Sekolah / Pembina Unit PMR serta surat pernyataan persetujuan orang tua/wali bagi seluruh peserta kontingen.',
                'uploads/materi/format_surat_tugas_unit.pdf',
                'format_surat_tugas_unit.pdf',
                '450 KB',
                'pdf',
                298,
                'Sie Administrasi Kontingen'
            ],
            [
                'Modul Praktik Pertolongan Pertama (PP) Standar PMI',
                'Materi Pokok PMR',
                'Panduan praktikum teknik pembidaian patah tulang, pembalutan luka, evakuasi tandu darurat, dan penanganan korban syok / pingsan.',
                'uploads/materi/panduan_pertolongan_pertama.pdf',
                'panduan_pertolongan_pertama.pdf',
                '4.1 MB',
                'pdf',
                203,
                'Sie Pelayanan Medis PMI'
            ]
        ];

        foreach ($initials as $m) {
            $stmtSeed->execute($m);
        }
    }
} catch (Exception $e) {
    error_log('[MATERIALS AUTO-MIGRATE ERROR] ' . $e->getMessage());
}

// --------------------------------------------------------------------------
// 1. GET /api/materials.php (Publik: Unduh Materi & Daftar Materi)
// --------------------------------------------------------------------------
if ($method === 'GET') {
    // Action: Track Download
    if ($action === 'download' && $id > 0) {
        $stmt = $pdo->prepare("SELECT id, title, file_url, download_count FROM materials WHERE id = ?");
        $stmt->execute([$id]);
        $mat = $stmt->fetch();
        if (!$mat) {
            jsonResponse(['error' => 'Berkas materi tidak ditemukan.'], 404);
        }

        $pdo->prepare("UPDATE materials SET download_count = download_count + 1 WHERE id = ?")->execute([$id]);
        $newCount = (int)$mat['download_count'] + 1;

        jsonResponse([
            'success' => true,
            'download_count' => $newCount,
            'file_url' => $mat['file_url'],
            'title' => $mat['title']
        ]);
    }

    $category = trim($_GET['category'] ?? '');
    $search = trim($_GET['search'] ?? '');

    $whereClauses = [];
    $params = [];

    if ($category && $category !== 'all' && $category !== 'Semua') {
        $whereClauses[] = "category = ?";
        $params[] = $category;
    }

    if ($search) {
        $whereClauses[] = "(title LIKE ? OR description LIKE ? OR category LIKE ?)";
        $term = "%{$search}%";
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    $whereSql = !empty($whereClauses) ? ('WHERE ' . implode(' AND ', $whereClauses)) : '';

    $stmt = $pdo->prepare("SELECT * FROM materials $whereSql ORDER BY id ASC");
    $stmt->execute($params);
    $materials = $stmt->fetchAll();

    // Fetch unique categories list for filter tabs
    $categoriesStmt = $pdo->query("SELECT DISTINCT category FROM materials ORDER BY category ASC");
    $categories = $categoriesStmt->fetchAll(PDO::FETCH_COLUMN);

    jsonResponse([
        'data' => $materials,
        'categories' => $categories,
        'total' => count($materials)
    ]);
}

// --------------------------------------------------------------------------
// 2. POST /api/materials.php (Admin Kabupaten: Tambah / Upload Materi)
// --------------------------------------------------------------------------
if ($method === 'POST') {
    $user = requireUser(['kabupaten', 'admin_kabupaten', 'super_admin']);
    $input = getJsonInput();

    $title = trim($input['title'] ?? '');
    $category = trim($input['category'] ?? 'Buku Panduan & Juknis');
    $description = trim($input['description'] ?? '');
    $fileUrl = trim($input['file_url'] ?? '');
    $fileSize = trim($input['file_size'] ?? '1.5 MB');
    $fileType = strtolower(trim($input['file_type'] ?? 'pdf'));

    if (!$title) {
        jsonResponse(['error' => 'Judul dokumen/materi wajib diisi.'], 400);
    }

    // Support base64 file upload if provided
    if (!empty($input['file_data']) && strpos($input['file_data'], 'data:') === 0) {
        $uploadedPath = saveBase64File($input['file_data'], 'materi');
        if ($uploadedPath) {
            $fileUrl = $uploadedPath;
            $ext = pathinfo($uploadedPath, PATHINFO_EXTENSION);
            if ($ext) $fileType = strtolower($ext);
        }
    }

    if (!$fileUrl) {
        jsonResponse(['error' => 'URL berkas materi atau unggahan file dokumen wajib diisi.'], 400);
    }

    $fileName = basename($fileUrl);

    $stmt = $pdo->prepare("
        INSERT INTO materials (title, category, description, file_url, file_name, file_size, file_type, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $title,
        $category,
        $description,
        $fileUrl,
        $fileName,
        $fileSize,
        $fileType,
        $user['full_name'] ?? 'Panitia Kabupaten PMI'
    ]);

    jsonResponse([
        'message' => 'Materi berhasil ditambahkan ke portal!',
        'id' => $pdo->lastInsertId()
    ]);
}

// --------------------------------------------------------------------------
// 3. DELETE /api/materials.php?id=X (Admin Kabupaten: Hapus Materi)
// --------------------------------------------------------------------------
if ($method === 'DELETE') {
    requireUser(['kabupaten', 'admin_kabupaten', 'super_admin']);
    if ($id <= 0) {
        jsonResponse(['error' => 'ID materi tidak valid.'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM materials WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(['message' => 'Materi berhasil dihapus dari portal.']);
}
