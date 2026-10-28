<?php
/**
 * Seeder Data Unit & Peserta JUMBARA PMR 2026
 * Mengisi data Kontingen Unit (Mula, Madya, Wira) dan Peserta lengkap per unit
 */
require_once __DIR__ . '/../config/database.php';

$pdo = getPDOConnection();

echo "=== MEMULAI SEEDING DATA UNIT & PESERTA JUMBARA ===\n";

// 1. Data Unit Sekolah & Kontingen
$unitsData = [
    // WIRA (SMA / SMK / MA)
    [
        'code' => 'UNT-WIR-01',
        'name' => 'SMAN 1 Pemalang',
        'level_category' => 'Wira (SMA)',
        'pembina_name' => 'Dr. Bambang Sutrisno, M.Pd',
        'phone' => '081234567001',
        'address' => 'Jl. Gatot Subroto No. 12, Bojongbata, Kec. Pemalang',
        'username' => 'unit_sman1pml'
    ],
    [
        'code' => 'UNT-WIR-02',
        'name' => 'SMAN 2 Pemalang',
        'level_category' => 'Wira (SMA)',
        'pembina_name' => 'Dra. Siti Nurjanah, M.Pd',
        'phone' => '081234567002',
        'address' => 'Jl. Jenderal Sudirman No. 45, Wanarejan, Kec. Pemalang',
        'username' => 'unit_sman2pml'
    ],
    [
        'code' => 'UNT-WIR-03',
        'name' => 'SMAN 1 Bantarbolang',
        'level_category' => 'Wira (SMA)',
        'pembina_name' => 'Slamet Raharjo, S.Pd',
        'phone' => '081234567003',
        'address' => 'Jl. Raya Bantarbolang - Randudongkal Km 2, Bantarbolang',
        'username' => 'unit_sman1bantar'
    ],
    [
        'code' => 'UNT-WIR-04',
        'name' => 'SMKN 1 Pemalang',
        'level_category' => 'Wira (SMA)',
        'pembina_name' => 'Ir. Hendro Wibowo, S.T',
        'phone' => '081234567004',
        'address' => 'Jl. Jenderal Ahmad Yani No. 8, Mulyoharjo, Pemalang',
        'username' => 'unit_smkn1pml'
    ],
    [
        'code' => 'UNT-WIR-05',
        'name' => 'SMKN 1 Ampelgading',
        'level_category' => 'Wira (SMA)',
        'pembina_name' => 'Rina Kusuma Astuti, S.Pd',
        'phone' => '081234567005',
        'address' => 'Jl. Raya Ampelgading No. 15, Kec. Ampelgading',
        'username' => 'unit_smkn1ampel'
    ],
    [
        'code' => 'UNT-WIR-06',
        'name' => 'MAN 1 Pemalang',
        'level_category' => 'Wira (SMA)',
        'pembina_name' => 'Drs. H. Solihin, M.Ag',
        'phone' => '081234567006',
        'address' => 'Jl. Pemuda No. 34, Mulyoharjo, Kec. Pemalang',
        'username' => 'unit_man1pml'
    ],
    [
        'code' => 'UNT-WIR-07',
        'name' => 'SMA Muhammadiyah 1 Pemalang',
        'level_category' => 'Wira (SMA)',
        'pembina_name' => 'Arif Firmansyah, S.Pd',
        'phone' => '081234567007',
        'address' => 'Jl. Merbabu No. 19, Kebondalem, Kec. Pemalang',
        'username' => 'unit_smamuhipml'
    ],

    // MADYA (SMP / MTs)
    [
        'code' => 'UNT-MAD-01',
        'name' => 'SMPN 1 Pemalang',
        'level_category' => 'Madya (SMP)',
        'pembina_name' => 'Drs. Eko Prasetyo, M.Pd',
        'phone' => '081234567011',
        'address' => 'Jl. Kyai Makmur No. 2, Kebondalem, Pemalang',
        'username' => 'unit_smpn1pml'
    ],
    [
        'code' => 'UNT-MAD-02',
        'name' => 'SMPN 2 Pemalang',
        'level_category' => 'Madya (SMP)',
        'pembina_name' => 'Dra. Endang Purwanti',
        'phone' => '081234567012',
        'address' => 'Jl. Pemuda No. 10, Bojongbata, Pemalang',
        'username' => 'unit_smpn2pml'
    ],
    [
        'code' => 'UNT-MAD-03',
        'name' => 'SMPN 3 Taman Pemalang',
        'level_category' => 'Madya (SMP)',
        'pembina_name' => 'Agus Hendrawan, S.Pd',
        'phone' => '081234567013',
        'address' => 'Jl. Dr. Wahidin Sudirohusodo No. 22, Kaligelang, Taman',
        'username' => 'unit_smpn3taman'
    ],
    [
        'code' => 'UNT-MAD-04',
        'name' => 'SMPN 1 Comal Pemalang',
        'level_category' => 'Madya (SMP)',
        'pembina_name' => 'Retno Wulandari, S.Pd',
        'phone' => '081234567014',
        'address' => 'Jl. Ahmad Yani No. 50, Purwosari, Comal',
        'username' => 'unit_smpn1comal'
    ],
    [
        'code' => 'UNT-MAD-05',
        'name' => 'MTsN 1 Pemalang',
        'level_category' => 'Madya (SMP)',
        'pembina_name' => 'M. Taufik Hidayat, M.Pd',
        'phone' => '081234567015',
        'address' => 'Jl. DI Panjaitan No. 18, Bojongbata, Pemalang',
        'username' => 'unit_mtsn1pml'
    ],
    [
        'code' => 'UNT-MAD-06',
        'name' => 'SMPN 1 Bantarbolang',
        'level_category' => 'Madya (SMP)',
        'pembina_name' => 'Nurul Hidayati, S.Pd',
        'phone' => '081234567016',
        'address' => 'Jl. Raya Bantarbolang No. 3, Bantarbolang, Pemalang',
        'username' => 'unit_smpn1bantar'
    ],

    // MULA (SD / MI)
    [
        'code' => 'UNT-MUL-01',
        'name' => 'SDN 01 Mulyoharjo Pemalang',
        'level_category' => 'Mula (SD)',
        'pembina_name' => 'Siti Aminah, S.Pd.SD',
        'phone' => '081234567021',
        'address' => 'Jl. Melati No. 5, Mulyoharjo, Kec. Pemalang',
        'username' => 'unit_sdn1mulyo'
    ],
    [
        'code' => 'UNT-MUL-02',
        'name' => 'SDN 02 Bojongbata Pemalang',
        'level_category' => 'Mula (SD)',
        'pembina_name' => 'Sugeng Riyadi, S.Pd.SD',
        'phone' => '081234567022',
        'address' => 'Jl. Nusa Indah No. 14, Bojongbata, Pemalang',
        'username' => 'unit_sdn2bojong'
    ],
    [
        'code' => 'UNT-MUL-03',
        'name' => 'MI Negeri 1 Pemalang',
        'level_category' => 'Mula (SD)',
        'pembina_name' => 'H. Ahmad Fauzi, S.Ag',
        'phone' => '081234567023',
        'address' => 'Jl. Kenanga No. 8, Kebondalem, Pemalang',
        'username' => 'unit_min1pml'
    ],
    [
        'code' => 'UNT-MUL-04',
        'name' => 'SDN 04 Kebondalem Pemalang',
        'level_category' => 'Mula (SD)',
        'pembina_name' => 'Sri Wahyuni, S.Pd.SD',
        'phone' => '081234567024',
        'address' => 'Jl. Dahlia No. 11, Kebondalem, Pemalang',
        'username' => 'unit_sdn4kebon'
    ],
    [
        'code' => 'UNT-MUL-05',
        'name' => 'SDN 01 Comal Pemalang',
        'level_category' => 'Mula (SD)',
        'pembina_name' => 'Bambang Irawan, S.Pd.SD',
        'phone' => '081234567025',
        'address' => 'Jl. Raya Comal No. 27, Comal, Pemalang',
        'username' => 'unit_sdn1comal'
    ]
];

