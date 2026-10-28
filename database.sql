-- MySQL dump 10.13  Distrib 8.0.40, for macos11.7 (x86_64)
--
-- Host: 127.0.0.1    Database: jumbara_db
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `target_role` varchar(50) DEFAULT 'all',
  `priority` varchar(50) DEFAULT 'normal',
  `author_name` varchar(150) DEFAULT 'Panitia Kabupaten PMI',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (1,'Selamat Datang di Portal Resmi JUMBARA PMR 2026','Pendaftaran mandiri peserta telah dibuka. Harap seluruh calon peserta mengisi data dengan valid dan memilih Unit Sekolah yang tepat untuk diverifikasi oleh Pembina Unit.','all','important','Panitia Pelaksana PMI Kabupaten','2026-09-29 19:43:52'),(2,'Panduan Verifikasi Berkas & Cetak ID Card Peserta','Admin Unit PMR diwajibkan melakukan validasi peserta unit paling lambat H-3 kegiatan. Setelah disetujui Kabupaten, ID Card dengan QR Code dapat dicetak.','unit','normal','Sie Sekertariat Jumbara','2026-09-29 19:43:52'),(3,'Pemberitahuan Wajib: Hasil Skrining Kesehatan Peserta','Setiap kontingen unit harus menyerahkan surat keterangan sehat & izin orang tua saat check-in di lokasi Buperta.','all','urgent','Sie Kesehatan PMI','2026-09-29 19:43:52');
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `participant_id` int NOT NULL,
  `status` varchar(50) DEFAULT 'masuk',
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `scanned_by` varchar(100) DEFAULT NULL,
  `scanned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `participant_id` (`participant_id`),
  KEY `idx_event` (`event_id`),
  KEY `idx_event_part` (`event_id`,`participant_id`),
  KEY `idx_event_status` (`event_id`,`status`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`participant_id`) REFERENCES `participants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_aspects`
--

DROP TABLE IF EXISTS `event_aspects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_aspects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `aspect_name` varchar(150) NOT NULL,
  `max_score` decimal(5,2) NOT NULL DEFAULT '100.00',
  `weight` decimal(5,2) NOT NULL DEFAULT '1.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `event_aspects_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_aspects`
--

