<?php
// ==========================================================================
// API AUTHENTICATION (LOGIN, LOGOUT, REGISTER, ME)
// ==========================================================================

require_once __DIR__ . '/../includes/functions.php';

$action = $_GET['action'] ?? '';
$pdo = getPDOConnection();
$input = getJsonInput();

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Brute force protection: 5 failed attempts locks for 5 minutes
    $now = time();
    $lockoutTime = $_SESSION['login_lockout'] ?? 0;
    if ($lockoutTime > $now) {
        $remainingSecs = $lockoutTime - $now;
        $mins = ceil($remainingSecs / 60);
        jsonResponse([
            'error' => "Terlalu banyak percobaan login gagal. Akun sementara dikunci demi keamanan. Silakan coba lagi dalam {$mins} menit."
        ], 429);
    }

    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if (!$username || !$password) {
        jsonResponse(['error' => 'Username dan password wajib diisi.'], 400);
    }

    $stmt = $pdo->prepare("
        SELECT u.*, un.name AS unit_name 
        FROM users u 
        LEFT JOIN units un ON u.unit_id = un.id 
        WHERE u.username = ?
    ");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        $attempts = ($_SESSION['login_failed_attempts'] ?? 0) + 1;
        $_SESSION['login_failed_attempts'] = $attempts;
        if ($attempts >= 5) {
            $_SESSION['login_lockout'] = $now + 300; // 5 minutes lockout
            jsonResponse([
                'error' => 'Percobaan login gagal mencapai batas maksimal (5 kali). Sistem mengunci akses login selama 5 menit.'
            ], 429);
        }
        jsonResponse(['error' => 'Username atau password tidak cocok.'], 401);
    }

    // Login success: Reset failed attempts & regenerate session ID to prevent Session Fixation
    unset($_SESSION['login_failed_attempts'], $_SESSION['login_lockout']);
    session_regenerate_id(true);

    // Set PHP Session
    unset($user['password']);
    $_SESSION['user'] = $user;

    jsonResponse([
        'message' => 'Login berhasil',
        'user' => $user
    ]);
}

if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    jsonResponse(['message' => 'Logout berhasil.']);
}

