# Sistem Informasi & Manajemen JUMBARA PMR PMI Kabupaten

Aplikasi web manajemen terpadu pelaksanaan kegiatan **Jumpa Bakti Gembira (JUMBARA) Palang Merah Remaja (PMR)** Palang Merah Indonesia (PMI) Tingkat Kabupaten. Didesain secara terstruktur menggunakan **Native PHP & MySQL** untuk performa cepat, aman, dan mudah di-hosting di server lokal (MAMP / XAMPP) maupun web hosting/cPanel.

---

## 🌟 Fitur Utama

1. **Portal Publik & Landing Page Interaktif**
   - Header dinamis dengan Logo PMI dan Logo Resmi Kegiatan Jumbara.
   - Jumbotron Banner Carousel multi-tema (Cerdas, Ceria, Bersahabat).
   - Informasi Agenda Kegiatan, Lokasi, dan Pengumuman resmi.
   - Papan Matriks Kontingen & Perolehan Medali Realtime.

2. **Manajemen Kontingen & Peserta**
   - Registrasi & verifikasi peserta berjenjang (PMR Mula, Madya, Wira).
   - Validasi kuota peserta berdasarkan unsur resmi kontingen.
   - Upload dokumen kelengkapan (Surat Tugas, Pasfoto).

3. **Cetak ID Card Batch & Presensi QR Code**
   - Custom template ID Card dengan koordinat posisi teks, foto, dan QR Code.
   - Cetak ID Card batch per kontingen atau per jenjang (ukuran A4 atau CR-80).
   - Scan QR Code presensi cepat menggunakan kamera perangkat untuk setiap sesi kegiatan.

4. **Penilaian Lomba & Sertifikat / Piagam**
   - Input nilai per cabang kegiatan Jumpa, Bakti, dan Gembira.
   - Kalkulasi otomatis medali Emas, Perak, Perunggu.
   - Generator Piagam Penghargaan digital otomatis dengan tanda tangan & stempel digital.

5. **Panel Pengaturan Terpusat (Admin Kabupaten)**
   - Upload & manajemen Logo Utama (PMI), Logo Kegiatan Jumbara, Favicon, dan Gambar Kop Surat.
   - Konfigurasi judul, subjudul, dan banner Jumbotron.
   - Integrasi WhatsApp Gateway (Fonnte API) untuk notifikasi otomatis.
   - Manajemen akun pengguna & reset password.

---

## 🛠️ Arsitektur & Teknologi

- **Backend:** PHP 7.4+ / PHP 8.x (PDO MySQL Prepared Statements, Token Session Guard, Anti-Brute-Force & XSS Sanitization)
- **Database:** MySQL 5.7+ / MariaDB / MySQL 8.0
- **Frontend:** Vanilla JavaScript (Modern SPA), HTML5 Semantik, CSS3 Glassmorphism, FontAwesome 6, Google Fonts
- **Alternatif Backend:** Node.js Express (`backend/server.js`)

---

## 🚀 Panduan Instalasi Cepat

### 1. Clone Repository
```bash
git clone https://github.com/danang1978/pmipemalang-jumbara.git
cd pmipemalang-jumbara
```

### 2. Pindahkan ke Web Server
Pindahkan folder aplikasi ke direktori web server Anda:
- **MAMP (macOS):** `/Applications/MAMP/htdocs/jumbara`
- **XAMPP (Windows):** `C:\xampp\htdocs\jumbara`
- **Linux (Apache):** `/var/www/html/jumbara`

### 3. Konfigurasi Database
Sesuaikan kredensial koneksi database pada berkas [`config/database.php`](config/database.php):
```php
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306'); // Port default MySQL (atau 8889 untuk MAMP)
define('DB_NAME', 'jumbara_db');
define('DB_USER', 'root');
define('DB_PASS', '');     // Password root MySQL Anda
```

### 4. Setup Database
Pilih salah satu cara berikut untuk inisialisasi tabel dan data awal:
- **Cara A (Melalui Browser):** Buka URL `http://localhost/jumbara/db_setup.php` di peramban Anda.
- **Cara B (Import phpMyAdmin):** Buat database `jumbara_db`, lalu import berkas [`database.sql`](database.sql).

### 5. Akun Default Sistem
Setelah instalasi database selesai:
- **Role Kabupaten (Super Admin):**
  - Username: `admin_kab`
  - Password: `password`
- **Role Unit / Sekolah (Contoh):**
  - Username: `pembina_mula01`
  - Password: `password`

*(Catatan: Segera ganti password default setelah berhasil login demi keamanan).*

---

## 📂 Struktur Direktori

```text
├── api/             # Endpoint REST API Native PHP (auth, participants, settings, dll)
├── backend/         # Alternatif backend Node.js + Express
├── config/          # Konfigurasi koneksi database PDO MySQL
├── database.sql     # Skrip dump struktur & data awal database MySQL
├── db_setup.php     # Skrip installer & seeder otomatis database
├── frontend/        # Tampilan antarmuka, CSS, JS modular, dan aset gambar
│   ├── css/         # Styling responsif & tema glassmorphism
│   ├── images/      # Logo resmi PMI, Logo Jumbara, & Banner Jumbotron
│   └── js/          # Logika aplikasi (app.js, api.js, utils.js)
├── includes/        # Komponen template (header, footer, fungsi bantuan keamanan)
├── uploads/         # Direktori penyimpanan unggahan dokumen & aset dinamis
├── index.php        # Entry point utama aplikasi
└── README.md        # Dokumentasi proyek
```

---

## 🔒 Lisensi & Hak Cipta
Dikembangkan untuk kegiatan **JUMBARA PMR Palang Merah Indonesia**.
Hak Cipta © 2026 Palang Merah Indonesia.