$unitIdMap = [];
$defaultPasswordHash = password_hash('password123', PASSWORD_BCRYPT);

foreach ($unitsData as $ud) {
    // Cek apakah unit sudah ada berdasarkan code
    $stmtCheck = $pdo->prepare("SELECT id FROM units WHERE code = ?");
    $stmtCheck->execute([$ud['code']]);
    $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $unitId = (int)$existing['id'];
        $stmtUpd = $pdo->prepare("UPDATE units SET name = ?, level_category = ?, pembina_name = ?, phone = ?, address = ? WHERE id = ?");
        $stmtUpd->execute([$ud['name'], $ud['level_category'], $ud['pembina_name'], $ud['phone'], $ud['address'], $unitId]);
    } else {
        $stmtIns = $pdo->prepare("INSERT INTO units (code, name, level_category, pembina_name, phone, address, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmtIns->execute([$ud['code'], $ud['name'], $ud['level_category'], $ud['pembina_name'], $ud['phone'], $ud['address']]);
        $unitId = (int)$pdo->lastInsertId();
    }
    $unitIdMap[$ud['code']] = [
        'id' => $unitId,
        'name' => $ud['name'],
        'level_category' => $ud['level_category'],
        'pembina_name' => $ud['pembina_name'],
        'phone' => $ud['phone'],
        'address' => $ud['address'],
        'username' => $ud['username']
    ];

    // Buat akun admin unit jika belum ada
    $stmtUser = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmtUser->execute([$ud['username']]);
    $uExist = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if (!$uExist) {
        $stmtInsU = $pdo->prepare("INSERT INTO users (username, password, email, role, unit_id, full_name, phone, created_at) VALUES (?, ?, ?, 'unit', ?, ?, ?, NOW())");
        $stmtInsU->execute([
            $ud['username'],
            $defaultPasswordHash,
            $ud['username'] . '@jumbara.id',
            $unitId,
            'Admin ' . $ud['name'],
            $ud['phone']
        ]);
    } else {
        $stmtUpdU = $pdo->prepare("UPDATE users SET unit_id = ?, full_name = ? WHERE id = ?");
        $stmtUpdU->execute([$unitId, 'Admin ' . $ud['name'], $uExist['id']]);
    }
}