if ($action === 'me') {
    $user = getCurrentUser();
    if ($user) {
        $stmt = $pdo->prepare("
            SELECT u.*, un.name AS unit_name 
            FROM users u 
            LEFT JOIN units un ON u.unit_id = un.id 
            WHERE u.id = ?
        ");
        $stmt->execute([$user['id']]);
        $fresh = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($fresh) {
            unset($fresh['password']);
            $_SESSION['user'] = $fresh;
            jsonResponse(['user' => $fresh]);
        }
    }
    jsonResponse(['user' => null, 'error' => 'Akses ditolak. Silakan login terlebih dahulu.'], 401);
}

if ($action === 'change-password' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = requireUser();
    $oldPassword = trim($input['old_password'] ?? '');
    $newPassword = trim($input['new_password'] ?? '');
    $confirmPassword = trim($input['confirm_password'] ?? '');

    if (!$oldPassword || !$newPassword) {
        jsonResponse(['error' => 'Password lama dan password baru wajib diisi.'], 400);
    }
    if (strlen($newPassword) < 6) {
        jsonResponse(['error' => 'Password baru minimal harus 6 karakter.'], 400);
    }
    if ($newPassword !== $confirmPassword) {
        jsonResponse(['error' => 'Konfirmasi password baru tidak cocok.'], 400);
    }

    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $currentHash = $stmt->fetchColumn();

    if (!password_verify($oldPassword, $currentHash)) {
        jsonResponse(['error' => 'Password lama Anda tidak cocok.'], 400);
    }

    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $stmtUpd = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmtUpd->execute([$newHash, $user['id']]);

    jsonResponse(['message' => 'Password akun Anda berhasil diperbarui!']);
}



if ($action === 'register-peserta' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Enforce Online Registration Period & Deadline
    $settings = getAppSettings();
    if (isset($settings['reg_active']) && ($settings['reg_active'] === '0' || $settings['reg_active'] === false)) {
        jsonResponse(['error' => 'Pendaftaran online saat ini telah ditutup oleh Panitia.'], 400);
    }
    if (!empty($settings['reg_deadline'])) {
        $deadlineTs = strtotime($settings['reg_deadline']);
        if ($deadlineTs && time() > $deadlineTs) {
            jsonResponse([
                'error' => 'Batas waktu pendaftaran Jumbara PMR telah berakhir pada ' . date('d M Y, H:i', $deadlineTs) . ' WIB.'
            ], 400);
        }
    }

    $fullName = trim($input['full_name'] ?? '');
    $unitId = (int)($input['unit_id'] ?? 0);
    $registrationType = trim($input['registration_type'] ?? 'Peserta');
    $level = trim($input['level'] ?? $input['unsur'] ?? 'PMR Wira');
    $religion = trim($input['religion'] ?? 'Islam');

    if (!$fullName || !$unitId) {
        jsonResponse(['error' => 'Harap lengkapi semua field wajib pendaftaran.'], 400);
    }

    // Role mapping
    $roleMap = [
        'Peserta' => 'peserta',
        'Panitia' => 'panitia',
        'Peninjau' => 'peninjau',
        'Tamu Undangan' => 'tamu',
        'Media' => 'media'
    ];
    $userRole = $roleMap[$registrationType] ?? 'peserta';

    // Auto-generate unique username with collision limiter
    $prefixMap = [
        'Peserta' => 'pmr_',
        'Panitia' => 'pnt_',
        'Peninjau' => 'pnj_',
        'Tamu Undangan' => 'tmu_',
        'Media' => 'mda_'
    ];
    $userPrefix = $prefixMap[$registrationType] ?? 'pmr_';

    $rawName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $fullName));
    if (strlen($rawName) > 10) $rawName = substr($rawName, 0, 10);
    if (!$rawName) $rawName = strtolower($userRole);

    $usernameFound = false;
    for ($attempt = 0; $attempt < 30; $attempt++) {
        $candidate = $userPrefix . $rawName . mt_rand(100, 999);
        $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
        $stmtCheck->execute([$candidate]);
        if ((int)$stmtCheck->fetchColumn() === 0) {
            $username = $candidate;
            $usernameFound = true;
            break;
        }
    }
    if (!$usernameFound) {
        $username = $userPrefix . $rawName . mt_rand(1000, 9999);
    }

    // Auto-generate password from phone or random code
    $rawPhone = trim($input['phone'] ?? '');
    $phoneDigits = preg_replace('/[^0-9]/', '', $rawPhone);
    if (strlen($phoneDigits) >= 6) {
        $password = substr($phoneDigits, -6);
    } else {
        $password = 'pmr' . mt_rand(1000, 9999);
    }

    $isDisabled = $input['is_disabled'] ?? 'Tidak';
    $disabilityType = trim($input['disability_type'] ?? 'Tidak Ada');
    $address = trim($input['address'] ?? '');

    // Process Pas Foto Upload
    $photoUrl = null;
    if (!empty($input['photo_data'])) {
        $photoUrl = saveBase64File($input['photo_data'], 'pasfoto');
    }
    if (!$photoUrl && !empty($input['photo_url'])) {
        $photoUrl = trim($input['photo_url']);
    }
    if (!$photoUrl) {
        $photoUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    }

    // Process Surat Tugas Upload
    $assignmentLetterUrl = null;
    if (!empty($input['assignment_letter_data'])) {
        $assignmentLetterUrl = saveBase64File($input['assignment_letter_data'], 'surattugas');
    }
    if (!$assignmentLetterUrl && !empty($input['assignment_letter_url'])) {
        $assignmentLetterUrl = trim($input['assignment_letter_url']);
    }

    $email = trim($input['email'] ?? '');

    try {
        $pdo->beginTransaction();

        // Dynamic Unsur Quota Check inside transaction to eliminate race conditions
        $stmtUnsur = $pdo->prepare("SELECT name, quota FROM unsur_categories WHERE LOWER(name) = LOWER(?)");
        $stmtUnsur->execute([$level]);
        $unsurData = $stmtUnsur->fetch();

        if ($unsurData && (int)$unsurData['quota'] > 0) {
            $quotaLimit = (int)$unsurData['quota'];
            $stmtCount = $pdo->prepare("
                SELECT COUNT(*) FROM participants 
                WHERE unit_id = ? AND LOWER(level) = LOWER(?) AND status != 'rejected'
            ");
            $stmtCount->execute([$unitId, $level]);
            $currentCount = (int)$stmtCount->fetchColumn();

            if ($currentCount >= $quotaLimit) {
                $pdo->rollBack();
                jsonResponse([
                    'error' => "Gagal Pendaftaran: Kuota untuk Unsur '{$unsurData['name']}' pada kontingen Anda telah penuh (Maksimal {$quotaLimit} orang per kontingen)."
                ], 400);
            }
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $stmtUser = $pdo->prepare("INSERT INTO users (username, password, email, role, unit_id) VALUES (?, ?, ?, ?, ?)");
        $stmtUser->execute([$username, $hashedPassword, $email ?: null, $userRole, $unitId]);
        $userId = $pdo->lastInsertId();

        $codePrefixMap = [
            'Peserta' => 'JMB-2026-',
            'Panitia' => 'PNT-2026-',
            'Peninjau' => 'PNJ-2026-',
            'Tamu Undangan' => 'TMU-2026-',
            'Media' => 'MDA-2026-'
        ];
        $codePrefix = $codePrefixMap[$registrationType] ?? 'JMB-2026-';
        $participantCode = $codePrefix . str_pad($userId, 4, '0', STR_PAD_LEFT);
        $subCategories = json_encode($input['sub_categories'] ?? []);

        $stmtPart = $pdo->prepare("
            INSERT INTO participants 
            (code, user_id, unit_id, full_name, nisn, level, registration_type, religion, is_disabled, disability_type, address, birth_place, birth_date, gender, blood_type, phone, emergency_contact, photo_url, assignment_letter_url, sub_categories, status, email)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_unit', ?)
        ");
        $stmtPart->execute([
            $participantCode, $userId, $unitId, $fullName,
            $input['nisn'] ?? null, $level, $registrationType, $religion, $isDisabled, $disabilityType,
            $address ?: null, $input['birth_place'] ?? null,
            $input['birth_date'] ?? null, $input['gender'] ?? 'L',
            $input['blood_type'] ?? 'O', $input['phone'] ?? null,
            $input['emergency_contact'] ?? null, $photoUrl, $assignmentLetterUrl,
            $subCategories, $email ?: null
        ]);

        $pdo->commit();

        // Fetch unit name for WhatsApp and Email notifications
        $stmtUnit = $pdo->prepare("SELECT name FROM units WHERE id = ?");
        $stmtUnit->execute([$unitId]);
        $unitName = $stmtUnit->fetchColumn() ?: 'Kontingen/Instansi';

        $phone = $phoneDigits;
        if (strpos($phone, '0') === 0) {
            $phone = '62' . substr($phone, 1);
        }

        // 1. Automated System WhatsApp Notification (Fonnte API)
        $waMsg = "Halo *{$fullName}*,\n\nPendaftaran Anda sebagai *{$registrationType}* untuk kegiatan *JUMBARA PMR TINGKAT KABUPATEN 2026* telah *BERHASIL DITERIMA & DIKIRIM!*\n\n📌 Kode Registrasi: *{$participantCode}*\n📋 Kategori/Unsur: *{$level}*\n🏫 Kontingen/Instansi: *{$unitName}*\n\n🔑 *AKUN LOGIN PORTAL RESMI ANDA:*\n• Username: *{$username}*\n• Password: *{$password}*\n\nStatus: *Menunggu Verifikasi Admin/Pembina*. Silakan login portal untuk mengecek status dan mengunduh ID Card QR Code Anda.\n\nSekretariat Panitia Jumbara PMR PMI Kabupaten";
        $fonnteResult = sendFonnteWhatsApp($phone, $waMsg);

        // 2. Automated System Email Notification with Credentials
        $emailSent = false;
        if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $emailSubject = "INFO AKUN & BUKTI PENDAFTARAN JUMBARA PMR 2026 - {$participantCode}";
            $emailBody = "Halo {$fullName},\n\nTerima kasih telah melakukan pendaftaran di JUMBARA PMR TINGKAT KABUPATEN 2026.\n\nBerikut adalah ringkasan data registrasi Anda:\n• Kode Pendaftaran: {$participantCode}\n• Nama Lengkap: {$fullName}\n• Unsur / Tingkat: {$level}\n• Kategori Pendaftaran: {$registrationType}\n• Kontingen Unit: {$unitName}\n\n========================================\nAKUN LOGIN PORTAL RESMI:\nUsername: {$username}\nPassword: {$password}\n========================================\n\nStatus Pendaftaran: Menunggu Verifikasi Pembina Unit & PMI Kabupaten.\nAnda dapat mengunduh formulir registrasi PDF serta mengecek status verifikasi secara berkala dengan login ke portal menggunakan akun di atas.\n\nSalam Kemanusiaan,\nPanitia Pelaksana JUMBARA PMR TINGKAT KABUPATEN 2026\nPalang Merah Indonesia";
            $headers = "From: no-reply@jumbara-pmi.or.id\r\nContent-Type: text/plain; charset=UTF-8\r\nX-Mailer: PHP/" . phpversion();
            @mail($email, $emailSubject, $emailBody, $headers);
            $emailSent = true;
        }

        jsonResponse([
            'message' => 'Pendaftaran berhasil dikirim! Kode pendaftaran Anda: ' . $participantCode . '.',
            'code' => $participantCode,
            'username' => $username,
            'password' => $password,
            'phone' => $phone,
            'email' => $email,
            'email_sent' => $emailSent,
            'fonnte_status' => $fonnteResult,
            'participant_data' => [
                'code' => $participantCode,
                'username' => $username,
                'password' => $password,
                'full_name' => $fullName,
                'nisn' => $input['nisn'] ?? '-',
                'level' => $level,
                'registration_type' => $registrationType,
                'unit_name' => $unitName,
                'religion' => $religion,
                'gender' => $input['gender'] ?? 'L',
                'blood_type' => $input['blood_type'] ?? 'O',
                'phone' => $input['phone'] ?? '-',
                'email' => $email ?: '-',
                'birth_place' => $input['birth_place'] ?? '-',
                'birth_date' => $input['birth_date'] ?? '-',
                'photo_url' => $photoUrl,
                'created_at' => date('d M Y, H:i') . ' WIB'
            ]
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => 'Gagal mendaftar: ' . $e->getMessage()], 500);
    }
}

jsonResponse(['error' => 'Action tidak ditemukan.'], 404);
