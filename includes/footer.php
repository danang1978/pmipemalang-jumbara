<?php
$settings = getAppSettings();
?>
  <!-- Footer Section -->
  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-col">
        <div class="footer-brand">
          <img src="<?php echo htmlspecialchars($settings['app_logo']); ?>" alt="Logo PMI" class="footer-logo">
          <h3><span id="footerAppName"><?php echo htmlspecialchars($settings['app_name']); ?></span></h3>
        </div>
        <p>Ajang evaluasi dan pembinaan generasi muda Palang Merah Remaja (Mula, Madya, Wira) dalam mewujudkan Tri Bakti PMR.</p>
      </div>

      <div class="footer-col">
        <h4>Link Cepat</h4>
        <ul>
          <li><a href="#beranda" onclick="App.scrollToSection('beranda')">Beranda & Jumbotron</a></li>
          <li><a href="#kegiatan" onclick="App.scrollToSection('kegiatan')">Jadwal & Rundown</a></li>
          <li><a href="#pengumuman" onclick="App.scrollToSection('pengumuman')">Papan Pengumuman</a></li>
          <li><a href="#klasemen" onclick="App.scrollToSection('klasemen')">Perolehan Medali</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Sekretariat PMI</h4>
        <p><i class="fa-solid fa-location-dot"></i> Jl. Palang Merah No. 1, Markas PMI Kabupaten</p>
        <p><i class="fa-solid fa-phone"></i> (021) 555-PMR-2026</p>
        <p><i class="fa-solid fa-envelope"></i> info@pmikabupaten.or.id</p>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Palang Merah Indonesia Kabupaten. Structured Native PHP & MySQL Application.</p>
    </div>
  </footer>

  <!-- ========================================================================== -->
  <!-- NATIVE MOBILE BOTTOM NAVIGATION BAR -->
  <!-- ========================================================================== -->
  <nav class="mobile-bottom-nav" id="mobileBottomNav">
    <button class="mobile-nav-btn active" id="mbNavHome" onclick="App.handleMobileNav('beranda')">
      <i class="fa-solid fa-house"></i>
      <span>Beranda</span>
    </button>
    <button class="mobile-nav-btn" id="mbNavAgenda" onclick="App.handleMobileNav('kegiatan')">
      <i class="fa-solid fa-calendar-days"></i>
      <span>Agenda</span>
    </button>
    <button class="mobile-nav-btn" id="mbNavAnnounce" onclick="App.handleMobileNav('pengumuman')">
      <i class="fa-solid fa-bullhorn"></i>
      <span>Info</span>
    </button>
    <button class="mobile-nav-btn" id="mbNavStandings" onclick="App.handleMobileNav('klasemen')">
      <i class="fa-solid fa-trophy"></i>
      <span>Medali</span>
    </button>
    <button class="mobile-nav-btn" id="mbNavPortal" onclick="App.handleMobileNav('portal')">
      <i class="fa-solid fa-user-gear"></i>
      <span>Portal</span>
    </button>
  </nav>
  <!-- MODAL DIALOGS -->
  <!-- ========================================================================== -->

  <!-- Modal 1: Login Portal -->
  <div class="modal" id="loginModal">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title"><i class="fa-solid fa-right-to-bracket"></i> Login Portal JUMBARA</h3>
        <button class="modal-close" onclick="App.closeModal('loginModal')">&times;</button>
      </div>
      <form onsubmit="App.handleLogin(event)">
        <div class="modal-body">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Username *</label>
            <input type="text" id="loginUsername" placeholder="Masukkan username Anda..." required>
          </div>
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Password *</label>
            <input type="password" id="loginPassword" placeholder="Masukkan password..." required>
          </div>

          <div style="background: #f1f5f9; padding: 0.8rem; border-radius: 6px; border-left: 4px solid var(--secondary); margin-bottom: 1rem; font-size: 0.82rem;">
            <strong>Demo Fast Login Credentials:</strong><br>
            • Admin Kabupaten: <code>admin_kab</code> / <code>admin123</code><br>
            • Admin Unit School: <code>admin_sman1</code> / <code>unit123</code><br>
            • Peserta PMR: <code>peserta_wira</code> / <code>peserta123</code>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('loginModal')">Batal</button>
          <button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-key"></i> Masuk Sekarang</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal 2: Pendaftaran Mandiri Peserta -->
  <div class="modal" id="registerModal">
    <div class="modal-dialog" style="max-width: 650px;">
      <div class="modal-header">
        <h3 class="modal-title"><i class="fa-solid fa-user-plus"></i> Form Pendaftaran Mandiri Peserta PMR</h3>
        <button class="modal-close" onclick="App.closeModal('registerModal')">&times;</button>
      </div>
      <form onsubmit="App.handleRegister(event)">
          <!-- KOP SURAT RESMI PALANG MERAH INDONESIA KABUPATEN -->
          <div class="kop-surat-container" style="margin-bottom: 1rem;">
            <?php if (!empty($settings['app_kop'])): ?>
              <div style="text-align: center; margin-bottom: 1rem;">
                <img src="<?php echo htmlspecialchars($settings['app_kop']); ?>" alt="Kop Surat Resmi PMI" style="max-width: 100%; height: auto; display: block; margin: 0 auto; border-bottom: 3px double var(--primary); padding-bottom: 0.5rem; border-radius: 4px;">
              </div>
            <?php else: ?>
              <div class="kop-header">
                <img src="<?php echo htmlspecialchars($settings['app_logo'] ?? 'frontend/images/logo-pmi.svg'); ?>" alt="Logo PMI" class="kop-logo">
                <div class="kop-text">
                  <h2>PALANG MERAH INDONESIA (PMI) KABUPATEN</h2>
                  <h3>PANITIA PELAKSANA JUMBARA PMR TINGKAT KABUPATEN 2026</h3>
                  <p>Jl. Palang Merah No. 1, Markas PMI Kabupaten | Telp: (021) 555-PMR-2026 | Email: sekretariat@jumbara-pmi.or.id</p>
                </div>
              </div>
              <div class="kop-divider"></div>
            <?php endif; ?>
          </div>

          <h4 style="color: var(--secondary); margin-bottom: 0.8rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.4rem;">
            1. Pilihan Kontingen Unit & Tingkat PMR
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label">Unit Sekolah PMR *</label>
              <select id="regUnitId" required>
                <option value="">-- Pilih Unit Sekolah --</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tingkat PMR *</label>
              <select id="regLevel" required>
                <option value="Wira">Wira (SMA / SMK / MA)</option>
                <option value="Madya">Madya (SMP / MTs)</option>
                <option value="Mula">Mula (SD / MI)</option>
              </select>
            </div>
          </div>

          <h4 style="color: var(--secondary); margin-bottom: 0.8rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.4rem;">
            2. Biodata Peserta
          </h4>
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Nama Lengkap Peserta *</label>
            <input type="text" id="regFullName" placeholder="Nama sesuai ijazah/akta..." required>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label">NISN / NIK</label>
              <input type="text" id="regNisn" placeholder="Nomor NISN/NIK...">
            </div>
            <div class="form-group">
              <label class="form-label">Agama *</label>
              <select id="regReligion" required>
                <option value="Islam">Islam</option>
                <option value="Kristen Protestan">Kristen Protestan</option>
                <option value="Katolik">Katolik</option>
                <option value="Hindu">Hindu</option>
                <option value="Buddha">Buddha</option>
                <option value="Konghucu">Konghucu</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Jenis Kelamin *</label>
              <select id="regGender" required>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Golongan Darah *</label>
              <select id="regBloodType" required>
                <option value="O">Golongan O</option>
                <option value="A">Golongan A</option>
                <option value="B">Golongan B</option>
                <option value="AB">Golongan AB</option>
                <option value="Belum Tahu">Belum Tahu</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label">Tempat Lahir</label>
              <input type="text" id="regBirthPlace" placeholder="Kota lahir...">
            </div>
            <div class="form-group">
              <label class="form-label">Tanggal Lahir</label>
              <input type="date" id="regBirthDate">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label">Disabilitas atau Tidak *</label>
              <select id="regIsDisabled" required>
                <option value="Tidak">Tidak (Non-Disabilitas)</option>
                <option value="Ya">Ya (Penyandang Disabilitas)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Jenis Disabilitas</label>
              <select id="regDisabilityType">
                <option value="Tidak Ada">Tidak Ada</option>
                <option value="Disabilitas Fisik / Daksa">Disabilitas Fisik / Daksa</option>
                <option value="Disabilitas Netra">Disabilitas Netra</option>
                <option value="Disabilitas Rungu / Wicara">Disabilitas Rungu / Wicara</option>
                <option value="Disabilitas Intelektual / Grahita">Disabilitas Intelektual / Grahita</option>
                <option value="Disabilitas Mental">Disabilitas Mental</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Alamat Tempat Tinggal Peserta *</label>
            <textarea id="regAddress" rows="2" placeholder="Masukkan alamat tempat tinggal..." required></textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label">No. Telepon / WhatsApp *</label>
              <input type="text" id="regPhone" placeholder="0812xxxxxxx" required>
            </div>
            <div class="form-group">
              <label class="form-label">Kontak Darurat (Orangtua) *</label>
              <input type="text" id="regEmergency" placeholder="Nama & No. HP Orangtua" required>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">URL Pas Foto Peserta (3x4)</label>
            <input type="text" id="regPhotoUrl" placeholder="https://..." value="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150">
          </div>

          <h4 style="color: var(--secondary); margin-bottom: 0.8rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.4rem;">
            3. Minat Sub-Kategori Tri Bakti Jumbara
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <label><input type="checkbox" name="regCategory" value="Pertolongan Pertama" checked> Pertolongan Pertama (PP)</label>
            <label><input type="checkbox" name="regCategory" value="Ayo Siaga Bencana" checked> Ayo Siaga Bencana (ASB)</label>
            <label><input type="checkbox" name="regCategory" value="Kepemimpinan"> Kepemimpinan & Remaja Sehat</label>
            <label><input type="checkbox" name="regCategory" value="Gembira PMR"> Gembira PMR & Pentas Seni</label>
            <label><input type="checkbox" name="regCategory" value="Donor Darah"> Donor Darah Siswa</label>
            <label><input type="checkbox" name="regCategory" value="Jurnalistik PMR"> Jurnalistik & Humas PMR</label>
          </div>

        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('registerModal')">Batal</button>
          <button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-paper-plane"></i> Kirim Pendaftaran Mandiri</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal 3: Penolakan Verifikasi -->
  <div class="modal" id="rejectModal">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title"><i class="fa-solid fa-circle-xmark" style="color: red;"></i> Tolak Pendaftaran Peserta</h3>
        <button class="modal-close" onclick="App.closeModal('rejectModal')">&times;</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="rejectParticipantId">
        <div class="form-group">
          <label class="form-label">Alasan Penolakan / Catatan Perbaikan *</label>
          <textarea id="rejectReasonInput" rows="4" placeholder="Contoh: Berkas foto kurang jelas atau NISN tidak terdaftar di unit..." required></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('rejectModal')">Batal</button>
        <button type="button" class="btn btn-danger btn-sm" onclick="App.submitReject()">Konfirmasi Tolak</button>
      </div>
    </div>
  </div>

  <!-- Modal Audit & Verifikasi Berkas Peserta (Pengecekan Data, Foto & Surat Tugas) -->
  <div class="modal" id="auditModal">
    <div class="modal-dialog" style="max-width: 900px;">
      <div class="modal-header" style="background: #ffffff; border-bottom: 1px solid var(--border-color);">
        <h3 class="modal-title" style="color: var(--secondary); display: flex; align-items: center; gap: 0.5rem;">
          <i class="fa-solid fa-clipboard-check" style="color: var(--primary);"></i> Pengecekan Audit Data, Pas Foto & Surat Tugas
        </h3>
        <button class="modal-close" onclick="App.closeModal('auditModal')">&times;</button>
      </div>
      <div class="modal-body" id="auditModalBody" style="padding: 1.25rem;">
        <p style="text-align: center; color: var(--text-muted);">Memuat data audit peserta...</p>
      </div>
    </div>
  </div>

  <!-- Modal Edit Profile / Revisi Data Peserta -->
  <div class="modal" id="editProfileModal">
    <div class="modal-dialog" style="max-width: 650px;">
      <div class="modal-header">
        <h3 class="modal-title"><i class="fa-solid fa-pen-to-square"></i> Perbaiki Data & Unggah Ulang Berkas</h3>
        <button class="modal-close" onclick="App.closeModal('editProfileModal')">&times;</button>
      </div>
      <form onsubmit="App.submitEditProfile(event)">
        <div class="modal-body">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Nama Lengkap Peserta *</label>
            <input type="text" id="editProfileFullName" required>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label">NISN / NIK</label>
              <input type="text" id="editProfileNisn">
            </div>
            <div class="form-group">
              <label class="form-label">Agama *</label>
              <select id="editProfileReligion" required>
                <option value="Islam">Islam</option>
                <option value="Kristen Protestan">Kristen Protestan</option>
                <option value="Katolik">Katolik</option>
                <option value="Hindu">Hindu</option>
                <option value="Buddha">Buddha</option>
                <option value="Konghucu">Konghucu</option>
              </select>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label">Jenis Kelamin *</label>
              <select id="editProfileGender" required>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Golongan Darah *</label>
              <select id="editProfileBloodType" required>
                <option value="O">Golongan O</option>
                <option value="A">Golongan A</option>
                <option value="B">Golongan B</option>
                <option value="AB">Golongan AB</option>
                <option value="Belum Tahu">Belum Tahu</option>
              </select>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label">No. WhatsApp Aktif *</label>
              <input type="text" id="editProfilePhone" required>
            </div>
            <div class="form-group">
              <label class="form-label">Nama Pembina / Ortu</label>
              <input type="text" id="editProfileEmergencyContact">
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Alamat Lengkap Tempat Tinggal *</label>
            <textarea id="editProfileAddress" rows="2" required></textarea>
          </div>

          <div style="background: #f8fafc; padding: 1rem; border-radius: 6px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
            <h4 style="font-size: 0.9rem; font-weight: 800; color: var(--primary); margin-bottom: 0.6rem;">
              <i class="fa-solid fa-cloud-arrow-up"></i> Unggah Ulang Berkas (Opsional - Isi jika perbaikan foto/surat):
            </h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Pas Foto Peserta Baru (3x4)</label>
                <input type="file" id="editProfilePhotoFile" accept="image/*" class="form-control" style="padding: 0.3rem;">
              </div>
              <div class="form-group">
                <label class="form-label">Surat Tugas PMR Baru</label>
                <input type="file" id="editProfileAssignmentFile" accept="image/*,application/pdf" class="form-control" style="padding: 0.3rem;">
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('editProfileModal')">Batal</button>
          <button type="submit" id="editProfileSubmitBtn" class="btn btn-primary btn-sm"><i class="fa-solid fa-paper-plane"></i> Simpan & Kirim Ulang Verifikasi</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal 4: Kartu Peserta ID Card Modal -->
  <div class="modal" id="idCardModal">
    <div class="modal-dialog" style="max-width: 480px;">
      <div class="modal-header">
        <h3 class="modal-title"><i class="fa-solid fa-id-card"></i> Pratinjau Kartu Peserta JUMBARA</h3>
        <button class="modal-close" onclick="App.closeModal('idCardModal')">&times;</button>
      </div>
      <div class="modal-body" id="idCardModalContent" style="background: #f8fafc; padding: 1.5rem; text-align: center;">
        <!-- ID Card dynamically rendered -->
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('idCardModal')">Tutup</button>
        <button type="button" class="btn btn-primary btn-sm" onclick="window.print()"><i class="fa-solid fa-print"></i> Cetak ID Card (PDF)</button>
      </div>
    </div>
  </div>

  <!-- Modal 5: Input Penilaian Lomba -->
  <div class="modal" id="scoreModal">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title"><i class="fa-solid fa-trophy"></i> Input Penilaian Tri Bakti JUMBARA</h3>
        <button class="modal-close" onclick="App.closeModal('scoreModal')">&times;</button>
      </div>
      <form onsubmit="App.handleSaveScore(event)">
        <div class="modal-body">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Unit Sekolah Kontingen *</label>
            <select id="scoreUnitId" onchange="App.loadParticipantsForScoreSelect(this.value)" required>
              <option value="">-- Pilih Unit Sekolah --</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Peserta Spesifik (Opsional)</label>
            <select id="scoreParticipantId">
              <option value="">-- Semua Kontingen Unit --</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label">Kategori Tri Bakti *</label>
              <select id="scoreCategoryType" required>
                <option value="Jumpa">Jumpa (Evaluasi & Kompetisi)</option>
                <option value="Bakti">Bakti (Pengabdian Masyarakat)</option>
                <option value="Gembira">Gembira (Persahabatan & Seni)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tingkat PMR *</label>
              <select id="scorePmrLevel" required>
                <option value="Wira">Wira (SMA)</option>
                <option value="Madya">Madya (SMP)</option>
                <option value="Mula">Mula (SD)</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Nama Cabang Kegiatan / Lomba *</label>
            <input type="text" id="scoreBranchName" placeholder="Contoh: Pertolongan Pertama (PP)..." required>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label">Nilai Evaluasi (0 - 100) *</label>
              <input type="number" step="0.1" id="scoreVal" min="0" max="100" placeholder="95.5" required>
            </div>
            <div class="form-group">
              <label class="form-label">Nama Juri / Evaluator *</label>
              <input type="text" id="scoreJudgeName" value="Tim Juri KSR PMI" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Catatan Evaluator</label>
            <textarea id="scoreNotes" rows="2" placeholder="Catatan kelebihan dan perbaikan..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('scoreModal')">Batal</button>
          <button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> Simpan Penilaian</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: Kelola Aspek Penilaian Kegiatan -->
  <div class="modal" id="manageAspectsModal">
    <div class="modal-dialog" style="max-width: 750px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title"><i class="fa-solid fa-list-check" style="color: var(--primary-color);"></i> Pengaturan Aspek Penilaian Kegiatan</h3>
        <button class="modal-close" onclick="App.closeModal('manageAspectsModal')">&times;</button>
      </div>
      <div class="modal-body" style="padding: 1.25rem;">
        <div class="form-group" style="margin-bottom: 1.2rem;">
          <label class="form-label" style="font-weight: 700;">Pilih Kegiatan / Lomba *</label>
          <select id="manageAspectEventSelect" class="form-control" onchange="App.loadAspectsForEvent(this.value)">
            <option value="">-- Pilih Kegiatan --</option>
          </select>
        </div>

        <div id="manageAspectsFormSection" style="display: none;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h5 style="font-weight: 700; margin: 0; font-size: 0.95rem;">Daftar Aspek / Kriteria Penilaian:</h5>
            <button type="button" class="btn btn-outline btn-sm" onclick="App.addAspectRow()"><i class="fa-solid fa-plus"></i> Tambah Kriteria Manual</button>
          </div>

          <div id="aspectRowsContainer" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <!-- Rows injected by JS -->
          </div>

          <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-surface-alt, #f8fafc); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-color);">Total Nilai Maksimal:</span>
            <span id="aspectsTotalMaxBadge" class="badge badge-success" style="font-size: 0.95rem; font-weight: 700; padding: 0.4rem 0.8rem;">100 Poin</span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('manageAspectsModal')">Batal</button>
        <button type="button" class="btn btn-primary btn-sm" onclick="App.saveAspectsForSelectedEvent()"><i class="fa-solid fa-floppy-disk"></i> Simpan Aspek Penilaian</button>
      </div>
    </div>
  </div>

  <!-- Modal: Entry Penilaian Kegiatan Berdasarkan Aspek & Scan QR -->
  <div class="modal" id="eventScoringModal">
    <div class="modal-dialog" style="max-width: 850px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title"><i class="fa-solid fa-clipboard-check" style="color: #16a34a;"></i> Penilaian Kegiatan & Scan QR Target</h3>
        <button class="modal-close" onclick="App.closeModal('eventScoringModal')">&times;</button>
      </div>
      <form onsubmit="App.handleSaveAspectScoring(event)">
        <div class="modal-body" style="padding: 1.25rem;">
          
          <!-- STEP 1: PILIH KEGIATAN -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 260px;">
                <label class="form-label" style="font-weight: 700;">1. Pilih Kegiatan / Sub-Kegiatan *</label>
                <select id="scoringEventSelect" class="form-control" onchange="App.onScoringEventChanged(this.value)" required>
                  <option value="">-- Pilih Kegiatan --</option>
                </select>
              </div>
              <div style="margin-top: 1.5rem;">
                <button type="button" class="btn btn-outline btn-sm" onclick="App.openManageAspectsModal(document.getElementById('scoringEventSelect').value)">
                  <i class="fa-solid fa-sliders"></i> Kelola Aspek Penilaian
                </button>
              </div>
            </div>
          </div>

          <!-- STEP 2: TIPE TARGET & SCAN QR -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
            <label class="form-label" style="font-weight: 700; margin-bottom: 0.5rem;">2. Sasaran Penilaian & Scan QR *</label>
            
            <div style="display: flex; gap: 1rem; margin-bottom: 0.75rem; align-items: center;">
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.88rem; font-weight: 600;">
                <input type="radio" name="scoringTargetType" value="peserta" checked onchange="App.onScoringTargetTypeChanged()">
                <i class="fa-solid fa-user-graduate" style="color: #0284c7;"></i> Perorangan / Peserta
              </label>
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.88rem; font-weight: 600;">
                <input type="radio" name="scoringTargetType" value="kontingen" onchange="App.onScoringTargetTypeChanged()">
                <i class="fa-solid fa-school-flag" style="color: #ea580c;"></i> Kontingen / Unit Sekolah
              </label>
            </div>

            <!-- Area Scan QR / Search Input -->
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <input type="text" id="scoringTargetSearchInput" class="form-control" style="flex: 1; min-width: 220px;" placeholder="Cari Kode ID / NIK / Nama Peserta atau Kontingen..." onkeyup="App.searchScoringTarget(event)">
              <button type="button" class="btn btn-primary btn-sm" onclick="App.searchScoringTargetManual()"><i class="fa-solid fa-magnifying-glass"></i> Cari</button>
              <button type="button" class="btn btn-outline btn-sm" style="border-color: #0284c7; color: #0284c7;" onclick="App.toggleScoringCameraQR()"><i class="fa-solid fa-camera"></i> Scan Camera QR</button>
            </div>

            <!-- Video QR Container -->
            <div id="scoringCameraQRContainer" style="display: none; margin-top: 0.75rem; text-align: center;">
              <div id="scoringQrVideoReader" style="width: 100%; max-width: 360px; margin: 0 auto; border-radius: 8px; overflow: hidden; border: 2px solid #0284c7;"></div>
              <button type="button" class="btn btn-outline btn-sm" style="margin-top: 0.4rem; color: #dc2626;" onclick="App.stopScoringCameraQR()"><i class="fa-solid fa-circle-xmark"></i> Tutup Kamera</button>
            </div>

            <!-- Target Search Result Dropdown List -->
            <div id="scoringTargetSearchResults" style="display: none; margin-top: 0.5rem; max-height: 180px; overflow-y: auto; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;"></div>

            <!-- Selected Target Profile Card -->
            <div id="scoringSelectedTargetCard" style="display: none; margin-top: 0.75rem; padding: 0.85rem; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px;">
              <!-- Target info injected by JS -->
            </div>
          </div>

          <!-- STEP 3: DYNAMIC ASPECT SCORING INPUTS -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <label class="form-label" style="font-weight: 700; margin: 0;">3. Input Nilai Berdasarkan Aspek Penilaian *</label>
              <span id="scoringAspectsLiveTotalBadge" class="badge badge-info" style="font-size: 0.9rem; font-weight: 700;">Total: 0 Poin</span>
            </div>

            <div id="scoringAspectsContainer">
              <p style="color: var(--text-muted); font-size: 0.85rem;">Pilih kegiatan terlebih dahulu untuk memuat aspek penilaian.</p>
            </div>

            <!-- Final Grade Preview Badge -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed #e2e8f0;">
              <span style="font-size: 0.85rem; font-weight: 600;">Predikat / Medali Terkalkulasi:</span>
              <span id="scoringGradeBadgePreview" class="badge" style="background: #e2e8f0; color: #334155; font-size: 0.9rem; font-weight: 700; padding: 0.4rem 0.8rem;">Peserta</span>
            </div>
          </div>

          <!-- STEP 4: NAMA JURI & CATATAN -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div class="form-group">
              <label class="form-label" style="font-size: 0.82rem; font-weight: 700;">Nama Juri / Evaluator *</label>
              <input type="text" id="scoringJudgeNameInput" class="form-control" style="font-size: 0.85rem;" required>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size: 0.82rem;">Catatan Penilaian (Opsional)</label>
              <input type="text" id="scoringNotesInput" class="form-control" style="font-size: 0.85rem;" placeholder="Kelebihan / Masukan perbaikan...">
            </div>
          </div>

        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('eventScoringModal')">Batal</button>
          <button type="submit" class="btn btn-primary btn-sm" style="background: #16a34a; border-color: #16a34a;"><i class="fa-solid fa-circle-check"></i> Simpan Penilaian Kegiatan</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal 6: Kelola Unit Sekolah (Tambah / Edit) -->
  <div class="modal" id="unitModal">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title" id="unitModalTitle"><i class="fa-solid fa-school"></i> Kelola Unit Sekolah Kontingen</h3>
        <button class="modal-close" onclick="App.closeModal('unitModal')">&times;</button>
      </div>
      <form onsubmit="App.handleSaveUnit(event)">
        <input type="hidden" id="unitEditId" value="">
        <div class="modal-body">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Nama Unit Sekolah / Kontingen *</label>
            <input type="text" id="unitNameInput" placeholder="Contoh: SMAN 1 Kabupaten PMI..." required>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label">Tingkat PMR *</label>
              <select id="unitLevelInput" required>
                <option value="Wira (SMA)">Wira (SMA / SMK / MA)</option>
                <option value="Madya (SMP)">Madya (SMP / MTs)</option>
                <option value="Mula (SD)">Mula (SD / MI)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Nama Pembina PMR *</label>
              <input type="text" id="unitPembinaInput" placeholder="Nama Pembina..." required>
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">No. Telepon / WhatsApp Pembina</label>
            <input type="text" id="unitPhoneInput" placeholder="0812xxxxxxxx">
          </div>
          <div class="form-group">
            <label class="form-label">Alamat Sekolah</label>
            <textarea id="unitAddressInput" rows="2" placeholder="Alamat lengkap unit sekolah..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('unitModal')">Batal</button>
          <button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> Simpan Unit Sekolah</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal 7: Daftar Peserta Terdaftar Kegiatan -->
  <div class="modal" id="registeredParticipantsModal">
    <div class="modal-dialog" style="max-width: 880px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title" id="registeredModalTitle"><i class="fa-solid fa-users"></i> Daftar Peserta Terdaftar Kegiatan</h3>
        <button class="modal-close" onclick="App.closeModal('registeredParticipantsModal')">&times;</button>
      </div>
      <div class="modal-body" style="padding: 1.25rem;">
        <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem; align-items: center; flex-wrap: wrap;">
          <input type="text" id="registeredSearchInput" placeholder="🔍 Cari nama peserta, kode JMB, atau unit sekolah..." style="flex: 1; min-width: 220px;" onkeyup="App.filterRegisteredParticipantsList()">
          <select id="registeredStatusFilter" style="width: 210px; max-width: 100%;" onchange="App.filterRegisteredParticipantsList()">
            <option value="all">Semua Status Presensi</option>
            <option value="masuk">🟢 Sudah Masuk (Check-In)</option>
            <option value="keluar">🔴 Sudah Keluar (Check-Out)</option>
            <option value="belum">⚪ Belum Presensi</option>
          </select>
        </div>
        <div id="registeredParticipantsListContent">
          <p style="text-align: center; color: var(--text-muted);">Memuat daftar peserta terdaftar...</p>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('registeredParticipantsModal')">Tutup</button>
      </div>
    </div>
  </div>

  <!-- Modal: Rekapitulasi Peserta Berdasarkan Unit Sekolah -->
  <div class="modal" id="unitBreakdownModal">
    <div class="modal-dialog" style="max-width: 900px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title" id="unitBreakdownModalTitle"><i class="fa-solid fa-school-flag"></i> Rekap Pendaftaran Peserta Berdasarkan Unit PMR</h3>
        <button class="modal-close" onclick="App.closeModal('unitBreakdownModal')">&times;</button>
      </div>
      <div class="modal-body" style="padding: 1.25rem;">
        <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem; align-items: center; flex-wrap: wrap;">
          <input type="text" id="unitBreakdownSearchInput" placeholder="🔍 Cari nama sekolah / unit PMR..." style="flex: 1; min-width: 220px;" onkeyup="App.filterUnitBreakdownList()">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.openUnitBreakdownModal()"><i class="fa-solid fa-arrows-rotate"></i> Refresh Data</button>
        </div>
        <div id="unitBreakdownContent">
          <p style="text-align: center; color: var(--text-muted);">Memuat rekapitulasi peserta per unit...</p>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('unitBreakdownModal')">Tutup</button>
      </div>
    </div>
  </div>

  <!-- Modal 8: Kelola Pendaftaran Peserta Unit ke Kegiatan -->
  <div class="modal" id="unitEventRegistrationModal">
    <div class="modal-dialog" style="max-width: 720px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title" id="unitEventRegModalTitle"><i class="fa-solid fa-user-check"></i> Pendaftaran Peserta Unit ke Kegiatan</h3>
        <button class="modal-close" onclick="App.closeModal('unitEventRegistrationModal')">&times;</button>
      </div>
      <form onsubmit="App.handleSaveUnitEventRegistration(event)">
        <input type="hidden" id="unitEventRegEventId" value="">
        <div class="modal-body" style="padding: 1.25rem;">
          <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1rem;">
            Pilih/centang peserta terverifikasi dari kontingen sekolah Anda yang didaftarkan untuk ikutserta pada kegiatan ini:
          </p>
          <div id="unitEventRegParticipantsList" style="max-height: 380px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.75rem;">
            <p style="text-align: center; color: var(--text-muted);">Memuat daftar peserta unit...</p>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('unitEventRegistrationModal')">Batal</button>
          <button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> Simpan Pendaftaran Peserta</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal 9: Kelola / Tambah Agenda Kegiatan Jumbara & Kuota Unit -->
  <div class="modal" id="eventModal">
    <div class="modal-dialog" style="max-width: 650px;">
      <div class="modal-header">
        <h3 class="modal-title" id="eventModalTitle"><i class="fa-solid fa-calendar-plus"></i> Tambah / Edit Agenda Kegiatan & Kuota Unit</h3>
        <button class="modal-close" onclick="App.closeModal('eventModal')">&times;</button>
      </div>
      <form onsubmit="App.handleSaveEvent(event)">
        <input type="hidden" id="eventIdInput" value="">
        <div class="modal-body" style="padding: 1.25rem;">
          <div class="form-group" style="margin-bottom: 0.9rem;">
            <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Nama / Judul Kegiatan *</label>
            <input type="text" id="eventTitleInput" required placeholder="Contoh: Lomba Pertolongan Pertama (PP) Wira" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.9rem;">
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Kategori Tri Bakti</label>
              <select id="eventCategorySelect" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
                <option value="Umum">Umum</option>
                <option value="Jumpa">Jumpa (Kompetisi/Lomba)</option>
                <option value="Bakti">Bakti (Pengabdian Masyarakat)</option>
                <option value="Gembira">Gembira (Persahabatan/Seni)</option>
              </select>
            </div>
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Tingkat Peserta PMR</label>
              <select id="eventLevelSelect" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
                <option value="Semua">Semua Tingkat</option>
                <option value="Mula">PMR Mula (SD)</option>
                <option value="Madya">PMR Madya (SMP)</option>
                <option value="Wira">PMR Wira (SMA/SMK)</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0.9rem; background: #fffbebf5; border: 1px solid #fde68a; border-radius: 6px; padding: 0.75rem;">
            <label style="font-weight: 800; font-size: 0.88rem; color: #92400e; display: flex; align-items: center; gap: 0.4rem;">
              <i class="fa-solid fa-users-slash" style="color: #d97706;"></i> Batas Kuota Peserta per Unit Sekolah
            </label>
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.35rem;">
              <input type="number" id="eventQuotaInput" min="0" value="0" style="width: 120px; font-weight: 700; padding: 0.45rem 0.65rem; border: 1px solid #f59e0b; border-radius: 4px;">
              <span style="font-size: 0.82rem; color: #78350f;">
                <strong>0 = Tidak Ada Batasan (Unlimited)</strong>. Isi angka (misal: <strong>2</strong>) untuk membatasi maks 2 peserta per sekolah.
              </span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.9rem;">
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Lokasi Kegiatan</label>
              <input type="text" id="eventLocationInput" placeholder="e.g. Hall A Gedung Serbaguna" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Tanggal Kegiatan</label>
              <input type="date" id="eventDateInput" required style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 0.9rem;">
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Jam Mulai (WIB)</label>
              <input type="time" id="eventStartTimeInput" required value="08:00" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Jam Selesai (WIB)</label>
              <input type="time" id="eventEndTimeInput" required value="12:00" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">PIC / Penanggung Jawab</label>
              <input type="text" id="eventPicInput" placeholder="Nama Koordinator" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0.5rem;">
            <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Deskripsi & Ketentuan Kegiatan</label>
            <textarea id="eventDescriptionInput" rows="2" placeholder="Ketentuan umum perlombaan/kegiatan..." style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('eventModal')">Batal</button>
          <button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> Simpan Agenda & Kuota</button>
        </div>
      </form>
    </div>
  </div>
  <!-- Modal 10: Admin Edit Data & Berkas Peserta -->
  <div class="modal" id="adminEditParticipantModal">
    <div class="modal-dialog" style="max-width: 680px;">
      <div class="modal-header">
        <h3 class="modal-title" id="adminEditModalTitle"><i class="fa-solid fa-user-pen"></i> Edit Data & Berkas Peserta (Admin)</h3>
        <button class="modal-close" onclick="App.closeModal('adminEditParticipantModal')">&times;</button>
      </div>
      <form onsubmit="App.handleSaveAdminParticipantEdit(event)">
        <input type="hidden" id="adminEditParticipantId" value="">
        <div class="modal-body" style="padding: 1.25rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.85rem;">
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Nama Lengkap *</label>
              <input type="text" id="adminEditFullName" required style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">NISN / NIK Identitas</label>
              <input type="text" id="adminEditNisn" placeholder="Nomor NISN atau NIK" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 0.85rem;">
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Kategori Registrasi</label>
              <select id="adminEditRegistrationType" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
                <option value="Peserta">Peserta PMR</option>
                <option value="Panitia">Panitia</option>
                <option value="Peninjau">Peninjau</option>
                <option value="Tamu Undangan">Tamu Undangan</option>
                <option value="Media">Media / Pers</option>
              </select>
            </div>
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Tingkat PMR / Jabatan</label>
              <select id="adminEditLevel" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
                <option value="Mula">Mula (SD)</option>
                <option value="Madya">Madya (SMP)</option>
                <option value="Wira">Wira (SMA/SMK)</option>
                <option value="Panitia">Panitia</option>
                <option value="Peninjau">Peninjau</option>
                <option value="Tamu Undangan">Tamu Undangan</option>
                <option value="Media">Media</option>
              </select>
            </div>
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Status Verifikasi</label>
              <select id="adminEditStatus" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
                <option value="pending_unit">Pending Unit</option>
                <option value="verified_unit">Disetujui Unit (Pending Kab)</option>
                <option value="verified_kabupaten">🟢 Verified Kabupaten</option>
                <option value="revision">🟡 Minta Perbaikan / Revisi</option>
                <option value="rejected">🔴 Ditolak</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 0.85rem;">
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Jenis Kelamin</label>
              <select id="adminEditGender" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
                <option value="L">Laki-Laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Gol. Darah</label>
              <select id="adminEditBloodType" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
                <option value="-">-</option>
              </select>
            </div>
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">No. WhatsApp HP</label>
              <input type="text" id="adminEditPhone" placeholder="08xxx" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Pembina / Ortu</label>
              <input type="text" id="adminEditEmergencyContact" placeholder="Kontak Pembina" style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1rem; padding-top: 0.85rem; border-top: 1px dashed var(--border-color);">
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Ganti Pas Foto Baru (Opsional)</label>
              <input type="file" id="adminEditPhotoFile" accept="image/*" style="width: 100%; font-size: 0.8rem;">
            </div>
            <div>
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--secondary);">Ganti Surat Tugas Baru (Opsional)</label>
              <input type="file" id="adminEditAssignmentFile" accept=".pdf,image/*" style="width: 100%; font-size: 0.8rem;">
            </div>
          </div>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <button type="button" class="btn btn-danger btn-sm" style="background: #dc2626; border-color: #dc2626; color: white; font-weight: 700;" onclick="event.preventDefault(); event.stopPropagation(); App.handleDeleteFromEditModal(event)"><i class="fa-solid fa-trash-can"></i> Hapus Peserta</button>
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('adminEditParticipantModal')">Batal</button>
            <button type="submit" id="adminEditSubmitBtn" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan Data</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- PAPAN INFORMASI PESERTA PER UNSUR (FULLSCREEN DASHBOARD) -->
  <div class="modal modal-fullscreen" id="papanInformasiUnsurModal" style="display: none;">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title" style="color: white; font-size: 1.15rem; font-weight: 800; margin: 0;">
          <i class="fa-solid fa-chart-column" style="color: #ef4444; margin-right: 0.5rem;"></i> PAPAN INFORMASI REKAPITULASI PESERTA PER KONTINGEN & UNSUR
        </h3>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <button class="btn btn-sm btn-outline-light" style="border: 1px solid #64748b; color: #f8fafc; background: transparent; padding: 6px 12px; font-weight: 700; border-radius: 4px; cursor: pointer;" onclick="App.toggleNativeFullscreen('papanInformasiUnsurModal')">
            <i class="fa-solid fa-expand"></i> Real Fullscreen
          </button>
          <button class="btn btn-sm btn-danger" style="background: #dc2626; color: white; border: none; font-weight: 800; padding: 6px 16px; border-radius: 4px; cursor: pointer;" onclick="App.closePapanInformasiUnsurModal()">
            <i class="fa-solid fa-xmark"></i> Keluar Fullscreen (Esc)
          </button>
        </div>
      </div>
      <div class="modal-body">
        <div id="papanInformasiUnsurModalContainer">
          <p style="text-align: center; padding: 3rem; color: #94a3b8; font-size: 1rem;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br><br>Memuat data papan informasi unsur...</p>
        </div>
      </div>
    </div>
  </div>

  <!-- JavaScript Scripts -->
  <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js" crossorigin="anonymous"></script>
  <?php
    $jsIconsVer = file_exists(__DIR__ . '/../frontend/js/icons.js') ? filemtime(__DIR__ . '/../frontend/js/icons.js') : '2.0.0';
    $jsApiVer = file_exists(__DIR__ . '/../frontend/js/api.js') ? filemtime(__DIR__ . '/../frontend/js/api.js') : '2.0.0';
    $jsUtilsVer = file_exists(__DIR__ . '/../frontend/js/utils.js') ? filemtime(__DIR__ . '/../frontend/js/utils.js') : '2.0.0';
    $jsAppVer = file_exists(__DIR__ . '/../frontend/js/app.js') ? filemtime(__DIR__ . '/../frontend/js/app.js') : '2.0.0';
  ?>
  <script src="<?php echo $baseUrl; ?>frontend/js/icons.js?v=<?php echo $jsIconsVer; ?>"></script>
  <script src="<?php echo $baseUrl; ?>frontend/js/api.js?v=<?php echo $jsApiVer; ?>"></script>
  <script src="<?php echo $baseUrl; ?>frontend/js/utils.js?v=<?php echo $jsUtilsVer; ?>"></script>
  <script src="<?php echo $baseUrl; ?>frontend/js/app.js?v=<?php echo $jsAppVer; ?>"></script>
</body>
</html>
