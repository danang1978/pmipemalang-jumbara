const { initDatabase, getPool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log("Initializing MySQL database...");
  await initDatabase();
  const pool = getPool();

  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordUnit = await bcrypt.hash('unit123', 10);
  const hashedPasswordPeserta = await bcrypt.hash('peserta123', 10);

  // Disable FK checks temporarily for clean truncation
  await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
  await pool.query('TRUNCATE TABLE attendance;');
  await pool.query('TRUNCATE TABLE scores;');
  await pool.query('TRUNCATE TABLE announcements;');
  await pool.query('TRUNCATE TABLE events;');
  await pool.query('TRUNCATE TABLE participants;');
  await pool.query('TRUNCATE TABLE users;');
  await pool.query('TRUNCATE TABLE units;');
  await pool.query('TRUNCATE TABLE settings;');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1;');

  console.log("Seeding MySQL Units...");
  await pool.query(`
    INSERT INTO units (id, code, name, level_category, pembina_name, phone, address) VALUES
    (1, 'UNT-001', 'SMAN 1 Kabupaten PMI', 'Wira (SMA)', 'Drs. Ahmad Hidayat, M.Pd', '081234567890', 'Jl. Merdeka No. 45, Kabupaten'),
    (2, 'UNT-002', 'SMPN 2 Kota Bakti', 'Madya (SMP)', 'Dewi Lestari, S.Pd', '082198765432', 'Jl. Pemuda No. 12, Kota Bakti'),
    (3, 'UNT-003', 'SDN 01 Utama Ceria', 'Mula (SD)', 'Bambang Gunawan, S.Pd', '085711223344', 'Jl. Pendidikan No. 8, Ceria'),
    (4, 'UNT-004', 'SMKN 2 Teknologi PMR', 'Wira (SMA)', 'Siti Rahmawati, S.T', '081399887766', 'Jl. Industri No. 99, Kabupaten');
  `);

  console.log("Seeding MySQL Users...");
  await pool.query(`
    INSERT INTO users (id, username, password, email, role, unit_id) VALUES
    (1, 'admin_kab', ?, 'admin@pmikab.or.id', 'kabupaten', NULL),
    (2, 'admin_sman1', ?, 'unit.sman1@jumbara.id', 'unit', 1),
    (3, 'admin_smpn2', ?, 'unit.smpn2@jumbara.id', 'unit', 2),
    (4, 'admin_sdn01', ?, 'unit.sdn01@jumbara.id', 'unit', 3),
    (5, 'peserta_wira', ?, 'rizky.wira@jumbara.id', 'peserta', 1),
    (6, 'peserta_madya', ?, 'siti.madya@jumbara.id', 'peserta', 2),
    (7, 'peserta_mula', ?, 'budi.mula@jumbara.id', 'peserta', 3),
    (8, 'peserta_wira2', ?, 'anisa.wira@jumbara.id', 'peserta', 1),
    (9, 'peserta_madya2', ?, 'fajar.madya@jumbara.id', 'peserta', 2);
  `, [
    hashedPasswordAdmin, hashedPasswordUnit, hashedPasswordUnit, hashedPasswordUnit,
    hashedPasswordPeserta, hashedPasswordPeserta, hashedPasswordPeserta, hashedPasswordPeserta, hashedPasswordPeserta
  ]);

  console.log("Seeding MySQL Participants...");
  await pool.query(`
    INSERT INTO participants (id, code, user_id, unit_id, full_name, nisn, level, birth_place, birth_date, gender, blood_type, phone, emergency_contact, photo_url, sub_categories, status, reject_reason) VALUES
    (1, 'JMB-2026-0001', 5, 1, 'Rizky Pratama', '0054321098', 'Wira', 'Kabupaten', '2008-05-14', 'L', 'O', '081299990001', '081299990000 (Ayah)', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', ?, 'verified_kabupaten', NULL),
    (2, 'JMB-2026-0002', 6, 2, 'Siti Nurhaliza', '0087654321', 'Madya', 'Kota Bakti', '2011-09-20', 'P', 'A', '082188880002', '082188880000 (Ibu)', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', ?, 'verified_unit', NULL),
    (3, 'JMB-2026-0003', 7, 3, 'Budi Santoso', '0123456789', 'Mula', 'Ceria', '2014-11-03', 'L', 'B', '085777770003', '085777770000 (Orangtua)', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', ?, 'pending_unit', NULL),
    (4, 'JMB-2026-0004', 8, 1, 'Anisa Rahmawati', '0051122334', 'Wira', 'Kabupaten', '2008-01-25', 'P', 'AB', '081366660004', '081366660000 (Ayah)', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', ?, 'verified_kabupaten', NULL),
    (5, 'JMB-2026-0005', 9, 2, 'Fajar Ramadhan', '0099887766', 'Madya', 'Kota Bakti', '2011-03-12', 'L', 'O', '082255550005', '082255550000 (Ibu)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', ?, 'verified_unit', NULL);
  `, [
    JSON.stringify(['Pertolongan Pertama', 'Kepemimpinan', 'Donor Darah']),
    JSON.stringify(['Ayo Siaga Bencana', 'Remaja Sehat Jiwa Raga']),
    JSON.stringify(['Gembira PMR', 'Pentas Seni']),
    JSON.stringify(['Pertolongan Pertama', 'Jurnalistik PMR']),
    JSON.stringify(['Perkemahan & Tri Bakti', 'Ayo Siaga Bencana'])
  ]);

  console.log("Seeding MySQL Events...");
  await pool.query(`
    INSERT INTO events (id, title, category, pmr_level, location, event_date, start_time, end_time, description, pic_name) VALUES
    (1, 'Upacara Pembukaan Jumbara PMR 2026', 'Umum', 'Semua', 'Lapangan Utama Buperta PMI', '2026-10-15', '08:00', '10:00', 'Pembukaan resmi oleh Ketua PMI Kabupaten & Pembina PMR dengan atraksi parade kontingen.', 'Subhan, S.Sos'),
    (2, 'Lomba Pertolongan Pertama (PP)', 'Jumpa', 'Wira', 'Hall A Gedung Serbaguna', '2026-10-15', '10:30', '15:00', 'Evaluasi & penanganan kasus cedera patah tulang, perdarahan, dan pemindahan korban.', 'Dr. Hendra (Korps Sukarela PMI)'),
    (3, 'Simulasi & Evakuasi Ayo Siaga Bencana (ASB)', 'Bakti', 'Madya', 'Lapangan Outdoor Sektor 2', '2026-10-16', '08:30', '12:00', 'Penyusunan peta risiko bencana sekolah, simulasi gempa bumi dan penyiapan jalur evakuasi.', 'Dedi Kusnadi (BPBD/PMI)'),
    (4, 'Gembira PMR & Pentas Seni Remaja', 'Gembira', 'Semua', 'Panggung Utama Jumbara', '2026-10-16', '19:30', '22:00', 'Ajang unjuk kebolehan seni budaya daerah, yel-yel PMI, dan kreasi persahabatan antar unit.', 'Ratna Kartika'),
    (5, 'Upacara Penutupan & Pengumuman Juara Umum', 'Umum', 'Semua', 'Lapangan Utama Buperta PMI', '2026-10-17', '14:00', '16:30', 'Pengumuman kontingen favorit, perolehan medali Tri Bakti, dan penutupan kegiatan.', 'Panitia Pelaksana PMI');
  `);

  console.log("Seeding MySQL Announcements...");
  await pool.query(`
    INSERT INTO announcements (id, title, content, target_role, priority, author_name) VALUES
    (1, 'Selamat Datang di Portal Resmi JUMBARA PMR 2026', 'Pendaftaran mandiri peserta telah dibuka. Harap seluruh calon peserta mengisi data dengan valid dan memilih Unit Sekolah yang tepat untuk diverifikasi oleh Pembina Unit.', 'all', 'important', 'Panitia Pelaksana PMI Kabupaten'),
    (2, 'Panduan Verifikasi Berkas & Cetak ID Card Peserta', 'Admin Unit PMR diwajibkan melakukan validasi peserta unit paling lambat H-3 kegiatan. Setelah disetujui Kabupaten, ID Card dengan QR Code dapat dicetak.', 'unit', 'normal', 'Sie Sekertariat Jumbara'),
    (3, 'Pemberitahuan Wajib: Hasil Skrining Kesehatan Peserta', 'Setiap kontingen unit harus menyerahkan surat keterangan sehat & izin orang tua saat check-in di lokasi Buperta.', 'all', 'urgent', 'Sie Kesehatan PMI');
  `);

  console.log("Seeding MySQL Scores...");
  await pool.query(`
    INSERT INTO scores (id, unit_id, participant_id, category_type, branch_name, pmr_level, score_val, grade, judge_name, notes) VALUES
    (1, 1, 1, 'Jumpa', 'Pertolongan Pertama', 'Wira', 95.5, 'Emas', 'Tim Juri KSR PMI', 'Respon cepat, komunikasi tim luar biasa, balut bidai sempurna.'),
    (2, 2, 2, 'Bakti', 'Ayo Siaga Bencana', 'Madya', 92.0, 'Emas', 'Tim Juri BPBD', 'Peta jalur evakuasi akurat dan pemahaman kerentanan sangat baik.'),
    (3, 3, 3, 'Gembira', 'Gembira PMR & Pentas Seni', 'Mula', 88.5, 'Perak', 'Tim Juri Kesenian PMI', 'Kreativitas lagu persahabatan anak SD sangat menghibur.'),
    (4, 1, 4, 'Jumpa', 'Jurnalistik PMR', 'Wira', 90.0, 'Emas', 'Tim Juri Humas PMI', 'Laporan berita foto dan wawancara lapangan sangat informatif.');
  `);

  console.log("Seeding MySQL Attendance...");
  await pool.query(`
    INSERT INTO attendance (id, event_id, participant_id, status, scanned_by) VALUES
    (1, 1, 1, 'hadir', 'Admin Panitia QR Scanner'),
    (2, 1, 4, 'hadir', 'Admin Panitia QR Scanner');
  `);

  console.log("Seeding MySQL Settings...");
  await pool.query(`
    INSERT INTO settings (\`key\`, \`value\`) VALUES
    ('app_name', 'JUMBARA PMR TINGKAT KABUPATEN 2026'),
    ('organizer_name', 'Palang Merah Indonesia Kabupaten'),
    ('jumbotron_title', 'Jumpa Bakti Gembira Palang Merah Remaja'),
    ('jumbotron_subtitle', 'Ajang Silaturahmi, Edukasi, Pengabdian, dan Kompetisi Tri Bakti PMR (Mula, Madya, Wira)'),
    ('event_dates', '15 - 17 Oktober 2026'),
    ('hero_image', '/images/hero.jpg'),
    ('app_logo', '/images/logo-pmi.svg'),
    ('app_favicon', '/favicon.svg')
    ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`);
  `);

  console.log("MySQL Seeding completed successfully!");
  process.exit(0);
}

seed().catch(err => {
  console.error("MySQL Seeding error:", err);
  process.exit(1);
});
