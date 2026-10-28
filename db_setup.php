<?php
// ==========================================================================
// AUTOMATIC DATABASE INSTALLER & SEEDER FOR STRUCTURED NATIVE PHP
// ==========================================================================

require_once __DIR__ . '/config/database.php';

try {
    $pdo = getPDOConnection();

    // Create Tables
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS units (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(30) NOT NULL UNIQUE,
            name VARCHAR(150) NOT NULL,
            level_category VARCHAR(100) NOT NULL DEFAULT 'Wira (SMA)',
            pembina_name VARCHAR(100) NOT NULL,
            phone VARCHAR(30),
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(100),
            role VARCHAR(50) NOT NULL DEFAULT 'peserta',
            unit_id INT NULL,
            full_name VARCHAR(150) NULL,
            phone VARCHAR(30) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS participants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(40) NOT NULL UNIQUE,
            user_id INT NOT NULL,
            unit_id INT NOT NULL,
            full_name VARCHAR(150) NOT NULL,
            nisn VARCHAR(30),
            level ENUM('Mula', 'Madya', 'Wira') NOT NULL,
            religion VARCHAR(50) DEFAULT 'Islam',
            birth_place VARCHAR(100),
            birth_date DATE,
            gender ENUM('L', 'P') NOT NULL,
            blood_type VARCHAR(10),
            phone VARCHAR(30),
            emergency_contact VARCHAR(100),
            photo_url VARCHAR(255),
            sub_categories JSON,
            status ENUM('pending_unit', 'verified_unit', 'verified_kabupaten', 'rejected') NOT NULL DEFAULT 'pending_unit',
            reject_reason TEXT,
            email VARCHAR(100) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            category ENUM('Jumpa', 'Bakti', 'Gembira', 'Umum') NOT NULL DEFAULT 'Umum',
            pmr_level ENUM('Mula', 'Madya', 'Wira', 'Semua') NOT NULL DEFAULT 'Semua',
            location VARCHAR(150),
            event_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            description TEXT,
            pic_name VARCHAR(100),
            max_participants_per_unit INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS event_registrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            participant_id INT NOT NULL,
            registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY event_part_unique (event_id, participant_id),
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            participant_id INT NOT NULL,
            scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            scanned_by VARCHAR(100),
            status ENUM('masuk', 'keluar', 'hadir', 'izin', 'sakit') DEFAULT 'masuk',
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS scores (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NULL,
            unit_id INT NOT NULL,
            participant_id INT NULL,
            target_type ENUM('peserta', 'kontingen') DEFAULT 'peserta',
            category_type ENUM('Jumpa', 'Bakti', 'Gembira') NOT NULL,
            branch_name VARCHAR(100) NOT NULL,
            pmr_level ENUM('Mula', 'Madya', 'Wira') NOT NULL,
            score_val DECIMAL(5,2) NOT NULL,
            grade ENUM('Emas', 'Perak', 'Perunggu', 'Peserta') NOT NULL,
            judge_name VARCHAR(100),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
            FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS event_aspects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            aspect_name VARCHAR(150) NOT NULL,
            max_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
            weight DECIMAL(5,2) NOT NULL DEFAULT 1.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS score_aspect_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            score_id INT NOT NULL,
            aspect_id INT NOT NULL,
            score_val DECIMAL(5,2) NOT NULL DEFAULT 0.00,
            FOREIGN KEY (score_id) REFERENCES scores(id) ON DELETE CASCADE,
            FOREIGN KEY (aspect_id) REFERENCES event_aspects(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            content TEXT NOT NULL,
            target_role ENUM('all', 'unit', 'peserta') DEFAULT 'all',
            priority ENUM('normal', 'important', 'urgent') DEFAULT 'normal',
            author_name VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS settings (
            `key` VARCHAR(50) PRIMARY KEY,
            `value` TEXT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS unsur_categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            quota INT NOT NULL DEFAULT 1,
            description VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // Safe column migrations for existing databases
    try { $pdo->exec("ALTER TABLE scores ADD COLUMN event_id INT NULL AFTER id"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE scores ADD COLUMN target_type VARCHAR(20) DEFAULT 'peserta' AFTER participant_id"); } catch (Exception $e) {}

    // Seed Unsur Categories if empty
    $checkUnsur = $pdo->query("SELECT COUNT(*) FROM unsur_categories")->fetchColumn();
    if ($checkUnsur == 0) {
        $pdo->exec("
            INSERT INTO unsur_categories (id, name, quota, description) VALUES
            (1, 'Kepala Markas', 1, 'Unsur Kepala Markas PMI (Maksimal 1 orang per kontingen)'),
            (2, 'Ketua Bidang PMR', 1, 'Unsur Ketua Bidang PMR PMI (Maksimal 1 orang per kontingen)'),
            (3, 'Koordinator Forpis', 2, 'Unsur Koordinator FORPIS (Maksimal 2 orang per kontingen)'),
            (4, 'Koordinator Forel', 2, 'Unsur Koordinator FOREL (Maksimal 2 orang per kontingen)'),
            (5, 'Pegawai', 5, 'Unsur Pegawai / Staf PMI (Maksimal 5 orang per kontingen)'),
            (6, 'PMR Mula', 25, 'Unsur Peserta PMR Mula SD/MI (Maksimal 25 orang per kontingen)'),
            (7, 'PMR Madya', 25, 'Unsur Peserta PMR Madya SMP/MTs (Maksimal 25 orang per kontingen)'),
            (8, 'PMR Wira', 25, 'Unsur Peserta PMR Wira SMA/SMK/MA (Maksimal 25 orang per kontingen)'),
            (9, 'TSR', 10, 'Unsur Tenaga Sukarela (TSR) PMI (Maksimal 10 orang per kontingen)');
        ");
    }

    // Check if initial users exist
    $checkUser = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    if ($checkUser == 0) {
        $hashAdmin = password_hash('admin123', PASSWORD_BCRYPT);
        $hashUnit = password_hash('unit123', PASSWORD_BCRYPT);
        $hashPeserta = password_hash('peserta123', PASSWORD_BCRYPT);

        // Seed Units
        $pdo->exec("
            INSERT INTO units (id, code, name, level_category, pembina_name, phone, address) VALUES
            (1, 'UNT-001', 'SMAN 1 Kabupaten PMI', 'Wira (SMA)', 'Drs. Ahmad Hidayat, M.Pd', '081234567890', 'Jl. Merdeka No. 45'),
            (2, 'UNT-002', 'SMPN 2 Kota Bakti', 'Madya (SMP)', 'Dewi Lestari, S.Pd', '082198765432', 'Jl. Pemuda No. 12'),
            (3, 'UNT-003', 'SDN 01 Utama Ceria', 'Mula (SD)', 'Bambang Gunawan, S.Pd', '085711223344', 'Jl. Pendidikan No. 8');
        ");

        // Seed Users
        $stmtUser = $pdo->prepare("INSERT INTO users (id, username, password, email, role, unit_id) VALUES (?, ?, ?, ?, ?, ?)");
        $stmtUser->execute([1, 'admin_kab', $hashAdmin, 'admin@pmikab.or.id', 'kabupaten', NULL]);
        $stmtUser->execute([2, 'admin_sman1', $hashUnit, 'unit.sman1@jumbara.id', 'unit', 1]);
        $stmtUser->execute([3, 'admin_smpn2', $hashUnit, 'unit.smpn2@jumbara.id', 'unit', 2]);
        $stmtUser->execute([4, 'peserta_wira', $hashPeserta, 'rizky.wira@jumbara.id', 'peserta', 1]);

        // Seed Participants
        $stmtPart = $pdo->prepare("
            INSERT INTO participants (id, code, user_id, unit_id, full_name, nisn, level, birth_place, birth_date, gender, blood_type, phone, emergency_contact, photo_url, sub_categories, status)
            VALUES (1, 'JMB-2026-0001', 4, 1, 'Rizky Pratama', '0054321098', 'Wira', 'Kabupaten', '2008-05-14', 'L', 'O', '081299990001', '081299990000 (Ayah)', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', ?, 'verified_kabupaten')
        ");
        $stmtPart->execute([json_encode(['Pertolongan Pertama', 'Kepemimpinan', 'Donor Darah'])]);

        // Seed Events
        $pdo->exec("
            INSERT INTO events (id, title, category, pmr_level, location, event_date, start_time, end_time, description, pic_name) VALUES
            (1, 'Upacara Pembukaan Jumbara PMR 2026', 'Umum', 'Semua', 'Lapangan Utama Buperta PMI', '2026-10-15', '08:00', '10:00', 'Pembukaan resmi oleh Ketua PMI Kabupaten.', 'Subhan, S.Sos'),
            (2, 'Lomba Pertolongan Pertama (PP)', 'Jumpa', 'Wira', 'Hall A Gedung Serbaguna', '2026-10-15', '10:30', '15:00', 'Evaluasi penanganan cedera dan patah tulang.', 'Dr. Hendra (KSR PMI)');
        ");

        // Seed Announcements
        $pdo->exec("
            INSERT INTO announcements (id, title, content, target_role, priority, author_name) VALUES
            (1, 'Selamat Datang di Portal Resmi JUMBARA PMR 2026', 'Pendaftaran mandiri peserta telah dibuka. Harap seluruh calon peserta mengisi data dengan valid.', 'all', 'important', 'Panitia PMI Kabupaten');
        ");
    }

    // Always run schema migrations
    try {
        $pdo->exec("ALTER TABLE participants ADD COLUMN religion VARCHAR(50) DEFAULT 'Islam'");
    } catch (Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE participants ADD COLUMN is_disabled ENUM('Tidak', 'Ya') DEFAULT 'Tidak'");
    } catch (Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE participants ADD COLUMN disability_type VARCHAR(150) DEFAULT 'Tidak Ada'");
    } catch (Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE participants ADD COLUMN address TEXT DEFAULT NULL");
    } catch (Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE participants ADD COLUMN assignment_letter_url VARCHAR(255) DEFAULT NULL");
    } catch (Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE participants MODIFY COLUMN status ENUM('pending_unit', 'revision', 'verified_unit', 'verified_kabupaten', 'rejected') NOT NULL DEFAULT 'pending_unit'");
    } catch (Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE participants ADD COLUMN registration_type ENUM('Peserta', 'Panitia', 'Peninjau', 'Tamu Undangan', 'Media') DEFAULT 'Peserta'");
    } catch (Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE participants MODIFY COLUMN level VARCHAR(50) NOT NULL DEFAULT 'Wira'");
    } catch (Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('kabupaten', 'unit', 'peserta', 'panitia', 'peninjau', 'tamu', 'media') NOT NULL DEFAULT 'peserta'");
    } catch (Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE events ADD COLUMN max_participants_per_unit INT NOT NULL DEFAULT 0");
    } catch (Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE participants ADD COLUMN email VARCHAR(100) DEFAULT NULL");
    } catch (Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE participants ADD COLUMN certificate_number VARCHAR(100) DEFAULT NULL");
    } catch (Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN full_name VARCHAR(150) NULL AFTER unit_id");
    } catch (Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL AFTER full_name");
    } catch (Exception $e) {}

    // Indexes for high-performance scaled queries (handling millions of records with sub-millisecond execution)
    try { $pdo->exec("CREATE INDEX idx_unit_id ON participants (unit_id, id DESC)"); } catch (Exception $e) {}
    try { $pdo->exec("CREATE INDEX idx_unit_status_id ON participants (unit_id, status, id DESC)"); } catch (Exception $e) {}
    try { $pdo->exec("CREATE INDEX idx_status_id ON participants (status, id DESC)"); } catch (Exception $e) {}
    try { $pdo->exec("CREATE INDEX idx_reg_id ON participants (registration_type, id DESC)"); } catch (Exception $e) {}
    try { $pdo->exec("CREATE INDEX idx_full_name ON participants (full_name)"); } catch (Exception $e) {}
    try { $pdo->exec("CREATE INDEX idx_nisn ON participants (nisn)"); } catch (Exception $e) {}
    // Materials / Unduh Materi Table
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
                KEY idx_mat_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    } catch (Exception $e) {}

    // Kotak Saran & Aspirasi Table
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_name VARCHAR(150) DEFAULT 'Anonim',
                is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
                unit_name VARCHAR(150) DEFAULT NULL,
                sender_role VARCHAR(100) DEFAULT 'Peserta PMR',
                category VARCHAR(100) NOT NULL DEFAULT 'Saran Umum',
                rating INT NOT NULL DEFAULT 5,
                message TEXT NOT NULL,
                status ENUM('unread', 'read', 'followup') NOT NULL DEFAULT 'unread',
                admin_notes TEXT DEFAULT NULL,
                ip_address VARCHAR(45) DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                KEY idx_fb_status (status),
                KEY idx_fb_created (created_at),
                KEY idx_fb_cat (category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    } catch (Exception $e) {}

    // Always seed initial settings & master options (IGNORE if already exists to preserve custom logos/settings)
    $pdo->exec("
        INSERT IGNORE INTO settings (`key`, `value`) VALUES
        ('app_name', 'JUMBARA PMR TINGKAT KABUPATEN 2026'),
        ('organizer_name', 'Palang Merah Indonesia Kabupaten'),
        ('jumbotron_title', 'Jumpa Bakti Gembira Palang Merah Remaja'),
        ('jumbotron_subtitle', 'Ajang Silaturahmi, Edukasi, Pengabdian, dan Kompetisi Tri Bakti PMR (Mula, Madya, Wira)'),
        ('event_dates', '15 - 17 Oktober 2026'),
        ('app_logo', 'frontend/images/logo-pmi.svg'),
        ('app_favicon', 'frontend/favicon.svg'),
        ('reg_deadline', '2026-10-14T23:59'),
        ('reg_active', '1'),
        ('fonnte_token', ''),
        ('fonnte_enabled', '0'),
        ('smtp_enabled', '0'),
        ('smtp_host', ''),
        ('smtp_port', '587'),
        ('smtp_secure', 'tls'),
        ('smtp_user', ''),
        ('smtp_pass', ''),
        ('smtp_from_email', ''),
        ('smtp_from_name', 'PMI Kabupaten Pemalang'),
        ('jumbotron_images', '[\"frontend/images/hero.jpg\", \"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200\", \"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200\"]'),
        ('option_religions', '[\"Islam\", \"Kristen Protestan\", \"Katolik\", \"Hindu\", \"Buddha\", \"Konghucu\"]'),
        ('option_blood_types', '[\"O\", \"A\", \"B\", \"AB\", \"Belum Tahu\"]'),
        ('option_genders', '[{\"value\": \"L\", \"label\": \"Laki-laki\"}, {\"value\": \"P\", \"label\": \"Perempuan\"}]'),
        ('option_levels', '[{\"value\": \"Wira\", \"label\": \"Wira (SMA / SMK / MA)\"}, {\"value\": \"Madya\", \"label\": \"Madya (SMP / MTs)\"}, {\"value\": \"Mula\", \"label\": \"Mula (SD / MI)\"}]'),
        ('option_disability_statuses', '[{\"value\": \"Tidak\", \"label\": \"Tidak (Non-Disabilitas)\"}, {\"value\": \"Ya\", \"label\": \"Ya (Penyandang Disabilitas)\"}]'),
        ('option_disability_types', '[\"Tidak Ada\", \"Disabilitas Fisik / Daksa\", \"Disabilitas Netra\", \"Disabilitas Rungu / Wicara\", \"Disabilitas Intelektual / Grahita\", \"Disabilitas Mental\", \"Lainnya\"]');
    ");

    if (php_sapi_name() !== 'cli') {
        echo "<div style='font-family: sans-serif; padding: 2rem; background: #e0f2fe; color: #0369a1; border-radius: 8px;'>";
        echo "<h2>✅ Instalasi & Seeding Database MySQL Berhasil!</h2>";
        echo "<p>Database <strong>jumbara_db</strong> telah siap digunakan di MAMP.</p>";
        echo "<p><a href='index.php' style='background: #0284c7; color: white; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none;'>Buka Aplikasi Jumbara</a></p>";
        echo "</div>";
    }
} catch (Exception $e) {
    if (php_sapi_name() !== 'cli') {
        echo "<div style='font-family: sans-serif; padding: 2rem; background: #fee2e2; color: #b91c1c; border-radius: 8px;'>";
        echo "<h2>❌ Error Instalasi Database:</h2>";
        echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
        echo "</div>";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