echo "Berhasil memproses " . count($unitIdMap) . " unit sekolah & akun admin unit.\n";

// Pool Nama Indonesia
$firstNamesM = ['Bima', 'Rizky', 'Muhammad', 'Farhan', 'Dimas', 'Bayu', 'Fajar', 'Aditya', 'Rian', 'Danang', 'Galih', 'Satria', 'Bagus', 'Wahyu', 'Gilang', 'Arif', 'Hendra', 'Yoga', 'Ilham', 'Reza'];
$firstNamesF = ['Siti', 'Dewi', 'Anisa', 'Putri', 'Nabila', 'Rina', 'Tri', 'Ayu', 'Intan', 'Dina', 'Lestari', 'Fitri', 'Nur', 'Zahra', 'Maya', 'Indah', 'Widya', 'Tiara', 'Citra', 'Salma'];
$lastNames = ['Pratama', 'Saputra', 'Ramadhan', 'Kurniawan', 'Setiawan', 'Hidayat', 'Wibowo', 'Nugroho', 'Santoso', 'Utomo', 'Wijaya', 'Kusuma', 'Maulana', 'Firmansyah', 'Purnama', 'Rahmawati', 'Anggraini', 'Lestari', 'Wulandari', 'Maharani'];

$birthPlaces = ['Pemalang', 'Pekalongan', 'Tegal', 'Batang', 'Semarang', 'Banyumas', 'Brebes', 'Kendal'];
$bloodTypes = ['A', 'B', 'AB', 'O'];
$religions = ['Islam', 'Islam', 'Islam', 'Islam', 'Kristen', 'Katolik'];

$subCategoriesPool = [
    ['Pertolongan Pertama', 'Tandu Darurat'],
    ['Perawatan Keluarga', 'Remaja Sehat Peduli Sesama (RSPS)'],
    ['Ayo Siaga Bencana (ASB)', 'DPRS (Dapur Umum)'],
    ['Kepemimpinan & Tri Bakti', 'Gerakan Kepalangmerahan'],
    ['Donor Darah Siswa (DORAS)', 'Kesehatan Remaja'],
    ['Desain Poster Jumbara', 'Karya Tulis Ilmiah PMR'],
    ['Paduan Suara Mars PMI', 'Pentas Seni Budaya'],
    ['Pertolongan Pertama', 'Ayo Siaga Bencana (ASB)'],
    ['Perawatan Keluarga', 'Tandu Darurat'],
    ['Kepemimpinan & Tri Bakti', 'Donor Darah Siswa (DORAS)']
];