LOCK TABLES `event_aspects` WRITE;
/*!40000 ALTER TABLE `event_aspects` DISABLE KEYS */;
INSERT INTO `event_aspects` VALUES (1,1,'Kelengkapan Kontingen & Atribut',40.00,1.00,'2026-10-03 05:31:45'),(2,1,'Jumlah & Kehadiran Peserta',60.00,1.00,'2026-10-03 05:31:45');
/*!40000 ALTER TABLE `event_aspects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_registrations`
--

DROP TABLE IF EXISTS `event_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `participant_id` int NOT NULL,
  `registered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_part_unique` (`event_id`,`participant_id`),
  KEY `participant_id` (`participant_id`),
  CONSTRAINT `event_registrations_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_registrations_ibfk_2` FOREIGN KEY (`participant_id`) REFERENCES `participants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_registrations`
--

LOCK TABLES `event_registrations` WRITE;
/*!40000 ALTER TABLE `event_registrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `pmr_level` varchar(50) DEFAULT 'Semua',
  `location` varchar(255) NOT NULL,
  `event_date` varchar(50) NOT NULL,
  `start_time` varchar(20) NOT NULL,
  `end_time` varchar(20) NOT NULL,
  `description` text,
  `pic_name` varchar(150) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `max_participants_per_unit` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_date_time` (`event_date`,`start_time`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,'Upacara Pembukaan Jumbara PMR 2026','Umum','Semua','Lapangan Utama Buperta PMI','2026-10-15','08:00','10:00','Pembukaan resmi Jumbara PMR 2026.','Subhan, S.Sos','2026-09-29 19:43:52',2),(2,'Lomba Pertolongan Pertama (PP)','Jumpa','Wira','Hall A Gedung Serbaguna','2026-10-15','10:30','15:00','Evaluasi & penanganan kasus cedera patah tulang, perdarahan, dan pemindahan korban.','Dr. Hendra (Korps Sukarela PMI)','2026-09-29 19:43:52',0),(3,'Simulasi & Evakuasi Ayo Siaga Bencana (ASB)','Bakti','Madya','Lapangan Outdoor Sektor 2','2026-10-16','08:30','12:00','Penyusunan peta risiko bencana sekolah, simulasi gempa bumi dan penyiapan jalur evakuasi.','Dedi Kusnadi (BPBD/PMI)','2026-09-29 19:43:52',0),(4,'Gembira PMR & Pentas Seni Remaja','Gembira','Semua','Panggung Utama Jumbara','2026-10-16','19:30','22:00','Ajang unjuk kebolehan seni budaya daerah, yel-yel PMI, dan kreasi persahabatan antar unit.','Ratna Kartika','2026-09-29 19:43:52',0),(5,'Upacara Penutupan & Pengumuman Juara Umum','Umum','Semua','Lapangan Utama Buperta PMI','2026-10-17','14:00','16:30','Pengumuman kontingen favorit, perolehan medali Tri Bakti, dan penutupan kegiatan.','Panitia Pelaksana PMI','2026-09-29 19:43:52',0),(6,'Lomba Pertolongan Pertama (PP) Special Quota','Jumpa','Wira','Hall C Jumbara','2026-10-16','09:00','12:00','Lomba PP terbatas maks 2 peserta per unit sekolah.','Sie Perlombaan','2026-10-03 06:08:20',2),(7,'Lomba Pertolongan Pertama (PP) Special Quota','Jumpa','Wira','Hall C Jumbara','2026-10-16','09:00','12:00','Lomba PP terbatas maks 2 peserta per unit sekolah.','Sie Perlombaan','2026-10-03 07:07:41',2);
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `participants`
--

DROP TABLE IF EXISTS `participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `participants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `user_id` int DEFAULT NULL,
  `unit_id` int NOT NULL,
  `school_address` text,
  `school_phone` varchar(50) DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `nisn` varchar(50) DEFAULT NULL,
  `level` varchar(50) NOT NULL DEFAULT 'Wira',
  `class_name` varchar(50) DEFAULT NULL,
  `last_education` varchar(100) DEFAULT NULL,
  `organizations` text,
  `birth_place` varchar(100) DEFAULT NULL,
  `birth_date` varchar(50) DEFAULT NULL,
  `gender` char(1) DEFAULT NULL,
  `blood_type` varchar(5) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `emergency_contact` varchar(255) DEFAULT NULL,
  `parent_name` varchar(255) DEFAULT NULL,
  `parent_address` text,
  `parent_phone` varchar(50) DEFAULT NULL,
  `parent_job` varchar(150) DEFAULT NULL,
  `photo_url` text,
  `sub_categories` text,
  `status` enum('pending_unit','revision','verified_unit','verified_kabupaten','rejected') NOT NULL DEFAULT 'pending_unit',
  `reject_reason` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `religion` varchar(50) DEFAULT 'Islam',
  `is_disabled` enum('Tidak','Ya') DEFAULT 'Tidak',
  `disability_type` varchar(150) DEFAULT 'Tidak Ada',
  `address` text,
  `assignment_letter_url` varchar(255) DEFAULT NULL,
  `registration_type` enum('Peserta','Panitia','Peninjau','Pendamping','Tamu Undangan','Media') DEFAULT 'Peserta',
  `email` varchar(100) DEFAULT NULL,
  `certificate_number` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_unit_status` (`unit_id`,`status`),
  KEY `idx_status_level` (`status`,`level`),
  KEY `idx_status_id` (`status`,`id`),
  KEY `idx_full_name` (`full_name`),
  KEY `idx_reg_type` (`registration_type`),
  KEY `idx_nisn` (`nisn`),
  KEY `idx_cert_num` (`certificate_number`),
  CONSTRAINT `participants_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `participants_ibfk_2` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `participants`
--

LOCK TABLES `participants` WRITE;
/*!40000 ALTER TABLE `participants` DISABLE KEYS */;
INSERT INTO `participants` VALUES (1,'JMB-2026-0001',4,1,'Rizky Pratama','0054321098','Wira','Kabupaten','2008-05-14','L','O','081299990001','081299990000 (Ayah)','https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',NULL,'verified_kabupaten',NULL,'2026-10-14 19:53:29','Islam','Tidak','Tidak Ada',NULL,NULL,'Peserta',NULL,NULL);
/*!40000 ALTER TABLE `participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `score_aspect_details`
--

DROP TABLE IF EXISTS `score_aspect_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `score_aspect_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `score_id` int NOT NULL,
  `aspect_id` int NOT NULL,
  `score_val` decimal(5,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `score_id` (`score_id`),
  KEY `aspect_id` (`aspect_id`),
  CONSTRAINT `score_aspect_details_ibfk_1` FOREIGN KEY (`score_id`) REFERENCES `scores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `score_aspect_details_ibfk_2` FOREIGN KEY (`aspect_id`) REFERENCES `event_aspects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `score_aspect_details`
--

LOCK TABLES `score_aspect_details` WRITE;
/*!40000 ALTER TABLE `score_aspect_details` DISABLE KEYS */;
INSERT INTO `score_aspect_details` VALUES (3,5,1,33.00),(4,5,2,60.00);
/*!40000 ALTER TABLE `score_aspect_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scores`
--

DROP TABLE IF EXISTS `scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int DEFAULT NULL,
  `unit_id` int NOT NULL,
  `participant_id` int DEFAULT NULL,
  `target_type` varchar(20) DEFAULT 'peserta',
  `category_type` varchar(50) NOT NULL,
  `branch_name` varchar(150) NOT NULL,
  `pmr_level` varchar(50) NOT NULL,
  `score_val` double NOT NULL,
  `grade` varchar(50) DEFAULT NULL,
  `judge_name` varchar(150) DEFAULT NULL,
  `evaluator_user_id` int DEFAULT NULL,
  `notes` text,
  `status` varchar(20) DEFAULT 'draft',
  `validated_at` datetime DEFAULT NULL,
  `validated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `participant_id` (`participant_id`),
  KEY `idx_event_id` (`event_id`),
  KEY `idx_evaluator` (`evaluator_user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_unit_cat` (`unit_id`,`category_type`),
  CONSTRAINT `scores_ibfk_1` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE,
  CONSTRAINT `scores_ibfk_2` FOREIGN KEY (`participant_id`) REFERENCES `participants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scores`
--

LOCK TABLES `scores` WRITE;
/*!40000 ALTER TABLE `scores` DISABLE KEYS */;
INSERT INTO `scores` VALUES (1,NULL,1,NULL,'peserta','Jumpa','Pertolongan Pertama','Wira',95.5,'Emas','Tim Juri KSR PMI',NULL,'Respon cepat, komunikasi tim luar biasa, balut bidai sempurna.','draft',NULL,NULL,'2026-09-29 19:43:52'),(2,NULL,2,NULL,'peserta','Bakti','Ayo Siaga Bencana','Madya',92,'Emas','Tim Juri BPBD',NULL,'Peta jalur evakuasi akurat dan pemahaman kerentanan sangat baik.','draft',NULL,NULL,'2026-09-29 19:43:52'),(3,NULL,3,NULL,'peserta','Gembira','Gembira PMR & Pentas Seni','Mula',88.5,'Perak','Tim Juri Kesenian PMI',NULL,'Kreativitas lagu persahabatan anak SD sangat menghibur.','draft',NULL,NULL,'2026-09-29 19:43:52'),(4,NULL,1,NULL,'peserta','Jumpa','Jurnalistik PMR','Wira',90,'Emas','Tim Juri Humas PMI',NULL,'Laporan berita foto dan wawancara lapangan sangat informatif.','draft',NULL,NULL,'2026-09-29 19:43:52'),(5,1,1,NULL,'kontingen','Umum','Upacara Pembukaan Jumbara PMR 2026','Semua',93,'Emas','Tim Juri KSR PMI',21,'ok','validated','2026-10-03 20:17:20',1,'2026-10-03 19:45:58');
/*!40000 ALTER TABLE `scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `key` varchar(100) NOT NULL,
  `value` text,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES ('app_favicon','uploads/favicon_1791009889.webp'),('app_kop','uploads/kop_1790727651.jpg'),('app_logo','uploads/logo_1791009905.jpg'),('app_name','JUMBARA PMR TINGKAT KABUPATEN 2026'),('event_dates','15 - 17 Oktober 2026'),('event_logo','frontend/images/logo-jumbara-xii.png'),('hero_image','/images/hero.jpg'),('idcard_cat_y','112'),('idcard_date','Bandung, 23 - 24 Juni 2026'),('idcard_event_subtitle','PMI PROVINSI JAWA TENGAH TAHUN 2026'),('idcard_event_title','MUSYAWARAH XIII'),('idcard_grid_cols','1'),('idcard_motto','BERSATU DEMI KEMANUSIAAN'),('idcard_name_size','18'),('idcard_name_y','4'),('idcard_paper_size','cr80'),('idcard_photo_h','145'),('idcard_photo_w','110'),('idcard_photo_x','-10'),('idcard_photo_y','-8'),('idcard_qr_size','76'),('idcard_qr_x','-10'),('idcard_qr_y','22'),('idcard_template','uploads/idcard_template_1792037000_5ae155f0.jpg'),('idcard_unit_size','14'),('idcard_unit_y','31'),('jumbotron_images','[\"frontend\\/images\\/jumbotron-tema1-cerdas.jpg\",\"frontend\\/images\\/jumbotron-tema2-ceria.jpg\",\"frontend\\/images\\/jumbotron-tema3-bersahabat.jpg\"]'),('jumbotron_subtitle','Ajang Jumpa Bakti Gembira Palang Merah Remaja - Cerdas, Ceria, Bersahabat'),('jumbotron_title','JUMBARA XII PMR PMI KABUPATEN PEMALANG'),('menu_config','{\"categories\":[{\"id\":\"peserta\",\"label\":\"Data Peserta & Card\",\"icon\":\"fa-solid fa-users\",\"color\":\"#2563eb\",\"bg\":\"#eff6ff\"},{\"id\":\"agenda\",\"label\":\"Agenda & Presensi\",\"icon\":\"fa-solid fa-calendar-check\",\"color\":\"#d97706\",\"bg\":\"#fffbeb\"},{\"id\":\"penilaian\",\"label\":\"Penilaian & Laporan\",\"icon\":\"fa-solid fa-award\",\"color\":\"#059669\",\"bg\":\"#ecfdf5\"},{\"id\":\"pengaturan\",\"label\":\"Pengaturan & Akun\",\"icon\":\"fa-solid fa-gears\",\"color\":\"#4f46e5\",\"bg\":\"#eef2ff\"}],\"items\":[{\"id\":\"verifikasi\",\"label\":\"Verifikasi Peserta\",\"icon\":\"fa-solid fa-user-check\",\"category\":\"peserta\",\"enabled\":true,\"isSystem\":true},{\"id\":\"idcard\",\"label\":\"Cetak ID Card Batch\",\"icon\":\"fa-solid fa-id-card\",\"category\":\"peserta\",\"enabled\":true,\"isSystem\":true},{\"id\":\"master\",\"label\":\"Master Data & WA\",\"icon\":\"fa-solid fa-database\",\"category\":\"peserta\",\"enabled\":true,\"isSystem\":true},{\"id\":\"jadwal\",\"label\":\"Kelola Jadwal\",\"icon\":\"fa-solid fa-calendar-days\",\"category\":\"agenda\",\"enabled\":true,\"isSystem\":true},{\"id\":\"presensi\",\"label\":\"Scan Presensi QR\",\"icon\":\"fa-solid fa-qrcode\",\"category\":\"agenda\",\"enabled\":true,\"isSystem\":true},{\"id\":\"pengumuman\",\"label\":\"Pengumuman\",\"icon\":\"fa-solid fa-bullhorn\",\"category\":\"agenda\",\"enabled\":true,\"isSystem\":true},{\"id\":\"penilaian\",\"label\":\"Penilaian & Medali\",\"icon\":\"fa-solid fa-trophy\",\"category\":\"penilaian\",\"enabled\":true,\"isSystem\":true},{\"id\":\"laporan\",\"label\":\"Laporan & Export\",\"icon\":\"fa-solid fa-file-export\",\"category\":\"penilaian\",\"enabled\":true,\"isSystem\":true},{\"id\":\"pengaturan\",\"label\":\"Pengaturan DB\",\"icon\":\"fa-solid fa-gear\",\"category\":\"pengaturan\",\"enabled\":true,\"isSystem\":true},{\"id\":\"users\",\"label\":\"Kelola User & Password\",\"icon\":\"fa-solid fa-users-gear\",\"category\":\"pengaturan\",\"enabled\":true,\"isSystem\":true},{\"id\":\"menu\",\"label\":\"Pengaturan Menu\",\"icon\":\"fa-solid fa-list-check\",\"category\":\"pengaturan\",\"enabled\":true,\"isSystem\":true,\"isRequired\":true},{\"id\":\"password\",\"label\":\"Ganti Password Saya\",\"icon\":\"fa-solid fa-key\",\"category\":\"pengaturan\",\"enabled\":true,\"isSystem\":true,\"isRequired\":true}]}'),('menu_settings','{\"categories\":[{\"id\":\"peserta\",\"label\":\"Data Peserta & Card\",\"icon\":\"fa-solid fa-users\",\"color\":\"#2563eb\",\"bg\":\"#eff6ff\"},{\"id\":\"agenda\",\"label\":\"Agenda & Presensi\",\"icon\":\"fa-solid fa-calendar-check\",\"color\":\"#d97706\",\"bg\":\"#fffbeb\"},{\"id\":\"penilaian\",\"label\":\"Penilaian & Laporan\",\"icon\":\"fa-solid fa-award\",\"color\":\"#059669\",\"bg\":\"#ecfdf5\"},{\"id\":\"pengaturan\",\"label\":\"Pengaturan & Akun\",\"icon\":\"fa-solid fa-gears\",\"color\":\"#4f46e5\",\"bg\":\"#eef2ff\"}],\"items\":[{\"id\":\"verifikasi\",\"label\":\"Verifikasi Peserta\",\"icon\":\"fa-solid fa-user-check\",\"category\":\"peserta\",\"enabled\":true,\"isSystem\":true},{\"id\":\"idcard\",\"label\":\"Cetak ID Card Batch\",\"icon\":\"fa-solid fa-id-card\",\"category\":\"peserta\",\"enabled\":true,\"isSystem\":true},{\"id\":\"master\",\"label\":\"Master Data & WA\",\"icon\":\"fa-solid fa-database\",\"category\":\"peserta\",\"enabled\":true,\"isSystem\":true},{\"id\":\"jadwal\",\"label\":\"Kelola Jadwal\",\"icon\":\"fa-solid fa-calendar-days\",\"category\":\"agenda\",\"enabled\":true,\"isSystem\":true},{\"id\":\"presensi\",\"label\":\"Scan Presensi QR\",\"icon\":\"fa-solid fa-qrcode\",\"category\":\"agenda\",\"enabled\":true,\"isSystem\":true},{\"id\":\"pengumuman\",\"label\":\"Pengumuman\",\"icon\":\"fa-solid fa-bullhorn\",\"category\":\"agenda\",\"enabled\":true,\"isSystem\":true},{\"id\":\"penilaian\",\"label\":\"Penilaian & Medali\",\"icon\":\"fa-solid fa-trophy\",\"category\":\"penilaian\",\"enabled\":true,\"isSystem\":true},{\"id\":\"laporan\",\"label\":\"Laporan & Export\",\"icon\":\"fa-solid fa-file-export\",\"category\":\"penilaian\",\"enabled\":true,\"isSystem\":true},{\"id\":\"pengaturan\",\"label\":\"Pengaturan DB\",\"icon\":\"fa-solid fa-gear\",\"category\":\"pengaturan\",\"enabled\":true,\"isSystem\":true},{\"id\":\"users\",\"label\":\"Kelola User & Password\",\"icon\":\"fa-solid fa-users-gear\",\"category\":\"pengaturan\",\"enabled\":true,\"isSystem\":true},{\"id\":\"menu\",\"label\":\"Pengaturan Menu\",\"icon\":\"fa-solid fa-list-check\",\"category\":\"pengaturan\",\"enabled\":true,\"isSystem\":true,\"isRequired\":true},{\"id\":\"password\",\"label\":\"Ganti Password Saya\",\"icon\":\"fa-solid fa-key\",\"category\":\"pengaturan\",\"enabled\":true,\"isSystem\":true,\"isRequired\":true}]}'),('option_blood_types','[\"O\", \"A\", \"B\", \"AB\", \"Belum Tahu\"]'),('option_disability_statuses','[{\"value\": \"Tidak\", \"label\": \"Tidak (Non-Disabilitas)\"}, {\"value\": \"Ya\", \"label\": \"Ya (Penyandang Disabilitas)\"}]'),('option_disability_types','[\"Tidak Ada\", \"Disabilitas Fisik / Daksa\", \"Disabilitas Netra\", \"Disabilitas Rungu / Wicara\", \"Disabilitas Intelektual / Grahita\", \"Disabilitas Mental\", \"Lainnya\"]'),('option_genders','[{\"value\": \"L\", \"label\": \"Laki-laki\"}, {\"value\": \"P\", \"label\": \"Perempuan\"}]'),('option_levels','[{\"value\": \"Wira\", \"label\": \"Wira (SMA / SMK / MA)\"}, {\"value\": \"Madya\", \"label\": \"Madya (SMP / MTs)\"}, {\"value\": \"Mula\", \"label\": \"Mula (SD / MI)\"}]'),('option_religions','[\"Islam\", \"Kristen Protestan\", \"Katolik\", \"Hindu\", \"Buddha\", \"Konghucu\"]'),('organizer_name','PMI Kabupaten Pemalang'),('piagam_city_date','Pemalang, 29 September 2026'),('piagam_event_line1','Jumbara PMI Kabupaten Pemalang Tahun 2026'),('piagam_event_line2','Jaka Garong, 27-29 September 2026'),('piagam_header_logo','uploads/piagam_kop_1791028457.png'),('piagam_org_line1','Pengurus'),('piagam_org_line2','PALANG MERAH INDONESIA'),('piagam_org_line3','Kabupaten pemalang'),('piagam_show_qr','1'),('piagam_signature_image','uploads/piagam_signature_1791027284.png'),('piagam_signer_name','GBPH. H. Prabukusumo, S.Psi.'),('piagam_signer_title','Ketua,'),('piagam_stamp_image','uploads/piagam_stamp_1791027289.png'),('piagam_title_main','PENGHARGAAN'),('piagam_title_top','Menyampaikan'),('reg_active','1'),('reg_deadline','2026-10-14T23:59');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `level_category` varchar(100) NOT NULL,
  `pembina_name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (1,'UNT-001','SMAN 1 Kabupaten PMI','Wira (SMA)','Drs. Ahmad Hidayat, M.Pd','081234567890','Jl. Merdeka No. 45, Kabupaten','2026-09-29 19:43:52'),(2,'UNT-002','SMPN 2 Kota Bakti','Madya (SMP)','Dewi Lestari, S.Pd','082198765432','Jl. Pemuda No. 12, Kota Bakti','2026-09-29 19:43:52'),(3,'UNT-003','SDN 01 Utama Ceria Sekali','Mula (SD)','Bambang Gunawan, S.Pd','085711223344','Jl. Pendidikan No. 8, Ceria','2026-09-29 19:43:52'),(4,'UNT-004','SMKN 2 Teknologi PMR','Wira (SMA)','Siti Rahmawati, S.T','081399887766','Jl. Industri No. 99, Kabupaten','2026-09-29 19:43:52'),(5,'UNT-216','SMKN 3 Seni & Budaya PMR','Wira (SMA)','Siti Aminah, S.Pd','081233445566','Jl. Kebudayaan No. 10','2026-10-02 18:57:02');
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unsur_categories`
--

DROP TABLE IF EXISTS `unsur_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unsur_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `quota` int NOT NULL DEFAULT '1',
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unsur_categories`
--

LOCK TABLES `unsur_categories` WRITE;
/*!40000 ALTER TABLE `unsur_categories` DISABLE KEYS */;
INSERT INTO `unsur_categories` VALUES (1,'Kepala Sekolah',1,'Unsur Kepala Sekolah PMI (Maksimal 1 orang per kontingen)','2026-10-03 01:46:18'),(2,'Pembina PMR',2,'Unsur Pembina PMR (Maksimal 2 orang per kontingen)','2026-10-03 01:46:18'),(7,'Anggota PMR',16,'Unsur Peserta PMR Madya dan Wira  (Maksimal 16 orang per kontingen)','2026-10-03 01:46:18'),(8,'Peninjau',0,'Unsur Peninjau Kontingen','2026-10-28 13:36:00'),(9,'Pendamping',0,'Unsur Pendamping Kontingen / Pembina','2026-10-28 13:36:00');
/*!40000 ALTER TABLE `unsur_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'peserta',
  `unit_id` int DEFAULT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `unit_id` (`unit_id`),
  KEY `idx_role` (`role`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin_kab','$2y$10$A.KLtfC.jaVmyEsRTK7UcO6ArEFq2fWi1ZVqmH6jUmHdksuZm3yuu','admin@pmikab.or.id','kabupaten',NULL,'2026-09-29 19:43:52'),(2,'admin_sman1','$2b$10$1BMbZDPsBFwhjZ28Uf6dUu.W/OP/PRD6a3oA4YlGfxXH0hW1r9KC.','unit.sman1@jumbara.id','unit',1,'2026-09-29 19:43:52'),(3,'admin_smpn2','$2b$10$1BMbZDPsBFwhjZ28Uf6dUu.W/OP/PRD6a3oA4YlGfxXH0hW1r9KC.','unit.smpn2@jumbara.id','unit',2,'2026-09-29 19:43:52'),(4,'admin_sdn01','$2b$10$1BMbZDPsBFwhjZ28Uf6dUu.W/OP/PRD6a3oA4YlGfxXH0hW1r9KC.','unit.sdn01@jumbara.id','unit',3,'2026-09-29 19:43:52'),(21,'penilai_01','$2y$10$uf6b4cfndCcD1qKFo2VwnuArpabhoyYDRsrES95kiXmKapuVx6hbC','penilai@gmail.com','penilai',NULL,'2026-10-03 19:18:14'),(22,'panitia_01','$2y$12$cmDZRNjYKK01qn/F1Wte6eTPtu8PYzbbxmdjQ8iACcnhFQmE4Xv5S','panitia@gmail.com','panitia',NULL,'2026-10-03 20:49:54');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materials`
--

DROP TABLE IF EXISTS `materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Buku Panduan',
  `description` text,
  `file_url` varchar(255) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` varchar(50) DEFAULT '1.5 MB',
  `file_type` varchar(50) DEFAULT 'pdf',
  `download_count` int NOT NULL DEFAULT '0',
  `uploaded_by` varchar(100) DEFAULT 'Panitia Jumbara PMI',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mat_cat` (`category`),
  KEY `idx_mat_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_name` varchar(150) DEFAULT 'Anonim',
  `is_anonymous` tinyint(1) NOT NULL DEFAULT '0',
  `unit_name` varchar(150) DEFAULT NULL,
  `sender_role` varchar(100) DEFAULT 'Peserta PMR',
  `category` varchar(100) NOT NULL DEFAULT 'Saran Umum',
  `rating` int NOT NULL DEFAULT '5',
  `message` text NOT NULL,
  `status` enum('unread','read','followup') NOT NULL DEFAULT 'unread',
  `admin_notes` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fb_status` (`status`),
  KEY `idx_fb_created` (`created_at`),
  KEY `idx_fb_cat` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-15 16:06:32
