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
        <p id="footerAbout"><?php echo htmlspecialchars($settings['footer_about'] ?? 'Ajang evaluasi dan pembinaan generasi muda Palang Merah Remaja (Mula, Madya, Wira) dalam mewujudkan Tri Bakti PMR.'); ?></p>
      </div>

      <div class="footer-col">
        <h4>Link Cepat</h4>
        <ul id="footerQuickLinks">
          <li><a href="#beranda" onclick="App.scrollToSection('beranda', event)">Beranda & Jumbotron</a></li>
          <li><a href="#kegiatan" onclick="App.scrollToSection('kegiatan', event)">Jadwal & Rundown</a></li>
          <li><a href="#materi" onclick="App.scrollToSection('materi', event)">Unduh Materi & Juklak</a></li>
          <li><a href="#pengumuman" onclick="App.scrollToSection('pengumuman', event)">Papan Pengumuman</a></li>
          <li><a href="#klasemen" onclick="App.scrollToSection('klasemen', event)">Perolehan Medali</a></li>
          <li><a href="#lokasi" onclick="App.scrollToSection('lokasi', event)">Peta & Lokasi Buperta</a></li>
          <li><a href="javascript:void(0)" onclick="App.openFeedbackModal()"><i class="fa-solid fa-comment-dots"></i> Kotak Saran & Aspirasi</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Sekretariat PMI</h4>
        <p><i class="fa-solid fa-location-dot"></i> <span id="footerAddress"><?php echo htmlspecialchars($settings['contact_address'] ?? 'Jl. Palang Merah No. 1, Markas PMI Kabupaten'); ?></span></p>
        <p><i class="fa-solid fa-phone"></i> <span id="footerPhone"><?php echo htmlspecialchars($settings['contact_phone'] ?? '(021) 555-PMR-2026'); ?></span></p>
        <p><i class="fa-solid fa-envelope"></i> <span id="footerEmail"><?php echo htmlspecialchars($settings['contact_email'] ?? 'sekretariat@jumbara-pmi.or.id'); ?></span></p>
        <?php if (!empty($settings['contact_hours'])): ?>
          <p><i class="fa-solid fa-clock"></i> <span id="footerHours"><?php echo htmlspecialchars($settings['contact_hours']); ?></span></p>
        <?php endif; ?>
        <p style="margin-top: 0.5rem;">
          <a href="<?php echo htmlspecialchars($settings['event_map_url'] ?? 'https://maps.google.com/?q=Markas+PMI+Kabupaten+Pemalang'); ?>" target="_blank" rel="noopener noreferrer" style="color: #ef4444; font-size: 0.82rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem; text-decoration: none;">
            <i class="fa-solid fa-map-location-dot"></i> Buka Google Maps &rarr;
          </a>
        </p>
        <div id="footerAccountBox" style="margin-top: 0.85rem;"></div>
      </div>
    </div>
    <div class="footer-bottom">
      <p id="footerCopyright"><?php echo htmlspecialchars($settings['footer_copyright'] ?? '© 2026 Palang Merah Indonesia Kabupaten. Structured Native PHP & MySQL Application.'); ?></p>
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
    <button class="mobile-nav-btn" id="mbNavMateri" onclick="App.handleMobileNav('materi')">
      <i class="fa-solid fa-book-bookmark"></i>
      <span>Materi</span>
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
    <div class="modal-dialog login-dialog">
      <div class="login-brand-header">
        <button type="button" class="modal-close" onclick="App.closeModal('loginModal')" aria-label="Tutup Modal">&times;</button>
        <div class="login-brand-logos">
          <!-- Logo PMI -->
          <img src="<?php echo htmlspecialchars($logoUrl); ?>" alt="Logo PMI" class="login-logo-img login-logo-pmi" title="Palang Merah Indonesia">
          <div class="login-logo-divider"></div>
          <!-- Logo Jumbara -->
          <img src="<?php echo htmlspecialchars($eventLogoUrl); ?>" alt="Logo Kegiatan Jumbara" class="login-logo-img login-logo-jumbara" title="Logo Kegiatan Jumbara">
        </div>
        <h3 class="login-brand-title">Login Portal JUMBARA</h3>
        <p class="login-brand-subtitle">Palang Merah Remaja PMI Kabupaten</p>
      </div>

      <form onsubmit="App.handleLogin(event)">
        <div class="modal-body" style="padding: 1.5rem 1.75rem 1.25rem 1.75rem;">
          <!-- Dedicated inline notification alert box for login errors -->
          <div id="loginAlertBox" style="display: none; margin-bottom: 1.15rem; padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600; align-items: center; gap: 0.6rem; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; line-height: 1.4;"></div>
          <div class="form-group" style="margin-bottom: 1.15rem;">
            <label class="form-label" style="font-weight: 600; margin-bottom: 0.4rem; display: block;">Username atau ID Pengguna *</label>
            <div class="input-icon-wrapper">
              <i class="fa-solid fa-user input-icon"></i>
              <input type="text" id="loginUsername" placeholder="Masukkan username Anda..." required autocomplete="username">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" style="font-weight: 600; margin-bottom: 0.4rem; display: block;">Password *</label>
            <div class="input-icon-wrapper">
              <i class="fa-solid fa-lock input-icon"></i>
              <input type="password" id="loginPassword" class="has-icon-right" placeholder="Masukkan kata sandi..." required autocomplete="current-password">
              <button type="button" class="input-icon-right" onclick="(function(){ const p = document.getElementById('loginPassword'); const icon = document.getElementById('loginPassEye'); if (p.type === 'password') { p.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); } else { p.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); } })()" title="Tampilkan/Sembunyikan Password" aria-label="Toggle password visibility">
                <i class="fa-solid fa-eye" id="loginPassEye"></i>
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary login-btn-submit">
            <i class="fa-solid fa-right-to-bracket"></i> Masuk Sekarang
          </button>

          <div class="login-helper-links">
            <span style="color: #64748b;">Belum daftar peserta?</span>
            <a href="javascript:void(0)" onclick="App.closeModal('loginModal'); App.openRegisterModal();">
              <i class="fa-solid fa-user-plus"></i> Daftar Mandiri
            </a>
          </div>

          <div class="login-footer-security">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Portal Resmi Terverifikasi • Palang Merah Indonesia</span>
          </div>
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
          <!-- KOP SURAT RESMI (LANGSUNG DITAMPILKAN TANPA CARD) -->
          <?php if (!empty($settings['app_kop'])): ?>
            <div style="text-align: center; margin-bottom: 1rem;">
              <img src="<?php echo htmlspecialchars($settings['app_kop']); ?>" alt="Kop Surat Resmi PMI" style="max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 4px;">
            </div>
          <?php else: ?>
            <div style="text-align: center; padding: 0.25rem 0 0.85rem 0; margin-bottom: 1rem;">
              <div style="display: inline-flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.4rem;">
                <img src="<?php echo htmlspecialchars($logoUrl); ?>" alt="Logo PMI" style="height: 48px; max-height: 48px; width: auto; object-fit: contain;">
                <?php if (!empty($eventLogoUrl)): ?>
                  <div style="width: 1.5px; height: 32px; background: #cbd5e1;"></div>
                  <img src="<?php echo htmlspecialchars($eventLogoUrl); ?>" alt="Logo Jumbara" style="height: 48px; max-height: 48px; width: auto; object-fit: contain;">
                <?php endif; ?>
              </div>
              <div style="font-size: 0.78rem; font-weight: 800; color: #dc2626; letter-spacing: 0.5px; text-transform: uppercase;">
                <?php echo htmlspecialchars(!empty($settings['organizer_name']) ? $settings['organizer_name'] : 'PMI KABUPATEN PEMALANG'); ?>
              </div>
            </div>
          <?php endif; ?>

          <h4 style="color: var(--secondary); margin-bottom: 0.8rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.4rem;">
            1. Pilihan Kontingen Unit & Tingkat PMR
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label">Kontingen / Unit *</label>
              <select id="regUnitId" required>
                <option value="">-- Pilih Kontingen / Unit --</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Unsur / Tingkat *</label>
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
              <label class="form-label">Alamat Email Aktif * <small style="color: var(--primary); font-weight: normal;">(Kirim User & Password)</small></label>
              <input type="email" id="regEmail" placeholder="contoh@email.com" required>
            </div>
            <div class="form-group">
              <label class="form-label">No. Telepon / WhatsApp * <small style="color: #059669; font-weight: normal;">(Notifikasi WA)</small></label>
              <input type="text" id="regPhone" placeholder="0812xxxxxxx" required>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Kontak Darurat (Nama & No. HP Orangtua/Wali) *</label>
            <input type="text" id="regEmergency" placeholder="Nama & No. HP Orangtua/Wali" required>
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
    <div class="modal-dialog modal-audit-dialog">
      <div class="modal-header" style="background: #ffffff; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
        <h3 class="modal-title" style="color: var(--secondary); display: flex; align-items: center; gap: 0.6rem; font-weight: 800; font-size: 1.15rem; margin: 0;">
          <i class="fa-solid fa-clipboard-check" style="color: var(--primary);"></i> Audit & Verifikasi Berkas Lengkap Peserta
        </h3>
        <button type="button" class="modal-close" onclick="App.closeModal('auditModal')" aria-label="Tutup Modal">&times;</button>
      </div>
      <div class="modal-body" id="auditModalBody" style="padding: 1.25rem 1.5rem;">
        <p style="text-align: center; color: var(--text-muted); padding: 3rem 0;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br><br>Memuat data audit peserta...</p>
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
    <div class="modal-dialog" style="max-width: 520px;">
      <div class="modal-header">
        <h3 class="modal-title"><i class="fa-solid fa-id-card"></i> Pratinjau Kartu Peserta JUMBARA</h3>
        <button class="modal-close" onclick="App.closeModal('idCardModal')">&times;</button>
      </div>
      
      <!-- Toolbar Pilihan Ukuran & Format Cetak ID Card -->
      <div class="no-print" style="background: #ffffff; padding: 0.85rem 1.25rem; border-bottom: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <label for="modalIdCardSizeSelect" style="font-weight: 700; font-size: 0.82rem; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-ruler-combined" style="color: var(--primary);"></i> Pilihan Ukuran Cetak:
          </label>
          <span class="badge" id="modalIdCardSizeBadge" style="font-size: 0.72rem; font-weight: 700; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 2px 8px; border-radius: 6px;">
            54 × 86 mm (Ukuran Kartu ATM/KTP)
          </span>
        </div>
        <select id="modalIdCardSizeSelect" class="form-control" style="font-size: 0.85rem; font-weight: 600; padding: 0.45rem 0.75rem; border-color: #cbd5e1;" onchange="App.changeModalIDCardSize(this.value)">
          <option value="atm_single" selected>💳 Seukuran Kartu ATM / KTP / CR80 (54 x 86 mm) - Pas di Dompet / PVC</option>
          <option value="a4_atm">📄 Kertas A4 - Seukuran Kartu ATM (54 x 86 mm dengan Garis Potong)</option>
          <option value="f4_atm">📑 Kertas F4 / Folio - Seukuran Kartu ATM (54 x 86 mm dengan Garis Potong)</option>
          <option value="a4_standard">🪪 Kertas A4 - Ukuran Standar Badge Panitia Besar (70 x 100 mm / B2)</option>
        </select>
        <div id="modalIdCardSizeHelp" style="font-size: 0.73rem; color: #64748b; margin-top: 5px; line-height: 1.35;">
          <i class="fa-solid fa-circle-info" style="color: #0284c7;"></i> Format kartu fisik standar ATM (CR80) berukuran 54 × 86 mm. Pas dimasukkan ke dompet, card holder standar ATM, atau dicetak langsung ke printer kartu PVC.
        </div>
      </div>

      <div class="modal-body" id="idCardModalContent" style="background: #f8fafc; padding: 1.25rem; text-align: center; min-height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <!-- ID Card dynamically rendered -->
      </div>
      <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
        <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('idCardModal')">Tutup</button>
        <button type="button" class="btn btn-primary btn-sm" onclick="App.printSingleIDCard()"><i class="fa-solid fa-print"></i> Cetak ID Card (PDF)</button>
      </div>
    </div>
  </div>

  <!-- Modal 4.5: QR Code Presensi Besar Fokus Scanner Lapangan -->
  <div class="modal" id="largeQrModal">
    <div class="modal-dialog" style="max-width: 440px; margin: 1.5rem auto;">
      <div class="modal-content" style="border-radius: 24px; overflow: hidden; border: none; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
        <div class="modal-header" style="background: linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #0284c7 100%); color: #ffffff; padding: 1rem 1.25rem; border: none;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-qrcode" style="color: #38bdf8; font-size: 1.25rem;"></i>
            <div>
              <h3 class="modal-title" style="color: #ffffff; font-size: 0.95rem; font-weight: 800; margin: 0;">E-Presensi QR Code Resmi</h3>
              <p style="margin: 0; font-size: 0.68rem; color: #94a3b8; margin-top: 2px;">JUMBARA PMR PMI KABUPATEN</p>
            </div>
          </div>
          <button class="modal-close" onclick="App.closeModal('largeQrModal')" style="color: #ffffff; opacity: 0.85;">&times;</button>
        </div>
        <div class="modal-body" id="largeQrModalBody" style="background: #ffffff; padding: 1.5rem 1.25rem; text-align: center;"></div>
        <div class="modal-footer" style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 0.85rem 1.25rem; display: flex; justify-content: space-between; align-items: center;">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('largeQrModal')" style="border-radius: 12px; font-weight: 700;">
            <i class="fa-solid fa-xmark"></i> Tutup
          </button>
          <button type="button" id="largeQrDownloadBtn" class="btn btn-primary btn-sm" style="border-radius: 12px; font-weight: 800;">
            <i class="fa-solid fa-download"></i> Unduh Gambar QR
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal 4.6: Menu Lainnya Bottom Sheet (Style Mobile JKN) -->
  <div class="modal" id="menuLainnyaModal">
    <div class="modal-dialog" style="max-width: 440px; margin: 1.5rem auto;">
      <div class="modal-content" style="border-radius: 24px; overflow: hidden; border: none; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
        <div class="modal-header" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #e11d48 100%); color: #ffffff; padding: 1rem 1.25rem; border: none;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-table-cells-large" style="color: #ffffff; font-size: 1.15rem;"></i>
            <div>
              <h3 class="modal-title" style="color: #ffffff; font-size: 0.95rem; font-weight: 800; margin: 0;">Menu & Layanan Lainnya</h3>
              <p style="margin: 0; font-size: 0.68rem; color: #e2e8f0; margin-top: 2px;">PORTAL PESERTA JUMBARA PMR</p>
            </div>
          </div>
          <button class="modal-close" onclick="App.closeModal('menuLainnyaModal')" style="color: #ffffff; opacity: 0.85;">&times;</button>
        </div>
        <div class="modal-body" style="background: #ffffff; padding: 1.25rem;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem 0.5rem; text-align: center;">
            <div class="jkn-menu-item" onclick="App.closeModal('menuLainnyaModal'); App.downloadRegistrationFormPDF();">
              <div class="jkn-icon-circle jkn-circle-sky"><i class="fa-solid fa-file-pdf"></i></div>
              <span class="jkn-menu-label">Unduh PDF</span>
            </div>
            <div class="jkn-menu-item" onclick="App.closeModal('menuLainnyaModal'); App.switchPesertaMobileTab('lomba');">
              <div class="jkn-icon-circle jkn-circle-emerald"><i class="fa-solid fa-award"></i></div>
              <span class="jkn-menu-label">Cabang Lomba</span>
            </div>
            <div class="jkn-menu-item" onclick="App.closeModal('menuLainnyaModal'); App.switchPesertaMobileTab('medali');">
              <div class="jkn-icon-circle jkn-circle-gold"><i class="fa-solid fa-trophy"></i></div>
              <span class="jkn-menu-label">Klasemen</span>
            </div>
            <div class="jkn-menu-item" onclick="App.closeModal('menuLainnyaModal'); App.openChangePasswordModal();">
              <div class="jkn-icon-circle jkn-circle-violet"><i class="fa-solid fa-key"></i></div>
              <span class="jkn-menu-label">Ganti Password</span>
            </div>
            <div class="jkn-menu-item" onclick="App.closeModal('menuLainnyaModal'); App.openSaranModal();">
              <div class="jkn-icon-circle jkn-circle-teal"><i class="fa-solid fa-comments"></i></div>
              <span class="jkn-menu-label">Kotak Saran</span>
            </div>
            <div class="jkn-menu-item" onclick="App.closeModal('menuLainnyaModal'); App.handleLogout();">
              <div class="jkn-icon-circle jkn-circle-rose"><i class="fa-solid fa-right-from-bracket"></i></div>
              <span class="jkn-menu-label">Keluar Akun</span>
            </div>
          </div>
        </div>
        <div class="modal-footer" style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 0.75rem 1.25rem; text-align: center;">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('menuLainnyaModal')" style="width: 100%; border-radius: 12px; font-weight: 700;">Tutup</button>
        </div>
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



  <!-- Modal 6: Kelola Unit (Tambah / Edit) -->
  <div class="modal" id="unitModal">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title" id="unitModalTitle"><i class="fa-solid fa-school"></i> Kelola Unit</h3>
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
              <label class="form-label">Kategori / Tingkat Unit *</label>
              <select id="unitLevelInput" required>
                <optgroup label="Unit Sekolah (PMR)">
                  <option value="Mula (SD)">Mula (SD / MI)</option>
                  <option value="Madya (SMP)">Madya (SMP / MTs)</option>
                  <option value="Wira (SMA)">Wira (SMA / SMK / MA)</option>
                </optgroup>
                <optgroup label="Korps / Sukarela / Markas">
                  <option value="KSR">KSR (Korps Sukarela)</option>
                  <option value="TSR">TSR (Tenaga Sukarela)</option>
                  <option value="PMI Kab">PMI Kab (Markas PMI Kabupaten)</option>
                </optgroup>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Nama Pembina / Pimpinan *</label>
              <input type="text" id="unitPembinaInput" placeholder="Nama Pembina / Penanggung Jawab..." required>
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">No. Telepon / WhatsApp</label>
            <input type="text" id="unitPhoneInput" placeholder="0812xxxxxxxx">
          </div>
          <div class="form-group">
            <label class="form-label">Alamat Sekolah / Pangkalan / Markas</label>
            <textarea id="unitAddressInput" rows="2" placeholder="Alamat lengkap unit kontingen..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('unitModal')">Batal</button>
          <button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> Simpan Unit</button>
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

  <!-- Modal: Print / Export Roster Peserta per Unit -->
  <div class="modal" id="unitRosterPrintModal">
    <div class="modal-dialog" style="max-width: 1050px; width: 96%;">
      <div class="modal-header" style="background: linear-gradient(135deg, #1e293b, #0f172a); color: white;">
        <h3 class="modal-title" id="unitRosterPrintModalTitle" style="color: white;"><i class="fa-solid fa-file-invoice"></i> Roster Peserta Kontingen Unit</h3>
        <button class="modal-close" style="color: white;" onclick="App.closeModal('unitRosterPrintModal')">&times;</button>
      </div>
      <div class="modal-body" style="padding: 1.25rem; background: #f1f5f9; max-height: 80vh; overflow-y: auto;">
        <div id="unitRosterPrintPreviewArea" style="background: #ffffff; padding: 25px 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); color: #000000;">
          <p style="text-align: center; color: var(--text-muted); padding: 2rem 0;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat dokumen roster peserta...</p>
        </div>
      </div>
      <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; flex-wrap: wrap; gap: 0.5rem;">
        <span style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-solid fa-circle-info"></i> Format standar cetak dokumen A4 Landscape / Portrait PMI Kabupaten Pemalang</span>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('unitRosterPrintModal')">Tutup</button>
          <button type="button" class="btn btn-success btn-sm" id="btnDownloadUnitRosterExcel" style="background: #16a34a; border-color: #16a34a; color: white; font-weight: 700;"><i class="fa-solid fa-file-excel"></i> Download Excel</button>
          <button type="button" class="btn btn-danger btn-sm" id="btnDownloadUnitRosterPdf" style="background: #dc2626; border-color: #dc2626; color: white; font-weight: 700;"><i class="fa-solid fa-file-pdf"></i> Download PDF</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="App.printUnitRosterDocument()" style="font-weight: 700;"><i class="fa-solid fa-print"></i> Cetak / Print</button>
        </div>
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
    <div class="modal-dialog modal-edit-dialog">
      <div class="modal-header">
        <div>
          <h3 class="modal-title" id="adminEditModalTitle" style="display: flex; align-items: center; gap: 0.6rem; font-weight: 800; font-size: 1.15rem; margin: 0; color: var(--secondary);">
            <i class="fa-solid fa-user-pen" style="color: var(--primary);"></i> Edit Data Lengkap & Berkas Peserta
          </h3>
          <p style="margin: 0.25rem 0 0 0; font-size: 0.78rem; color: #64748b;">Perbarui informasi biodata, status verifikasi, data sekolah, dan unggah ulang berkas resmi.</p>
        </div>
        <button class="modal-close" onclick="App.closeModal('adminEditParticipantModal')" aria-label="Tutup Modal">&times;</button>
      </div>
      <form onsubmit="App.handleSaveAdminParticipantEdit(event)">
        <input type="hidden" id="adminEditParticipantId" value="">
        <div class="modal-body">
          
          <!-- SECTION 1: Kategori & Status Verifikasi -->
          <div class="edit-section-card" style="border-top: 3.5px solid var(--primary);">
            <div class="edit-section-header">
              <i class="fa-solid fa-sliders"></i> Kategori & Status Verifikasi
            </div>
            <div class="edit-grid-3">
              <div class="edit-form-field">
                <label class="edit-form-label"><i class="fa-solid fa-users-viewfinder"></i> Kategori Registrasi</label>
                <select id="adminEditRegistrationType" class="edit-form-select">
                  <option value="Peserta">Peserta PMR</option>
                  <option value="Pendamping">Pembina / Pendamping</option>
                  <option value="Panitia">Panitia</option>
                  <option value="Peninjau">Peninjau</option>
                  <option value="Tamu Undangan">Tamu Undangan</option>
                  <option value="Media">Media / Pers</option>
                </select>
              </div>
              <div class="edit-form-field">
                <label class="edit-form-label"><i class="fa-solid fa-layer-group"></i> Tingkat PMR / Jabatan</label>
                <select id="adminEditLevel" class="edit-form-select">
                  <option value="Mula">Mula (SD / MI)</option>
                  <option value="Madya">Madya (SMP / MTs)</option>
                  <option value="Wira">Wira (SMA / SMK / MA)</option>
                  <option value="Kepala Sekolah">Kepala Sekolah</option>
                  <option value="Pembina PMR">Pembina PMR</option>
                  <option value="Pendamping">Pendamping</option>
                  <option value="Anggota PMR">Anggota PMR</option>
                  <option value="Pengurus">Pengurus</option>
                  <option value="Pegawai">Pegawai</option>
                  <option value="Relawan">Relawan</option>
                  <option value="Panitia">Panitia</option>
                  <option value="Peninjau">Peninjau</option>
                  <option value="Tamu Undangan">Tamu Undangan</option>
                  <option value="Media">Media</option>
                </select>
              </div>
              <div class="edit-form-field">
                <label class="edit-form-label"><i class="fa-solid fa-certificate"></i> Status Verifikasi</label>
                <select id="adminEditStatus" class="edit-form-select" style="font-weight: 700;">
                  <option value="pending_unit">Pending Unit (Menunggu)</option>
                  <option value="verified_unit">Disetujui Unit (Pending Kab)</option>
                  <option value="verified_kabupaten">🟢 Verified Kabupaten</option>
                  <option value="revision">🟡 Minta Perbaikan / Revisi</option>
                  <option value="rejected">🔴 Ditolak</option>
                </select>
              </div>
            </div>
          </div>

          <!-- SECTION 2: Biodata & Identitas Utama -->
          <div class="edit-section-card">
            <div class="edit-section-header">
              <i class="fa-solid fa-id-card"></i> Identitas Pokok & Biodata Peserta
            </div>
            <div class="edit-grid-2" style="margin-bottom: 0.85rem;">
              <div class="edit-form-field">
                <label class="edit-form-label">Nama Lengkap Peserta <span class="req">*</span></label>
                <input type="text" id="adminEditFullName" required class="edit-form-input" placeholder="Nama lengkap sesuai akta / kartu pelajar">
              </div>
              <div class="edit-form-field">
                <label class="edit-form-label">NISN / NIK Identitas</label>
                <input type="text" id="adminEditNisn" class="edit-form-input" placeholder="Nomor NISN atau NIK KTP/KIA">
              </div>
            </div>

            <div class="edit-grid-4" style="margin-bottom: 0.85rem;">
              <div class="edit-form-field">
                <label class="edit-form-label">Tempat Lahir</label>
                <input type="text" id="adminEditBirthPlace" class="edit-form-input" placeholder="Kota / Kabupaten">
              </div>
              <div class="edit-form-field">
                <label class="edit-form-label">Tanggal Lahir</label>
                <input type="date" id="adminEditBirthDate" class="edit-form-input">
              </div>
              <div class="edit-form-field">
                <label class="edit-form-label">Jenis Kelamin</label>
                <select id="adminEditGender" class="edit-form-select">
                  <option value="L">Laki-Laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
              <div class="edit-form-field">
                <label class="edit-form-label">Gol. Darah</label>
                <select id="adminEditBloodType" class="edit-form-select" style="font-weight: 700;">
                  <option value="A">Gol. A</option>
                  <option value="B">Gol. B</option>
                  <option value="AB">Gol. AB</option>
                  <option value="O">Gol. O</option>
                  <option value="-">- (Belum Tahu)</option>
                </select>
              </div>
            </div>

            <div class="edit-grid-3">
              <div class="edit-form-field">
                <label class="edit-form-label">Agama</label>
                <select id="adminEditReligion" class="edit-form-select">
                  <option value="Islam">Islam</option>
                  <option value="Kristen Protestan">Kristen Protestan</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>
              <div class="edit-form-field">
                <label class="edit-form-label">Status Disabilitas</label>
                <select id="adminEditIsDisabled" class="edit-form-select">
                  <option value="Tidak">Tidak (Non-Disabilitas)</option>
                  <option value="Ya">Ya (Penyandang Disabilitas)</option>
                </select>
              </div>
              <div class="edit-form-field" id="adminEditClassGroup">
                <label class="edit-form-label">Kelas Peserta</label>
                <input type="text" id="adminEditClassName" class="edit-form-input" placeholder="Contoh: VII A, X MIPA 1, dsb">
              </div>
            </div>
          </div>

          <!-- SECTION 3: Kontak & Domisili -->
          <div class="edit-section-card">
            <div class="edit-section-header">
              <i class="fa-solid fa-address-book"></i> Kontak Komunikasi & Domisili
            </div>
            <div class="edit-grid-3" style="margin-bottom: 0.85rem;">
              <div class="edit-form-field">
                <label class="edit-form-label">No. WhatsApp HP <span class="req">*</span></label>
                <input type="text" id="adminEditPhone" required class="edit-form-input" placeholder="08xxxxxxxxxx">
              </div>
              <div class="edit-form-field">
                <label class="edit-form-label">Email Aktif</label>
                <input type="email" id="adminEditEmail" class="edit-form-input" placeholder="peserta@email.com">
              </div>
              <div class="edit-form-field">
                <label class="edit-form-label">Kontak Darurat / Pembina</label>
                <input type="text" id="adminEditEmergencyContact" class="edit-form-input" placeholder="Nama & No HP Darurat">
              </div>
            </div>
            <div class="edit-form-field">
              <label class="edit-form-label">Alamat Lengkap Domisili / Tempat Tinggal</label>
              <textarea id="adminEditAddress" rows="2" class="edit-form-textarea" placeholder="Jalan, Dusun, RT/RW, Desa/Kelurahan, Kecamatan, Kabupaten..."></textarea>
            </div>
          </div>

          <!-- SECTION 4: Data Sekolah / Unit Kontingen -->
          <div class="edit-section-card">
            <div class="edit-section-header">
              <i class="fa-solid fa-school"></i> Data Sekolah / Pangkalan Unit
            </div>
            <div class="edit-grid-2">
              <div class="edit-form-field">
                <label class="edit-form-label">Alamat Sekolah / Pangkalan</label>
                <input type="text" id="adminEditSchoolAddress" class="edit-form-input" placeholder="Alamat lengkap sekolah pangkalan">
              </div>
              <div class="edit-form-field">
                <label class="edit-form-label">Telp / Kontak Sekolah</label>
                <input type="text" id="adminEditSchoolPhone" class="edit-form-input" placeholder="(0284) xxxxxx / No Telp Sekolah">
              </div>
            </div>
          </div>

          <!-- SECTION 5: Data Orang Tua / Wali (Khusus Peserta) -->
          <div id="adminEditParentGroup" class="edit-section-card">
            <div class="edit-section-header">
              <i class="fa-solid fa-user-group"></i> Data Orang Tua / Wali Peserta
            </div>
            <div class="edit-grid-2" style="margin-bottom: 0.85rem;">
              <div class="edit-form-field">
                <label class="edit-form-label">Nama Lengkap Orang Tua / Wali</label>
                <input type="text" id="adminEditParentName" class="edit-form-input" placeholder="Nama ayah / ibu / wali">
              </div>
              <div class="edit-form-field">
                <label class="edit-form-label">Pekerjaan Orang Tua / Wali</label>
                <input type="text" id="adminEditParentJob" class="edit-form-input" placeholder="PNS, Wiraswasta, Karyawan, Petani, dll">
              </div>
            </div>
            <div class="edit-grid-2">
              <div class="edit-form-field">
                <label class="edit-form-label">No. Telp / HP Orang Tua</label>
                <input type="text" id="adminEditParentPhone" class="edit-form-input" placeholder="08xxxxxxxxxx">
              </div>
              <div class="edit-form-field">
                <label class="edit-form-label">Alamat Lengkap Orang Tua / Wali</label>
                <input type="text" id="adminEditParentAddress" class="edit-form-input" placeholder="Alamat rumah orang tua / wali">
              </div>
            </div>
          </div>

          <!-- SECTION 6: Khusus Pembina Pendamping -->
          <div id="adminEditPendampingGroup" class="edit-section-card" style="display: none; background: #f0fdf4; border-color: #bbf7d0;">
            <div class="edit-section-header" style="color: #166534; border-color: #dcfce7;">
              <i class="fa-solid fa-user-tie" style="color: #15803d;"></i> Riwayat Khusus Pembina Pendamping
            </div>
            <div class="edit-form-field" style="margin-bottom: 0.85rem;">
              <label class="edit-form-label">Pendidikan Terakhir</label>
              <input type="text" id="adminEditLastEducation" class="edit-form-input" placeholder="Contoh: SMA/SMK, D3, S1 Pendidikan, S2, dll">
            </div>
            <div class="edit-form-field">
              <label class="edit-form-label">Organisasi yang Pernah / Sedang Diikuti (Tulis a, b, c, d atau per baris)</label>
              <textarea id="adminEditOrganizations" rows="3" class="edit-form-textarea" placeholder="a. PMI Kab. Pemalang&#10;b. PGRI&#10;c. Pramuka&#10;d. ..."></textarea>
            </div>
          </div>

          <!-- SECTION 7: Berkas Resmi & Dokumen (Pas Foto & Surat Tugas) -->
          <div class="edit-section-card">
            <div class="edit-section-header">
              <i class="fa-solid fa-cloud-arrow-up"></i> Unggah / Perbarui Berkas Dokumen Resmi
            </div>
            <div class="edit-grid-2">
              <!-- Box Pas Foto -->
              <div class="edit-file-card">
                <label class="edit-form-label"><i class="fa-solid fa-image" style="color: #0284c7;"></i> Pas Foto Resmi (3x4)</label>
                <div style="display: flex; align-items: center; gap: 0.85rem; background: #ffffff; padding: 0.65rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <img id="adminEditPhotoPreview" src="frontend/images/default-avatar.svg" style="width: 65px; height: 85px; object-fit: cover; border-radius: 6px; border: 1.5px solid #cbd5e1; background: #ffffff;" alt="Pratinjau Foto">
                  <div>
                    <div id="adminEditPhotoStatus" style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.2rem;">Pas foto terdaftar</div>
                    <small style="color: #64748b; font-size: 0.72rem; display: block;">Format JPG/PNG (Maks. 5MB). Pilih berkas baru di bawah jika ingin mengganti.</small>
                  </div>
                </div>
                <input type="file" id="adminEditPhotoFile" accept="image/*" class="edit-form-input" style="padding: 0.4rem 0.6rem; font-size: 0.78rem;">
              </div>

              <!-- Box Surat Tugas -->
              <div class="edit-file-card">
                <label class="edit-form-label"><i class="fa-solid fa-file-contract" style="color: #dc2626;"></i> Surat Tugas Sekolah (PDF / Gambar)</label>
                <div style="background: #ffffff; padding: 0.65rem; border-radius: 8px; border: 1px solid #e2e8f0; min-height: 85px; display: flex; flex-direction: column; justify-content: center;">
                  <div id="adminEditCurrentLetterBox" style="margin-bottom: 0.35rem;">
                    <a id="adminEditLetterLink" href="#" target="_blank" class="btn btn-outline btn-sm" style="font-size: 0.78rem; padding: 0.35rem 0.65rem; display: inline-flex; align-items: center; gap: 0.4rem; color: #dc2626; border-color: #fca5a5; background: #fff5f5; font-weight: 700;">
                      <i class="fa-solid fa-arrow-up-right-from-square"></i> Buka Surat Tugas Terdaftar
                    </a>
                  </div>
                  <small style="color: #64748b; font-size: 0.72rem; display: block;">Berkas PDF resmi dengan tanda tangan & cap basah pangkalan.</small>
                </div>
                <input type="file" id="adminEditAssignmentFile" accept=".pdf,image/*" class="edit-form-input" style="padding: 0.4rem 0.6rem; font-size: 0.78rem;">
              </div>
            </div>
          </div>

        </div>
        <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button type="button" class="btn btn-danger btn-sm" style="background: #dc2626; border-color: #dc2626; color: white; font-weight: 700; padding: 0.45rem 0.85rem;" onclick="event.preventDefault(); event.stopPropagation(); App.handleDeleteFromEditModal(event)">
              <i class="fa-solid fa-trash-can"></i> Hapus Peserta
            </button>
            <button type="button" class="btn btn-outline btn-sm" style="color: #0284c7; border-color: #bae6fd; font-weight: 700; padding: 0.45rem 0.85rem;" onclick="App.openBiodataModal(document.getElementById('adminEditParticipantId').value)">
              <i class="fa-solid fa-print"></i> Cetak Formulir Biodata
            </button>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('adminEditParticipantModal')">Batal</button>
            <button type="submit" id="adminEditSubmitBtn" class="btn btn-primary btn-sm" style="font-weight: 800; padding: 0.5rem 1.25rem; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);">
              <i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan Data
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: Cetak Formulir Biodata Resmi Peserta (Standar PMI Pemalang) -->
  <div class="modal" id="biodataPrintModal">
    <div class="modal-dialog" style="max-width: 860px;">
      <div class="modal-header no-print" style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 0.85rem 1.25rem;">
        <h3 class="modal-title" id="biodataModalTitle" style="margin: 0; font-size: 1.05rem; font-weight: 800; color: var(--secondary); display: flex; align-items: center; gap: 0.5rem;">
          <i class="fa-solid fa-file-invoice" style="color: var(--primary);"></i> Cetak Formulir Biodata Resmi (Standar PMI)
        </h3>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <a id="biodataModalStLink" href="#" target="_blank" class="btn btn-outline btn-sm" style="display: none; font-weight: 700; color: #dc2626; border-color: #fca5a5; font-size: 0.8rem; padding: 0.35rem 0.65rem;">
            <i class="fa-solid fa-file-pdf"></i> Lihat Berkas ST
          </a>
          <button type="button" class="btn btn-primary btn-sm" onclick="App.triggerPrintBiodata()" style="font-weight: 700; background: #0284c7; border-color: #0284c7; font-size: 0.8rem; padding: 0.35rem 0.75rem;">
            <i class="fa-solid fa-print"></i> Cetak / Print Dokumen
          </button>
          <button class="modal-close" onclick="App.closeModal('biodataPrintModal')">&times;</button>
        </div>
      </div>
      <div class="modal-body" style="padding: 2rem 1.5rem; background: #475569; max-height: calc(100vh - 160px); overflow-y: auto;">
        <div id="biodataPrintContainer">
          <!-- Dokumen Biodata Dirender Oleh App.openBiodataModal -->
        </div>
      </div>
      <div class="modal-footer no-print" style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border-top: 1px solid #e2e8f0; padding: 0.85rem 1.25rem;">
        <span style="font-size: 0.8rem; color: #64748b;"><i class="fa-solid fa-circle-info" style="color: #0284c7;"></i> Dokumen siap dicetak dalam 1 lembar kertas A4 Portrait rapi sesuai format fisik PMI.</span>
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('biodataPrintModal')">Tutup</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="App.triggerPrintBiodata()" style="font-weight: 700; background: #0284c7; border-color: #0284c7;">
            <i class="fa-solid fa-print"></i> Cetak Dokumen
          </button>
        </div>
      </div>
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

  <!-- Floating Quick Button: Kotak Saran (Hanya Tampil di Frontend Publik) -->
  <?php $hideFloatingFeedback = !empty(getCurrentUser()); ?>
  <button type="button" class="floating-feedback-btn" id="floatingFeedbackBtn" onclick="App.openFeedbackModal()" aria-label="Buka Kotak Saran Jumbara" title="Kirim Saran & Aspirasi untuk Jumbara PMI"<?php if ($hideFloatingFeedback): ?> style="display: none;"<?php endif; ?>>
    <span class="feedback-dot-pulse"></span>
    <i class="fa-solid fa-comment-dots"></i>
    <span>Kotak Saran</span>
  </button>

  <!-- Modal: Kotak Saran & Aspirasi -->
  <div class="modal" id="feedbackModal">
    <div class="modal-dialog" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fa-solid fa-comment-dots" style="color: var(--primary);"></i> Form Kotak Saran & Aspirasi JUMBARA
        </h3>
        <button type="button" class="modal-close" onclick="App.closeModal('feedbackModal')" aria-label="Tutup Modal">&times;</button>
      </div>
      <form onsubmit="App.handleFeedbackSubmit(event, 'modal')">
        <div class="modal-body" style="padding: 1.5rem 1.75rem;">
          <div id="modalFeedbackAlert" style="display: none; margin-bottom: 1rem; padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600;"></div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.35rem;">Nama Pengirim</label>
            <input type="text" id="modalFeedbackSenderName" placeholder="Nama lengkap Anda..." class="form-control" style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;">
            <label class="anonymous-check-wrap" style="margin-top: 0.4rem;">
              <input type="checkbox" id="modalFeedbackIsAnon" onchange="App.toggleFeedbackAnon('modal')">
              <span>Kirim sebagai Anonim (Rahasiakan Nama Saya)</span>
            </label>
          </div>

          <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.35rem;">Peran Anda *</label>
              <select id="modalFeedbackRole" class="form-control" required style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                <option value="Peserta PMR">Peserta PMR</option>
                <option value="Pembina / Pendamping Unit">Pembina / Pendamping Unit</option>
                <option value="Dewan Juri / Penilai">Dewan Juri / Penilai</option>
                <option value="Panitia Pelaksana">Panitia Pelaksana</option>
                <option value="Orang Tua / Publik">Orang Tua / Masyarakat Umum</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.35rem;">Kategori Masukan *</label>
              <select id="modalFeedbackCategory" class="form-control" required style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                <option value="Fasilitas & Sarpras Buperta">Fasilitas & Sarpras Buperta</option>
                <option value="Pelayanan & Konsumsi">Pelayanan & Konsumsi</option>
                <option value="Penyelenggaraan Lomba">Penyelenggaraan Lomba</option>
                <option value="Jadwal & Rundown Acara">Jadwal & Rundown Acara</option>
                <option value="Keamanan & Medis">Keamanan & Medis</option>
                <option value="Saran Umum & Inovasi">Saran Umum & Inovasi</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.35rem;">Asal Unit Sekolah / Kontingen (Opsional)</label>
            <input type="text" id="modalFeedbackUnitName" placeholder="Contoh: SMAN 1 Pemalang / SMPN 2..." class="form-control" style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;">
          </div>

          <div class="rating-select-group">
            <div class="rating-select-label">
              <span>Rating Kepuasan / Kualitas Layanan:</span>
              <span class="star-rating-text" id="modalFeedbackRatingText">5 Bintang (Sangat Memuaskan)</span>
            </div>
            <div class="star-rating-picker" id="modalStarPicker">
              <button type="button" class="star-btn active" data-val="1" onclick="App.setFeedbackRating(1, 'modal')"><i class="fa-solid fa-star"></i></button>
              <button type="button" class="star-btn active" data-val="2" onclick="App.setFeedbackRating(2, 'modal')"><i class="fa-solid fa-star"></i></button>
              <button type="button" class="star-btn active" data-val="3" onclick="App.setFeedbackRating(3, 'modal')"><i class="fa-solid fa-star"></i></button>
              <button type="button" class="star-btn active" data-val="4" onclick="App.setFeedbackRating(4, 'modal')"><i class="fa-solid fa-star"></i></button>
              <button type="button" class="star-btn active" data-val="5" onclick="App.setFeedbackRating(5, 'modal')"><i class="fa-solid fa-star"></i></button>
            </div>
            <input type="hidden" id="modalFeedbackRatingVal" value="5">
          </div>

          <div class="form-group" style="margin-bottom: 0.5rem;">
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.35rem;">Isi Saran, Kritik & Aspirasi Anda *</label>
            <textarea id="modalFeedbackMessage" rows="4" placeholder="Tuliskan saran perbaikan, keluhan fasilitas, kritik membangun, atau apresiasi Anda secara jelas..." required style="width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; font-size: 0.85rem; resize: vertical;"></textarea>
          </div>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('feedbackModal')">Batal</button>
          <button type="submit" id="modalFeedbackSubmitBtn" class="btn btn-primary btn-sm" style="font-weight: 700;">
            <i class="fa-solid fa-paper-plane"></i> Kirim Saran
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- JavaScript Scripts -->
  <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js" crossorigin="anonymous"></script>
  <?php
    $appJsPath = __DIR__ . '/../frontend/js/app.js';
    $appBackupPath = __DIR__ . '/../frontend/js/app.backup.js';
    if (file_exists($appJsPath) && filesize($appJsPath) === 0 && file_exists($appBackupPath) && filesize($appBackupPath) > 0) {
        @copy($appBackupPath, $appJsPath);
    }
    $jsQrVer = file_exists(__DIR__ . '/../frontend/js/qrcode.min.js') ? filemtime(__DIR__ . '/../frontend/js/qrcode.min.js') : '2.0.0';
    $jsIconsVer = file_exists(__DIR__ . '/../frontend/js/icons.js') ? filemtime(__DIR__ . '/../frontend/js/icons.js') : '2.0.0';
    $jsApiVer = file_exists(__DIR__ . '/../frontend/js/api.js') ? filemtime(__DIR__ . '/../frontend/js/api.js') : '2.0.0';
    $jsUtilsVer = file_exists(__DIR__ . '/../frontend/js/utils.js') ? filemtime(__DIR__ . '/../frontend/js/utils.js') : '2.0.0';
    $jsAppVer = file_exists($appJsPath) ? filemtime($appJsPath) : '2.0.0';
  ?>
  <script src="<?php echo $baseUrl; ?>frontend/js/qrcode.min.js?v=<?php echo $jsQrVer; ?>"></script>
  <script src="<?php echo $baseUrl; ?>frontend/js/icons.js?v=<?php echo $jsIconsVer; ?>"></script>
  <script src="<?php echo $baseUrl; ?>frontend/js/api.js?v=<?php echo $jsApiVer; ?>"></script>
  <script src="<?php echo $baseUrl; ?>frontend/js/utils.js?v=<?php echo $jsUtilsVer; ?>"></script>
  <script src="<?php echo $baseUrl; ?>frontend/js/app.js?v=<?php echo $jsAppVer; ?>"></script>
</body>
</html>