// Profile photo avatars
$malePhotos = [
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200'
];
$femalePhotos = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200'
];

$participantCounter = 1;
$totalInserted = 0;

$stmtInsertPart = $pdo->prepare("
    INSERT INTO participants (
        code, user_id, unit_id, school_address, school_phone, full_name, nisn, level,
        class_name, last_education, organizations, birth_place, birth_date, gender, blood_type,
        phone, emergency_contact, parent_name, parent_address, parent_phone, parent_job,
        photo_url, sub_categories, status, created_at, religion, is_disabled, disability_type,
        address, assignment_letter_url, registration_type, email
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, NOW(), ?, 'Tidak', 'Tidak Ada',
        ?, '', ?, ?
    )
");

foreach ($unitIdMap as $unitCode => $u) {
    $unitId = $u['id'];
    $isWira = strpos($u['level_category'], 'Wira') !== false;
    $isMadya = strpos($u['level_category'], 'Madya') !== false;
    $isMula = strpos($u['level_category'], 'Mula') !== false;

    $levelName = $isWira ? 'Wira' : ($isMadya ? 'Madya' : 'Mula');
    $levelCodePrefix = $isWira ? 'WIR' : ($isMadya ? 'MAD' : 'MUL');

    // Cek berapa peserta yang sudah ada di unit ini
    $stmtC = $pdo->prepare("SELECT COUNT(*) FROM participants WHERE unit_id = ?");
    $stmtC->execute([$unitId]);
    $currentCount = (int)$stmtC->fetchColumn();

    // Target 10 peserta per unit (9 peserta + 1 pembina pendamping)
    $needed = max(0, 10 - $currentCount);
    if ($needed <= 0) {
        echo "Unit {$u['name']} sudah memiliki {$currentCount} peserta. Dilewati.\n";
        continue;
    }

    echo "Menambahkan {$needed} peserta untuk unit {$u['name']} (Jenjang {$levelName})...\n";

    for ($i = 0; $i < $needed; $i++) {
        $isPendamping = ($i === $needed - 1 && $currentCount === 0); // 1 pembina per unit jika baru
        $gender = ($i % 2 === 0) ? 'L' : 'P';

        if ($isPendamping) {
            $fullName = $u['pembina_name'] . ' (Pendamping)';
            $regType = 'Pendamping';
            $className = null;
            $lastEdu = 'S1 Pendidikan';
            $status = 'verified_kabupaten';
            $birthYear = rand(1975, 1988);
            $subCats = json_encode(['Pembina Pendamping Unit Kontingen']);
        } else {
            $fName = ($gender === 'L') ? $firstNamesM[array_rand($firstNamesM)] : $firstNamesF[array_rand($firstNamesF)];
            $lName = $lastNames[array_rand($lastNames)];
            $fullName = $fName . ' ' . $lName;
            $regType = 'Peserta';
            $lastEdu = null;

            if ($isWira) {
                $classNum = rand(10, 12);
                $className = (string)$classNum;
                $birthYear = 2026 - rand(16, 18);
            } elseif ($isMadya) {
                $classNum = rand(7, 9);
                $className = (string)$classNum;
                $birthYear = 2026 - rand(13, 15);
            } else {
                $classNum = rand(4, 6);
                $className = (string)$classNum;
                $birthYear = 2026 - rand(10, 12);
            }

            // Status: 75% verified kabupaten, 20% verified unit, 5% pending
            $randStatus = rand(1, 100);
            if ($randStatus <= 75) {
                $status = 'verified_kabupaten';
            } elseif ($randStatus <= 95) {
                $status = 'verified_unit';
            } else {
                $status = 'pending_unit';
            }

            $subCats = json_encode($subCategoriesPool[array_rand($subCategoriesPool)]);
        }

        $birthMonth = str_pad(rand(1, 12), 2, '0', STR_PAD_LEFT);
        $birthDay = str_pad(rand(1, 28), 2, '0', STR_PAD_LEFT);
        $birthDate = "{$birthYear}-{$birthMonth}-{$birthDay}";
        $birthPlace = $birthPlaces[array_rand($birthPlaces)];
        $blood = $bloodTypes[array_rand($bloodTypes)];
        $religion = $religions[array_rand($religions)];

        $codeNumStr = str_pad($unitId, 2, '0', STR_PAD_LEFT) . str_pad($i + 1, 2, '0', STR_PAD_LEFT);
        $code = ($regType === 'Pendamping') 
            ? "PDP-{$levelCodePrefix}-{$codeNumStr}" 
            : "JMB-{$levelCodePrefix}-{$codeNumStr}";

        $nisn = '00' . rand(10000000, 99999999);
        $phone = '08' . rand(1111111111, 9999999999);
        $emgPhone = '08' . rand(1111111111, 9999999999);
        $parentName = 'Bpk. ' . $lastNames[array_rand($lastNames)];
        $parentJob = ['PNS', 'Wiraswasta', 'Karyawan Swasta', 'Guru', 'Pedagang', 'TNI / POLRI', 'Petani'][array_rand(['PNS', 'Wiraswasta', 'Karyawan Swasta', 'Guru', 'Pedagang', 'TNI / POLRI', 'Petani'])];
        $parentPhone = '08' . rand(1111111111, 9999999999);
        $address = 'Jl. ' . ['Mawar', 'Melati', 'Kenanga', 'Anggrek', 'Flamboyan', 'Gatot Subroto', 'Pemuda', 'Jenderal Sudirman'][array_rand(['Mawar', 'Melati', 'Kenanga', 'Anggrek', 'Flamboyan', 'Gatot Subroto', 'Pemuda', 'Jenderal Sudirman'])] . ' No. ' . rand(1, 99) . ', Pemalang';
        $email = strtolower(preg_replace('/[^a-z0-9]/', '', $fullName)) . rand(100, 999) . '@gmail.com';
        $photoUrl = ($gender === 'L') ? $malePhotos[array_rand($malePhotos)] : $femalePhotos[array_rand($femalePhotos)];

        // Akun User Peserta Unik
        $usernamePeserta = 'peserta_' . strtolower($levelCodePrefix) . '_' . $unitId . '_' . ($i + 1);
        
        // Hapus user jika sudah ada sebelumnya agar bersih
        $pdo->prepare("DELETE FROM users WHERE username = ?")->execute([$usernamePeserta]);
        $pdo->prepare("DELETE FROM participants WHERE code = ?")->execute([$code]);

        $stmtInsUser = $pdo->prepare("INSERT INTO users (username, password, email, role, unit_id, full_name, phone, created_at) VALUES (?, ?, ?, 'peserta', ?, ?, ?, NOW())");
        $stmtInsUser->execute([
            $usernamePeserta,
            $defaultPasswordHash,
            $email,
            $unitId,
            $fullName,
            $phone
        ]);
        $userId = (int)$pdo->lastInsertId();

        // Insert Peserta
        $stmtInsertPart->execute([
            $code,
            $userId,
            $unitId,
            $u['address'],
            $u['phone'],
            $fullName,
            $nisn,
            $levelName,
            $className,
            $lastEdu,
            'PMR PMI ' . $u['name'],
            $birthPlace,
            $birthDate,
            $gender,
            $blood,
            $phone,
            $emgPhone,
            $parentName,
            $address,
            $parentPhone,
            $parentJob,
            $photoUrl,
            $subCats,
            $status,
            $religion,
            $address,
            $regType,
            $email
        ]);

        $totalInserted++;
    }
}

echo "\n=== SEEDING SELESAI ===\n";
echo "Total Peserta Baru Berhasil Ditambahkan: {$totalInserted}\n";

// Cek rekap final
$stmtSummary = $pdo->query("
    SELECT un.name AS unit_name, un.level_category, COUNT(p.id) AS total_peserta
    FROM units un
    LEFT JOIN participants p ON un.id = p.unit_id
    GROUP BY un.id, un.name, un.level_category
    ORDER BY un.level_category DESC, un.name ASC
");
$recap = $stmtSummary->fetchAll(PDO::FETCH_ASSOC);

echo "\n--- REKAP PESERTA PER UNIT SETELAH SEEDING ---\n";
printf("%-35s | %-15s | %-10s\n", "Nama Unit Sekolah", "Jenjang", "Peserta");
echo str_repeat("-", 65) . "\n";
foreach ($recap as $r) {
    printf("%-35s | %-15s | %-10d\n", substr($r['unit_name'], 0, 35), $r['level_category'], $r['total_peserta']);
}
