/* ==========================================================================
   JUMBARA PMR 2026 - MAIN FRONTEND CONTROLLER & RENDERER
   ========================================================================== */

const App = {
  currentUser: null,
  activeTab: 'verifikasi',
  cachedUnits: [],
  cachedEvents: [],
  appSettings: {
    app_name: 'JUMBARA PMR TINGKAT KABUPATEN 2026',
    organizer_name: 'Palang Merah Indonesia Kabupaten',
    jumbotron_title: 'JUMBARA XII PMR PMI KABUPATEN PEMALANG',
    jumbotron_subtitle: 'Ajang Jumpa Bakti Gembira Palang Merah Remaja - Cerdas, Ceria, Bersahabat',
    event_dates: '15 - 17 Oktober 2026',
    event_location: 'Buperta Utama PMI Kabupaten',
    event_location_address: 'Markas PMI Kabupaten Pemalang, Jl. Gatot Subroto No. 23, Bojongbata, Pemalang',
    event_map_embed: 'https://maps.google.com/maps?q=Markas+PMI+Kabupaten+Pemalang&t=&z=15&ie=UTF8&iwloc=&output=embed',
    event_map_url: 'https://maps.google.com/?q=Markas+PMI+Kabupaten+Pemalang',
    contact_phone: '(021) 555-PMR-2026',
    contact_email: 'sekretariat@jumbara-pmi.or.id',
    contact_address: 'Jl. Palang Merah No. 1, Markas PMI Kabupaten',
    contact_hours: 'Senin - Jumat: 08.00 - 16.00 WIB',
    contact_wa: '081234567890',
    footer_about: 'Ajang evaluasi dan pembinaan generasi muda Palang Merah Remaja (Mula, Madya, Wira) dalam mewujudkan Tri Bakti PMR.',
    footer_copyright: '© 2026 Palang Merah Indonesia Kabupaten. Structured Native PHP & MySQL Application.',
    app_logo: 'frontend/images/logo-pmi.svg',
    event_logo: 'frontend/images/logo-jumbara-xii.png',
    app_favicon: 'frontend/favicon.svg',
    app_kop: '',
    reg_deadline: '2026-10-14T23:59',
    reg_active: '1',
    jumbotron_images: [
      'frontend/images/jumbotron-tema1-cerdas.jpg',
      'frontend/images/jumbotron-tema2-ceria.jpg',
      'frontend/images/jumbotron-tema3-bersahabat.jpg'
    ]
  },
  cachedMaterials: [],
  selectedMaterialCategory: 'all',
  currentFeedbackFilter: 'all',
  currentFeedbackPage: 1,
  feedbackRating: {
    landing: 5,
    modal: 5
  },
  jumbotronSlideIndex: 0,
  jumbotronIntervalId: null,
  jumbotronProgressInterval: null,

  async init() {
    this.currentUser = API.getUser();
    if (this.currentUser) {
      try {
        const meRes = await API.getMe();
        if (meRes && meRes.user) {
          this.currentUser = meRes.user;
          API.setUser(meRes.user);
        } else {
          this.handleSessionExpired('Sesi Anda telah berakhir. Silakan login kembali.');
          return;
        }
      } catch (err) {
        console.warn('Session verification error:', err.message);
        if (err.message && err.message.includes('Silakan login terlebih dahulu')) {
          this.handleSessionExpired(err.message);
          return;
        }
      }
    }
    await this.loadSettings();
    this.renderHeaderNav();
    this.renderView();
    this.loadCommonData();
  },

  toggleMobileMenu() {
    const navMenu = document.getElementById('publicNavMenu');
    const navActions = document.getElementById('navActions');
    const icon = document.getElementById('navToggleIcon');

    if (!navMenu) return;

    const isOpen = navMenu.classList.contains('open');
    if (isOpen) {
      navMenu.classList.remove('open');
      if (navActions) navActions.classList.remove('open');
      if (icon) icon.className = 'fa-solid fa-bars';
    } else {
      navMenu.classList.add('open');
      if (navActions) navActions.classList.add('open');
      if (icon) icon.className = 'fa-solid fa-xmark';
    }
  },

  closeMobileMenu() {
    const navMenu = document.getElementById('publicNavMenu');
    const navActions = document.getElementById('navActions');
    const icon = document.getElementById('navToggleIcon');

    if (navMenu) navMenu.classList.remove('open');
    if (navActions) navActions.classList.remove('open');
    if (icon) icon.className = 'fa-solid fa-bars';
  },

  scrollToSection(sectionId, evt) {
    if (evt) evt.preventDefault();
    this.closeMobileMenu();

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${sectionId}`) {
        link.classList.add('active');
      }
    });

    const el = document.getElementById(sectionId);
    if (el) {
      const headerEl = document.querySelector('.site-header') || document.querySelector('.navbar');
      const navHeight = headerEl ? headerEl.offsetHeight : 105;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight - 10;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      const main = document.getElementById('mainContainer');
      if (main) {
        this.renderPublicLanding(main).then(() => {
          setTimeout(() => {
            const targetEl = document.getElementById(sectionId);
            if (targetEl) {
              const headerEl = document.querySelector('.site-header') || document.querySelector('.navbar');
              const navHeight = headerEl ? headerEl.offsetHeight : 105;
              const elementPosition = targetEl.getBoundingClientRect().top;
              const offsetPosition = elementPosition + window.pageYOffset - navHeight - 10;
              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              });
            }
          }, 150);
        });
      }
    }
  },

  setupScrollSpy() {
    const sections = document.querySelectorAll('.landing-section, #beranda');
    const navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length) return;

    window.addEventListener('scroll', () => {
      let currentSection = 'beranda';
      const scrollPos = window.pageYOffset + 120;

      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          currentSection = section.id;
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
          link.classList.add('active');
        }
      });
    }, { passive: true });
  },

  async loadSettings() {
    try {
      const settings = await API.getSettings();
      if (settings && Object.keys(settings).length) {
        this.appSettings = { ...this.appSettings, ...settings };
      }
      this.applySettingsToDOM();
    } catch (e) {
      console.warn('Failed loading dynamic settings from DB:', e);
    }
  },

  applySettingsToDOM() {
    const s = this.appSettings;
    const titleEl = document.getElementById('pageTitle');
    const brandNameEl = document.getElementById('brandAppName');
    const brandOrgEl = document.getElementById('brandOrganizer');
    const footerNameEl = document.getElementById('footerAppName');
    const datesEl = document.getElementById('topEventDates');
    const locEl = document.getElementById('topEventLocation');
    const phoneEl = document.getElementById('topContactPhone');
    const emailEl = document.getElementById('topContactEmail');
    const footerAboutEl = document.getElementById('footerAbout');
    const footerAddressEl = document.getElementById('footerAddress');
    const footerPhoneEl = document.getElementById('footerPhone');
    const footerEmailEl = document.getElementById('footerEmail');
    const footerHoursEl = document.getElementById('footerHours');
    const footerCopyrightEl = document.getElementById('footerCopyright');

    if (titleEl && s.app_name) titleEl.textContent = `${s.app_name} - Palang Merah Indonesia`;
    if (brandNameEl && s.app_name) brandNameEl.textContent = s.app_name;
    if (brandOrgEl && s.organizer_name) brandOrgEl.textContent = s.organizer_name;
    if (footerNameEl && s.app_name) footerNameEl.textContent = s.app_name;
    if (datesEl && s.event_dates) datesEl.textContent = s.event_dates;
    if (locEl && s.event_location) locEl.textContent = s.event_location;
    if (phoneEl && s.contact_phone) phoneEl.textContent = s.contact_phone;
    if (emailEl && s.contact_email) emailEl.textContent = s.contact_email;
    if (footerAboutEl && s.footer_about) footerAboutEl.textContent = s.footer_about;
    if (footerAddressEl && s.contact_address) footerAddressEl.textContent = s.contact_address;
    if (footerPhoneEl && s.contact_phone) footerPhoneEl.textContent = s.contact_phone;
    if (footerEmailEl && s.contact_email) footerEmailEl.textContent = s.contact_email;
    if (footerHoursEl && s.contact_hours) footerHoursEl.textContent = s.contact_hours;
    if (footerCopyrightEl && s.footer_copyright) footerCopyrightEl.textContent = s.footer_copyright;

    // Map & Location Elements Dynamic Update
    const mapVenueTitleEl = document.getElementById('mapVenueTitle');
    const mapVenueAddressEl = document.getElementById('mapVenueAddress');
    const eventMapIframeEl = document.getElementById('eventMapIframe');
    const eventMapBtnEl = document.getElementById('eventMapBtn');

    if (mapVenueTitleEl && s.event_location) mapVenueTitleEl.textContent = s.event_location;
    if (mapVenueAddressEl && (s.event_location_address || s.contact_address)) {
      mapVenueAddressEl.textContent = s.event_location_address || s.contact_address;
    }
    if (eventMapIframeEl && s.event_map_embed) {
      if (eventMapIframeEl.src !== s.event_map_embed) {
        eventMapIframeEl.src = s.event_map_embed;
      }
    }
    if (eventMapBtnEl && s.event_map_url) eventMapBtnEl.href = s.event_map_url;

    // 1. Dynamic Favicon Update from Database (Supports PNG, JPG, WEBP, ICO, SVG)
    if (s.app_favicon) {
      let favLink = document.querySelector("link[rel*='icon']");
      if (!favLink) {
        favLink = document.createElement('link');
        favLink.rel = 'icon';
        document.head.appendChild(favLink);
      }
      const ext = s.app_favicon.split('.').pop().toLowerCase();
      let type = 'image/png';
      if (ext === 'svg') type = 'image/svg+xml';
      else if (ext === 'ico') type = 'image/x-icon';
      else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
      else if (ext === 'webp') type = 'image/webp';
      favLink.type = type;
      favLink.href = s.app_favicon;
    }

    // 2. Dynamic PMI Logo Update from Database
    if (s.app_logo) {
      document.querySelectorAll('.navbar-logo-pmi, .footer-logo, .login-logo-pmi').forEach(img => {
        img.src = s.app_logo;
      });
    }

    // Dynamic Logo Kegiatan Jumbara Update from Database
    if (s.event_logo) {
      document.querySelectorAll('.navbar-logo-jumbara, .login-logo-jumbara').forEach(img => {
        img.src = s.event_logo;
      });
    }
  },

  async loadCommonData() {
    try {
      this.cachedUnits = await API.getUnits();
      this.cachedEvents = await API.getEvents();
    } catch (err) {
      console.warn('Common data fetch issue:', err);
    }
  },

  renderHeaderNav() {
    const container = document.getElementById('navActions');
    const publicNavMenu = document.getElementById('publicNavMenu');
    const navToggleBtn = document.getElementById('navToggleBtn');

    if (this.currentUser) {
      document.body.classList.add('user-logged-in');
      const role = this.currentUser.role;

      if (publicNavMenu) {
        publicNavMenu.classList.remove('hidden');
        if (['kabupaten', 'admin_kabupaten', 'super_admin', 'panitia'].includes(role)) {
          publicNavMenu.innerHTML = `
            <a href="javascript:void(0)" class="nav-link" onclick="App.switchAdminCategory('peserta'); App.closeMobileMenu();"><i class="fa-solid fa-users"></i> Peserta & Card</a>
            <a href="javascript:void(0)" class="nav-link" onclick="App.switchAdminCategory('agenda'); App.closeMobileMenu();"><i class="fa-solid fa-calendar-check"></i> Agenda & Presensi</a>
            <a href="javascript:void(0)" class="nav-link" onclick="App.switchAdminCategory('penilaian'); App.closeMobileMenu();"><i class="fa-solid fa-award"></i> Penilaian & Laporan</a>
            <a href="javascript:void(0)" class="nav-link" onclick="App.switchAdminCategory('pengaturan'); App.closeMobileMenu();"><i class="fa-solid fa-gears"></i> Pengaturan & Akun</a>
            <a href="javascript:void(0)" class="nav-link" onclick="App.openChangePasswordModal(); App.closeMobileMenu();"><i class="fa-solid fa-key"></i> Ganti Password Akun</a>
            <a href="javascript:void(0)" class="nav-link" onclick="App.handleLogout(); App.closeMobileMenu();" style="color: #ef4444; font-weight: 700;"><i class="fa-solid fa-right-from-bracket"></i> Keluar / Logout</a>
          `;
          publicNavMenu.style.display = '';
        } else if (role === 'unit' || role === 'admin_unit') {
          publicNavMenu.innerHTML = `
            <a href="javascript:void(0)" class="nav-link" onclick="App.switchUnitTab('peserta'); App.closeMobileMenu();"><i class="fa-solid fa-users"></i> Data Peserta Sekolah</a>
            <a href="javascript:void(0)" class="nav-link" onclick="App.switchUnitTab('agenda'); App.closeMobileMenu();"><i class="fa-solid fa-calendar-days"></i> Pendaftaran Kegiatan</a>
            <a href="javascript:void(0)" class="nav-link" onclick="App.switchUnitTab('piagam'); App.closeMobileMenu();"><i class="fa-solid fa-certificate"></i> Cetak Piagam & Rekap</a>
            <a href="javascript:void(0)" class="nav-link" onclick="App.openChangePasswordModal(); App.closeMobileMenu();"><i class="fa-solid fa-key"></i> Ganti Password Akun</a>
            <a href="javascript:void(0)" class="nav-link" onclick="App.handleLogout(); App.closeMobileMenu();" style="color: #ef4444; font-weight: 700;"><i class="fa-solid fa-right-from-bracket"></i> Keluar / Logout</a>
          `;
          publicNavMenu.style.display = '';
        } else {
          publicNavMenu.style.display = 'none';
        }
      }
      if (navToggleBtn) {
        navToggleBtn.classList.remove('hidden');
        navToggleBtn.style.display = (['kabupaten', 'admin_kabupaten', 'super_admin', 'panitia', 'unit', 'admin_unit'].includes(role)) ? '' : 'none';
      }

      if (container) {
        let roleTagClass = 'role-peserta';
        let roleText = 'Peserta PMR';

        if (role === 'kabupaten') {
          roleTagClass = 'role-kabupaten';
          roleText = 'Admin PMI Kab.';
        } else if (role === 'unit') {
          roleTagClass = 'role-unit';
          roleText = `Admin Unit: ${this.currentUser.unit_name || ''}`;
        } else if (role === 'penilai' || role === 'juri') {
          roleTagClass = 'role-penilai';
          roleText = 'Penilai / Dewan Juri';
        } else if (role === 'panitia') {
          roleTagClass = 'role-panitia';
          roleText = 'Panitia Pelaksana';
        } else if (role === 'peninjau') {
          roleTagClass = 'role-peninjau';
          roleText = 'Peninjau';
        } else if (role === 'tamu') {
          roleTagClass = 'role-tamu';
          roleText = 'Tamu Undangan';
        } else if (role === 'media') {
          roleTagClass = 'role-media';
          roleText = 'Media / Pers';
        }

        container.innerHTML = `
          <div class="user-badge" title="${Utils.escapeHtml(this.currentUser.username)} (${roleText})">
            <span>${Icons.peserta(18)} <strong>${Utils.escapeHtml(this.currentUser.username)}</strong></span>
            <span class="user-role-tag ${roleTagClass}">${roleText}</span>
          </div>
          <button class="btn btn-outline btn-sm btn-header-pass" onclick="App.openChangePasswordModal()" style="font-size: 0.8rem; padding: 0.35rem 0.65rem;" title="Ganti Password Akun"><i class="fa-solid fa-key"></i> Pass</button>
          <button class="btn btn-danger btn-sm btn-header-logout" onclick="App.handleLogout()" title="Keluar"><i class="fa-solid fa-right-from-bracket"></i> Keluar</button>
        `;
      }
    } else {
      document.body.classList.remove('user-logged-in');
      if (publicNavMenu) {
        publicNavMenu.classList.remove('hidden');
        publicNavMenu.innerHTML = `
          <a href="#beranda" class="nav-link active" onclick="App.scrollToSection('beranda', event)"><i class="fa-solid fa-house"></i> Beranda</a>
          <a href="#kegiatan" class="nav-link" onclick="App.scrollToSection('kegiatan', event)"><i class="fa-solid fa-calendar-days"></i> Agenda</a>
          <a href="#materi" class="nav-link" onclick="App.scrollToSection('materi', event)"><i class="fa-solid fa-book-bookmark"></i> Materi</a>
          <a href="#pengumuman" class="nav-link" onclick="App.scrollToSection('pengumuman', event)"><i class="fa-solid fa-bullhorn"></i> Pengumuman</a>
          <a href="#klasemen" class="nav-link" onclick="App.scrollToSection('klasemen', event)"><i class="fa-solid fa-trophy"></i> Medali</a>
          <a href="#unit" class="nav-link" onclick="App.scrollToSection('unit', event)"><i class="fa-solid fa-school"></i> Kontingen</a>
          <a href="#lokasi" class="nav-link" onclick="App.scrollToSection('lokasi', event)"><i class="fa-solid fa-map-location-dot"></i> Lokasi</a>
        `;
        publicNavMenu.style.display = '';
      }
      if (navToggleBtn) {
        navToggleBtn.classList.remove('hidden');
        navToggleBtn.style.display = '';
      }

      if (container) {
        container.innerHTML = `
          <button class="btn btn-primary btn-sm" onclick="App.openLoginModal()">${Icons.login(15)} Login</button>
        `;
      }
    }
    this.renderMobileBottomNav();
    this.renderFooterNav();
  },

  async renderView() {
    const main = document.getElementById('mainContainer');
    if (!main) return;

    const role = this.currentUser ? this.currentUser.role : null;
    const isDesktopAdmin = ['kabupaten', 'admin_kabupaten', 'super_admin', 'unit', 'admin_unit'].includes(role);

    if (!this.currentUser) {
      document.body.classList.remove('has-mobile-portal');
      await this.renderPublicLanding(main);
    } else if (isDesktopAdmin) {
      // ADMIN (Kabupaten & Unit) -> TETAP TAMPILAN DESKTOP
      document.body.classList.remove('has-mobile-portal');
      if (['unit', 'admin_unit'].includes(role)) {
        await this.renderAdminUnitPortal(main);
      } else {
        await this.renderAdminKabupatenPortal(main);
      }
    } else if (['penilai', 'juri'].includes(role)) {
      // PENILAI / DEWAN JURI -> TAMPILAN DASHBOARD MOBILE PENILAI HP
      document.body.classList.add('has-mobile-portal');
      await this.renderPenilaiPortal(main);
    } else if (role === 'peninjau') {
      // PENINJAU RESMI JUMBARA -> TAMPILAN DASHBOARD MOBILE PENINJAU
      document.body.classList.add('has-mobile-portal');
      await this.renderPeninjauPortal(main);
    } else {
      // PESERTA (Default User Login) -> TAMPILAN DASHBOARD MOBILE PESERTA MANDIRI
      document.body.classList.add('has-mobile-portal');
      await this.renderPesertaPortal(main);
    }

    this.renderMobileBottomNav();
    this.renderFooterNav();
  },

  startJumbotronCarousel() {
    if (this.jumbotronIntervalId) clearInterval(this.jumbotronIntervalId);
    if (this.jumbotronProgressInterval) clearInterval(this.jumbotronProgressInterval);

    const slides = document.querySelectorAll('.jumbotron-bg-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    const progressBar = document.getElementById('jumbotronProgressBar');
    if (!slides.length || slides.length <= 1) {
      if (progressBar) progressBar.style.width = '100%';
      return;
    }

    const duration = 5000; // 5 seconds per slide transition
    const step = 40;       // update progress every 40ms for silky smooth animation
    let elapsed = 0;

    const resetProgressBar = () => {
      elapsed = 0;
      if (progressBar) {
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
      }
    };

    const updateProgressBar = () => {
      if (progressBar) {
        const pct = Math.min(100, (elapsed / duration) * 100);
        progressBar.style.width = pct + '%';
      }
    };

    resetProgressBar();

    this.jumbotronProgressInterval = setInterval(() => {
      elapsed += step;
      updateProgressBar();

      if (elapsed >= duration) {
        slides[this.jumbotronSlideIndex].classList.remove('active');
        if (dots[this.jumbotronSlideIndex]) dots[this.jumbotronSlideIndex].classList.remove('active');

        this.jumbotronSlideIndex = (this.jumbotronSlideIndex + 1) % slides.length;

        slides[this.jumbotronSlideIndex].classList.add('active');
        if (dots[this.jumbotronSlideIndex]) dots[this.jumbotronSlideIndex].classList.add('active');

        const numEl = document.getElementById('currentSlideNum');
        if (numEl) numEl.textContent = this.jumbotronSlideIndex + 1;

        resetProgressBar();
      }
    }, step);
  },

  setJumbotronSlide(index) {
    const slides = document.querySelectorAll('.jumbotron-bg-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    if (!slides.length || index >= slides.length) return;

    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    this.jumbotronSlideIndex = index;
    slides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');

    const numEl = document.getElementById('currentSlideNum');
    if (numEl) numEl.textContent = index + 1;

    // Restart timer and smoothly fill from 0% for the selected slide
    this.startJumbotronCarousel();
  },

  prevJumbotronSlide() {
    const slides = document.querySelectorAll('.jumbotron-bg-slide');
    if (!slides.length) return;
    let prevIdx = (this.jumbotronSlideIndex - 1 + slides.length) % slides.length;
    this.setJumbotronSlide(prevIdx);
  },

  nextJumbotronSlide() {
    const slides = document.querySelectorAll('.jumbotron-bg-slide');
    if (!slides.length) return;
    let nextIdx = (this.jumbotronSlideIndex + 1) % slides.length;
    this.setJumbotronSlide(nextIdx);
  },

  // =========================================================================
  // VIEW 1: PUBLIC LANDING PAGE WITH JUMBOTRON HERO CAROUSEL & DEADLINE
  // =========================================================================
  async renderPublicLanding(container) {
    const s = this.appSettings;

    // Parse Jumbotron Images Array
    let heroImgs = [];
    try {
      heroImgs = typeof s.jumbotron_images === 'string' ? JSON.parse(s.jumbotron_images) : s.jumbotron_images;
    } catch (e) {
      heroImgs = [
        'frontend/images/jumbotron-tema1-cerdas.jpg',
        'frontend/images/jumbotron-tema2-ceria.jpg',
        'frontend/images/jumbotron-tema3-bersahabat.jpg'
      ];
    }
    if (!Array.isArray(heroImgs) || !heroImgs.length) {
      heroImgs = [
        'frontend/images/jumbotron-tema1-cerdas.jpg',
        'frontend/images/jumbotron-tema2-ceria.jpg',
        'frontend/images/jumbotron-tema3-bersahabat.jpg'
      ];
    }

    // Deadline & Registration Active Check
    const deadlineStr = s.reg_deadline || '2026-10-14T23:59';
    const deadlineDate = new Date(deadlineStr);
    const now = new Date();
    const isOpen = (s.reg_active === '1' || s.reg_active === 1 || s.reg_active === true) && (now < deadlineDate);

    let deadlineBadgeHtml = '';
    let regBtnHtml = '';

    if (isOpen) {
      deadlineBadgeHtml = `
        <div class="reg-deadline-banner" id="countdownBannerContainer">
          <span class="live-pulse-dot"></span>
          <i class="fa-solid fa-clock"></i>
          <span>Sisa Waktu Pendaftaran: <strong id="cdTimeStr">-- Hari -- Jam -- Mnt</strong></span>
        </div>
      `;

      regBtnHtml = `
        <button class="btn btn-primary btn-sm" onclick="App.openRegisterModal()">${Icons.userPlus(14)} Daftar</button>
      `;
    } else {
      deadlineBadgeHtml = `
        <div class="reg-closed-alert">
          <i class="fa-solid fa-lock"></i>
          <span>Pendaftaran Mandiri Ditutup (Batas Akhir: ${deadlineDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})</span>
        </div>
      `;

      regBtnHtml = `
        <button class="btn btn-secondary btn-sm" disabled style="opacity: 0.6; cursor: not-allowed;"><i class="fa-solid fa-lock"></i> Ditutup</button>
      `;
    }

    const slidesHtml = heroImgs.map((imgUrl, idx) => `
      <div class="jumbotron-bg-slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${imgUrl}');"></div>
    `).join('');

    const dotsHtml = heroImgs.length > 1 ? heroImgs.map((_, idx) => `
      <span class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="App.setJumbotronSlide(${idx})"></span>
    `).join('') : '';

    container.innerHTML = `
      <section class="jumbotron-hero" id="beranda">
        <div class="jumbotron-bg-slider">
          ${slidesHtml}
        </div>
        <div class="jumbotron-overlay"></div>
        <div class="jumbotron-content">
          <div class="jumbotron-inner-box">
            <div>${deadlineBadgeHtml}</div>

            <h2 class="jumbotron-title" id="jumbotronTitle">${Utils.escapeHtml(s.jumbotron_title || 'JUMBARA XII PMR PMI KABUPATEN PEMALANG')}</h2>
            <p class="jumbotron-subtitle" id="jumbotronSubtitle">${Utils.escapeHtml(s.jumbotron_subtitle || 'Ajang Jumpa Bakti Gembira Palang Merah Remaja - Cerdas, Ceria, Bersahabat')}</p>
            
            <div class="hero-btns">
              ${regBtnHtml}
              <button class="btn btn-secondary btn-sm" onclick="App.openLoginModal()">${Icons.login(14)} Login</button>
            </div>
          </div>
        </div>

        ${heroImgs.length > 1 ? `
          <button type="button" class="carousel-nav-btn prev" onclick="App.prevJumbotronSlide()" aria-label="Slide Sebelumnya">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <button type="button" class="carousel-nav-btn next" onclick="App.nextJumbotronSlide()" aria-label="Slide Berikutnya">
            <i class="fa-solid fa-chevron-right"></i>
          </button>

          <div class="jumbotron-carousel-controls">
            <div class="jumbotron-carousel-dots">
              ${dotsHtml}
            </div>
            <div class="carousel-counter">
              <span id="currentSlideNum">1</span> / <span id="totalSlidesNum">${heroImgs.length}</span>
            </div>
          </div>
        ` : ''}

        <!-- Progress Pergantian Slide -->
        <div class="jumbotron-progress-container">
          <div class="jumbotron-progress-bar" id="jumbotronProgressBar"></div>
        </div>
      </section>

      <!-- SECTION 1: METRICS STRIP (NON-CARD) -->
      <section class="landing-metrics-strip">
        <div class="landing-section-inner">
          <div class="metrics-row">
            <div class="metric-item">
              <div class="metric-icon-wrap" style="color: #dc2626; background: rgba(220, 38, 38, 0.08);">
                <i class="fa-solid fa-school-flag"></i>
              </div>
              <div class="metric-data">
                <div class="metric-number" id="statTotalUnits">-</div>
                <div class="metric-label">Kontingen Unit PMR</div>
                <div class="metric-sub">Mula, Madya & Wira</div>
              </div>
            </div>

            <div class="metric-item">
              <div class="metric-icon-wrap" style="color: #2563eb; background: rgba(37, 99, 235, 0.08);">
                <i class="fa-solid fa-users"></i>
              </div>
              <div class="metric-data">
                <div class="metric-number" id="statTotalPeserta">-</div>
                <div class="metric-label">Peserta Terdaftar</div>
                <div class="metric-sub">Relawan Muda PMR</div>
              </div>
            </div>

            <div class="metric-item">
              <div class="metric-icon-wrap" style="color: #059669; background: rgba(5, 150, 105, 0.08);">
                <i class="fa-solid fa-calendar-check"></i>
              </div>
              <div class="metric-data">
                <div class="metric-number" id="statTotalEvents">-</div>
                <div class="metric-label">Agenda Kegiatan</div>
                <div class="metric-sub">Rangkaian Acara Jumbara</div>
              </div>
            </div>

            <div class="metric-item">
              <div class="metric-icon-wrap" style="color: #7c3aed; background: rgba(124, 58, 237, 0.08);">
                <i class="fa-solid fa-hands-holding-circle"></i>
              </div>
              <div class="metric-data">
                <div class="metric-number" style="font-size: 1.85rem; letter-spacing: -0.5px; color: #7c3aed;">Tri Bakti</div>
                <div class="metric-label">Prinsip Relawan PMR</div>
                <div class="metric-sub">Jumpa, Bakti, Gembira</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 2: AGENDA & RUNDOWN KEGIATAN -->
      <section class="landing-section" id="kegiatan">
        <div class="landing-section-inner">
          <div class="sec-header-modern">
            <div class="sec-header-left">
              <span class="sec-kicker sec-kicker-red"><i class="fa-solid fa-calendar-days"></i> AGENDA UTAMA</span>
              <h2 class="sec-title">Jadwal & Rundown Acara</h2>
            </div>
            <div class="sec-header-right">
              <span class="sec-meta-badge"><i class="fa-regular fa-clock"></i> Zona Waktu WIB</span>
            </div>
          </div>
          <div id="publicEventsList">
            <p style="color: var(--text-muted); text-align: center;">Memuat jadwal kegiatan...</p>
          </div>
        </div>
      </section>

      <!-- SECTION 3: PENGUMUMAN & INFORMASI -->
      <section class="landing-section section-alt" id="pengumuman">
        <div class="landing-section-inner">
          <div class="sec-header-modern">
            <div class="sec-header-left">
              <span class="sec-kicker sec-kicker-blue"><i class="fa-solid fa-bullhorn"></i> PAPAN PENGUMUMAN</span>
              <h2 class="sec-title">Informasi & Edaran Resmi</h2>
            </div>
            <div class="sec-header-right">
              <span class="sec-meta-badge"><i class="fa-solid fa-circle-check"></i> Terverifikasi Panitia</span>
            </div>
          </div>
          <div id="publicAnnouncementsList">
            <p style="color: var(--text-muted); text-align: center;">Memuat pengumuman...</p>
          </div>
        </div>
      </section>

      <!-- SECTION 4: KLASEMEN MEDALI -->
      <section class="landing-section" id="klasemen">
        <div class="landing-section-inner">
          <div class="sec-header-modern">
            <div class="sec-header-left">
              <span class="sec-kicker sec-kicker-gold"><i class="fa-solid fa-trophy"></i> LEADERBOARD</span>
              <h2 class="sec-title">Klasemen Perolehan Medali</h2>
            </div>
            <div class="sec-header-right">
              <span class="sec-meta-badge"><i class="fa-solid fa-medal"></i> Juara Umum PMR</span>
            </div>
          </div>
          <div id="publicStandingsList">
            <p style="color: var(--text-muted); text-align: center;">Memuat klasemen...</p>
          </div>
        </div>
      </section>

      <!-- SECTION 5: DAFTAR KONTINGEN UNIT -->
      <section class="landing-section section-alt" id="unit">
        <div class="landing-section-inner">
          <div class="sec-header-modern">
            <div class="sec-header-left">
              <span class="sec-kicker sec-kicker-green"><i class="fa-solid fa-school"></i> KONTINGEN PMR</span>
              <h2 class="sec-title">Daftar Unit Sekolah</h2>
            </div>
            <div class="sec-header-right">
              <span class="sec-meta-badge"><i class="fa-solid fa-users"></i> Mula • Madya • Wira</span>
            </div>
          </div>
          <div id="publicUnitsList">
            <p style="color: var(--text-muted); text-align: center;">Memuat daftar unit...</p>
          </div>
        </div>
      </section>

      <!-- SECTION 6: LOKASI & PETA KEGIATAN -->
      <section class="landing-section" id="lokasi">
        <div class="landing-section-inner">
          <div class="sec-header-modern">
            <div class="sec-header-left">
              <span class="sec-kicker sec-kicker-red"><i class="fa-solid fa-map-location-dot"></i> VENUE & PETA</span>
              <h2 class="sec-title">Lokasi & Panduan Arah</h2>
            </div>
            <div class="sec-header-right">
              <span class="sec-meta-badge"><i class="fa-solid fa-compass"></i> Titik Kumpul Buperta</span>
            </div>
          </div>
          <div class="location-map-grid" style="padding: 0;">
            <div class="map-embed-wrapper" style="box-shadow: 0 10px 30px rgba(0,0,0,0.06); border-radius: var(--radius-lg);">
              <iframe 
                id="eventMapIframe"
                src="${s.event_map_embed || 'https://maps.google.com/maps?q=Markas+PMI+Kabupaten+Pemalang&t=&z=15&ie=UTF8&iwloc=&output=embed'}"
                allowfullscreen="" 
                loading="lazy" 
                referrerpolicy="no-referrer-when-downgrade"
                title="Peta Lokasi Kegiatan Jumbara">
              </iframe>
            </div>
            <div class="location-details-box" style="background: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 2rem;">
              <div>
                <div style="display: inline-flex; align-items: center; gap: 0.5rem; color: var(--primary); font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem;">
                  <i class="fa-solid fa-campground"></i> Informasi Venue
                </div>
                <h4 id="mapVenueTitle" style="font-size: 1.35rem; font-weight: 800; color: var(--secondary, #1e293b); margin-bottom: 0.75rem; letter-spacing: -0.3px;">
                  ${Utils.escapeHtml(s.event_location || 'Buperta Utama PMI Kabupaten')}
                </h4>
                <p id="mapVenueAddress" style="color: var(--text-muted, #64748b); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
                  ${Utils.escapeHtml(s.event_location_address || s.contact_address || 'Jl. Gatot Subroto No. 23, Bojongbata, Kec. Pemalang, Kabupaten Pemalang')}
                </p>
                <div style="border-top: 1px dashed var(--border-color, #e2e8f0); padding-top: 1.25rem; margin-bottom: 1.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.85rem; font-size: 0.9rem; color: var(--text-main, #334155);">
                    <i class="fa-solid fa-calendar-days" style="color: var(--primary); width: 20px; text-align: center; font-size: 1.1rem;"></i>
                    <span><strong>Jadwal:</strong> ${Utils.escapeHtml(s.event_dates || '15 - 17 Oktober 2026')}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; color: var(--text-main, #334155);">
                    <i class="fa-solid fa-phone" style="color: var(--primary); width: 20px; text-align: center; font-size: 1.1rem;"></i>
                    <span><strong>Kontak Posko:</strong> ${Utils.escapeHtml(s.contact_phone || s.contact_wa || '(021) 555-PMR-2026')}</span>
                  </div>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <a id="eventMapBtn" href="${s.event_map_url || 'https://maps.google.com/?q=Markas+PMI+Kabupaten+Pemalang'}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; text-decoration: none; padding: 0.75rem 1rem; font-weight: 700;">
                  <i class="fa-solid fa-diamond-turn-right"></i> Buka Petunjuk Arah
                </a>
                <button type="button" class="btn btn-outline" onclick="App.copyLocationAddress()" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1rem; font-weight: 600;">
                  <i class="fa-solid fa-copy"></i> Salin Alamat
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 7: UNDUH MATERI & JUKNIS -->
      <section class="landing-section section-alt" id="materi">
        <div class="landing-section-inner">
          <div class="sec-header-modern">
            <div class="sec-header-left">
              <span class="sec-kicker sec-kicker-blue"><i class="fa-solid fa-file-arrow-down"></i> DOKUMEN & PANDUAN</span>
              <h2 class="sec-title">Unduh Materi & Juknis Jumbara</h2>
            </div>
            <div class="sec-header-right">
              <span class="sec-meta-badge"><i class="fa-solid fa-cloud-arrow-down"></i> Akses Terbuka Kontingen</span>
            </div>
          </div>

          <!-- Filter & Search Bar -->
          <div class="materials-filter-bar">
            <div class="materials-categories" id="materialsCategoryFilters">
              <button type="button" class="materi-cat-pill active" data-cat="all" onclick="App.filterMaterialsByCategory('all')">
                <i class="fa-solid fa-layer-group"></i> Semua Kategori
              </button>
              <button type="button" class="materi-cat-pill" data-cat="Buku Panduan & Juknis" onclick="App.filterMaterialsByCategory('Buku Panduan & Juknis')">
                <i class="fa-solid fa-book-open"></i> Panduan & Juknis
              </button>
              <button type="button" class="materi-cat-pill" data-cat="Materi Pokok PMR" onclick="App.filterMaterialsByCategory('Materi Pokok PMR')">
                <i class="fa-solid fa-kit-medical"></i> 7 Materi Pokok
              </button>
              <button type="button" class="materi-cat-pill" data-cat="Lomba & Penilaian" onclick="App.filterMaterialsByCategory('Lomba & Penilaian')">
                <i class="fa-solid fa-trophy"></i> Lomba & Juklak
              </button>
              <button type="button" class="materi-cat-pill" data-cat="Formulir & Administrasi" onclick="App.filterMaterialsByCategory('Formulir & Administrasi')">
                <i class="fa-solid fa-file-lines"></i> Formulir Kontingen
              </button>
            </div>
            <div class="materials-search-wrap">
              <input type="text" id="materialsSearchInput" class="materials-search-input" placeholder="Cari materi, juknis, kisi-kisi..." oninput="App.searchMaterials(this.value)">
              <i class="fa-solid fa-magnifying-glass materials-search-icon"></i>
            </div>
          </div>

          <!-- Materials Grid Container -->
          <div id="publicMaterialsList">
            <p style="color: var(--text-muted); text-align: center; padding: 2rem 0;">Memuat daftar materi...</p>
          </div>
        </div>
      </section>
    `;

    this.loadPublicData();
    this.setupScrollSpy();
    if (isOpen) {
      this.startCountdownTimer(deadlineStr);
    }
    setTimeout(() => {
      this.startJumbotronCarousel();
    }, 100);
  },

  copyLocationAddress() {
    const s = this.appSettings || {};
    const textToCopy = s.event_location_address || s.contact_address || 'Jl. Gatot Subroto No. 23, Bojongbata, Kec. Pemalang, Kabupaten Pemalang';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        Utils.showToast('Alamat lokasi kegiatan berhasil disalin ke clipboard!', 'success');
      }).catch(() => {
        Utils.showToast('Alamat: ' + textToCopy, 'info');
      });
    } else {
      Utils.showToast('Alamat: ' + textToCopy, 'info');
    }
  },

  startCountdownTimer(deadlineStr) {
    if (this.countdownIntervalId) clearInterval(this.countdownIntervalId);

    const updateTimer = () => {
      const deadline = new Date(deadlineStr).getTime();
      const now = new Date().getTime();
      const diff = deadline - now;

      const bannerContainer = document.getElementById('countdownBannerContainer');
      const timeEl = document.getElementById('cdTimeStr');

      if (diff <= 0) {
        if (bannerContainer) {
          bannerContainer.className = 'reg-closed-alert';
          bannerContainer.innerHTML = '<i class="fa-solid fa-lock"></i> Pendaftaran Mandiri Resmi DITUTUP';
        }
        if (this.countdownIntervalId) clearInterval(this.countdownIntervalId);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (timeEl) {
        timeEl.textContent = `${days} Hari ${hours} Jam ${mins} Mnt ${secs} Detik`;
      }
    };

    updateTimer();
    this.countdownIntervalId = setInterval(updateTimer, 1000);
  },

  async loadPublicData() {
    try {
      const units = await API.getUnits();
      const events = await API.getEvents();
      const announcements = await API.getAnnouncements();
      const standings = await API.getStandings();
      const participantsRes = await API.getParticipants({ limit: 1 });
      const totalParticipants = participantsRes.pagination ? participantsRes.pagination.total : (Array.isArray(participantsRes) ? participantsRes.length : 0);

      const uEl = document.getElementById('statTotalUnits');
      const pEl = document.getElementById('statTotalPeserta');
      const eEl = document.getElementById('statTotalEvents');

      if (uEl) uEl.textContent = units.length.toLocaleString('id-ID');
      if (pEl) pEl.textContent = totalParticipants.toLocaleString('id-ID');
      if (eEl) eEl.textContent = events.length.toLocaleString('id-ID');

      const annContainer = document.getElementById('publicAnnouncementsList');
      if (annContainer) {
        if (!announcements.length) {
          annContainer.innerHTML = '<p style="color: var(--text-muted);">Belum ada pengumuman.</p>';
        } else {
          annContainer.innerHTML = announcements.map(a => `
            <div class="announcement-card ${a.priority === 'urgent' ? 'urgent' : ''}">
              <div class="announcement-header">
                <span class="announcement-title">${Utils.escapeHtml(a.title)}</span>
                <span class="status-badge ${a.priority === 'urgent' ? 'badge-rejected' : 'badge-unit'}">
                  ${a.priority === 'urgent' ? '🔴 URGENT' : '📢 INFORMASI'}
                </span>
              </div>
              <div class="announcement-body">${Utils.escapeHtml(a.content)}</div>
              <div class="announcement-footer">
                <i class="fa-regular fa-clock"></i>
                <span>${Utils.formatDate(a.created_at)} • oleh <strong>${Utils.escapeHtml(a.author_name || 'Sekretariat Jumbara')}</strong></span>
              </div>
            </div>
          `).join('');
        }
      }

      const evContainer = document.getElementById('publicEventsList');
      if (evContainer) {
        if (!events.length) {
          evContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem 0;">Belum ada jadwal kegiatan terdaftar.</p>';
        } else {
          const desktopTableRows = events.map(e => {
            const d = new Date(e.event_date);
            const formattedDate = !isNaN(d.getTime()) ? d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) : (e.event_date || '-');
            return `
              <tr>
                <td>
                  <div style="font-weight: 700; color: #0f172a; font-size: 0.92rem; white-space: nowrap;">
                    <i class="fa-regular fa-clock" style="color: var(--primary); margin-right: 4px;"></i> ${e.start_time || '-'} - ${e.end_time || '-'} WIB
                  </div>
                  <div style="font-size: 0.78rem; color: #64748b; margin-top: 3px; white-space: nowrap;">
                    <i class="fa-regular fa-calendar" style="margin-right: 4px;"></i> ${formattedDate}
                  </div>
                </td>
                <td>
                  <div style="font-weight: 700; color: #0f172a; font-size: 0.95rem; line-height: 1.35; margin-bottom: 4px;">
                    ${Utils.escapeHtml(e.title)}
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    ${e.category ? `<span class="badge badge-unit" style="font-size: 0.72rem; padding: 2px 7px;"><i class="fa-solid fa-tag"></i> ${Utils.escapeHtml(e.category)}</span>` : ''}
                    ${e.description ? `<span style="font-size: 0.8rem; color: #64748b;">${Utils.escapeHtml(e.description)}</span>` : ''}
                  </div>
                </td>
                <td>
                  ${Utils.getLevelBadgeHtml(e.pmr_level)}
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.4rem; color: #334155; font-size: 0.88rem;">
                    <i class="fa-solid fa-location-dot" style="color: var(--primary); font-size: 0.95rem;"></i>
                    <span>${Utils.escapeHtml(e.location || 'Buperta Utama')}</span>
                  </div>
                </td>
                <td>
                  <span style="font-size: 0.82rem; font-weight: 600; color: ${e.max_participants_per_unit > 0 ? '#b45309' : '#059669'}; white-space: nowrap;">
                    <i class="fa-solid ${e.max_participants_per_unit > 0 ? 'fa-user-lock' : 'fa-users'}"></i>
                    ${e.max_participants_per_unit > 0 ? e.max_participants_per_unit + ' / Unit' : 'Tanpa Batas'}
                  </span>
                </td>
                <td style="text-align: center;">
                  <button type="button" class="btn btn-outline btn-sm" style="font-weight: 600; font-size: 0.8rem; padding: 0.35rem 0.75rem; white-space: nowrap;" onclick="App.openRegisteredParticipantsModal(${e.id})">
                    <i class="fa-solid fa-users"></i> Lihat Peserta
                  </button>
                </td>
              </tr>
            `;
          }).join('');

          const mobileRows = events.map(e => {
            const d = new Date(e.event_date);
            const formattedDate = !isNaN(d.getTime()) ? d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) : (e.event_date || '-');
            return `
              <div class="schedule-mobile-row">
                <div class="schedule-mobile-time">
                  <span class="time-badge"><i class="fa-regular fa-clock" style="color: var(--primary);"></i> ${e.start_time || '-'} - ${e.end_time || '-'} WIB</span>
                  <span><i class="fa-regular fa-calendar"></i> ${formattedDate}</span>
                </div>
                <div class="schedule-mobile-title">${Utils.escapeHtml(e.title)}</div>
                <div class="schedule-mobile-meta">
                  <span><i class="fa-solid fa-location-dot" style="color: var(--primary);"></i> ${Utils.escapeHtml(e.location || 'Buperta')}</span>
                  ${Utils.getLevelBadgeHtml(e.pmr_level)}
                  <span style="color: ${e.max_participants_per_unit > 0 ? '#b45309' : '#059669'}; font-weight: 600; font-size: 0.8rem;">
                    <i class="fa-solid ${e.max_participants_per_unit > 0 ? 'fa-user-lock' : 'fa-users'}"></i>
                    ${e.max_participants_per_unit > 0 ? e.max_participants_per_unit + ' Peserta/Unit' : 'Tanpa Batas'}
                  </span>
                </div>
                <button type="button" class="btn btn-outline btn-sm" style="font-weight: 600; font-size: 0.8rem;" onclick="App.openRegisteredParticipantsModal(${e.id})">
                  <i class="fa-solid fa-users"></i> Lihat Peserta Terdaftar
                </button>
              </div>
            `;
          }).join('');

          evContainer.innerHTML = `
            <div class="schedule-desktop-view">
              <div class="schedule-table-wrap table-responsive">
                <table class="data-table schedule-table">
                  <thead>
                    <tr>
                      <th style="width: 170px;"><i class="fa-regular fa-clock" style="margin-right: 5px; color: var(--primary);"></i> Waktu & Tanggal</th>
                      <th><i class="fa-solid fa-list-check" style="margin-right: 5px; color: var(--primary);"></i> Agenda Kegiatan</th>
                      <th style="width: 130px;"><i class="fa-solid fa-layer-group" style="margin-right: 5px; color: var(--primary);"></i> Tingkat PMR</th>
                      <th><i class="fa-solid fa-location-dot" style="margin-right: 5px; color: var(--primary);"></i> Lokasi / Venue</th>
                      <th style="width: 140px;"><i class="fa-solid fa-user-lock" style="margin-right: 5px; color: var(--primary);"></i> Kuota</th>
                      <th style="width: 150px; text-align: center;">Daftar Peserta</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${desktopTableRows}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="schedule-mobile-view">
              ${mobileRows}
            </div>
          `;
        }
      }

      const stContainer = document.getElementById('publicStandingsList');
      if (stContainer) {
        if (!standings || !standings.length) {
          stContainer.innerHTML = '<p style="color: var(--text-muted);">Belum ada data klasemen medali.</p>';
        } else {
          const top3 = standings.slice(0, 3);

          const podiumHtml = top3.length ? `
            <div class="podium-grid">
              ${top3[0] ? `
                <div class="podium-card gold">
                  <div class="podium-badge podium-gold-badge">🥇</div>
                  <div class="podium-unit-name">${Utils.escapeHtml(top3[0].unit_name)}</div>
                  <div style="font-size: 0.8rem; color: #d97706; font-weight: 800; margin-bottom: 0.5rem;">JUARA I KLASEMEN</div>
                  <div class="podium-scores">
                    <span class="medal-badge medal-emas">🥇 ${top3[0].emas || 0}</span>
                    <span class="medal-badge medal-perak">🥈 ${top3[0].perak || 0}</span>
                    <span class="medal-badge medal-perunggu">🥉 ${top3[0].perunggu || 0}</span>
                  </div>
                </div>
              ` : ''}

              ${top3[1] ? `
                <div class="podium-card silver">
                  <div class="podium-badge podium-silver-badge">🥈</div>
                  <div class="podium-unit-name">${Utils.escapeHtml(top3[1].unit_name)}</div>
                  <div style="font-size: 0.8rem; color: #64748b; font-weight: 800; margin-bottom: 0.5rem;">JUARA II KLASEMEN</div>
                  <div class="podium-scores">
                    <span class="medal-badge medal-emas">🥇 ${top3[1].emas || 0}</span>
                    <span class="medal-badge medal-perak">🥈 ${top3[1].perak || 0}</span>
                    <span class="medal-badge medal-perunggu">🥉 ${top3[1].perunggu || 0}</span>
                  </div>
                </div>
              ` : ''}

              ${top3[2] ? `
                <div class="podium-card bronze">
                  <div class="podium-badge podium-bronze-badge">🥉</div>
                  <div class="podium-unit-name">${Utils.escapeHtml(top3[2].unit_name)}</div>
                  <div style="font-size: 0.8rem; color: #b45309; font-weight: 800; margin-bottom: 0.5rem;">JUARA III KLASEMEN</div>
                  <div class="podium-scores">
                    <span class="medal-badge medal-emas">🥇 ${top3[2].emas || 0}</span>
                    <span class="medal-badge medal-perak">🥈 ${top3[2].perak || 0}</span>
                    <span class="medal-badge medal-perunggu">🥉 ${top3[2].perunggu || 0}</span>
                  </div>
                </div>
              ` : ''}
            </div>
          ` : '';

          const tableRows = standings.map((s, idx) => `
            <tr>
              <td><strong>#${idx + 1}</strong></td>
              <td><strong>${Utils.escapeHtml(s.unit_name)}</strong></td>
              <td><span class="medal-badge medal-emas">🥇 ${s.emas || 0}</span></td>
              <td><span class="medal-badge medal-perak">🥈 ${s.perak || 0}</span></td>
              <td><span class="medal-badge medal-perunggu">🥉 ${s.perunggu || 0}</span></td>
            </tr>
          `).join('');

          const standingsDesktopTable = `
            <div class="standings-desktop-table table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Peringkat</th>
                    <th>Kontingen Unit PMR</th>
                    <th>🥇 Emas</th>
                    <th>🥈 Perak</th>
                    <th>🥉 Perunggu</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>
          `;

          const standingsMobileCards = `
            <div class="standings-mobile-cards">
              ${standings.map((s, idx) => `
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); width: 100%; box-sizing: border-box;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                    <strong style="font-size: 0.95rem; color: var(--secondary);">#${idx + 1} ${Utils.escapeHtml(s.unit_name)}</strong>
                  </div>
                  <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                    <span class="medal-badge medal-emas">🥇 ${s.emas || 0} Emas</span>
                    <span class="medal-badge medal-perak">🥈 ${s.perak || 0} Perak</span>
                    <span class="medal-badge medal-perunggu">🥉 ${s.perunggu || 0} Perunggu</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `;

          stContainer.innerHTML = podiumHtml + standingsDesktopTable + standingsMobileCards;
        }
      }

      const unContainer = document.getElementById('publicUnitsList');
      if (unContainer) {
        const unitsDesktopTable = `
          <div class="master-unit-desktop-table table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Kode Unit</th>
                  <th>Nama Unit Sekolah</th>
                  <th>Tingkat PMR</th>
                  <th>Pembina PMR</th>
                  <th>Kontak / WhatsApp</th>
                  <th>Alamat Sekolah</th>
                </tr>
              </thead>
              <tbody>
                ${units.map(u => {
          const cleanPhone = u.phone ? u.phone.replace(/[^0-9]/g, '') : '';
          const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone}` : null;
          return `
                    <tr>
                      <td><code>${u.code}</code></td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <i class="fa-solid fa-school" style="color: var(--secondary);"></i>
                          <strong>${Utils.escapeHtml(u.name)}</strong>
                        </div>
                      </td>
                      <td>${Utils.getLevelBadgeHtml(u.level_category)}</td>
                      <td><i class="fa-solid fa-user-tie" style="color: #64748b; margin-right: 0.3rem;"></i> ${Utils.escapeHtml(u.pembina_name)}</td>
                      <td>
                        ${waLink ? `
                          <a href="${waLink}" target="_blank" style="color: #0d9488; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 0.3rem;">
                            <i class="fa-brands fa-whatsapp" style="color: #25D366; font-size: 1rem;"></i> ${Utils.escapeHtml(u.phone)}
                          </a>
                        ` : '<span style="color: var(--text-muted);">-</span>'}
                      </td>
                      <td style="font-size: 0.85rem; color: #475569;">
                        ${u.address ? `<i class="fa-solid fa-location-dot" style="color: #ef4444; margin-right: 0.3rem;"></i>${Utils.escapeHtml(u.address)}` : '-'}
                      </td>
                    </tr>
                  `;
        }).join('')}
              </tbody>
            </table>
          </div>
        `;

        const unitsMobileCards = `
          <div class="master-unit-mobile-cards">
            ${units.map(u => {
          const cleanPhone = u.phone ? u.phone.replace(/[^0-9]/g, '') : '';
          const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone}` : null;
          return `
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); width: 100%; box-sizing: border-box;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
                    <code style="font-weight: 800; color: var(--primary); font-size: 0.85rem;">${u.code}</code>
                    ${Utils.getLevelBadgeHtml(u.level_category)}
                  </div>
                  <strong style="font-size: 0.95rem; color: #0f172a; display: block; margin-bottom: 0.3rem; word-break: break-word;">${Utils.escapeHtml(u.name)}</strong>
                  <div style="font-size: 0.78rem; color: #475569; margin-bottom: 0.3rem;">
                    <i class="fa-solid fa-user-tie" style="color: #64748b;"></i> Pembina: <strong>${Utils.escapeHtml(u.pembina_name)}</strong>
                    ${waLink ? `<br><a href="${waLink}" target="_blank" style="color: #0d9488; font-weight: 600; text-decoration: none;"><i class="fa-brands fa-whatsapp" style="color: #25D366;"></i> ${Utils.escapeHtml(u.phone)}</a>` : ''}
                  </div>
                  ${u.address ? `<div style="font-size: 0.75rem; color: #64748b;"><i class="fa-solid fa-location-dot" style="color: #ef4444;"></i> ${Utils.escapeHtml(u.address)}</div>` : ''}
                </div>
              `;
        }).join('')}
          </div>
        `;

        unContainer.innerHTML = unitsDesktopTable + unitsMobileCards;
      }

      // Load Materials & Documents
      await this.loadPublicMaterials();

    } catch (e) {
      console.error('Error loading public data:', e);
    }
  },

  // =========================================================================
  // HELPER METHODS: DOKUMEN & MATERI JUMBARA
  // =========================================================================
  async loadPublicMaterials() {
    const container = document.getElementById('publicMaterialsList');
    if (!container) return;
    try {
      const res = await API.getMaterials();
      this.cachedMaterials = Array.isArray(res) ? res : (res.data || []);
      this.renderFilteredMaterials();
    } catch (e) {
      console.error('Error loading materials:', e);
      if (container) {
        container.innerHTML = `<div style="background: #fff; border: 1px dashed #fca5a5; border-radius: 12px; padding: 2.5rem; text-align: center; color: #ef4444;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; margin-bottom: 0.75rem;"></i>
          <h4 style="font-weight: 700; margin-bottom: 0.35rem;">Gagal Memuat Materi</h4>
          <p style="color: #64748b; font-size: 0.88rem;">${Utils.escapeHtml(e.message || 'Terjadi kesalahan sistem.')}</p>
        </div>`;
      }
    }
  },

  filterMaterialsByCategory(category) {
    this.selectedMaterialCategory = category;
    document.querySelectorAll('.materi-cat-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-cat') === category || (category === 'all' && btn.getAttribute('data-cat') === 'all'));
    });
    const searchVal = document.getElementById('materialsSearchInput') ? document.getElementById('materialsSearchInput').value : '';
    this.renderFilteredMaterials(searchVal);
  },

  searchMaterials(keyword) {
    this.renderFilteredMaterials(keyword);
  },

  renderFilteredMaterials(keyword = '') {
    const container = document.getElementById('publicMaterialsList');
    if (!container) return;

    let list = this.cachedMaterials || [];
    if (this.selectedMaterialCategory && this.selectedMaterialCategory !== 'all') {
      list = list.filter(m => m.category === this.selectedMaterialCategory);
    }

    if (keyword && keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      list = list.filter(m => 
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.category && m.category.toLowerCase().includes(q)) ||
        (m.file_type && m.file_type.toLowerCase().includes(q))
      );
    }

    if (!list.length) {
      container.innerHTML = `
        <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 3rem 1.5rem; text-align: center; grid-column: 1 / -1;">
          <i class="fa-solid fa-folder-open" style="font-size: 2.75rem; color: #94a3b8; margin-bottom: 0.75rem; display: block;"></i>
          <h4 style="font-size: 1.1rem; color: #334155; margin-bottom: 0.35rem; font-weight: 700;">Materi Tidak Ditemukan</h4>
          <p style="color: #64748b; font-size: 0.88rem; max-width: 450px; margin: 0 auto;">
            ${keyword ? `Tidak ada materi yang sesuai dengan pencarian "<strong>${Utils.escapeHtml(keyword)}</strong>".` : 'Belum ada dokumen materi untuk kategori ini.'}
          </p>
        </div>
      `;
      return;
    }

    const typeIcons = {
      'pdf': 'fa-solid fa-file-pdf',
      'doc': 'fa-solid fa-file-word',
      'docx': 'fa-solid fa-file-word',
      'ppt': 'fa-solid fa-file-powerpoint',
      'pptx': 'fa-solid fa-file-powerpoint',
      'xls': 'fa-solid fa-file-excel',
      'xlsx': 'fa-solid fa-file-excel',
      'zip': 'fa-solid fa-file-zipper',
      'rar': 'fa-solid fa-file-zipper'
    };

    container.innerHTML = `
      <div class="materials-grid">
        ${list.map(m => {
          const ext = (m.file_type || (m.file_url ? m.file_url.split('.').pop() : 'pdf')).toLowerCase();
          const iconCls = typeIcons[ext] || 'fa-solid fa-file-lines';
          const typeCls = `type-${ext}`;
          const isFeatured = m.is_featured == 1;

          return `
            <div class="material-card" id="materialCard_${m.id}">
              <div>
                <div class="material-card-top">
                  <div class="material-type-icon ${typeCls}">
                    <i class="${iconCls}"></i>
                  </div>
                  <div class="material-header-info">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; margin-bottom: 0.35rem;">
                      <span class="material-cat-badge">${Utils.escapeHtml(m.category || 'Panduan')}</span>
                      ${isFeatured ? '<span class="status-badge badge-unit" style="font-size: 0.7rem; padding: 2px 7px;"><i class="fa-solid fa-star"></i> PENTING</span>' : ''}
                    </div>
                    <h3 class="material-title">${Utils.escapeHtml(m.title)}</h3>
                  </div>
                </div>

                <p class="material-desc">${Utils.escapeHtml(m.description || 'Dokumen panduan resmi kegiatan JUMBARA PMI.')}</p>
              </div>

              <div class="material-card-bottom">
                <div class="material-meta-items">
                  <span class="material-meta-item" title="Ukuran File">
                    <i class="fa-regular fa-hard-drive"></i> ${Utils.escapeHtml(m.file_size || 'Dokumen')}
                  </span>
                  <span class="material-meta-item" title="Jumlah Diunduh">
                    <i class="fa-solid fa-download"></i> <span id="materiDlCount_${m.id}">${Number(m.download_count || 0).toLocaleString('id-ID')}</span>x
                  </span>
                </div>

                <button type="button" class="btn-download-materi" onclick="App.handleMaterialDownload(${m.id}, '${m.file_url}', '${Utils.escapeHtml(m.title)}')">
                  <i class="fa-solid fa-arrow-down-to-bracket"></i> Unduh
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  async handleMaterialDownload(id, fileUrl, title) {
    try {
      Utils.showToast(`Memulai unduhan: ${title}...`, 'info');
      API.trackMaterialDownload(id).then(res => {
        if (res && res.download_count !== undefined) {
          const el = document.getElementById(`materiDlCount_${id}`);
          if (el) el.textContent = Number(res.download_count).toLocaleString('id-ID');
        }
      }).catch(e => console.warn('Download tracking error:', e));

      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', '');
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Download error:', e);
      window.open(fileUrl, '_blank');
    }
  },

  // =========================================================================
  // HELPER METHODS: KOTAK SARAN & ASPIRASI
  // =========================================================================
  setFeedbackRating(val, context = 'landing') {
    val = parseInt(val, 10) || 5;
    if (val < 1) val = 1;
    if (val > 5) val = 5;

    this.feedbackRating = this.feedbackRating || {};
    this.feedbackRating[context] = val;

    const ratingValInput = document.getElementById(`${context}FeedbackRatingVal`);
    if (ratingValInput) ratingValInput.value = val;

    const starPicker = document.getElementById(`${context}StarPicker`);
    if (starPicker) {
      const stars = starPicker.querySelectorAll('.star-btn');
      stars.forEach((btn, idx) => {
        btn.classList.toggle('active', idx < val);
      });
    }

    const ratingLabels = {
      1: '1 Bintang (Perlu Evaluasi Serius)',
      2: '2 Bintang (Kurang Memuaskan)',
      3: '3 Bintang (Cukup Baik)',
      4: '4 Bintang (Memuaskan)',
      5: '5 Bintang (Sangat Memuaskan)'
    };

    const textEl = document.getElementById(`${context}FeedbackRatingText`);
    if (textEl) {
      textEl.textContent = ratingLabels[val] || `${val} Bintang`;
    }
  },

  toggleFeedbackAnon(context = 'landing') {
    const isAnonCheckbox = document.getElementById(`${context}FeedbackIsAnon`);
    const nameInput = document.getElementById(`${context}FeedbackSenderName`);
    if (!isAnonCheckbox || !nameInput) return;

    if (isAnonCheckbox.checked) {
      nameInput.dataset.prevVal = nameInput.value;
      nameInput.value = 'Anonim (Rahasia)';
      nameInput.disabled = true;
      nameInput.style.backgroundColor = '#f1f5f9';
      nameInput.style.color = '#64748b';
    } else {
      nameInput.value = nameInput.dataset.prevVal || '';
      nameInput.disabled = false;
      nameInput.style.backgroundColor = '';
      nameInput.style.color = '';
    }
  },

  openFeedbackModal() {
    this.openModal('feedbackModal');
  },

  async handleFeedbackSubmit(event, context = 'landing') {
    if (event) event.preventDefault();

    const isAnon = document.getElementById(`${context}FeedbackIsAnon`)?.checked ? 1 : 0;
    const senderName = isAnon ? 'Anonim' : (document.getElementById(`${context}FeedbackSenderName`)?.value.trim() || 'Anonim');
    const role = document.getElementById(`${context}FeedbackRole`)?.value || 'Peserta PMR';
    const category = document.getElementById(`${context}FeedbackCategory`)?.value || 'Saran Umum & Inovasi';
    const unitName = document.getElementById(`${context}FeedbackUnitName`)?.value.trim() || '';
    const rating = parseInt(document.getElementById(`${context}FeedbackRatingVal`)?.value, 10) || 5;
    const message = document.getElementById(`${context}FeedbackMessage`)?.value.trim();

    const alertBox = document.getElementById(`${context}FeedbackAlert`);
    const submitBtn = document.getElementById(`${context}FeedbackSubmitBtn`) || (event ? event.target.querySelector('button[type="submit"]') : null);

    if (!message || message.length < 5) {
      if (alertBox) {
        alertBox.className = 'alert alert-danger';
        alertBox.style.display = 'block';
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#b91c1c';
        alertBox.style.border = '1px solid #fca5a5';
        alertBox.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Mohon tuliskan pesan saran Anda minimal 5 karakter.';
      }
      return;
    }

    const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirimkan...';
    }

    try {
      const res = await API.submitFeedback({
        sender_name: senderName,
        is_anonymous: isAnon,
        sender_role: role,
        unit_name: unitName,
        category: category,
        rating: rating,
        message: message
      });

      if (alertBox) {
        alertBox.className = 'alert alert-success';
        alertBox.style.display = 'block';
        alertBox.style.background = '#ecfdf5';
        alertBox.style.color = '#047857';
        alertBox.style.border = '1px solid #a7f3d0';
        alertBox.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${Utils.escapeHtml(res.message || 'Terima kasih! Saran & aspirasi Anda berhasil dikirimkan ke Panitia Jumbara.')}`;
      }

      Utils.showToast('Saran & aspirasi Anda berhasil dikirimkan!', 'success');

      // Reset form fields
      const msgInput = document.getElementById(`${context}FeedbackMessage`);
      if (msgInput) msgInput.value = '';
      const unitInput = document.getElementById(`${context}FeedbackUnitName`);
      if (unitInput) unitInput.value = '';
      const anonCheck = document.getElementById(`${context}FeedbackIsAnon`);
      if (anonCheck) {
        anonCheck.checked = false;
        this.toggleFeedbackAnon(context);
      }
      const nameInput = document.getElementById(`${context}FeedbackSenderName`);
      if (nameInput) nameInput.value = '';

      this.setFeedbackRating(5, context);

      if (context === 'modal') {
        setTimeout(() => {
          this.closeModal('feedbackModal');
          if (alertBox) alertBox.style.display = 'none';
        }, 1800);
      }
    } catch (err) {
      console.error('Feedback submit error:', err);
      if (alertBox) {
        alertBox.className = 'alert alert-danger';
        alertBox.style.display = 'block';
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#b91c1c';
        alertBox.style.border = '1px solid #fca5a5';
        alertBox.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${Utils.escapeHtml(err.message || 'Gagal mengirim saran. Silakan coba kembali.')}`;
      }
      Utils.showToast(err.message || 'Gagal mengirimkan saran', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
      }
    }
  },

  // =========================================================================
  // VIEW 2: PESERTA PORTAL VIEW
  // =========================================================================
  switchPesertaMobileTab(tabId) {
    document.querySelectorAll('.peserta-tab-btn, .peserta-segmented-btn').forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active', isActive);
      if (btn.classList.contains('peserta-segmented-btn')) {
        btn.style.background = isActive ? '#0284c7' : 'transparent';
        btn.style.color = isActive ? '#ffffff' : '#64748b';
      } else {
        btn.style.background = isActive ? '#0284c7' : '#f1f5f9';
        btn.style.color = isActive ? '#ffffff' : '#475569';
      }
    });

    const secBio = document.getElementById('pesertaTabBio');
    const secLomba = document.getElementById('pesertaTabLomba');
    const secAgenda = document.getElementById('pesertaTabAgenda');
    const secPresensi = document.getElementById('pesertaTabPresensi');
    const secMedali = document.getElementById('pesertaTabMedali');

    if (secBio) secBio.style.display = (tabId === 'bio') ? 'block' : 'none';
    if (secLomba) secLomba.style.display = (tabId === 'lomba') ? 'block' : 'none';
    if (secAgenda) secAgenda.style.display = (tabId === 'agenda') ? 'block' : 'none';
    if (secPresensi) secPresensi.style.display = (tabId === 'presensi') ? 'block' : 'none';
    if (secMedali) secMedali.style.display = (tabId === 'medali') ? 'block' : 'none';

    if (tabId === 'presensi') {
      this.loadPesertaMyAttendanceLog();
    } else if (tabId === 'medali') {
      this.loadPesertaStandingsMobile();
    }
  },

  // =========================================================================
  // VIEW 2: PESERTA PORTAL VIEW (ULTRA MODERN NATIVE MOBILE APP UI)
  // =========================================================================
  async renderPesertaPortal(container) {
    container.innerHTML = `
      <div class="peserta-mobile-wrapper">
        <div id="pesertaProfileContent">
          <div style="background: #ffffff; border-radius: 20px; padding: 2rem; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: #0284c7; margin-bottom: 0.75rem;"></i>
            <p style="color: var(--text-muted); font-weight: 600;">Memuat Portal Mobile Peserta PMR...</p>
          </div>
        </div>
      </div>
    `;

    try {
      const profile = await API.getParticipantMe();
      const events = await API.getEvents().catch(() => []);

      const content = document.getElementById('pesertaProfileContent');
      if (!content) return;

      let subCategoriesArr = [];
      if (Array.isArray(profile.sub_categories)) {
        subCategoriesArr = profile.sub_categories;
      } else if (typeof profile.sub_categories === 'string' && profile.sub_categories.trim() !== '') {
        try {
          subCategoriesArr = JSON.parse(profile.sub_categories) || [];
        } catch (e) {
          subCategoriesArr = [];
        }
      }

      // Progress Tracker State
      const isUnitDone = profile.status === 'verified_unit' || profile.status === 'verified_kabupaten';
      const isKabDone = profile.status === 'verified_kabupaten';

      content.innerHTML = `
        <div class="peserta-mobile-card">
          
          <!-- NATIVE MOBILE HERO BANNER -->
          <div class="peserta-hero-banner">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <img src="${this.appSettings.app_logo || 'frontend/images/logo-pmi.svg'}" alt="Logo PMI" style="height: 28px; width: auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <div>
                  <div style="font-size: 0.72rem; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px; text-transform: uppercase;">Portal Mobile Peserta</div>
                  <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 600;">JUMBARA PMR PMI KABUPATEN</div>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <button onclick="App.openChangePasswordModal()" style="background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); color: #ffffff; padding: 0.35rem 0.65rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;" title="Ganti Password Akun">
                  <i class="fa-solid fa-key"></i> Pass
                </button>
                <button onclick="App.handleLogout()" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239,68,68,0.4); color: #fca5a5; padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; transition: all 0.2s;" title="Keluar dari Portal">
                  <i class="fa-solid fa-right-from-bracket"></i> Keluar
                </button>
              </div>
            </div>

            <!-- PROFILE INFO MAIN GRID -->
            <div style="display: flex; gap: 1.1rem; align-items: center;">
              <div style="position: relative; flex-shrink: 0;">
                <img src="${profile.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" 
                     alt="Foto" class="peserta-avatar-img"
                     onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'">
                <span style="position: absolute; bottom: -4px; right: -4px; background: ${isKabDone ? '#22c55e' : (isUnitDone ? '#3b82f6' : '#f59e0b')}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #090d16; box-shadow: 0 2px 6px rgba(0,0,0,0.4);" title="Status Verifikasi"></span>
              </div>

              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 600; margin-bottom: 0.15rem;">Selamat Datang 👋</div>
                <h3 style="font-size: 1.2rem; font-weight: 800; color: #ffffff; margin-bottom: 0.3rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">
                  ${Utils.escapeHtml(profile.full_name || 'Peserta PMR')}
                </h3>
                
                <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.45rem;">
                  <span style="background: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.4); color: #7dd3fc; font-weight: 800; font-size: 0.78rem; padding: 0.15rem 0.65rem; border-radius: 12px; display: inline-flex; align-items: center; gap: 0.3rem;">
                    <i class="fa-solid fa-qrcode"></i> ${profile.code || '-'}
                  </span>
                  ${Utils.getLevelBadgeHtml(profile.level || 'Peserta')}
                </div>

                <div style="font-size: 0.8rem; color: #cbd5e1; display: flex; align-items: center; gap: 0.4rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  <i class="fa-solid fa-school" style="color: #38bdf8;"></i> ${Utils.escapeHtml(profile.unit_name || 'Kontingen Unit Sekolah')}
                </div>
              </div>
            </div>
          </div>

          <!-- VERIFICATION STATUS STEPPER TIMELINE -->
          <div style="background: #f8fafc; padding: 1.1rem 1.25rem; border-bottom: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-size: 0.78rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem;">
                <i class="fa-solid fa-clipboard-check" style="color: #0284c7;"></i> Status Verifikasi Pendaftaran
              </span>
              ${Utils.getStatusBadgeHtml(profile.status || 'pending_unit')}
            </div>

            <!-- Stepper Grid Bar -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; text-align: center;">
              <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 0.6rem 0.3rem; border-radius: 12px; box-shadow: 0 2px 4px rgba(16,185,129,0.05);">
                <div style="font-size: 0.7rem; font-weight: 800; color: #059669; text-transform: uppercase;">1. Registrasi</div>
                <div style="font-size: 0.78rem; color: #047857; font-weight: 800; margin-top: 0.15rem;">✓ Mandiri</div>
              </div>

              <div style="background: ${isUnitDone ? '#eff6ff' : '#fffbeb'}; border: 1px solid ${isUnitDone ? '#bfdbfe' : '#fef08a'}; padding: 0.6rem 0.3rem; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
                <div style="font-size: 0.7rem; font-weight: 800; color: ${isUnitDone ? '#1d4ed8' : '#b45309'}; text-transform: uppercase;">2. Validasi Unit</div>
                <div style="font-size: 0.78rem; color: ${isUnitDone ? '#1e40af' : '#d97706'}; font-weight: 800; margin-top: 0.15rem;">${isUnitDone ? '✓ Disetujui' : '⏳ Menunggu'}</div>
              </div>

              <div style="background: ${isKabDone ? '#ecfdf5' : '#f8fafc'}; border: 1px solid ${isKabDone ? '#a7f3d0' : '#cbd5e1'}; padding: 0.6rem 0.3rem; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="font-size: 0.7rem; font-weight: 800; color: ${isKabDone ? '#059669' : '#64748b'}; text-transform: uppercase;">3. PMI Kab.</div>
                <div style="font-size: 0.78rem; color: ${isKabDone ? '#047857' : '#94a3b8'}; font-weight: 800; margin-top: 0.15rem;">${isKabDone ? '🟢 Verified' : '⚙️ Proses'}</div>
              </div>
            </div>

            ${profile.status === 'revision' ? `
              <div style="background: #fffbebf5; border: 1px solid #fde68a; color: #92400e; padding: 0.85rem; border-radius: 14px; margin-top: 0.85rem; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.12);">
                <div style="display: flex; align-items: center; gap: 0.4rem; font-weight: 800; color: #b45309; margin-bottom: 0.3rem;">
                  <i class="fa-solid fa-triangle-exclamation" style="color: #d97706; font-size: 1rem;"></i> PERBAIKAN DATA / REVISI BERKAS DIBUTUHKAN:
                </div>
                <p style="margin: 0.2rem 0 0.6rem 0; color: #78350f; font-size: 0.82rem; line-height: 1.4;">
                  Catatan Verifikator: <em>"${Utils.escapeHtml(profile.reject_reason || 'Harap unggah ulang dokumen pas foto atau surat tugas Anda.')}"</em>
                </p>
                <button class="btn btn-warning btn-sm" onclick="App.openEditProfileModal()" style="background: #d97706; border-color: #d97706; color: white; width: 100%; justify-content: center; font-weight: 800; border-radius: 10px; padding: 0.5rem;">
                  <i class="fa-solid fa-pen-to-square"></i> Perbaiki Data & Unggah Ulang Berkas
                </button>
              </div>
            ` : ''}

            ${profile.status === 'rejected' ? `
              <div style="background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 0.85rem; border-radius: 14px; margin-top: 0.85rem; font-size: 0.85rem;">
                <strong><i class="fa-solid fa-circle-xmark"></i> Pendaftaran Ditolak:</strong> ${Utils.escapeHtml(profile.reject_reason || 'Mohon hubungi Pembina Unit Sekolah Anda.')}
              </div>
            ` : ''}
          </div>

          <!-- QUICK ACTION 4-GRID MOBILE WIDGETS -->
          <div style="padding: 1.1rem 1.25rem; background: #ffffff; border-bottom: 1px solid #e2e8f0;">
            <div style="font-size: 0.78rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem;">
              Fitur & Layanan Peserta:
            </div>
            
            <div class="peserta-action-grid">
              <div class="peserta-action-card" onclick="App.openIDCardModal(${profile.id})">
                <i class="fa-solid fa-id-card" style="color: #0284c7;"></i>
                <span style="font-size: 0.8rem; font-weight: 800; color: #0f172a;">Kartu ID & QR</span>
                <span style="font-size: 0.68rem; color: #64748b;">Pratinjau & Cetak</span>
              </div>

              <div class="peserta-action-card" onclick="App.downloadRegistrationFormPDF()">
                <i class="fa-solid fa-file-pdf" style="color: #dc2626;"></i>
                <span style="font-size: 0.8rem; font-weight: 800; color: #0f172a;">Unduh Form PDF</span>
                <span style="font-size: 0.68rem; color: #64748b;">Bukti Registrasi</span>
              </div>

              <div class="peserta-action-card" onclick="App.switchPesertaMobileTab('agenda')">
                <i class="fa-solid fa-calendar-days" style="color: #d97706;"></i>
                <span style="font-size: 0.8rem; font-weight: 800; color: #0f172a;">Agenda Jumbara</span>
                <span style="font-size: 0.68rem; color: #64748b;">Rundown Kegiatan</span>
              </div>

              <div class="peserta-action-card" onclick="App.switchPesertaMobileTab('presensi')">
                <i class="fa-solid fa-clipboard-user" style="color: #16a34a;"></i>
                <span style="font-size: 0.8rem; font-weight: 800; color: #0f172a;">Log Presensi</span>
                <span style="font-size: 0.68rem; color: #64748b;">Riwayat Check-In</span>
              </div>

              <div class="peserta-action-card" onclick="App.switchPesertaMobileTab('medali')">
                <i class="fa-solid fa-trophy" style="color: #eab308;"></i>
                <span style="font-size: 0.8rem; font-weight: 800; color: #0f172a;">Klasemen Medali</span>
                <span style="font-size: 0.68rem; color: #64748b;">Pantau Medali</span>
              </div>

              <div class="peserta-action-card" onclick="App.openChangePasswordModal()">
                <i class="fa-solid fa-key" style="color: #6366f1;"></i>
                <span style="font-size: 0.8rem; font-weight: 800; color: #0f172a;">Keamanan Akun</span>
                <span style="font-size: 0.68rem; color: #64748b;">Ganti Password</span>
              </div>
            </div>
          </div>

          <!-- MOBILE SEGMENTED PILL TAB SWITCHER -->
          <div style="padding: 1.1rem 1.25rem 0 1.25rem; background: #ffffff;">
            <div class="peserta-segmented-bar">
              <button class="peserta-segmented-btn active" data-tab="bio" onclick="App.switchPesertaMobileTab('bio')">
                <i class="fa-solid fa-address-card"></i> Biodata
              </button>
              <button class="peserta-segmented-btn" data-tab="lomba" onclick="App.switchPesertaMobileTab('lomba')">
                <i class="fa-solid fa-award"></i> Cabang
              </button>
              <button class="peserta-segmented-btn" data-tab="agenda" onclick="App.switchPesertaMobileTab('agenda')">
                <i class="fa-solid fa-calendar-check"></i> Agenda
              </button>
              <button class="peserta-segmented-btn" data-tab="presensi" onclick="App.switchPesertaMobileTab('presensi')">
                <i class="fa-solid fa-history"></i> Presensi
              </button>
              <button class="peserta-segmented-btn" data-tab="medali" onclick="App.switchPesertaMobileTab('medali')">
                <i class="fa-solid fa-trophy"></i> Medali
              </button>
            </div>
          </div>

          <!-- MOBILE TAB CONTENT PANELS -->
          <div style="padding: 1.25rem;">
            
            <!-- TAB 1: BIODATA LENGKAP -->
            <div id="pesertaTabBio" style="display: block;">
              
              <!-- CARD 1: INFORMASI IDENTITAS -->
              <div class="peserta-info-card">
                <div class="peserta-info-header">
                  <i class="fa-solid fa-id-badge" style="color: #0284c7;"></i> 1. Identitas Peserta Jumbara
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Kode Registrasi</span>
                  <span class="peserta-detail-val" style="color: #0284c7; font-weight: 800;">${profile.code || '-'}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Kategori Pendaftaran</span>
                  <span class="peserta-detail-val">${Utils.escapeHtml(profile.registration_type || 'Peserta PMR')}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Tingkat PMR / Unsur</span>
                  <span class="peserta-detail-val">${Utils.getLevelBadgeHtml(profile.level || 'Wira')}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Kontingen Unit Sekolah</span>
                  <span class="peserta-detail-val">${Utils.escapeHtml(profile.unit_name || '-')}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">NISN / NIK Identitas</span>
                  <span class="peserta-detail-val">${Utils.escapeHtml(profile.nisn || '-')}</span>
                </div>
              </div>

              <!-- CARD 2: DATA PRIBADI & KONTAK -->
              <div class="peserta-info-card">
                <div class="peserta-info-header">
                  <i class="fa-solid fa-user" style="color: #0284c7;"></i> 2. Biodata Pribadi & Kontak
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Jenis Kelamin</span>
                  <span class="peserta-detail-val">${profile.gender === 'P' ? 'Perempuan (P)' : 'Laki-laki (L)'}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Agama</span>
                  <span class="peserta-detail-val">${Utils.escapeHtml(profile.religion || '-')}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Golongan Darah</span>
                  <span class="peserta-detail-val">Golongan ${Utils.escapeHtml(profile.blood_type || '-')}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Tempat, Tgl Lahir</span>
                  <span class="peserta-detail-val">${Utils.escapeHtml(profile.birth_place || '-')}, ${profile.birth_date ? Utils.formatDate(profile.birth_date) : '-'}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Status Disabilitas</span>
                  <span class="peserta-detail-val">${profile.is_disabled === 'Ya' ? 'Disabilitas (' + Utils.escapeHtml(profile.disability_type || '-') + ')' : 'Non-Disabilitas'}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Alamat Lengkap</span>
                  <span class="peserta-detail-val" style="max-width: 60%;">${Utils.escapeHtml(profile.address || '-')}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">WhatsApp HP</span>
                  <span class="peserta-detail-val" style="color: #16a34a;">📱 ${Utils.escapeHtml(profile.phone || '-')}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Email Pendaftar</span>
                  <span class="peserta-detail-val" style="color: #0284c7;">✉️ ${Utils.escapeHtml(profile.email || '-')}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Kontak Darurat (Ortu/Pembina)</span>
                  <span class="peserta-detail-val">${Utils.escapeHtml(profile.emergency_contact || '-')}</span>
                </div>
              </div>

              <!-- CARD 3: BERKAS DOKUMEN PENDUKUNG -->
              <div class="peserta-info-card">
                <div class="peserta-info-header">
                  <i class="fa-solid fa-file-shield" style="color: #0284c7;"></i> 3. Berkas Dokumen Registrasi
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.5rem;">
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.75rem; border-radius: 12px; text-align: center;">
                    <div style="font-size: 0.72rem; font-weight: 800; color: #475569; margin-bottom: 0.4rem;">Pas Foto 3x4</div>
                    <img src="${profile.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" alt="Foto" style="width: 55px; height: 70px; object-fit: cover; border-radius: 8px; border: 2px solid #cbd5e1; margin: 0 auto 0.4rem auto; display: block;">
                    <span style="font-size: 0.68rem; color: #16a34a; font-weight: 700;">✓ Tersimpan</span>
                  </div>

                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.75rem; border-radius: 12px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div style="font-size: 0.72rem; font-weight: 800; color: #475569; margin-bottom: 0.4rem;">Surat Tugas PMR</div>
                    ${profile.assignment_letter_url ? `
                      <a href="${profile.assignment_letter_url}" target="_blank" class="btn btn-outline btn-sm" style="font-size: 0.72rem; padding: 0.3rem 0.6rem; border-radius: 8px;">
                        <i class="fa-solid fa-file-pdf" style="color: #dc2626;"></i> Lihat Berkas
                      </a>
                    ` : `
                      <span style="font-size: 0.72rem; color: #94a3b8; font-style: italic;">Belum Diunggah</span>
                    `}
                  </div>
                </div>

                ${profile.status === 'revision' || profile.status === 'pending_unit' ? `
                  <button class="btn btn-outline btn-sm" onclick="App.openEditProfileModal()" style="width: 100%; justify-content: center; margin-top: 0.85rem; font-size: 0.8rem; font-weight: 700; border-color: #0284c7; color: #0284c7;">
                    <i class="fa-solid fa-pen-to-square"></i> Perbarui Data atau Unggah Ulang Berkas
                  </button>
                ` : ''}
              </div>

            </div>

            <!-- TAB 2: CABANG LOMBA / SUB KATEGORI -->
            <div id="pesertaTabLomba" style="display: none;">
              <div class="peserta-info-card">
                <div class="peserta-info-header">
                  <i class="fa-solid fa-award" style="color: #d97706;"></i> Minat Sub-Kategori Tri Bakti PMR
                </div>
                <p style="font-size: 0.82rem; color: #64748b; margin-bottom: 0.75rem;">
                  Cabang evaluasi, simulasi, dan kegiatan Tri Bakti Jumbara yang dipilih oleh peserta:
                </p>

                <div style="display: flex; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.85rem;">
                  ${subCategoriesArr.length ? subCategoriesArr.map(c => `
                    <span style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); color: #0369a1; border: 1px solid #7dd3fc; padding: 0.45rem 0.9rem; border-radius: 20px; font-size: 0.82rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.45rem; box-shadow: 0 2px 6px rgba(2,132,199,0.1);">
                      <i class="fa-solid fa-circle-check" style="color: #0284c7;"></i> ${Utils.escapeHtml(c)}
                    </span>
                  `).join('') : '<span style="color: #94a3b8; font-size: 0.85rem; font-style: italic;">Belum memilih cabang kegiatan khusus.</span>'}
                </div>

                <div style="background: #f8fafc; border-left: 3px solid #0284c7; padding: 0.75rem; border-radius: 8px; font-size: 0.78rem; color: #475569;">
                  <strong>💡 Catatan Tri Bakti PMR:</strong><br>
                  • <strong>Jumpa</strong>: Evaluasi & Kompetisi (PP, ASB, RSJR, Kepemimpinan)<br>
                  • <strong>Bakti</strong>: Pengabdian Masyarakat & Bakti Lingkungan<br>
                  • <strong>Gembira</strong>: Persahabatan, Pentas Seni & Anjangsana
                </div>
              </div>
            </div>

            <!-- TAB 3: AGENDA & RUNDOWN KEGIATAN -->
            <div id="pesertaTabAgenda" style="display: none;">
              <div class="peserta-info-card">
                <div class="peserta-info-header">
                  <i class="fa-solid fa-calendar-days" style="color: #0284c7;"></i> Rundown Jadwal Kegiatan Jumbara
                </div>
                
                <div>
                  ${events.length ? events.map(e => `
                    <div style="padding: 0.85rem; border-left: 4px solid #0284c7; background: #f8fafc; border-radius: 12px; margin-bottom: 0.75rem; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.35rem;">
                        <strong style="color: #0f172a; font-size: 0.9rem;">${Utils.escapeHtml(e.title)}</strong>
                        <span style="background: #e0f2fe; color: #0369a1; font-weight: 800; font-size: 0.72rem; padding: 0.15rem 0.55rem; border-radius: 10px; flex-shrink: 0;">
                          ${Utils.escapeHtml(e.category || 'Umum')}
                        </span>
                      </div>
                      <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.25rem;">
                        <i class="fa-solid fa-location-dot" style="color: #ef4444;"></i> ${Utils.escapeHtml(e.location)}
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
                        <span style="color: #0284c7; font-weight: 700;">
                          <i class="fa-solid fa-clock"></i> ${e.start_time} - ${e.end_time} WIB
                        </span>
                        <span style="color: #64748b;">
                          <i class="fa-solid fa-user-gear"></i> PIC: ${Utils.escapeHtml(e.pic_name || 'Panitia')}
                        </span>
                      </div>
                    </div>
                  `).join('') : '<p style="color: #94a3b8; font-size: 0.85rem; text-align: center; padding: 1rem;">Belum ada agenda kegiatan terdaftar.</p>'}
                </div>
              </div>
            </div>

            <!-- TAB 4: RIWAYAT PRESENSI SCAN -->
            <div id="pesertaTabPresensi" style="display: none;">
              <div class="peserta-info-card">
                <div class="peserta-info-header">
                  <i class="fa-solid fa-history" style="color: #16a34a;"></i> Log & Status Presensi QR Scanner
                </div>
                
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 0.85rem; border-radius: 12px; font-size: 0.82rem; margin-bottom: 0.85rem;">
                  <strong><i class="fa-solid fa-qrcode"></i> Informasi Presensi Masuk / Keluar:</strong><br>
                  Tunjukkan Kartu ID Card QR Code Anda kepada Panitia / Petugas Presensi di lokasi kegiatan untuk melakukan scan Check-In (Masuk) dan Check-Out (Keluar).
                </div>

                <div style="text-align: center; padding: 1rem 0.5rem; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1; margin-bottom: 1rem;">
                  <button type="button" class="btn btn-primary btn-sm" onclick="App.openIDCardModal(${profile.id})" style="margin: 0 auto 0.5rem auto; font-weight: 800; border-radius: 10px;">
                    <i class="fa-solid fa-id-card"></i> Tampilkan QR Code Presensi Saya
                  </button>
                  <p style="font-size: 0.75rem; color: #64748b; margin: 0;">
                    Kode QR Aktif: <strong>${profile.code || '-'}</strong>
                  </p>
                </div>

                <!-- DYNAMIC JAM MASUK & JAM KELUAR CONTAINER -->
                <div id="pesertaMyAttendanceLog"></div>
              </div>
            </div>

            <!-- TAB 5: KLASEMEN MEDALI & INFO -->
            <div id="pesertaTabMedali" style="display: none;">
              <div class="peserta-info-card">
                <div class="peserta-info-header" style="display: flex; justify-content: space-between; align-items: center;">
                  <span><i class="fa-solid fa-trophy" style="color: #eab308;"></i> Papan Klasemen & Perolehan Medali</span>
                  <button type="button" class="btn btn-outline btn-xs" onclick="App.loadPesertaStandingsMobile()" style="font-size: 0.72rem; padding: 2px 8px; border-radius: 6px;">
                    <i class="fa-solid fa-rotate"></i> Refresh
                  </button>
                </div>
                <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.75rem;">
                  Perolehan medali kontingen secara real-time dari hasil penjurian kegiatan Jumbara:
                </p>
                <div id="pesertaStandingsContainer">
                  <!-- Dynamic standings loaded by loadPesertaStandingsMobile() -->
                </div>
              </div>
            </div>

          </div>

        </div>
      `;
    } catch (err) {
      console.error('Error rendering peserta portal:', err);
      const content = document.getElementById('pesertaProfileContent');
      if (content) {
        content.innerHTML = `
          <div style="background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 1.5rem; border-radius: 16px; text-align: center; margin-top: 1rem; box-shadow: 0 4px 15px rgba(239,68,68,0.1);">
            <i class="fa-solid fa-user-lock" style="font-size: 2.5rem; color: #dc2626; margin-bottom: 0.75rem;"></i>
            <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem; color: #991b1b;">Sesi Login Diperlukan</h3>
            <p style="font-size: 0.88rem; color: #7f1d1d; margin-bottom: 1.25rem;">
              ${Utils.escapeHtml(err.message || 'Silakan login terlebih dahulu menggunakan akun pendaftaran Anda.')}
            </p>
            <button class="btn btn-primary" onclick="App.openLoginModal()" style="margin: 0 auto; display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 800; border-radius: 12px; padding: 0.6rem 1.25rem;">
              <i class="fa-solid fa-right-to-bracket"></i> Login ke Portal Peserta
            </button>
          </div>
        `;
      }
    }
  },

  async loadPesertaStandingsMobile(containerId = 'pesertaStandingsContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; color: #64748b;">
        <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.5rem; color: #eab308;"></i>
        <p style="margin-top: 0.5rem; font-size: 0.85rem;">Memuat papan perolehan medali...</p>
      </div>
    `;

    try {
      const standings = await API.getStandings();
      if (!standings || !standings.length) {
        container.innerHTML = `
          <div style="text-align: center; padding: 1.5rem; color: #94a3b8; font-size: 0.85rem;">
            <i class="fa-solid fa-award" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 0.5rem;"></i>
            <p>Data rekapitulasi medali belum diterbitkan oleh Dewan Juri.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
          ${standings.slice(0, 15).map((s, idx) => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem 0.9rem; display: flex; align-items: center; justify-content: space-between; gap: 0.65rem;">
              <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 0;">
                <span style="width: 24px; height: 24px; border-radius: 50%; background: ${idx === 0 ? '#fef08a' : (idx === 1 ? '#e2e8f0' : (idx === 2 ? '#ffedd5' : '#f1f5f9'))}; color: ${idx === 0 ? '#854d0e' : (idx === 1 ? '#475569' : (idx === 2 ? '#9a3412' : '#64748b'))}; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; flex-shrink: 0;">
                  ${idx + 1}
                </span>
                <div style="min-width: 0;">
                  <strong style="color: #0f172a; font-size: 0.82rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${Utils.escapeHtml(s.unit_name || s.name || 'Kontingen')}
                  </strong>
                  <span style="font-size: 0.7rem; color: #64748b;">${Utils.escapeHtml(s.level_category || '')}</span>
                </div>
              </div>
              <div style="display: flex; gap: 0.35rem; align-items: center; flex-shrink: 0;">
                <span title="Emas" style="background: #fef08a; color: #854d0e; font-size: 0.72rem; font-weight: 800; padding: 2px 6px; border-radius: 6px;">🥇 ${s.gold || 0}</span>
                <span title="Perak" style="background: #e2e8f0; color: #334155; font-size: 0.72rem; font-weight: 800; padding: 2px 6px; border-radius: 6px;">🥈 ${s.silver || 0}</span>
                <span title="Perunggu" style="background: #ffedd5; color: #9a3412; font-size: 0.72rem; font-weight: 800; padding: 2px 6px; border-radius: 6px;">🥉 ${s.bronze || 0}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: #ef4444; font-size: 0.8rem; text-align: center;">Gagal memuat klasemen.</p>`;
    }
  },

  // =========================================================================
  // VIEW 2.2: PENINJAU PORTAL VIEW (MOBILE DASHBOARD KHUSUS PENINJAU RESMI)
  // =========================================================================
  switchPeninjauMobileTab(tabId) {
    document.querySelectorAll('.peninjau-tab-btn, .peninjau-segmented-btn').forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active', isActive);
      btn.style.background = isActive ? '#059669' : 'transparent';
      btn.style.color = isActive ? '#ffffff' : '#64748b';
    });

    const secInfo = document.getElementById('peninjauTabInfo');
    const secAgenda = document.getElementById('peninjauTabAgenda');
    const secMedali = document.getElementById('peninjauTabMedali');
    const secLokasi = document.getElementById('peninjauTabLokasi');

    if (secInfo) secInfo.style.display = (tabId === 'info') ? 'block' : 'none';
    if (secAgenda) secAgenda.style.display = (tabId === 'agenda') ? 'block' : 'none';
    if (secMedali) secMedali.style.display = (tabId === 'medali') ? 'block' : 'none';
    if (secLokasi) secLokasi.style.display = (tabId === 'lokasi') ? 'block' : 'none';

    if (tabId === 'medali') {
      this.loadPesertaStandingsMobile('peninjauStandingsContainer');
    }
  },

  async renderPeninjauPortal(container) {
    if (!container) container = document.getElementById('mainContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="peserta-mobile-wrapper">
        <div id="peninjauProfileContent">
          <div style="background: #ffffff; border-radius: 20px; padding: 2rem; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: #059669; margin-bottom: 0.75rem;"></i>
            <p style="color: var(--text-muted); font-weight: 600;">Memuat Portal Mobile Peninjau Jumbara...</p>
          </div>
        </div>
      </div>
    `;

    try {
      const profile = await API.getParticipantMe();
      const events = await API.getEvents().catch(() => []);

      const content = document.getElementById('peninjauProfileContent');
      if (!content) return;

      const userName = profile.full_name || (this.currentUser ? this.currentUser.username : 'Peninjau Jumbara');
      const unitName = profile.unit_name || 'Peninjau Resmi PMI Kabupaten';
      const pnjCode = profile.code || 'PNJ-2026';

      content.innerHTML = `
        <div class="peserta-mobile-card">
          
          <!-- HERO BANNER PENINJAU -->
          <div class="peserta-hero-banner" style="background: linear-gradient(135deg, #064e3b 0%, #0f172a 50%, #0284c7 100%);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <img src="${this.appSettings.app_logo || 'frontend/images/logo-pmi.svg'}" alt="Logo PMI" style="height: 28px; width: auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <div>
                  <div style="font-size: 0.72rem; font-weight: 800; color: #6ee7b7; letter-spacing: 0.5px; text-transform: uppercase;">Portal Mobile Peninjau</div>
                  <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 600;">JUMBARA PMR PMI KABUPATEN</div>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <button onclick="App.openChangePasswordModal()" style="background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); color: #ffffff; padding: 0.35rem 0.65rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;" title="Ganti Password">
                  <i class="fa-solid fa-key"></i> Pass
                </button>
                <button onclick="App.handleLogout()" style="background: rgba(239, 68, 68, 0.25); border: 1px solid rgba(239,68,68,0.5); color: #fca5a5; padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;" title="Keluar dari Portal">
                  <i class="fa-solid fa-right-from-bracket"></i> Keluar
                </button>
              </div>
            </div>

            <!-- PROFILE INFO MAIN -->
            <div style="display: flex; gap: 1.1rem; align-items: center;">
              <div style="position: relative; flex-shrink: 0;">
                <img src="${profile.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}" 
                     alt="Foto Peninjau" class="peserta-avatar-img" style="border-color: #34d399;"
                     onerror="this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'">
                <span style="position: absolute; bottom: -4px; right: -4px; background: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #090d16;" title="Peninjau Resmi"></span>
              </div>

              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 0.75rem; color: #a7f3d0; font-weight: 600; margin-bottom: 0.15rem;">Selamat Datang, Bapak/Ibu Peninjau 👋</div>
                <h3 style="font-size: 1.2rem; font-weight: 800; color: #ffffff; margin-bottom: 0.3rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">
                  ${Utils.escapeHtml(userName)}
                </h3>
                
                <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.45rem;">
                  <span style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(52, 211, 153, 0.5); color: #6ee7b7; font-weight: 800; font-size: 0.78rem; padding: 0.15rem 0.65rem; border-radius: 12px; display: inline-flex; align-items: center; gap: 0.3rem;">
                    <i class="fa-solid fa-id-badge"></i> ${pnjCode}
                  </span>
                  <span style="background: #065f46; color: #ecfdf5; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.6rem; border-radius: 12px;">
                    <i class="fa-solid fa-eye"></i> Peninjau Resmi
                  </span>
                </div>

                <div style="font-size: 0.8rem; color: #cbd5e1; display: flex; align-items: center; gap: 0.4rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  <i class="fa-solid fa-building-columns" style="color: #34d399;"></i> ${Utils.escapeHtml(unitName)}
                </div>
              </div>
            </div>
          </div>

          <!-- STATUS PENINJAU NOTICE -->
          <div style="background: #f0fdf4; padding: 0.9rem 1.25rem; border-bottom: 1px solid #bbf7d0; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.8rem; font-weight: 700; color: #166534; display: flex; align-items: center; gap: 0.45rem;">
              <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i> Status Akses: Peninjau Resmi Terdaftar
            </div>
            <button onclick="App.openIDCardModal(${profile.id})" class="btn btn-outline btn-xs" style="color: #047857; border-color: #059669; font-weight: 800; font-size: 0.72rem; border-radius: 8px;">
              <i class="fa-solid fa-qrcode"></i> Kartu ID
            </button>
          </div>

          <!-- QUICK ACTION 4-GRID MOBILE WIDGETS -->
          <div style="padding: 1.1rem 1.25rem; background: #ffffff; border-bottom: 1px solid #e2e8f0;">
            <div style="font-size: 0.78rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem;">
              Layanan Peninjau Jumbara:
            </div>
            
            <div class="peserta-action-grid">
              <div class="peserta-action-card" onclick="App.openIDCardModal(${profile.id})">
                <i class="fa-solid fa-id-card" style="color: #059669;"></i>
                <span style="font-size: 0.8rem; font-weight: 800; color: #0f172a;">Kartu ID QR</span>
                <span style="font-size: 0.68rem; color: #64748b;">Akses Masuk</span>
              </div>

              <div class="peserta-action-card" onclick="App.switchPeninjauMobileTab('agenda')">
                <i class="fa-solid fa-calendar-days" style="color: #d97706;"></i>
                <span style="font-size: 0.8rem; font-weight: 800; color: #0f172a;">Jadwal Acara</span>
                <span style="font-size: 0.68rem; color: #64748b;">Rundown Kegiatan</span>
              </div>

              <div class="peserta-action-card" onclick="App.switchPeninjauMobileTab('medali')">
                <i class="fa-solid fa-trophy" style="color: #eab308;"></i>
                <span style="font-size: 0.8rem; font-weight: 800; color: #0f172a;">Klasemen</span>
                <span style="font-size: 0.68rem; color: #64748b;">Perolehan Medali</span>
              </div>

              <div class="peserta-action-card" onclick="App.switchPeninjauMobileTab('lokasi')">
                <i class="fa-solid fa-map-location-dot" style="color: #0284c7;"></i>
                <span style="font-size: 0.8rem; font-weight: 800; color: #0f172a;">Peta Buperta</span>
                <span style="font-size: 0.68rem; color: #64748b;">Lokasi & Tenda</span>
              </div>
            </div>
          </div>

          <!-- SEGMENTED TABS -->
          <div style="padding: 1.1rem 1.25rem 0 1.25rem; background: #ffffff;">
            <div class="peserta-segmented-bar">
              <button class="peninjau-segmented-btn active" data-tab="info" onclick="App.switchPeninjauMobileTab('info')" style="background: #059669; color: #ffffff;">
                <i class="fa-solid fa-user-tie"></i> Profil
              </button>
              <button class="peninjau-segmented-btn" data-tab="agenda" onclick="App.switchPeninjauMobileTab('agenda')">
                <i class="fa-solid fa-calendar-check"></i> Agenda
              </button>
              <button class="peninjau-segmented-btn" data-tab="medali" onclick="App.switchPeninjauMobileTab('medali')">
                <i class="fa-solid fa-trophy"></i> Medali
              </button>
              <button class="peninjau-segmented-btn" data-tab="lokasi" onclick="App.switchPeninjauMobileTab('lokasi')">
                <i class="fa-solid fa-map-pin"></i> Denah
              </button>
            </div>
          </div>

          <!-- TAB CONTENT PANELS -->
          <div style="padding: 1.25rem;">
            <!-- TAB 1: PROFIL & INFO PENINJAU -->
            <div id="peninjauTabInfo" style="display: block;">
              <div class="peserta-info-card">
                <div class="peserta-info-header">
                  <i class="fa-solid fa-id-badge" style="color: #059669;"></i> Identitas Resmi Peninjau
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Kode Peninjau</span>
                  <span class="peserta-detail-val" style="color: #059669; font-weight: 800;">${pnjCode}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Nama Lengkap</span>
                  <span class="peserta-detail-val" style="font-weight: 700;">${Utils.escapeHtml(userName)}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Status Penugasan</span>
                  <span class="peserta-detail-val"><span style="background: #ecfdf5; color: #047857; font-weight: 800; padding: 2px 8px; border-radius: 6px;">✓ Peninjau Terakreditasi</span></span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Asal Kontingen / Instansi</span>
                  <span class="peserta-detail-val">${Utils.escapeHtml(unitName)}</span>
                </div>
                <div class="peserta-detail-row">
                  <span class="peserta-detail-label">Nomor WhatsApp</span>
                  <span class="peserta-detail-val" style="color: #16a34a;">📱 ${Utils.escapeHtml(profile.phone || '-')}</span>
                </div>
              </div>

              <div class="peserta-info-card">
                <div class="peserta-info-header">
                  <i class="fa-solid fa-circle-info" style="color: #0284c7;"></i> Panduan Peninjau Lapangan Jumbara
                </div>
                <p style="font-size: 0.82rem; color: #475569; line-height: 1.5; margin: 0 0 0.5rem 0;">
                  Bapak/Ibu Peninjau memiliki akses peninjauan ke seluruh area perkemahan, gelanggang Tri Bakti PMR, pameran inovasi kontingen, dan posko sekretariat Jumbara.
                </p>
                <div style="background: #f8fafc; border-left: 3px solid #059669; padding: 0.75rem; border-radius: 8px; font-size: 0.78rem; color: #475569;">
                  Harap selalu mengenakan <strong>Kartu Tanda Pengenal / ID Card QR</strong> selama berada di arena Bumi Perkemahan.
                </div>
              </div>
            </div>

            <!-- TAB 2: AGENDA KEGIATAN -->
            <div id="peninjauTabAgenda" style="display: none;">
              <div class="peserta-info-card">
                <div class="peserta-info-header">
                  <i class="fa-solid fa-calendar-days" style="color: #059669;"></i> Rundown Jadwal Kegiatan Jumbara
                </div>
                <div>
                  ${events.length ? events.map(e => `
                    <div style="padding: 0.85rem; border-left: 4px solid #059669; background: #f8fafc; border-radius: 12px; margin-bottom: 0.75rem; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.35rem;">
                        <strong style="color: #0f172a; font-size: 0.9rem;">${Utils.escapeHtml(e.title)}</strong>
                        <span style="background: #ecfdf5; color: #047857; font-weight: 800; font-size: 0.72rem; padding: 0.15rem 0.55rem; border-radius: 10px; flex-shrink: 0;">
                          ${Utils.escapeHtml(e.category || 'Umum')}
                        </span>
                      </div>
                      <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.25rem;">
                        <i class="fa-solid fa-location-dot" style="color: #ef4444;"></i> ${Utils.escapeHtml(e.location)}
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
                        <span style="color: #059669; font-weight: 700;">
                          <i class="fa-solid fa-clock"></i> ${e.start_time} - ${e.end_time} WIB
                        </span>
                        <span style="color: #64748b;">
                          <i class="fa-solid fa-user-gear"></i> PIC: ${Utils.escapeHtml(e.pic_name || 'Panitia')}
                        </span>
                      </div>
                    </div>
                  `).join('') : '<p style="color: #94a3b8; font-size: 0.85rem; text-align: center; padding: 1rem;">Belum ada agenda kegiatan terdaftar.</p>'}
                </div>
              </div>
            </div>

            <!-- TAB 3: KLASEMEN MEDALI -->
            <div id="peninjauTabMedali" style="display: none;">
              <div class="peserta-info-card">
                <div class="peserta-info-header" style="display: flex; justify-content: space-between; align-items: center;">
                  <span><i class="fa-solid fa-trophy" style="color: #eab308;"></i> Rekapitulasi Medali Jumbara</span>
                  <button type="button" class="btn btn-outline btn-xs" onclick="App.loadPesertaStandingsMobile('peninjauStandingsContainer')" style="font-size: 0.72rem; padding: 2px 8px; border-radius: 6px;">
                    <i class="fa-solid fa-rotate"></i> Refresh
                  </button>
                </div>
                <div id="peninjauStandingsContainer">
                  <!-- Dynamic standings loaded by loadPesertaStandingsMobile() -->
                </div>
              </div>
            </div>

            <!-- TAB 4: LOKASI & DENAH -->
            <div id="peninjauTabLokasi" style="display: none;">
              <div class="peserta-info-card">
                <div class="peserta-info-header">
                  <i class="fa-solid fa-map-location-dot" style="color: #0284c7;"></i> Peta & Lokasi Bumi Perkemahan
                </div>
                <p style="font-size: 0.82rem; color: #475569; margin-bottom: 0.75rem;">
                  Lokasi utama kegiatan Jumbara PMR PMI Kabupaten:
                </p>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin-bottom: 0.85rem; text-align: center;">
                  <i class="fa-solid fa-tents" style="font-size: 2.2rem; color: #059669; margin-bottom: 0.5rem;"></i>
                  <h4 style="font-size: 0.95rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem 0;">
                    ${Utils.escapeHtml(this.appSettings.event_location || 'Buperta Utama PMI Kabupaten')}
                  </h4>
                  <p style="font-size: 0.78rem; color: #64748b; margin: 0 0 0.75rem 0;">
                    ${Utils.escapeHtml(this.appSettings.event_dates || '15 - 17 Oktober 2026')}
                  </p>
                  <a href="${this.appSettings.gmaps_url || 'https://maps.google.com'}" target="_blank" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700; border-radius: 8px;">
                    <i class="fa-solid fa-diamond-turn-right"></i> Buka Google Maps Navigasi
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      `;
    } catch (err) {
      console.error('Error rendering peninjau portal:', err);
    }
  },

  // =========================================================================
  // VIEW 2.5: PENILAI / DEWAN JURI MOBILE PORTAL VIEW (HP MODE)
  // =========================================================================
  async renderPenilaiPortal(container) {
    if (!container) container = document.getElementById('mainContainer');
    if (!container) return;

    if (!this.cachedEvents || !this.cachedEvents.length) {
      try {
        const events = await API.getEvents();
        this.cachedEvents = events || [];
      } catch (e) {
        this.cachedEvents = [];
      }
    }

    const user = this.currentUser || {};
    const isPanitia = user.role === 'panitia';
    const userName = user.full_name || user.username || (isPanitia ? 'Panitia Pelaksana' : 'Penilai / Juri PMI');

    if (!this.activePenilaiSubTab) {
      this.activePenilaiSubTab = isPanitia ? 'presensi' : 'input';
    }

    container.innerHTML = `
      <div style="max-width: 600px; margin: 0 auto; padding: 0.35rem 0.5rem 5rem 0.5rem;">
        
        <!-- Header Penilai / Panitia Mobile Card -->
        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; box-shadow: 0 4px 15px rgba(49,46,129,0.25); position: relative; overflow: hidden;">
          <div style="position: absolute; right: -15px; top: -15px; width: 90px; height: 90px; background: rgba(255,255,255,0.06); border-radius: 50%;"></div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span class="user-role-tag" style="background: rgba(255,255,255,0.18); color: #ffffff; border: 1px solid rgba(255,255,255,0.3); font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 20px;">
              <i class="fa-solid ${isPanitia ? 'fa-clipboard-user' : 'fa-gavel'}"></i> MODE ${isPanitia ? 'PANITIA PELAKSANA' : 'PENILAI / JURI'} HP
            </span>
            <button class="btn btn-outline btn-xs" style="color: white; border-color: rgba(255,255,255,0.4); font-size: 0.75rem;" onclick="App.handleLogout()">
              <i class="fa-solid fa-right-from-bracket"></i> Keluar
            </button>
          </div>
          <h2 style="font-size: 1.2rem; font-weight: 800; margin: 0; color: #ffffff;">
            Selamat Bertugas, ${Utils.escapeHtml(userName)}
          </h2>
          <p style="font-size: 0.8rem; margin: 0.35rem 0 0 0; opacity: 0.88;">
            Aplikasi Presensi, Scan QR & Input Nilai Lapangan JUMBARA PMR 2026
          </p>

          <!-- Quick Scan Action Buttons -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 1rem;">
            <button class="btn btn-success" style="font-weight: 800; font-size: 0.85rem; padding: 0.65rem 0.3rem; background: #16a34a; border: none; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 0.35rem; box-shadow: 0 4px 12px rgba(22,163,74,0.3);" onclick="App.switchPenilaiSubTab('presensi')">
              <i class="fa-solid fa-qrcode" style="font-size: 1.1rem;"></i> SCAN PRESENSI
            </button>
            <button class="btn btn-primary" style="font-weight: 800; font-size: 0.85rem; padding: 0.65rem 0.3rem; background: #dc2626; border: none; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 0.35rem; box-shadow: 0 4px 12px rgba(220,38,38,0.4);" onclick="App.openEventScoringModal()">
              <i class="fa-solid fa-pen-to-square" style="font-size: 1.1rem;"></i> INPUT NILAI
            </button>
          </div>
        </div>

        <!-- Tab Navigation Menu HP (4 Grid Subtabs) -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.35rem; margin-bottom: 1rem;">
          <button class="btn ${this.activePenilaiSubTab === 'presensi' ? 'btn-primary' : 'btn-outline'}" style="font-weight: 700; font-size: 0.78rem; padding: 0.6rem 0.1rem; white-space: nowrap; text-align: center;" onclick="App.switchPenilaiSubTab('presensi')">
            <i class="fa-solid fa-qrcode"></i> Presensi
          </button>
          <button class="btn ${this.activePenilaiSubTab === 'input' ? 'btn-primary' : 'btn-outline'}" style="font-weight: 700; font-size: 0.78rem; padding: 0.6rem 0.1rem; white-space: nowrap; text-align: center;" onclick="App.switchPenilaiSubTab('input')">
            <i class="fa-solid fa-pen-to-square"></i> Input Nilai
          </button>
          <button class="btn ${this.activePenilaiSubTab === 'riwayat' ? 'btn-primary' : 'btn-outline'}" style="font-weight: 700; font-size: 0.78rem; padding: 0.6rem 0.1rem; white-space: nowrap; text-align: center;" onclick="App.switchPenilaiSubTab('riwayat')">
            <i class="fa-solid fa-list-check"></i> Draft
          </button>
          <button class="btn ${this.activePenilaiSubTab === 'klasemen' ? 'btn-primary' : 'btn-outline'}" style="font-weight: 700; font-size: 0.78rem; padding: 0.6rem 0.1rem; white-space: nowrap; text-align: center;" onclick="App.switchPenilaiSubTab('klasemen')">
            <i class="fa-solid fa-trophy"></i> Klasemen
          </button>
        </div>

        <!-- Tab Body Content -->
        <div id="penilaiPortalContent">
          <!-- Dynamic Content -->
        </div>

      </div>
    `;

    this.renderPenilaiSubTabContent();
  },

  switchPenilaiSubTab(subTab) {
    this.activePenilaiSubTab = subTab;
    this.renderPenilaiPortal();
  },

  async renderPenilaiSubTabContent() {
    const content = document.getElementById('penilaiPortalContent');
    if (!content) return;

    const subTab = this.activePenilaiSubTab || 'presensi';

    if (subTab === 'presensi') {
      await this.renderTabPresensi(content);
    } else if (subTab === 'input') {
      content.innerHTML = `
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <h4 style="margin: 0 0 0.85rem 0; font-size: 0.98rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-pen-to-square" style="color: #2563eb;"></i> Form Penilaian Kegiatan
          </h4>
          
          <p style="font-size: 0.82rem; color: #475569; margin-top: 0; margin-bottom: 1rem;">
            Gunakan tombol di bawah untuk membuka scanner QR HP atau cari nama/kode peserta untuk memulai penilaian per aspek.
          </p>

          <button class="btn btn-primary" style="width: 100%; font-weight: 800; padding: 0.85rem; font-size: 1rem; border-radius: 8px; margin-bottom: 0.75rem; background: #dc2626; border-color: #dc2626;" onclick="App.openEventScoringModal()">
            <i class="fa-solid fa-qrcode"></i> Buka Scanner Kamera QR Penilaian
          </button>

          <button class="btn btn-outline" style="width: 100%; font-weight: 700; padding: 0.75rem; font-size: 0.9rem; border-radius: 8px;" onclick="App.openManageAspectsModal()">
            <i class="fa-solid fa-list-ol"></i> Atur Aspek & Bobot Penilaian
          </button>
        </div>
      `;
    } else if (subTab === 'riwayat') {
      content.innerHTML = '<p style="text-align: center; padding: 2rem 0; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data draft penilaian Anda...</p>';
      try {
        const scores = await API.getScores();
        const myScores = (scores || []).filter(sc => String(sc.evaluator_user_id) === String(this.currentUser.id) || sc.judge_name === this.currentUser.full_name || sc.judge_name === this.currentUser.username);

        if (!myScores.length) {
          content.innerHTML = `
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 2rem 1rem; text-align: center; color: #64748b;">
              <i class="fa-solid fa-clipboard" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.75rem; display: block;"></i>
              <strong style="display: block; font-size: 0.95rem; color: #334155;">Belum Ada Riwayat Penilaian</strong>
              <span style="font-size: 0.8rem; display: block; margin-top: 0.25rem;">Anda belum menginput nilai kegiatan. Klik 'Input Nilai' untuk mulai menilai.</span>
            </div>
          `;
          return;
        }

        content.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${myScores.map(sc => {
              const isValidated = sc.status === 'validated' || sc.status === 'final';
              const targetLabel = sc.participant_name ? `${Utils.escapeHtml(sc.participant_name)} (${Utils.escapeHtml(sc.unit_name)})` : Utils.escapeHtml(sc.unit_name);
              
              return `
                <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.85rem; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
                    <div>
                      <strong style="font-size: 0.92rem; color: #0f172a; display: block;">${Utils.escapeHtml(sc.branch_name || 'Kegiatan')}</strong>
                      <span style="font-size: 0.78rem; color: #475569;">Target: <strong>${targetLabel}</strong></span>
                    </div>
                    ${isValidated 
                      ? '<span class="badge" style="background:#dcfce7; color:#15803d; border:1px solid #86efac; font-size:0.7rem; padding: 2px 6px; font-weight:700;"><i class="fa-solid fa-lock"></i> Terkunci</span>'
                      : '<span class="badge" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; font-size:0.7rem; padding: 2px 6px; font-weight:700;"><i class="fa-solid fa-clock"></i> Draft</span>'
                    }
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #e2e8f0; padding-top: 0.35rem; margin-top: 0.35rem;">
                    <span style="font-size: 0.88rem; font-weight: 800; color: #166534;">Total: ${sc.score_val} Poin (${sc.grade})</span>
                    ${!isValidated ? `
                      <div style="display: flex; gap: 0.35rem; align-items: center;">
                        <button class="btn btn-warning btn-xs" onclick="App.openEditScoreModal(${sc.id})" style="font-size: 0.72rem; padding: 3px 8px; color: #78350f; background: #fef3c7; border: 1px solid #fde68a; font-weight: 700; border-radius: 4px;">
                          <i class="fa-solid fa-pen-to-square"></i> Edit Nilai
                        </button>
                        <button class="btn btn-danger btn-xs" onclick="App.handleDeleteScore(${sc.id})" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 4px;">
                          <i class="fa-solid fa-trash"></i> Hapus
                        </button>
                      </div>
                    ` : '<span style="font-size: 0.72rem; color: #94a3b8;"><i class="fa-solid fa-lock"></i> Divalidasi</span>'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } catch (err) {
        content.innerHTML = `<p style="color: red; text-align: center;">Gagal memuat riwayat: ${Utils.escapeHtml(err.message)}</p>`;
      }
    } else if (subTab === 'klasemen') {
      content.innerHTML = '<p style="text-align: center; padding: 2rem 0; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data klasemen...</p>';
      try {
        const standings = await API.getStandings();
        content.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${(standings || []).map((s, idx) => `
              <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                  <strong style="font-size: 0.92rem; color: #0f172a;">#${idx + 1} ${Utils.escapeHtml(s.unit_name)}</strong>
                  <span style="font-size: 0.78rem; color: #475569;">Avg: <strong>${s.avg_score ? parseFloat(s.avg_score).toFixed(1) : '-'}</strong></span>
                </div>
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                  <span class="medal-badge medal-emas" style="font-size: 0.72rem;">🥇 ${s.emas || 0} Emas</span>
                  <span class="medal-badge medal-perak" style="font-size: 0.72rem;">🥈 ${s.perak || 0} Perak</span>
                  <span class="medal-badge medal-perunggu" style="font-size: 0.72rem;">🥉 ${s.perunggu || 0} Perunggu</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } catch (err) {
        content.innerHTML = `<p style="color: red; text-align: center;">Gagal memuat klasemen: ${Utils.escapeHtml(err.message)}</p>`;
      }
    }
  },

  // =========================================================================
  // VIEW 3: ADMIN UNIT PMR PORTAL VIEW
  // =========================================================================
  async renderAdminUnitPortal(container) {
    this.activeUnitTab = this.activeUnitTab || 'peserta';

    container.innerHTML = `
      <div class="panel-card admin-banner-card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; position: relative; z-index: 2;">
          <div style="min-width: 0; flex: 1 1 auto;">
            <div class="banner-badge" style="background: rgba(37, 99, 235, 0.18); border-color: rgba(59, 130, 246, 0.3); color: #bfdbfe;"><span class="live-pulse-dot" style="background-color: #3b82f6; margin-right: 6px;"></span> Kontingen Unit Sekolah &bull; Portal Unit</div>
            <h1 class="admin-banner-title">
              <i class="fa-solid fa-school-flag" style="color: #3b82f6;"></i> <span>${Utils.escapeHtml(this.currentUser.unit_name || 'Kontingen Unit Sekolah')}</span>
            </h1>
            <p class="admin-banner-subtitle">
              Pusat pengelolaan verifikasi data peserta sekolah, pendaftaran kegiatan lomba & pencetakan piagam penghargaan.
            </p>
          </div>
          <div class="admin-banner-actions">
            <button class="btn btn-banner-primary" onclick="App.openAddParticipantModal()">
              <i class="fa-solid fa-user-plus"></i> <span>Tambah Peserta</span>
            </button>
            <button class="btn btn-banner-danger" onclick="App.handleLogout()">
              <i class="fa-solid fa-right-from-bracket"></i> <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>

      <nav class="tab-navigation" style="margin-bottom: 1.5rem;">
        <button class="tab-btn ${this.activeUnitTab === 'peserta' ? 'active' : ''}" id="unit-tab-peserta" onclick="App.switchUnitTab('peserta')">
          <i class="fa-solid fa-users-line"></i> Data Peserta Unit
        </button>
        <button class="tab-btn ${this.activeUnitTab === 'jadwal' ? 'active' : ''}" id="unit-tab-jadwal" onclick="App.switchUnitTab('jadwal')">
          <i class="fa-solid fa-calendar-check"></i> Jadwal & Pendaftaran Kegiatan
        </button>
        <button class="tab-btn ${this.activeUnitTab === 'piagam' ? 'active' : ''}" id="unit-tab-piagam" onclick="App.switchUnitTab('piagam')">
          <i class="fa-solid fa-scroll"></i> Piagam Penghargaan Unit
        </button>
      </nav>

      <div id="unitTabContent">
        <p style="color: var(--text-muted);">Memuat menu admin unit...</p>
      </div>
    `;

    this.switchUnitTab(this.activeUnitTab);
  },

  async switchUnitTab(tabName) {
    this.activeUnitTab = tabName;
    document.querySelectorAll('.tab-navigation .tab-btn').forEach(btn => btn.classList.remove('active'));

    const activeBtn = document.getElementById(`unit-tab-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');

    const content = document.getElementById('unitTabContent');
    if (!content) return;

    if (tabName === 'peserta') {
      this.renderUnitTabPeserta(content);
    } else if (tabName === 'jadwal') {
      this.renderUnitTabJadwal(content);
    } else if (tabName === 'piagam') {
      this.renderUnitTabPiagam(content);
    }
  },

  async renderUnitTabPiagam(container) {
    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header" style="margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <h3 class="panel-title"><i class="fa-solid fa-scroll" style="color: #dc2626;"></i> Piagam Penghargaan Kontingen Unit Sekolah</h3>
          <button class="btn btn-primary btn-sm" onclick="App.printAllFilteredPiagam()"><i class="fa-solid fa-print"></i> Cetak Semua Piagam Unit</button>
        </div>

        <div id="unitPiagamListContainer">
          <p style="text-align: center; padding: 2rem 0; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat daftar piagam peserta unit...</p>
        </div>
      </div>
    `;

    try {
      const res = await API.getCertificateParticipants({ unit_id: this.currentUser.unit_id });
      this.piagamParticipantsCache = res.participants || [];

      const listContainer = document.getElementById('unitPiagamListContainer');
      if (!listContainer) return;

      if (!this.piagamParticipantsCache.length) {
        listContainer.innerHTML = '<p style="text-align: center; padding: 2.5rem 0; color: #64748b;">Belum ada peserta unit terverifikasi yang memiliki piagam.</p>';
        return;
      }

      listContainer.innerHTML = `
        <div class="table-responsive">
          <table class="table" style="font-size: 0.82rem; width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #1e293b; color: white;">
                <th style="padding: 10px 12px; text-align: left;">Nama Peserta</th>
                <th style="padding: 10px 12px; text-align: center;">Unsur / Role</th>
                <th style="padding: 10px 12px; text-align: center;">Nomor Piagam Resmi</th>
                <th style="padding: 10px 12px; text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${this.piagamParticipantsCache.map(p => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">${Utils.escapeHtml(p.full_name)}</td>
                  <td style="padding: 10px 12px; text-align: center;"><span class="badge badge-info">${Utils.escapeHtml(p.level || 'Peserta')}</span></td>
                  <td style="padding: 10px 12px; text-align: center; font-family: monospace; font-weight: 800; color: #16a34a;">
                    ${p.certificate_number ? Utils.escapeHtml(p.certificate_number) : '<span style="color: #dc2626; font-family: inherit; font-weight: normal;">Belum diterbitkan</span>'}
                  </td>
                  <td style="padding: 10px 12px; text-align: right;">
                    <button class="btn btn-outline btn-sm" onclick="App.openPiagamPrintWindow([${JSON.stringify(p).replace(/"/g, '&quot;')}])">
                      <i class="fa-solid fa-print"></i> Cetak Piagam
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      console.error('Error loading unit piagam:', err);
    }
  },

  currentUnitLimit: 25,

  changeUnitLimit(limit) {
    this.currentUnitLimit = parseInt(limit) || 25;
    this.loadUnitParticipants(1);
  },

  resetUnitFilter() {
    const searchEl = document.getElementById('filterUnitSearch');
    const catEl = document.getElementById('filterUnitCategory');
    if (searchEl) searchEl.value = '';
    if (catEl) catEl.value = '';
    this.loadUnitParticipants(1);
  },

  async renderUnitTabPeserta(container) {
    container.innerHTML = `
      <div class="panel-card" style="box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; padding: 1rem 1.25rem; background: #ffffff; border-bottom: 1px solid #e2e8f0;">
          <h3 class="panel-title" style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-users-line" style="color: var(--primary);"></i> Data Peserta & Kontingen Unit Sekolah
          </h3>
          <button type="button" class="btn btn-outline btn-sm" onclick="App.openAddParticipantModal ? App.openAddParticipantModal() : (window.location.hash='#tambah-peserta')" style="font-weight: 700; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.4rem;">
            <i class="fa-solid fa-user-plus"></i> Tambah Anggota
          </button>
        </div>

        <!-- Filter Toolbar -->
        <div class="table-filter-bar">
          <div class="filter-group-left">
            <div class="search-input-wrapper">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input type="text" id="filterUnitSearch" placeholder="Cari nama / kode..." onkeydown="if(event.key==='Enter') App.loadUnitParticipants(1)">
            </div>
            <select id="filterUnitCategory" class="filter-select" onchange="App.loadUnitParticipants(1)">
              <option value="">Semua Kategori</option>
              <option value="Peserta">Peserta PMR</option>
              <option value="Panitia">Panitia</option>
              <option value="Peninjau">Peninjau</option>
              <option value="Tamu Undangan">Tamu Undangan</option>
              <option value="Media">Media / Pers</option>
            </select>
            <button type="button" class="btn-filter-reset" onclick="App.resetUnitFilter()" title="Reset Filter">
              <i class="fa-solid fa-rotate-left"></i> Reset
            </button>
          </div>
          <div class="filter-group-right">
            <span style="font-size: 0.8rem; color: #64748b; font-weight: 500;">Tampilkan:</span>
            <select id="filterUnitLimit" class="filter-select" style="width: auto; padding: 0.35rem 0.5rem;" onchange="App.changeUnitLimit(this.value)">
              <option value="10" ${this.currentUnitLimit === 10 ? 'selected' : ''}>10</option>
              <option value="25" ${(!this.currentUnitLimit || this.currentUnitLimit === 25) ? 'selected' : ''}>25</option>
              <option value="50" ${this.currentUnitLimit === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${this.currentUnitLimit === 100 ? 'selected' : ''}>100</option>
            </select>
          </div>
        </div>

        <div id="unitParticipantTableContainer">
          <p style="color: var(--text-muted); padding: 1.5rem; text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat daftar peserta unit...</p>
        </div>
      </div>
    `;

    this.loadUnitParticipants(1);
  },

  async renderUnitTabJadwal(container) {
    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header" style="margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <h3 class="panel-title"><i class="fa-solid fa-calendar-check" style="color: var(--primary);"></i> Jadwal Kegiatan & Pendaftaran Lomba Kontingen</h3>
          <button class="btn btn-outline btn-sm" onclick="App.loadUnitEvents()"><i class="fa-solid fa-arrows-rotate"></i> Refresh Jadwal</button>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
          Klik tombol <strong>"📝 Kelola Pendaftaran Peserta Unit"</strong> pada kegiatan di bawah untuk memilih & mendaftarkan anggota PMR dari kontingen sekolah Anda secara resmi.
        </p>
        <div id="unitEventsContainer">
          <p style="color: var(--text-muted);">Memuat agenda & pendaftaran kegiatan unit...</p>
        </div>
      </div>
    `;

    this.loadUnitEvents();
  },

  renderPaginationHtml(pagination, callbackFnName) {
    if (!pagination) return '';
    const { total, page, limit, total_pages } = pagination;
    if (total === 0) return '';

    const start = ((page - 1) * limit) + 1;
    const end = Math.min(page * limit, total);

    return `
      <div class="table-pagination-bar">
        <div class="pagination-info">
          Menampilkan <strong>${start.toLocaleString('id-ID')} - ${end.toLocaleString('id-ID')}</strong> dari total <strong>${total.toLocaleString('id-ID')}</strong> peserta
        </div>
        <div class="pagination-controls">
          <button class="btn-page-nav" ${page <= 1 ? 'disabled' : ''} onclick="${callbackFnName}(1)" title="Halaman Pertama">
            <i class="fa-solid fa-angles-left"></i>
          </button>
          <button class="btn-page-nav" ${page <= 1 ? 'disabled' : ''} onclick="${callbackFnName}(${page - 1})" title="Halaman Sebelumnya">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          
          <div class="pagination-jump">
            <span>Hal</span>
            <input type="number" class="input-jump-page" min="1" max="${total_pages}" value="${page}" 
              onkeydown="if(event.key==='Enter'){ const p = parseInt(this.value); if(p >= 1 && p <= ${total_pages}) ${callbackFnName}(p); }" 
              onblur="const p = parseInt(this.value); if(p >= 1 && p <= ${total_pages} && p !== ${page}) ${callbackFnName}(p);">
            <span>dari <strong>${total_pages.toLocaleString('id-ID')}</strong></span>
          </div>

          <button class="btn-page-nav" ${page >= total_pages ? 'disabled' : ''} onclick="${callbackFnName}(${page + 1})" title="Halaman Selanjutnya">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
          <button class="btn-page-nav" ${page >= total_pages ? 'disabled' : ''} onclick="${callbackFnName}(${total_pages})" title="Halaman Terakhir">
            <i class="fa-solid fa-angles-right"></i>
          </button>
        </div>
      </div>
    `;
  },

  async loadUnitParticipants(page = 1) {
    const container = document.getElementById('unitParticipantTableContainer');
    if (!container) return;

    const category = document.getElementById('filterUnitCategory')?.value || '';
    const search = document.getElementById('filterUnitSearch')?.value || '';
    const limit = this.currentUnitLimit || 25;

    try {
      const res = await API.getParticipants({
        unit_id: this.currentUser.unit_id,
        registration_type: category,
        search,
        page,
        limit
      });
      const participants = Array.isArray(res) ? res : (res.data || []);
      const pagination = res.pagination || null;

      if (!participants.length) {
        container.innerHTML = `
          <div style="padding: 2.5rem 1rem; text-align: center; color: var(--text-muted);">
            <i class="fa-solid fa-folder-open" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 0.5rem; display: block;"></i>
            <p style="margin: 0; font-weight: 500;">Belum ada pendaftar yang sesuai filter pencarian.</p>
          </div>
        `;
        return;
      }

      const desktopTableHtml = `
        <div class="master-p-desktop-table table-responsive" style="margin: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-code">Kode</th>
                <th class="col-name">Nama Pendaftar</th>
                <th class="col-category">Kategori / Tingkat</th>
                <th style="width: 110px; text-align: center;">Jenis Kelamin</th>
                <th class="col-blood">Gol. Darah</th>
                <th style="width: 130px;">Kontak HP</th>
                <th class="col-doc">Surat Tugas</th>
                <th class="col-status">Status</th>
                <th class="col-actions">Aksi Validasi</th>
              </tr>
            </thead>
            <tbody>
              ${participants.map(p => {
        const isNonPeserta = p.registration_type && p.registration_type !== 'Peserta';
        const badgeCategoryHtml = isNonPeserta ? Utils.getLevelBadgeHtml(p.registration_type) : Utils.getLevelBadgeHtml(p.level);
        const escapedName = Utils.escapeHtml(p.full_name || '');
        const photoUrl = p.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
        const subtext = isNonPeserta ? ('Kategori: ' + Utils.escapeHtml(p.registration_type)) : ('NISN: ' + (p.nisn || '-'));
        const hasBlood = p.blood_type && p.blood_type !== '-';

        return `
                <tr>
                  <td class="col-code"><span class="badge-code">${p.code}</span></td>
                  <td class="col-name">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                      <img src="${photoUrl}" class="participant-avatar" loading="lazy" onclick="window.open('${p.photo_url || photoUrl}', '_blank')" title="Klik untuk lihat foto asli">
                      <div style="min-width: 0; flex: 1;">
                        <div class="participant-name" title="${escapedName}">${escapedName}</div>
                        <div class="participant-subtext">${subtext}</div>
                      </div>
                    </div>
                  </td>
                  <td class="col-category">${badgeCategoryHtml}</td>
                  <td style="text-align: center; white-space: nowrap;">${p.gender === 'L' ? '<span style="color:#0284c7; font-weight:600;"><i class="fa-solid fa-mars"></i> Laki-Laki</span>' : '<span style="color:#db2777; font-weight:600;"><i class="fa-solid fa-venus"></i> Perempuan</span>'}</td>
                  <td class="col-blood"><span class="blood-badge ${hasBlood ? 'has-blood' : ''}">${p.blood_type || '-'}</span></td>
                  <td style="white-space: nowrap; font-size: 0.82rem; color: #475569;">${Utils.escapeHtml(p.phone || '-')}</td>
                  <td class="col-doc">
                    ${p.assignment_letter_url ? `
                      <a href="${p.assignment_letter_url}" target="_blank" class="btn-doc-link"><i class="fa-solid fa-file-pdf"></i> Surat Tugas</a>
                    ` : `<span class="badge-no-doc">Belum Upload</span>`}
                  </td>
                  <td class="col-status">${Utils.getStatusBadgeHtml(p.status)}</td>
                  <td class="col-actions">
                    <div class="action-btn-group">
                      <button class="btn-act btn-act-audit" onclick="App.openAuditModal(${p.id})" title="Pengecekan Audit Data, Pas Foto & Surat Tugas"><i class="fa-solid fa-clipboard-check"></i> Audit</button>
                      <button class="btn-act btn-act-edit" onclick="App.openEditParticipantModal(${p.id})" title="Edit Data & Berkas Peserta"><i class="fa-solid fa-user-pen"></i> Edit</button>
                      <button class="btn-act btn-act-card" onclick="App.openIDCardModal(${p.id})" title="Cetak ID Card">${Icons.idcard(13)} ID Card</button>
                      <button class="btn-act btn-act-delete" data-name="${escapedName}" onclick="event.stopPropagation(); App.deleteParticipant(${p.id}, this.dataset.name)" title="Hapus Data Peserta"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              `;}).join('')}
            </tbody>
          </table>
        </div>
      `;

      const mobileCardsHtml = `
        <div class="master-p-mobile-cards" style="padding: 0.75rem;">
          ${participants.map(p => {
        const isNonPeserta = p.registration_type && p.registration_type !== 'Peserta';
        const badgeCategoryHtml = isNonPeserta ? Utils.getLevelBadgeHtml(p.registration_type) : Utils.getLevelBadgeHtml(p.level);
        const escapedName = Utils.escapeHtml(p.full_name || '');
        const photoUrl = p.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
        return `
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); width: 100%; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.4rem;">
                  <span class="badge-code">${Utils.escapeHtml(p.code)}</span>
                  <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                    ${badgeCategoryHtml}
                    ${Utils.getStatusBadgeHtml(p.status)}
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem;">
                  <img src="${photoUrl}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); flex-shrink: 0;">
                  <div style="flex: 1; min-width: 0; word-break: break-word;">
                    <strong style="font-size: 0.92rem; color: #0f172a; display: block; line-height: 1.25;">${escapedName}</strong>
                    <div style="font-size: 0.78rem; color: #475569; margin-top: 0.15rem; word-break: break-word;">
                      ${isNonPeserta ? 'Kategori: ' + Utils.escapeHtml(p.registration_type) : 'NISN: ' + (p.nisn || '-')} | HP: ${Utils.escapeHtml(p.phone || '-')} | Gol. Darah: <strong style="color: var(--primary);">${p.blood_type || '-'}</strong>
                    </div>
                  </div>
                </div>
                <div style="display: flex; gap: 0.3rem; flex-wrap: wrap; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #e2e8f0;">
                  <button class="btn btn-primary btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem;" onclick="App.openAuditModal(${p.id})"><i class="fa-solid fa-clipboard-check"></i> Audit</button>
                  <button class="btn btn-warning btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem; font-weight: 700; background: #f59e0b; border-color: #f59e0b; color: white;" onclick="App.openEditParticipantModal(${p.id})"><i class="fa-solid fa-user-pen"></i> Edit</button>
                  <button class="btn btn-outline btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem;" onclick="App.openIDCardModal(${p.id})">${Icons.idcard(12)} ID Card</button>
                  ${p.assignment_letter_url ? `<a href="${p.assignment_letter_url}" target="_blank" class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; color: var(--primary); border-color: var(--primary);"><i class="fa-solid fa-file-pdf"></i> Surat</a>` : ''}
                  <button class="btn btn-danger btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem; background: #fee2e2; border-color: #fca5a5; color: #dc2626; font-weight: 700;" data-name="${escapedName}" onclick="event.stopPropagation(); App.deleteParticipant(${p.id}, this.dataset.name)"><i class="fa-solid fa-trash-can"></i></button>
                </div>
              </div>
            `;
      }).join('')}
        </div>
      `;

      container.innerHTML = desktopTableHtml + mobileCardsHtml + this.renderPaginationHtml(pagination, 'App.loadUnitParticipants');
    } catch (err) {
      container.innerHTML = `<p style="color: red; padding: 1.5rem;">Gagal memuat peserta: ${err.message}</p>`;
    }
  },

  cachedUnitEventsData: null,

  async loadUnitEvents() {
    const container = document.getElementById('unitEventsContainer');
    if (!container) return;

    try {
      const res = await API.getUnitEvents(this.currentUser.unit_id);
      this.cachedUnitEventsData = res;
      const events = res.events || [];

      if (!events.length) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 1rem 0;">Belum ada jadwal kegiatan Jumbara yang dibuat oleh panitia.</p>';
        return;
      }

      const eventsDesktopTable = `
        <div class="jadwal-desktop-table table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Judul Agenda & Cabang</th>
                <th>Kategori & Level PMR</th>
                <th>Tanggal & Jam</th>
                <th>Lokasi</th>
                <th>Status Pendaftaran & Kuota</th>
                <th>Aksi Pendaftaran Unit</th>
              </tr>
            </thead>
            <tbody>
              ${events.map(e => `
                <tr>
                  <td>
                    <strong style="font-size: 0.95rem; color: var(--secondary);">${Utils.escapeHtml(e.title)}</strong><br>
                    <small style="color: var(--text-muted);">${Utils.escapeHtml(e.description || '')}</small>
                  </td>
                  <td>
                    <span class="badge badge-unit">${Utils.escapeHtml(e.category)}</span><br>
                    <span style="margin-top: 0.2rem; display: inline-block;">${Utils.getLevelBadgeHtml(e.pmr_level)}</span>
                  </td>
                  <td style="font-size: 0.85rem;">
                    <strong>${e.event_date}</strong><br>
                    <small style="color: var(--text-muted);">⏰ ${e.start_time} - ${e.end_time} WIB</small>
                  </td>
                  <td style="font-size: 0.85rem;">📍 ${Utils.escapeHtml(e.location)}</td>
                  <td>
                    <span class="badge ${e.registered_count > 0 ? 'badge-success' : 'badge-secondary'}" style="font-size: 0.85rem; font-weight: 800; padding: 0.4rem 0.75rem;">
                      ${e.registered_count} Peserta Unit Terdaftar
                    </span><br>
                    <span style="font-size: 0.78rem; margin-top: 0.25rem; display: inline-block;">
                      ${e.max_participants_per_unit > 0 ? `<strong style="color: #b45309;"><i class="fa-solid fa-user-lock"></i> Batas Kuota: ${e.max_participants_per_unit} / Unit</strong>` : `<span style="color: var(--text-muted);"><i class="fa-solid fa-infinity"></i> Kuota: Tanpa Batas</span>`}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                      <button type="button" class="btn btn-primary btn-sm" style="font-weight: 700;" onclick="App.openUnitEventRegistrationModal(${e.id})">
                        <i class="fa-solid fa-user-pen"></i> 📝 Kelola Pendaftaran Unit
                      </button>
                      <button type="button" class="btn btn-outline btn-sm" style="font-weight: 700; color: #1d4ed8; border-color: #bfdbfe; background: #eff6ff;" onclick="App.openRegisteredParticipantsModal(${e.id})">
                        <i class="fa-solid fa-users"></i> 📋 Lihat Semua Pendaftar
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      const eventsMobileCards = `
        <div class="jadwal-mobile-cards">
          ${events.map(e => `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); width: 100%; box-sizing: border-box;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
                <strong style="font-size: 0.95rem; color: #0f172a; word-break: break-word; flex: 1;">${Utils.escapeHtml(e.title)}</strong>
                <span class="badge badge-unit">${Utils.escapeHtml(e.category)}</span>
              </div>
              <div style="font-size: 0.78rem; color: #475569; margin-bottom: 0.4rem; word-break: break-word;">
                Tingkat: ${Utils.getLevelBadgeHtml(e.pmr_level)} | 📍 ${Utils.escapeHtml(e.location)}
              </div>
              <div style="font-size: 0.78rem; color: #334155; margin-bottom: 0.45rem;">
                📅 <strong>${e.event_date}</strong> (${e.start_time} - ${e.end_time})
                <br>
                <span class="badge ${e.registered_count > 0 ? 'badge-success' : 'badge-secondary'}" style="font-size: 0.75rem; font-weight: 700;">${e.registered_count} Terdaftar</span>
                ${e.max_participants_per_unit > 0
          ? `<span style="color: #b45309; font-weight: 700; margin-left: 0.3rem;"><i class="fa-solid fa-user-lock"></i> Batas: ${e.max_participants_per_unit}/Unit</span>`
          : `<span style="color: var(--text-muted); margin-left: 0.3rem;"><i class="fa-solid fa-infinity"></i> Tanpa Batas</span>`}
              </div>
              <div style="display: flex; gap: 0.3rem; flex-wrap: wrap; padding-top: 0.45rem; border-top: 1px dashed #e2e8f0;">
                <button type="button" class="btn btn-primary btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem; font-weight: 700;" onclick="App.openUnitEventRegistrationModal(${e.id})"><i class="fa-solid fa-user-pen"></i> Kelola Pendaftaran</button>
                <button type="button" class="btn btn-outline btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem; color: #1d4ed8; border-color: #bfdbfe; background: #eff6ff;" onclick="App.openRegisteredParticipantsModal(${e.id})"><i class="fa-solid fa-users"></i> Pendaftar</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      container.innerHTML = eventsDesktopTable + eventsMobileCards;
    } catch (err) {
      container.innerHTML = `<p style="color: red;">Error memuat jadwal kegiatan unit: ${err.message}</p>`;
    }
  },

  async openUnitEventRegistrationModal(eventId) {
    if (!this.cachedUnitEventsData) {
      try {
        if (this.currentUser && this.currentUser.unit_id) {
          this.cachedUnitEventsData = await API.getUnitEvents(this.currentUser.unit_id);
        }
      } catch (err) {
        console.error('Gagal memuat data event unit:', err);
      }
    }
    if (!this.cachedUnitEventsData) return;
    const events = this.cachedUnitEventsData.events || [];
    const unitParticipants = this.cachedUnitEventsData.unit_participants || [];

    const eventObj = events.find(e => Number(e.id) === Number(eventId));
    if (!eventObj) return;

    document.getElementById('unitEventRegEventId').value = eventId;
    const titleEl = document.getElementById('unitEventRegModalTitle');
    if (titleEl) {
      titleEl.innerHTML = `<i class="fa-solid fa-user-check"></i> Pendaftaran Unit: <strong>${Utils.escapeHtml(eventObj.title)}</strong>`;
    }

    const container = document.getElementById('unitEventRegParticipantsList');
    if (!container) return;

    if (!unitParticipants.length) {
      container.innerHTML = '<p style="color: #dc2626; text-align: center; padding: 1rem;">Belum ada peserta dari unit sekolah Anda yang berstatus terverifikasi (Verified Kabupaten). Silakan lakukan verifikasi peserta terlebih dahulu.</p>';
      this.openModal('unitEventRegistrationModal');
      return;
    }

    const explicitIds = eventObj.explicit_registered_ids || [];
    const registeredIds = (explicitIds.length > 0) ? explicitIds : (eventObj.registered_participant_ids || []);
    const maxQuota = Number(eventObj.max_participants_per_unit || 0);

    const quotaHeaderHtml = maxQuota > 0
      ? `<div id="unitEventQuotaBanner" style="background: #fffbe3; border: 1px solid #fde68a; color: #92400e; padding: 0.6rem 0.85rem; border-radius: 6px; margin-bottom: 0.85rem; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <span><i class="fa-solid fa-user-lock" style="color: #d97706;"></i> <strong>Batas Kuota Unit:</strong> Maksimal ${maxQuota} Peserta per Sekolah</span>
          <span id="unitEventQuotaCount" style="font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 12px; background: #fef3c7; color: #b45309;">0 / ${maxQuota} Dipilih</span>
        </div>`
      : `<div style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; padding: 0.6rem 0.85rem; border-radius: 6px; margin-bottom: 0.85rem; font-size: 0.85rem;">
          <i class="fa-solid fa-infinity"></i> <strong>Kuota Unit:</strong> Tanpa Batas (Bebas mendaftarkan seluruh anggota unit)
        </div>`;

    container.innerHTML = `
      ${quotaHeaderHtml}
      <div style="margin-bottom: 0.75rem; font-weight: 700; font-size: 0.85rem; color: var(--secondary);">
        Centang nama peserta dari kontingen sekolah Anda yang didaftarkan dalam "${Utils.escapeHtml(eventObj.title)}" (${eventObj.category} / ${eventObj.pmr_level}):
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        ${unitParticipants.map(up => {
      const isChecked = registeredIds.includes(Number(up.id));
      return `
            <label style="display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.8rem; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
              <input type="checkbox" name="unitParticipantReg" value="${up.id}" ${isChecked ? 'checked' : ''} onchange="App.updateUnitRegistrationQuotaState(${maxQuota})" style="width: 18px; height: 18px;">
              <img src="${up.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
              <div style="flex: 1;">
                <strong style="font-size: 0.9rem; color: #0f172a;">${Utils.escapeHtml(up.full_name)}</strong>
                <span style="font-size: 0.8rem; color: var(--primary); margin-left: 0.4rem;">(${up.code})</span><br>
                <small style="color: var(--text-muted);">Tingkat: ${up.level}</small>
              </div>
            </label>
          `;
    }).join('')}
      </div>
    `;

    this.openModal('unitEventRegistrationModal');
    this.updateUnitRegistrationQuotaState(maxQuota);
  },

  updateUnitRegistrationQuotaState(maxQuota) {
    if (!maxQuota || maxQuota <= 0) return;
    const checkboxes = document.querySelectorAll('input[name="unitParticipantReg"]');
    const checkedBoxes = document.querySelectorAll('input[name="unitParticipantReg"]:checked');
    const checkedCount = checkedBoxes.length;

    const countEl = document.getElementById('unitEventQuotaCount');
    if (countEl) {
      countEl.innerText = `${checkedCount} / ${maxQuota} Dipilih`;
      if (checkedCount >= maxQuota) {
        countEl.style.background = '#fee2e2';
        countEl.style.color = '#dc2626';
      } else {
        countEl.style.background = '#fef3c7';
        countEl.style.color = '#b45309';
      }
    }

    checkboxes.forEach(cb => {
      if (!cb.checked) {
        if (checkedCount >= maxQuota) {
          cb.disabled = true;
          cb.parentElement.style.opacity = '0.5';
          cb.parentElement.style.cursor = 'not-allowed';
          cb.parentElement.title = `Batas kuota maksimal (${maxQuota} peserta) telah tercapai. Hapus centang peserta terpilih terlebih dahulu untuk mengganti.`;
        } else {
          cb.disabled = false;
          cb.parentElement.style.opacity = '1';
          cb.parentElement.style.cursor = 'pointer';
          cb.parentElement.title = '';
        }
      } else {
        cb.disabled = false;
        cb.parentElement.style.opacity = '1';
        cb.parentElement.style.cursor = 'pointer';
      }
    });
  },

  async handleSaveUnitEventRegistration(e) {
    e.preventDefault();
    const eventId = document.getElementById('unitEventRegEventId')?.value;
    if (!eventId) return;

    const checkboxes = document.querySelectorAll('input[name="unitParticipantReg"]:checked');
    const participantIds = Array.from(checkboxes).map(cb => Number(cb.value));

    try {
      const res = await API.saveUnitEventRegistrations(eventId, participantIds, this.currentUser.unit_id);
      Utils.showToast(res.message || 'Pendaftaran peserta berhasil disimpan!', 'success');
      this.closeModal('unitEventRegistrationModal');
      this.loadUnitEvents();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  getDefaultMenuStructure() {
    return {
      categories: [
        { id: 'peserta', label: 'Data Peserta & Card', icon: 'fa-solid fa-users', color: '#2563eb', bg: '#eff6ff' },
        { id: 'agenda', label: 'Agenda & Presensi', icon: 'fa-solid fa-calendar-check', color: '#d97706', bg: '#fffbeb' },
        { id: 'penilaian', label: 'Penilaian & Laporan', icon: 'fa-solid fa-award', color: '#059669', bg: '#ecfdf5' },
        { id: 'pengaturan', label: 'Pengaturan & Akun', icon: 'fa-solid fa-gears', color: '#4f46e5', bg: '#eef2ff' }
      ],
      items: [
        { id: 'verifikasi', label: 'Verifikasi Peserta', icon: 'fa-solid fa-user-check', category: 'peserta', enabled: true, isSystem: true },
        { id: 'master', label: 'Kelola Master Data', icon: 'fa-solid fa-database', category: 'peserta', enabled: true, isSystem: true },
        { id: 'idcard', label: 'Cetak ID Card Batch', icon: 'fa-solid fa-id-card', category: 'peserta', enabled: true, isSystem: true },
        { id: 'piagam', label: 'Piagam Penghargaan', icon: 'fa-solid fa-scroll', category: 'peserta', enabled: true, isSystem: true },
        { id: 'jadwal', label: 'Kelola Jadwal', icon: 'fa-solid fa-calendar-days', category: 'agenda', enabled: true, isSystem: true },
        { id: 'presensi', label: 'Scan Presensi QR', icon: 'fa-solid fa-qrcode', category: 'agenda', enabled: true, isSystem: true },
        { id: 'materi', label: 'Unduh & Kelola Materi', icon: 'fa-solid fa-book-bookmark', category: 'agenda', enabled: true, isSystem: true },
        { id: 'feedback', label: 'Kotak Saran & Aspirasi', icon: 'fa-solid fa-comments', category: 'agenda', enabled: true, isSystem: true },
        { id: 'pengumuman', label: 'Pengumuman', icon: 'fa-solid fa-bullhorn', category: 'agenda', enabled: true, isSystem: true },
        { id: 'aspek', label: 'Aspek Penilaian Kegiatan', icon: 'fa-solid fa-list-check', category: 'penilaian', enabled: true, isSystem: true },
        { id: 'rekap_nilai', label: 'Rekap Nilai per Kegiatan', icon: 'fa-solid fa-chart-simple', category: 'penilaian', enabled: true, isSystem: true },
        { id: 'penilaian', label: 'Papan Medali Kontingen', icon: 'fa-solid fa-trophy', category: 'penilaian', enabled: true, isSystem: true },
        { id: 'laporan', label: 'Laporan & Export', icon: 'fa-solid fa-file-export', category: 'penilaian', enabled: true, isSystem: true },
        { id: 'pengaturan', label: 'Pengaturan DB & Hero', icon: 'fa-solid fa-gear', category: 'pengaturan', enabled: true, isSystem: true },
        { id: 'users', label: 'Kelola User & Password', icon: 'fa-solid fa-users-gear', category: 'pengaturan', enabled: true, isSystem: true },
        { id: 'menu', label: 'Pengaturan Menu', icon: 'fa-solid fa-list-check', category: 'pengaturan', enabled: true, isSystem: true, isRequired: true },
        { id: 'password', label: 'Ganti Password Saya', icon: 'fa-solid fa-key', category: 'pengaturan', enabled: true, isSystem: true, isRequired: true }
      ]
    };
  },

  getMenuStructure() {
    let struct = null;
    try {
      if (this.appSettings && (this.appSettings.menu_config || this.appSettings.menu_settings)) {
        const raw = this.appSettings.menu_config || this.appSettings.menu_settings;
        struct = typeof raw === 'string' ? JSON.parse(raw) : raw;
      }
    } catch (e) {
      struct = null;
    }

    const defaultStruct = this.getDefaultMenuStructure();

    if (!struct || !Array.isArray(struct.categories) || !Array.isArray(struct.items)) {
      if (struct && typeof struct === 'object' && !struct.categories) {
        const categories = [...defaultStruct.categories];
        const items = defaultStruct.items.map(item => {
          const saved = struct[item.id];
          if (saved) {
            return {
              ...item,
              enabled: typeof saved.enabled === 'boolean' ? saved.enabled : item.enabled,
              category: saved.category || item.category
            };
          }
          return item;
        });
        return { categories, items };
      }
      return defaultStruct;
    }

    defaultStruct.items.forEach(defItem => {
      const exists = struct.items.find(i => i.id === defItem.id);
      if (!exists) {
        struct.items.push({ ...defItem });
      } else {
        exists.isSystem = true;
        if (defItem.isRequired) exists.isRequired = true;
      }
    });

    // Clean up obsolete individual master_* items to prevent cluttering the menu
    const obsoleteIds = ['master_units', 'master_unsur', 'master_options', 'master_fonnte'];
    struct.items = struct.items.filter(item => !obsoleteIds.includes(item.id));

    return struct;
  },

  renderPrimaryNavHtml() {
    const struct = this.getMenuStructure();
    const categories = struct.categories || [];

    const meta = {
      'peserta': { desc: 'Verifikasi, ID Card & Kontingen', color: '#2563eb', bg: '#eff6ff' },
      'agenda': { desc: 'Jadwal, Lokasi & Presensi QR', color: '#059669', bg: '#ecfdf5' },
      'penilaian': { desc: 'Dewan Juri & Rekap Medali', color: '#d97706', bg: '#fffbeb' },
      'pengaturan': { desc: 'Konfigurasi DB & Akun User', color: '#7c3aed', bg: '#f5f3ff' }
    };

    return categories.map(cat => {
      const info = meta[cat.id] || { desc: 'Modul Manajemen', color: '#2563eb', bg: '#eff6ff' };
      const isActive = this.activeCategory === cat.id;
      return `
        <button class="nav-cat-btn ${isActive ? 'active' : ''} cat-${cat.id}" data-cat="${cat.id}" onclick="App.switchAdminCategory('${cat.id}')">
          <div class="nav-cat-icon-wrap" style="--cat-color: ${info.color}; --cat-bg: ${info.bg};">
            <i class="${cat.icon || 'fa-solid fa-folder'}"></i>
          </div>
          <div class="nav-cat-body">
            <div class="nav-cat-title">${Utils.escapeHtml(cat.label)}</div>
            <div class="nav-cat-desc">${info.desc}</div>
          </div>
        </button>
      `;
    }).join('');
  },

  renderAdminSubNavHtml(catKey) {
    const struct = this.getMenuStructure();
    const visibleTabs = (struct.items || []).filter(item => item.enabled !== false && item.category === catKey);

    if (visibleTabs.length === 0) {
      return `<em style="color: var(--text-muted); font-size: 0.82rem; padding: 0.35rem 0.75rem;">(Tidak ada sub-menu aktif di kategori ini)</em>`;
    }

    return visibleTabs.map(tab => `
      <button class="sub-tab-btn ${this.activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}" onclick="App.switchAdminTab('${tab.id}', false)">
        <i class="${tab.icon}"></i> <span>${Utils.escapeHtml(tab.label)}</span>
      </button>
    `).join('');
  },

  switchAdminCategory(catName, targetTabId = null) {
    this.activeCategory = catName;
    document.querySelectorAll('.nav-cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === catName);
    });

    const subNavContainer = document.getElementById('adminSubNavContainer');
    if (subNavContainer) {
      subNavContainer.innerHTML = this.renderAdminSubNavHtml(catName);
    }

    const struct = this.getMenuStructure();
    const visibleTabs = (struct.items || []).filter(tab => tab.enabled !== false && tab.category === catName);

    if (visibleTabs.length > 0) {
      const tabToSelect = targetTabId || visibleTabs[0].id;
      this.switchAdminTab(tabToSelect, false);
    }
  },

  // =========================================================================
  // VIEW 4: ADMIN KABUPATEN PORTAL VIEW
  // =========================================================================
  async renderAdminKabupatenPortal(container) {
    const struct = this.getMenuStructure();
    const categories = struct.categories || [];
    if (!this.activeCategory || !categories.some(c => c.id === this.activeCategory)) {
      this.activeCategory = categories.length > 0 ? categories[0].id : 'peserta';
    }
    if (!this.activeTab) this.activeTab = 'verifikasi';

    container.innerHTML = `
      <div class="panel-card admin-banner-card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; position: relative; z-index: 2;">
          <div style="min-width: 0; flex: 1 1 auto;">
            <div class="banner-badge"><span class="live-pulse-dot" style="margin-right: 6px;"></span> Markas PMI Kabupaten &bull; Dashboard Utama</div>
            <h1 class="admin-banner-title">
              <i class="fa-solid fa-shield-halved" style="color: #ef4444;"></i> <span>Dashboard Panitia JUMBARA 2026</span>
            </h1>
            <p class="admin-banner-subtitle">
              Pusat kendali verifikasi peserta kontingen, presensi QR Code, penilaian dewan juri & rekapitulasi medali PMI Kabupaten.
            </p>
          </div>
          <div class="admin-banner-actions">
            <button class="btn btn-banner-primary" onclick="App.openAddParticipantModal()">
              <i class="fa-solid fa-user-plus"></i> <span>Tambah Peserta</span>
            </button>
            <button class="btn btn-banner-outline" onclick="App.openAddEventModal()">
              <i class="fa-solid fa-calendar-plus"></i> <span>Tambah Agenda</span>
            </button>
            <button class="btn btn-banner-danger" onclick="App.handleLogout()">
              <i class="fa-solid fa-right-from-bracket"></i> <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>

      <nav class="admin-nav-container">
        <div class="primary-nav-group" id="adminPrimaryCategories">
          ${this.renderPrimaryNavHtml()}
        </div>

        <div class="secondary-nav-group" id="adminSubNavContainer">
          ${this.renderAdminSubNavHtml(this.activeCategory)}
        </div>
      </nav>

      <div id="adminTabContent">
        <p style="color: var(--text-muted);">Memuat konten admin...</p>
      </div>
    `;

    this.switchAdminTab(this.activeTab, true);
  },

  async switchAdminTab(tabName, updateCategory = true) {
    this.activeTab = tabName;
    const struct = this.getMenuStructure();
    const tabItem = (struct.items || []).find(i => i.id === tabName);

    if (updateCategory && tabItem) {
      const currentCat = tabItem.category || 'peserta';
      if (this.activeCategory !== currentCat) {
        this.activeCategory = currentCat;
        document.querySelectorAll('.nav-cat-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.cat === currentCat);
        });
        const subNavContainer = document.getElementById('adminSubNavContainer');
        if (subNavContainer) {
          subNavContainer.innerHTML = this.renderAdminSubNavHtml(currentCat);
        }
      }
    }

    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    const content = document.getElementById('adminTabContent');
    if (!content) return;

    if (tabName === 'verifikasi') {
      this.renderTabVerifikasi(content);
    } else if (tabName === 'master' || tabName === 'master_units') {
      this.renderTabMaster(content, 'units');
    } else if (tabName === 'master_unsur') {
      this.renderTabMaster(content, 'unsur');
    } else if (tabName === 'master_options') {
      this.renderTabMaster(content, 'options');
    } else if (tabName === 'master_fonnte') {
      this.renderTabMaster(content, 'fonnte');
    } else if (tabName === 'idcard') {
      this.renderTabIDCard(content);
    } else if (tabName === 'piagam') {
      this.renderTabPiagam(content);
    } else if (tabName === 'presensi') {
      this.renderTabPresensi(content);
    } else if (tabName === 'aspek') {
      this.renderTabPenilaian(content, 'aspek');
    } else if (tabName === 'rekap_nilai') {
      this.renderTabPenilaian(content, 'rekap');
    } else if (tabName === 'penilaian') {
      this.renderTabPenilaian(content, 'klasemen');
    } else if (tabName === 'jadwal') {
      this.renderTabJadwal(content);
    } else if (tabName === 'materi') {
      this.renderTabMateri(content);
    } else if (tabName === 'feedback') {
      this.renderTabFeedback(content);
    } else if (tabName === 'pengumuman') {
      this.renderTabPengumuman(content);
    } else if (tabName === 'pengaturan') {
      this.renderTabPengaturan(content);
    } else if (tabName === 'laporan') {
      this.renderTabLaporan(content);
    } else if (tabName === 'users') {
      this.renderTabUsers(content);
    } else if (tabName === 'menu') {
      this.renderTabMenu(content);
    } else if (tabName === 'password') {
      this.renderTabPassword(content);
    } else if (tabItem) {
      this.renderCustomTabContent(content, tabItem);
    }
  },

  renderCustomTabContent(container, tabItem) {
    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header" style="display: flex; align-items: center; gap: 0.75rem;">
          <i class="${tabItem.icon || 'fa-solid fa-folder-open'}" style="font-size: 1.5rem; color: var(--primary);"></i>
          <div>
            <h3 class="panel-title" style="margin: 0;">${Utils.escapeHtml(tabItem.label)}</h3>
            <small style="color: var(--text-muted);">Modul Sub-Menu Kustom</small>
          </div>
        </div>
        <div style="padding: 2rem 1.5rem; text-align: center; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; margin-top: 1rem;">
          <i class="${tabItem.icon || 'fa-solid fa-cubes'}" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
          <h4 style="font-size: 1.1rem; color: #334155; margin-bottom: 0.5rem;">Modul "${Utils.escapeHtml(tabItem.label)}" Siap Digunakan</h4>
          <p style="color: #64748b; font-size: 0.9rem; max-width: 520px; margin: 0 auto 1.25rem;">
            Sub-menu kustom ini telah berhasil didaftarkan di kelompok menu <strong>${Utils.escapeHtml(tabItem.category)}</strong>. Anda dapat mengelola visibilitas dan penempatannya via Pengaturan Menu.
          </p>
          <button class="btn btn-primary btn-sm" onclick="App.switchAdminTab('menu')">
            <i class="fa-solid fa-list-check"></i> Kelola di Pengaturan Menu
          </button>
        </div>
      </div>
    `;
  },

  // --- TAB 1: VERIFIKASI PESERTA ---
  currentKabLimit: 25,

  changeKabLimit(limit) {
    this.currentKabLimit = parseInt(limit) || 25;
    this.loadKabupatenParticipants(1);
  },

  resetKabFilter() {
    const searchEl = document.getElementById('filterKabSearch');
    const catEl = document.getElementById('filterKabCategory');
    const unitEl = document.getElementById('filterKabUnit');
    const statusEl = document.getElementById('filterKabStatus');
    if (searchEl) searchEl.value = '';
    if (catEl) catEl.value = '';
    if (unitEl) unitEl.value = '';
    if (statusEl) statusEl.value = '';
    this.loadKabupatenParticipants(1);
  },

  async renderTabVerifikasi(container) {
    container.innerHTML = `
      <div class="panel-card" style="box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; padding: 1rem 1.25rem; background: #ffffff; border-bottom: 1px solid #e2e8f0;">
          <h3 class="panel-title" style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.5rem;">
            ${Icons.verification(22, 'var(--primary)')} Verifikasi Final Peserta & Kontingen Kabupaten
          </h3>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
            <button type="button" class="btn btn-primary btn-sm" style="font-weight: 700; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.8rem;" onclick="App.openUnitBreakdownModal()">
              <i class="fa-solid fa-school-flag"></i> Rekap Peserta per Unit
            </button>
            <button type="button" class="btn btn-success btn-sm" style="font-weight: 700; font-size: 0.8rem; background: #059669; border-color: #059669; color: white; display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.8rem;" onclick="App.openEventParticipantsOverviewModal()">
              <i class="fa-solid fa-users"></i> Peserta per Kegiatan
            </button>
          </div>
        </div>

        <!-- Filter & Control Toolbar -->
        <div class="table-filter-bar">
          <div class="filter-group-left">
            <div class="search-input-wrapper">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input type="text" id="filterKabSearch" placeholder="Cari nama / kode..." onkeydown="if(event.key==='Enter') App.loadKabupatenParticipants(1)">
            </div>
            <select id="filterKabCategory" class="filter-select" onchange="App.loadKabupatenParticipants(1)">
              <option value="">Semua Kategori</option>
              <option value="Peserta">Peserta PMR</option>
              <option value="Panitia">Panitia</option>
              <option value="Peninjau">Peninjau</option>
              <option value="Tamu Undangan">Tamu Undangan</option>
              <option value="Media">Media / Pers</option>
            </select>
            <select id="filterKabUnit" class="filter-select" onchange="App.loadKabupatenParticipants(1)">
              <option value="">Semua Unit Sekolah</option>
            </select>
            <select id="filterKabStatus" class="filter-select" onchange="App.loadKabupatenParticipants(1)">
              <option value="">Semua Status</option>
              <option value="verified_unit">Diverifikasi Unit</option>
              <option value="verified_kabupaten">Disetujui Kabupaten</option>
              <option value="pending_unit">Pending Unit</option>
              <option value="rejected">Ditolak</option>
            </select>
            <button type="button" class="btn-filter-reset" onclick="App.resetKabFilter()" title="Reset semua filter">
              <i class="fa-solid fa-rotate-left"></i> Reset
            </button>
          </div>
          <div class="filter-group-right">
            <span style="font-size: 0.8rem; color: #64748b; font-weight: 500;">Tampilkan:</span>
            <select id="filterKabLimit" class="filter-select" style="width: auto; padding: 0.35rem 0.5rem;" onchange="App.changeKabLimit(this.value)">
              <option value="10" ${this.currentKabLimit === 10 ? 'selected' : ''}>10</option>
              <option value="25" ${(!this.currentKabLimit || this.currentKabLimit === 25) ? 'selected' : ''}>25</option>
              <option value="50" ${this.currentKabLimit === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${this.currentKabLimit === 100 ? 'selected' : ''}>100</option>
            </select>
          </div>
        </div>

        <div id="kabParticipantTableContainer">
          <p style="color: var(--text-muted); padding: 1.5rem; text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data peserta...</p>
        </div>
      </div>
    `;

    const unitSelect = document.getElementById('filterKabUnit');
    if (unitSelect && this.cachedUnits.length) {
      unitSelect.innerHTML = '<option value="">Semua Unit Sekolah</option>' +
        this.cachedUnits.map(u => `<option value="${u.id}">${Utils.escapeHtml(u.name)}</option>`).join('');
    }

    this.loadKabupatenParticipants();
  },

  async loadKabupatenParticipants(page = 1) {
    const container = document.getElementById('kabParticipantTableContainer');
    if (!container) return;

    const unitId = document.getElementById('filterKabUnit')?.value || '';
    const status = document.getElementById('filterKabStatus')?.value || '';
    const category = document.getElementById('filterKabCategory')?.value || '';
    const search = document.getElementById('filterKabSearch')?.value || '';
    const limit = this.currentKabLimit || 25;

    try {
      const res = await API.getParticipants({
        unit_id: unitId,
        status,
        registration_type: category,
        search,
        page,
        limit
      });
      const participants = Array.isArray(res) ? res : (res.data || []);
      const pagination = res.pagination || null;

      if (!participants.length) {
        container.innerHTML = `
          <div style="padding: 2.5rem 1rem; text-align: center; color: var(--text-muted);">
            <i class="fa-solid fa-folder-open" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 0.5rem; display: block;"></i>
            <p style="margin: 0; font-weight: 500;">Tidak ada pendaftar yang sesuai dengan filter pencarian.</p>
          </div>
        `;
        return;
      }

      const desktopTableHtml = `
        <div class="verifikasi-desktop-table table-responsive" style="margin: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-code">Kode</th>
                <th class="col-name">Nama Pendaftar</th>
                <th class="col-unit">Unit PMR</th>
                <th class="col-category">Kategori / Tingkat</th>
                <th class="col-blood">Gol. Darah</th>
                <th class="col-doc">Surat Tugas</th>
                <th class="col-status">Status</th>
                <th class="col-actions">Aksi Verifikasi Final</th>
              </tr>
            </thead>
            <tbody>
              ${participants.map(p => {
        const isNonPeserta = p.registration_type && p.registration_type !== 'Peserta';
        const badgeCategoryHtml = isNonPeserta ? Utils.getLevelBadgeHtml(p.registration_type) : Utils.getLevelBadgeHtml(p.level);
        const escapedName = Utils.escapeHtml(p.full_name || '');
        const escapedUnit = Utils.escapeHtml(p.unit_name || '-');
        const photoUrl = p.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
        const subtext = isNonPeserta ? Utils.escapeHtml(p.registration_type) : (p.phone || '-');
        const hasBlood = p.blood_type && p.blood_type !== '-';

        return `
                <tr>
                  <td class="col-code"><span class="badge-code">${p.code}</span></td>
                  <td class="col-name">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                      <img src="${photoUrl}" class="participant-avatar" loading="lazy" onclick="window.open('${p.photo_url || photoUrl}', '_blank')" title="Klik untuk lihat foto asli">
                      <div style="min-width: 0; flex: 1;">
                        <div class="participant-name" title="${escapedName}">${escapedName}</div>
                        <div class="participant-subtext">${subtext}</div>
                      </div>
                    </div>
                  </td>
                  <td class="col-unit"><span title="${escapedUnit}">${escapedUnit}</span></td>
                  <td class="col-category">${badgeCategoryHtml}</td>
                  <td class="col-blood">
                    <span class="blood-badge ${hasBlood ? 'has-blood' : ''}">${p.blood_type || '-'}</span>
                  </td>
                  <td class="col-doc">
                    ${p.assignment_letter_url ? `
                      <a href="${p.assignment_letter_url}" target="_blank" class="btn-doc-link"><i class="fa-solid fa-file-pdf"></i> Surat Tugas</a>
                    ` : `<span class="badge-no-doc">Belum Upload</span>`}
                  </td>
                  <td class="col-status">${Utils.getStatusBadgeHtml(p.status)}</td>
                  <td class="col-actions">
                    <div class="action-btn-group">
                      <button class="btn-act btn-act-audit" onclick="App.openAuditModal(${p.id})" title="Pengecekan Audit Data, Pas Foto & Surat Tugas"><i class="fa-solid fa-clipboard-check"></i> Audit</button>
                      <button class="btn-act btn-act-edit" onclick="App.openEditParticipantModal(${p.id})" title="Edit Data & Berkas Peserta"><i class="fa-solid fa-user-pen"></i> Edit</button>
                      <button class="btn-act btn-act-card" onclick="App.openIDCardModal(${p.id})" title="Cetak ID Card">${Icons.idcard(13)} ID Card</button>
                      <button class="btn-act btn-act-delete" data-name="${escapedName}" onclick="event.stopPropagation(); App.deleteParticipant(${p.id}, this.dataset.name)" title="Hapus Data Peserta"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              `;}).join('')}
            </tbody>
          </table>
        </div>
      `;

      const mobileCardsHtml = `
        <div class="verifikasi-mobile-cards" style="padding: 0.75rem;">
          ${participants.map(p => {
        const isNonPeserta = p.registration_type && p.registration_type !== 'Peserta';
        const badgeCategoryHtml = isNonPeserta ? Utils.getLevelBadgeHtml(p.registration_type) : Utils.getLevelBadgeHtml(p.level);
        const escapedName = Utils.escapeHtml(p.full_name || '');
        const photoUrl = p.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
        return `
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); width: 100%; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.4rem;">
                  <span class="badge-code">${Utils.escapeHtml(p.code)}</span>
                  <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                    ${badgeCategoryHtml}
                    ${Utils.getStatusBadgeHtml(p.status)}
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem;">
                  <img src="${photoUrl}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); flex-shrink: 0;">
                  <div style="flex: 1; min-width: 0; word-break: break-word;">
                    <strong style="font-size: 0.92rem; color: #0f172a; display: block; line-height: 1.25;">${escapedName}</strong>
                    <div style="font-size: 0.78rem; color: #475569; margin-top: 0.15rem; word-break: break-word;">
                      Unit: <strong>${Utils.escapeHtml(p.unit_name || '-')}</strong> | Gol. Darah: <strong style="color: var(--primary);">${p.blood_type || '-'}</strong>
                    </div>
                  </div>
                </div>
                <div style="display: flex; gap: 0.3rem; flex-wrap: wrap; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #e2e8f0;">
                  <button class="btn btn-primary btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem;" onclick="App.openAuditModal(${p.id})"><i class="fa-solid fa-clipboard-check"></i> Audit</button>
                  <button class="btn btn-warning btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem; font-weight: 700; background: #f59e0b; border-color: #f59e0b; color: white;" onclick="App.openEditParticipantModal(${p.id})"><i class="fa-solid fa-user-pen"></i> Edit</button>
                  <button class="btn btn-outline btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem;" onclick="App.openIDCardModal(${p.id})">${Icons.idcard(12)} ID Card</button>
                  ${p.assignment_letter_url ? `<a href="${p.assignment_letter_url}" target="_blank" class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; color: var(--primary); border-color: var(--primary);"><i class="fa-solid fa-file-pdf"></i> Surat</a>` : ''}
                  <button class="btn btn-danger btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem; background: #fee2e2; border-color: #fca5a5; color: #dc2626; font-weight: 700;" data-name="${escapedName}" onclick="event.stopPropagation(); App.deleteParticipant(${p.id}, this.dataset.name)"><i class="fa-solid fa-trash-can"></i></button>
                </div>
              </div>
            `;
      }).join('')}
        </div>
      `;

      container.innerHTML = desktopTableHtml + mobileCardsHtml + this.renderPaginationHtml(pagination, 'App.loadKabupatenParticipants');
    } catch (err) {
      container.innerHTML = `<p style="color: red; padding: 1.5rem;">Gagal memuat peserta: ${err.message}</p>`;
    }
  },

  // --- TAB 2: CETAK ID CARD BATCH & DASHBOARD EDITOR LAYOUT ---
  transientTemplateDataUrl: null,

  async renderTabIDCard(container) {
    const s = this.appSettings || {};
    const catY = s.idcard_cat_y || '138';
    const photoX = s.idcard_photo_x || '0';
    const photoY = s.idcard_photo_y || '0';
    const photoW = s.idcard_photo_w || '110';
    const photoH = s.idcard_photo_h || '145';
    const nameY = s.idcard_name_y || '0';
    const nameSize = s.idcard_name_size || '17';
    const unitY = s.idcard_unit_y || '0';
    const unitSize = s.idcard_unit_size || '13';
    const qrX = s.idcard_qr_x || '0';
    const qrY = s.idcard_qr_y || '0';
    const qrSize = s.idcard_qr_size || '55';
    const paperSize = s.idcard_paper_size || 'a4';
    const gridCols = s.idcard_grid_cols || '2';

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.85rem; margin-bottom: 1rem;">
          <div>
            <h3 class="panel-title" style="margin-bottom: 0.2rem;">${Icons.idcard(20, 'var(--primary)')} Dashboard Editor Layout & Cetak ID Card</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">Atur posisi nama, utusan, foto 3x4, QR code, template background kustom & ukuran kertas cetak secara real-time</p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-outline btn-sm" onclick="App.toggleIDCardConfigPanel()"><i class="fa-solid fa-sliders"></i> Panel Editor Layout & Kertas</button>
            <button class="btn btn-primary btn-sm" onclick="window.print()"><i class="fa-solid fa-print"></i> Cetak / Simpan PDF Lembar ID Card</button>
          </div>
        </div>

        <!-- PANEL DASHBOARD EDITOR LAYOUT & UKURAN KERTAS -->
        <div id="idCardConfigPanel" style="display: block; margin-bottom: 1.5rem; background: #f8fafc; padding: 1.25rem; border-radius: 12px; border: 1px solid #cbd5e1;">
          
          <form onsubmit="App.handleSaveIDCardTemplate(event)">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; align-items: start;">
              
              <!-- KOLOM KIRI: SLIDERS & PENGATURAN KERTAS -->
              <div>
                <h4 style="font-size: 1rem; font-weight: 800; color: var(--secondary); margin-bottom: 1rem; border-bottom: 2px solid var(--primary); padding-bottom: 0.4rem; display: flex; align-items: center; gap: 0.5rem;">
                  <i class="fa-solid fa-sliders" style="color: var(--primary);"></i> Pengaturan Ukuran Kertas Cetak & Posisi Elemen
                </h4>

                <!-- GROUP 1: UKURAN KERTAS & GRID CETAK -->
                <div style="background: #ffffff; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 1rem;">
                  <h5 style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
                    <i class="fa-solid fa-print" style="color: #0284c7;"></i> 1. Ukuran Kertas & Layout Cetak PDF
                  </h5>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div class="form-group">
                      <label class="form-label" style="font-size: 0.8rem; font-weight: 700;">Ukuran Kertas Cetak:</label>
                      <select id="selectPaperSize" class="form-control" style="font-size: 0.85rem;" onchange="App.updateLiveIDCardPreview()">
                        <option value="a4" ${paperSize === 'a4' ? 'selected' : ''}>A4 (210 x 297 mm)</option>
                        <option value="f4" ${paperSize === 'f4' ? 'selected' : ''}>F4 / Folio (215 x 330 mm)</option>
                        <option value="letter" ${paperSize === 'letter' ? 'selected' : ''}>Letter (215.9 x 279.4 mm)</option>
                        <option value="cr80" ${paperSize === 'cr80' ? 'selected' : ''}>CR80 Kartu Tunggal (54 x 86 mm)</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label" style="font-size: 0.8rem; font-weight: 700;">Kolom per Halaman Cetak:</label>
                      <select id="selectGridCols" class="form-control" style="font-size: 0.85rem;" onchange="App.updateLiveIDCardPreview()">
                        <option value="2" ${gridCols === '2' ? 'selected' : ''}>2 Kolom (Standar A4/F4)</option>
                        <option value="3" ${gridCols === '3' ? 'selected' : ''}>3 Kolom (Hemat Kertas)</option>
                        <option value="1" ${gridCols === '1' ? 'selected' : ''}>1 Kolom (Large / Kartu Tunggal)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- GROUP 2: BACKGROUND TEMPLATE & HEADER TEXT -->
                <div style="background: #ffffff; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 1rem;">
                  <h5 style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                    <span><i class="fa-solid fa-image" style="color: #16a34a;"></i> 2. Upload Background Template & Header Teks</span>
                  </h5>
                  
                  <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 0.6rem 0.8rem; border-radius: 6px; font-size: 0.76rem; color: #475569; margin-bottom: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-circle-info" style="color: #0284c7; font-size: 0.9rem;"></i>
                    <span><strong>Informasi Mode Cetak:</strong> Teks Judul, Sub-Judul, Motto & Tanggal di bawah digunakan untuk <em>Template Standar Sistem</em>. Jika Anda mengunggah <strong>File Background Kustom</strong>, teks header ini otomatis disembunyikan agar menggunakan desain grafis background Anda.</span>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div>
                      <label class="form-label" style="font-size: 0.8rem; font-weight: 700;">File Gambar Template (PNG / JPG):</label>
                      <input type="file" id="idCardTemplateFileInput" accept="image/*" class="form-control" style="font-size: 0.82rem;" onchange="App.previewIDCardTemplateFile(event)">
                      ${s.idcard_template ? `
                        <button type="button" class="btn btn-outline btn-sm" style="margin-top: 0.4rem; color: #dc2626; border-color: #fca5a5; font-size: 0.75rem;" onclick="App.deleteIDCardTemplate()">
                          <i class="fa-solid fa-trash-can"></i> Hapus Background Kustom
                        </button>
                      ` : ''}
                    </div>
                    <div>
                      <label class="form-label" style="font-size: 0.8rem; font-weight: 700;">Judul Utama Event:</label>
                      <input type="text" id="idCardEventTitleInput" value="${Utils.escapeHtml(s.idcard_event_title || 'JUMBARA PMR IX')}" style="font-size: 0.85rem;" oninput="App.updateLiveIDCardPreview()">
                    </div>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem;">
                    <div>
                      <label class="form-label" style="font-size: 0.78rem;">Sub-Judul Event:</label>
                      <input type="text" id="idCardEventSubtitleInput" value="${Utils.escapeHtml(s.idcard_event_subtitle || 'PALANG MERAH INDONESIA TAHUN 2026')}" style="font-size: 0.82rem;" oninput="App.updateLiveIDCardPreview()">
                    </div>
                    <div>
                      <label class="form-label" style="font-size: 0.78rem;">Hashtag Motto:</label>
                      <input type="text" id="idCardMottoInput" value="${Utils.escapeHtml(s.idcard_motto || '#JUMBARAPMR2026')}" style="font-size: 0.82rem;" oninput="App.updateLiveIDCardPreview()">
                    </div>
                    <div>
                      <label class="form-label" style="font-size: 0.78rem;">Tanggal & Lokasi:</label>
                      <input type="text" id="idCardDateInput" value="${Utils.escapeHtml(s.idcard_date || 'Kabupaten, 2026')}" style="font-size: 0.82rem;" oninput="App.updateLiveIDCardPreview()">
                    </div>
                  </div>
                </div>

                <!-- GROUP 3: POSISI SLIDERS (KATEGORI & PAS FOTO 3x4) -->
                <div style="background: #ffffff; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 1rem;">
                  <h5 style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                    <span><i class="fa-solid fa-arrows-up-down-left-right" style="color: #ea580c;"></i> 3. Posisi Pita Kategori & Pas Foto 3x4</span>
                    <small style="color: var(--text-muted); font-size: 0.75rem;">Geser slider untuk ubah posisi real-time</small>
                  </h5>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
                    <!-- Cat Y -->
                    <div class="form-group">
                      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700;">
                        <label>Posisi Vertikal Pita Kategori (Y):</label>
                        <span class="slider-val-badge" data-for="sliderCatY">${catY}px</span>
                      </div>
                      <input type="range" id="sliderCatY" min="0" max="450" value="${catY}" class="form-control-range" oninput="App.updateLiveIDCardPreview()">
                    </div>

                    <!-- Photo X -->
                    <div class="form-group">
                      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700;">
                        <label>Pas Foto Position X (Geser Kiri/Kanan):</label>
                        <span class="slider-val-badge" data-for="sliderPhotoX">${photoX}px</span>
                      </div>
                      <input type="range" id="sliderPhotoX" min="-50" max="100" value="${photoX}" class="form-control-range" oninput="App.updateLiveIDCardPreview()">
                    </div>

                    <!-- Photo Y -->
                    <div class="form-group">
                      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700;">
                        <label>Pas Foto Position Y (Geser Atas/Bawah):</label>
                        <span class="slider-val-badge" data-for="sliderPhotoY">${photoY}px</span>
                      </div>
                      <input type="range" id="sliderPhotoY" min="-50" max="100" value="${photoY}" class="form-control-range" oninput="App.updateLiveIDCardPreview()">
                    </div>

                    <!-- Photo W & H -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                      <div class="form-group">
                        <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700;">
                          <label>Lebar Foto:</label>
                          <span class="slider-val-badge" data-for="sliderPhotoW">${photoW}px</span>
                        </div>
                        <input type="range" id="sliderPhotoW" min="60" max="160" value="${photoW}" class="form-control-range" oninput="App.updateLiveIDCardPreview()">
                      </div>
                      <div class="form-group">
                        <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700;">
                          <label>Tinggi Foto:</label>
                          <span class="slider-val-badge" data-for="sliderPhotoH">${photoH}px</span>
                        </div>
                        <input type="range" id="sliderPhotoH" min="80" max="200" value="${photoH}" class="form-control-range" oninput="App.updateLiveIDCardPreview()">
                      </div>
                    </div>
                  </div>
                </div>

                <!-- GROUP 4: TEKS NAMA, UTUSAN & FONT SIZE -->
                <div style="background: #ffffff; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 1rem;">
                  <h5 style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                    <span><i class="fa-solid fa-font" style="color: #7e22ce;"></i> 4. Posisi & Ukuran Font (Nama & Utusan)</span>
                  </h5>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
                    <!-- Name Y & Size -->
                    <div class="form-group">
                      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700;">
                        <label>Posisi Y Nama Peserta:</label>
                        <span class="slider-val-badge" data-for="sliderNameY">${nameY}px</span>
                      </div>
                      <input type="range" id="sliderNameY" min="-50" max="100" value="${nameY}" class="form-control-range" oninput="App.updateLiveIDCardPreview()">
                    </div>

                    <div class="form-group">
                      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700;">
                        <label>Ukuran Font Nama:</label>
                        <span class="slider-val-badge" data-for="sliderNameSize">${nameSize}px</span>
                      </div>
                      <input type="range" id="sliderNameSize" min="10" max="26" value="${nameSize}" class="form-control-range" oninput="App.updateLiveIDCardPreview()">
                    </div>

                    <!-- Unit Y & Size -->
                    <div class="form-group">
                      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700;">
                        <label>Posisi Y Utusan / Asal:</label>
                        <span class="slider-val-badge" data-for="sliderUnitY">${unitY}px</span>
                      </div>
                      <input type="range" id="sliderUnitY" min="-50" max="100" value="${unitY}" class="form-control-range" oninput="App.updateLiveIDCardPreview()">
                    </div>

                    <div class="form-group">
                      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700;">
                        <label>Ukuran Font Utusan:</label>
                        <span class="slider-val-badge" data-for="sliderUnitSize">${unitSize}px</span>
                      </div>
                      <input type="range" id="sliderUnitSize" min="8" max="22" value="${unitSize}" class="form-control-range" oninput="App.updateLiveIDCardPreview()">
                    </div>
                  </div>
                </div>

                <!-- GROUP 5: QR CODE POSITION & SIZE -->
                <div style="background: #ffffff; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 1rem;">
                  <h5 style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                    <span><i class="fa-solid fa-qrcode" style="color: #0d9488;"></i> 5. Posisi & Ukuran QR Code Presensi</span>
                  </h5>

                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
                    <!-- QR X -->
                    <div class="form-group">
                      <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700;">
                        <label>Posisi QR X:</label>
                        <span class="slider-val-badge" data-for="sliderQrX">${qrX}px</span>
                      </div>
                      <input type="range" id="sliderQrX" min="-50" max="100" value="${qrX}" class="form-control-range" oninput="App.updateLiveIDCardPreview()">
                    </div>

                    <!-- QR Y -->
                    <div class="form-group">
                      <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700;">
                        <label>Posisi QR Y:</label>
                        <span class="slider-val-badge" data-for="sliderQrY">${qrY}px</span>
                      </div>
                      <input type="range" id="sliderQrY" min="-50" max="100" value="${qrY}" class="form-control-range" oninput="App.updateLiveIDCardPreview()">
                    </div>

                    <!-- QR Size -->
                    <div class="form-group">
                      <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700;">
                        <label>Ukuran QR:</label>
                        <span class="slider-val-badge" data-for="sliderQrSize">${qrSize}px</span>
                      </div>
                      <input type="range" id="sliderQrSize" min="35" max="120" value="${qrSize}" class="form-control-range" oninput="App.updateLiveIDCardPreview()">
                    </div>
                  </div>
                </div>

                <!-- ACTION BUTTONS -->
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                  <button type="button" class="btn btn-outline btn-sm" onclick="App.resetIDCardLayoutDefaults()"><i class="fa-solid fa-rotate-left"></i> Reset Posisi Standard</button>
                  <button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> Simpan Layout & Ukuran Kertas</button>
                </div>

              </div>

              <!-- KOLOM KANAN: REAL-TIME STICKY LIVE PREVIEW CARD -->
              <div style="position: sticky; top: 85px;">
                <div style="background: #ffffff; padding: 1rem; border-radius: 10px; border: 2px solid var(--primary); box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem;">
                    <h5 style="font-size: 0.88rem; font-weight: 800; color: var(--primary); margin: 0; display: flex; align-items: center; gap: 0.35rem;">
                      <i class="fa-solid fa-eye"></i> Live Interactive Preview
                    </h5>
                    <span class="badge badge-success" style="font-size: 0.7rem;"><i class="fa-solid fa-bolt"></i> Live Real-Time</span>
                  </div>

                  <div id="idCardLivePreviewCard" style="display: flex; justify-content: center; transform: scale(0.88); transform-origin: top center; margin-bottom: -40px;">
                    <!-- Live Card content will be injected by updateLiveIDCardPreview() -->
                  </div>

                  <small style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 0.5rem;">
                    * Tampilan pratinjau ini diperbarui secara langsung saat Anda menggeser slider di samping.
                  </small>
                </div>
              </div>

            </div>
          </form>
        </div>

        <!-- BATCH CARD DISPLAY AREA -->
        <div id="idCardBatchContainer" class="printable-area grid-cols-${gridCols}" style="display: grid; grid-template-columns: repeat(${gridCols}, 1fr); gap: 1.5rem;">
          <p style="color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Memuat daftar ID Card peserta terverifikasi...</p>
        </div>
      </div>
    `;

    // Render Live Preview immediately
    this.updateLiveIDCardPreview();

    // Load verified participants into batch container
    try {
      const res = await API.getParticipants({ status: 'verified_kabupaten', all: 'true' });
      const verifiedParticipants = Array.isArray(res) ? res : (res.data || []);
      const batchContainer = document.getElementById('idCardBatchContainer');

      if (!verifiedParticipants.length) {
        batchContainer.innerHTML = '<p style="color: var(--text-muted);">Belum ada peserta yang disetujui Kabupaten untuk dicetak ID Card-nya.</p>';
        return;
      }

      const cardsHtml = await Promise.all(verifiedParticipants.map(async p => {
        const idcardData = await API.getParticipantIDCard(p.id);
        return this.generateIDCardHtml(idcardData);
      }));

      batchContainer.innerHTML = cardsHtml.join('');
    } catch (err) {
      console.error('ID Card batch error:', err);
    }
  },

  updateLiveIDCardPreview() {
    const previewBox = document.getElementById('idCardLivePreviewCard');
    if (!previewBox) return;

    const currentFormSettings = {
      ...this.appSettings,
      idcard_template: this.transientTemplateDataUrl || this.appSettings?.idcard_template || '',
      idcard_cat_y: document.getElementById('sliderCatY')?.value || '138',
      idcard_photo_x: document.getElementById('sliderPhotoX')?.value || '0',
      idcard_photo_y: document.getElementById('sliderPhotoY')?.value || '0',
      idcard_photo_w: document.getElementById('sliderPhotoW')?.value || '110',
      idcard_photo_h: document.getElementById('sliderPhotoH')?.value || '145',
      idcard_name_y: document.getElementById('sliderNameY')?.value || '0',
      idcard_name_size: document.getElementById('sliderNameSize')?.value || '17',
      idcard_unit_y: document.getElementById('sliderUnitY')?.value || '0',
      idcard_unit_size: document.getElementById('sliderUnitSize')?.value || '13',
      idcard_qr_x: document.getElementById('sliderQrX')?.value || '0',
      idcard_qr_y: document.getElementById('sliderQrY')?.value || '0',
      idcard_qr_size: document.getElementById('sliderQrSize')?.value || '55',
      idcard_paper_size: document.getElementById('selectPaperSize')?.value || 'a4',
      idcard_grid_cols: document.getElementById('selectGridCols')?.value || '2',
      idcard_event_title: document.getElementById('idCardEventTitleInput')?.value || 'JUMBARA & TEMU KARYA',
      idcard_event_subtitle: document.getElementById('idCardEventSubtitleInput')?.value || 'PMI DAERAH ISTIMEWA YOGYAKARTA TAHUN 2025',
      idcard_motto: document.getElementById('idCardMottoInput')?.value || '#JUMTEKPMIDIY2025',
      idcard_date: document.getElementById('idCardDateInput')?.value || 'SLEMAN, 27-29 September 2025'
    };

    // Update badge text values
    document.querySelectorAll('.slider-val-badge').forEach(badge => {
      const targetId = badge.dataset.for;
      const input = document.getElementById(targetId);
      if (input) {
        badge.textContent = `${input.value}px`;
      }
    });

    // Update batch container grid class
    const batchContainer = document.getElementById('idCardBatchContainer');
    if (batchContainer) {
      batchContainer.style.gridTemplateColumns = `repeat(${currentFormSettings.idcard_grid_cols}, 1fr)`;
    }

    // Update dynamic print paper style tag
    let dynamicStyle = document.getElementById('dynamicIDCardPrintStyle');
    if (!dynamicStyle) {
      dynamicStyle = document.createElement('style');
      dynamicStyle.id = 'dynamicIDCardPrintStyle';
      document.head.appendChild(dynamicStyle);
    }

    let paperSizeRule = '@page { size: A4 portrait; margin: 10mm; }';
    if (currentFormSettings.idcard_paper_size === 'f4') {
      paperSizeRule = '@page { size: 215mm 330mm; margin: 10mm; }';
    } else if (currentFormSettings.idcard_paper_size === 'letter') {
      paperSizeRule = '@page { size: letter portrait; margin: 10mm; }';
    } else if (currentFormSettings.idcard_paper_size === 'cr80') {
      paperSizeRule = '@page { size: 54mm 86mm; margin: 0; }';
    }

    dynamicStyle.textContent = `@media print { ${paperSizeRule} }`;

    // Sample data for live preview
    const sampleData = {
      full_name: 'ANANDA PUTRI WULANDARI',
      unit_name: 'PMR WIRA SMA NEGERI 1',
      registration_type: 'Peserta',
      code: 'JMB-2026-0001',
      nik: '3401074802830002',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      qr_code_base64: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=JMB-2026-0001'
    };

    previewBox.innerHTML = this.generateIDCardHtml(sampleData, currentFormSettings);
  },

  toggleIDCardConfigPanel() {
    const panel = document.getElementById('idCardConfigPanel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  },

  previewIDCardTemplateFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.transientTemplateDataUrl = reader.result;
      this.updateLiveIDCardPreview();
    };
    reader.readAsDataURL(file);
  },

  async handleSaveIDCardTemplate(e) {
    if (e) e.preventDefault();
    try {
      const fileInput = document.getElementById('idCardTemplateFileInput');
      if (fileInput && fileInput.files[0]) {
        const templateDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(fileInput.files[0]);
        });

        const uploadRes = await API.uploadSettingFile('idcard_template', templateDataUrl);
        Utils.showToast(uploadRes.message, 'success');
      }

      const eventTitle = document.getElementById('idCardEventTitleInput')?.value.trim() || 'JUMBARA & TEMU KARYA';
      const eventSubtitle = document.getElementById('idCardEventSubtitleInput')?.value.trim() || '';
      const eventMotto = document.getElementById('idCardMottoInput')?.value.trim() || '';
      const eventDate = document.getElementById('idCardDateInput')?.value.trim() || '';

      const catY = document.getElementById('sliderCatY')?.value || '138';
      const photoX = document.getElementById('sliderPhotoX')?.value || '0';
      const photoY = document.getElementById('sliderPhotoY')?.value || '0';
      const photoW = document.getElementById('sliderPhotoW')?.value || '110';
      const photoH = document.getElementById('sliderPhotoH')?.value || '145';
      const nameY = document.getElementById('sliderNameY')?.value || '0';
      const nameSize = document.getElementById('sliderNameSize')?.value || '17';
      const unitY = document.getElementById('sliderUnitY')?.value || '0';
      const unitSize = document.getElementById('sliderUnitSize')?.value || '13';
      const qrX = document.getElementById('sliderQrX')?.value || '0';
      const qrY = document.getElementById('sliderQrY')?.value || '0';
      const qrSize = document.getElementById('sliderQrSize')?.value || '55';
      const paperSize = document.getElementById('selectPaperSize')?.value || 'a4';
      const gridCols = document.getElementById('selectGridCols')?.value || '2';

      const res = await API.updateSettings({
        idcard_event_title: eventTitle,
        idcard_event_subtitle: eventSubtitle,
        idcard_motto: eventMotto,
        idcard_date: eventDate,
        idcard_cat_y: catY,
        idcard_photo_x: photoX,
        idcard_photo_y: photoY,
        idcard_photo_w: photoW,
        idcard_photo_h: photoH,
        idcard_name_y: nameY,
        idcard_name_size: nameSize,
        idcard_unit_y: unitY,
        idcard_unit_size: unitSize,
        idcard_qr_x: qrX,
        idcard_qr_y: qrY,
        idcard_qr_size: qrSize,
        idcard_paper_size: paperSize,
        idcard_grid_cols: gridCols
      });

      Utils.showToast(res.message || 'Pengaturan layout & kertas berhasil disimpan!', 'success');
      this.transientTemplateDataUrl = null;

      // Reload App Settings
      this.appSettings = await API.getSettings();

      // Re-render Tab ID Card
      const content = document.getElementById('adminTabContent');
      if (content) this.renderTabIDCard(content);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async deleteIDCardTemplate() {
    if (!confirm('Apakah Anda yakin ingin menghapus gambar background template kustom? Card akan kembali menggunakan header standar PMI.')) return;
    try {
      this.transientTemplateDataUrl = null;
      await API.resetSettingFile('idcard_template');
      Utils.showToast('Gambar background template kustom berhasil dihapus.', 'success');
      this.appSettings = await API.getSettings();
      const content = document.getElementById('adminTabContent');
      if (content) this.renderTabIDCard(content);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async resetIDCardLayoutDefaults() {
    if (!confirm('Apakah Anda yakin ingin mengembalikan seluruh ukuran, posisi (X/Y), dan font ke nilai standar default?')) return;
    try {
      this.transientTemplateDataUrl = null;
      await API.updateSettings({
        idcard_cat_y: '138',
        idcard_photo_x: '0',
        idcard_photo_y: '0',
        idcard_photo_w: '110',
        idcard_photo_h: '145',
        idcard_name_y: '0',
        idcard_name_size: '17',
        idcard_unit_y: '0',
        idcard_unit_size: '13',
        idcard_qr_x: '0',
        idcard_qr_y: '0',
        idcard_qr_size: '55',
        idcard_paper_size: 'a4',
        idcard_grid_cols: '2'
      });
      Utils.showToast('Pengaturan posisi layout & ukuran kertas berhasil di-reset ke standar.', 'success');
      this.appSettings = await API.getSettings();
      const content = document.getElementById('adminTabContent');
      if (content) this.renderTabIDCard(content);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  // --- TAB 3: PRESENSI QR CODE SCANNER ---
  // --- TAB 3: PRESENSI QR CODE SCANNER (MASUK & KELUAR WITH REGISTRATION CHECK) ---
  currentPresensiType: 'masuk',
  isAudioSoundEnabled: true,

  testAudioSound() {
    this.playAudioBeep('masuk');
    Utils.showToast('🔊 Suara efek scanner bip aktif!', 'info');
  },

  playAudioBeep(type = 'masuk') {
    if (!this.isAudioSoundEnabled) return;

    // Haptic vibration feedback for mobile HP
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        if (type === 'masuk' || type === 'keluar') {
          navigator.vibrate(120);
        } else {
          navigator.vibrate([180, 80, 180]);
        }
      }
    } catch (e) { }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      if (type === 'masuk') {
        // High crisp barcode scanner BEEP (2093Hz - C7)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2093, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.09);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.09);
      } else if (type === 'keluar') {
        // Double tone scanner beep (1760Hz -> 1318Hz)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1318, audioCtx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else {
        // Error warning double buzz (260Hz -> 180Hz)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, audioCtx.currentTime);
        osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.45, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch (e) {
      console.log('Audio beep error:', e);
    }
  },

  async renderTabPresensi(container) {
    container.innerHTML = `
      <div class="panel-card presensi-panel-card">
        <div class="presensi-header-banner">
          <div class="presensi-header-title">
            <h3>
              <i class="fa-solid fa-qrcode" style="color: #ef4444;"></i> <span>Pemindai Presensi Kegiatan & Agenda</span>
            </h3>
            <p>Sistem memvalidasi status verifikasi peserta & pendaftaran resmi pada agenda kegiatan sebelum mencatat presensi.</p>
          </div>
        </div>

        <div class="presensi-grid-layout">
          
          <!-- SCANNER CONTROL PANEL -->
          <div class="scanner-control-panel">
            
            <!-- AUDIO SOUND BANNER -->
            <div class="audio-sound-banner">
              <div class="audio-sound-info">
                <i class="fa-solid fa-volume-high" style="color: #16a34a; font-size: 0.95rem;"></i>
                <span>Nada Beep:</span>
                <span class="audio-status-pill">AKTIF</span>
              </div>
              <button type="button" class="btn btn-outline btn-sm btn-sound-test" onclick="App.testAudioSound()" title="Tes bunyi nada scanner">
                <i class="fa-solid fa-circle-play"></i> <span>Tes Suara</span>
              </button>
            </div>

            <!-- MODE PRESENSI TOGGLE BUTTONS (MASUK / KELUAR) -->
            <div class="presensi-form-group">
              <label class="presensi-form-label">Mode Presensi *</label>
              <div class="presensi-mode-switcher">
                <button type="button" id="btnPresensiMasuk" class="presensi-mode-tab active mode-masuk" onclick="App.setPresensiMode('masuk')">
                  <span class="badge-dot dot-green"></span>
                  <i class="fa-solid fa-right-to-bracket"></i>
                  <span>Masuk (Check-In)</span>
                </button>
                <button type="button" id="btnPresensiKeluar" class="presensi-mode-tab inactive" onclick="App.setPresensiMode('keluar')">
                  <span class="badge-dot dot-red"></span>
                  <i class="fa-solid fa-right-from-bracket"></i>
                  <span>Keluar (Check-Out)</span>
                </button>
              </div>
            </div>

            <!-- SELECT EVENT -->
            <div class="presensi-form-group">
              <label class="presensi-form-label">Agenda Kegiatan Jumbara *</label>
              <select id="presensiEventId" class="presensi-select" required onchange="App.loadEventAttendanceLog(this.value); App.focusScanInput();">
                <option value="">-- Pilih Kegiatan / Lomba Jumbara --</option>
                ${this.cachedEvents.map(e => `<option value="${e.id}">${Utils.escapeHtml(e.title)} (${e.event_date}) - [${e.category} / ${e.pmr_level}]</option>`).join('')}
              </select>
            </div>

            <!-- INPUT / AUTO SCANNER CODE -->
            <div class="presensi-form-group">
              <label class="presensi-form-label">Scan Barcode / Kode Peserta</label>
              <div class="presensi-input-row">
                <input type="text" id="presensiScanCode" class="presensi-input" placeholder="Scan QR / ketik JMB-2026-..." onkeyup="if(event.key==='Enter') App.handleScanPresensi()" oninput="App.checkAutoScanTrigger(this.value)">
                <button class="btn btn-primary btn-scan-action" onclick="App.handleScanPresensi()">
                  <i class="fa-solid fa-qrcode"></i> <span>Scan</span>
                </button>
              </div>
              <small class="presensi-auto-hint">
                <i class="fa-solid fa-bolt" style="color: #10b981;"></i> Auto-Scan Aktif untuk Barcode Scanner USB
              </small>
            </div>

            <!-- KAMERA HP / WEBCAM BUTTON -->
            <div style="margin-bottom: 0.95rem;">
              <button type="button" id="btnToggleCamera" class="btn btn-camera-toggle" onclick="App.toggleCameraScanner()">
                <i class="fa-solid fa-camera"></i> <span>Buka Kamera HP / Webcam untuk Scan QR</span>
              </button>
            </div>

            <!-- CAMERA PREVIEW CONTAINER FOR MOBILE HP -->
            <div id="cameraScannerWrapper" style="display: none;">
              <div class="camera-scanner-header">
                <div class="camera-scanner-title">
                  <span class="live-pulse-dot" style="background: #22c55e;"></span>
                  <span>Kamera HP Aktif</span>
                </div>
                <div class="camera-scanner-actions">
                  <button type="button" class="btn btn-sm btn-camera-switch" onclick="App.switchCameraFacingMode()" title="Ganti Kamera Depan/Belakang">
                    <i class="fa-solid fa-camera-rotate"></i> <span>Ganti</span>
                  </button>
                  <button type="button" class="btn btn-sm btn-camera-close" onclick="App.stopCameraScanner()" title="Tutup Kamera">
                    <i class="fa-solid fa-xmark"></i> <span>Tutup</span>
                  </button>
                </div>
              </div>
              <div id="qr-reader"></div>
              <div class="camera-scanner-hint">
                <i class="fa-solid fa-qrcode"></i> Arahkan kamera ke QR Code ID Card peserta. Presensi akan dicatat otomatis!
              </div>
            </div>

            <!-- LIVE SCAN RESULT ALERT BOX -->
            <div id="scanResultAlert" style="display: none; margin-top: 0.75rem; padding: 0.85rem; border-radius: 10px;"></div>
          </div>

          <!-- LOG TABLE AREA -->
          <div class="attendance-log-column">
            <div class="attendance-log-header">
              <h4 class="attendance-log-title">
                <i class="fa-solid fa-list-check"></i> <span>Log Riwayat Presensi Peserta</span>
              </h4>
              <button class="btn btn-outline btn-sm btn-refresh-attendance" onclick="App.loadEventAttendanceLog(document.getElementById('presensiEventId')?.value)">
                <i class="fa-solid fa-arrows-rotate"></i> <span>Refresh</span>
              </button>
            </div>

            <div id="attendanceLogTableContainer">
              <p style="color: var(--text-muted); font-size: 0.88rem; padding: 1rem 0;">Pilih kegiatan di atas untuk melihat log presensi.</p>
            </div>
          </div>

        </div>
      </div>
    `;

    this.currentPresensiType = 'masuk';
    this.updatePresensiModeUI();

    if (this.cachedEvents.length) {
      document.getElementById('presensiEventId').value = this.cachedEvents[0].id;
      this.loadEventAttendanceLog(this.cachedEvents[0].id);
    }

    setTimeout(() => this.focusScanInput(), 100);
  },

  focusScanInput() {
    const el = document.getElementById('presensiScanCode');
    if (el) {
      el.focus();
    }
  },

  autoScanTimeout: null,
  checkAutoScanTrigger(val) {
    if (this.autoScanTimeout) clearTimeout(this.autoScanTimeout);
    const code = val.trim();
    // If exact standard participant code (e.g., JMB-2026-0001) is pasted or typed
    if (/^JMB-\d{4}-\d{4}$/i.test(code)) {
      this.handleScanPresensi();
      return;
    }
    // Debounce fast input from barcode scanner gun
    if (code.length >= 8) {
      this.autoScanTimeout = setTimeout(() => {
        this.handleScanPresensi();
      }, 350);
    }
  },

  setPresensiMode(type) {
    this.currentPresensiType = type;
    this.updatePresensiModeUI();
    this.focusScanInput();
  },

  updatePresensiModeUI() {
    const btnMasuk = document.getElementById('btnPresensiMasuk');
    const btnKeluar = document.getElementById('btnPresensiKeluar');
    if (!btnMasuk || !btnKeluar) return;

    if (this.currentPresensiType === 'masuk') {
      btnMasuk.className = 'presensi-mode-tab active mode-masuk';
      btnKeluar.className = 'presensi-mode-tab inactive';
    } else {
      btnMasuk.className = 'presensi-mode-tab inactive';
      btnKeluar.className = 'presensi-mode-tab active mode-keluar';
    }
  },

  cameraFacingMode: 'environment',

  async switchCameraFacingMode() {
    this.cameraFacingMode = (this.cameraFacingMode === 'environment') ? 'user' : 'environment';
    Utils.showToast(`Memindahkan ke ${this.cameraFacingMode === 'environment' ? 'Kamera Belakang HP' : 'Kamera Depan HP'}...`, 'info');
    await this.startCameraScanner();
  },

  toggleCameraScanner() {
    if (this.isScanningCameraActive) {
      this.stopCameraScanner();
    } else {
      this.startCameraScanner();
    }
  },

  async startCameraScanner() {
    const wrapper = document.getElementById('cameraScannerWrapper');
    const btn = document.getElementById('btnToggleCamera');
    if (!wrapper) return;

    if (typeof Html5QrcodeScanner === 'undefined' && typeof Html5Qrcode === 'undefined') {
      Utils.showToast('Pustaka scanner kamera belum dimuat. Periksa koneksi internet.', 'error');
      return;
    }

    wrapper.style.display = 'block';
    if (btn) btn.innerHTML = '<i class="fa-solid fa-square-xmark"></i> <span>Tutup Kamera HP / Webcam</span>';

    try {
      if (this.html5QrScannerInstance) {
        await this.stopCameraScanner();
      }

      this.isScanningCameraActive = true;
      wrapper.style.display = 'block';
      const html5QrCode = new Html5Qrcode("qr-reader");
      this.html5QrScannerInstance = html5QrCode;

      const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        let code = decodedText.trim();
        const match = code.match(/(JMB-\d{4}-\d{4})/i);
        if (match) {
          code = match[1];
        }

        const inputEl = document.getElementById('presensiScanCode');
        if (inputEl) {
          inputEl.value = code;
        }

        try {
          html5QrCode.pause();
        } catch (e) { }

        this.handleScanPresensi();

        setTimeout(() => {
          try {
            if (this.isScanningCameraActive && html5QrCode) {
              html5QrCode.resume();
            }
          } catch (e) { }
        }, 1500);
      };

      const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdge * 0.72);
        return {
          width: Math.max(160, Math.min(qrboxSize, 240)),
          height: Math.max(160, Math.min(qrboxSize, 240))
        };
      };
      const config = { fps: 15, qrbox: qrboxFunction };

      const cameraConstraint = { facingMode: this.cameraFacingMode };

      html5QrCode.start(cameraConstraint, config, qrCodeSuccessCallback)
        .catch(err => {
          console.warn("Unable to start specified camera, falling back:", err);
          html5QrCode.start({ facingMode: "user" }, config, qrCodeSuccessCallback);
        });

      wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (e) {
      console.error("Camera Scanner Error:", e);
      Utils.showToast('Gagal membuka kamera: ' + e.message, 'error');
    }
  },

  async stopCameraScanner() {
    const wrapper = document.getElementById('cameraScannerWrapper');
    const btn = document.getElementById('btnToggleCamera');
    if (wrapper) wrapper.style.display = 'none';
    if (btn) btn.innerHTML = '<i class="fa-solid fa-camera"></i> <span>Buka Kamera HP / Webcam untuk Scan QR</span>';

    if (this.html5QrScannerInstance) {
      try {
        await this.html5QrScannerInstance.stop();
        this.html5QrScannerInstance.clear();
      } catch (e) {
        console.log("Stop camera error:", e);
      }
      this.html5QrScannerInstance = null;
    }
    this.isScanningCameraActive = false;
  },

  async handleScanPresensi() {
    const eventId = document.getElementById('presensiEventId')?.value;
    const codeInput = document.getElementById('presensiScanCode');
    const code = codeInput?.value?.trim();
    const alertBox = document.getElementById('scanResultAlert');
    const type = this.currentPresensiType || 'masuk';

    if (!eventId || !code) {
      Utils.showToast('Pilih kegiatan dan masukkan/scan kode peserta.', 'warning');
      this.focusScanInput();
      return;
    }

    try {
      const res = await API.scanAttendance(code, eventId, type);
      this.playAudioBeep(type);

      alertBox.style.display = 'block';
      alertBox.style.background = (type === 'masuk') ? '#ecfdf5' : '#eff6ff';
      alertBox.style.border = (type === 'masuk') ? '2px solid #10b981' : '2px solid #3b82f6';
      alertBox.style.color = (type === 'masuk') ? '#065f46' : '#1e40af';

      const badgeIcon = (type === 'masuk') ? '🟢 PRESENSI MASUK BERHASIL (Check-In)' : '🔵 PRESENSI KELUAR BERHASIL (Check-Out)';

      alertBox.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 0.85rem; flex-wrap: wrap;">
          <img src="${res.participant.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 2px solid ${type === 'masuk' ? '#10b981' : '#3b82f6'}; flex-shrink: 0;">
          <div style="flex: 1; min-width: 200px; word-break: break-word; overflow-wrap: break-word;">
            <div style="font-weight: 800; font-size: 0.95rem; margin-bottom: 0.25rem;">${badgeIcon}</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: #0f172a; word-break: break-word;">${Utils.escapeHtml(res.participant.full_name)} <span style="font-size: 0.85rem; color: var(--primary);">(${res.participant.code})</span></div>
            <div style="font-size: 0.85rem; color: #475569; margin-top: 0.15rem; word-break: break-word;">
              Unit: <strong>${Utils.escapeHtml(res.participant.unit_name || '-')}</strong> | Tingkat: <strong>${res.participant.level}</strong>
            </div>
            <div style="font-size: 0.8rem; margin-top: 0.35rem; color: #334155; font-weight: 600; word-break: break-word;">
              Kegiatan: <em>${Utils.escapeHtml(res.event.title)}</em> | Jam: ${res.timestamp}
            </div>
          </div>
        </div>
      `;

      if (codeInput) codeInput.value = '';
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      this.focusScanInput();
      this.loadEventAttendanceLog(eventId);
    } catch (err) {
      this.playAudioBeep('error');
      alertBox.style.display = 'block';
      alertBox.style.background = '#fef2f2';
      alertBox.style.border = '2px solid #ef4444';
      alertBox.style.color = '#991b1b';

      alertBox.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
          <div style="font-size: 1.5rem; color: #ef4444;"><i class="fa-solid fa-circle-xmark"></i></div>
          <div>
            <strong style="font-size: 0.95rem; display: block; margin-bottom: 0.25rem;">🛑 PRESENSI DITOLAK SYSTEM</strong>
            <span style="font-size: 0.88rem; line-height: 1.4; display: block;">${Utils.escapeHtml(err.message)}</span>
          </div>
        </div>
      `;

      if (codeInput) codeInput.value = '';
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      this.focusScanInput();
    }
  },

  async loadEventAttendanceLog(eventId) {
    const container = document.getElementById('attendanceLogTableContainer');
    if (!container || !eventId) return;

    try {
      const res = await API.getEventAttendance(eventId);
      const logs = Array.isArray(res) ? res : (res.logs || []);
      const stats = (!Array.isArray(res) && res.stats) ? res.stats : null;

      let statsHtml = '';
      if (stats) {
        statsHtml = `
          <div class="presensi-stats-grid">
            <div class="presensi-stat-card stat-total" onclick="App.openRegisteredParticipantsModal(${eventId})" title="Klik untuk lihat daftar pendaftar">
              <div class="stat-top">
                <span class="stat-label">Total Pendaftar</span>
                <i class="fa-solid fa-users stat-icon"></i>
              </div>
              <div class="stat-value">${stats.total_registered} <span class="stat-unit">Orang</span></div>
              <div class="stat-footer"><i class="fa-solid fa-clipboard-list"></i> Terdaftar (Lihat 📋)</div>
            </div>

            <div class="presensi-stat-card stat-masuk">
              <div class="stat-top">
                <span class="stat-label">Presensi Masuk</span>
                <i class="fa-solid fa-right-to-bracket stat-icon"></i>
              </div>
              <div class="stat-value">${stats.total_masuk} <span class="stat-pct">(${stats.percentage}%)</span></div>
              <div class="stat-footer"><span class="badge-dot dot-green"></span> Check-In</div>
            </div>

            <div class="presensi-stat-card stat-keluar">
              <div class="stat-top">
                <span class="stat-label">Presensi Keluar</span>
                <i class="fa-solid fa-right-from-bracket stat-icon"></i>
              </div>
              <div class="stat-value">${stats.total_keluar} <span class="stat-unit">Orang</span></div>
              <div class="stat-footer"><span class="badge-dot dot-amber"></span> Check-Out</div>
            </div>

            <div class="presensi-stat-card stat-belum">
              <div class="stat-top">
                <span class="stat-label">Belum Presensi</span>
                <i class="fa-solid fa-clock stat-icon"></i>
              </div>
              <div class="stat-value">${stats.belum_presensi} <span class="stat-unit">Orang</span></div>
              <div class="stat-footer"><span class="badge-dot dot-rose"></span> Belum Hadir</div>
            </div>
          </div>
          <div style="margin-bottom: 0.85rem;">
            <button type="button" class="btn btn-registered-detail" onclick="App.openRegisteredParticipantsModal(${eventId})">
              <i class="fa-solid fa-users"></i> <span>📋 Lihat Detail Daftar Peserta Terdaftar Kegiatan Ini (${stats.total_registered} Peserta)</span>
            </button>
          </div>
        `;
      }

      if (!logs.length) {
        container.innerHTML = statsHtml + '<p style="color: var(--text-muted); padding: 1rem 0; text-align: center;">Belum ada data presensi (masuk / keluar) untuk kegiatan ini.</p>';
        return;
      }

      // Group logs by participant to display paired Jam Masuk and Jam Keluar
      const participantLogsMap = {};
      logs.forEach(l => {
        const pid = l.participant_id;
        if (!participantLogsMap[pid]) {
          participantLogsMap[pid] = {
            participant_id: pid,
            full_name: l.full_name,
            participant_code: l.participant_code,
            level: l.level,
            photo_url: l.photo_url,
            unit_name: l.unit_name,
            jam_masuk: null,
            jam_keluar: null
          };
        }
        const st = (l.status || '').toLowerCase();
        if ((st === 'masuk' || st === 'hadir') && !participantLogsMap[pid].jam_masuk) {
          participantLogsMap[pid].jam_masuk = l.scanned_at;
        } else if (st === 'keluar' && !participantLogsMap[pid].jam_keluar) {
          participantLogsMap[pid].jam_keluar = l.scanned_at;
        }
      });

      const pairedLogs = Object.values(participantLogsMap);

      // Render Desktop Table View with Jam Masuk & Jam Keluar
      const desktopTableHtml = `
        <div class="presensi-desktop-log-table table-responsive" style="overflow-x: auto; max-width: 100%; border-radius: 8px; border: 1px solid var(--border-color);">
          <table class="data-table" style="width: 100%; min-width: 680px; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="min-width: 180px;">Kode & Nama Peserta</th>
                <th style="min-width: 130px;">Unit PMR</th>
                <th style="min-width: 140px; white-space: nowrap;">🟢 Jam Masuk (Check-In)</th>
                <th style="min-width: 140px; white-space: nowrap;">🔴 Jam Keluar (Check-Out)</th>
                <th style="min-width: 100px; white-space: nowrap;">⏱️ Durasi</th>
                <th style="min-width: 110px; white-space: nowrap;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${pairedLogs.map(p => {
        const formatTime = (ts) => {
          if (!ts) return null;
          const d = new Date(ts);
          return {
            time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
            date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
          };
        };

        const masuk = formatTime(p.jam_masuk);
        const keluar = formatTime(p.jam_keluar);

        let duration = '-';
        if (p.jam_masuk && p.jam_keluar) {
          const diffMs = new Date(p.jam_keluar) - new Date(p.jam_masuk);
          if (diffMs > 0) {
            const hrs = Math.floor(diffMs / 3600000);
            const mins = Math.floor((diffMs % 3600000) / 60000);
            duration = hrs > 0 ? `${hrs}j ${mins}m` : `${mins}m`;
          }
        }

        return `
                  <tr>
                    <td style="word-break: break-word;">
                      <div style="display: flex; align-items: center; gap: 0.55rem; min-width: 180px;">
                        <img src="${p.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); flex-shrink: 0;">
                        <div style="min-width: 0;">
                          <strong style="font-size: 0.88rem; color: #0f172a; display: block; line-height: 1.25;">${Utils.escapeHtml(p.full_name)}</strong>
                          <small style="color: var(--text-muted); font-size: 0.78rem; display: block; margin-top: 0.1rem;">
                            <code style="font-weight: 800; color: var(--primary);">${Utils.escapeHtml(p.participant_code)}</code> (${p.level})
                          </small>
                        </div>
                      </div>
                    </td>
                    <td style="font-size: 0.85rem;">${Utils.escapeHtml(p.unit_name)}</td>
                    <td style="white-space: nowrap;">
                      ${masuk ? `
                        <strong style="font-size: 0.88rem; color: #166534;">🟢 ${masuk.time}</strong><br>
                        <small style="color: #64748b;">${masuk.date}</small>
                      ` : '<span style="color: #94a3b8; font-size: 0.8rem; font-style: italic;">Belum Masuk</span>'}
                    </td>
                    <td style="white-space: nowrap;">
                      ${keluar ? `
                        <strong style="font-size: 0.88rem; color: #991b1b;">🔴 ${keluar.time}</strong><br>
                        <small style="color: #64748b;">${keluar.date}</small>
                      ` : '<span class="badge badge-warning" style="font-size: 0.74rem; padding: 0.2rem 0.5rem; background: #d97706; color: #ffffff;">🟡 Sedang Ikut</span>'}
                    </td>
                    <td style="white-space: nowrap;">
                      <strong style="color: #0284c7; font-size: 0.85rem;">${duration}</strong>
                    </td>
                    <td style="white-space: nowrap;">
                      <span class="badge badge-success" style="font-size: 0.72rem; white-space: nowrap;"><i class="fa-solid fa-circle-check"></i> Terdaftar</span>
                    </td>
                  </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Render Mobile Card View with Jam Masuk & Jam Keluar
      const mobileCardsHtml = `
        <div class="presensi-mobile-log-cards">
          ${pairedLogs.map(p => {
        const formatTime = (ts) => {
          if (!ts) return null;
          const d = new Date(ts);
          return {
            time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
            date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
          };
        };

        const masuk = formatTime(p.jam_masuk);
        const keluar = formatTime(p.jam_keluar);

        let duration = '-';
        if (p.jam_masuk && p.jam_keluar) {
          const diffMs = new Date(p.jam_keluar) - new Date(p.jam_masuk);
          if (diffMs > 0) {
            const hrs = Math.floor(diffMs / 3600000);
            const mins = Math.floor((diffMs % 3600000) / 60000);
            duration = hrs > 0 ? `${hrs}j ${mins}m` : `${mins}m`;
          }
        }

        return `
              <div class="presensi-log-card">
                <div class="presensi-log-user">
                  <img src="${p.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="presensi-log-avatar">
                  <div style="flex: 1; min-width: 0;">
                    <strong style="font-size: 0.88rem; color: #0f172a; display: block; line-height: 1.25; word-break: break-word;">${Utils.escapeHtml(p.full_name)}</strong>
                    <div style="font-size: 0.76rem; color: #475569; margin-top: 0.15rem; word-break: break-word;">
                      <code style="font-weight: 800; color: var(--primary);">${Utils.escapeHtml(p.participant_code)}</code> | Unit: <strong>${Utils.escapeHtml(p.unit_name)}</strong>
                    </div>
                  </div>
                </div>

                <div class="presensi-log-times">
                  <div style="border-right: 1px solid #e2e8f0; padding-right: 0.35rem;">
                    <div style="font-size: 0.68rem; font-weight: 700; color: #166534; text-transform: uppercase;">🟢 Jam Masuk</div>
                    ${masuk ? `
                      <div style="font-size: 0.84rem; font-weight: 800; color: #166534;">${masuk.time}</div>
                      <div style="font-size: 0.68rem; color: #64748b;">${masuk.date}</div>
                    ` : '<div style="font-size: 0.74rem; color: #94a3b8; font-style: italic;">Belum</div>'}
                  </div>

                  <div style="padding-left: 0.25rem;">
                    <div style="font-size: 0.68rem; font-weight: 700; color: #991b1b; text-transform: uppercase;">🔴 Jam Keluar</div>
                    ${keluar ? `
                      <div style="font-size: 0.84rem; font-weight: 800; color: #991b1b;">${keluar.time}</div>
                      <div style="font-size: 0.68rem; color: #64748b;">${keluar.date}</div>
                    ` : '<div style="font-size: 0.74rem; color: #d97706; font-weight: 700;">🟡 Sedang Ikut</div>'}
                  </div>
                </div>

                ${p.jam_masuk && p.jam_keluar ? `
                  <div style="margin-top: 0.4rem; font-size: 0.72rem; color: #475569; text-align: right; font-weight: 600;">
                    ⏱️ Durasi: <strong style="color: #0284c7;">${duration}</strong>
                  </div>
                ` : ''}
              </div>
            `;
      }).join('')}
        </div>
      `;

      container.innerHTML = statsHtml + desktopTableHtml + mobileCardsHtml;
    } catch (err) {
      container.innerHTML = `<p style="color: red;">Error memuat presensi: ${err.message}</p>`;
    }
  },

  async loadPesertaMyAttendanceLog() {
    const container = document.getElementById('pesertaMyAttendanceLog');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
        <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.5rem; color: var(--primary);"></i>
        <p style="margin-top: 0.5rem; font-size: 0.85rem;">Memuat riwayat presensi masuk & keluar...</p>
      </div>
    `;

    try {
      const res = await API.getMyAttendance();
      const history = res.history || [];

      if (!history.length) {
        container.innerHTML = `
          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 1.5rem; text-align: center; margin-top: 1rem;">
            <i class="fa-solid fa-clipboard-question" style="font-size: 2rem; color: #94a3b8; margin-bottom: 0.5rem;"></i>
            <h4 style="font-size: 0.95rem; font-weight: 700; color: #475569; margin-bottom: 0.25rem;">Belum Ada Catatan Presensi</h4>
            <p style="font-size: 0.8rem; color: #64748b; margin: 0;">
              Riwayat jam masuk & jam keluar Anda akan otomatis tercatat di sini setelah Panitia melakukan scan QR Code ID Card Anda pada kegiatan Jumbara.
            </p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="margin-top: 1.25rem;">
          <h4 style="font-size: 0.92rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
            <i class="fa-solid fa-clock-rotate-left" style="color: #0284c7;"></i> Riwayat Jam Masuk & Jam Keluar Kegiatan:
          </h4>
          
          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            ${history.map(item => {
        const formatTime = (ts) => {
          if (!ts) return null;
          const d = new Date(ts);
          const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
          const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          return { time, date };
        };

        const masuk = formatTime(item.jam_masuk);
        const keluar = formatTime(item.jam_keluar);

        let durationStr = '-';
        if (item.jam_masuk && item.jam_keluar) {
          const diffMs = new Date(item.jam_keluar) - new Date(item.jam_masuk);
          if (diffMs > 0) {
            const hrs = Math.floor(diffMs / 3600000);
            const mins = Math.floor((diffMs % 3600000) / 60000);
            durationStr = hrs > 0 ? `${hrs} Jam ${mins} Mnt` : `${mins} Menit`;
          }
        }

        return `
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
                  <div style="font-weight: 800; font-size: 0.95rem; color: #0f172a; margin-bottom: 0.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                    <span>${Utils.escapeHtml(item.event_title)}</span>
                    ${item.jam_keluar ? `
                      <span class="badge badge-success" style="font-size: 0.72rem; padding: 0.2rem 0.55rem; background: #059669; color: #ffffff;">Selesai (Keluar)</span>
                    ` : (item.jam_masuk ? `
                      <span class="badge badge-warning" style="font-size: 0.72rem; padding: 0.2rem 0.55rem; background: #d97706; color: #ffffff;">🟢 Masuk (Aktif)</span>
                    ` : `
                      <span class="badge" style="font-size: 0.72rem; padding: 0.2rem 0.55rem; background: #94a3b8; color: #ffffff;">Belum Scan</span>
                    `)}
                  </div>
                  
                  <div style="font-size: 0.78rem; color: #64748b; margin-bottom: 0.75rem;">
                    <i class="fa-solid fa-location-dot" style="color: #ef4444;"></i> ${Utils.escapeHtml(item.event_location || 'Lokasi Kegiatan')}
                  </div>

                  <!-- Grid 2 Kolom: Jam Masuk vs Jam Keluar -->
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; background: #f8fafc; padding: 0.75rem; border-radius: 10px; border: 1px solid #f1f5f9;">
                    <!-- Jam Masuk -->
                    <div style="border-right: 1px solid #e2e8f0; padding-right: 0.5rem;">
                      <div style="font-size: 0.72rem; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.3rem;">
                        <i class="fa-solid fa-right-to-bracket"></i> Jam Masuk
                      </div>
                      ${masuk ? `
                        <div style="font-size: 0.95rem; font-weight: 800; color: #166534;">${masuk.time}</div>
                        <div style="font-size: 0.72rem; color: #64748b;">${masuk.date}</div>
                      ` : `
                        <div style="font-size: 0.8rem; color: #94a3b8; font-style: italic;">Belum Masuk</div>
                      `}
                    </div>

                    <!-- Jam Keluar -->
                    <div style="padding-left: 0.25rem;">
                      <div style="font-size: 0.72rem; font-weight: 700; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.3rem;">
                        <i class="fa-solid fa-right-from-bracket"></i> Jam Keluar
                      </div>
                      ${keluar ? `
                        <div style="font-size: 0.95rem; font-weight: 800; color: #991b1b;">${keluar.time}</div>
                        <div style="font-size: 0.72rem; color: #64748b;">${keluar.date}</div>
                      ` : `
                        <div style="font-size: 0.8rem; color: #d97706; font-weight: 600;">🟡 Sedang Ikut</div>
                      `}
                    </div>
                  </div>

                  ${item.jam_masuk && item.jam_keluar ? `
                    <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #475569; text-align: right; font-weight: 600;">
                      <i class="fa-solid fa-hourglass-half" style="color: #0284c7;"></i> Total Durasi: <strong style="color: #0f172a;">${durationStr}</strong>
                    </div>
                  ` : ''}
                </div>
              `;
      }).join('')}
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: red; font-size: 0.82rem;">Gagal memuat presensi: ${err.message}</p>`;
    }
  },

  async openEventParticipantsOverviewModal() {
    try {
      const events = await API.getEvents();
      if (!events || !events.length) {
        Utils.showToast('Belum ada agenda kegiatan terdaftar.', 'warning');
        return;
      }
      this.openRegisteredParticipantsModal(events[0].id);
    } catch (err) {
      Utils.showToast('Gagal memuat agenda kegiatan: ' + err.message, 'error');
    }
  },

  cachedUnitBreakdownData: [],

  async openUnitBreakdownModal() {
    const titleEl = document.getElementById('unitBreakdownModalTitle');
    const contentEl = document.getElementById('unitBreakdownContent');

    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-school-flag"></i> Memuat Rekapitulasi Peserta per Unit...';
    if (contentEl) contentEl.innerHTML = '<p style="text-align: center; padding: 2rem 0; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Mengambil rekapitulasi data unit & kontingen...</p>';

    this.openModal('unitBreakdownModal');

    try {
      const unitsRes = await API.getUnits();
      const units = Array.isArray(unitsRes) ? unitsRes : (unitsRes.units || []);

      const partRes = await API.getParticipants({ limit: 1000 });
      const participants = Array.isArray(partRes) ? partRes : (partRes.data || []);

      const unitMap = {};
      units.forEach(u => {
        unitMap[u.id] = {
          id: u.id,
          name: u.name,
          pic_name: u.pic_name,
          phone: u.phone,
          mula: 0,
          madya: 0,
          wira: 0,
          total: 0,
          verified: 0,
          participants: []
        };
      });

      participants.forEach(p => {
        const uid = p.unit_id;
        if (!unitMap[uid]) {
          unitMap[uid] = {
            id: uid || 0,
            name: p.unit_name || 'Tanpa Unit',
            pic_name: '-',
            phone: '-',
            mula: 0,
            madya: 0,
            wira: 0,
            total: 0,
            verified: 0,
            participants: []
          };
        }
        unitMap[uid].total++;
        unitMap[uid].participants.push(p);

        const lvl = (p.level || '').toLowerCase();
        if (lvl === 'mula') unitMap[uid].mula++;
        else if (lvl === 'madya') unitMap[uid].madya++;
        else if (lvl === 'wira') unitMap[uid].wira++;

        if (p.status === 'verified_kabupaten' || p.status === 'verified_unit') {
          unitMap[uid].verified++;
        }
      });

      this.cachedUnitBreakdownData = Object.values(unitMap);
      if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-school-flag"></i> Rekap Pendaftaran Peserta per Unit PMR (${this.cachedUnitBreakdownData.length} Unit)`;
      }

      this.filterUnitBreakdownList();
    } catch (err) {
      if (contentEl) {
        contentEl.innerHTML = `<p style="color: red; text-align: center; padding: 1.5rem;">Gagal memuat rekap unit: ${Utils.escapeHtml(err.message)}</p>`;
      }
    }
  },

  filterUnitBreakdownList() {
    const contentEl = document.getElementById('unitBreakdownContent');
    if (!contentEl) return;

    const query = document.getElementById('unitBreakdownSearchInput')?.value?.toLowerCase()?.trim() || '';
    const filtered = (this.cachedUnitBreakdownData || []).filter(u => {
      return !query || (u.name && u.name.toLowerCase().includes(query)) || (u.pic_name && u.pic_name.toLowerCase().includes(query));
    });

    if (!filtered.length) {
      contentEl.innerHTML = `
        <div style="text-align: center; padding: 2rem 0; color: var(--text-muted);">
          <i class="fa-solid fa-school-circle-xmark" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 0.5rem;"></i>
          <p style="margin: 0; font-weight: 600;">Tidak ada unit sekolah yang sesuai pencarian.</p>
        </div>
      `;
      return;
    }

    const html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 1rem;">
        ${filtered.map(u => `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem;">
              <h4 style="font-size: 0.98rem; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 0.4rem;">
                <i class="fa-solid fa-school" style="color: #0284c7;"></i> ${Utils.escapeHtml(u.name)}
              </h4>
              <span class="badge badge-primary" style="font-size: 0.78rem; font-weight: 800; padding: 0.25rem 0.6rem;">${u.total} Peserta</span>
            </div>
            
            <div style="font-size: 0.78rem; color: #64748b; margin-bottom: 0.75rem;">
              <i class="fa-solid fa-user-tie"></i> Pembina: <strong>${Utils.escapeHtml(u.pic_name || '-')}</strong> (${u.phone || '-'})
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.35rem; background: #f8fafc; padding: 0.5rem; border-radius: 8px; text-align: center; margin-bottom: 0.75rem;">
              <div>
                <div style="font-size: 0.68rem; font-weight: 700; color: #16a34a;">MULA</div>
                <strong style="font-size: 0.9rem; color: #15803d;">${u.mula}</strong>
              </div>
              <div>
                <div style="font-size: 0.68rem; font-weight: 700; color: #0284c7;">MADYA</div>
                <strong style="font-size: 0.9rem; color: #0369a1;">${u.madya}</strong>
              </div>
              <div>
                <div style="font-size: 0.68rem; font-weight: 700; color: #9333ea;">WIRA</div>
                <strong style="font-size: 0.9rem; color: #7e22ce;">${u.wira}</strong>
              </div>
            </div>

            <div style="display: flex; gap: 0.4rem;">
              <button type="button" class="btn btn-outline btn-sm" style="flex: 1; font-size: 0.78rem; font-weight: 700;" onclick="App.filterPesertaByUnit('${u.id}')">
                <i class="fa-solid fa-filter"></i> Lihat Peserta Unit
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    contentEl.innerHTML = html;
  },

  filterPesertaByUnit(unitId) {
    this.closeModal('unitBreakdownModal');
    if (this.currentUser && this.currentUser.role === 'kabupaten') {
      this.switchAdminCategory('peserta');
      this.switchAdminTab('verifikasi');
      setTimeout(() => {
        const select = document.getElementById('filterKabUnit');
        if (select) {
          select.value = unitId;
          this.loadKabupatenParticipants(1);
        }
      }, 200);
    } else {
      Utils.showToast('Menampilkan peserta unit...', 'info');
    }
  },

  cachedRegisteredParticipants: [],
  cachedRegisteredEventTitle: '',

  async openRegisteredParticipantsModal(eventId) {
    if (!eventId || eventId === 0 || eventId === '0' || eventId === 'undefined') {
      eventId = document.getElementById('presensiEventId')?.value;
    }
    if (!eventId || eventId === 0 || eventId === '0' || eventId === 'undefined') {
      Utils.showToast('Silakan pilih agenda kegiatan terlebih dahulu.', 'warning');
      return;
    }

    const titleEl = document.getElementById('registeredModalTitle');
    const contentEl = document.getElementById('registeredParticipantsListContent');

    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-users"></i> Memuat Data Peserta Terdaftar...';
    if (contentEl) contentEl.innerHTML = '<p style="text-align: center; padding: 2rem 0; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Mengambil daftar peserta terdaftar...</p>';

    this.openModal('registeredParticipantsModal');

    try {
      const res = await API.getEventRegisteredParticipants(eventId);
      this.cachedRegisteredParticipants = res.participants || [];
      this.cachedRegisteredEventTitle = res.event ? res.event.title : 'Kegiatan';

      if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-users"></i> Peserta Terdaftar: <strong>${Utils.escapeHtml(this.cachedRegisteredEventTitle)}</strong> (${res.total} Peserta)`;
      }

      this.filterRegisteredParticipantsList();
    } catch (err) {
      if (contentEl) {
        contentEl.innerHTML = `<p style="color: #dc2626; text-align: center; padding: 1rem 0;">Gagal memuat daftar peserta: ${Utils.escapeHtml(err.message)}</p>`;
      }
    }
  },

  filterRegisteredParticipantsList() {
    const contentEl = document.getElementById('registeredParticipantsListContent');
    if (!contentEl) return;

    const query = document.getElementById('registeredSearchInput')?.value?.toLowerCase()?.trim() || '';
    const statusFilter = document.getElementById('registeredStatusFilter')?.value || 'all';

    let filtered = (this.cachedRegisteredParticipants || []).filter(p => {
      const matchesQuery = !query ||
        (p.full_name && p.full_name.toLowerCase().includes(query)) ||
        (p.code && p.code.toLowerCase().includes(query)) ||
        (p.unit_name && p.unit_name.toLowerCase().includes(query));

      let matchesStatus = true;
      if (statusFilter === 'masuk') {
        matchesStatus = (p.has_masuk === true || p.attendance_status === 'masuk' || p.attendance_status === 'hadir');
      } else if (statusFilter === 'keluar') {
        matchesStatus = (p.has_keluar === true || p.attendance_status === 'keluar');
      } else if (statusFilter === 'belum') {
        matchesStatus = (!p.has_masuk && !p.has_keluar && (!p.attendance_status || p.attendance_status === 'belum'));
      }

      return matchesQuery && matchesStatus;
    });

    if (!filtered.length) {
      contentEl.innerHTML = `
        <div style="text-align: center; padding: 2rem 0; color: var(--text-muted);">
          <i class="fa-solid fa-user-slash" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 0.5rem;"></i>
          <p style="margin: 0; font-weight: 600;">Tidak ada peserta terdaftar yang sesuai dengan pencarian/filter.</p>
        </div>
      `;
      return;
    }

    // Render Desktop Table View
    const desktopTableHtml = `
        <div class="registered-desktop-table table-responsive" style="max-height: 480px; overflow-y: auto; overflow-x: auto; width: 100%; border-radius: 8px; border: 1px solid var(--border-color);">
          <table class="data-table" style="width: 100%; min-width: 600px; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="min-width: 40px; white-space: nowrap;">No</th>
                <th style="min-width: 130px; white-space: nowrap;">Kode & Pas Foto</th>
                <th style="min-width: 170px;">Nama Lengkap Peserta</th>
                <th style="min-width: 140px;">Unit Kontingen PMR</th>
                <th style="min-width: 90px; white-space: nowrap;">Tingkat</th>
                <th style="min-width: 140px; white-space: nowrap;">Status Presensi</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((p, idx) => {
      let statusBadges = [];
      if (p.has_masuk || p.attendance_status === 'masuk' || p.attendance_status === 'hadir') {
        statusBadges.push('<span class="badge badge-success" style="font-weight: 700; padding: 0.3rem 0.55rem; font-size: 0.76rem; white-space: nowrap;">🟢 Masuk (Check-In)</span>');
      }
      if (p.has_keluar || p.attendance_status === 'keluar') {
        statusBadges.push('<span class="badge badge-warning" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-weight: 700; padding: 0.3rem 0.55rem; font-size: 0.76rem; white-space: nowrap;">🔴 Keluar (Check-Out)</span>');
      }
      if (!statusBadges.length) {
        statusBadges.push('<span class="badge badge-secondary" style="background: #f1f5f9; color: #475569; font-weight: 700; font-size: 0.76rem; white-space: nowrap;">⚪ Belum Presensi</span>');
      }

      return `
                  <tr>
                    <td style="font-weight: 700; color: var(--text-muted); white-space: nowrap;">${idx + 1}</td>
                    <td style="white-space: nowrap;">
                      <div style="display: flex; align-items: center; gap: 0.5rem; min-width: 120px;">
                        <img src="${p.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); flex-shrink: 0;">
                        <code style="font-weight: 800; color: var(--primary);">${Utils.escapeHtml(p.code)}</code>
                      </div>
                    </td>
                    <td style="word-break: break-word; overflow-wrap: break-word;"><strong>${Utils.escapeHtml(p.full_name)}</strong></td>
                    <td style="font-size: 0.85rem; word-break: break-word; overflow-wrap: break-word;">${Utils.escapeHtml(p.unit_name || '-')}</td>
                    <td style="white-space: nowrap;">${Utils.getLevelBadgeHtml(p.level)}</td>
                    <td style="white-space: nowrap;"><div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">${statusBadges.join(' ')}</div></td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </div>
      `;

    // Render Mobile Cards View
    const mobileCardsHtml = `
        <div class="registered-mobile-cards" style="max-height: 480px; overflow-y: auto;">
          ${filtered.map((p, idx) => {
      let statusBadges = [];
      if (p.has_masuk || p.attendance_status === 'masuk' || p.attendance_status === 'hadir') {
        statusBadges.push('<span class="badge badge-success" style="font-weight: 700; padding: 0.25rem 0.5rem; font-size: 0.74rem; white-space: nowrap;">🟢 Masuk</span>');
      }
      if (p.has_keluar || p.attendance_status === 'keluar') {
        statusBadges.push('<span class="badge badge-warning" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-weight: 700; padding: 0.25rem 0.5rem; font-size: 0.74rem; white-space: nowrap;">🔴 Keluar</span>');
      }
      if (!statusBadges.length) {
        statusBadges.push('<span class="badge badge-secondary" style="background: #f1f5f9; color: #475569; font-weight: 700; font-size: 0.74rem; white-space: nowrap;">⚪ Belum Presensi</span>');
      }

      return `
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); width: 100%; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
                  <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <span style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted);">#${idx + 1}</span>
                    <code style="font-weight: 800; color: var(--primary); font-size: 0.82rem;">${Utils.escapeHtml(p.code)}</code>
                  </div>
                  <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">${statusBadges.join(' ')}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                  <img src="${p.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); flex-shrink: 0;">
                  <div style="flex: 1; min-width: 0; word-break: break-word;">
                    <strong style="font-size: 0.9rem; color: #0f172a; display: block; line-height: 1.25;">${Utils.escapeHtml(p.full_name)}</strong>
                    <div style="font-size: 0.78rem; color: #475569; margin-top: 0.15rem; word-break: break-word;">
                      Unit: <strong>${Utils.escapeHtml(p.unit_name || '-')}</strong> (${p.level})
                    </div>
                  </div>
                </div>
              </div>
            `;
    }).join('')}
        </div>
      `;

    contentEl.innerHTML = desktopTableHtml + mobileCardsHtml;
  },

  // --- TAB 4: PENILAIAN LOMBA & KLASEMEN ---
  async renderTabPenilaian(container, activeSubTab = 'aspek') {
    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header" style="flex-wrap: wrap; gap: 0.75rem; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.85rem; margin-bottom: 1rem;">
          <div>
            <h3 class="panel-title" style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
              ${Icons.trophy(22, 'var(--primary)')} Modul Penilaian & Rekap Medali Jumbara
            </h3>
            <small style="color: #64748b;">Pengaturan aspek kegiatan, rekap nilai per kegiatan, perolehan medali kontingen, dan entry nilai juri</small>
          </div>
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            <button class="btn btn-outline btn-sm" style="font-weight: 700; color: #0284c7; border-color: #bae6fd; background: #f0f9ff;" onclick="App.openManageAspectsModal()">
              <i class="fa-solid fa-sliders"></i> Pengaturan Aspek
            </button>
            <button class="btn btn-primary btn-sm" style="background: #16a34a; border-color: #16a34a; font-weight: 700;" onclick="App.openEventScoringModal()">
              <i class="fa-solid fa-clipboard-check"></i> Input Nilai Juri & Scan QR
            </button>
          </div>
        </div>

        <!-- NAVIGASI SUB-TAB NAV PILLS -->
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.6rem; flex-wrap: wrap;">
          <button type="button" id="btnSubTabAspek" class="btn ${activeSubTab === 'aspek' ? 'btn-primary' : 'btn-outline'} btn-sm" style="border-radius: 20px; font-weight: 700;" onclick="App.switchPenilaianSubTab('aspek')">
            <i class="fa-solid fa-list-check"></i> Daftar Aspek Penilaian Kegiatan
          </button>
          <button type="button" id="btnSubTabRekap" class="btn ${activeSubTab === 'rekap' ? 'btn-primary' : 'btn-outline'} btn-sm" style="border-radius: 20px; font-weight: 700;" onclick="App.switchPenilaianSubTab('rekap')">
            <i class="fa-solid fa-chart-simple"></i> Rekap Nilai per Kegiatan & Peserta
          </button>
          <button type="button" id="btnSubTabRekapUnit" class="btn ${activeSubTab === 'rekap_unit' ? 'btn-primary' : 'btn-outline'} btn-sm" style="border-radius: 20px; font-weight: 700;" onclick="App.switchPenilaianSubTab('rekap_unit')">
            <i class="fa-solid fa-school-flag"></i> Rekap Total Nilai & Rangking Unit
          </button>
          <button type="button" id="btnSubTabKlasemen" class="btn ${activeSubTab === 'klasemen' ? 'btn-primary' : 'btn-outline'} btn-sm" style="border-radius: 20px; font-weight: 700;" onclick="App.switchPenilaianSubTab('klasemen')">
            <i class="fa-solid fa-trophy"></i> Papan Medali Kontingen
          </button>
          <button type="button" id="btnSubTabRiwayat" class="btn ${activeSubTab === 'riwayat' ? 'btn-primary' : 'btn-outline'} btn-sm" style="border-radius: 20px; font-weight: 700;" onclick="App.switchPenilaianSubTab('riwayat')">
            <i class="fa-solid fa-history"></i> Riwayat Entry Nilai Juri
          </button>
        </div>

        <!-- SUB-TAB 1: DAFTAR ASPEK PENILAIAN PER KEGIATAN -->
        <div id="penilaianSubTabAspek" style="display: ${activeSubTab === 'aspek' ? 'block' : 'none'};">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h4 style="margin: 0; color: var(--secondary); font-size: 1.05rem; font-weight: 700;">
                  <i class="fa-solid fa-list-check" style="color: #0284c7;"></i> Daftar Aspek Penilaian per Kegiatan
                </h4>
                <small style="color: #64748b;">Rincian nama aspek dan bobot poin maksimal untuk setiap cabang kegiatan Jumbara</small>
              </div>
              <button class="btn btn-primary btn-sm" onclick="App.openManageAspectsModal()"><i class="fa-solid fa-plus"></i> Atur Aspek Kegiatan</button>
            </div>
            <div id="eventAspectsOverviewTableContainer">
              <p style="color: var(--text-muted); font-size: 0.85rem;">Memuat daftar aspek per kegiatan...</p>
            </div>
          </div>
        </div>

        <!-- SUB-TAB 2: REKAP NILAI PER KEGIATAN & PESERTA / KONTINGEN -->
        <div id="penilaianSubTabRekap" style="display: ${activeSubTab === 'rekap' ? 'block' : 'none'};">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.85rem;">
              <div>
                <h4 style="margin: 0; color: var(--secondary); font-size: 1.05rem; font-weight: 700;">
                  <i class="fa-solid fa-chart-simple" style="color: #0284c7;"></i> Rekap Hasil Nilai per Kegiatan & Sasaran
                </h4>
                <small style="color: #64748b;">Leaderboard nilai per cabang kegiatan dan filter sasaran (Perorangan Peserta / Kontingen Unit)</small>
              </div>
            </div>

            <!-- TOOLBAR FILTER -->
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.2rem; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.85rem;">
              <div style="flex: 1; min-width: 220px;">
                <label class="form-label" style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.25rem;">Filter Kegiatan / Cabang Lomba:</label>
                <select id="rekapFilterEventSelect" class="form-control" style="font-size: 0.85rem;" onchange="App.filterRekapScores()">
                  <option value="">-- Semua Kegiatan / Cabang --</option>
                </select>
              </div>
              <div style="min-width: 200px;">
                <label class="form-label" style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.25rem;">Filter Tipe Sasaran:</label>
                <select id="rekapFilterTargetTypeSelect" class="form-control" style="font-size: 0.85rem;" onchange="App.filterRekapScores()">
                  <option value="">-- Semua Sasaran --</option>
                  <option value="peserta">👤 Perorangan / Peserta</option>
                  <option value="kontingen">🏫 Kontingen / Unit Sekolah</option>
                </select>
              </div>
            </div>

            <div id="rekapEventScoresTableContainer">
              <p style="color: var(--text-muted); font-size: 0.85rem;">Memuat rekap nilai per kegiatan...</p>
            </div>
          </div>
        </div>

        <!-- SUB-TAB 3: REKAP TOTAL NILAI & RANGKING PER UNIT -->
        <div id="penilaianSubTabRekapUnit" style="display: ${activeSubTab === 'rekap_unit' ? 'block' : 'none'};">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.85rem;">
              <div>
                <h4 style="margin: 0; color: var(--secondary); font-size: 1.05rem; font-weight: 700;">
                  <i class="fa-solid fa-school-flag" style="color: #ea580c;"></i> Rekap Matriks Nilai & Rangking Unit Kontingen
                </h4>
                <small style="color: #64748b;">Matriks total perolehan nilai kegiatan, rata-rata poin, dan rangking unit PMR</small>
              </div>
              <button class="btn btn-outline btn-sm" onclick="window.print()"><i class="fa-solid fa-print"></i> Cetak / Export Rekap</button>
            </div>

            <div id="rekapUnitTableContainer">
              <p style="color: var(--text-muted); font-size: 0.85rem;">Memuat rekap nilai per unit...</p>
            </div>
          </div>
        </div>

        <!-- SUB-TAB 4: PAPAN PEROLEHAN MEDALI KONTINGEN -->
        <div id="penilaianSubTabKlasemen" style="display: ${activeSubTab === 'klasemen' ? 'block' : 'none'};">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <div style="margin-bottom: 1rem;">
              <h4 style="margin: 0 0 0.25rem 0; color: var(--secondary); font-size: 1.05rem; font-weight: 700;">
                <i class="fa-solid fa-trophy" style="color: #d97706;"></i> Papan Perolehan Medali Kontingen Unit PMR
              </h4>
              <small style="color: #64748b;">Klasemen perolehan medali Emas, Perak, Perunggu, dan Rata-rata Skor per Unit</small>
            </div>
            <div id="standingsTableContainer">
              <p style="color: var(--text-muted);">Memuat klasemen medali...</p>
            </div>
          </div>
        </div>

        <!-- SUB-TAB 4: RIWAYAT ENTRY NILAI JURI -->
        <div id="penilaianSubTabRiwayat" style="display: ${activeSubTab === 'riwayat' ? 'block' : 'none'};">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h4 style="margin: 0 0 0.25rem 0; color: var(--secondary); font-size: 1.05rem; font-weight: 700;">
                  <i class="fa-solid fa-clock-rotate-left" style="color: #059669;"></i> Transkrip & Riwayat Entry Nilai Juri
                </h4>
                <small style="color: #64748b;">Daftar penilaian yang telah dimasukkan oleh juri beserta rincian nilai per aspek</small>
              </div>
              <button class="btn btn-primary btn-sm" style="background: #16a34a; border-color: #16a34a;" onclick="App.openEventScoringModal()">
                <i class="fa-solid fa-clipboard-check"></i> Input Nilai Baru
              </button>
            </div>
            <div id="scoresLogTableContainer">
              <p style="color: var(--text-muted);">Memuat data nilai...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.loadEventAspectsOverviewTable();
    this.loadStandingsAndScores();
  },

  switchPenilaianSubTab(subTab) {
    this.currentPenilaianSubTab = subTab;
    const tabAspek = document.getElementById('penilaianSubTabAspek');
    const tabRekap = document.getElementById('penilaianSubTabRekap');
    const tabRekapUnit = document.getElementById('penilaianSubTabRekapUnit');
    const tabKlasemen = document.getElementById('penilaianSubTabKlasemen');
    const tabRiwayat = document.getElementById('penilaianSubTabRiwayat');

    const btnAspek = document.getElementById('btnSubTabAspek');
    const btnRekap = document.getElementById('btnSubTabRekap');
    const btnRekapUnit = document.getElementById('btnSubTabRekapUnit');
    const btnKlasemen = document.getElementById('btnSubTabKlasemen');
    const btnRiwayat = document.getElementById('btnSubTabRiwayat');

    if (tabAspek) tabAspek.style.display = subTab === 'aspek' ? 'block' : 'none';
    if (tabRekap) tabRekap.style.display = subTab === 'rekap' ? 'block' : 'none';
    if (tabRekapUnit) tabRekapUnit.style.display = subTab === 'rekap_unit' ? 'block' : 'none';
    if (tabKlasemen) tabKlasemen.style.display = subTab === 'klasemen' ? 'block' : 'none';
    if (tabRiwayat) tabRiwayat.style.display = subTab === 'riwayat' ? 'block' : 'none';

    if (btnAspek) btnAspek.className = `btn ${subTab === 'aspek' ? 'btn-primary' : 'btn-outline'} btn-sm`;
    if (btnRekap) btnRekap.className = `btn ${subTab === 'rekap' ? 'btn-primary' : 'btn-outline'} btn-sm`;
    if (btnRekapUnit) btnRekapUnit.className = `btn ${subTab === 'rekap_unit' ? 'btn-primary' : 'btn-outline'} btn-sm`;
    if (btnKlasemen) btnKlasemen.className = `btn ${subTab === 'klasemen' ? 'btn-primary' : 'btn-outline'} btn-sm`;
    if (btnRiwayat) btnRiwayat.className = `btn ${subTab === 'riwayat' ? 'btn-primary' : 'btn-outline'} btn-sm`;
  },

  async loadStandingsAndScores() {
    const standingsContainer = document.getElementById('standingsTableContainer');
    const scoresContainer = document.getElementById('scoresLogTableContainer');

    try {
      const standings = await API.getStandings();
      const scores = await API.getScores();
      this.cachedScores = scores || [];

      this.loadRekapScoresFilterOptions();
      this.filterRekapScores();
      this.loadRekapUnitTable();

      if (standingsContainer) {
        const desktopStandings = `
          <div class="standings-desktop-table table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Unit PMR</th>
                  <th>Emas</th>
                  <th>Perak</th>
                  <th>Perunggu</th>
                  <th>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                ${standings.map((s, idx) => `
                  <tr>
                    <td><strong>#${idx + 1}</strong></td>
                    <td><strong>${Utils.escapeHtml(s.unit_name)}</strong></td>
                    <td><strong style="color: #d97706;">${s.emas || 0}</strong></td>
                    <td><strong style="color: #64748b;">${s.perak || 0}</strong></td>
                    <td><strong style="color: #b45309;">${s.perunggu || 0}</strong></td>
                    <td>${s.avg_score ? parseFloat(s.avg_score).toFixed(1) : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;

        const mobileStandings = `
          <div class="standings-mobile-cards">
            ${standings.map((s, idx) => `
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); width: 100%; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                  <strong style="font-size: 0.95rem; color: var(--secondary);">#${idx + 1} ${Utils.escapeHtml(s.unit_name)}</strong>
                  <span style="font-size: 0.78rem; color: #475569;">Avg: <strong>${s.avg_score ? parseFloat(s.avg_score).toFixed(1) : '-'}</strong></span>
                </div>
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                  <span class="medal-badge medal-emas">🥇 ${s.emas || 0} Emas</span>
                  <span class="medal-badge medal-perak">🥈 ${s.perak || 0} Perak</span>
                  <span class="medal-badge medal-perunggu">🥉 ${s.perunggu || 0} Perunggu</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;

        standingsContainer.innerHTML = desktopStandings + mobileStandings;
      }

      if (scoresContainer) {
        const isKab = this.currentUser && this.currentUser.role === 'kabupaten';

        const desktopScores = `
          <div class="scores-desktop-table table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Kegiatan / Cabang</th>
                  <th>Sasaran (Peserta / Unit)</th>
                  <th>Tingkat</th>
                  <th>Score Perolehan per Aspek</th>
                  <th style="text-align: center;">Skor Total</th>
                  <th style="text-align: center;">Medali</th>
                  <th style="text-align: center;">Status Validasi</th>
                  <th style="text-align: center; min-width: 200px; white-space: nowrap;">AKSI</th>
                </tr>
              </thead>
              <tbody>
                ${scores.map(sc => {
                  const targetLabel = sc.participant_name ? `${Utils.escapeHtml(sc.participant_name)} (${Utils.escapeHtml(sc.unit_name)})` : Utils.escapeHtml(sc.unit_name);
                  const isValidated = sc.status === 'validated' || sc.status === 'final';

                  const hasAspects = sc.aspect_details && sc.aspect_details.length > 0;
                  const scoreValuesHtml = hasAspects
                    ? sc.aspect_details.map(a => `<span style="font-size: 0.75rem; background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; padding: 2px 6px; border-radius: 4px; display: inline-block; margin: 1px; font-weight: 700;">${Utils.escapeHtml(a.aspect_name)}: ${a.score_val} Poin</span>`).join(' ')
                    : `<span style="font-size: 0.75rem; color: #475569;">${sc.score_val} Poin</span>`;

                  const statusBadge = isValidated
                    ? '<span class="badge" style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; font-size: 0.72rem; padding: 3px 8px; font-weight: 700; white-space: nowrap;"><i class="fa-solid fa-lock"></i> TERKUNCI (Admin Kab)</span>'
                    : '<span class="badge" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-size: 0.72rem; padding: 3px 8px; font-weight: 700; white-space: nowrap;"><i class="fa-solid fa-clock"></i> Draft (Penilai)</span>';

                  const actionButtons = isKab ? (
                    isValidated
                      ? `<div style="display: flex; gap: 0.35rem; justify-content: center; align-items: center; white-space: nowrap; flex-wrap: nowrap;">
                           <button type="button" class="btn btn-outline btn-xs" style="white-space: nowrap !important; padding: 4px 8px; font-weight: 700; font-size: 0.75rem; border-radius: 6px; color: #dc2626; border-color: #fca5a5; background: #fff5f5;" onclick="App.handleUnlockScore(${sc.id})" title="Buka Kunci Nilai"><i class="fa-solid fa-lock-open"></i> Buka Kunci</button>
                           <button type="button" class="btn btn-warning btn-xs" style="white-space: nowrap !important; padding: 4px 8px; font-weight: 700; font-size: 0.75rem; border-radius: 6px; color: #78350f; background: #fef3c7; border: 1px solid #fde68a;" onclick="App.openEditScoreModal(${sc.id})" title="Edit Nilai"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                           <button type="button" class="btn btn-danger btn-xs" style="white-space: nowrap !important; padding: 4px 8px; font-weight: 700; font-size: 0.75rem; border-radius: 6px; background: #dc2626; border-color: #dc2626; color: white;" onclick="App.handleDeleteScore(${sc.id})" title="Hapus Nilai"><i class="fa-solid fa-trash"></i></button>
                         </div>`
                      : `<div style="display: flex; gap: 0.35rem; justify-content: center; align-items: center; white-space: nowrap; flex-wrap: nowrap;">
                           <button type="button" class="btn btn-success btn-xs" style="white-space: nowrap !important; padding: 4px 10px; font-weight: 800; font-size: 0.75rem; border-radius: 6px; background: #16a34a; border-color: #16a34a; color: #ffffff; box-shadow: 0 2px 6px rgba(22,163,74,0.25);" onclick="App.handleValidateScore(${sc.id})" title="Validasi & Kunci Nilai"><i class="fa-solid fa-circle-check"></i> Validasi Nilai</button>
                           <button type="button" class="btn btn-warning btn-xs" style="white-space: nowrap !important; padding: 4px 8px; font-weight: 700; font-size: 0.75rem; border-radius: 6px; color: #78350f; background: #fef3c7; border: 1px solid #fde68a;" onclick="App.openEditScoreModal(${sc.id})" title="Edit Nilai"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                           <button type="button" class="btn btn-danger btn-xs" style="white-space: nowrap !important; padding: 4px 8px; font-weight: 700; font-size: 0.75rem; border-radius: 6px; background: #dc2626; border-color: #dc2626; color: white;" onclick="App.handleDeleteScore(${sc.id})" title="Hapus Nilai"><i class="fa-solid fa-trash"></i></button>
                         </div>`
                  ) : (
                    isValidated
                      ? `<span style="font-size: 0.72rem; color: #15803d; font-weight: 700; background: #dcfce7; padding: 3px 8px; border-radius: 12px; border: 1px solid #86efac; white-space: nowrap;" title="Nilai ini divalidasi oleh Admin Kab dan terkunci"><i class="fa-solid fa-lock"></i> Terkunci</span>`
                      : `<div style="display: flex; gap: 0.35rem; justify-content: center; white-space: nowrap; flex-wrap: nowrap;">
                           <button type="button" class="btn btn-warning btn-xs" style="white-space: nowrap !important; padding: 4px 8px; font-weight: 700; font-size: 0.75rem; border-radius: 6px; color: #78350f; background: #fef3c7; border: 1px solid #fde68a;" onclick="App.openEditScoreModal(${sc.id})" title="Edit Draft Nilai"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                           <button type="button" class="btn btn-danger btn-xs" style="white-space: nowrap !important; padding: 4px 8px; font-weight: 700; font-size: 0.75rem; border-radius: 6px; background: #dc2626; border-color: #dc2626; color: white;" onclick="App.handleDeleteScore(${sc.id})" title="Hapus Nilai Draft"><i class="fa-solid fa-trash"></i></button>
                         </div>`
                  );

                  return `
                    <tr>
                      <td><strong>${Utils.escapeHtml(sc.branch_name)}</strong> ${sc.judge_name ? `<br><small style="color: #64748b;">Penilai: ${Utils.escapeHtml(sc.judge_name)}</small>` : ''}</td>
                      <td>${targetLabel}</td>
                      <td>${Utils.getLevelBadgeHtml(sc.pmr_level)}</td>
                      <td style="max-width: 240px;">${scoreValuesHtml}</td>
                      <td style="text-align: center;"><strong style="font-size: 1rem; color: var(--primary);">${sc.score_val}</strong></td>
                      <td style="text-align: center;"><span class="status-badge ${sc.grade === 'Emas' ? 'badge-pending' : 'badge-unit'}">${sc.grade}</span></td>
                      <td style="text-align: center; white-space: nowrap;">${statusBadge}</td>
                      <td style="text-align: center; white-space: nowrap; min-width: 200px;">${actionButtons}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;

        const mobileScores = `
          <div class="scores-mobile-cards">
            ${scores.map(sc => {
              const targetLabel = sc.participant_name ? `${Utils.escapeHtml(sc.participant_name)} (${Utils.escapeHtml(sc.unit_name)})` : Utils.escapeHtml(sc.unit_name);
              const isValidated = sc.status === 'validated' || sc.status === 'final';
              const hasAspects = sc.aspect_details && sc.aspect_details.length > 0;
              const scoreValuesHtml = hasAspects
                ? sc.aspect_details.map(a => `<span style="font-size: 0.72rem; background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; padding: 2px 5px; border-radius: 4px; display: inline-block; margin-top: 2px; font-weight: 700;">${Utils.escapeHtml(a.aspect_name)}: ${a.score_val}P</span>`).join(' ')
                : '';

              const statusBadge = isValidated
                ? '<span class="badge" style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; font-size: 0.7rem; padding: 2px 6px; font-weight: 700;"><i class="fa-solid fa-lock"></i> Terkunci</span>'
                : '<span class="badge" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-size: 0.7rem; padding: 2px 6px; font-weight: 700;"><i class="fa-solid fa-clock"></i> Draft</span>';

              const actionButtons = isKab ? (
                isValidated
                  ? `<div style="display: flex; gap: 0.35rem; align-items: center; margin-top: 0.35rem;">
                       <button class="btn btn-outline btn-xs" style="padding: 4px 8px; font-size: 0.75rem; font-weight: 700; color: #dc2626; border-color: #fca5a5; background: #fff5f5; border-radius: 6px;" onclick="App.handleUnlockScore(${sc.id})"><i class="fa-solid fa-lock-open"></i> Buka Kunci</button>
                       <button class="btn btn-warning btn-xs" style="padding: 4px 8px; font-size: 0.75rem; font-weight: 700; color: #78350f; background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px;" onclick="App.openEditScoreModal(${sc.id})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                     </div>`
                  : `<div style="display: flex; gap: 0.35rem; align-items: center; margin-top: 0.35rem;">
                       <button class="btn btn-success btn-xs" style="padding: 4px 10px; font-size: 0.75rem; font-weight: 800; background: #16a34a; border-color: #16a34a; color: white; border-radius: 6px; box-shadow: 0 2px 6px rgba(22,163,74,0.25);" onclick="App.handleValidateScore(${sc.id})"><i class="fa-solid fa-circle-check"></i> Validasi Nilai</button>
                       <button class="btn btn-warning btn-xs" style="padding: 4px 8px; font-size: 0.75rem; font-weight: 700; color: #78350f; background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px;" onclick="App.openEditScoreModal(${sc.id})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                       <button class="btn btn-danger btn-xs" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 6px;" onclick="App.handleDeleteScore(${sc.id})"><i class="fa-solid fa-trash"></i></button>
                     </div>`
              ) : (
                isValidated ? '<span style="font-size: 0.72rem; color: #15803d; font-weight: 700; background: #dcfce7; padding: 2px 6px; border-radius: 10px;"><i class="fa-solid fa-lock"></i> Terkunci</span>' : `
                  <div style="display: flex; gap: 0.35rem; align-items: center; margin-top: 0.35rem;">
                    <button class="btn btn-warning btn-xs" style="padding: 4px 8px; font-size: 0.75rem; font-weight: 700; color: #78350f; background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px;" onclick="App.openEditScoreModal(${sc.id})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                    <button class="btn btn-danger btn-xs" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 6px;" onclick="App.handleDeleteScore(${sc.id})"><i class="fa-solid fa-trash"></i></button>
                  </div>
                `
              );

              return `
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); width: 100%; box-sizing: border-box;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.3rem;">
                    <div>
                      <strong style="font-size: 0.92rem; color: #0f172a;">${Utils.escapeHtml(sc.branch_name)}</strong>
                      ${sc.judge_name ? `<small style="display: block; color: #64748b; font-size: 0.72rem;">Penilai: ${Utils.escapeHtml(sc.judge_name)}</small>` : ''}
                    </div>
                    <div style="display: flex; gap: 4px; align-items: center;">
                      <span class="status-badge ${sc.grade === 'Emas' ? 'badge-pending' : 'badge-unit'}" style="font-size: 0.75rem;">${sc.grade}</span>
                      ${statusBadge}
                    </div>
                  </div>
                  <div style="font-size: 0.78rem; color: #475569; margin-bottom: 0.3rem;">
                    Sasaran: <strong>${targetLabel}</strong> | PMR: ${Utils.getLevelBadgeHtml(sc.pmr_level)}
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                    <span style="font-size: 0.85rem; font-weight: 800; color: var(--primary);">Skor Total: ${sc.score_val} Poin</span>
                    <div>${actionButtons}</div>
                  </div>
                  ${hasAspects ? `
                    <div style="margin-top: 0.3rem; border-top: 1px dashed #e2e8f0; padding-top: 0.3rem;">
                      <div style="font-size: 0.75rem; color: #15803d;"><strong>Perolehan Score:</strong> ${scoreValuesHtml}</div>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `;

        scoresContainer.innerHTML = desktopScores + mobileScores;
      }
    } catch (err) {
      console.error('Error loading standings/scores:', err);
    }
  },

  async loadRekapScoresFilterOptions() {
    const eventSelect = document.getElementById('rekapFilterEventSelect');
    if (!eventSelect) return;

    try {
      if (!this.cachedEvents || !this.cachedEvents.length) {
        this.cachedEvents = await API.getEvents();
      }

      const currentVal = eventSelect.value;
      eventSelect.innerHTML = '<option value="">-- Semua Kegiatan / Cabang --</option>' +
        (this.cachedEvents || []).map(e => `<option value="${e.id}">${Utils.escapeHtml(e.title)} (${Utils.escapeHtml(e.category)} - ${e.pmr_level})</option>`).join('');

      if (currentVal) eventSelect.value = currentVal;
    } catch (e) {
      console.error('Error loading rekap filter options:', e);
    }
  },

  filterRekapScores() {
    const eventSelect = document.getElementById('rekapFilterEventSelect');
    const targetTypeSelect = document.getElementById('rekapFilterTargetTypeSelect');
    const container = document.getElementById('rekapEventScoresTableContainer');

    if (!container) return;

    if (!this.cachedScores || !this.cachedScores.length) {
      container.innerHTML = '<p style="color: var(--text-muted); font-style: italic; padding: 1rem 0; text-align: center;">Belum ada data penilaian kegiatan yang tersimpan.</p>';
      return;
    }

    const selectedEventId = eventSelect ? eventSelect.value : '';
    const selectedTargetType = targetTypeSelect ? targetTypeSelect.value : '';

    let filtered = [...this.cachedScores];

    if (selectedEventId) {
      filtered = filtered.filter(s => String(s.event_id) === String(selectedEventId) || s.branch_name === selectedEventId);
    }

    if (selectedTargetType) {
      filtered = filtered.filter(s => {
        const type = s.target_type || (s.participant_id ? 'peserta' : 'kontingen');
        return type === selectedTargetType;
      });
    }

    // Sort by score_val descending to get leaderboard rank
    filtered.sort((a, b) => parseFloat(b.score_val) - parseFloat(a.score_val));

    if (!filtered.length) {
      container.innerHTML = '<p style="color: var(--text-muted); font-style: italic; padding: 1rem 0; text-align: center;">Tidak ada data penilaian yang cocok dengan kriteria filter ini.</p>';
      return;
    }

    const desktopHtml = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 60px; text-align: center;">Rank</th>
              <th>Nama Kegiatan / Cabang</th>
              <th>Sasaran (Peserta / Kontingen)</th>
              <th style="text-align: center;">Tipe</th>
              <th style="text-align: center;">Level PMR</th>
              <th>Nilai Perolehan per Aspek</th>
              <th style="text-align: center;">Total Skor</th>
              <th style="text-align: center;">Medali</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((sc, idx) => {
      const targetLabel = sc.participant_name ? `${Utils.escapeHtml(sc.participant_name)} (${Utils.escapeHtml(sc.unit_name)})` : Utils.escapeHtml(sc.unit_name);
      const isKontingen = sc.target_type === 'kontingen' || (!sc.participant_id && sc.unit_name);
      const targetTypeBadge = isKontingen
        ? '<span class="badge" style="background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; font-size: 0.75rem;"><i class="fa-solid fa-school-flag"></i> Kontingen</span>'
        : '<span class="badge" style="background: #f0f9ff; color: #0369a1; border: 1px solid #e0f2fe; font-size: 0.75rem;"><i class="fa-solid fa-user-graduate"></i> Peserta</span>';

      const hasAspects = sc.aspect_details && sc.aspect_details.length > 0;
      const aspectScoresHtml = hasAspects
        ? sc.aspect_details.map(a => `<span style="font-size: 0.75rem; background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; padding: 2px 6px; border-radius: 4px; display: inline-block; margin: 1px; font-weight: 700;">${Utils.escapeHtml(a.aspect_name)}: ${a.score_val} Poin</span>`).join(' ')
        : `<span style="font-size: 0.75rem; color: #475569;">${sc.score_val} Poin</span>`;

      const rankBadge = idx === 0 ? '<strong style="color: #d97706; font-size: 1.1rem;"><i class="fa-solid fa-trophy" style="color:#d97706;"></i> #1</strong>'
        : idx === 1 ? '<strong style="color: #64748b; font-size: 1.05rem;"><i class="fa-solid fa-medal" style="color:#64748b;"></i> #2</strong>'
          : idx === 2 ? '<strong style="color: #b45309; font-size: 1.05rem;"><i class="fa-solid fa-award" style="color:#b45309;"></i> #3</strong>'
            : `<strong>#${idx + 1}</strong>`;

      return `
                <tr>
                  <td style="text-align: center;">${rankBadge}</td>
                  <td><strong>${Utils.escapeHtml(sc.branch_name || sc.event_title || 'Kegiatan')}</strong></td>
                  <td><strong>${targetLabel}</strong></td>
                  <td style="text-align: center;">${targetTypeBadge}</td>
                  <td style="text-align: center;">${Utils.getLevelBadgeHtml(sc.pmr_level)}</td>
                  <td style="max-width: 260px;">${aspectScoresHtml}</td>
                  <td style="text-align: center;"><strong style="font-size: 1.05rem; color: var(--primary);">${sc.score_val}</strong></td>
                  <td style="text-align: center;"><span class="status-badge ${sc.grade === 'Emas' ? 'badge-pending' : 'badge-unit'}">${sc.grade}</span></td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>
      </div>
    `;

    const mobileHtml = `
      <div class="rekap-scores-mobile-cards">
        ${filtered.map((sc, idx) => {
      const targetLabel = sc.participant_name ? `${Utils.escapeHtml(sc.participant_name)} (${Utils.escapeHtml(sc.unit_name)})` : Utils.escapeHtml(sc.unit_name);
      const isKontingen = sc.target_type === 'kontingen' || (!sc.participant_id && sc.unit_name);
      const targetTypeBadge = isKontingen
        ? '<span class="badge" style="background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; font-size: 0.72rem;"><i class="fa-solid fa-school-flag"></i> Kontingen</span>'
        : '<span class="badge" style="background: #f0f9ff; color: #0369a1; border: 1px solid #e0f2fe; font-size: 0.72rem;"><i class="fa-solid fa-user-graduate"></i> Peserta</span>';

      const hasAspects = sc.aspect_details && sc.aspect_details.length > 0;
      const aspectScoresHtml = hasAspects
        ? sc.aspect_details.map(a => `<span style="font-size: 0.72rem; background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; padding: 2px 5px; border-radius: 4px; display: inline-block; margin-top: 2px; font-weight: 700;">${Utils.escapeHtml(a.aspect_name)}: ${a.score_val}P</span>`).join(' ')
        : '';

      return `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.4rem; margin-bottom: 0.3rem;">
                <div>
                  <strong style="color: #d97706; font-size: 0.9rem;">Rank #${idx + 1}</strong>
                  <strong style="font-size: 0.92rem; color: #0f172a; display: block;">${Utils.escapeHtml(sc.branch_name || 'Kegiatan')}</strong>
                </div>
                <span class="status-badge ${sc.grade === 'Emas' ? 'badge-pending' : 'badge-unit'}" style="font-size: 0.75rem;">${sc.grade}</span>
              </div>
              <div style="font-size: 0.78rem; color: #475569; margin-bottom: 0.3rem;">
                Sasaran: <strong>${targetLabel}</strong> ${targetTypeBadge}
              </div>
              <div style="font-size: 0.85rem; font-weight: 800; color: var(--primary); margin-bottom: 0.3rem;">
                Skor Total: ${sc.score_val} Poin
              </div>
              ${hasAspects ? `<div style="margin-top: 0.3rem; border-top: 1px dashed #e2e8f0; padding-top: 0.3rem;">${aspectScoresHtml}</div>` : ''}
            </div>
          `;
    }).join('')}
      </div>
    `;

    container.innerHTML = desktopHtml + mobileHtml;
  },

  async loadRekapUnitTable() {
    const container = document.getElementById('rekapUnitTableContainer');
    if (!container) return;

    try {
      // Fetch events, units, and scores in parallel
      const [events, units, scores] = await Promise.all([
        API.getEvents(),
        API.getUnits(),
        API.getScores()
      ]);

      if (!units || !units.length) {
        container.innerHTML = '<p style="color: var(--text-muted); font-style: italic; padding: 1rem 0; text-align: center;">Belum ada data unit / kontingen.</p>';
        return;
      }

      // Generate Event Codes (A.01, B.03, B.04, B.05, C.01...) matching official Jumbara format
      const categoryCounters = { Utama: 0, Umum: 0, Jumpa: 0, Bakti: 0, Gembira: 0 };
      const categoryPrefixes = { Utama: 'A', Umum: 'A', Jumpa: 'B', Bakti: 'C', Gembira: 'D' };

      const eventList = (events || []).map((e) => {
        const cat = e.category || 'Umum';
        const prefix = categoryPrefixes[cat] || 'E';
        categoryCounters[cat] = (categoryCounters[cat] || 0) + 1;
        const codeNum = String(categoryCounters[cat]).padStart(2, '0');
        return {
          ...e,
          code: `${prefix}.${codeNum}`
        };
      });

      // Build Unit Score Matrix
      const unitScoreMatrix = {};

      (scores || []).forEach(sc => {
        const uid = sc.unit_id;
        if (!unitScoreMatrix[uid]) unitScoreMatrix[uid] = {};

        const val = parseFloat(sc.score_val || 0);
        const matchingEv = eventList.find(ev => ev.id === sc.event_id || ev.title === sc.branch_name);
        const evKey = matchingEv ? matchingEv.code : sc.branch_name;

        if (!unitScoreMatrix[uid][evKey] || val > unitScoreMatrix[uid][evKey]) {
          unitScoreMatrix[uid][evKey] = val;
        }
      });

      // Compute Total Nilai & Rank per Kontingen
      const unitRankList = units.map(u => {
        let totalScore = 0;
        if (unitScoreMatrix[u.id]) {
          Object.values(unitScoreMatrix[u.id]).forEach(v => {
            totalScore += v;
          });
        }
        return {
          ...u,
          total_score: totalScore
        };
      });

      // Sort units by TOTAL NILAI DESC
      unitRankList.sort((a, b) => b.total_score - a.total_score);

      // Assign Rank #1, #2, #3...
      unitRankList.forEach((u, idx) => {
        u.rank = idx + 1;
      });

      // PMI Red Matrix Table matching user screenshot
      const desktopMatrixHtml = `
        <div class="table-responsive" style="border: 1px solid #cbd5e1; border-radius: 4px; overflow-x: auto; margin-bottom: 0.5rem;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.83rem; font-family: inherit;">
            <thead>
              <tr style="background: #dc2626; color: #ffffff;">
                <th style="background: #dc2626; color: #ffffff; padding: 10px 14px; text-align: left; font-weight: 800; border: 1px solid #b91c1c; white-space: nowrap; width: 220px;" rowspan="2">KONTINGEN</th>
                ${eventList.length > 0 ? `<th colspan="${eventList.length}" style="background: #dc2626; color: #ffffff; padding: 8px; text-align: center; font-weight: 800; border: 1px solid #b91c1c; letter-spacing: 1px;">KEGIATAN</th>` : ''}
                <th style="background: #dc2626; color: #ffffff; padding: 10px 12px; text-align: center; font-weight: 800; border: 1px solid #b91c1c; white-space: nowrap;" rowspan="2">TOTAL NILAI</th>
                <th style="background: #dc2626; color: #ffffff; padding: 10px 12px; text-align: center; font-weight: 800; border: 1px solid #b91c1c; white-space: nowrap;" rowspan="2">PERINGKAT</th>
              </tr>
              <tr style="background: #dc2626; color: #ffffff;">
                ${eventList.map(ev => `<th style="background: #dc2626; color: #ffffff; padding: 6px 8px; text-align: center; font-size: 0.78rem; font-weight: 700; border: 1px solid #b91c1c; min-width: 44px;">${ev.code}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${unitRankList.map((u, rowIdx) => {
        const rowBg = rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
        return `
                  <tr style="background: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px 14px; font-weight: 600; color: #1e293b; border-right: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0; white-space: nowrap;">${Utils.escapeHtml(u.name)}</td>
                    ${eventList.map(ev => {
          const scoreVal = unitScoreMatrix[u.id] ? (unitScoreMatrix[u.id][ev.code] || 0) : 0;
          const displayScore = scoreVal > 0 ? Math.round(scoreVal) : 0;
          const scoreColor = displayScore > 0 ? '#0f172a' : '#64748b';
          const scoreWeight = displayScore > 0 ? '700' : '400';
          return `<td style="padding: 8px 6px; text-align: center; color: ${scoreColor}; font-weight: ${scoreWeight}; border-right: 1px solid #e2e8f0;">${displayScore}</td>`;
        }).join('')}
                    <td style="padding: 8px 12px; text-align: center; font-weight: 800; color: #0f172a; border-right: 1px solid #e2e8f0; font-size: 0.9rem;">${Math.round(u.total_score)}</td>
                    <td style="padding: 8px 12px; text-align: center; font-weight: 800; color: #2563eb; font-size: 0.95rem; border-right: 1px solid #e2e8f0;">${u.rank}</td>
                  </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        </div>

        <div style="font-size: 0.82rem; color: #64748b; margin-top: 0.5rem; margin-bottom: 1.25rem;">
          Showing 1 to ${unitRankList.length} of ${unitRankList.length} entries
        </div>

        <!-- KETERANGAN EVENT (EVENT LEGEND) -->
        <div style="background: #ffffff; border-top: 1px solid #e2e8f0; padding-top: 1rem; margin-top: 1rem;">
          <h5 style="font-size: 0.88rem; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem;">Keterangan Event:</h5>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 0.4rem 1.8rem; font-size: 0.82rem; color: #334155; line-height: 1.5;">
            ${eventList.map(ev => `
              <div><strong>${ev.code}:</strong> ${Utils.escapeHtml(ev.title)}</div>
            `).join('')}
          </div>
        </div>
      `;

      container.innerHTML = desktopMatrixHtml;
    } catch (err) {
      console.error('Error rendering rekap unit matrix table:', err);
      container.innerHTML = '<p style="color: var(--danger-color); font-size: 0.85rem;">Gagal memuat rekap matriks unit.</p>';
    }
  },

  async loadEventAspectsOverviewTable() {
    const container = document.getElementById('eventAspectsOverviewTableContainer');
    if (!container) return;

    try {
      const events = await API.getEvents();
      if (!events || !events.length) {
        container.innerHTML = '<p style="color: var(--text-muted); font-style: italic; font-size: 0.85rem;">Belum ada kegiatan/agenda yang terdaftar.</p>';
        return;
      }

      const canEdit = this.currentUser && ['kabupaten', 'admin'].includes(this.currentUser.role);

      const desktopHtml = `
        <div class="aspects-overview-desktop-table table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 45px; text-align: center;">No</th>
                <th>Nama Kegiatan / Cabang</th>
                <th>Kategori & Level</th>
                <th>Daftar Aspek Penilaian</th>
                <th>Bobot / Skor Maksimal per Aspek</th>
                <th style="text-align: center;">Total Maksimal</th>
                ${canEdit ? '<th style="text-align: center;">Aksi</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${events.map((e, idx) => {
        const hasAspects = e.aspects && e.aspects.length > 0;
        let aspectNamesHtml = '';
        let aspectScoresHtml = '';
        let totalMax = 0;

        if (hasAspects) {
          aspectNamesHtml = '<div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">' +
            e.aspects.map(a => `<span style="background: #e2e8f0; color: #334155; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px; font-weight: 600;">${Utils.escapeHtml(a.aspect_name)}</span>`).join('') +
            '</div>';

          aspectScoresHtml = '<div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">' +
            e.aspects.map(a => {
              const maxScore = parseFloat(a.max_score);
              totalMax += maxScore;
              return `<span style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px; font-weight: 700;">${Utils.escapeHtml(a.aspect_name)}: ${maxScore} Poin</span>`;
            }).join('') +
            '</div>';
        } else {
          totalMax = 100;
          const isSeremonial = (e.category && e.category.toLowerCase().includes('utama')) || /pembukaan|penutupan|upacara/i.test(e.title);
          if (isSeremonial) {
            aspectNamesHtml = `
                      <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                        <span style="background: #f8fafc; border: 1px dashed #cbd5e1; color: #475569; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px;">Kelengkapan</span>
                        <span style="background: #f8fafc; border: 1px dashed #cbd5e1; color: #475569; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px;">Jumlah Peserta</span>
                      </div>
                    `;
            aspectScoresHtml = `
                      <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                        <span style="background: #f8fafc; border: 1px dashed #cbd5e1; color: #1e40af; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px; font-weight: 600;">Kelengkapan: 50 Poin</span>
                        <span style="background: #f8fafc; border: 1px dashed #cbd5e1; color: #1e40af; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px; font-weight: 600;">Jumlah Peserta: 50 Poin</span>
                      </div>
                    `;
          } else {
            aspectNamesHtml = `
                      <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                        <span style="background: #f8fafc; border: 1px dashed #cbd5e1; color: #475569; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px;">SIKAP</span>
                        <span style="background: #f8fafc; border: 1px dashed #cbd5e1; color: #475569; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px;">KETRAMPILAN</span>
                        <span style="background: #f8fafc; border: 1px dashed #cbd5e1; color: #475569; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px;">PENGETAHUAN</span>
                        <span style="background: #f8fafc; border: 1px dashed #cbd5e1; color: #475569; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px;">MANAJERIAL</span>
                      </div>
                    `;
            aspectScoresHtml = `
                      <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                        <span style="background: #f8fafc; border: 1px dashed #cbd5e1; color: #1e40af; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px; font-weight: 600;">SIKAP: 25 Poin</span>
                        <span style="background: #f8fafc; border: 1px dashed #cbd5e1; color: #1e40af; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px; font-weight: 600;">KETRAMPILAN: 25 Poin</span>
                        <span style="background: #f8fafc; border: 1px dashed #cbd5e1; color: #1e40af; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px; font-weight: 600;">PENGETAHUAN: 25 Poin</span>
                        <span style="background: #f8fafc; border: 1px dashed #cbd5e1; color: #1e40af; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px; font-weight: 600;">MANAJERIAL: 25 Poin</span>
                      </div>
                    `;
          }
        }

        return `
                  <tr>
                    <td style="text-align: center;"><strong>${idx + 1}</strong></td>
                    <td><strong>${Utils.escapeHtml(e.title)}</strong></td>
                    <td>
                      <span class="badge badge-unit">${Utils.escapeHtml(e.category)}</span> 
                      ${Utils.getLevelBadgeHtml(e.pmr_level)}
                    </td>
                    <td>${aspectNamesHtml}</td>
                    <td>${aspectScoresHtml}</td>
                    <td style="text-align: center;"><strong style="color: #059669; font-size: 0.95rem;">${totalMax} Poin</strong></td>
                    ${canEdit ? `
                      <td style="text-align: center;">
                        <button type="button" class="btn btn-outline btn-sm" style="font-size: 0.78rem; color: #0284c7; border-color: #bae6fd; background: #f0f9ff;" onclick="App.openManageAspectsModal(${e.id})">
                          <i class="fa-solid fa-sliders"></i> Edit Aspek
                        </button>
                      </td>
                    ` : ''}
                  </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        </div>
      `;

      const mobileHtml = `
        <div class="aspects-overview-mobile-cards">
          ${events.map((e, idx) => {
        const hasAspects = e.aspects && e.aspects.length > 0;
        let aspectNamesHtml = '';
        let aspectScoresHtml = '';
        let totalMax = 0;

        if (hasAspects) {
          aspectNamesHtml = e.aspects.map(a => `<span style="background: #e2e8f0; color: #334155; font-size: 0.74rem; padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block; margin-right: 2px; margin-top: 2px;">${Utils.escapeHtml(a.aspect_name)}</span>`).join('');
          aspectScoresHtml = e.aspects.map(a => {
            const maxScore = parseFloat(a.max_score);
            totalMax += maxScore;
            return `<span style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 0.74rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; display: inline-block; margin-right: 2px; margin-top: 2px;">${Utils.escapeHtml(a.aspect_name)}: ${maxScore}P</span>`;
          }).join('');
        } else {
          totalMax = 100;
          const isSeremonial = (e.category && e.category.toLowerCase().includes('utama')) || /pembukaan|penutupan|upacara/i.test(e.title);
          if (isSeremonial) {
            aspectNamesHtml = '<span style="font-size: 0.74rem; color: #475569;">Kelengkapan, Jumlah Peserta</span>';
            aspectScoresHtml = '<span style="font-size: 0.74rem; color: #1d4ed8; font-weight: 600;">Kelengkapan: 50P, Jumlah Peserta: 50P</span>';
          } else {
            aspectNamesHtml = '<span style="font-size: 0.74rem; color: #475569;">SIKAP, KETRAMPILAN, PENGETAHUAN, MANAJERIAL</span>';
            aspectScoresHtml = '<span style="font-size: 0.74rem; color: #1d4ed8; font-weight: 600;">SIKAP: 25P, KETRAMPILAN: 25P, PENGETAHUAN: 25P, MANAJERIAL: 25P</span>';
          }
        }

        return `
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.3rem;">
                  <div>
                    <strong style="font-size: 0.9rem; color: #0f172a;">${idx + 1}. ${Utils.escapeHtml(e.title)}</strong>
                    <div style="margin-top: 0.2rem;">
                      <span class="badge badge-unit">${Utils.escapeHtml(e.category)}</span>
                      ${Utils.getLevelBadgeHtml(e.pmr_level)}
                    </div>
                  </div>
                  <strong style="color: #059669; font-size: 0.85rem; white-space: nowrap;">${totalMax} Poin</strong>
                </div>
                <div style="font-size: 0.76rem; color: #475569; margin-top: 0.4rem;"><strong>Daftar Aspek:</strong> ${aspectNamesHtml}</div>
                <div style="font-size: 0.76rem; color: #1d4ed8; margin-top: 0.25rem;"><strong>Bobot Skor:</strong> ${aspectScoresHtml}</div>
                ${canEdit ? `
                  <div style="margin-top: 0.5rem; text-align: right;">
                    <button type="button" class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 2px 8px;" onclick="App.openManageAspectsModal(${e.id})">
                      <i class="fa-solid fa-sliders"></i> Edit Aspek
                    </button>
                  </div>
                ` : ''}
              </div>
            `;
      }).join('')}
        </div>
      `;

      container.innerHTML = desktopHtml + mobileHtml;
    } catch (err) {
      console.error('Error loading event aspects overview table:', err);
      container.innerHTML = '<p style="color: var(--danger-color); font-size: 0.85rem;">Gagal memuat tabel aspek penilaian per kegiatan.</p>';
    }
  },

  // --- TAB 5: KELOLA JADWAL ---
  async renderTabJadwal(container) {
    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <h3 class="panel-title">${Icons.agenda(20, 'var(--primary)')} Manajemen Jadwal & Rundown Jumbara</h3>
          <button class="btn btn-primary btn-sm" onclick="App.openEventModal()"><i class="fa-solid fa-calendar-plus"></i> Tambah Agenda Baru & Set Kuota</button>
        </div>

        <div id="eventsManageTableContainer">
          <p style="color: var(--text-muted);">Memuat jadwal...</p>
        </div>
      </div>
    `;

    this.loadManageEvents();
  },

  async loadManageEvents() {
    const container = document.getElementById('eventsManageTableContainer');
    if (!container) return;

    try {
      const events = await API.getEvents();
      this.cachedEvents = events;
      const desktopTableHtml = `
        <div class="jadwal-desktop-table table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Judul Kegiatan</th>
                <th>Kategori & Level</th>
                <th>Batas Kuota / Unit</th>
                <th>Lokasi</th>
                <th>Tanggal & Jam</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${events.map(e => `
                <tr>
                  <td><strong>${Utils.escapeHtml(e.title)}</strong></td>
                  <td>
                    <span class="badge badge-unit">${Utils.escapeHtml(e.category)}</span><br>
                    <span style="margin-top: 0.2rem; display: inline-block;">${Utils.getLevelBadgeHtml(e.pmr_level)}</span>
                  </td>
                  <td>
                    ${e.max_participants_per_unit > 0
          ? `<strong style="color: #b45309;"><i class="fa-solid fa-user-lock"></i> ${e.max_participants_per_unit} Peserta / Unit</strong>`
          : `<span style="color: var(--text-muted);"><i class="fa-solid fa-infinity"></i> Tanpa Batas</span>`}
                  </td>
                  <td>📍 ${Utils.escapeHtml(e.location)}</td>
                  <td>${e.event_date} (${e.start_time} - ${e.end_time})</td>
                  <td>
                    <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                      <button type="button" class="btn btn-primary btn-sm" style="font-weight: 700;" onclick="App.openEventModal(${e.id})">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                      </button>
                      <button type="button" class="btn btn-outline btn-sm" style="font-weight: 700; color: #1d4ed8; border-color: #bfdbfe; background: #eff6ff;" onclick="App.openRegisteredParticipantsModal(${e.id})">
                        <i class="fa-solid fa-users"></i> Pendaftar
                      </button>
                      <button type="button" class="btn btn-danger btn-sm" onclick="App.deleteEvent(${e.id})">Hapus</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      const mobileCardsHtml = `
        <div class="jadwal-mobile-cards">
          ${events.map(e => `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); width: 100%; box-sizing: border-box;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
                <strong style="font-size: 0.95rem; color: #0f172a; word-break: break-word; flex: 1;">${Utils.escapeHtml(e.title)}</strong>
                <span class="badge badge-unit">${Utils.escapeHtml(e.category)}</span>
              </div>
              <div style="font-size: 0.78rem; color: #475569; margin-bottom: 0.4rem; word-break: break-word;">
                Tingkat: ${Utils.getLevelBadgeHtml(e.pmr_level)} | 📍 ${Utils.escapeHtml(e.location)}
              </div>
              <div style="font-size: 0.78rem; color: #334155; margin-bottom: 0.45rem;">
                📅 <strong>${e.event_date}</strong> (${e.start_time} - ${e.end_time})
                <br>
                ${e.max_participants_per_unit > 0
          ? `<span style="color: #b45309; font-weight: 700;"><i class="fa-solid fa-user-lock"></i> Kuota: ${e.max_participants_per_unit} / Unit</span>`
          : `<span style="color: var(--text-muted);"><i class="fa-solid fa-infinity"></i> Kuota Tanpa Batas</span>`}
              </div>
              <div style="display: flex; gap: 0.3rem; flex-wrap: wrap; padding-top: 0.45rem; border-top: 1px dashed #e2e8f0;">
                <button type="button" class="btn btn-primary btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem; font-weight: 700;" onclick="App.openEventModal(${e.id})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                <button type="button" class="btn btn-outline btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem; color: #1d4ed8; border-color: #bfdbfe; background: #eff6ff;" onclick="App.openRegisteredParticipantsModal(${e.id})"><i class="fa-solid fa-users"></i> Pendaftar</button>
                <button type="button" class="btn btn-danger btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem;" onclick="App.deleteEvent(${e.id})">Hapus</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      container.innerHTML = desktopTableHtml + mobileCardsHtml;
    } catch (err) {
      container.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
    }
  },

  // --- TAB 6: PENGUMUMAN ---
  async renderTabPengumuman(container) {
    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <h3 class="panel-title">${Icons.announcement(20, 'var(--primary)')} Kelola Pengumuman & Informasi</h3>
          <button class="btn btn-primary btn-sm" onclick="App.openAddAnnouncementPrompt()">Buat Pengumuman</button>
        </div>

        <div id="announcementsManageContainer">
          <p style="color: var(--text-muted);">Memuat pengumuman...</p>
        </div>
      </div>
    `;

    this.loadManageAnnouncements();
  },

  async loadManageAnnouncements() {
    const container = document.getElementById('announcementsManageContainer');
    if (!container) return;

    try {
      const anns = await API.getAnnouncements();
      container.innerHTML = anns.map(a => `
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 1rem; border-radius: 6px; margin-bottom: 0.8rem; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h4 style="color: var(--secondary); margin-bottom: 0.3rem;">${Utils.escapeHtml(a.title)}</h4>
            <p style="font-size: 0.88rem; color: var(--text-main); margin-bottom: 0.5rem;">${Utils.escapeHtml(a.content)}</p>
            <small style="color: var(--text-muted);">Priority: <strong>${a.priority}</strong> | Target: <strong>${a.target_role}</strong></small>
          </div>
          <button class="btn btn-danger btn-sm" onclick="App.deleteAnnouncement(${a.id})">Hapus</button>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
    }
  },

  // =========================================================================
  // TAB: KELOLA & UNDUH MATERI JUMBARA (ADMIN KABUPATEN)
  // =========================================================================
  async renderTabMateri(container) {
    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 class="panel-title">
              <i class="fa-solid fa-book-bookmark" style="color: var(--primary);"></i> Kelola Dokumen & Materi Jumbara
            </h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.25rem 0 0 0;">
              Publikasikan modul materi PMR, juknis, kisi-kisi lomba, denah buperta, dan berkas administrasi untuk peserta & kontingen.
            </p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="App.openAddMaterialModal()" style="font-weight: 700;">
            <i class="fa-solid fa-file-arrow-up"></i> Upload Dokumen Baru
          </button>
        </div>

        <div id="manageMaterialsContainer" style="margin-top: 1.25rem;">
          <p style="color: var(--text-muted); text-align: center; padding: 2rem 0;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat daftar materi...</p>
        </div>
      </div>
    `;

    this.loadManageMaterials();
  },

  async loadManageMaterials() {
    const container = document.getElementById('manageMaterialsContainer');
    if (!container) return;

    try {
      const res = await API.getMaterials();
      const list = Array.isArray(res) ? res : (res.data || []);

      if (!list.length) {
        container.innerHTML = `
          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 2.5rem; text-align: center;">
            <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; color: #94a3b8; margin-bottom: 0.75rem; display: block;"></i>
            <h4 style="font-size: 1.05rem; color: #334155; margin-bottom: 0.35rem; font-weight: 700;">Belum Ada Dokumen Materi</h4>
            <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 1rem;">Mulai dengan mengunggah modul atau panduan kegiatan Jumbara.</p>
            <button class="btn btn-primary btn-sm" onclick="App.openAddMaterialModal()"><i class="fa-solid fa-file-arrow-up"></i> Upload Dokumen Baru</button>
          </div>
        `;
        return;
      }

      const tableRows = list.map((m, idx) => {
        const ext = (m.file_type || 'pdf').toUpperCase();
        return `
          <tr>
            <td style="font-weight: 700; width: 40px; text-align: center;">${idx + 1}</td>
            <td>
              <div style="font-weight: 700; color: #0f172a; font-size: 0.95rem; margin-bottom: 0.25rem;">
                ${Utils.escapeHtml(m.title)}
                ${m.is_featured == 1 ? '<span class="status-badge badge-unit" style="font-size: 0.68rem; margin-left: 0.35rem;"><i class="fa-solid fa-star"></i> PENTING</span>' : ''}
              </div>
              <div style="font-size: 0.8rem; color: #64748b; line-height: 1.4;">${Utils.escapeHtml(m.description || '-')}</div>
            </td>
            <td>
              <span class="badge badge-unit" style="font-size: 0.75rem;">${Utils.escapeHtml(m.category || 'Umum')}</span>
            </td>
            <td style="font-size: 0.82rem; white-space: nowrap;">
              <span class="badge" style="background: #fee2e2; color: #dc2626; font-weight: 800;">${ext}</span>
              <span style="color: #64748b; margin-left: 0.25rem;">${Utils.escapeHtml(m.file_size || '-')}</span>
            </td>
            <td style="text-align: center; font-weight: 700; color: #059669; font-size: 0.9rem;">
              <i class="fa-solid fa-download" style="font-size: 0.8rem;"></i> ${Number(m.download_count || 0).toLocaleString('id-ID')}
            </td>
            <td style="font-size: 0.8rem; color: #64748b; white-space: nowrap;">
              ${Utils.formatDate(m.created_at)}
            </td>
            <td style="text-align: center; white-space: nowrap;">
              <a href="${m.file_url}" target="_blank" download class="btn btn-outline btn-xs" style="padding: 0.3rem 0.6rem; font-size: 0.78rem; text-decoration: none; margin-right: 0.3rem;" title="Download / Preview">
                <i class="fa-solid fa-eye"></i>
              </a>
              <button class="btn btn-danger btn-xs" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" onclick="App.deleteMaterial(${m.id})" title="Hapus Dokumen">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');

      container.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th>Judul & Deskripsi Dokumen</th>
                <th>Kategori</th>
                <th>Format & Ukuran</th>
                <th style="text-align: center;">Diunduh</th>
                <th>Tanggal Rilis</th>
                <th style="text-align: center; width: 100px;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: #ef4444;">Error memuat materi: ${Utils.escapeHtml(err.message)}</p>`;
    }
  },

  openAddMaterialModal() {
    let modal = document.getElementById('addMaterialModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'addMaterialModal';
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width: 580px;">
          <div class="modal-header">
            <h3 class="modal-title"><i class="fa-solid fa-file-arrow-up" style="color: var(--primary);"></i> Upload Dokumen / Materi Baru</h3>
            <button class="modal-close" onclick="App.closeModal('addMaterialModal')">&times;</button>
          </div>
          <form onsubmit="App.handleSaveMaterial(event)">
            <div class="modal-body" style="padding: 1.5rem 1.75rem;">
              <div id="addMaterialAlert" style="display: none; margin-bottom: 1rem; padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600;"></div>
              
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.35rem;">Judul Dokumen / Materi *</label>
                <input type="text" id="matTitle" placeholder="Contoh: Juklak & Juknis Jumbara XII 2026..." required class="form-control" style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;">
              </div>

              <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.35rem;">Kategori Materi *</label>
                  <select id="matCategory" required class="form-control" style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                    <option value="Buku Panduan & Juknis">Buku Panduan & Juknis</option>
                    <option value="Materi Pokok PMR">Materi Pokok PMR</option>
                    <option value="Lomba & Penilaian">Lomba & Penilaian</option>
                    <option value="Formulir & Administrasi">Formulir & Administrasi</option>
                    <option value="Denah & Sarpras Buperta">Denah & Sarpras Buperta</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.35rem;">Opsi Dokumen</label>
                  <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; margin-top: 0.5rem;">
                    <input type="checkbox" id="matIsFeatured" value="1">
                    <span>Tandai Dokumen Unggulan</span>
                  </label>
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.35rem;">Pilih File Dokumen (PDF, DOCX, PPTX, XLSX, ZIP) *</label>
                <input type="file" id="matFileInput" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip" required class="form-control" style="width: 100%; padding: 0.45rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc;">
                <small style="color: var(--text-muted); font-size: 0.78rem; display: block; margin-top: 0.25rem;">Maksimal 25MB per berkas.</small>
              </div>

              <div class="form-group" style="margin-bottom: 0.5rem;">
                <label class="form-label" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.35rem;">Deskripsi / Keterangan Singkat</label>
                <textarea id="matDescription" rows="3" placeholder="Ringkasan isi dokumen materi..." class="form-control" style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; font-size: 0.85rem; resize: vertical;"></textarea>
              </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem;">
              <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal('addMaterialModal')">Batal</button>
              <button type="submit" id="matSubmitBtn" class="btn btn-primary btn-sm" style="font-weight: 700;">
                <i class="fa-solid fa-cloud-arrow-up"></i> Upload & Terbitkan
              </button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);
    }
    this.openModal('addMaterialModal');
  },

  async handleSaveMaterial(event) {
    if (event) event.preventDefault();

    const title = document.getElementById('matTitle')?.value.trim();
    const category = document.getElementById('matCategory')?.value;
    const isFeatured = document.getElementById('matIsFeatured')?.checked ? 1 : 0;
    const description = document.getElementById('matDescription')?.value.trim();
    const fileInput = document.getElementById('matFileInput');
    const alertBox = document.getElementById('addMaterialAlert');
    const submitBtn = document.getElementById('matSubmitBtn');

    if (!title) {
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#b91c1c';
        alertBox.innerHTML = 'Judul dokumen wajib diisi.';
      }
      return;
    }

    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#b91c1c';
        alertBox.innerHTML = 'Silakan pilih file dokumen untuk diupload.';
      }
      return;
    }

    const file = fileInput.files[0];
    const origBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah...';

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Data = e.target.result;
        const fileSizeStr = (file.size > 1024 * 1024) 
          ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
          : Math.round(file.size / 1024) + ' KB';

        await API.saveMaterial({
          title: title,
          category: category,
          is_featured: isFeatured,
          description: description,
          file_data: base64Data,
          file_name: file.name,
          file_size: fileSizeStr
        });

        Utils.showToast('Dokumen materi berhasil diupload dan dipublikasikan!', 'success');
        this.closeModal('addMaterialModal');
        this.loadManageMaterials();
        this.loadPublicMaterials();
      } catch (err) {
        if (alertBox) {
          alertBox.style.display = 'block';
          alertBox.style.background = '#fee2e2';
          alertBox.style.color = '#b91c1c';
          alertBox.innerHTML = `Gagal upload: ${Utils.escapeHtml(err.message)}`;
        }
        Utils.showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
      }
    };
    reader.onerror = () => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origBtnHtml;
      Utils.showToast('Gagal membaca file dari komputer Anda.', 'error');
    };
    reader.readAsDataURL(file);
  },

  async deleteMaterial(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen materi ini? Berkas tidak akan dapat diunduh lagi oleh peserta.')) return;
    try {
      await API.deleteMaterial(id);
      Utils.showToast('Dokumen materi berhasil dihapus.', 'info');
      this.loadManageMaterials();
      this.loadPublicMaterials();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  // =========================================================================
  // TAB: KOTAK SARAN & ASPIRASI (ADMIN KABUPATEN)
  // =========================================================================
  async renderTabFeedback(container) {
    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 class="panel-title">
              <i class="fa-solid fa-comments" style="color: var(--primary);"></i> Kotak Saran, Aspirasi & Evaluasi Layanan
            </h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.25rem 0 0 0;">
              Pantau masukan, keluhan fasilitas Buperta, kritik membangun, dan indeks kepuasan dari kontingen & masyarakat.
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <select id="adminFeedbackStatusFilter" onchange="App.filterFeedbackStatus(this.value)" style="padding: 0.4rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">
              <option value="all">Semua Status</option>
              <option value="unread">Belum Dibaca</option>
              <option value="followup">Perlu Follow-up</option>
              <option value="read">Selesai / Dibaca</option>
            </select>
            <button class="btn btn-outline btn-sm" onclick="App.loadManageFeedback(1)" title="Segarkan Data">
              <i class="fa-solid fa-rotate-right"></i>
            </button>
          </div>
        </div>

        <!-- Summary Metric Cards -->
        <div id="feedbackStatsRow" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 1.25rem; margin-bottom: 1.5rem;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
            <div style="font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Total Masukan</div>
            <div id="fbStatTotal" style="font-size: 1.6rem; font-weight: 800; color: #0f172a; margin-top: 0.25rem;">-</div>
          </div>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem;">
            <div style="font-size: 0.8rem; color: #dc2626; font-weight: 700; text-transform: uppercase;">Belum Dibaca</div>
            <div id="fbStatUnread" style="font-size: 1.6rem; font-weight: 800; color: #dc2626; margin-top: 0.25rem;">-</div>
          </div>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 1rem;">
            <div style="font-size: 0.8rem; color: #2563eb; font-weight: 700; text-transform: uppercase;">Perlu Follow-up</div>
            <div id="fbStatFollowup" style="font-size: 1.6rem; font-weight: 800; color: #2563eb; margin-top: 0.25rem;">-</div>
          </div>
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 1rem;">
            <div style="font-size: 0.8rem; color: #d97706; font-weight: 700; text-transform: uppercase;">Rata-rata Rating</div>
            <div id="fbStatRating" style="font-size: 1.6rem; font-weight: 800; color: #d97706; margin-top: 0.25rem;">
              ⭐ - / 5.0
            </div>
          </div>
        </div>

        <div id="manageFeedbackContainer">
          <p style="color: var(--text-muted); text-align: center; padding: 2rem 0;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat masukan saran...</p>
        </div>
      </div>
    `;

    this.loadManageFeedback(1);
  },

  filterFeedbackStatus(status) {
    this.currentFeedbackFilter = status;
    this.loadManageFeedback(1);
  },

  async loadManageFeedback(page = 1) {
    this.currentFeedbackPage = page;
    const container = document.getElementById('manageFeedbackContainer');
    if (!container) return;

    const filterVal = document.getElementById('adminFeedbackStatusFilter')?.value || this.currentFeedbackFilter || 'all';

    try {
      const res = await API.getFeedbacks({ page: page, limit: 15, status: filterVal });
      const stats = res.stats || {};
      const list = res.data || [];

      // Update metric cards
      const tEl = document.getElementById('fbStatTotal');
      const uEl = document.getElementById('fbStatUnread');
      const fEl = document.getElementById('fbStatFollowup');
      const rEl = document.getElementById('fbStatRating');

      if (tEl) tEl.textContent = (stats.total || 0).toLocaleString('id-ID');
      if (uEl) uEl.textContent = (stats.unread || 0).toLocaleString('id-ID');
      if (fEl) fEl.textContent = (stats.followup || 0).toLocaleString('id-ID');
      if (rEl) rEl.innerHTML = `⭐ ${stats.avg_rating || 5.0} <span style="font-size: 0.85rem; font-weight: normal; color: #64748b;">/ 5.0</span>`;

      if (!list.length) {
        container.innerHTML = `
          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 3rem 1.5rem; text-align: center;">
            <i class="fa-solid fa-comment-dots" style="font-size: 2.5rem; color: #94a3b8; margin-bottom: 0.75rem; display: block;"></i>
            <h4 style="font-size: 1.05rem; color: #334155; margin-bottom: 0.35rem; font-weight: 700;">Belum Ada Saran Masuk</h4>
            <p style="color: #64748b; font-size: 0.85rem; margin: 0;">Tidak ada pesan saran dengan status filter yang dipilih.</p>
          </div>
        `;
        return;
      }

      const statusBadges = {
        'unread': '<span class="status-badge badge-rejected" style="font-size: 0.72rem;"><i class="fa-solid fa-envelope"></i> BELUM DIBACA</span>',
        'followup': '<span class="status-badge badge-unit" style="font-size: 0.72rem; background: #e0f2fe; color: #0369a1;"><i class="fa-solid fa-arrows-spin"></i> PERLU FOLLOW-UP</span>',
        'read': '<span class="status-badge badge-verified" style="font-size: 0.72rem;"><i class="fa-solid fa-check-double"></i> SELESAI / TERBACA</span>'
      };

      const tableRows = list.map((item, idx) => {
        const starsHtml = '⭐'.repeat(item.rating || 5);
        return `
          <tr id="feedbackRow_${item.id}">
            <td style="font-size: 0.8rem; color: #64748b; white-space: nowrap;">
              ${Utils.formatDate(item.created_at)}
            </td>
            <td>
              <div style="font-weight: 700; color: #0f172a; font-size: 0.92rem;">
                ${item.is_anonymous == 1 ? '<span style="color: #64748b;"><i class="fa-solid fa-user-secret"></i> Anonim (Rahasia)</span>' : Utils.escapeHtml(item.sender_name)}
              </div>
              <div style="font-size: 0.78rem; color: #64748b;">
                <i class="fa-solid fa-id-badge"></i> ${Utils.escapeHtml(item.sender_role || 'Peserta')}
                ${item.unit_name ? ` • <strong>${Utils.escapeHtml(item.unit_name)}</strong>` : ''}
              </div>
            </td>
            <td>
              <span class="badge badge-unit" style="font-size: 0.72rem;">${Utils.escapeHtml(item.category)}</span>
            </td>
            <td style="white-space: nowrap; font-size: 0.85rem;">
              ${starsHtml}
            </td>
            <td>
              <div style="font-size: 0.85rem; color: #334155; line-height: 1.45; max-width: 380px;">
                ${Utils.escapeHtml(item.message)}
              </div>
              ${item.admin_notes ? `<div style="margin-top: 0.35rem; font-size: 0.76rem; background: #fef3c7; color: #92400e; padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-block;"><strong>Catatan Posko:</strong> ${Utils.escapeHtml(item.admin_notes)}</div>` : ''}
            </td>
            <td>
              ${statusBadges[item.status] || item.status}
            </td>
            <td style="text-align: center; white-space: nowrap;">
              <div style="display: flex; gap: 0.3rem; justify-content: center;">
                ${item.status !== 'read' ? `
                  <button class="btn btn-outline btn-xs" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #059669; border-color: #a7f3d0;" onclick="App.updateFeedbackStatus(${item.id}, 'read')" title="Tandai Selesai / Dibaca">
                    <i class="fa-solid fa-check"></i>
                  </button>
                ` : ''}
                ${item.status !== 'followup' ? `
                  <button class="btn btn-outline btn-xs" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #2563eb; border-color: #bfdbfe;" onclick="App.updateFeedbackStatus(${item.id}, 'followup')" title="Tandai Perlu Tindak Lanjut">
                    <i class="fa-solid fa-arrows-spin"></i>
                  </button>
                ` : ''}
                <button class="btn btn-danger btn-xs" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="App.deleteFeedbackItem(${item.id})" title="Hapus Masukan">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      container.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 120px;">Waktu</th>
                <th>Pengirim & Unit</th>
                <th>Kategori</th>
                <th>Rating</th>
                <th>Isi Masukan / Saran</th>
                <th>Status</th>
                <th style="text-align: center; width: 110px;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: #ef4444;">Error memuat feedback: ${Utils.escapeHtml(err.message)}</p>`;
    }
  },

  async updateFeedbackStatus(id, newStatus) {
    let notes = '';
    if (newStatus === 'followup') {
      notes = prompt('Catatan tindak lanjut panitia (opsional):') || '';
    }
    try {
      await API.updateFeedbackStatus(id, newStatus, notes);
      Utils.showToast(`Status masukan berhasil diperbarui (${newStatus}).`, 'success');
      this.loadManageFeedback(this.currentFeedbackPage);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async deleteFeedbackItem(id) {
    if (!confirm('Hapus pesan saran ini?')) return;
    try {
      await API.deleteFeedback(id);
      Utils.showToast('Pesan saran berhasil dihapus.', 'info');
      this.loadManageFeedback(this.currentFeedbackPage);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  // --- TAB 7: PENGATURAN DB DINAMIS (LOGO, FAVICON, JUMBOTRON CAROUSEL & DEADLINE TIMER) ---
  async renderTabPengaturan(container) {
    const s = this.appSettings;

    let heroImgs = [];
    try {
      heroImgs = typeof s.jumbotron_images === 'string' ? JSON.parse(s.jumbotron_images) : s.jumbotron_images;
    } catch (e) {
      heroImgs = ['frontend/images/hero.jpg'];
    }
    if (!Array.isArray(heroImgs)) heroImgs = ['frontend/images/hero.jpg'];

    const deadlineVal = s.reg_deadline || '2026-10-14T23:59';
    const activeVal = (s.reg_active === '1' || s.reg_active === 1 || s.reg_active === true) ? '1' : '0';

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <h3 class="panel-title">${Icons.settings(20, 'var(--primary)')} Pengaturan</h3>
        </div>

        <!-- Section 1: Dynamic Jumbotron Hero Banner Carousel Manager -->
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; margin-bottom: 2rem;">
          <h4 style="color: var(--secondary); margin-bottom: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-images" style="color: var(--primary);"></i> Kelola Gambar Carousel Background Jumbotron Hero
          </h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
            Tambahkan beberapa gambar kegiatan Jumbara untuk ditampilkan secara bergantian (auto-slide carousel) di banner utama.
          </p>

          <!-- Grid Preview Banner Images -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
            ${heroImgs.map((imgUrl, idx) => `
              <div style="position: relative; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1; background: #000; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <img src="${imgUrl}" alt="Banner ${idx + 1}" style="width: 100%; height: 105px; object-fit: cover; opacity: 0.9;">
                <div style="position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,0.75); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;">
                  <i class="fa-solid fa-layer-group" style="margin-right: 3px;"></i> Slide #${idx + 1}
                </div>
                ${heroImgs.length > 1 ? `
                  <button type="button" class="btn btn-danger btn-sm" onclick="App.removeJumbotronImage(${idx})" style="position: absolute; top: 6px; right: 6px; width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.4);" title="Hapus Gambar Banner">
                    <i class="fa-solid fa-trash-can" style="font-size: 0.75rem;"></i>
                  </button>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <!-- Upload Form New Jumbotron Image -->
          <div style="display: flex; gap: 0.75rem; align-items: center; background: white; padding: 0.85rem; border-radius: 8px; border: 1px solid #e2e8f0; flex-wrap: wrap;">
            <input type="file" id="jumbotronFileInput" accept="image/jpeg,image/png,image/webp" style="font-size: 0.85rem; flex: 1; min-width: 220px;">
            <button type="button" class="btn btn-primary btn-sm" onclick="App.handleUploadJumbotronBanner()" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; font-weight: 600; border-radius: 6px;">
              <i class="fa-solid fa-cloud-arrow-up"></i> Unggah Banner Baru (JPG/PNG)
            </button>
          </div>
        </div>

        <!-- Section 2: Registration Deadline & Timer Config -->
        <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; margin-bottom: 2rem;">
          <h4 style="color: var(--secondary); margin-bottom: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-clock" style="color: var(--accent);"></i> Pengaturan Waktu & Durasi Pendaftaran Mandiri
          </h4>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.2rem;">
            <div class="form-group">
              <label class="form-label">Status Pendaftaran Mandiri *</label>
              <select id="setRegActive">
                <option value="1" ${activeVal === '1' ? 'selected' : ''}>🟢 BUKA Pendaftaran Mandiri</option>
                <option value="0" ${activeVal === '0' ? 'selected' : ''}>🔴 TUTUP Pendaftaran Mandiri</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Batas Akhir Waktu & Tanggal Pendaftaran *</label>
              <input type="datetime-local" id="setRegDeadline" value="${deadlineVal}">
              <span class="form-help">Jika waktu saat ini melewati tanggal ini, tombol pendaftaran otomatis ditutup.</span>
            </div>
          </div>
        </div>

        <!-- Section 3: Direct File Upload Cards Logo, Favicon & Kop Surat -->
        <div style="margin-bottom: 1rem;">
          <h4 style="color: var(--secondary); font-size: 1rem; margin-bottom: 0.3rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-palette" style="color: var(--primary);"></i> Logo, Favicon & Identitas Visual
          </h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
            Unggah file gambar logo dan identitas resmi kegiatan. Format utama yang didukung: <strong>JPG, JPEG, PNG, WEBP</strong> (dan SVG/ICO).
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
          
          <!-- Box 1: Logo Instansi (PMI) -->
          <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 10px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <h5 style="color: var(--secondary); font-size: 0.92rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.4rem;">
                  <i class="fa-solid fa-shield-heart" style="color: #dc2626;"></i> Logo Instansi (PMI)
                </h5>
                <span style="font-size: 0.7rem; background: #fee2e2; color: #991b1b; padding: 2px 7px; border-radius: 4px; font-weight: 700;">JPG / PNG</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0.85rem; background: #f8fafc; padding: 0.75rem; border-radius: 8px; border: 1px dashed #cbd5e1;">
                <img id="logoPreviewImg" src="${s.app_logo || 'frontend/images/logo-pmi.svg'}" alt="Preview Logo PMI" style="height: 48px; width: 48px; object-fit: contain; background: white; padding: 4px; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <div style="overflow: hidden; flex: 1;">
                  <small style="color: #64748b; font-size: 0.72rem; display: block; font-weight: 600;">Logo PMI Aktif:</small>
                  <code style="font-size: 0.75rem; word-break: break-all; color: #334155;">${Utils.escapeHtml(s.app_logo || 'frontend/images/logo-pmi.svg')}</code>
                </div>
              </div>
              <div class="form-group" style="margin-bottom: 0.85rem;">
                <label style="font-size: 0.78rem; font-weight: 600; color: #475569; display: block; margin-bottom: 0.3rem;">Pilih File Logo Baru (JPG / PNG):</label>
                <input type="file" id="logoFileInput" accept="image/jpeg,image/png,image/webp,image/svg+xml" onchange="App.handlePreviewSettingFile('logo', this)" style="font-size: 0.82rem; width: 100%;">
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
              <button type="button" class="btn btn-primary btn-sm" onclick="App.handleUploadFile('logo')" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.5rem 0.6rem; font-weight: 600; font-size: 0.82rem; border-radius: 6px;">
                <i class="fa-solid fa-cloud-arrow-up"></i> Upload Logo
              </button>
              <button type="button" class="btn btn-outline btn-sm" onclick="App.handleResetSettingFile('logo')" title="Reset ke Default Logo PMI" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; padding: 0.5rem 0.6rem; color: #64748b; border: 1px solid #cbd5e1; font-size: 0.82rem; border-radius: 6px; background: white;">
                <i class="fa-solid fa-rotate-left"></i> Reset
              </button>
            </div>
          </div>

          <!-- Box 2: Logo Kegiatan Jumbara -->
          <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 10px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <h5 style="color: var(--secondary); font-size: 0.92rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.4rem;">
                  <i class="fa-solid fa-award" style="color: #0284c7;"></i> Logo Kegiatan Jumbara
                </h5>
                <span style="font-size: 0.7rem; background: #e0f2fe; color: #0369a1; padding: 2px 7px; border-radius: 4px; font-weight: 700;">JPG / PNG</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0.85rem; background: #f8fafc; padding: 0.75rem; border-radius: 8px; border: 1px dashed #cbd5e1;">
                <img id="eventLogoPreviewImg" src="${s.event_logo || 'frontend/images/logo-jumbara-xii.png'}" alt="Preview Logo Jumbara" style="height: 48px; width: 48px; object-fit: contain; background: white; padding: 4px; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <div style="overflow: hidden; flex: 1;">
                  <small style="color: #64748b; font-size: 0.72rem; display: block; font-weight: 600;">Logo Jumbara Aktif:</small>
                  <code style="font-size: 0.75rem; word-break: break-all; color: #334155;">${Utils.escapeHtml(s.event_logo || 'frontend/images/logo-jumbara-xii.png')}</code>
                </div>
              </div>
              <div class="form-group" style="margin-bottom: 0.85rem;">
                <label style="font-size: 0.78rem; font-weight: 600; color: #475569; display: block; margin-bottom: 0.3rem;">Pilih File Logo Jumbara (JPG / PNG):</label>
                <input type="file" id="eventLogoFileInput" accept="image/jpeg,image/png,image/webp,image/svg+xml" onchange="App.handlePreviewSettingFile('event_logo', this)" style="font-size: 0.82rem; width: 100%;">
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
              <button type="button" class="btn btn-primary btn-sm" onclick="App.handleUploadFile('event_logo')" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.5rem 0.6rem; font-weight: 600; font-size: 0.82rem; border-radius: 6px;">
                <i class="fa-solid fa-cloud-arrow-up"></i> Upload Logo
              </button>
              <button type="button" class="btn btn-outline btn-sm" onclick="App.handleResetSettingFile('event_logo')" title="Reset ke Default Logo Jumbara" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; padding: 0.5rem 0.6rem; color: #64748b; border: 1px solid #cbd5e1; font-size: 0.82rem; border-radius: 6px; background: white;">
                <i class="fa-solid fa-rotate-left"></i> Reset
              </button>
            </div>
          </div>

          <!-- Box 3: Favicon Tab Browser -->
          <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 10px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <h5 style="color: var(--secondary); font-size: 0.92rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.4rem;">
                  <i class="fa-solid fa-window-maximize" style="color: #059669;"></i> Favicon Tab Browser
                </h5>
                <span style="font-size: 0.7rem; background: #d1fae5; color: #065f46; padding: 2px 7px; border-radius: 4px; font-weight: 700;">PNG / ICO / JPG</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0.85rem; background: #f8fafc; padding: 0.75rem; border-radius: 8px; border: 1px dashed #cbd5e1;">
                <img id="faviconPreviewImg" src="${s.app_favicon || 'frontend/favicon.svg'}" alt="Preview Favicon" style="width: 38px; height: 38px; object-fit: contain; background: white; padding: 3px; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <div style="overflow: hidden; flex: 1;">
                  <small style="color: #64748b; font-size: 0.72rem; display: block; font-weight: 600;">Favicon Aktif:</small>
                  <code style="font-size: 0.75rem; word-break: break-all; color: #334155;">${Utils.escapeHtml(s.app_favicon || 'frontend/favicon.svg')}</code>
                </div>
              </div>
              <div class="form-group" style="margin-bottom: 0.85rem;">
                <label style="font-size: 0.78rem; font-weight: 600; color: #475569; display: block; margin-bottom: 0.3rem;">Pilih Favicon Baru (PNG / ICO / JPG):</label>
                <input type="file" id="faviconFileInput" accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp,image/svg+xml" onchange="App.handlePreviewSettingFile('favicon', this)" style="font-size: 0.82rem; width: 100%;">
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
              <button type="button" class="btn btn-primary btn-sm" onclick="App.handleUploadFile('favicon')" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.5rem 0.6rem; font-weight: 600; font-size: 0.82rem; border-radius: 6px;">
                <i class="fa-solid fa-cloud-arrow-up"></i> Upload Favicon
              </button>
              <button type="button" class="btn btn-outline btn-sm" onclick="App.handleResetSettingFile('favicon')" title="Reset ke Default Favicon" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; padding: 0.5rem 0.6rem; color: #64748b; border: 1px solid #cbd5e1; font-size: 0.82rem; border-radius: 6px; background: white;">
                <i class="fa-solid fa-rotate-left"></i> Reset
              </button>
            </div>
          </div>

          <!-- Box 4: Kop Surat Gambar -->
          <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 10px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <h5 style="color: var(--secondary); font-size: 0.92rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.4rem;">
                  <i class="fa-solid fa-file-invoice" style="color: #d97706;"></i> Gambar Kop Surat
                </h5>
                <span style="font-size: 0.7rem; background: #fef3c7; color: #92400e; padding: 2px 7px; border-radius: 4px; font-weight: 700;">JPG / PNG</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0.85rem; background: #f8fafc; padding: 0.75rem; border-radius: 8px; border: 1px dashed #cbd5e1;">
                <img id="kopPreviewImg" src="${s.app_kop || s.app_logo || 'frontend/images/logo-pmi.svg'}" alt="Preview Kop Surat" style="height: 48px; max-width: 110px; object-fit: contain; background: white; padding: 3px; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <div style="overflow: hidden; flex: 1;">
                  <small style="color: #64748b; font-size: 0.72rem; display: block; font-weight: 600;">Kop Surat Aktif:</small>
                  <code style="font-size: 0.75rem; word-break: break-all; color: #334155;">${s.app_kop ? Utils.escapeHtml(s.app_kop) : '(Teks Kop Default)'}</code>
                </div>
              </div>
              <div class="form-group" style="margin-bottom: 0.85rem;">
                <label style="font-size: 0.78rem; font-weight: 600; color: #475569; display: block; margin-bottom: 0.3rem;">Pilih File Kop Surat (JPG / PNG):</label>
                <input type="file" id="kopFileInput" accept="image/jpeg,image/png,image/webp,image/svg+xml" onchange="App.handlePreviewSettingFile('kop', this)" style="font-size: 0.82rem; width: 100%;">
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
              <button type="button" class="btn btn-primary btn-sm" onclick="App.handleUploadFile('kop')" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.5rem 0.6rem; font-weight: 600; font-size: 0.82rem; border-radius: 6px;">
                <i class="fa-solid fa-cloud-arrow-up"></i> Upload Kop
              </button>
              <button type="button" class="btn btn-outline btn-sm" onclick="App.handleResetSettingFile('kop')" title="Reset ke Default Text Kop" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; padding: 0.5rem 0.6rem; color: #64748b; border: 1px solid #cbd5e1; font-size: 0.82rem; border-radius: 6px; background: white;">
                <i class="fa-solid fa-rotate-left"></i> Reset
              </button>
            </div>
          </div>

        </div>

        <hr style="border: 0; border-top: 1px dashed var(--border-color); margin-bottom: 1.5rem;">

        <!-- Section 4: Text Form Settings -->
        <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
          <h4 style="color: var(--secondary); font-size: 1.05rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem;">
            <i class="fa-solid fa-sliders" style="color: var(--primary);"></i> Pengaturan Header, Footer & Informasi Penyelenggara
          </h4>

          <form id="settingsForm" onsubmit="App.handleSaveSettings(event)">
            
            <!-- Sub-group 1: Header & Kontak Top-Bar -->
            <div style="margin-bottom: 1.75rem;">
              <h5 style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 0.9rem; display: flex; align-items: center; gap: 0.4rem;">
                <i class="fa-solid fa-window-maximize" style="color: #0284c7;"></i> 1. Pengaturan Header & Top-Bar Website
              </h5>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.2rem;">
                <div class="form-group">
                  <label class="form-label">Nama Aplikasi & Kegiatan *</label>
                  <input type="text" id="setAppName" value="${Utils.escapeHtml(s.app_name)}" required style="width: 100%;">
                  <span class="form-help">Ditampilkan pada title browser, navbar brand, dan header</span>
                </div>

                <div class="form-group">
                  <label class="form-label">Organisasi Penyelenggara *</label>
                  <input type="text" id="setOrganizerName" value="${Utils.escapeHtml(s.organizer_name)}" required style="width: 100%;">
                  <span class="form-help">Sub-judul organisasi di bawah nama aplikasi navbar</span>
                </div>

                <div class="form-group">
                  <label class="form-label">Lokasi Buperta / Venue Kegiatan *</label>
                  <input type="text" id="setEventLocation" value="${Utils.escapeHtml(s.event_location || 'Buperta Utama PMI Kabupaten')}" required style="width: 100%;">
                  <span class="form-help">Ditampilkan pada Top-Bar Header paling atas</span>
                </div>

                <div class="form-group">
                  <label class="form-label">Tanggal Pelaksanaan Kegiatan *</label>
                  <input type="text" id="setEventDates" value="${Utils.escapeHtml(s.event_dates)}" required style="width: 100%;">
                  <span class="form-help">Contoh: 15 - 17 Oktober 2026</span>
                </div>

                <div class="form-group">
                  <label class="form-label">Nomor Telepon Kontak Resmi *</label>
                  <input type="text" id="setContactPhone" value="${Utils.escapeHtml(s.contact_phone || '(021) 555-PMR-2026')}" required style="width: 100%;">
                  <span class="form-help">Ditampilkan di Top-Bar Header dan Kolom Footer</span>
                </div>

                <div class="form-group">
                  <label class="form-label">Email Resmi Sekretariat *</label>
                  <input type="email" id="setContactEmail" value="${Utils.escapeHtml(s.contact_email || 'sekretariat@jumbara-pmi.or.id')}" required style="width: 100%;">
                  <span class="form-help">Ditampilkan di Top-Bar Header dan Kolom Footer</span>
                </div>
              </div>
            </div>

            <!-- Sub-group 2: Footer & Sekretariat PMI -->
            <div style="margin-bottom: 1.75rem; border-top: 1px dashed #e2e8f0; padding-top: 1.25rem;">
              <h5 style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 0.9rem; display: flex; align-items: center; gap: 0.4rem;">
                <i class="fa-solid fa-shoe-prints" style="color: #059669;"></i> 2. Pengaturan Footer Website & Markas PMI
              </h5>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.2rem;">
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label class="form-label">Deskripsi Singkat / Tentang di Footer *</label>
                  <textarea id="setFooterAbout" rows="2" required style="width: 100%; resize: vertical;">${Utils.escapeHtml(s.footer_about || 'Ajang evaluasi dan pembinaan generasi muda Palang Merah Remaja (Mula, Madya, Wira) dalam mewujudkan Tri Bakti PMR.')}</textarea>
                  <span class="form-help">Penjelasan profil kegiatan di kolom kiri bawah footer</span>
                </div>

                <div class="form-group" style="grid-column: 1 / -1;">
                  <label class="form-label">Alamat Lengkap Markas / Sekretariat PMI *</label>
                  <input type="text" id="setContactAddress" value="${Utils.escapeHtml(s.contact_address || 'Jl. Palang Merah No. 1, Markas PMI Kabupaten')}" required style="width: 100%;">
                </div>

                <div class="form-group">
                  <label class="form-label">Jam Layanan / Operasional Sekretariat</label>
                  <input type="text" id="setContactHours" value="${Utils.escapeHtml(s.contact_hours || 'Senin - Jumat: 08.00 - 16.00 WIB')}" placeholder="Senin - Jumat: 08.00 - 16.00 WIB" style="width: 100%;">
                </div>

                <div class="form-group">
                  <label class="form-label">Nomor WhatsApp Hotline / Panitia</label>
                  <input type="text" id="setContactWa" value="${Utils.escapeHtml(s.contact_wa || '081234567890')}" placeholder="081234567890" style="width: 100%;">
                </div>

                <div class="form-group" style="grid-column: 1 / -1;">
                  <label class="form-label">Teks Hak Cipta / Copyright Footer *</label>
                  <input type="text" id="setFooterCopyright" value="${Utils.escapeHtml(s.footer_copyright || '© 2026 Palang Merah Indonesia Kabupaten. Structured Native PHP & MySQL Application.')}" required style="width: 100%;">
                </div>
              </div>
            </div>

            <!-- Sub-group 3: Lokasi & Google Maps Embed -->
            <div style="margin-bottom: 1.75rem; border-top: 1px dashed #e2e8f0; padding-top: 1.25rem;">
              <h5 style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 0.9rem; display: flex; align-items: center; gap: 0.4rem;">
                <i class="fa-solid fa-map-location-dot" style="color: #dc2626;"></i> 3. Pengaturan Lokasi & Google Maps Interaktif
              </h5>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.2rem;">
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label class="form-label">Alamat Lengkap Venue / Buperta Kegiatan *</label>
                  <input type="text" id="setEventLocationAddress" value="${Utils.escapeHtml(s.event_location_address || s.contact_address || 'Markas PMI Kabupaten Pemalang, Jl. Gatot Subroto No. 23, Bojongbata, Pemalang')}" required style="width: 100%;">
                  <span class="form-help">Alamat detail yang ditampilkan pada kartu info lokasi dan saat pengguna menekan tombol "Salin Alamat".</span>
                </div>

                <div class="form-group" style="grid-column: 1 / -1;">
                  <label class="form-label">URL Embed Google Maps (iframe src) *</label>
                  <input type="url" id="setEventMapEmbed" value="${Utils.escapeHtml(s.event_map_embed || 'https://maps.google.com/maps?q=Markas+PMI+Kabupaten+Pemalang&t=&z=15&ie=UTF8&iwloc=&output=embed')}" required style="width: 100%;">
                  <span class="form-help">URL Google Maps interaktif (format embed). Contoh: <code>https://maps.google.com/maps?q=Markas+PMI+Kabupaten+Pemalang&t=&z=15&ie=UTF8&iwloc=&output=embed</code></span>
                </div>

                <div class="form-group" style="grid-column: 1 / -1;">
                  <label class="form-label">URL Petunjuk Arah Langsung Google Maps *</label>
                  <input type="url" id="setEventMapUrl" value="${Utils.escapeHtml(s.event_map_url || 'https://maps.google.com/?q=Markas+PMI+Kabupaten+Pemalang')}" required style="width: 100%;">
                  <span class="form-help">Tautan langsung ke Google Maps saat tombol "Buka Petunjuk Arah" ditekan. Contoh: <code>https://maps.google.com/?q=Markas+PMI+Kabupaten+Pemalang</code></span>
                </div>
              </div>
            </div>

            <!-- Sub-group 4: Banner Hero Homepage -->
            <div style="margin-bottom: 1.75rem; border-top: 1px dashed #e2e8f0; padding-top: 1.25rem;">
              <h5 style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 0.9rem; display: flex; align-items: center; gap: 0.4rem;">
                <i class="fa-solid fa-heading" style="color: #d97706;"></i> 4. Teks Banner Jumbotron Hero Homepage
              </h5>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label">Judul Utama Jumbotron *</label>
                <input type="text" id="setJumbotronTitle" value="${Utils.escapeHtml(s.jumbotron_title)}" required style="width: 100%;">
              </div>

              <div class="form-group">
                <label class="form-label">Sub-Judul Jumbotron *</label>
                <textarea id="setJumbotronSubtitle" rows="2" required style="width: 100%; resize: vertical;">${Utils.escapeHtml(s.jumbotron_subtitle)}</textarea>
              </div>
            </div>

            <!-- Sub-group 4: Jalur File Aset (Advanced Path Links) -->
            <details style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.8rem 1rem; margin-bottom: 1.5rem;">
              <summary style="font-weight: 600; font-size: 0.85rem; color: #475569; cursor: pointer; user-select: none;">
                <i class="fa-solid fa-link" style="margin-right: 0.4rem; color: #64748b;"></i> Jalur / URL File Aset Database MySQL (Opsional)
              </summary>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-top: 0.8rem;">
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem;">Path Logo Utama (PMI)</label>
                  <input type="text" id="setAppLogo" value="${Utils.escapeHtml(s.app_logo || '')}" placeholder="contoh: uploads/logo_pmi.png atau .jpg" style="font-size: 0.82rem;">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem;">Path Logo Kegiatan Jumbara</label>
                  <input type="text" id="setEventLogo" value="${Utils.escapeHtml(s.event_logo || '')}" placeholder="contoh: frontend/images/logo-jumbara-xii.png atau .jpg" style="font-size: 0.82rem;">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem;">Path Favicon Tab Browser</label>
                  <input type="text" id="setAppFavicon" value="${Utils.escapeHtml(s.app_favicon || '')}" placeholder="contoh: frontend/favicon.png atau .ico" style="font-size: 0.82rem;">
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label class="form-label" style="font-size: 0.8rem;">Path Gambar Kop Surat</label>
                  <input type="text" id="setAppKop" value="${Utils.escapeHtml(s.app_kop || '')}" placeholder="contoh: uploads/kop_surat.jpg atau .png" style="font-size: 0.82rem;">
                </div>
              </div>
            </details>

            <div style="display: flex; justify-content: flex-end; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 1.25rem; margin-top: 1rem;">
              <button type="submit" class="btn btn-primary" style="padding: 0.65rem 2rem; font-size: 0.95rem; font-weight: 700; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);">
                <i class="fa-solid fa-floppy-disk"></i> Simpan Seluruh Pengaturan
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  async handleUploadJumbotronBanner() {
    const fileInput = document.getElementById('jumbotronFileInput');
    if (!fileInput || !fileInput.files.length) {
      return Utils.showToast('Pilih gambar banner Jumbotron dari komputer Anda terlebih dahulu.', 'warning');
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Data = e.target.result;
        const res = await API.uploadJumbotronImage(base64Data);
        Utils.showToast(res.message, 'success');
        await this.loadSettings();
        const main = document.getElementById('mainContainer');
        if (main && this.currentUser && this.currentUser.role === 'kabupaten') {
          this.renderAdminKabupatenPortal(main);
        }
      } catch (err) {
        Utils.showToast(err.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  },

  async removeJumbotronImage(index) {
    let heroImgs = [];
    try {
      heroImgs = typeof this.appSettings.jumbotron_images === 'string' ? JSON.parse(this.appSettings.jumbotron_images) : this.appSettings.jumbotron_images;
    } catch (e) {
      heroImgs = [];
    }
    if (!Array.isArray(heroImgs) || heroImgs.length <= 1) {
      return Utils.showToast('Minimal harus ada 1 gambar banner Jumbotron.', 'warning');
    }

    heroImgs.splice(index, 1);
    try {
      await API.updateSettings({ jumbotron_images: JSON.stringify(heroImgs) });
      Utils.showToast('Gambar banner Jumbotron berhasil dihapus.', 'info');
      await this.loadSettings();
      const main = document.getElementById('mainContainer');
      if (main && this.currentUser && this.currentUser.role === 'kabupaten') {
        this.renderAdminKabupatenPortal(main);
      }
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  handlePreviewSettingFile(type, inputElement) {
    if (!inputElement || !inputElement.files || !inputElement.files[0]) return;
    const file = inputElement.files[0];
    const previewMap = {
      'logo': 'logoPreviewImg',
      'event_logo': 'eventLogoPreviewImg',
      'favicon': 'faviconPreviewImg',
      'kop': 'kopPreviewImg'
    };
    const imgId = previewMap[type];
    const imgEl = document.getElementById(imgId);
    if (imgEl && (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp|ico|svg)$/i))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imgEl.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  },

  async handleUploadFile(type) {
    let inputId = 'faviconFileInput';
    if (type === 'logo') inputId = 'logoFileInput';
    else if (type === 'event_logo' || type === 'jumbara_logo' || type === 'logo_jumbara') inputId = 'eventLogoFileInput';
    else if (type === 'kop' || type === 'app_kop') inputId = 'kopFileInput';
    const fileInput = document.getElementById(inputId);
    if (!fileInput) return;

    if (!fileInput.files.length) {
      fileInput.click();
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Data = e.target.result;
        const res = await API.uploadSettingFile(type, base64Data);
        Utils.showToast(res.message, 'success');
        await this.loadSettings();
        if (type === 'logo' && document.getElementById('setAppLogo')) {
          document.getElementById('setAppLogo').value = res.url;
        } else if (type === 'event_logo' && document.getElementById('setEventLogo')) {
          document.getElementById('setEventLogo').value = res.url;
        } else if (type === 'favicon' && document.getElementById('setAppFavicon')) {
          document.getElementById('setAppFavicon').value = res.url;
        } else if (type === 'kop' && document.getElementById('setAppKop')) {
          document.getElementById('setAppKop').value = res.url;
        }
        const content = document.getElementById('adminTabContent');
        if (content) this.renderTabPengaturan(content);
      } catch (err) {
        Utils.showToast(err.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  },

  async handleDirectUpload(type, inputElement) {
    if (!inputElement || !inputElement.files || !inputElement.files.length) return;
    const file = inputElement.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Data = e.target.result;
        const res = await API.uploadSettingFile(type, base64Data);
        Utils.showToast(res.message, 'success');
        await this.loadSettings();
        if (type === 'logo' && document.getElementById('setAppLogo')) {
          document.getElementById('setAppLogo').value = res.url;
        } else if (type === 'event_logo' && document.getElementById('setEventLogo')) {
          document.getElementById('setEventLogo').value = res.url;
        } else if (type === 'favicon' && document.getElementById('setAppFavicon')) {
          document.getElementById('setAppFavicon').value = res.url;
        } else if (type === 'kop' && document.getElementById('setAppKop')) {
          document.getElementById('setAppKop').value = res.url;
        }
        const content = document.getElementById('adminTabContent');
        if (content) this.renderTabPengaturan(content);
      } catch (err) {
        Utils.showToast(err.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  },

  async handleResetSettingFile(type) {
    if (!confirm(`Apakah Anda yakin ingin mengembalikan gambar ${type} ke default?`)) return;
    try {
      const res = await API.resetSettingFile(type);
      Utils.showToast(res.message || 'File berhasil dikembalikan ke default!', 'success');
      await this.loadSettings();
      const content = document.getElementById('adminTabContent');
      if (content) this.renderTabPengaturan(content);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async handleSaveSettings(e) {
    e.preventDefault();
    const payload = {
      app_name: document.getElementById('setAppName').value.trim(),
      organizer_name: document.getElementById('setOrganizerName').value.trim(),
      event_location: document.getElementById('setEventLocation').value.trim(),
      event_location_address: document.getElementById('setEventLocationAddress')?.value.trim() || '',
      event_map_embed: document.getElementById('setEventMapEmbed')?.value.trim() || '',
      event_map_url: document.getElementById('setEventMapUrl')?.value.trim() || '',
      event_dates: document.getElementById('setEventDates').value.trim(),
      contact_phone: document.getElementById('setContactPhone').value.trim(),
      contact_email: document.getElementById('setContactEmail').value.trim(),
      footer_about: document.getElementById('setFooterAbout').value.trim(),
      contact_address: document.getElementById('setContactAddress').value.trim(),
      contact_hours: document.getElementById('setContactHours')?.value.trim() || '',
      contact_wa: document.getElementById('setContactWa')?.value.trim() || '',
      footer_copyright: document.getElementById('setFooterCopyright').value.trim(),
      app_logo: document.getElementById('setAppLogo')?.value.trim() || this.appSettings?.app_logo || 'frontend/images/logo-pmi.svg',
      event_logo: document.getElementById('setEventLogo')?.value.trim() || this.appSettings?.event_logo || 'frontend/images/logo-jumbara-xii.png',
      app_favicon: document.getElementById('setAppFavicon')?.value.trim() || this.appSettings?.app_favicon || 'frontend/favicon.svg',
      app_kop: document.getElementById('setAppKop')?.value.trim() || this.appSettings?.app_kop || '',
      jumbotron_title: document.getElementById('setJumbotronTitle').value.trim(),
      jumbotron_subtitle: document.getElementById('setJumbotronSubtitle').value.trim(),
      reg_deadline: document.getElementById('setRegDeadline').value,
      reg_active: document.getElementById('setRegActive').value
    };

    try {
      const res = await API.updateSettings(payload);
      Utils.showToast(res.message, 'success');
      await this.loadSettings();
      const content = document.getElementById('adminTabContent');
      if (content) this.renderTabPengaturan(content);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  // --- TAB USERS: KELOLA AKUN USER & RESET PASSWORD ---
  async renderTabUsers(container) {
    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <h3 class="panel-title">${Icons.settings(20, 'var(--primary)')} Kelola Akun Pengguna & Reset Password User</h3>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
            <select id="filterUserRole" style="width: auto;" onchange="App.loadUsers(1)">
              <option value="">Semua Peran / Role</option>
              <option value="kabupaten">Admin PMI Kabupaten</option>
              <option value="penilai">Penilai / Dewan Juri</option>
              <option value="unit">Admin Unit Sekolah</option>
              <option value="peserta">Peserta PMR</option>
              <option value="panitia">Panitia Pelaksana</option>
              <option value="peninjau">Peninjau</option>
              <option value="tamu">Tamu Undangan</option>
              <option value="media">Media / Pers</option>
            </select>
            <input type="text" id="filterUserSearch" placeholder="Cari username / email / unit..." style="width: 190px; padding: 0.4rem 0.6rem; font-size: 0.85rem; border: 1px solid var(--border-color); border-radius: 4px;" onkeyup="if(event.key==='Enter') App.loadUsers(1)">
            <button class="btn btn-outline btn-sm" onclick="App.loadUsers(1)"><i class="fa-solid fa-magnifying-glass"></i></button>
            <button class="btn btn-primary btn-sm" onclick="App.openAddUserModal()">
              <i class="fa-solid fa-user-plus"></i> Tambah User Baru
            </button>
          </div>
        </div>

        <div id="usersTableContainer">
          <p style="color: var(--text-muted);">Memuat daftar pengguna...</p>
        </div>
      </div>
    `;

    this.loadUsers(1);
  },

  async loadUsers(page = 1) {
    const container = document.getElementById('usersTableContainer');
    if (!container) return;

    const role = document.getElementById('filterUserRole')?.value || '';
    const search = document.getElementById('filterUserSearch')?.value || '';

    try {
      const res = await API.getUsers({ role, search, page, limit: 25 });
      const users = Array.isArray(res) ? res : (res.data || []);
      const pagination = res.pagination || null;

      if (!users.length) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 1rem 0;">Tidak ada akun pengguna yang ditemukan.</p>';
        return;
      }

      const getRoleBadge = (r) => {
        if (r === 'kabupaten') return '<span class="user-role-tag role-kabupaten"><i class="fa-solid fa-user-shield"></i> Admin Kab.</span>';
        if (r === 'penilai' || r === 'juri') return '<span class="user-role-tag" style="background:#e0e7ff; color:#3730a3; border:1px solid #c7d2fe; font-size:0.75rem; font-weight:700;"><i class="fa-solid fa-gavel"></i> Penilai / Juri</span>';
        if (r === 'unit') return '<span class="user-role-tag role-unit"><i class="fa-solid fa-school"></i> Admin Unit</span>';
        if (r === 'panitia') return '<span class="user-role-tag role-panitia"><i class="fa-solid fa-clipboard-user"></i> Panitia</span>';
        if (r === 'peninjau') return '<span class="user-role-tag role-peninjau">Peninjau</span>';
        if (r === 'tamu') return '<span class="user-role-tag role-tamu">Tamu</span>';
        if (r === 'media') return '<span class="user-role-tag role-media">Media</span>';
        return '<span class="user-role-tag role-peserta">Peserta</span>';
      };

      container.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Peran / Role</th>
                <th>Unit / Instansi</th>
                <th>Email</th>
                <th>Tgl Dibuat</th>
                <th>Aksi Kelola & Reset Password</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td>#${u.id}</td>
                  <td><strong>${Utils.escapeHtml(u.username)}</strong></td>
                  <td>${getRoleBadge(u.role)}</td>
                  <td>${u.unit_name ? Utils.escapeHtml(u.unit_name) : '<em style="color:#94a3b8;">- (Kabupaten/Umum)</em>'}</td>
                  <td>${u.email ? Utils.escapeHtml(u.email) : '<em style="color:#94a3b8;">-</em>'}</td>
                  <td>${Utils.formatDate(u.created_at)}</td>
                  <td>
                    <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                      <button class="btn btn-warning btn-sm" style="font-size: 0.78rem; padding: 0.3rem 0.6rem;" data-username="${Utils.escapeHtml(u.username)}" onclick="App.openResetPasswordModal(${u.id}, this.dataset.username)">
                        <i class="fa-solid fa-key"></i> Reset Password
                      </button>
                      <button class="btn btn-outline btn-sm" style="font-size: 0.78rem; padding: 0.3rem 0.6rem;" onclick="App.openEditUserModal(${JSON.stringify(u).replace(/"/g, '&quot;')})">
                        <i class="fa-solid fa-pen"></i> Edit
                      </button>
                      ${u.id !== this.currentUser?.id ? `
                        <button class="btn btn-danger btn-sm" style="font-size: 0.78rem; padding: 0.3rem 0.6rem;" data-username="${Utils.escapeHtml(u.username)}" onclick="App.handleDeleteUser(${u.id}, this.dataset.username)">
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${pagination && pagination.total_pages > 1 ? `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.85rem; color: var(--text-muted);">
              Menampilkan Halaman ${pagination.page} dari ${pagination.total_pages} (${pagination.total} total akun)
            </span>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-outline btn-sm" ${pagination.page <= 1 ? 'disabled' : ''} onclick="App.loadUsers(${pagination.page - 1})">
                &laquo; Prev
              </button>
              <button class="btn btn-outline btn-sm" ${pagination.page >= pagination.total_pages ? 'disabled' : ''} onclick="App.loadUsers(${pagination.page + 1})">
                Next &raquo;
              </button>
            </div>
          </div>
        ` : ''}
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: red; padding: 1rem 0;">Gagal memuat pengguna: ${err.message}</p>`;
    }
  },

  openResetPasswordModal(userId, username) {
    const modalHtml = `
      <div class="modal-backdrop active" id="resetPasswordModal">
        <div class="modal-card" style="max-width: 440px;">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0;"><i class="fa-solid fa-key" style="color: var(--primary);"></i> Reset Password User</h3>
            <button class="btn-close" onclick="document.getElementById('resetPasswordModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 1.25rem;">
            <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1rem;">
              Ganti password akun user <strong>${Utils.escapeHtml(username)}</strong> (ID #${userId}) secara langsung.
            </p>
            <form onsubmit="App.handleResetUserPasswordSubmit(event, ${userId})">
              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Password Baru <span style="color: red;">*</span></label>
                <input type="password" id="admin_new_password" required minlength="6" placeholder="Masukkan password baru (min 6 karakter)" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('resetPasswordModal').remove()">Batal</button>
                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Simpan Password Baru</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('#resetPasswordModal').forEach(el => el.remove());
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async handleResetUserPasswordSubmit(e, userId) {
    e.preventDefault();
    const newPassword = document.getElementById('admin_new_password')?.value;
    if (!newPassword || newPassword.length < 6) {
      Utils.showToast('Password baru minimal 6 karakter!', 'error');
      return;
    }

    try {
      const res = await API.resetUserPassword(userId, newPassword);
      Utils.showToast(res.message || 'Password user berhasil di-reset!', 'success');
      document.getElementById('resetPasswordModal')?.remove();
    } catch (err) {
      Utils.showToast('Gagal reset password: ' + err.message, 'error');
    }
  },

  async openAddUserModal() {
    if (!this.cachedUnits || !this.cachedUnits.length) {
      try {
        this.cachedUnits = await API.getUnits();
      } catch (e) {
        console.error(e);
      }
    }
    const unitsOptions = (this.cachedUnits || []).map(u => `<option value="${u.id}">${Utils.escapeHtml(u.name)}</option>`).join('');

    const modalHtml = `
      <div class="modal-backdrop active" id="userFormModal" style="display: flex !important; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); z-index: 99999; opacity: 1; visibility: visible;">
        <div class="modal-card" style="max-width: 500px; width: 92%; background: #ffffff; border-radius: 8px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); overflow: hidden; margin: auto;">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0; color: #0f172a;"><i class="fa-solid fa-user-plus" style="color: var(--primary);"></i> Tambah Pengguna / Akun Baru</h3>
            <button class="btn-close" type="button" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #64748b;" onclick="document.getElementById('userFormModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 1.25rem;">
            <form onsubmit="App.handleCreateUserSubmit(event)">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Username <span style="color: red;">*</span></label>
                <input type="text" id="u_username" required placeholder="Contoh: juri_pertolongan_pertama" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Password Initial <span style="color: red;">*</span></label>
                <input type="password" id="u_password" required minlength="6" placeholder="Minimal 6 karakter" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Peran / Role <span style="color: red;">*</span></label>
                <select id="u_role" required style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
                  <option value="penilai" selected>Penilai / Dewan Juri</option>
                  <option value="kabupaten">Admin PMI Kabupaten</option>
                  <option value="unit">Admin Unit Sekolah</option>
                  <option value="panitia">Panitia Pelaksana</option>
                  <option value="peserta">Peserta PMR</option>
                  <option value="peninjau">Peninjau</option>
                  <option value="tamu">Tamu Undangan</option>
                  <option value="media">Media / Pers</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Unit Sekolah / Kontingen</label>
                <select id="u_unit_id" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
                  <option value="">- Tidak Ada (Pengurus/Umum/Juri) -</option>
                  ${unitsOptions}
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Email</label>
                <input type="email" id="u_email" placeholder="email@domain.com" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('userFormModal').remove()">Batal</button>
                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Buat Akun Baru</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('#userFormModal').forEach(el => el.remove());
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async handleCreateUserSubmit(e) {
    e.preventDefault();
    const payload = {
      username: document.getElementById('u_username')?.value.trim(),
      password: document.getElementById('u_password')?.value.trim(),
      role: document.getElementById('u_role')?.value,
      unit_id: document.getElementById('u_unit_id')?.value || null,
      email: document.getElementById('u_email')?.value.trim()
    };

    try {
      const res = await API.createUser(payload);
      Utils.showToast(res.message, 'success');
      document.getElementById('userFormModal')?.remove();
      this.loadUsers(1);
    } catch (err) {
      Utils.showToast('Gagal membuat user: ' + err.message, 'error');
    }
  },

  openEditUserModal(user) {
    const unitsOptions = (this.cachedUnits || []).map(u => `
      <option value="${u.id}" ${user.unit_id == u.id ? 'selected' : ''}>${Utils.escapeHtml(u.name)}</option>
    `).join('');

    const modalHtml = `
      <div class="modal-backdrop active" id="userFormModal">
        <div class="modal-card" style="max-width: 500px;">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0;"><i class="fa-solid fa-pen" style="color: var(--primary);"></i> Edit Data User: ${Utils.escapeHtml(user.username)}</h3>
            <button class="btn-close" onclick="document.getElementById('userFormModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 1.25rem;">
            <form onsubmit="App.handleUpdateUserSubmit(event, ${user.id})">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Username</label>
                <input type="text" value="${Utils.escapeHtml(user.username)}" disabled style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px; background: #f1f5f9;">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Peran / Role <span style="color: red;">*</span></label>
                <select id="ue_role" required style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
                  <option value="kabupaten" ${user.role === 'kabupaten' ? 'selected' : ''}>Admin PMI Kabupaten</option>
                  <option value="penilai" ${user.role === 'penilai' || user.role === 'juri' ? 'selected' : ''}>Penilai / Dewan Juri</option>
                  <option value="unit" ${user.role === 'unit' ? 'selected' : ''}>Admin Unit Sekolah</option>
                  <option value="panitia" ${user.role === 'panitia' ? 'selected' : ''}>Panitia Pelaksana</option>
                  <option value="peserta" ${user.role === 'peserta' ? 'selected' : ''}>Peserta PMR</option>
                  <option value="peninjau" ${user.role === 'peninjau' ? 'selected' : ''}>Peninjau</option>
                  <option value="tamu" ${user.role === 'tamu' ? 'selected' : ''}>Tamu Undangan</option>
                  <option value="media" ${user.role === 'media' ? 'selected' : ''}>Media / Pers</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Unit Sekolah / Kontingen</label>
                <select id="ue_unit_id" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
                  <option value="">- Tidak Ada (Pengurus/Umum) -</option>
                  ${unitsOptions}
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Email</label>
                <input type="email" id="ue_email" value="${Utils.escapeHtml(user.email || '')}" placeholder="email@domain.com" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('userFormModal').remove()">Batal</button>
                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('#userFormModal').forEach(el => el.remove());
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async handleUpdateUserSubmit(e, userId) {
    e.preventDefault();
    const payload = {
      user_id: userId,
      role: document.getElementById('ue_role')?.value,
      unit_id: document.getElementById('ue_unit_id')?.value || null,
      email: document.getElementById('ue_email')?.value.trim()
    };

    try {
      const res = await API.updateUser(payload);
      Utils.showToast(res.message, 'success');
      document.getElementById('userFormModal')?.remove();
      this.loadUsers(1);
    } catch (err) {
      Utils.showToast('Gagal memperbarui user: ' + err.message, 'error');
    }
  },

  async handleDeleteUser(userId, username) {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun user '${username}' (ID #${userId})?`)) return;

    try {
      const res = await API.deleteUser(userId);
      Utils.showToast(res.message, 'success');
      this.loadUsers(1);
    } catch (err) {
      Utils.showToast('Gagal menghapus user: ' + err.message, 'error');
    }
  },

  // --- TAB MENU: PENGATURAN STRUKTUR & VISIBILITAS MENU ---
  async renderTabMenu(container) {
    const struct = this.getMenuStructure();
    const categories = struct.categories || [];
    const items = struct.items || [];

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 class="panel-title" style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-list-check" style="color: var(--primary);"></i> Kelola Menu Utama & Sub-Menu Sistem
            </h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.35rem;">
              Buat, edit, hapus menu utama/sub-menu, atur penempatan grup, serta atur status aktif/non-aktif menu.
            </p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="App.openCategoryModal()">
              <i class="fa-solid fa-folder-plus"></i> + Tambah Menu Utama
            </button>
            <button class="btn btn-success btn-sm" style="background: #059669; color: #fff; border-color: #059669;" onclick="App.openSubMenuModal()">
              <i class="fa-solid fa-plus-circle"></i> + Tambah Sub-Menu
            </button>
            <button class="btn btn-outline btn-sm" onclick="App.resetMenuSettings()">
              <i class="fa-solid fa-rotate-left"></i> Reset ke Default
            </button>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1rem;">
          ${categories.map(cat => {
      const assignedItems = items.filter(t => t.category === cat.id);
      const isSystemCategory = ['peserta', 'agenda', 'penilaian', 'pengaturan'].includes(cat.id);

      return `
              <div style="border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden; background: #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.03);">
                <!-- Category Header -->
                <div style="background: ${cat.bg || '#f8fafc'}; border-bottom: 1px solid var(--border-color); padding: 0.85rem 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
                  <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <i class="${cat.icon || 'fa-solid fa-folder'}" style="font-size: 1.1rem; color: ${cat.color || 'var(--primary)'};"></i>
                    <h4 style="font-size: 1.05rem; font-weight: 800; color: ${cat.color || '#1e293b'}; margin: 0;">
                      ${Utils.escapeHtml(cat.label)}
                    </h4>
                    <span style="font-size: 0.78rem; font-weight: 700; background: #ffffff; color: ${cat.color || 'var(--primary)'}; padding: 0.2rem 0.65rem; border-radius: 12px; border: 1px solid var(--border-color);">
                      ${assignedItems.length} Sub-Menu
                    </span>
                  </div>

                  <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <button class="btn btn-outline btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.78rem;" onclick="App.openCategoryModal('${cat.id}')">
                      <i class="fa-solid fa-pen"></i> Edit Grup
                    </button>
                    ${!isSystemCategory && assignedItems.length === 0 ? `
                      <button class="btn btn-danger btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.78rem;" onclick="App.handleDeleteCategory('${cat.id}')">
                        <i class="fa-solid fa-trash"></i> Hapus Grup
                      </button>
                    ` : ''}
                  </div>
                </div>

                <!-- Sub-Menu Items List -->
                <div style="padding: 1.25rem;">
                  ${assignedItems.length === 0 ? `
                    <p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; margin: 0; padding: 1rem 0;">
                      <em>(Belum ada sub-menu yang ditempatkan di kelompok menu ini)</em>
                    </p>
                  ` : `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem;">
                      ${assignedItems.map(t => {
        const isEnabled = t.enabled !== false;
        const isRequired = t.isRequired === true;

        return `
                          <div style="background: ${isEnabled ? '#ffffff' : '#f8fafc'}; border: 1px solid ${isEnabled ? '#cbd5e1' : '#e2e8f0'}; border-radius: 8px; padding: 1rem; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; gap: 0.5rem;">
                              <div style="display: flex; align-items: center; gap: 0.55rem; min-width: 0;">
                                <i class="${t.icon || 'fa-solid fa-list'}" style="color: ${isEnabled ? 'var(--primary)' : '#94a3b8'}; font-size: 1.1rem; flex-shrink: 0;"></i>
                                <div style="min-width: 0;">
                                  <strong style="font-size: 0.92rem; color: ${isEnabled ? '#0f172a' : '#64748b'}; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${Utils.escapeHtml(t.label)}
                                  </strong>
                                  <small style="font-size: 0.72rem; color: #94a3b8;">${t.isSystem ? 'Sistem' : 'Sub-Menu Kustom'}</small>
                                </div>
                              </div>

                              <!-- Clear Green / Gray Toggle Status Button -->
                              ${isRequired ? `
                                <span class="badge badge-success" style="font-size: 0.75rem; padding: 0.35rem 0.65rem; background: #059669; color: #fff;">
                                  🟢 Wajib Aktif
                                </span>
                              ` : `
                                <button type="button" class="btn btn-sm ${isEnabled ? 'btn-success' : 'btn-outline'}" 
                                  style="${isEnabled ? 'background: #059669; color: #ffffff; border-color: #059669;' : 'background: #f1f5f9; color: #64748b; border-color: #cbd5e1;'} font-size: 0.78rem; padding: 0.3rem 0.65rem; font-weight: 700; white-space: nowrap;" 
                                  onclick="App.toggleSubMenuStatus('${t.id}')">
                                  ${isEnabled ? '🟢 Aktif' : '⚪ Non-Aktif'}
                                </button>
                              `}
                            </div>

                            <!-- Controls: Move category & Edit/Delete -->
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; background: #f8fafc; padding: 0.4rem 0.6rem; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 0.5rem;">
                              <div style="display: flex; align-items: center; gap: 0.4rem; flex: 1; min-width: 0;">
                                <label style="font-size: 0.76rem; font-weight: 600; color: #475569; white-space: nowrap;">Ke Grup:</label>
                                <select onchange="App.moveSubMenuCategory('${t.id}', this.value)" style="font-size: 0.78rem; padding: 0.2rem 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; width: 100%; background: #ffffff;">
                                  ${categories.map(c => `
                                    <option value="${c.id}" ${c.id === t.category ? 'selected' : ''}>${Utils.escapeHtml(c.label)}</option>
                                  `).join('')}
                                </select>
                              </div>

                              <div style="display: flex; gap: 0.25rem;">
                                <button type="button" class="btn btn-outline btn-sm" style="padding: 0.2rem 0.45rem; font-size: 0.75rem;" title="Edit Sub-Menu" onclick="App.openSubMenuModal('${t.id}')">
                                  <i class="fa-solid fa-pen"></i>
                                </button>
                                ${!t.isSystem ? `
                                  <button type="button" class="btn btn-danger btn-sm" style="padding: 0.2rem 0.45rem; font-size: 0.75rem;" title="Hapus Sub-Menu" onclick="App.handleDeleteSubMenu('${t.id}')">
                                    <i class="fa-solid fa-trash"></i>
                                  </button>
                                ` : ''}
                              </div>
                            </div>
                          </div>
                        `;
      }).join('')}
                    </div>
                  `}
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  },

  async toggleSubMenuStatus(itemId) {
    const struct = this.getMenuStructure();
    const item = struct.items.find(i => i.id === itemId);
    if (!item) return;
    if (item.isRequired) {
      Utils.showToast('Sub-menu ini wajib aktif untuk keperluan administrasi sistem.', 'warning');
      return;
    }
    item.enabled = !item.enabled;
    try {
      await this.saveMenuStructure(struct);
      Utils.showToast(`Sub-menu '${item.label}' ${item.enabled ? 'diaktifkan 🟢' : 'dinonaktifkan ⚪'}`, 'info');
      const content = document.getElementById('adminTabContent');
      if (content) this.renderTabMenu(content);
      if (this.activeCategory) this.switchAdminCategory(this.activeCategory, this.activeTab);
    } catch (err) {
      Utils.showToast('Gagal mengubah status: ' + err.message, 'error');
    }
  },

  async moveSubMenuCategory(itemId, newCategory) {
    const struct = this.getMenuStructure();
    const item = struct.items.find(i => i.id === itemId);
    if (!item) return;
    item.category = newCategory;
    try {
      await this.saveMenuStructure(struct);
      Utils.showToast(`Sub-menu '${item.label}' dipindahkan ke grup baru!`, 'success');
      const content = document.getElementById('adminTabContent');
      if (content) this.renderTabMenu(content);
      if (this.activeCategory) this.switchAdminCategory(this.activeCategory, this.activeTab);
    } catch (err) {
      Utils.showToast('Gagal memindahkan sub-menu: ' + err.message, 'error');
    }
  },

  async saveMenuStructure(struct) {
    const jsonStr = JSON.stringify(struct);
    await API.updateSettings({
      menu_config: jsonStr,
      menu_settings: jsonStr
    });
    if (!this.appSettings) this.appSettings = {};
    this.appSettings.menu_config = jsonStr;
    this.appSettings.menu_settings = jsonStr;
  },

  async resetMenuSettings() {
    if (!confirm('Kembalikan semua penempatan menu dan sub-menu ke struktur default?')) return;
    try {
      const defaultStruct = this.getDefaultMenuStructure();
      await this.saveMenuStructure(defaultStruct);
      Utils.showToast('Struktur menu berhasil dikembalikan ke default!', 'success');
      if (this.activeCategory) {
        this.switchAdminCategory(this.activeCategory, this.activeTab);
      }
      const content = document.getElementById('adminTabContent');
      if (content) this.renderTabMenu(content);
    } catch (err) {
      Utils.showToast('Gagal reset menu: ' + err.message, 'error');
    }
  },

  openCategoryModal(catId = null) {
    const struct = this.getMenuStructure();
    const cat = catId ? struct.categories.find(c => c.id === catId) : null;
    const isEdit = !!cat;

    const modalHtml = `
      <div class="modal-backdrop active" id="categoryFormModal">
        <div class="modal-card" style="max-width: 460px;">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0;">
              <i class="fa-solid fa-folder-plus" style="color: var(--primary);"></i> ${isEdit ? 'Edit Menu Utama (Grup)' : 'Tambah Menu Utama Baru'}
            </h3>
            <button class="btn-close" onclick="document.getElementById('categoryFormModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 1.25rem;">
            <form onsubmit="App.handleSaveCategorySubmit(event, '${catId || ''}')">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Nama Menu Utama <span style="color: red;">*</span></label>
                <input type="text" id="cat_label" required value="${isEdit ? Utils.escapeHtml(cat.label) : ''}" placeholder="Contoh: Fasilitas & Akomodasi" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
              </div>
              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Ikon FontAwesome</label>
                <input type="text" id="cat_icon" value="${isEdit ? Utils.escapeHtml(cat.icon || '') : 'fa-solid fa-folder'}" placeholder="fa-solid fa-building" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
                <small style="color: #64748b; font-size: 0.75rem;">Gunakan class icon FontAwesome (contoh: <code>fa-solid fa-building</code>)</small>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('categoryFormModal').remove()">Batal</button>
                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Simpan Menu Utama</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('#categoryFormModal').forEach(el => el.remove());
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async handleSaveCategorySubmit(e, catId) {
    e.preventDefault();
    const label = document.getElementById('cat_label')?.value.trim();
    const icon = document.getElementById('cat_icon')?.value.trim() || 'fa-solid fa-folder';

    if (!label) return Utils.showToast('Nama Menu Utama wajib diisi!', 'error');

    const struct = this.getMenuStructure();
    if (catId) {
      const cat = struct.categories.find(c => c.id === catId);
      if (cat) {
        cat.label = label;
        cat.icon = icon;
      }
    } else {
      const newId = 'cat_' + Date.now();
      struct.categories.push({
        id: newId,
        label: label,
        icon: icon,
        color: '#4f46e5',
        bg: '#eef2ff'
      });
    }

    try {
      await this.saveMenuStructure(struct);
      Utils.showToast(catId ? 'Menu Utama berhasil diperbarui!' : 'Menu Utama baru berhasil ditambahkan!', 'success');
      document.getElementById('categoryFormModal')?.remove();
      const content = document.getElementById('adminTabContent');
      if (content) this.renderTabMenu(content);
      const mainContainer = document.getElementById('mainContainer');
      if (mainContainer) this.renderAdminKabupatenPortal(mainContainer);
    } catch (err) {
      Utils.showToast('Gagal menyimpan Menu Utama: ' + err.message, 'error');
    }
  },

  async handleDeleteCategory(catId) {
    if (!confirm('Apakah Anda yakin ingin menghapus Menu Utama ini?')) return;
    const struct = this.getMenuStructure();
    struct.categories = struct.categories.filter(c => c.id !== catId);

    try {
      await this.saveMenuStructure(struct);
      Utils.showToast('Menu Utama berhasil dihapus!', 'info');
      const content = document.getElementById('adminTabContent');
      if (content) this.renderTabMenu(content);
      const mainContainer = document.getElementById('mainContainer');
      if (mainContainer) this.renderAdminKabupatenPortal(mainContainer);
    } catch (err) {
      Utils.showToast('Gagal menghapus: ' + err.message, 'error');
    }
  },

  openSubMenuModal(itemId = null) {
    const struct = this.getMenuStructure();
    const item = itemId ? struct.items.find(i => i.id === itemId) : null;
    const isEdit = !!item;

    const catOptions = (struct.categories || []).map(c => `
      <option value="${c.id}" ${item && item.category === c.id ? 'selected' : ''}>${Utils.escapeHtml(c.label)}</option>
    `).join('');

    const modalHtml = `
      <div class="modal-backdrop active" id="subMenuFormModal">
        <div class="modal-card" style="max-width: 480px;">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0;">
              <i class="fa-solid fa-plus-circle" style="color: var(--primary);"></i> ${isEdit ? 'Edit Sub-Menu' : 'Tambah Sub-Menu Baru'}
            </h3>
            <button class="btn-close" onclick="document.getElementById('subMenuFormModal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 1.25rem;">
            <form onsubmit="App.handleSaveSubMenuSubmit(event, '${itemId || ''}')">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Nama Sub-Menu <span style="color: red;">*</span></label>
                <input type="text" id="sub_label" required value="${isEdit ? Utils.escapeHtml(item.label) : ''}" placeholder="Contoh: Manajemen Tenda / Logistik" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Pilih Menu Utama (Grup) <span style="color: red;">*</span></label>
                <select id="sub_category" required style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
                  ${catOptions}
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Ikon FontAwesome</label>
                <input type="text" id="sub_icon" value="${isEdit ? Utils.escapeHtml(item.icon || '') : 'fa-solid fa-cubes'}" placeholder="fa-solid fa-box" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
                <small style="color: #64748b; font-size: 0.75rem;">Contoh: <code>fa-solid fa-box</code>, <code>fa-solid fa-truck</code>, <code>fa-solid fa-newspaper</code></small>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('subMenuFormModal').remove()">Batal</button>
                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Simpan Sub-Menu</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('#subMenuFormModal').forEach(el => el.remove());
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async handleSaveSubMenuSubmit(e, itemId) {
    e.preventDefault();
    const label = document.getElementById('sub_label')?.value.trim();
    const category = document.getElementById('sub_category')?.value;
    const icon = document.getElementById('sub_icon')?.value.trim() || 'fa-solid fa-cubes';

    if (!label) return Utils.showToast('Nama Sub-Menu wajib diisi!', 'error');

    const struct = this.getMenuStructure();

    if (itemId) {
      const item = struct.items.find(i => i.id === itemId);
      if (item) {
        item.label = label;
        item.category = category;
        item.icon = icon;
      }
    } else {
      const newId = 'sub_' + Date.now();
      struct.items.push({
        id: newId,
        label: label,
        icon: icon,
        category: category,
        enabled: true,
        isSystem: false
      });
    }

    try {
      await this.saveMenuStructure(struct);
      Utils.showToast(itemId ? 'Sub-Menu berhasil diperbarui!' : 'Sub-Menu kustom baru berhasil dibuat!', 'success');
      document.getElementById('subMenuFormModal')?.remove();
      const content = document.getElementById('adminTabContent');
      if (content) this.renderTabMenu(content);
      if (this.activeCategory) this.switchAdminCategory(this.activeCategory, this.activeTab);
    } catch (err) {
      Utils.showToast('Gagal menyimpan Sub-Menu: ' + err.message, 'error');
    }
  },

  async handleDeleteSubMenu(itemId) {
    if (!confirm('Apakah Anda yakin ingin menghapus sub-menu ini?')) return;
    const struct = this.getMenuStructure();
    struct.items = struct.items.filter(i => i.id !== itemId);

    try {
      await this.saveMenuStructure(struct);
      Utils.showToast('Sub-Menu berhasil dihapus!', 'info');
      const content = document.getElementById('adminTabContent');
      if (content) this.renderTabMenu(content);
      if (this.activeCategory) this.switchAdminCategory(this.activeCategory, this.activeTab);
    } catch (err) {
      Utils.showToast('Gagal menghapus sub-menu: ' + err.message, 'error');
    }
  },

  // --- TAB PASSWORD: GANTI PASSWORD USER ---
  async renderTabPassword(container) {
    container.innerHTML = `
      <div class="panel-card" style="max-width: 520px; margin: 0 auto;">
        <div class="panel-header">
          <h3 class="panel-title">${Icons.settings(20, 'var(--primary)')} Ganti Password User</h3>
        </div>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.5rem;">
          Perbarui kata sandi akun <strong>${Utils.escapeHtml(this.currentUser?.username || '')}</strong> Anda untuk keamanan akses sistem.
        </p>

        <form id="changePasswordForm" onsubmit="App.handleChangePassword(event)">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">
              Password Lama <span style="color: red;">*</span>
            </label>
            <input type="password" id="old_password" required placeholder="Masukkan password saat ini" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid var(--border-color); border-radius: 6px;">
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">
              Password Baru <span style="color: red;">*</span>
            </label>
            <input type="password" id="new_password" required minlength="6" placeholder="Minimal 6 karakter" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid var(--border-color); border-radius: 6px;">
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">
              Konfirmasi Password Baru <span style="color: red;">*</span>
            </label>
            <input type="password" id="confirm_password" required minlength="6" placeholder="Ulangi password baru" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid var(--border-color); border-radius: 6px;">
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%;">
            <i class="fa-solid fa-key"></i> Simpan Password Baru
          </button>
        </form>
      </div>
    `;
  },

  async handleChangePassword(e) {
    e.preventDefault();
    const oldPassword = document.getElementById('old_password')?.value;
    const newPassword = document.getElementById('new_password')?.value;
    const confirmPassword = document.getElementById('confirm_password')?.value;

    if (!oldPassword || !newPassword || !confirmPassword) {
      Utils.showToast('Harap isi semua bidang password!', 'error');
      return;
    }

    if (newPassword.length < 6) {
      Utils.showToast('Password baru minimal 6 karakter!', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      Utils.showToast('Konfirmasi password baru tidak cocok!', 'error');
      return;
    }

    try {
      const res = await API.changePassword(oldPassword, newPassword, confirmPassword);
      Utils.showToast(res.message || 'Password berhasil diperbarui!', 'success');
      document.getElementById('changePasswordForm')?.reset();
    } catch (err) {
      Utils.showToast('Gagal mengganti password: ' + err.message, 'error');
    }
  },

  openChangePasswordModal() {
    if (this.currentUser && this.currentUser.role === 'kabupaten') {
      this.switchAdminCategory('pengaturan');
      this.switchAdminTab('password');
      return;
    }

    const modalHtml = `
      <div class="modal-backdrop active" id="passwordModal">
        <div class="modal-card" style="max-width: 440px;">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0;"><i class="fa-solid fa-key" style="color: var(--primary);"></i> Ganti Password Akun</h3>
            <button class="btn-close" onclick="App.closePasswordModal()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 1.25rem;">
            <form id="modalChangePasswordForm" onsubmit="App.handleModalChangePassword(event)">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Password Lama <span style="color: red;">*</span></label>
                <input type="password" id="m_old_password" required placeholder="Masukkan password saat ini" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Password Baru <span style="color: red;">*</span></label>
                <input type="password" id="m_new_password" required minlength="6" placeholder="Minimal 6 karakter" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
              </div>
              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem;">Konfirmasi Password Baru <span style="color: red;">*</span></label>
                <input type="password" id="m_confirm_password" required minlength="6" placeholder="Ulangi password baru" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px;">
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button type="button" class="btn btn-outline" onclick="App.closePasswordModal()">Batal</button>
                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Simpan Password</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('#passwordModal').forEach(el => el.remove());
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) modal.remove();
  },

  async handleModalChangePassword(e) {
    e.preventDefault();
    const oldPassword = document.getElementById('m_old_password')?.value;
    const newPassword = document.getElementById('m_new_password')?.value;
    const confirmPassword = document.getElementById('m_confirm_password')?.value;

    if (!oldPassword || !newPassword || !confirmPassword) {
      Utils.showToast('Harap isi semua bidang password!', 'error');
      return;
    }
    if (newPassword.length < 6) {
      Utils.showToast('Password baru minimal 6 karakter!', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      Utils.showToast('Konfirmasi password baru tidak cocok!', 'error');
      return;
    }

    try {
      const res = await API.changePassword(oldPassword, newPassword, confirmPassword);
      Utils.showToast(res.message || 'Password berhasil diperbarui!', 'success');
      this.closePasswordModal();
    } catch (err) {
      Utils.showToast('Gagal mengganti password: ' + err.message, 'error');
    }
  },

  // --- TAB 8: LAPORAN & EXPORT DATA ---
  async renderTabLaporan(container) {
    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <h3 class="panel-title">${Icons.export(20, 'var(--primary)')} Laporan Master & Export Data JUMBARA</h3>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
          
          <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color);">
            <h4>Laporan Peserta PMR</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">Export seluruh data registrasi peserta lengkap per unit dan status verifikasi.</p>
            <button class="btn btn-primary btn-sm" onclick="App.exportPesertaCSV()">${Icons.export(16, '#ffffff')} Unduh CSV Peserta</button>
          </div>

          <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color);">
            <h4>Laporan Medali & Juara Umum</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">Export perolehan medali Tri Bakti PMR dan ranking kontingen unit.</p>
            <button class="btn btn-secondary btn-sm" onclick="App.exportStandingsCSV()">${Icons.export(16, '#ffffff')} Unduh CSV Klasemen</button>
          </div>

        </div>
      </div>
    `;
  },

  // =========================================================================
  // ACTIONS & HANDLERS
  // =========================================================================
  async handleLogin(e) {
    e.preventDefault();
    const alertBox = document.getElementById('loginAlertBox');
    if (alertBox) {
      alertBox.style.display = 'none';
      alertBox.innerHTML = '';
    }

    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value.trim();

    try {
      const res = await API.login(u, p);
      API.setToken(res.token);
      API.setUser(res.user);
      this.currentUser = res.user;

      Utils.showToast(`Selamat datang kembali, ${res.user.username}!`, 'success');
      this.closeModal('loginModal');
      this.renderHeaderNav();
      this.renderView();
    } catch (err) {
      if (alertBox) {
        alertBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="font-size: 1.15rem; flex-shrink: 0;"></i> <div>${Utils.escapeHtml(err.message || 'Username atau password salah. Silakan coba lagi.')}</div>`;
        alertBox.style.display = 'flex';
      } else {
        Utils.showToast(err.message, 'error');
      }
    }
  },

  async handleRegister(e) {
    e.preventDefault();

    const selectedSubCats = Array.from(document.querySelectorAll('input[name="regCategory"]:checked')).map(cb => cb.value);

    const payload = {
      unit_id: parseInt(document.getElementById('regUnitId').value),
      level: document.getElementById('regLevel').value,
      full_name: document.getElementById('regFullName').value.trim(),
      nisn: document.getElementById('regNisn').value.trim(),
      religion: document.getElementById('regReligion')?.value || 'Islam',
      is_disabled: document.getElementById('regIsDisabled')?.value || 'Tidak',
      disability_type: document.getElementById('regDisabilityType')?.value || 'Tidak Ada',
      address: document.getElementById('regAddress')?.value || '',
      birth_place: document.getElementById('regBirthPlace').value.trim(),
      birth_date: document.getElementById('regBirthDate').value,
      gender: document.getElementById('regGender').value,
      blood_type: document.getElementById('regBloodType').value,
      phone: document.getElementById('regPhone').value.trim(),
      emergency_contact: document.getElementById('regEmergency').value.trim(),
      photo_url: document.getElementById('regPhotoUrl').value.trim(),
      sub_categories: selectedSubCats
    };

    try {
      const res = await API.registerPeserta(payload);
      Utils.showToast(res.message, 'success');
      this.closeModal('registerModal');
      if (res.wa_url) {
        window.open(res.wa_url, '_blank');
      }
      this.openLoginModal();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async changeParticipantStatus(id, newStatus) {
    try {
      const res = await API.updateParticipantStatus(id, newStatus);
      Utils.showToast(res.message, 'success');
      if (this.currentUser.role === 'unit') {
        this.loadUnitParticipants();
      } else {
        this.loadKabupatenParticipants();
      }
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  openRejectModal(id) {
    document.getElementById('rejectParticipantId').value = id;
    document.getElementById('rejectReasonInput').value = '';
    this.openModal('rejectModal');
  },

  async submitReject() {
    const id = document.getElementById('rejectParticipantId').value;
    const reason = document.getElementById('rejectReasonInput').value.trim();

    try {
      const res = await API.updateParticipantStatus(id, 'rejected', reason);
      Utils.showToast('Pendaftaran peserta berhasil ditolak.', 'info');
      this.closeModal('rejectModal');
      if (this.currentUser.role === 'unit') this.loadUnitParticipants();
      else this.loadKabupatenParticipants();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async openAuditModal(id) {
    const container = document.getElementById('auditModalBody');
    if (!container) return;
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data audit & berkas peserta...</p>';
    this.openModal('auditModal');

    try {
      const p = await API.getParticipantIDCard(id);

      container.innerHTML = `
        <div style="display: grid; grid-template-columns: 300px 1fr; gap: 1.25rem;">
          <!-- Sisi Kiri: Berkas Foto & Surat Tugas -->
          <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--secondary); margin-bottom: 0.75rem; border-bottom: 2px solid var(--primary); padding-bottom: 0.3rem;">
              <i class="fa-solid fa-file-image"></i> Berkas Foto & Dokumen
            </h4>

            <!-- Pas Foto 3x4 -->
            <div style="text-align: center; margin-bottom: 1rem;">
              <label class="form-label" style="font-size: 0.8rem; text-align: left; display: block; margin-bottom: 0.4rem;">Pas Foto Peserta (3x4):</label>
              <div style="position: relative; display: inline-block;">
                <img src="${p.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" style="width: 130px; height: 160px; object-fit: cover; border-radius: 6px; border: 2px solid var(--border-color); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              </div>
              ${p.photo_url ? `
                <button type="button" class="btn btn-outline btn-sm" style="margin-top: 0.5rem; font-size: 0.75rem; width: 100%; justify-content: center;" onclick="window.open('${p.photo_url}', '_blank')">
                  <i class="fa-solid fa-magnifying-glass-plus"></i> Pratinjau Foto Ukuran Penuh
                </button>
              ` : '<p style="font-size: 0.75rem; color: red; margin-top: 0.4rem;">Belum ada pas foto</p>'}
            </div>

            <!-- Surat Tugas -->
            <div style="margin-top: 1rem; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
              <label class="form-label" style="font-size: 0.8rem; display: block; margin-bottom: 0.4rem;">Surat Tugas Sekolah:</label>
              ${p.assignment_letter_url ? `
                <div style="background: #ffffff; padding: 0.75rem; border-radius: 6px; border: 1px solid #cbd5e1; text-align: center;">
                  <i class="fa-solid fa-file-pdf" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.4rem;"></i>
                  <p style="font-size: 0.78rem; font-weight: 700; margin-bottom: 0.5rem; word-break: break-all; color: var(--secondary);">Surat Tugas Terunggah</p>
                  <a href="${p.assignment_letter_url}" target="_blank" class="btn btn-primary btn-sm" style="font-size: 0.75rem; width: 100%; justify-content: center;">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Buka Surat Tugas (Tab Baru)
                  </a>
                </div>
              ` : `
                <div style="background: #fef2f2; border: 1px dashed #fca5a5; color: #991b1b; padding: 0.75rem; border-radius: 6px; font-size: 0.8rem; text-align: center;">
                  <i class="fa-solid fa-triangle-exclamation"></i> Belum ada Surat Tugas diunggah
                </div>
              `}
            </div>
          </div>

          <!-- Sisi Kanan: Biodata & Keputusan Verifikasi -->
          <div>
            <div style="background: #ffffff; padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem;">
                <div>
                  <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--secondary); margin: 0;">${Utils.escapeHtml(p.full_name)}</h4>
                  <span style="font-size: 0.8rem; color: var(--primary); font-weight: 700;">Kode: ${p.code}</span>
                </div>
                ${Utils.getStatusBadgeHtml(p.status)}
              </div>

              <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse; line-height: 1.6;">
                <tr><td style="padding: 0.25rem 0; color: var(--text-muted); width: 35%;">Unit PMR Sekolah:</td><td style="font-weight: 700;">${Utils.escapeHtml(p.unit_name)}</td></tr>
                <tr><td style="padding: 0.25rem 0; color: var(--text-muted);">Kategori Registrasi:</td><td>${Utils.getLevelBadgeHtml(p.registration_type || 'Peserta')}</td></tr>
                <tr><td style="padding: 0.25rem 0; color: var(--text-muted);">Tingkat PMR:</td><td>${Utils.getLevelBadgeHtml(p.level)}</td></tr>
                <tr><td style="padding: 0.25rem 0; color: var(--text-muted);">NISN / NIK:</td><td>${p.nisn || '-'}</td></tr>
                <tr><td style="padding: 0.25rem 0; color: var(--text-muted);">TTL / Jenis Kelamin:</td><td>${p.birth_place || '-'}, ${Utils.formatDate(p.birth_date)} (${p.gender === 'L' ? 'Laki-laki' : 'Perempuan'})</td></tr>
                <tr><td style="padding: 0.25rem 0; color: var(--text-muted);">Agama / Gol. Darah:</td><td>${Utils.escapeHtml(p.religion || 'Islam')} / <strong style="color: var(--primary);">${p.blood_type || '-'}</strong></td></tr>
                <tr><td style="padding: 0.25rem 0; color: var(--text-muted);">Status Disabilitas:</td><td>${p.is_disabled === 'Ya' ? `<strong style="color: #d97706;"><i class="fa-solid fa-wheelchair"></i> Penyandang Disabilitas (${Utils.escapeHtml(p.disability_type)})</strong>` : 'Non-Disabilitas'}</td></tr>
                <tr><td style="padding: 0.25rem 0; color: var(--text-muted);">Alamat Tempat Tinggal:</td><td>${Utils.escapeHtml(p.address || '-')}</td></tr>
                <tr><td style="padding: 0.25rem 0; color: var(--text-muted);">No. WhatsApp Peserta:</td><td><strong style="color: #25d366;"><i class="fa-brands fa-whatsapp"></i> ${p.phone || '-'}</strong></td></tr>
                <tr><td style="padding: 0.25rem 0; color: var(--text-muted);">Nama Pembina / Ortu:</td><td>${Utils.escapeHtml(p.emergency_contact || '-')}</td></tr>
              </table>
            </div>

            ${p.reject_reason ? `
              <div style="background: #fefce8; border: 1px solid #fef08a; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.83rem;">
                <strong style="color: #854d0e;"><i class="fa-solid fa-note-sticky"></i> Catatan/Alasan Keputusan Sebelumnya:</strong>
                <p style="color: #713f12; margin-top: 0.2rem; margin-bottom: 0;">${Utils.escapeHtml(p.reject_reason)}</p>
              </div>
            ` : ''}

            <!-- Form keputusan verifikasi admin -->
            <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-md); border: 1px solid #cbd5e1;">
              <h5 style="font-size: 0.9rem; font-weight: 800; color: var(--secondary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                <i class="fa-solid fa-gavel" style="color: var(--primary);"></i> Formulir Keputusan Hasil Audit & Pengecekan Admin
              </h5>
              <input type="hidden" id="auditParticipantId" value="${p.id}">
              <div class="form-group" style="margin-bottom: 0.75rem;">
                <label class="form-label" style="font-size: 0.8rem;">Catatan Perbaikan / Alasan Penolakan (Wajib jika Revisi / Tolak):</label>
                <textarea id="auditReasonInput" rows="2" placeholder="Contoh jika revisi: Pas foto kurang jelas / buram. Atau Surat Tugas belum ditandatangani Pembina..."></textarea>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem;">
                <button type="button" class="btn btn-success btn-sm" onclick="App.submitAuditDecision('approve')" style="justify-content: center; font-weight: 700;">
                  <i class="fa-solid fa-circle-check"></i> Setujui
                </button>
                <button type="button" class="btn btn-warning btn-sm" onclick="App.submitAuditDecision('revision')" style="background: #f59e0b; border-color: #f59e0b; color: white; justify-content: center; font-weight: 700;">
                  <i class="fa-solid fa-rotate-left"></i> Minta Perbaikan
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="App.submitAuditDecision('reject')" style="justify-content: center; font-weight: 700;">
                  <i class="fa-solid fa-circle-xmark"></i> Tolak Pendaftaran
                </button>
              </div>

              <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
                <button type="button" class="btn btn-outline btn-sm" onclick="App.openAdminEditParticipantModal(${p.id})" style="font-size: 0.8rem;">
                  <i class="fa-solid fa-pen-to-square"></i> Edit Data Lengkap
                </button>
                <button type="button" class="btn btn-danger btn-sm" style="background: #dc2626; border-color: #dc2626; font-size: 0.8rem;" data-name="${Utils.escapeHtml(p.full_name)}" onclick="event.stopPropagation(); App.deleteParticipant(${p.id}, this.dataset.name)">
                  <i class="fa-solid fa-trash-can"></i> Hapus Peserta
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: red;">Gagal memuat data audit: ${err.message}</p>`;
    }
  },

  async submitAuditDecision(decision) {
    const id = document.getElementById('auditParticipantId').value;
    const reason = document.getElementById('auditReasonInput').value.trim();

    let targetStatus = '';
    if (decision === 'approve') {
      targetStatus = this.currentUser.role === 'unit' ? 'verified_unit' : 'verified_kabupaten';
    } else if (decision === 'revision') {
      targetStatus = 'revision';
      if (!reason) {
        alert('Harap isi Catatan Perbaikan untuk menjelaskan berkas/data mana yang harus diperbaiki oleh peserta.');
        return;
      }
    } else if (decision === 'reject') {
      targetStatus = 'rejected';
      if (!reason) {
        alert('Harap isi Alasan Penolakan pendaftaran peserta.');
        return;
      }
    }

    try {
      const res = await API.updateParticipantStatus(id, targetStatus, reason);
      Utils.showToast(res.message, 'success');
      this.closeModal('auditModal');

      if (res.wa_url) {
        if (confirm('Status verifikasi berhasil disimpan! Apakah Anda ingin langsung mengirim notifikasi hasil verifikasi ke WhatsApp peserta?')) {
          window.open(res.wa_url, '_blank');
        }
      }

      if (this.currentUser.role === 'unit') this.loadUnitParticipants();
      else this.loadKabupatenParticipants();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async openEditParticipantModal(id) {
    try {
      const p = await API.getParticipantIDCard(id);
      if (!p) return;

      document.getElementById('adminEditParticipantId').value = p.id;
      document.getElementById('adminEditFullName').value = p.full_name || '';
      document.getElementById('adminEditNisn').value = p.nisn || '';
      document.getElementById('adminEditRegistrationType').value = p.registration_type || 'Peserta';
      document.getElementById('adminEditLevel').value = p.level || 'Wira';
      document.getElementById('adminEditStatus').value = p.status || 'pending_unit';
      document.getElementById('adminEditGender').value = p.gender || 'L';
      document.getElementById('adminEditBloodType').value = p.blood_type || 'O';
      document.getElementById('adminEditPhone').value = p.phone || '';
      document.getElementById('adminEditEmergencyContact').value = p.emergency_contact || '';
      document.getElementById('adminEditPhotoFile').value = '';
      document.getElementById('adminEditAssignmentFile').value = '';

      this.openModal('adminEditParticipantModal');
    } catch (err) {
      Utils.showToast('Gagal memuat data peserta: ' + err.message, 'error');
    }
  },

  async handleSaveAdminParticipantEdit(e) {
    e.preventDefault();
    const id = document.getElementById('adminEditParticipantId')?.value;
    if (!id) return;

    const submitBtn = document.getElementById('adminEditSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan Data...';
    }

    const readFileAsBase64 = (file) => {
      return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    };

    try {
      const photoFile = document.getElementById('adminEditPhotoFile')?.files[0] || null;
      const assignmentFile = document.getElementById('adminEditAssignmentFile')?.files[0] || null;

      const [photoData, assignmentData] = await Promise.all([
        readFileAsBase64(photoFile),
        readFileAsBase64(assignmentFile)
      ]);

      const payload = {
        id: Number(id),
        full_name: document.getElementById('adminEditFullName')?.value.trim(),
        nisn: document.getElementById('adminEditNisn')?.value.trim(),
        registration_type: document.getElementById('adminEditRegistrationType')?.value,
        level: document.getElementById('adminEditLevel')?.value,
        status: document.getElementById('adminEditStatus')?.value,
        gender: document.getElementById('adminEditGender')?.value,
        blood_type: document.getElementById('adminEditBloodType')?.value,
        phone: document.getElementById('adminEditPhone')?.value.trim(),
        emergency_contact: document.getElementById('adminEditEmergencyContact')?.value.trim(),
        photo_data: photoData,
        assignment_letter_data: assignmentData
      };

      const res = await API.updateParticipantAdmin(payload);
      Utils.showToast(res.message || 'Data peserta berhasil diperbarui!', 'success');
      this.closeModal('adminEditParticipantModal');
      this.closeModal('auditModal');
      this.loadCommonData();
      if (this.currentUser && this.currentUser.role === 'unit') this.loadUnitParticipants();
      if (this.currentUser && this.currentUser.role === 'kabupaten') this.loadKabupatenParticipants();
    } catch (err) {
      Utils.showToast(err.message || 'Gagal menyimpan perubahan peserta', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan Data';
      }
    }
  },

  async deleteParticipant(id, name = 'peserta ini') {
    if (this._isDeletingParticipant) return;

    const confirmed = await Utils.showConfirmModal({
      title: 'Hapus Data Peserta',
      message: `Apakah Anda yakin ingin menghapus data peserta <strong>${Utils.escapeHtml(name)}</strong> beserta akun login terkait?<br><span style="color: #dc2626; font-size: 0.82rem; margin-top: 0.4rem; display: block;"><i class="fa-solid fa-triangle-exclamation"></i> Tindakan ini tidak dapat dibatalkan.</span>`,
      icon: 'fa-solid fa-trash-can',
      confirmText: 'Ya, Hapus Data',
      confirmClass: 'btn-danger'
    });
    if (!confirmed) return;

    if (this._isDeletingParticipant) return;
    this._isDeletingParticipant = true;

    try {
      const res = await API.deleteParticipant(id);
      Utils.showToast(res.message || 'Data peserta berhasil dihapus!', 'success');

      // Tutup semua modal terkait
      this.closeModal('auditModal');
      this.closeModal('adminEditParticipantModal');

      // Muat ulang data secara aman (tidak memicu notifikasi gagal palsu)
      try {
        await this.loadCommonData();
        if (this.currentUser) {
          const role = this.currentUser.role;
          if (role === 'unit' || role === 'admin_unit') {
            await this.loadUnitParticipants();
          } else if (['kabupaten', 'admin_kabupaten', 'super_admin'].includes(role)) {
            await this.loadKabupatenParticipants();
          }
        }
      } catch (refreshErr) {
        console.warn('Gagal memuat ulang data tabel setelah delete:', refreshErr);
      }
    } catch (err) {
      Utils.showToast(err.message || 'Gagal menghapus peserta', 'error');
    } finally {
      this._isDeletingParticipant = false;
    }
  },

  handleDeleteFromEditModal(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }
    const id = document.getElementById('adminEditParticipantId')?.value;
    const name = document.getElementById('adminEditFullName')?.value || 'peserta ini';
    if (!id) return;
    this.deleteParticipant(id, name);
  },

  async openEditProfileModal() {
    try {
      const profile = await API.getParticipantMe();
      document.getElementById('editProfileFullName').value = profile.full_name || '';
      document.getElementById('editProfileNisn').value = profile.nisn || '';
      document.getElementById('editProfileReligion').value = profile.religion || 'Islam';
      document.getElementById('editProfileGender').value = profile.gender || 'L';
      document.getElementById('editProfileBloodType').value = profile.blood_type || 'O';
      document.getElementById('editProfilePhone').value = profile.phone || '';
      document.getElementById('editProfileEmergencyContact').value = profile.emergency_contact || '';
      document.getElementById('editProfileAddress').value = profile.address || '';
      this.openModal('editProfileModal');
    } catch (err) {
      Utils.showToast('Gagal memuat profil: ' + err.message, 'error');
    }
  },

  async submitEditProfile(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('editProfileSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan Perubahan...';
    }

    const readFileAsBase64 = (file) => {
      return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    };

    try {
      const photoFileInput = document.getElementById('editProfilePhotoFile');
      const assignmentFileInput = document.getElementById('editProfileAssignmentFile');

      const photoFile = photoFileInput && photoFileInput.files[0] ? photoFileInput.files[0] : null;
      const assignmentFile = assignmentFileInput && assignmentFileInput.files[0] ? assignmentFileInput.files[0] : null;

      const [photoData, assignmentData] = await Promise.all([
        readFileAsBase64(photoFile),
        readFileAsBase64(assignmentFile)
      ]);

      const payload = {
        full_name: document.getElementById('editProfileFullName').value,
        nisn: document.getElementById('editProfileNisn').value,
        religion: document.getElementById('editProfileReligion').value,
        gender: document.getElementById('editProfileGender').value,
        blood_type: document.getElementById('editProfileBloodType').value,
        phone: document.getElementById('editProfilePhone').value,
        emergency_contact: document.getElementById('editProfileEmergencyContact').value,
        address: document.getElementById('editProfileAddress').value,
        photo_data: photoData,
        assignment_letter_data: assignmentData
      };

      const res = await API.updateParticipantMe(payload);
      Utils.showToast(res.message, 'success');
      this.closeModal('editProfileModal');
      this.renderPesertaPortal(document.getElementById('mainContainer'));
    } catch (err) {
      Utils.showToast(err.message || 'Gagal memperbarui berkas', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Simpan & Kirim Ulang Verifikasi';
      }
    }
  },

  async openIDCardModal(id) {
    const modalContent = document.getElementById('idCardModalContent');
    modalContent.innerHTML = '<p style="text-align: center;">Memuat Kartu Peserta...</p>';
    this.openModal('idCardModal');

    try {
      const data = await API.getParticipantIDCard(id);
      modalContent.innerHTML = this.generateIDCardHtml(data);
    } catch (err) {
      modalContent.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
    }
  },

  generateBarcodeSVG(text, height = 36) {
    if (!text) text = '3401074802830002';
    const cleanText = String(text).toUpperCase().replace(/[^A-Z0-9\-\. \$\/\+\%]/g, '');
    const encodedText = '*' + (cleanText || '000000') + '*';

    const code39Map = {
      '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
      '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
      '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
      'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
      'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
      'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
      'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
      'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
      'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
      '-': '100101011011', '.': '110010101101', ' ': '100110101101', '*': '100101101101',
      '$': '100100100101', '/': '100100101001', '+': '100101001001', '%': '100101010001'
    };

    let bitString = '';
    for (let i = 0; i < encodedText.length; i++) {
      const char = encodedText[i];
      if (code39Map[char]) {
        bitString += code39Map[char] + '0';
      }
    }

    const unitWidth = 1.3;
    const svgWidth = Math.max(120, Math.ceil(bitString.length * unitWidth));
    let rects = '';
    let x = 0;

    for (let i = 0; i < bitString.length; i++) {
      if (bitString[i] === '1') {
        rects += `<rect x="${(x * unitWidth).toFixed(1)}" y="0" width="${unitWidth}" height="${height}" fill="#000000" />`;
      }
      x++;
    }

    return `<svg viewBox="0 0 ${svgWidth} ${height}" width="100%" height="${height}px" preserveAspectRatio="none" style="display: block;">${rects}</svg>`;
  },

  generateIDCardHtml(data, customSettings) {
    const s = customSettings || this.appSettings || {};

    const catY = parseInt(s.idcard_cat_y ?? 138, 10);
    const photoX = parseInt(s.idcard_photo_x ?? 0, 10);
    const photoY = parseInt(s.idcard_photo_y ?? 0, 10);
    const photoW = parseInt(s.idcard_photo_w ?? 110, 10);
    const photoH = parseInt(s.idcard_photo_h ?? 145, 10);
    const nameY = parseInt(s.idcard_name_y ?? 0, 10);
    const nameSize = parseInt(s.idcard_name_size ?? 17, 10);
    const unitY = parseInt(s.idcard_unit_y ?? 0, 10);
    const unitSize = parseInt(s.idcard_unit_size ?? 13, 10);
    const qrX = parseInt(s.idcard_qr_x ?? 0, 10);
    const qrY = parseInt(s.idcard_qr_y ?? 0, 10);
    const qrSize = parseInt(s.idcard_qr_size ?? 55, 10);

    const isNonPeserta = data.registration_type && data.registration_type !== 'Peserta';
    let categoryTitle = isNonPeserta ? data.registration_type : 'PESERTA';
    if (categoryTitle.toUpperCase() === 'TAMU') {
      categoryTitle = 'TAMU UNDANGAN';
    }

    // Category background color matching reference model
    let catBg = '#ffe600';
    let catTextColor = '#000000';
    if (categoryTitle.toUpperCase().includes('PANITIA')) {
      catBg = '#0284c7';
      catTextColor = '#ffffff';
    } else if (categoryTitle.toUpperCase().includes('PENINJAU')) {
      catBg = '#059669';
      catTextColor = '#ffffff';
    } else if (categoryTitle.toUpperCase().includes('TAMU')) {
      catBg = '#7e22ce';
      catTextColor = '#ffffff';
    } else if (categoryTitle.toUpperCase().includes('MEDIA')) {
      catBg = '#ea580c';
      catTextColor = '#ffffff';
    }

    const eventTitle = s.idcard_event_title || 'JUMBARA PMR IX';
    const eventSubtitle = s.idcard_event_subtitle || 'PALANG MERAH INDONESIA TAHUN 2026';
    const eventMotto = s.idcard_motto || '#JUMBARAPMR2026';
    const eventDate = s.idcard_date || 'Kabupaten, 2026';

    const barcodeCode = data.nik || data.code || '3401074802830002';
    const barcodeSvg = this.generateBarcodeSVG(barcodeCode);
    const qrImgSrc = data.qr_code_base64 || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.code || barcodeCode || 'JMB-2026-0001')}`;

    const hasCustomTemplate = Boolean(s.idcard_template);
    const customTemplateBgStyle = hasCustomTemplate
      ? `background-image: url('${s.idcard_template}'); background-size: cover; background-position: center;`
      : '';

    // MODE UPLOAD TEMPLATE KUSTOM: Pita Kategori Full-Width (Menutup sempurna) + Foto 3x4, Nama, Asal/Unit, & QR Code (Tanpa Logo Tambahan, Tanpa Barcode 1D)
    if (hasCustomTemplate) {
      return `
        <div class="idcard-wrapper">
          <div class="pmi-template-card has-custom-template" style="${customTemplateBgStyle}">
            
            <!-- Category Band Bar Full Width (Position Absolute so slider Y moves it freely anywhere on the card) -->
            <div class="pmi-category-band-yellow" style="position: absolute; top: ${catY}px; left: 0; width: 100%; z-index: 10; background: ${catBg}; color: ${catTextColor};">
              ${categoryTitle.toUpperCase()}
            </div>

            <!-- Overlay Body: Foto Kiri, Nama & Asal & QR Code Kanan -->
            <div class="pmi-custom-template-overlay" style="margin-top: 175px;">
              <!-- Foto 3x4 -->
              <div class="pmi-photo-column" style="transform: translate(${photoX}px, ${photoY}px);">
                <div class="pmi-photo-frame" style="width: ${photoW}px; height: ${photoH}px;">
                  <img src="${data.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="pmi-photo-img" alt="Foto ${Utils.escapeHtml(data.full_name)}">
                </div>
              </div>

              <!-- Nama, Asal/Unit, & QR Code (Tanpa Barcode 1D) -->
              <div class="pmi-detail-column">
                <!-- Nama -->
                <div class="pmi-field-group" style="transform: translateY(${nameY}px);">
                  <div class="pmi-field-value pmi-field-name" style="font-size: ${nameSize}px; line-height: 1.2;">${Utils.escapeHtml(data.full_name)}</div>
                  <div class="pmi-field-underline"></div>
                  <div class="pmi-field-label">Nama / Name</div>
                </div>

                <!-- Asal / Unit -->
                <div class="pmi-field-group" style="transform: translateY(${unitY}px);">
                  <div class="pmi-field-value pmi-field-unit" style="font-size: ${unitSize}px; line-height: 1.2;">${Utils.escapeHtml(data.unit_name || 'PMI KABUPATEN KULON PROGO')}</div>
                  <div class="pmi-field-underline"></div>
                  <div class="pmi-field-label">Asal / Unit / Kontingen</div>
                </div>

                <!-- QR Code (Tanpa Barcode 1D & Tanpa Box Putih) -->
                <div class="pmi-qrcode-only-box" style="transform: translate(${qrX}px, ${qrY}px);">
                  <img src="${qrImgSrc}" alt="QR ${Utils.escapeHtml(data.code || 'JMB-2026-0001')}" class="pmi-qr-img-only" style="width: ${qrSize}px; height: ${qrSize}px;">
                  <span class="pmi-qr-code-text">ID: ${Utils.escapeHtml(barcodeCode)}</span>
                </div>
              </div>
            </div>

            <div style="height: 10px;"></div>
          </div>
        </div>
      `;
    }

    // MODE TEMPLATE STANDAR PMI (JUMBARA / JUMTEK OFFICIAL MODEL)
    return `
      <div class="idcard-wrapper">
        <div class="pmi-template-card">
          
          <!-- 1. Top Header -->
          <div class="pmi-card-top-header">
            <div class="pmi-event-brand">
              <div class="pmi-event-logo">
                ${s.event_logo ? `<img src="${s.event_logo}" alt="Logo Kegiatan" style="width: 38px; height: 34px; object-fit: contain;">` : `
                <svg width="38" height="34" viewBox="0 0 100 80">
                  <path d="M10,40 Q30,10 60,30 T90,40 Q60,70 30,50 Z" fill="#ea580c" opacity="0.9" />
                  <path d="M15,40 C30,20 50,20 65,40 C50,60 30,60 15,40 Z" fill="#0284c7" />
                  <circle cx="55" cy="35" r="7" fill="#16a34a" />
                  <path d="M75,25 L95,15 L85,40 L95,65 L75,55 Z" fill="#dc2626" />
                </svg>
                `}
              </div>
              <div class="pmi-event-text">
                <span class="pmi-event-title">${Utils.escapeHtml(eventTitle)}</span>
                <span class="pmi-event-subtitle">${Utils.escapeHtml(eventSubtitle)}</span>
              </div>
            </div>

            <div class="pmi-official-brand">
              <div class="pmi-logo-badge">
                ${s.app_logo ? `<img src="${s.app_logo}" alt="Logo PMI" style="width: 32px; height: 32px; object-fit: contain;">` : `
                <svg width="32" height="32" viewBox="0 0 100 100">
                  <path d="M50,5 C60,5 65,18 75,18 C85,18 92,28 92,38 C92,48 95,60 88,68 C81,76 72,82 62,86 C52,90 48,95 38,95 C28,95 20,86 14,78 C8,70 8,58 8,48 C8,38 15,25 25,20 C35,15 40,5 50,5 Z" fill="#ffffff" stroke="#dc2626" stroke-width="4"/>
                  <rect x="42" y="25" width="16" height="50" rx="2" fill="#dc2626"/>
                  <rect x="25" y="42" width="50" height="16" rx="2" fill="#dc2626"/>
                </svg>
                `}
              </div>
              <div class="pmi-official-text">
                <span>Palang</span>
                <span>Merah</span>
                <span>Indonesia</span>
              </div>
            </div>
          </div>

          <!-- 2. Category Band (Yellow Bar) -->
          <div class="pmi-category-band-yellow" style="background: ${catBg}; color: ${catTextColor};">
            ${categoryTitle.toUpperCase()}
          </div>

          <!-- 3. Body Content (Pas Foto Kiri, Detail & Barcode Kanan) -->
          <div class="pmi-card-body-content">
            <!-- Kolom Kiri: Pas Foto 3x4 -->
            <div class="pmi-photo-column" style="transform: translate(${photoX}px, ${photoY}px);">
              <div class="pmi-photo-frame" style="width: ${photoW}px; height: ${photoH}px;">
                <img src="${data.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="pmi-photo-img" alt="Foto ${Utils.escapeHtml(data.full_name)}">
              </div>
            </div>

            <!-- Kolom Kanan: Nama, Utusan, Barcode, Tanggal -->
            <div class="pmi-detail-column">
              <!-- Nama -->
              <div class="pmi-field-group" style="transform: translateY(${nameY}px);">
                <div class="pmi-field-value pmi-field-name" style="font-size: ${nameSize}px; line-height: 1.2;">${Utils.escapeHtml(data.full_name)}</div>
                <div class="pmi-field-underline"></div>
                <div class="pmi-field-label">Nama / Name</div>
              </div>

              <!-- Utusan / Unit -->
              <div class="pmi-field-group" style="transform: translateY(${unitY}px);">
                <div class="pmi-field-value pmi-field-unit" style="font-size: ${unitSize}px; line-height: 1.2;">${Utils.escapeHtml(data.unit_name || 'PMI KABUPATEN KULON PROGO')}</div>
                <div class="pmi-field-underline"></div>
                <div class="pmi-field-label">Kontingen / Unit</div>
              </div>

              <!-- 1D Barcode & QR Code -->
              <div class="pmi-barcode-group" style="transform: translate(${qrX}px, ${qrY}px); display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 4px;">
                <div style="flex: 1; text-align: center;">
                  <div class="pmi-barcode-svg">
                    ${barcodeSvg}
                  </div>
                  <div class="pmi-barcode-number">${Utils.escapeHtml(barcodeCode)}</div>
                </div>
                <div style="width: 48px; height: 48px; flex-shrink: 0; background: #ffffff; padding: 2px; border: 1px solid #cbd5e1; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                  <img src="${qrImgSrc}" alt="QR ${Utils.escapeHtml(data.code || 'JMB-2026-0001')}" style="width: 100%; height: 100%; object-fit: contain;">
                </div>
              </div>

              <!-- Tanggal & Lokasi Event -->
              <div class="pmi-location-date">${Utils.escapeHtml(eventDate)}</div>
            </div>
          </div>

          <!-- 4. Footer: Color Strip + Candi Silhouette + Mascot Avatars -->
          <div class="pmi-card-footer">
            <div class="pmi-footer-color-strip">
              <span class="strip-1"></span>
              <span class="strip-2"></span>
              <span class="strip-3"></span>
              <span class="strip-4"></span>
            </div>
            <div class="pmi-footer-body">
              <svg class="pmi-candi-silhouette" viewBox="0 0 160 60" preserveAspectRatio="none">
                <path fill="#cbd5e1" opacity="0.6" d="M0,60 L0,52 L15,48 L35,50 L50,42 L65,48 L80,38 L95,50 L110,44 L130,52 L160,50 L160,60 Z"/>
                <path fill="#334155" opacity="0.25" d="M10,60 L10,38 L14,35 L14,30 L16,25 L18,30 L18,35 L22,38 L22,60 Z
                                       M26,60 L26,28 L30,22 L30,15 L32,8 L34,15 L34,22 L38,28 L38,60 Z
                                       M42,60 L42,35 L46,30 L46,24 L48,18 L50,24 L50,30 L54,35 L54,60 Z"/>
              </svg>
              <div class="pmi-footer-hashtag">${Utils.escapeHtml(eventMotto)}</div>
              <div class="pmi-footer-mascots">
                <div class="mascot-avatar mascot-1" title="PMR Mula">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
                </div>
                <div class="mascot-avatar mascot-2" title="PMR Madya">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                </div>
                <div class="mascot-avatar mascot-3" title="PMR Wira">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <div class="mascot-avatar mascot-4" title="Relawan">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  async openScoreModal() {
    const selectUnit = document.getElementById('scoreUnitId');
    if (selectUnit && this.cachedUnits.length) {
      selectUnit.innerHTML = '<option value="">-- Pilih Unit Sekolah --</option>' +
        this.cachedUnits.map(u => `<option value="${u.id}">${Utils.escapeHtml(u.name)}</option>`).join('');
    }
    this.openModal('scoreModal');
  },

  async loadParticipantsForScoreSelect(unitId) {
    const select = document.getElementById('scoreParticipantId');
    if (!select) return;
    if (!unitId) {
      select.innerHTML = '<option value="">-- Semua Kontingen Unit --</option>';
      return;
    }
    try {
      const res = await API.getParticipants({ unit_id: unitId, all: 'true' });
      const parts = Array.isArray(res) ? res : (res.data || []);
      select.innerHTML = '<option value="">-- Semua Kontingen Unit --</option>' +
        parts.map(p => `<option value="${p.id}">${Utils.escapeHtml(p.full_name)} (${p.code})</option>`).join('');
    } catch (e) {
      console.error(e);
    }
  },

  async handleSaveScore(e) {
    e.preventDefault();
    const payload = {
      unit_id: parseInt(document.getElementById('scoreUnitId').value),
      participant_id: document.getElementById('scoreParticipantId').value ? parseInt(document.getElementById('scoreParticipantId').value) : null,
      category_type: document.getElementById('scoreCategoryType').value,
      pmr_level: document.getElementById('scorePmrLevel').value,
      branch_name: document.getElementById('scoreBranchName').value.trim(),
      score_val: parseFloat(document.getElementById('scoreVal').value),
      judge_name: document.getElementById('scoreJudgeName').value.trim(),
      notes: document.getElementById('scoreNotes').value.trim()
    };

    try {
      const res = await API.addScore(payload);
      Utils.showToast(`Penilaian disimpan! Medali: ${res.grade}`, 'success');
      this.closeModal('scoreModal');
      this.loadStandingsAndScores();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async handleValidateScore(scoreId) {
    const confirmed = await Utils.showConfirmModal({
      title: 'Validasi & Kunci Penilaian',
      message: '<strong>Apakah Anda yakin ingin memvalidasi & mengunci nilai ini?</strong><br><span style="color:#64748b; font-size:0.88rem; margin-top:0.4rem; display:block;">Setelah divalidasi, Penilai tidak dapat lagi mengubah nilai ini.</span>',
      icon: 'fa-solid fa-lock',
      confirmText: '<i class="fa-solid fa-circle-check"></i> Ya, Validasi & Kunci',
      confirmClass: 'btn-success',
      cancelText: 'Batal'
    });
    if (!confirmed) return;

    try {
      const res = await API.validateScore(scoreId);
      Utils.showToast(res.message, 'success');
      this.loadStandingsAndScores();
    } catch (err) {
      Utils.showToast('Gagal memvalidasi nilai: ' + err.message, 'error');
    }
  },

  async handleUnlockScore(scoreId) {
    const confirmed = await Utils.showConfirmModal({
      title: 'Buka Kunci Penilaian',
      message: '<strong>Apakah Anda yakin ingin membuka kunci penilaian ini?</strong><br><span style="color:#64748b; font-size:0.88rem; margin-top:0.4rem; display:block;">Penilai akan dapat melakukan revisi nilai kembali.</span>',
      icon: 'fa-solid fa-lock-open',
      confirmText: '<i class="fa-solid fa-lock-open"></i> Ya, Buka Kunci',
      confirmClass: 'btn-warning',
      cancelText: 'Batal'
    });
    if (!confirmed) return;

    try {
      const res = await API.unlockScore(scoreId);
      Utils.showToast(res.message, 'success');
      this.loadStandingsAndScores();
    } catch (err) {
      Utils.showToast('Gagal membuka kunci nilai: ' + err.message, 'error');
    }
  },

  async handleDeleteScore(scoreId) {
    const confirmed = await Utils.showConfirmModal({
      title: 'Hapus Data Penilaian',
      message: '<strong>Apakah Anda yakin ingin menghapus data penilaian ini?</strong><br><span style="color:#ef4444; font-size:0.88rem; margin-top:0.4rem; display:block;">Tindakan ini tidak dapat dibatalkan.</span>',
      icon: 'fa-solid fa-trash',
      confirmText: '<i class="fa-solid fa-trash"></i> Ya, Hapus Data',
      confirmClass: 'btn-danger',
      cancelText: 'Batal'
    });
    if (!confirmed) return;

    try {
      const res = await API.deleteScore(scoreId);
      Utils.showToast(res.message, 'success');
      this.loadStandingsAndScores();
      if (this.currentUser && (this.currentUser.role === 'penilai' || this.currentUser.role === 'juri')) {
        this.renderPenilaiPortal();
      }
    } catch (err) {
      Utils.showToast('Gagal menghapus nilai: ' + err.message, 'error');
    }
  },

  // ==========================================================================
  // MANAJEMEN ASPEK PENILAIAN KEGIATAN & PENILAIAN QR SCAN
  // ==========================================================================

  async openManageAspectsModal(eventId = null) {
    try {
      if (!this.cachedEvents || !this.cachedEvents.length) {
        const events = await API.getEvents();
        this.cachedEvents = events || [];
      }

      const select = document.getElementById('manageAspectEventSelect');
      if (select) {
        select.innerHTML = '<option value="">-- Pilih Kegiatan / Lomba --</option>' +
          (this.cachedEvents || []).map(e => `<option value="${e.id}">${Utils.escapeHtml(e.title)} (${e.category || 'Umum'})</option>`).join('');

        if (eventId && eventId !== 'null' && eventId !== 'undefined') {
          select.value = eventId;
          this.loadAspectsForEvent(eventId);
        } else {
          document.getElementById('manageAspectsFormSection').style.display = 'none';
        }
      }

      this.openModal('manageAspectsModal');
    } catch (err) {
      Utils.showToast('Gagal memuat daftar kegiatan: ' + err.message, 'error');
    }
  },

  async loadAspectsForEvent(eventId) {
    const formSection = document.getElementById('manageAspectsFormSection');
    const container = document.getElementById('aspectRowsContainer');
    if (!formSection || !container) return;

    if (!eventId) {
      formSection.style.display = 'none';
      return;
    }

    formSection.style.display = 'block';
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Memuat kriteria aspek penilaian...</p>';

    try {
      const aspects = await API.getEventAspects(eventId);
      container.innerHTML = '';

      if (Array.isArray(aspects) && aspects.length > 0) {
        aspects.forEach(asp => this.addAspectRow(asp));
        this.recalculateAspectsTotalMax();
      } else {
        // Auto detect event type for smart defaults
        const eventObj = (this.cachedEvents || []).find(e => Number(e.id) === Number(eventId));
        const title = (eventObj?.title || '').toLowerCase();

        if (title.includes('pembukaan') || title.includes('penutupan') || title.includes('upacara') || title.includes('apel')) {
          this.applyAspectPreset('seremonial');
        } else if (title.includes('pertolongan') || title.includes('pp')) {
          this.applyAspectPreset('pp');
        } else if (title.includes('seni') || title.includes('pentas') || title.includes('gembira')) {
          this.applyAspectPreset('seni');
        } else {
          this.applyAspectPreset('lomba'); // SIKAP, KETRAMPILAN, PENGETAHUAN, MANAJERIAL
        }
      }
    } catch (err) {
      console.error(err);
      container.innerHTML = '<p style="color: var(--danger-color);">Gagal memuat aspek penilaian.</p>';
    }
  },

  applyAspectPreset(presetType) {
    const container = document.getElementById('aspectRowsContainer');
    if (!container) return;
    container.innerHTML = '';

    if (presetType === 'seremonial') {
      this.addAspectRow({ aspect_name: 'Kelengkapan Kontingen & Atribut', max_score: 50, weight: 1.0 });
      this.addAspectRow({ aspect_name: 'Jumlah & Kehadiran Peserta', max_score: 50, weight: 1.0 });
    } else if (presetType === 'pp') {
      this.addAspectRow({ aspect_name: 'Prosedur Balut Buka & Pembidaian', max_score: 40, weight: 1.0 });
      this.addAspectRow({ aspect_name: 'Keterampilan Evakuasi & Ketangkasan', max_score: 30, weight: 1.0 });
      this.addAspectRow({ aspect_name: 'Kerjasama Tim & Kerapian', max_score: 30, weight: 1.0 });
    } else if (presetType === 'seni') {
      this.addAspectRow({ aspect_name: 'Kreativitas & Kesesuaian Tema', max_score: 35, weight: 1.0 });
      this.addAspectRow({ aspect_name: 'Penampilan & Kekompakan', max_score: 35, weight: 1.0 });
      this.addAspectRow({ aspect_name: 'Etika & Kesopanan', max_score: 30, weight: 1.0 });
    } else {
      // Standard Lomba: SIKAP, KETRAMPILAN, PENGETAHUAN, MANAJERIAL
      this.addAspectRow({ aspect_name: 'SIKAP', max_score: 25, weight: 1.0 });
      this.addAspectRow({ aspect_name: 'KETRAMPILAN', max_score: 30, weight: 1.0 });
      this.addAspectRow({ aspect_name: 'PENGETAHUAN', max_score: 25, weight: 1.0 });
      this.addAspectRow({ aspect_name: 'MANAJERIAL', max_score: 20, weight: 1.0 });
    }

    this.recalculateAspectsTotalMax();
  },

  addAspectRow(aspect = {}) {
    const container = document.getElementById('aspectRowsContainer');
    if (!container) return;

    const rowId = 'asp_row_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const nameVal = aspect.aspect_name || '';
    const maxVal = aspect.max_score !== undefined ? aspect.max_score : 100;

    const rowHtml = `
      <div id="${rowId}" class="aspect-row-item" style="display: flex; gap: 0.5rem; align-items: center; background: #ffffff; padding: 0.6rem; border: 1px solid #e2e8f0; border-radius: 6px;">
        <input type="text" class="form-control aspect-name-input" style="flex: 2; font-size: 0.85rem;" placeholder="Nama Aspek/Kriteria (misal: Balut Buka)" value="${Utils.escapeHtml(nameVal)}" required>
        <div style="display: flex; align-items: center; gap: 0.3rem; flex: 1;">
          <label style="font-size: 0.75rem; color: #475569; white-space: nowrap;">Max:</label>
          <input type="number" class="form-control aspect-max-input" style="font-size: 0.85rem;" min="1" max="100" value="${maxVal}" oninput="App.recalculateAspectsTotalMax()" required>
        </div>
        <button type="button" class="btn btn-outline btn-sm" style="color: #dc2626; border-color: #fca5a5; padding: 0.3rem 0.6rem;" onclick="App.removeAspectRow('${rowId}')">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', rowHtml);
    this.recalculateAspectsTotalMax();
  },

  removeAspectRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
      row.remove();
      this.recalculateAspectsTotalMax();
    }
  },

  recalculateAspectsTotalMax() {
    const maxInputs = document.querySelectorAll('.aspect-max-input');
    let total = 0;
    maxInputs.forEach(input => {
      total += parseFloat(input.value || 0);
    });

    const badge = document.getElementById('aspectsTotalMaxBadge');
    if (badge) {
      badge.textContent = `${total.toFixed(0)} Poin Total`;
      if (total === 100) {
        badge.className = 'badge badge-success';
      } else {
        badge.className = 'badge badge-warning';
      }
    }
  },

  async saveAspectsForSelectedEvent() {
    const select = document.getElementById('manageAspectEventSelect');
    const eventId = select ? select.value : null;

    if (!eventId) {
      Utils.showToast('Pilih kegiatan terlebih dahulu.', 'warning');
      return;
    }

    const rows = document.querySelectorAll('.aspect-row-item');
    const aspects = [];

    rows.forEach(row => {
      const nameInput = row.querySelector('.aspect-name-input');
      const maxInput = row.querySelector('.aspect-max-input');
      if (nameInput && nameInput.value.trim()) {
        aspects.push({
          aspect_name: nameInput.value.trim(),
          max_score: parseFloat(maxInput?.value || 100),
          weight: 1.0
        });
      }
    });

    if (!aspects.length) {
      Utils.showToast('Masukkan minimal 1 aspek penilaian.', 'warning');
      return;
    }

    try {
      const res = await API.saveEventAspects(eventId, aspects);
      Utils.showToast(res.message || 'Aspek penilaian berhasil disimpan!', 'success');
      this.loadEventAspectsOverviewTable();
      this.closeModal('manageAspectsModal');
    } catch (err) {
      Utils.showToast('Gagal menyimpan aspek: ' + err.message, 'error');
    }
  },

  // ==========================================================================
  // PEMBERIAN NILAI KEGIATAN & SCAN QR TARGET
  // ==========================================================================

  async openEventScoringModal(eventId = null) {
    try {
      this.editingScoreId = null;

      if (!this.cachedEvents || !this.cachedEvents.length) {
        const events = await API.getEvents();
        this.cachedEvents = events || [];
      }

      const select = document.getElementById('scoringEventSelect');
      if (select) {
        select.innerHTML = '<option value="">-- Pilih Kegiatan / Sub-Kegiatan --</option>' +
          (this.cachedEvents || []).map(e => `<option value="${e.id}">${Utils.escapeHtml(e.title)} (${e.category || 'Umum'})</option>`).join('');

        if (eventId && eventId !== 'null' && eventId !== 'undefined') {
          select.value = eventId;
          this.onScoringEventChanged(eventId);
        } else {
          document.getElementById('scoringAspectsContainer').innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Pilih kegiatan terlebih dahulu untuk memuat aspek penilaian.</p>';
        }
      }

      // Reset target search & selection
      this.selectedScoringTarget = null;
      document.getElementById('scoringTargetSearchInput').value = '';
      document.getElementById('scoringTargetSearchResults').style.display = 'none';
      document.getElementById('scoringSelectedTargetCard').style.display = 'none';

      const judgeInput = document.getElementById('scoringJudgeNameInput');
      if (judgeInput) {
        judgeInput.value = this.currentUser?.full_name || this.currentUser?.username || 'Penilai PMI';
        const isPenilaiRole = this.currentUser && ['penilai', 'juri', 'panitia'].includes(this.currentUser.role);
        if (isPenilaiRole) {
          judgeInput.disabled = true;
          judgeInput.readOnly = true;
          judgeInput.style.background = '#f1f5f9';
          judgeInput.style.cursor = 'not-allowed';
          judgeInput.title = 'Nama Penilai otomatis terkunci sesuai akun login Anda';
        } else {
          judgeInput.disabled = false;
          judgeInput.readOnly = false;
          judgeInput.style.background = '#ffffff';
          judgeInput.style.cursor = 'text';
        }
      }
      document.getElementById('scoringNotesInput').value = '';

      this.stopScoringCameraQR();
      this.openModal('eventScoringModal');
    } catch (err) {
      Utils.showToast('Gagal memuat modal penilaian: ' + err.message, 'error');
    }
  },

  async openEditScoreModal(scoreId) {
    try {
      const scores = await API.getScores();
      const score = (scores || []).find(s => Number(s.id) === Number(scoreId));
      if (!score) {
        Utils.showToast('Data penilaian tidak ditemukan.', 'error');
        return;
      }

      if ((score.status === 'validated' || score.status === 'final') && this.currentUser?.role !== 'kabupaten') {
        Utils.showToast('Penilaian ini sudah DIVALIDASI oleh Admin Kabupaten dan TERKUNCI. Hanya Admin Kabupaten yang dapat mengubahnya.', 'warning');
        return;
      }

      this.editingScoreId = score.id;

      if (!this.cachedEvents || !this.cachedEvents.length) {
        const events = await API.getEvents();
        this.cachedEvents = events || [];
      }

      const select = document.getElementById('scoringEventSelect');
      if (select) {
        select.innerHTML = '<option value="">-- Pilih Kegiatan / Sub-Kegiatan --</option>' +
          (this.cachedEvents || []).map(e => `<option value="${e.id}">${Utils.escapeHtml(e.title)} (${e.category || 'Umum'})</option>`).join('');
        if (score.event_id) {
          select.value = score.event_id;
        }
      }

      const isPeserta = score.target_type === 'peserta' || !!score.participant_id;
      const radioPeserta = document.querySelector('input[name="scoringTargetType"][value="peserta"]');
      const radioKontingen = document.querySelector('input[name="scoringTargetType"][value="kontingen"]');
      if (isPeserta && radioPeserta) radioPeserta.checked = true;
      if (!isPeserta && radioKontingen) radioKontingen.checked = true;

      this.selectedScoringTarget = {
        type: isPeserta ? 'peserta' : 'kontingen',
        id: isPeserta ? (score.participant_id || score.unit_id) : score.unit_id,
        unit_id: score.unit_id,
        unit_name: score.unit_name,
        full_name: score.participant_name || score.unit_name,
        code: score.participant_code || '',
        level: score.pmr_level
      };

      const card = document.getElementById('scoringSelectedTargetCard');
      if (card) {
        card.style.display = 'block';
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 0.95rem; color: #15803d;">
                <i class="fa-solid ${isPeserta ? 'fa-user-graduate' : 'fa-school-flag'}"></i> ${Utils.escapeHtml(this.selectedScoringTarget.full_name)}
              </strong>
              <div style="font-size: 0.8rem; color: #166534; margin-top: 0.2rem;">
                Kontingen: ${Utils.escapeHtml(score.unit_name)} | Tingkat: ${Utils.escapeHtml(score.pmr_level || 'Wira')}
              </div>
            </div>
            <button type="button" class="btn btn-outline btn-xs" style="color: #dc2626; border-color: #fca5a5;" onclick="App.clearSelectedScoringTarget()">Ganti Target</button>
          </div>
        `;
      }

      await this.onScoringEventChanged(score.event_id);

      if (score.aspect_details && Array.isArray(score.aspect_details)) {
        score.aspect_details.forEach(aspDet => {
          let numInput = null;
          const allAspectInputs = document.querySelectorAll('.scoring-aspect-input');
          allAspectInputs.forEach(inp => {
            const cardTitle = inp.closest('div[style*="background"]')?.querySelector('span')?.textContent?.trim();
            if (cardTitle === aspDet.aspect_name) {
              numInput = inp;
            }
          });
          if (numInput) {
            numInput.value = aspDet.score_val;
            const slider = document.querySelector(`.scoring-aspect-slider[data-aspect-id="${numInput.dataset.aspectId}"]`);
            if (slider) slider.value = aspDet.score_val;
          }
        });
        this.recalculateScoringTotal();
      }

      const judgeInput = document.getElementById('scoringJudgeNameInput');
      if (judgeInput) {
        judgeInput.value = score.judge_name || (this.currentUser?.full_name || this.currentUser?.username || 'Penilai PMI');
        const isPenilaiRole = this.currentUser && ['penilai', 'juri', 'panitia'].includes(this.currentUser.role);
        if (isPenilaiRole) {
          judgeInput.disabled = true;
          judgeInput.readOnly = true;
          judgeInput.style.background = '#f1f5f9';
          judgeInput.style.cursor = 'not-allowed';
          judgeInput.title = 'Nama Penilai otomatis terkunci sesuai akun login Anda';
        } else {
          judgeInput.disabled = false;
          judgeInput.readOnly = false;
          judgeInput.style.background = '#ffffff';
          judgeInput.style.cursor = 'text';
        }
      }
      document.getElementById('scoringNotesInput').value = score.notes || '';

      this.stopScoringCameraQR();
      this.openModal('eventScoringModal');
    } catch (err) {
      Utils.showToast('Gagal memuat form edit penilaian: ' + err.message, 'error');
    }
  },

  async onScoringEventChanged(eventId) {
    const container = document.getElementById('scoringAspectsContainer');
    if (!container) return;

    if (!eventId) {
      container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Pilih kegiatan terlebih dahulu untuk memuat aspek penilaian.</p>';
      return;
    }

    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Memuat aspek penilaian kegiatan...</p>';

    try {
      let aspects = await API.getEventAspects(eventId);
      if (!Array.isArray(aspects) || aspects.length === 0) {
        const eventObj = (this.cachedEvents || []).find(e => Number(e.id) === Number(eventId));
        const title = (eventObj?.title || '').toLowerCase();

        if (title.includes('pembukaan') || title.includes('penutupan') || title.includes('upacara') || title.includes('apel')) {
          aspects = [
            { id: 1, aspect_name: 'Kelengkapan Kontingen & Atribut', max_score: 50 },
            { id: 2, aspect_name: 'Jumlah & Kehadiran Peserta', max_score: 50 }
          ];
        } else if (title.includes('pertolongan') || title.includes('pp')) {
          aspects = [
            { id: 1, aspect_name: 'Prosedur Balut Buka & Pembidaian', max_score: 40 },
            { id: 2, aspect_name: 'Keterampilan Evakuasi & Ketangkasan', max_score: 30 },
            { id: 3, aspect_name: 'Kerjasama Tim & Kerapian', max_score: 30 }
          ];
        } else if (title.includes('seni') || title.includes('pentas') || title.includes('gembira')) {
          aspects = [
            { id: 1, aspect_name: 'Kreativitas & Kesesuaian Tema', max_score: 35 },
            { id: 2, aspect_name: 'Penampilan & Kekompakan', max_score: 35 },
            { id: 3, aspect_name: 'Etika & Kesopanan', max_score: 30 }
          ];
        } else {
          // Standard Lomba: SIKAP, KETRAMPILAN, PENGETAHUAN, MANAJERIAL
          aspects = [
            { id: 1, aspect_name: 'SIKAP', max_score: 25 },
            { id: 2, aspect_name: 'KETRAMPILAN', max_score: 30 },
            { id: 3, aspect_name: 'PENGETAHUAN', max_score: 25 },
            { id: 4, aspect_name: 'MANAJERIAL', max_score: 20 }
          ];
        }
      }

      this.currentScoringAspects = aspects;

      let html = '<div style="display: flex; flex-direction: column; gap: 0.85rem;">';
      aspects.forEach(asp => {
        const maxVal = parseFloat(asp.max_score || 100);
        html += `
          <div style="background: #f8fafc; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <span style="font-weight: 700; font-size: 0.88rem; color: #1e293b;">${Utils.escapeHtml(asp.aspect_name)}</span>
              <span class="badge badge-info" style="font-size: 0.78rem;">Max: ${maxVal} Poin</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
              <button type="button" class="btn btn-outline btn-xs" onclick="App.adjustAspectScore('${asp.id}', -5)" style="font-weight: 800; padding: 4px 8px; border-color: #cbd5e1; font-size: 0.75rem;">-5</button>
              <button type="button" class="btn btn-outline btn-xs" onclick="App.adjustAspectScore('${asp.id}', -1)" style="font-weight: 800; padding: 4px 8px; border-color: #cbd5e1; font-size: 0.75rem;">-1</button>
              <input type="range" class="form-control-range scoring-aspect-slider" data-aspect-id="${asp.id}" min="0" max="${maxVal}" step="0.5" value="${maxVal}" style="flex: 1; min-width: 80px;" oninput="App.onAspectSliderChanged(this)">
              <input type="number" class="form-control scoring-aspect-input" data-aspect-id="${asp.id}" min="0" max="${maxVal}" step="0.5" value="${maxVal}" style="width: 68px; font-size: 0.9rem; font-weight: 700; text-align: center; padding: 4px;" oninput="App.onAspectNumberChanged(this)" required>
              <button type="button" class="btn btn-outline btn-xs" onclick="App.adjustAspectScore('${asp.id}', 1)" style="font-weight: 800; padding: 4px 8px; border-color: #cbd5e1; font-size: 0.75rem;">+1</button>
              <button type="button" class="btn btn-outline btn-xs" onclick="App.adjustAspectScore('${asp.id}', 5)" style="font-weight: 800; padding: 4px 8px; border-color: #cbd5e1; font-size: 0.75rem;">+5</button>
            </div>
          </div>
        `;
      });
      html += '</div>';

      container.innerHTML = html;
      this.recalculateScoringTotal();
    } catch (err) {
      console.error(err);
      container.innerHTML = '<p style="color: var(--danger-color);">Gagal memuat kriteria penilaian.</p>';
    }
  },

  adjustAspectScore(aspectId, delta) {
    const numInput = document.querySelector(`.scoring-aspect-input[data-aspect-id="${aspectId}"]`);
    const slider = document.querySelector(`.scoring-aspect-slider[data-aspect-id="${aspectId}"]`);
    if (numInput) {
      const maxVal = parseFloat(numInput.max || 100);
      const minVal = parseFloat(numInput.min || 0);
      let current = parseFloat(numInput.value || 0);
      current = Math.min(maxVal, Math.max(minVal, current + delta));
      numInput.value = current;
      if (slider) slider.value = current;
      this.recalculateScoringTotal();
    }
  },

  onAspectSliderChanged(slider) {
    const aspId = slider.dataset.aspectId;
    const numInput = document.querySelector(`.scoring-aspect-input[data-aspect-id="${aspId}"]`);
    if (numInput) {
      numInput.value = slider.value;
    }
    this.recalculateScoringTotal();
  },

  onAspectNumberChanged(numInput) {
    const aspId = numInput.dataset.aspectId;
    const slider = document.querySelector(`.scoring-aspect-slider[data-aspect-id="${aspId}"]`);
    if (slider) {
      slider.value = numInput.value;
    }
    this.recalculateScoringTotal();
  },

  recalculateScoringTotal() {
    const inputs = document.querySelectorAll('.scoring-aspect-input');
    let total = 0;
    inputs.forEach(inp => {
      total += parseFloat(inp.value || 0);
    });

    const liveBadge = document.getElementById('scoringAspectsLiveTotalBadge');
    if (liveBadge) {
      liveBadge.textContent = `Total: ${total.toFixed(1)} Poin`;
    }

    let grade = 'Peserta';
    let gradeBg = '#64748b';
    if (total >= 90) { grade = '🥇 Medali EMAS'; gradeBg = '#d97706'; }
    else if (total >= 80) { grade = '🥈 Medali PERAK'; gradeBg = '#475569'; }
    else if (total >= 70) { grade = '🥉 Medali PERUNGGU'; gradeBg = '#b45309'; }

    const gradeBadge = document.getElementById('scoringGradeBadgePreview');
    if (gradeBadge) {
      gradeBadge.textContent = grade;
      gradeBadge.style.background = gradeBg;
      gradeBadge.style.color = '#ffffff';
    }
  },

  onScoringTargetTypeChanged() {
    this.selectedScoringTarget = null;
    document.getElementById('scoringTargetSearchInput').value = '';
    document.getElementById('scoringTargetSearchResults').style.display = 'none';
    document.getElementById('scoringSelectedTargetCard').style.display = 'none';
  },

  async searchScoringTarget(e) {
    if (e && e.key === 'Enter') {
      e.preventDefault();
      this.searchScoringTargetManual();
      return;
    }

    const q = document.getElementById('scoringTargetSearchInput').value.trim();
    const resultsContainer = document.getElementById('scoringTargetSearchResults');
    if (!q || q.length < 2) {
      resultsContainer.style.display = 'none';
      return;
    }

    const targetTypeRadio = document.querySelector('input[name="scoringTargetType"]:checked');
    const targetType = targetTypeRadio ? targetTypeRadio.value : 'peserta';

    try {
      const res = await API.lookupScoreTarget(q, targetType);
      const items = res.results || [];

      if (!items.length) {
        resultsContainer.innerHTML = '<div style="padding: 0.6rem 0.8rem; font-size: 0.82rem; color: #64748b;">Target tidak ditemukan.</div>';
        resultsContainer.style.display = 'block';
        return;
      }

      let html = '';
      items.forEach(item => {
        if (targetType === 'kontingen') {
          html += `
            <div style="padding: 0.6rem 0.8rem; border-bottom: 1px solid #f1f5f9; cursor: pointer;" onclick='App.selectScoringTarget(${JSON.stringify(item)})'>
              <div style="font-weight: 700; font-size: 0.88rem; color: #0f172a;"><i class="fa-solid fa-school-flag" style="color: #ea580c;"></i> ${Utils.escapeHtml(item.unit_name)}</div>
              <div style="font-size: 0.78rem; color: #64748b;">Kategori: ${Utils.escapeHtml(item.level_category || '-')} | Peserta Verified: ${item.participant_count || 0} orang</div>
            </div>
          `;
        } else {
          html += `
            <div style="padding: 0.6rem 0.8rem; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; align-items: center; gap: 0.6rem;" onclick='App.selectScoringTarget(${JSON.stringify(item)})'>
              <img src="${item.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
              <div>
                <div style="font-weight: 700; font-size: 0.88rem; color: #0f172a;">${Utils.escapeHtml(item.full_name)} (${item.code || '-'})</div>
                <div style="font-size: 0.78rem; color: #64748b;">Unit: ${Utils.escapeHtml(item.unit_name)} | Tingkat: ${item.level || '-'}</div>
              </div>
            </div>
          `;
        }
      });

      resultsContainer.innerHTML = html;
      resultsContainer.style.display = 'block';
    } catch (err) {
      console.error(err);
    }
  },

  searchScoringTargetManual() {
    const input = document.getElementById('scoringTargetSearchInput');
    if (input && input.value.trim()) {
      this.searchScoringTarget({ key: 'Enter', preventDefault: () => { } });
    }
  },

  selectScoringTarget(item) {
    this.selectedScoringTarget = item;
    document.getElementById('scoringTargetSearchResults').style.display = 'none';

    const card = document.getElementById('scoringSelectedTargetCard');
    if (!card) return;

    const targetTypeRadio = document.querySelector('input[name="scoringTargetType"]:checked');
    const targetType = targetTypeRadio ? targetTypeRadio.value : 'peserta';

    if (targetType === 'kontingen') {
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #166534;">
              <i class="fa-solid fa-circle-check"></i> Target Kontingen: ${Utils.escapeHtml(item.unit_name)}
            </div>
            <div style="font-size: 0.8rem; color: #15803d; margin-top: 0.2rem;">
              Kategori Jenjang: ${Utils.escapeHtml(item.level_category || '-')} | ID Unit: #${item.unit_id || item.id}
            </div>
          </div>
          <button type="button" class="btn btn-outline btn-sm" style="font-size: 0.75rem; color: #dc2626;" onclick="App.onScoringTargetTypeChanged()">Ganti Target</button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${item.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 2px solid #22c55e;">
            <div>
              <div style="font-weight: 800; font-size: 0.95rem; color: #166534;">
                <i class="fa-solid fa-circle-check"></i> ${Utils.escapeHtml(item.full_name)}
              </div>
              <div style="font-size: 0.8rem; color: #15803d; margin-top: 0.1rem;">
                ID: <strong>${item.code}</strong> | Unit: ${Utils.escapeHtml(item.unit_name)} | PMR: ${item.level || '-'}
              </div>
            </div>
          </div>
          <button type="button" class="btn btn-outline btn-sm" style="font-size: 0.75rem; color: #dc2626;" onclick="App.onScoringTargetTypeChanged()">Ganti Target</button>
        </div>
      `;
    }

    card.style.display = 'block';
  },

  toggleScoringCameraQR() {
    const container = document.getElementById('scoringCameraQRContainer');
    if (!container) return;

    if (container.style.display === 'block') {
      this.stopScoringCameraQR();
      return;
    }

    container.style.display = 'block';

    if (typeof Html5Qrcode === 'undefined') {
      Utils.showToast('Pustaka scanner camera QR belum siap.', 'warning');
      return;
    }

    try {
      if (this.scoringQrScanner) {
        this.scoringQrScanner.clear();
      }

      this.scoringQrScanner = new Html5Qrcode("scoringQrVideoReader");
      this.scoringQrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          this.stopScoringCameraQR();
          Utils.showToast('QR Code Terdeteksi: ' + decodedText, 'info');
          document.getElementById('scoringTargetSearchInput').value = decodedText;

          const res = await API.lookupScoreTarget(decodedText, 'peserta');
          const items = res.results || [];
          if (items.length) {
            this.selectScoringTarget(items[0]);
          } else {
            Utils.showToast('Peserta dengan QR tersebut tidak ditemukan.', 'warning');
          }
        },
        (errorMessage) => {
          // Frame ignore
        }
      ).catch(err => {
        console.error('Camera QR start error:', err);
        Utils.showToast('Gagal membuka kamera: ' + err.message, 'warning');
      });
    } catch (e) {
      console.error(e);
    }
  },

  stopScoringCameraQR() {
    const container = document.getElementById('scoringCameraQRContainer');
    if (container) container.style.display = 'none';

    if (this.scoringQrScanner) {
      try {
        this.scoringQrScanner.stop().then(() => {
          this.scoringQrScanner.clear();
          this.scoringQrScanner = null;
        }).catch(err => {
          this.scoringQrScanner = null;
        });
      } catch (e) {
        this.scoringQrScanner = null;
      }
    }
  },

  async handleSaveAspectScoring(e) {
    e.preventDefault();

    const eventSelect = document.getElementById('scoringEventSelect');
    const eventId = eventSelect ? parseInt(eventSelect.value) : null;
    if (!eventId) {
      Utils.showToast('Pilih kegiatan terlebih dahulu.', 'warning');
      return;
    }

    if (!this.selectedScoringTarget) {
      Utils.showToast('Pilih atau Scan QR Code target peserta/kontingen terlebih dahulu.', 'warning');
      return;
    }

    const eventObj = (this.cachedEvents || []).find(ev => Number(ev.id) === Number(eventId));
    const branchName = eventObj ? eventObj.title : (eventSelect.options[eventSelect.selectedIndex]?.text || 'Kegiatan Jumbara');
    const catType = eventObj ? (eventObj.category || 'Jumpa') : 'Jumpa';
    const pmrLevel = this.selectedScoringTarget.level || eventObj?.pmr_level || 'Wira';

    const aspectInputs = document.querySelectorAll('.scoring-aspect-input');
    const aspectScores = {};
    aspectInputs.forEach(inp => {
      const aspId = inp.dataset.aspectId;
      if (aspId) {
        aspectScores[aspId] = parseFloat(inp.value || 0);
      }
    });

    const targetTypeRadio = document.querySelector('input[name="scoringTargetType"]:checked');
    const targetType = targetTypeRadio ? targetTypeRadio.value : 'peserta';

    const payload = {
      id: this.editingScoreId || null,
      score_id: this.editingScoreId || null,
      event_id: eventId,
      unit_id: parseInt(this.selectedScoringTarget.unit_id || this.selectedScoringTarget.id),
      participant_id: targetType === 'peserta' ? parseInt(this.selectedScoringTarget.id) : null,
      target_type: targetType,
      category_type: catType,
      pmr_level: pmrLevel,
      branch_name: branchName,
      aspect_scores: aspectScores,
      judge_name: document.getElementById('scoringJudgeNameInput').value.trim() || 'Tim Juri KSR PMI',
      notes: document.getElementById('scoringNotesInput').value.trim()
    };

    try {
      const res = await API.addScore(payload);
      const isEdit = !!this.editingScoreId;
      this.editingScoreId = null;

      Utils.showToast(isEdit ? 'Revisi nilai draft berhasil disimpan!' : `Penilaian kegiatan berhasil disimpan! Skor: ${res.score_val} (${res.grade})`, 'success');
      this.closeModal('eventScoringModal');
      this.loadStandingsAndScores();
      if (this.currentUser && (this.currentUser.role === 'penilai' || this.currentUser.role === 'juri')) {
        this.renderPenilaiPortal();
      }
    } catch (err) {
      Utils.showToast('Gagal menyimpan penilaian: ' + err.message, 'error');
    }
  },

  async openEventModal(eventId = null) {
    if (typeof eventId === 'object' || eventId === 'undefined') eventId = null;
    let eventObj = null;
    if (eventId) {
      if (this.cachedEvents && this.cachedEvents.length) {
        eventObj = this.cachedEvents.find(e => Number(e.id) === Number(eventId));
      }
      if (!eventObj) {
        try {
          const events = await API.getEvents();
          this.cachedEvents = events;
          eventObj = (events || []).find(e => Number(e.id) === Number(eventId));
        } catch (err) {
          console.error('Error fetching event details:', err);
        }
      }
    }

    const eventIdInput = document.getElementById('eventIdInput');
    const titleInput = document.getElementById('eventTitleInput');
    const categorySelect = document.getElementById('eventCategorySelect');
    const levelSelect = document.getElementById('eventLevelSelect');
    const quotaInput = document.getElementById('eventQuotaInput');
    const locationInput = document.getElementById('eventLocationInput');
    const dateInput = document.getElementById('eventDateInput');
    const startTimeInput = document.getElementById('eventStartTimeInput');
    const endTimeInput = document.getElementById('eventEndTimeInput');
    const picInput = document.getElementById('eventPicInput');
    const descInput = document.getElementById('eventDescriptionInput');

    if (eventIdInput) eventIdInput.value = eventObj ? eventObj.id : '';
    if (titleInput) titleInput.value = eventObj ? eventObj.title : '';
    if (categorySelect) categorySelect.value = eventObj ? eventObj.category : 'Umum';
    if (levelSelect) levelSelect.value = eventObj ? eventObj.pmr_level : 'Semua';
    if (quotaInput) quotaInput.value = eventObj ? (eventObj.max_participants_per_unit || 0) : 0;
    if (locationInput) locationInput.value = eventObj ? (eventObj.location || '') : 'Lapangan Utama Buperta';
    if (dateInput) dateInput.value = eventObj && eventObj.event_date ? eventObj.event_date.substring(0, 10) : '2026-10-15';
    if (startTimeInput) startTimeInput.value = eventObj && eventObj.start_time ? eventObj.start_time.substring(0, 5) : '08:00';
    if (endTimeInput) endTimeInput.value = eventObj && eventObj.end_time ? eventObj.end_time.substring(0, 5) : '12:00';
    if (picInput) picInput.value = eventObj ? (eventObj.pic_name || '') : 'Panitia Pelaksana PMI';
    if (descInput) descInput.value = eventObj ? (eventObj.description || '') : '';

    const titleEl = document.getElementById('eventModalTitle');
    if (titleEl) {
      titleEl.innerHTML = eventObj
        ? `<i class="fa-solid fa-pen-to-square"></i> Edit Agenda Kegiatan & Kuota Unit`
        : `<i class="fa-solid fa-calendar-plus"></i> Tambah Agenda Kegiatan Baru & Kuota Unit`;
    }

    this.openModal('eventModal');
  },

  async handleSaveEvent(e) {
    e.preventDefault();
    const id = document.getElementById('eventIdInput')?.value;
    const title = document.getElementById('eventTitleInput')?.value.trim();
    const category = document.getElementById('eventCategorySelect')?.value;
    const pmr_level = document.getElementById('eventLevelSelect')?.value;
    const max_participants_per_unit = Number(document.getElementById('eventQuotaInput')?.value || 0);
    const location = document.getElementById('eventLocationInput')?.value.trim();
    const event_date = document.getElementById('eventDateInput')?.value;
    const start_time = document.getElementById('eventStartTimeInput')?.value;
    const end_time = document.getElementById('eventEndTimeInput')?.value;
    const pic_name = document.getElementById('eventPicInput')?.value.trim();
    const description = document.getElementById('eventDescriptionInput')?.value.trim();

    if (!title || !event_date) {
      Utils.showToast('Judul dan tanggal kegiatan wajib diisi.', 'error');
      return;
    }

    try {
      const payload = {
        id: id ? Number(id) : null,
        title, category, pmr_level, max_participants_per_unit,
        location, event_date, start_time, end_time, pic_name, description
      };
      const res = await API.createEvent(payload);
      Utils.showToast(res.message || 'Agenda & kuota berhasil disimpan!', 'success');
      this.closeModal('eventModal');
      this.loadCommonData();
      if (this.currentUser && this.currentUser.role === 'kabupaten') this.loadManageEvents();
      if (this.currentUser && this.currentUser.role === 'unit') this.loadUnitEvents();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async deleteEvent(id) {
    if (!confirm('Hapus jadwal kegiatan ini?')) return;
    try {
      await API.deleteEvent(id);
      Utils.showToast('Jadwal dihapus.', 'info');
      this.loadCommonData();
      this.loadManageEvents();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async openAddAnnouncementPrompt() {
    const title = prompt("Judul Pengumuman:");
    if (!title) return;
    const content = prompt("Isi Pengumuman / Informasi:");
    if (!content) return;

    try {
      await API.createAnnouncement({ title, content, priority: 'important' });
      Utils.showToast('Pengumuman dipublikasikan', 'success');
      this.loadManageAnnouncements();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async deleteAnnouncement(id) {
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
      await API.deleteAnnouncement(id);
      Utils.showToast('Pengumuman dihapus.', 'info');
      this.loadManageAnnouncements();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  // Export Data
  async exportPesertaCSV() {
    try {
      const parts = await API.getParticipants();
      Utils.exportToCSV('data_peserta_jumbara_2026', parts);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async exportStandingsCSV() {
    try {
      const standings = await API.getStandings();
      Utils.exportToCSV('klasemen_medali_jumbara_2026', standings);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  // Modal Open / Close Helpers
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      modal.style.display = 'flex';
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
      modal.style.zIndex = '10000';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
    }
  },

  handleMobileNav(key) {
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));

    const btnIdMap = {
      'beranda': 'mbNavHome',
      'kegiatan': 'mbNavAgenda',
      'pengumuman': 'mbNavAnnounce',
      'klasemen': 'mbNavStandings',
      'portal': 'mbNavPortal',
      'peserta_bio': 'mbNavBio',
      'peserta_lomba': 'mbNavLomba',
      'peserta_agenda': 'mbNavPesertaAgenda',
      'peserta_presensi': 'mbNavPresensi',
      'penilai_presensi': 'mbNavPenilaiScan',
      'penilai_nilai': 'mbNavPenilaiNilai',
      'penilai_rekap': 'mbNavPenilaiRekap',
      'admin_dashboard': 'mbNavAdminDash',
      'admin_peserta': 'mbNavAdminPeserta',
      'admin_agenda': 'mbNavAdminAgenda',
      'admin_nilai': 'mbNavAdminNilai',
      'logout': 'mbNavLogout'
    };

    const targetId = btnIdMap[key];
    if (targetId && document.getElementById(targetId)) {
      document.getElementById(targetId).classList.add('active');
    }

    if (key === 'logout') {
      this.handleLogout();
      return;
    }

    if (key === 'peserta_bio') {
      this.switchPesertaMobileTab('bio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (key === 'peserta_lomba') {
      this.switchPesertaMobileTab('lomba');
    } else if (key === 'peserta_agenda') {
      this.switchPesertaMobileTab('agenda');
    } else if (key === 'peserta_presensi') {
      this.switchPesertaMobileTab('presensi');
    } else if (key === 'peserta_medali') {
      this.switchPesertaMobileTab('medali');
    } else if (key === 'penilai_presensi') {
      this.switchPenilaiSubTab('presensi');
    } else if (key === 'penilai_nilai') {
      this.openEventScoringModal();
    } else if (key === 'penilai_rekap') {
      this.switchPenilaiSubTab('input');
    } else if (key === 'peninjau_profil') {
      this.switchPeninjauMobileTab('info');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (key === 'peninjau_agenda') {
      this.switchPeninjauMobileTab('agenda');
    } else if (key === 'peninjau_medali') {
      this.switchPeninjauMobileTab('medali');
    } else if (key === 'peninjau_lokasi') {
      this.switchPeninjauMobileTab('lokasi');
    } else if (key === 'admin_dashboard') {
      if (this.currentUser && (this.currentUser.role === 'unit' || this.currentUser.role === 'admin_unit')) {
        this.switchUnitTab('peserta');
      } else {
        this.switchAdminCategory('peserta');
      }
    } else if (key === 'admin_peserta') {
      if (this.currentUser && (this.currentUser.role === 'unit' || this.currentUser.role === 'admin_unit')) {
        this.switchUnitTab('peserta');
      } else {
        this.switchAdminTab('verifikasi');
      }
    } else if (key === 'admin_agenda') {
      if (this.currentUser && (this.currentUser.role === 'unit' || this.currentUser.role === 'admin_unit')) {
        this.switchUnitTab('jadwal');
      } else {
        this.switchAdminTab('jadwal');
      }
    } else if (key === 'admin_nilai') {
      if (this.currentUser && (this.currentUser.role === 'unit' || this.currentUser.role === 'admin_unit')) {
        this.switchUnitTab('piagam');
      } else {
        this.switchAdminTab('aspek');
      }
    } else if (key === 'beranda') {
      this.scrollToSection('beranda');
    } else if (key === 'kegiatan') {
      this.scrollToSection('kegiatan');
    } else if (key === 'pengumuman') {
      this.scrollToSection('pengumuman');
    } else if (key === 'klasemen') {
      this.scrollToSection('klasemen');
    } else if (key === 'portal') {
      if (this.currentUser) {
        this.renderView();
      } else {
        this.openLoginModal();
      }
    }
  },

  renderMobileBottomNav() {
    const nav = document.getElementById('mobileBottomNav');
    if (!nav) return;

    if (!this.currentUser) {
      nav.style.display = 'none';
      nav.innerHTML = '';
      return;
    }

    const role = this.currentUser.role;
    const isDesktopAdmin = ['kabupaten', 'admin_kabupaten', 'super_admin', 'unit', 'admin_unit', 'panitia'].includes(role);

    // ADMIN TETAP DESKTOP: Jangan pernah tampilkan bottom nav bar untuk Admin!
    if (isDesktopAdmin) {
      nav.style.display = 'none';
      nav.innerHTML = '';
      return;
    }

    if (role === 'peninjau') {
      // PENINJAU RESMI BOTTOM NAV
      nav.style.display = 'flex';
      nav.innerHTML = `
        <button class="mobile-nav-btn active" id="mbNavPeninjauProfil" onclick="App.handleMobileNav('peninjau_profil')">
          <i class="fa-solid fa-user-tie"></i>
          <span>Profil</span>
        </button>
        <button class="mobile-nav-btn" id="mbNavPeninjauAgenda" onclick="App.handleMobileNav('peninjau_agenda')">
          <i class="fa-solid fa-calendar-days"></i>
          <span>Agenda</span>
        </button>
        <button class="mobile-nav-btn" id="mbNavPeninjauMedali" onclick="App.handleMobileNav('peninjau_medali')">
          <i class="fa-solid fa-trophy"></i>
          <span>Medali</span>
        </button>
        <button class="mobile-nav-btn" id="mbNavPeninjauLokasi" onclick="App.handleMobileNav('peninjau_lokasi')">
          <i class="fa-solid fa-map-location-dot"></i>
          <span>Lokasi</span>
        </button>
        <button class="mobile-nav-btn" id="mbNavLogout" onclick="App.handleMobileNav('logout')" style="color: #ef4444;">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>Keluar</span>
        </button>
      `;
    } else if (['penilai', 'juri'].includes(role)) {
      // PENILAI / JURI BOTTOM NAV
      nav.style.display = 'flex';
      nav.innerHTML = `
        <button class="mobile-nav-btn active" id="mbNavPenilaiScan" onclick="App.handleMobileNav('penilai_presensi')">
          <i class="fa-solid fa-qrcode"></i>
          <span>Scanner</span>
        </button>
        <button class="mobile-nav-btn" id="mbNavPenilaiNilai" onclick="App.handleMobileNav('penilai_nilai')">
          <i class="fa-solid fa-pen-to-square"></i>
          <span>Nilai</span>
        </button>
        <button class="mobile-nav-btn" id="mbNavPenilaiRekap" onclick="App.handleMobileNav('penilai_rekap')">
          <i class="fa-solid fa-chart-simple"></i>
          <span>Rekap</span>
        </button>
        <button class="mobile-nav-btn" id="mbNavLogout" onclick="App.handleMobileNav('logout')" style="color: #ef4444;">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>Keluar</span>
        </button>
      `;
    } else {
      // PESERTA (Default User Mobile Portal)
      nav.style.display = 'flex';
      nav.innerHTML = `
        <button class="mobile-nav-btn active" id="mbNavBio" onclick="App.handleMobileNav('peserta_bio')">
          <i class="fa-solid fa-id-badge"></i>
          <span>Profil</span>
        </button>
        <button class="mobile-nav-btn" id="mbNavLomba" onclick="App.handleMobileNav('peserta_lomba')">
          <i class="fa-solid fa-award"></i>
          <span>Cabang</span>
        </button>
        <button class="mobile-nav-btn" id="mbNavPesertaAgenda" onclick="App.handleMobileNav('peserta_agenda')">
          <i class="fa-solid fa-calendar-days"></i>
          <span>Agenda</span>
        </button>
        <button class="mobile-nav-btn" id="mbNavPresensi" onclick="App.handleMobileNav('peserta_presensi')">
          <i class="fa-solid fa-clipboard-user"></i>
          <span>Presensi</span>
        </button>
        <button class="mobile-nav-btn" id="mbNavPesertaMedali" onclick="App.handleMobileNav('peserta_medali')">
          <i class="fa-solid fa-trophy"></i>
          <span>Medali</span>
        </button>
        <button class="mobile-nav-btn" id="mbNavLogout" onclick="App.handleMobileNav('logout')" style="color: #ef4444;">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>Keluar</span>
        </button>
      `;
    }
  },

  renderFooterNav() {
    const list = document.getElementById('footerQuickLinks');
    const accBox = document.getElementById('footerAccountBox');

    if (!this.currentUser) {
      if (list) {
        list.innerHTML = `
          <li><a href="#beranda" onclick="App.scrollToSection('beranda', event)"><i class="fa-solid fa-house"></i> Beranda & Jumbotron</a></li>
          <li><a href="#kegiatan" onclick="App.scrollToSection('kegiatan', event)"><i class="fa-solid fa-calendar-days"></i> Jadwal & Rundown</a></li>
          <li><a href="#materi" onclick="App.scrollToSection('materi', event)"><i class="fa-solid fa-book-bookmark"></i> Unduh Materi & Juknis</a></li>
          <li><a href="#pengumuman" onclick="App.scrollToSection('pengumuman', event)"><i class="fa-solid fa-bullhorn"></i> Papan Pengumuman</a></li>
          <li><a href="#klasemen" onclick="App.scrollToSection('klasemen', event)"><i class="fa-solid fa-trophy"></i> Perolehan Medali</a></li>
          <li><a href="#lokasi" onclick="App.scrollToSection('lokasi', event)"><i class="fa-solid fa-map-location-dot"></i> Peta & Lokasi Buperta</a></li>
          <li><a href="javascript:void(0)" onclick="App.openFeedbackModal()"><i class="fa-solid fa-comment-dots"></i> Kotak Saran & Aspirasi</a></li>
          <li><a href="javascript:void(0)" onclick="App.openLoginModal()" style="color: #ef4444; font-weight: 700;"><i class="fa-solid fa-right-to-bracket"></i> Login Portal</a></li>
        `;
      }
      if (accBox) accBox.innerHTML = '';
    } else {
      const role = this.currentUser.role;
      if (list) {
        if (['kabupaten', 'admin_kabupaten', 'super_admin'].includes(role)) {
          list.innerHTML = `
            <li><a href="javascript:void(0)" onclick="App.switchAdminCategory('peserta')"><i class="fa-solid fa-users"></i> Kelola & Verifikasi Peserta</a></li>
            <li><a href="javascript:void(0)" onclick="App.switchAdminCategory('agenda')"><i class="fa-solid fa-calendar-days"></i> Agenda & Presensi Jumbara</a></li>
            <li><a href="javascript:void(0)" onclick="App.switchAdminCategory('agenda', 'materi')"><i class="fa-solid fa-book-bookmark"></i> Kelola & Unduh Materi</a></li>
            <li><a href="javascript:void(0)" onclick="App.switchAdminCategory('agenda', 'feedback')"><i class="fa-solid fa-comments"></i> Kotak Saran & Aspirasi</a></li>
            <li><a href="javascript:void(0)" onclick="App.switchAdminCategory('penilaian')"><i class="fa-solid fa-trophy"></i> Penilaian & Rekap Medali</a></li>
            <li><a href="javascript:void(0)" onclick="App.switchAdminCategory('pengaturan')"><i class="fa-solid fa-gear"></i> Pengaturan Aplikasi</a></li>
            <li><a href="javascript:void(0)" onclick="App.handleLogout()" style="color: #ef4444; font-weight: 700;"><i class="fa-solid fa-right-from-bracket"></i> Keluar / Logout Sistem</a></li>
          `;
        } else if (['unit', 'admin_unit'].includes(role)) {
          list.innerHTML = `
            <li><a href="javascript:void(0)" onclick="App.switchUnitTab('peserta')"><i class="fa-solid fa-users"></i> Data Peserta Sekolah</a></li>
            <li><a href="javascript:void(0)" onclick="App.switchUnitTab('jadwal')"><i class="fa-solid fa-calendar-days"></i> Pendaftaran Kegiatan</a></li>
            <li><a href="#materi" onclick="App.scrollToSection('materi', event)"><i class="fa-solid fa-book-bookmark"></i> Unduh Materi & Juknis</a></li>
            <li><a href="javascript:void(0)" onclick="App.openFeedbackModal()"><i class="fa-solid fa-comment-dots"></i> Kotak Saran & Aspirasi</a></li>
            <li><a href="javascript:void(0)" onclick="App.switchUnitTab('piagam')"><i class="fa-solid fa-certificate"></i> Cetak Piagam Unit</a></li>
            <li><a href="javascript:void(0)" onclick="App.handleLogout()" style="color: #ef4444; font-weight: 700;"><i class="fa-solid fa-right-from-bracket"></i> Keluar / Logout Sistem</a></li>
          `;
        } else {
          list.innerHTML = `
            <li><a href="javascript:void(0)" onclick="App.renderView()"><i class="fa-solid fa-id-badge"></i> Portal Peserta</a></li>
            <li><a href="#beranda" onclick="App.scrollToSection('beranda', event)"><i class="fa-solid fa-house"></i> Beranda Publik</a></li>
            <li><a href="#kegiatan" onclick="App.scrollToSection('kegiatan', event)"><i class="fa-solid fa-calendar-days"></i> Jadwal Kegiatan</a></li>
            <li><a href="#materi" onclick="App.scrollToSection('materi', event)"><i class="fa-solid fa-book-bookmark"></i> Unduh Materi & Juknis</a></li>
            <li><a href="javascript:void(0)" onclick="App.openFeedbackModal()"><i class="fa-solid fa-comment-dots"></i> Kotak Saran & Aspirasi</a></li>
            <li><a href="javascript:void(0)" onclick="App.handleLogout()" style="color: #ef4444; font-weight: 700;"><i class="fa-solid fa-right-from-bracket"></i> Keluar / Logout</a></li>
          `;
        }
      }

      if (accBox) {
        accBox.innerHTML = `
          <div style="background: rgba(15, 23, 42, 0.05); border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.6rem 0.75rem; font-size: 0.82rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
            <div>
              <span style="color: #64748b;">Login:</span> <strong>${Utils.escapeHtml(this.currentUser.username)}</strong>
            </div>
            <button class="btn btn-danger btn-xs" onclick="App.handleLogout()" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">
              <i class="fa-solid fa-right-from-bracket"></i> Keluar
            </button>
          </div>
        `;
      }
    }
  },

  openLoginModal() {
    const alertBox = document.getElementById('loginAlertBox');
    if (alertBox) {
      alertBox.style.display = 'none';
      alertBox.innerHTML = '';
    }
    this.openModal('loginModal');
  },

  openRegisterModal() {
    this.renderRegisterPage();
  },

  openAddParticipantModal() {
    this.renderRegisterPage();
  },

  toggleDisabilityTypeField(val) {
    const el = document.getElementById('fullRegDisabilityTypeGroup');
    if (el) {
      el.style.display = val === 'Ya' ? 'block' : 'none';
    }
  },

  handleRegistrationTypeChange(val) {
    const levelGroup = document.getElementById('fullRegLevelGroup');
    if (levelGroup) {
      levelGroup.style.display = val === 'Peserta' ? 'block' : 'none';
    }
  },

  async renderRegisterPage(container) {
    if (!container) container = document.getElementById('mainContainer');
    if (!container) return;

    const s = this.appSettings;
    let opts = { units: [], religions: [], blood_types: [], genders: [], levels: [], disability_statuses: [], disability_types: [] };
    try {
      opts = await API.getOptions();
    } catch (e) {
      console.warn('Failed loading options from DB:', e);
      opts.units = await API.getUnits().catch(() => []);
    }

    const unitOptionsHtml = (opts.units || []).map(u =>
      `<option value="${u.id}">${Utils.escapeHtml(u.name)} (${u.level_category})</option>`
    ).join('');

    const levelOptionsHtml = (opts.levels || [
      { value: 'Wira', label: 'Wira (SMA / SMK / MA)' },
      { value: 'Madya', label: 'Madya (SMP / MTs)' },
      { value: 'Mula', label: 'Mula (SD / MI)' }
    ]).map(l =>
      `<option value="${typeof l === 'object' ? l.value : l}">${Utils.escapeHtml(typeof l === 'object' ? l.label : l)}</option>`
    ).join('');

    const religionOptionsHtml = (opts.religions || ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']).map(r =>
      `<option value="${Utils.escapeHtml(r)}">${Utils.escapeHtml(r)}</option>`
    ).join('');

    const genderOptionsHtml = (opts.genders || [
      { value: 'L', label: 'Laki-laki' },
      { value: 'P', label: 'Perempuan' }
    ]).map(g =>
      `<option value="${typeof g === 'object' ? g.value : g}">${Utils.escapeHtml(typeof g === 'object' ? g.label : g)}</option>`
    ).join('');

    const bloodTypeOptionsHtml = (opts.blood_types || ['O', 'A', 'B', 'AB', 'Belum Tahu']).map(b =>
      `<option value="${Utils.escapeHtml(b)}">Golongan ${Utils.escapeHtml(b)}</option>`
    ).join('');

    const disabilityStatusOptionsHtml = (opts.disability_statuses || [
      { value: 'Tidak', label: 'Tidak (Non-Disabilitas)' },
      { value: 'Ya', label: 'Ya (Penyandang Disabilitas)' }
    ]).map(d =>
      `<option value="${typeof d === 'object' ? d.value : d}">${Utils.escapeHtml(typeof d === 'object' ? d.label : d)}</option>`
    ).join('');

    const disabilityTypeOptionsHtml = (opts.disability_types || [
      'Tidak Ada', 'Disabilitas Fisik / Daksa', 'Disabilitas Netra', 'Disabilitas Rungu / Wicara', 'Disabilitas Intelektual / Grahita', 'Disabilitas Mental', 'Lainnya'
    ]).map(dt =>
      `<option value="${Utils.escapeHtml(dt)}">${Utils.escapeHtml(dt)}</option>`
    ).join('');

    container.innerHTML = `
      <div class="panel-card" style="max-width: 900px; margin: 0 auto 2rem auto;">
        
        <!-- KOP SURAT RESMI PALANG MERAH INDONESIA KABUPATEN -->
        <div class="kop-surat-container">
          ${s.app_kop ? `
            <div style="text-align: center; margin-bottom: 1rem;">
              <img src="${Utils.escapeHtml(s.app_kop)}" alt="Kop Surat Resmi PMI" style="max-width: 100%; height: auto; display: block; margin: 0 auto; border-bottom: 3px double var(--primary); padding-bottom: 0.5rem; border-radius: var(--radius-sm);">
            </div>
          ` : `
            <div class="kop-header">
              <img src="${Utils.escapeHtml(s.app_logo || 'frontend/images/logo-pmi.svg')}" alt="Logo PMI" class="kop-logo">
              <div class="kop-text">
                <h2>PALANG MERAH INDONESIA (PMI) KABUPATEN</h2>
                <h3>PANITIA PELAKSANA JUMBARA PMR TINGKAT KABUPATEN 2026</h3>
                <p>Jl. Palang Merah No. 1, Markas PMI Kabupaten | Telp: (021) 555-PMR-2026 | Email: sekretariat@jumbara-pmi.or.id</p>
              </div>
            </div>
            <div class="kop-divider"></div>
          `}
        </div>

        <div style="text-align: center; margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.3rem; color: var(--secondary); text-transform: uppercase; font-weight: 800;">
            FORMULIR REGISTRASI MANDIRI JUMBARA PMR 2026
          </h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);">
            Lengkapi formulir registrasi resmi (Peserta, Panitia, Peninjau, Tamu Undangan, Media). Akun login dibuatkan otomatis oleh sistem.
          </p>
        </div>

        <form onsubmit="App.handleFullRegisterSubmit(event)">
          <div style="background: #f8fafc; padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
            <h4 style="color: var(--primary); margin-bottom: 0.85rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-users"></i> 1. Kategori Pendaftaran & Kontingen / Instansi
            </h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Kategori Pendaftaran *</label>
                <select id="fullRegRegistrationType" onchange="App.handleRegistrationTypeChange(this.value)" required>
                  <option value="Peserta">Peserta PMR (Mula / Madya / Wira)</option>
                  <option value="Panitia">Panitia Pelaksana Jumbara</option>
                  <option value="Peninjau">Peninjau Kontingen / Pendamping</option>
                  <option value="Tamu Undangan">Tamu Undangan Resmi / VIP</option>
                  <option value="Media">Media / Pers / Publikasi</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Kontingen / Unit / Instansi *</label>
                <select id="fullRegUnitId" required onchange="App.updateUnsurOptionsByUnit(this.value, 'fullRegLevel')">
                  <option value="">-- Pilih Kontingen / Instansi --</option>
                  ${unitOptionsHtml}
                </select>
              </div>
              <div class="form-group" id="fullRegLevelGroup">
                <label class="form-label">Unsur Kontingen *</label>
                <select id="fullRegLevel">
                  ${levelOptionsHtml}
                </select>
              </div>
            </div>
          </div>

          <div style="background: #f8fafc; padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
            <h4 style="color: var(--primary); margin-bottom: 0.85rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-id-card"></i> 2. Biodata Lengkap Pendaftar
            </h4>
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label">Nama Lengkap (Sesuai Ijazah/Akta/KTP) *</label>
              <input type="text" id="fullRegFullName" placeholder="Masukkan nama lengkap..." required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label class="form-label">NISN / NIK / No. Identitas</label>
                <input type="text" id="fullRegNisn" placeholder="Nomor NISN/NIK...">
              </div>
              <div class="form-group">
                <label class="form-label">Agama *</label>
                <select id="fullRegReligion" required>
                  ${religionOptionsHtml}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Jenis Kelamin *</label>
                <select id="fullRegGender" required>
                  ${genderOptionsHtml}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Golongan Darah *</label>
                <select id="fullRegBloodType" required>
                  ${bloodTypeOptionsHtml}
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label class="form-label">Tempat Lahir</label>
                <input type="text" id="fullRegBirthPlace" placeholder="Kota lahir...">
              </div>
              <div class="form-group">
                <label class="form-label">Tanggal Lahir</label>
                <input type="date" id="fullRegBirthDate">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label class="form-label">Status Disabilitas (Penyandang Disabilitas?) *</label>
                <select id="fullRegIsDisabled" onchange="App.toggleDisabilityTypeField(this.value)" required>
                  ${disabilityStatusOptionsHtml}
                </select>
              </div>
              <div class="form-group" id="fullRegDisabilityTypeGroup" style="display: none;">
                <label class="form-label">Jenis Disabilitas *</label>
                <select id="fullRegDisabilityType">
                  ${disabilityTypeOptionsHtml}
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0.5rem;">
              <label class="form-label">Alamat Tempat Tinggal *</label>
              <textarea id="fullRegAddress" rows="2" placeholder="Masukkan alamat lengkap tempat tinggal (Jalan, RT/RW, Kelurahan, Kecamatan, Kabupaten)..." required></textarea>
            </div>

          </div>

          <div style="background: #f8fafc; padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
            <h4 style="color: var(--primary); margin-bottom: 0.85rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-envelope-open-text"></i> 3. Kontak WhatsApp, Email Pendaftar & Pendamping
            </h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Nomor WhatsApp Aktif (Notifikasi WA) *</label>
                <input type="text" id="fullRegPhone" placeholder="Contoh: 08123456789" required>
                <small style="color: var(--text-muted); font-size: 0.75rem;">Notifikasi bukti & akun login dikirim otomatis dari sistem ke WA ini.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Alamat Email Pendaftar *</label>
                <input type="email" id="fullRegEmail" placeholder="contoh@email.com" required>
                <small style="color: var(--text-muted); font-size: 0.75rem;">Informasi pendaftaran, user & password dikirim otomatis ke email ini.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Nama Pembina / Kontak Darurat / Instansi</label>
                <input type="text" id="fullRegEmergencyContact" placeholder="Nama Pembina / Ortu / Lembaga...">
              </div>
            </div>
          </div>

          <div style="background: #f8fafc; padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
            <h4 style="color: var(--primary); margin-bottom: 0.85rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-cloud-arrow-up"></i> 4. Unggah Dokumen Berkas (Pas Foto & Surat Tugas / Mandat / Press)
            </h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Upload Pas Foto (3x4 / Berwarna) *</label>
                <input type="file" id="fullRegPhotoFile" accept="image/*" class="form-control" style="padding: 0.4rem; background: #fff;" required>
                <small style="color: var(--text-muted); font-size: 0.75rem;">Format: JPG, PNG, WEBP. Maksimum 2MB.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Upload Surat Tugas / Mandat / Kartu Pers *</label>
                <input type="file" id="fullRegAssignmentFile" accept="image/*,application/pdf" class="form-control" style="padding: 0.4rem; background: #fff;" required>
                <small style="color: var(--text-muted); font-size: 0.75rem;">Format: PDF atau Gambar (JPG/PNG). Maksimum 5MB.</small>
              </div>
            </div>
          </div>

          <div id="fullRegMessageContainer"></div>

          <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-top: 1.5rem;">
            <button type="button" class="btn btn-outline" onclick="App.renderView()">
              <i class="fa-solid fa-arrow-left"></i> Kembali ke Beranda
            </button>
            <button type="submit" id="fullRegSubmitBtn" class="btn btn-primary" style="padding: 0.7rem 1.75rem;">
              <i class="fa-solid fa-paper-plane"></i> Kirim Pendaftaran Resmi
            </button>
          </div>
        </form>

      </div>
    `;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async handleFullRegisterSubmit(e) {
    e.preventDefault();
    const msgContainer = document.getElementById('fullRegMessageContainer');
    const submitBtn = document.getElementById('fullRegSubmitBtn');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah & Memproses...';
    }

    const readFileAsBase64 = (file) => {
      return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    };

    try {
      const photoFileInput = document.getElementById('fullRegPhotoFile');
      const assignmentFileInput = document.getElementById('fullRegAssignmentFile');

      const photoFile = photoFileInput && photoFileInput.files[0] ? photoFileInput.files[0] : null;
      const assignmentFile = assignmentFileInput && assignmentFileInput.files[0] ? assignmentFileInput.files[0] : null;

      const [photoData, assignmentData] = await Promise.all([
        readFileAsBase64(photoFile),
        readFileAsBase64(assignmentFile)
      ]);

      const regType = document.getElementById('fullRegRegistrationType').value;
      const levelVal = regType === 'Peserta' ? document.getElementById('fullRegLevel').value : regType;

      const isDisabled = document.getElementById('fullRegIsDisabled').value;
      const disabilityType = isDisabled === 'Ya' ? document.getElementById('fullRegDisabilityType').value : 'Tidak Ada';
      const address = document.getElementById('fullRegAddress').value;
      const phoneVal = document.getElementById('fullRegPhone').value;
      const emailVal = document.getElementById('fullRegEmail').value;

      const data = {
        registration_type: regType,
        unit_id: document.getElementById('fullRegUnitId').value,
        level: levelVal,
        full_name: document.getElementById('fullRegFullName').value,
        nisn: document.getElementById('fullRegNisn').value,
        religion: document.getElementById('fullRegReligion').value,
        gender: document.getElementById('fullRegGender').value,
        blood_type: document.getElementById('fullRegBloodType').value,
        is_disabled: isDisabled,
        disability_type: disabilityType,
        address: address,
        birth_place: document.getElementById('fullRegBirthPlace').value,
        birth_date: document.getElementById('fullRegBirthDate').value,
        phone: phoneVal,
        email: emailVal,
        emergency_contact: document.getElementById('fullRegEmergencyContact').value,
        photo_data: photoData,
        assignment_letter_data: assignmentData
      };

      const res = await API.registerParticipant(data);
      Utils.showToast(res.message || 'Pendaftaran berhasil!', 'success');

      // Store participant data for printing PDF
      const unitSelect = document.getElementById('fullRegUnitId');
      const selectedUnitText = unitSelect && unitSelect.options[unitSelect.selectedIndex] ? unitSelect.options[unitSelect.selectedIndex].text : '-';

      const participantData = res.participant_data || {
        code: res.code,
        username: res.username,
        password: res.password,
        full_name: data.full_name,
        nisn: data.nisn,
        level: data.level,
        registration_type: data.registration_type,
        unit_name: selectedUnitText,
        religion: data.religion,
        gender: data.gender,
        blood_type: data.blood_type,
        is_disabled: data.is_disabled,
        disability_type: data.disability_type,
        birth_place: data.birth_place,
        birth_date: data.birth_date,
        address: data.address,
        phone: data.phone,
        email: data.email,
        emergency_contact: data.emergency_contact,
        photo_url: photoData,
        status: 'pending_unit'
      };

      this.lastRegisteredParticipant = participantData;
      this.renderRegistrationSuccessDetailView(participantData);

    } catch (err) {
      if (msgContainer) {
        msgContainer.innerHTML = `
          <div style="background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
            ⚠️ ${Utils.escapeHtml(err.message || 'Gagal mendaftar. Silakan periksa kembali data Anda.')}
          </div>
        `;
      }
      Utils.showToast(err.message || 'Gagal mendaftar', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Pendaftaran Resmi';
      }
    }
  },

  renderRegistrationSuccessDetailView(participantData) {
    const container = document.getElementById('mainContainer');
    if (!container) return;

    this.lastRegisteredParticipant = participantData;

    container.innerHTML = `
      <div class="panel-card" style="max-width: 900px; margin: 0 auto 2.5rem auto;">
        
        <!-- HEADER SUKSES -->
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem; text-align: center; box-shadow: 0 4px 12px rgba(5,150,105,0.25);">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎉</div>
          <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.35rem; color: #ffffff;">PENDAFTARAN RESMI BERHASIL DITERIMA!</h2>
          <p style="font-size: 0.95rem; opacity: 0.95; max-width: 600px; margin: 0 auto 0.85rem auto;">
            Terima kasih, data pendaftaran Anda telah tercatat di sistem JUMBARA PMR 2026.
          </p>
          <div style="display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); padding: 0.4rem 1.25rem; border-radius: 20px; font-weight: 800; font-size: 1.05rem;">
            KODE REGISTRASI: <span style="color: #fef08a;">${participantData.code || '-'}</span>
          </div>
        </div>

        <!-- NOTIFIKASI OTOMATIS TERKIRIM ALERT -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 1rem 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem; display: flex; align-items: flex-start; gap: 0.75rem;">
          <i class="fa-solid fa-paper-plane" style="color: #15803d; font-size: 1.3rem; margin-top: 0.15rem; flex-shrink: 0;"></i>
          <div>
            <strong style="font-size: 0.95rem; color: #14532d;">Notifikasi Otomatis Sistem Dikirim:</strong><br>
            Rincian pendaftaran serta informasi login akun telah dikirimkan secara otomatis oleh sistem ke <strong>WhatsApp (${Utils.escapeHtml(participantData.phone || '-')})</strong> dan <strong>Email (${Utils.escapeHtml(participantData.email || '-')})</strong>.
          </div>
        </div>

        <!-- KREDENSIAL AKUN LOGIN PORTAL -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 1.25rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <h4 style="color: #1d4ed8; margin-bottom: 0.6rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; font-size: 1rem;">
            <i class="fa-solid fa-key"></i> Akun Login Portal Resmi Peserta
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: #ffffff; padding: 1rem; border-radius: 6px; border: 1px dashed #93c5fd; margin-bottom: 0.5rem;">
            <div>
              <span style="font-size: 0.8rem; color: #64748b; display: block;">Username / ID Login:</span>
              <strong style="font-size: 1.1rem; color: #1e3a8a; letter-spacing: 0.5px;">${participantData.username || '-'}</strong>
            </div>
            <div>
              <span style="font-size: 0.8rem; color: #64748b; display: block;">Password Login:</span>
              <strong style="font-size: 1.1rem; color: #1e3a8a; letter-spacing: 0.5px;">${participantData.password || '-'}</strong>
            </div>
          </div>
          <small style="color: #475569; font-size: 0.8rem;">
            * Simpan username dan password di atas untuk masuk ke Portal Peserta JUMBARA, mengecek status verifikasi, presensi QR code, dan mengunduh Kartu Peserta (ID Card).
          </small>
        </div>

        <!-- DETAIL DATA PENDAFTARAN (PANEL TABEL) -->
        <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; margin-bottom: 1.5rem;">
          <div style="background: #f8fafc; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <h3 style="font-size: 1.05rem; color: var(--secondary); font-weight: 800; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-address-card" style="color: var(--primary);"></i> Rincian Informasi Data Pendaftar
            </h3>
            <span class="status-badge badge-pending">Status: Menunggu Verifikasi Unit</span>
          </div>

          <div style="padding: 1.25rem;">
            <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;">
              ${participantData.photo_url ? `
                <div style="flex-shrink: 0; text-align: center;">
                  <img src="${participantData.photo_url}" alt="Foto Pendaftar" style="width: 120px; height: 155px; object-fit: cover; border-radius: 6px; border: 2px solid var(--border-color); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem;">Pas Foto 3x4</div>
                </div>
              ` : ''}

              <div style="flex: 1; min-width: 280px;">
                <table class="data-table" style="width: 100%; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
                  <tbody>
                    <tr>
                      <th style="width: 35%; background: #f8fafc; font-size: 0.85rem; color: #475569;">Kode Pendaftaran</th>
                      <td style="font-size: 0.9rem;"><code style="font-weight: 800; color: var(--primary); font-size: 0.95rem;">${participantData.code || '-'}</code></td>
                    </tr>
                    <tr>
                      <th style="background: #f8fafc; font-size: 0.85rem; color: #475569;">Nama Lengkap</th>
                      <td style="font-size: 0.95rem; font-weight: 800; color: #0f172a;">${Utils.escapeHtml(participantData.full_name || '-')}</td>
                    </tr>
                    <tr>
                      <th style="background: #f8fafc; font-size: 0.85rem; color: #475569;">Kategori & Unsur</th>
                      <td style="font-size: 0.88rem;"><strong>${Utils.escapeHtml(participantData.registration_type || '-')}</strong> (${Utils.escapeHtml(participantData.level || '-')})</td>
                    </tr>
                    <tr>
                      <th style="background: #f8fafc; font-size: 0.85rem; color: #475569;">Kontingen / Unit</th>
                      <td style="font-size: 0.88rem;">${Utils.escapeHtml(participantData.unit_name || '-')}</td>
                    </tr>
                    <tr>
                      <th style="background: #f8fafc; font-size: 0.85rem; color: #475569;">NISN / NIK</th>
                      <td style="font-size: 0.88rem;">${Utils.escapeHtml(participantData.nisn || '-')}</td>
                    </tr>
                    <tr>
                      <th style="background: #f8fafc; font-size: 0.85rem; color: #475569;">Jenis Kelamin</th>
                      <td style="font-size: 0.88rem;">${participantData.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</td>
                    </tr>
                    <tr>
                      <th style="background: #f8fafc; font-size: 0.85rem; color: #475569;">Agama & Golda</th>
                      <td style="font-size: 0.88rem;">Agama ${Utils.escapeHtml(participantData.religion || '-')} | Golongan Darah ${Utils.escapeHtml(participantData.blood_type || '-')}</td>
                    </tr>
                    <tr>
                      <th style="background: #f8fafc; font-size: 0.85rem; color: #475569;">Status Disabilitas</th>
                      <td style="font-size: 0.88rem;">${participantData.is_disabled === 'Ya' ? 'Penyandang Disabilitas (' + Utils.escapeHtml(participantData.disability_type || '-') + ')' : 'Non-Disabilitas'}</td>
                    </tr>
                    <tr>
                      <th style="background: #f8fafc; font-size: 0.85rem; color: #475569;">Tempat, Tgl Lahir</th>
                      <td style="font-size: 0.88rem;">${Utils.escapeHtml(participantData.birth_place || '-')}, ${participantData.birth_date ? Utils.formatDate(participantData.birth_date) : '-'}</td>
                    </tr>
                    <tr>
                      <th style="background: #f8fafc; font-size: 0.85rem; color: #475569;">Alamat Lengkap</th>
                      <td style="font-size: 0.88rem;">${Utils.escapeHtml(participantData.address || '-')}</td>
                    </tr>
                    <tr>
                      <th style="background: #f8fafc; font-size: 0.85rem; color: #475569;">WhatsApp & Email</th>
                      <td style="font-size: 0.88rem;">📱 ${Utils.escapeHtml(participantData.phone || '-')} | ✉️ ${Utils.escapeHtml(participantData.email || '-')}</td>
                    </tr>
                    <tr>
                      <th style="background: #f8fafc; font-size: 0.85rem; color: #475569;">Kontak Darurat</th>
                      <td style="font-size: 0.88rem;">${Utils.escapeHtml(participantData.emergency_contact || '-')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- TOMBOL AKSI: DOWNLOAD PDF & NAVIGASI -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <button type="button" class="btn btn-primary" onclick="App.downloadRegistrationFormPDF()" style="background: #0284c7; border-color: #0284c7; padding: 0.85rem 1rem; font-size: 0.95rem; font-weight: 800; justify-content: center; box-shadow: 0 4px 12px rgba(2,132,199,0.3);">
              <i class="fa-solid fa-download" style="font-size: 1.2rem;"></i> 📥 Download File PDF (Langsung)
            </button>
            <button type="button" class="btn btn-outline" onclick="App.printRegistrationFormPDF()" style="padding: 0.85rem 1rem; font-size: 0.95rem; font-weight: 800; justify-content: center; background: #ffffff; color: #334155;">
              <i class="fa-solid fa-print" style="font-size: 1.2rem;"></i> 🖨️ Cetak / Print Dokumen
            </button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <button type="button" class="btn btn-primary" onclick="App.openLoginModalWithCredentials('${Utils.escapeHtml(participantData.username || '')}', '${Utils.escapeHtml(participantData.password || '')}')" style="justify-content: center; font-weight: 800; background: #059669; border-color: #059669; color: white;">
              <i class="fa-solid fa-right-to-bracket"></i> 🔑 Login ke Portal Peserta Sekarang
            </button>
            <button type="button" class="btn btn-secondary" onclick="App.renderView()" style="justify-content: center; font-weight: 700;">
              <i class="fa-solid fa-house"></i> Kembali ke Beranda Utama
            </button>
          </div>
        </div>

      </div>
    `;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  openLoginModalWithCredentials(username = '', password = '') {
    const alertBox = document.getElementById('loginAlertBox');
    if (alertBox) {
      alertBox.style.display = 'none';
      alertBox.innerHTML = '';
    }
    const userEl = document.getElementById('loginUsername');
    const passEl = document.getElementById('loginPassword');
    if (userEl && username) userEl.value = username;
    if (passEl && password) passEl.value = password;

    this.openModal('loginModal');
  },

  async downloadRegistrationFormPDF(participantData) {
    if (!participantData) {
      participantData = this.lastRegisteredParticipant;
    }
    if (!participantData) {
      Utils.showToast('Data pendaftaran tidak ditemukan', 'error');
      return;
    }

    Utils.showToast('Mengunduh file PDF...', 'info');

    if (typeof html2pdf === 'undefined') {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      } catch (e) {
        console.warn('Gagal memuat html2pdf CDN, mengalihkan ke jendela cetak...');
        this.printRegistrationFormPDF(participantData);
        return;
      }
    }

    const s = this.appSettings || {};
    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const logoHtml = s.app_kop
      ? `<img src="${Utils.escapeHtml(s.app_kop)}" style="max-width: 100%; height: auto; display: block; margin: 0 auto 10px auto;">`
      : `
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px; border-bottom: 3px double #dc2626; padding-bottom: 10px; margin-bottom: 15px;">
          <img src="${Utils.escapeHtml(s.app_logo || 'frontend/images/logo-pmi.svg')}" style="width: 65px; height: 65px; object-fit: contain;">
          <div style="text-align: center;">
            <h2 style="margin: 0; font-size: 14pt; color: #1e293b; font-weight: 800; letter-spacing: 0.5px;">PALANG MERAH INDONESIA (PMI) KABUPATEN</h2>
            <h3 style="margin: 3px 0 0 0; font-size: 11.5pt; color: #dc2626; font-weight: 700;">PANITIA PELAKSANA JUMBARA PMR TINGKAT KABUPATEN 2026</h3>
            <p style="margin: 3px 0 0 0; font-size: 8pt; color: #475569;">Sekretariat: Markas PMI Kabupaten | Email: sekretariat@jumbara-pmi.or.id</p>
          </div>
        </div>
      `;

    const pdfDiv = document.createElement('div');
    pdfDiv.style.padding = '15px';
    pdfDiv.style.background = '#ffffff';
    pdfDiv.style.fontFamily = 'Arial, sans-serif';
    pdfDiv.style.fontSize = '9pt';
    pdfDiv.style.color = '#0f172a';

    pdfDiv.innerHTML = `
      <div style="width: 100%; max-width: 750px; margin: 0 auto;">
        ${logoHtml}

        <div style="text-align: center; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 12.5pt; font-weight: 800; color: #1e293b; text-decoration: underline; text-transform: uppercase;">FORMULIR PENDAFTARAN RESMI JUMBARA PMR 2026</h3>
          <p style="margin: 3px 0 0 0; font-size: 8pt; color: #64748b;">Bukti Cetak Registrasi Mandiri Peserta / Panitia / Kontingen JUMBARA PMR</p>
        </div>

        <div style="margin-bottom: 10px; overflow: hidden;">
          <div style="float: left;">
            <div style="display: inline-block; background: #dc2626; color: #ffffff; font-weight: 800; font-size: 10pt; padding: 3px 10px; border-radius: 4px; margin-bottom: 4px;">NO. REGISTRASI: ${participantData.code || '-'}</div><br>
            <small style="color: #475569; font-size: 8pt;">Tanggal Cetak: ${todayStr}</small><br>
            <small style="color: #475569; font-size: 8pt;">Status Pendaftaran: <strong>${participantData.status === 'verified_kabupaten' ? 'DISERTIFIKASI KABUPATEN' : (participantData.status === 'verified_unit' ? 'DIVERIFIKASI UNIT' : 'MENUNGGU VERIFIKASI')}</strong></small>
          </div>
          <div style="float: right; width: 85px; height: 110px; border: 1.5px dashed #94a3b8; border-radius: 4px; overflow: hidden; background: #f8fafc; text-align: center;">
            ${participantData.photo_url ? `<img src="${participantData.photo_url}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div style="padding-top: 35px; font-size: 7.5pt; color: #94a3b8;">Pas Foto 3x4</div>`}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #cbd5e1; clear: both;">
          <tbody>
            <tr>
              <th style="width: 32%; background: #f1f5f9; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">Nama Lengkap</th>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 8.5pt;"><strong>${Utils.escapeHtml(participantData.full_name || '-')}</strong></td>
            </tr>
            <tr>
              <th style="background: #f1f5f9; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">Kategori Registrasi</th>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 8.5pt;">${Utils.escapeHtml(participantData.registration_type || 'Peserta')}</td>
            </tr>
            <tr>
              <th style="background: #f1f5f9; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">Tingkat / Unsur PMR</th>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">${Utils.escapeHtml(participantData.level || '-')}</td>
            </tr>
            <tr>
              <th style="background: #f1f5f9; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">Kontingen / Unit Sekolah</th>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 8.5pt;">${Utils.escapeHtml(participantData.unit_name || participantData.unit_id || '-')}</td>
            </tr>
            <tr>
              <th style="background: #f1f5f9; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">NISN / NIK / Identitas</th>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 8.5pt;">${Utils.escapeHtml(participantData.nisn || '-')}</td>
            </tr>
            <tr>
              <th style="background: #f1f5f9; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">Jenis Kelamin</th>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 8.5pt;">${participantData.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</td>
            </tr>
            <tr>
              <th style="background: #f1f5f9; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">Agama</th>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 8.5pt;">${Utils.escapeHtml(participantData.religion || '-')}</td>
            </tr>
            <tr>
              <th style="background: #f1f5f9; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">Golongan Darah</th>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 8.5pt;">Golongan ${Utils.escapeHtml(participantData.blood_type || '-')}</td>
            </tr>
            <tr>
              <th style="background: #f1f5f9; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">Status Disabilitas</th>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 8.5pt;">${participantData.is_disabled === 'Ya' ? 'Penyandang Disabilitas (' + Utils.escapeHtml(participantData.disability_type || '-') + ')' : 'Non-Disabilitas'}</td>
            </tr>
            <tr>
              <th style="background: #f1f5f9; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">Tempat, Tanggal Lahir</th>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 8.5pt;">${Utils.escapeHtml(participantData.birth_place || '-')}, ${participantData.birth_date ? Utils.formatDate(participantData.birth_date) : '-'}</td>
            </tr>
            <tr>
              <th style="background: #f1f5f9; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">Alamat Lengkap</th>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 8.5pt;">${Utils.escapeHtml(participantData.address || '-')}</td>
            </tr>
            <tr>
              <th style="background: #f1f5f9; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">Nomor WhatsApp</th>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 8.5pt;">${Utils.escapeHtml(participantData.phone || '-')}</td>
            </tr>
            <tr>
              <th style="background: #f1f5f9; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">Email Pendaftar</th>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 8.5pt;">${Utils.escapeHtml(participantData.email || '-')}</td>
            </tr>
            <tr>
              <th style="background: #f1f5f9; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5pt;">Kontak Darurat / Pembina</th>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 8.5pt;">${Utils.escapeHtml(participantData.emergency_contact || '-')}</td>
            </tr>
          </tbody>
        </table>

        ${(participantData.username && participantData.password) ? `
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px 12px; margin-bottom: 15px;">
            <h4 style="margin: 0 0 4px 0; font-size: 9pt; color: #1d4ed8;">🔑 AKUN LOGIN PORTAL RESMI PESERTA:</h4>
            <div style="font-size: 8.5pt;">
              <span>Username: <strong>${participantData.username}</strong></span> &nbsp;|&nbsp; 
              <span>Password: <strong>${participantData.password}</strong></span>
            </div>
            <small style="color: #64748b; font-size: 7.5pt; display: block; margin-top: 3px;">* Harap simpan username & password ini untuk login ke Portal Peserta JUMBARA.</small>
          </div>
        ` : ''}

        <div style="margin-top: 20px; display: flex; justify-content: space-between;">
          <div style="width: 48%; text-align: center;">
            <p style="margin: 0; font-size: 8pt;">Mengetahui,<br><strong>Pembina PMR / Penanggung Jawab Unit</strong></p>
            <div style="height: 45px;"></div>
            <p style="margin: 0; font-size: 8.5pt;">( ____________________________ )</p>
          </div>
          <div style="width: 48%; text-align: center;">
            <p style="margin: 0; font-size: 8pt;">Panitia Jumbara,<br><strong>Peserta Pendaftar</strong></p>
            <div style="height: 45px;"></div>
            <p style="margin: 0; font-size: 8.5pt;">( <strong>${Utils.escapeHtml(participantData.full_name || 'Peserta')}</strong> )</p>
          </div>
        </div>
      </div>
    `;

    const filename = `Formulir_Pendaftaran_${participantData.code || 'PMR'}.pdf`;
    const opt = {
      margin: [8, 8, 8, 8],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(pdfDiv).save();
      Utils.showToast(`Berhasil mengunduh ${filename}`, 'success');
    } catch (err) {
      console.error('html2pdf download error:', err);
      this.printRegistrationFormPDF(participantData);
    }
  },

  printRegistrationFormPDF(participantData) {
    if (!participantData) {
      participantData = this.lastRegisteredParticipant;
    }
    if (!participantData) {
      Utils.showToast('Data pendaftaran tidak ditemukan', 'error');
      return;
    }

    const s = this.appSettings || {};
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker aktif. Harap izinkan pop-up browser untuk mengunduh PDF.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const logoHtml = s.app_kop
      ? `<img src="${Utils.escapeHtml(s.app_kop)}" style="max-width: 100%; height: auto; display: block; margin: 0 auto 10px auto;">`
      : `
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px; border-bottom: 3px double #dc2626; padding-bottom: 10px; margin-bottom: 15px;">
          <img src="${Utils.escapeHtml(s.app_logo || 'frontend/images/logo-pmi.svg')}" style="width: 70px; height: 70px; object-fit: contain;">
          <div style="text-align: center;">
            <h2 style="margin: 0; font-size: 15pt; color: #1e293b; font-weight: 800; letter-spacing: 0.5px;">PALANG MERAH INDONESIA (PMI) KABUPATEN</h2>
            <h3 style="margin: 3px 0 0 0; font-size: 12pt; color: #dc2626; font-weight: 700;">PANITIA PELAKSANA JUMBARA PMR TINGKAT KABUPATEN 2026</h3>
            <p style="margin: 3px 0 0 0; font-size: 8.5pt; color: #475569;">Sekretariat: Markas PMI Kabupaten | Email: sekretariat@jumbara-pmi.or.id</p>
          </div>
        </div>
      `;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Formulir_Pendaftaran_${participantData.code || 'PMR'}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm 15mm 15mm 15mm;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9.5pt;
            color: #0f172a;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          .container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
          }
          .title-box {
            text-align: center;
            margin-bottom: 15px;
          }
          .title-box h3 {
            margin: 0;
            font-size: 13pt;
            font-weight: 800;
            color: #1e293b;
            text-decoration: underline;
            text-transform: uppercase;
          }
          .title-box p {
            margin: 3px 0 0 0;
            font-size: 8.5pt;
            color: #64748b;
          }
          .photo-box {
            width: 95px;
            height: 120px;
            border: 2px dashed #94a3b8;
            border-radius: 4px;
            text-align: center;
            overflow: hidden;
            background: #f8fafc;
            float: right;
          }
          .photo-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .code-badge {
            display: inline-block;
            background: #dc2626;
            color: #ffffff;
            font-weight: 800;
            font-size: 11pt;
            padding: 4px 12px;
            border-radius: 4px;
            margin-bottom: 5px;
          }
          .table-data {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            clear: both;
          }
          .table-data th, .table-data td {
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
            font-size: 9pt;
            text-align: left;
          }
          .table-data th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 700;
            width: 30%;
          }
          .cred-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 20px;
          }
          .cred-box h4 {
            margin: 0 0 4px 0;
            font-size: 9.5pt;
            color: #1d4ed8;
          }
          .signatures {
            margin-top: 25px;
            display: table;
            width: 100%;
          }
          .sig-cell {
            display: table-cell;
            width: 50%;
            text-align: center;
            vertical-align: top;
          }
          .sig-space {
            height: 55px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${logoHtml}

          <div class="title-box">
            <h3>FORMULIR PENDAFTARAN RESMI JUMBARA PMR 2026</h3>
            <p>Bukti Cetak Registrasi Mandiri Peserta / Panitia / Kontingen JUMBARA PMR</p>
          </div>

          <div style="margin-bottom: 12px; overflow: hidden;">
            <div style="float: left;">
              <span class="code-badge">NO. REGISTRASI: ${participantData.code || '-'}</span><br>
              <small style="color: #475569; font-size: 8.5pt;">Tanggal Cetak: ${todayStr}</small><br>
              <small style="color: #475569; font-size: 8.5pt;">Status Pendaftaran: <strong>${participantData.status === 'verified_kabupaten' ? 'DISERTIFIKASI KABUPATEN' : (participantData.status === 'verified_unit' ? 'DIVERIFIKASI UNIT' : 'MENUNGGU VERIFIKASI')}</strong></small>
            </div>
            <div class="photo-box">
              ${participantData.photo_url
        ? `<img src="${participantData.photo_url}" alt="Pas Foto">`
        : `<div style="padding-top: 40px; font-size: 7.5pt; color: #94a3b8;">Pas Foto 3x4</div>`}
            </div>
          </div>

          <table class="table-data">
            <tr>
              <th>Nama Lengkap</th>
              <td><strong>${Utils.escapeHtml(participantData.full_name || '-')}</strong></td>
            </tr>
            <tr>
              <th>Kategori Registrasi</th>
              <td>${Utils.escapeHtml(participantData.registration_type || 'Peserta')}</td>
            </tr>
            <tr>
              <th>Tingkat / Unsur PMR</th>
              <td>${Utils.escapeHtml(participantData.level || '-')}</td>
            </tr>
            <tr>
              <th>Kontingen / Unit Sekolah</th>
              <td>${Utils.escapeHtml(participantData.unit_name || participantData.unit_id || '-')}</td>
            </tr>
            <tr>
              <th>NISN / NIK / Identitas</th>
              <td>${Utils.escapeHtml(participantData.nisn || '-')}</td>
            </tr>
            <tr>
              <th>Jenis Kelamin</th>
              <td>${participantData.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</td>
            </tr>
            <tr>
              <th>Agama</th>
              <td>${Utils.escapeHtml(participantData.religion || '-')}</td>
            </tr>
            <tr>
              <th>Golongan Darah</th>
              <td>Golongan ${Utils.escapeHtml(participantData.blood_type || '-')}</td>
            </tr>
            <tr>
              <th>Status Disabilitas</th>
              <td>${participantData.is_disabled === 'Ya' ? 'Penyandang Disabilitas (' + Utils.escapeHtml(participantData.disability_type || '-') + ')' : 'Non-Disabilitas'}</td>
            </tr>
            <tr>
              <th>Tempat, Tanggal Lahir</th>
              <td>${Utils.escapeHtml(participantData.birth_place || '-')}, ${participantData.birth_date ? Utils.formatDate(participantData.birth_date) : '-'}</td>
            </tr>
            <tr>
              <th>Alamat Lengkap</th>
              <td>${Utils.escapeHtml(participantData.address || '-')}</td>
            </tr>
            <tr>
              <th>Nomor WhatsApp</th>
              <td>${Utils.escapeHtml(participantData.phone || '-')}</td>
            </tr>
            <tr>
              <th>Email Pendaftar</th>
              <td>${Utils.escapeHtml(participantData.email || '-')}</td>
            </tr>
            <tr>
              <th>Kontak Darurat / Pembina</th>
              <td>${Utils.escapeHtml(participantData.emergency_contact || '-')}</td>
            </tr>
          </table>

          ${(participantData.username && participantData.password) ? `
            <div class="cred-box">
              <h4>🔑 AKUN LOGIN PORTAL RESMI PESERTA:</h4>
              <div style="font-size: 9pt;">
                <span>Username: <strong>${participantData.username}</strong></span> &nbsp;|&nbsp; 
                <span>Password: <strong>${participantData.password}</strong></span>
              </div>
              <small style="color: #64748b; font-size: 7.5pt; display: block; margin-top: 3px;">* Harap simpan username & password ini untuk login ke Portal Peserta JUMBARA.</small>
            </div>
          ` : ''}

          <div class="signatures">
            <div class="sig-cell">
              <p style="margin: 0; font-size: 8.5pt;">Mengetahui,<br><strong>Pembina PMR / Penanggung Jawab Unit</strong></p>
              <div class="sig-space"></div>
              <p style="margin: 0; font-size: 9pt;">( ____________________________ )</p>
            </div>
            <div class="sig-cell">
              <p style="margin: 0; font-size: 8.5pt;">Panitia Jumbara,<br><strong>Peserta Pendaftar</strong></p>
              <div class="sig-space"></div>
              <p style="margin: 0; font-size: 9pt;">( <strong>${Utils.escapeHtml(participantData.full_name || 'Peserta')}</strong> )</p>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },

  // =========================================================================
  // TAB MASTER DATA (CRUD UNIT, AGAMA, GOLDA, JENIS KELAMIN, FONNTE WA)
  // =========================================================================
  activeMasterSubTab: 'units',

  switchMasterSubTab(tabName) {
    this.activeMasterSubTab = tabName;
    document.querySelectorAll('.master-sub-tab-btn').forEach(btn => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle('active', isActive);
      btn.style.background = isActive ? 'var(--primary, #0284c7)' : '#ffffff';
      btn.style.color = isActive ? '#ffffff' : '#334155';
      btn.style.borderColor = isActive ? 'var(--primary, #0284c7)' : '#cbd5e1';
    });

    const secUnits = document.getElementById('masterSecUnits');
    const secUnsur = document.getElementById('masterSecUnsur');
    const secOptions = document.getElementById('masterSecOptions');
    const secFonnte = document.getElementById('masterSecFonnte');

    if (secUnits) secUnits.style.display = (tabName === 'units') ? 'block' : 'none';
    if (secUnsur) secUnsur.style.display = (tabName === 'unsur') ? 'block' : 'none';
    if (secOptions) secOptions.style.display = (tabName === 'options') ? 'block' : 'none';
    if (secFonnte) secFonnte.style.display = (tabName === 'fonnte') ? 'block' : 'none';

    if (tabName === 'unsur') {
      this.loadUnsurMasterList();
    }
  },

  // =========================================================================
  // TAB MASTER DATA (SEPARATED SUB-TABS: UNITS, UNSUR, OPTIONS, FONNTE WA)
  // =========================================================================
  async renderTabMaster(container, initialSubTab = 'units') {
    this.activeMasterSubTab = initialSubTab || this.activeMasterSubTab || 'units';

    container.innerHTML = `<div class="panel-card"><p style="color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Memuat Master Data...</p></div>`;
    try {
      const [options, units, settings] = await Promise.all([
        API.getOptions(),
        API.getUnits(),
        API.getSettings()
      ]);

      this.currentMasterReligions = options.religions || ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
      this.currentMasterBloodTypes = options.blood_types || ['O', 'A', 'B', 'AB', 'Belum Tahu'];
      this.currentMasterGenders = options.genders || [
        { value: 'L', label: 'Laki-laki' },
        { value: 'P', label: 'Perempuan' }
      ];

      const fonnteToken = settings.fonnte_token || '';
      const fonnteEnabled = settings.fonnte_enabled === '1' || settings.fonnte_enabled === 1 || settings.fonnte_enabled === true;

      const isUnits = this.activeMasterSubTab === 'units';
      const isUnsur = this.activeMasterSubTab === 'unsur';
      const isOptions = this.activeMasterSubTab === 'options';
      const isFonnte = this.activeMasterSubTab === 'fonnte';

      container.innerHTML = `
        <!-- MASTER DATA SUB-TAB NAVIGATION BAR -->
        <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 10px; padding: 0.6rem; margin-bottom: 1.25rem; display: flex; gap: 0.5rem; flex-wrap: wrap; box-shadow: 0 1px 4px rgba(0,0,0,0.03);">
          <button type="button" class="btn btn-sm master-sub-tab-btn ${isUnits ? 'active' : ''}" data-tab="units" onclick="App.switchMasterSubTab('units')" 
            style="font-weight: 700; padding: 0.55rem 1.1rem; background: ${isUnits ? 'var(--primary, #0284c7)' : '#ffffff'}; color: ${isUnits ? '#ffffff' : '#334155'}; border: 1px solid ${isUnits ? 'var(--primary, #0284c7)' : '#cbd5e1'};">
            <i class="fa-solid fa-school"></i> 1. Unit Sekolah Kontingen (${units.length})
          </button>
          
          <button type="button" class="btn btn-sm master-sub-tab-btn ${isUnsur ? 'active' : ''}" data-tab="unsur" onclick="App.switchMasterSubTab('unsur')" 
            style="font-weight: 700; padding: 0.55rem 1.1rem; background: ${isUnsur ? 'var(--primary, #0284c7)' : '#ffffff'}; color: ${isUnsur ? '#ffffff' : '#334155'}; border: 1px solid ${isUnsur ? 'var(--primary, #0284c7)' : '#cbd5e1'};">
            <i class="fa-solid fa-users-rectangle"></i> 2. Unsur Kontingen & Kuota
          </button>
          
          <button type="button" class="btn btn-sm master-sub-tab-btn ${isOptions ? 'active' : ''}" data-tab="options" onclick="App.switchMasterSubTab('options')" 
            style="font-weight: 700; padding: 0.55rem 1.1rem; background: ${isOptions ? 'var(--primary, #0284c7)' : '#ffffff'}; color: ${isOptions ? '#ffffff' : '#334155'}; border: 1px solid ${isOptions ? 'var(--primary, #0284c7)' : '#cbd5e1'};">
            <i class="fa-solid fa-sliders"></i> 3. Opsi Biodata (Agama, Golda, Gender)
          </button>

          <button type="button" class="btn btn-sm master-sub-tab-btn ${isFonnte ? 'active' : ''}" data-tab="fonnte" onclick="App.switchMasterSubTab('fonnte')" 
            style="font-weight: 700; padding: 0.55rem 1.1rem; background: ${isFonnte ? 'var(--primary, #0284c7)' : '#ffffff'}; color: ${isFonnte ? '#ffffff' : '#334155'}; border: 1px solid ${isFonnte ? 'var(--primary, #0284c7)' : '#cbd5e1'};">
            <i class="fa-brands fa-whatsapp" style="color: ${isFonnte ? '#ffffff' : '#25D366'};"></i> 4. Gateway WA (Fonnte API)
          </button>
        </div>

        <div id="masterSubTabContent">
          
          <!-- SUB-TAB 1: CRUD UNIT SEKOLAH (KONTINGEN) -->
          <div id="masterSecUnits" style="display: ${isUnits ? 'block' : 'none'};">
            <div class="panel-card">
              <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                <div>
                  <h3 class="panel-title" style="margin: 0;"><i class="fa-solid fa-school" style="color: var(--primary);"></i> Kelola Master Data Unit Sekolah Kontingen (${units.length})</h3>
                  <small style="color: var(--text-muted);">Daftar unit sekolah/kontingen peserta yang terdaftar resmi di sistem</small>
                </div>
                <button class="btn btn-primary btn-sm" onclick="App.openAddUnitModal()">
                  <i class="fa-solid fa-plus"></i> Tambah Unit Sekolah Baru
                </button>
              </div>
              
              <div class="master-unit-desktop-table table-responsive" style="margin-top: 1rem;">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Kode Unit</th>
                      <th>Nama Unit Sekolah</th>
                      <th>Kategori PMR</th>
                      <th>Pembina PMR</th>
                      <th>Kontak / WhatsApp</th>
                      <th>Alamat Sekolah</th>
                      <th style="text-align: center;">Aksi Pengelolaan</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${units.length ? units.map(u => {
        const cleanPhone = u.phone ? u.phone.replace(/[^0-9]/g, '') : '';
        const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone}` : null;
        return `
                        <tr>
                          <td><code>${u.code}</code></td>
                          <td>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                              <i class="fa-solid fa-school" style="color: var(--secondary);"></i>
                              <strong>${Utils.escapeHtml(u.name)}</strong>
                            </div>
                          </td>
                          <td>${Utils.getLevelBadgeHtml(u.level_category)}</td>
                          <td><i class="fa-solid fa-user-tie" style="color: #64748b; margin-right: 0.3rem;"></i> ${Utils.escapeHtml(u.pembina_name)}</td>
                          <td>
                            ${waLink ? `
                              <a href="${waLink}" target="_blank" style="color: #0d9488; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 0.3rem;">
                                <i class="fa-brands fa-whatsapp" style="color: #25D366; font-size: 1rem;"></i> ${Utils.escapeHtml(u.phone)}
                              </a>
                            ` : '<span style="color: var(--text-muted);">-</span>'}
                          </td>
                          <td style="font-size: 0.85rem; color: #475569;">
                            ${u.address ? `<i class="fa-solid fa-location-dot" style="color: #ef4444; margin-right: 0.3rem;"></i>${Utils.escapeHtml(u.address)}` : '-'}
                          </td>
                          <td style="text-align: center;">
                            <div style="display: flex; gap: 0.4rem; justify-content: center;">
                              <button class="btn btn-outline btn-sm" onclick="App.openEditUnitModal(${u.id})" title="Edit Unit Sekolah">
                                <i class="fa-solid fa-pen-to-square"></i> Edit
                              </button>
                              <button class="btn btn-danger btn-sm" onclick="App.deleteUnit(${u.id}, '${Utils.escapeHtml(u.name).replace(/'/g, "\\'")}')" title="Hapus Unit Sekolah">
                                <i class="fa-solid fa-trash-can"></i> Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
      }).join('') : '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">Belum ada unit sekolah terdaftar. Klik "Tambah Unit Sekolah Baru" di atas.</td></tr>'}
                  </tbody>
                </table>
              </div>

              <div class="master-unit-mobile-cards" style="margin-top: 1rem;">
                ${units.length ? units.map(u => {
        const cleanPhone = u.phone ? u.phone.replace(/[^0-9]/g, '') : '';
        const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone}` : null;
        return `
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); width: 100%; box-sizing: border-box;">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
                        <code style="font-weight: 800; color: var(--primary); font-size: 0.85rem;">${u.code}</code>
                        ${Utils.getLevelBadgeHtml(u.level_category)}
                      </div>
                      <strong style="font-size: 0.95rem; color: #0f172a; display: block; margin-bottom: 0.3rem; word-break: break-word;">${Utils.escapeHtml(u.name)}</strong>
                      <div style="font-size: 0.78rem; color: #475569; margin-bottom: 0.3rem;">
                        <i class="fa-solid fa-user-tie" style="color: #64748b;"></i> Pembina: <strong>${Utils.escapeHtml(u.pembina_name)}</strong>
                        ${waLink ? `<br><a href="${waLink}" target="_blank" style="color: #0d9488; font-weight: 600; text-decoration: none;"><i class="fa-brands fa-whatsapp" style="color: #25D366;"></i> ${Utils.escapeHtml(u.phone)}</a>` : ''}
                      </div>
                      ${u.address ? `<div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.4rem;"><i class="fa-solid fa-location-dot" style="color: #ef4444;"></i> ${Utils.escapeHtml(u.address)}</div>` : ''}
                      <div style="display: flex; gap: 0.3rem; flex-wrap: wrap; padding-top: 0.45rem; border-top: 1px dashed #e2e8f0;">
                        <button class="btn btn-outline btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem;" onclick="App.openEditUnitModal(${u.id})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                        <button class="btn btn-danger btn-sm" style="font-size: 0.76rem; padding: 0.25rem 0.55rem;" onclick="App.deleteUnit(${u.id}, '${Utils.escapeHtml(u.name).replace(/'/g, "\\'")}')"><i class="fa-solid fa-trash-can"></i> Hapus</button>
                      </div>
                    </div>
                  `;
      }).join('') : '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">Belum ada unit sekolah terdaftar.</p>'}
              </div>
            </div>
          </div>

          <!-- SUB-TAB 2: KELOLA DATA UNSUR KONTINGEN & BATAS KUOTA -->
          <div id="masterSecUnsur" style="display: ${isUnsur ? 'block' : 'none'};">
            <div class="panel-card">
              <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                <div>
                  <h3 class="panel-title" style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-users-rectangle" style="color: var(--primary);"></i> Master Data Unsur Kontingen & Batas Kuota
                  </h3>
                  <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.35rem;">
                    Kelola kategori Unsur (Kepala Markas, Ketua Bidang PMR, Koordinator Forpis, Koordinator Forel, Pegawai, PMR Mula/Madya/Wira, TSR) beserta kuota pendaftaran per kontingen sekolah.
                  </p>
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                  <button class="btn btn-outline btn-sm" style="border-color: #dc2626; color: #dc2626;" onclick="App.openPapanInformasiUnsurModal()">
                    <i class="fa-solid fa-chart-column"></i> Papan Informasi Unsur Fullscreen
                  </button>
                  <button class="btn btn-success btn-sm" style="background: #059669; border-color: #059669; color: white;" onclick="App.openAddUnsurModal()">
                    <i class="fa-solid fa-plus-circle"></i> + Tambah Unsur Baru
                  </button>
                </div>
              </div>

              <div id="unsurTableContainer" style="margin-top: 1rem;">
                <p style="color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Memuat daftar unsur & kuota...</p>
              </div>
            </div>
          </div>

          <!-- SUB-TAB 3: MASTER OPTIONS (AGAMA, GOLONGAN DARAH, JENIS KELAMIN) -->
          <div id="masterSecOptions" style="display: ${isOptions ? 'block' : 'none'};">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
              
              <!-- 3A. MASTER AGAMA -->
              <div class="panel-card">
                <h3 class="panel-title" style="margin-bottom: 1rem;"><i class="fa-solid fa-hands-praying" style="color: var(--secondary);"></i> Master Opsi Agama</h3>
                <div id="religionChipsContainer" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
                  ${this.renderReligionChipsHtml()}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <input type="text" id="newReligionInput" placeholder="Tambah agama baru..." style="font-size: 0.88rem;">
                  <button class="btn btn-primary btn-sm" onclick="App.addReligionItem()"><i class="fa-solid fa-plus"></i></button>
                </div>
                <button class="btn btn-secondary btn-sm" style="margin-top: 1rem; width: 100%;" onclick="App.saveReligions()">
                  <i class="fa-solid fa-floppy-disk"></i> Simpan Master Agama
                </button>
              </div>

              <!-- 3B. MASTER GOLONGAN DARAH -->
              <div class="panel-card">
                <h3 class="panel-title" style="margin-bottom: 1rem;"><i class="fa-solid fa-droplet" style="color: #dc2626;"></i> Master Golongan Darah</h3>
                <div id="bloodTypeChipsContainer" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
                  ${this.renderBloodTypeChipsHtml()}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <input type="text" id="newBloodTypeInput" placeholder="Tambah golongan darah..." style="font-size: 0.88rem;">
                  <button class="btn btn-primary btn-sm" onclick="App.addBloodTypeItem()"><i class="fa-solid fa-plus"></i></button>
                </div>
                <button class="btn btn-secondary btn-sm" style="margin-top: 1rem; width: 100%;" onclick="App.saveBloodTypes()">
                  <i class="fa-solid fa-floppy-disk"></i> Simpan Master Golongan Darah
                </button>
              </div>

              <!-- 3C. MASTER JENIS KELAMIN -->
              <div class="panel-card">
                <h3 class="panel-title" style="margin-bottom: 1rem;"><i class="fa-solid fa-venus-mars" style="color: #0284c7;"></i> Master Jenis Kelamin</h3>
                <div id="genderChipsContainer" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
                  ${this.renderGenderChipsHtml()}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 2fr auto; gap: 0.5rem;">
                  <input type="text" id="newGenderValInput" placeholder="Kode (e.g. L)" style="font-size: 0.88rem;">
                  <input type="text" id="newGenderLabelInput" placeholder="Label (e.g. Laki-laki)" style="font-size: 0.88rem;">
                  <button class="btn btn-primary btn-sm" onclick="App.addGenderItem()"><i class="fa-solid fa-plus"></i></button>
                </div>
                <button class="btn btn-secondary btn-sm" style="margin-top: 1rem; width: 100%;" onclick="App.saveGenders()">
                  <i class="fa-solid fa-floppy-disk"></i> Simpan Master Jenis Kelamin
                </button>
              </div>

            </div>
          </div>

          <!-- SUB-TAB 4: INTEGRATION FONNTE WHATSAPP GATEWAY API -->
          <div id="masterSecFonnte" style="display: ${isFonnte ? 'block' : 'none'};">
            <div class="panel-card" style="border-left: 5px solid #25D366;">
              <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                <h3 class="panel-title" style="color: #128C7E; display: flex; align-items: center; gap: 0.5rem;">
                  <i class="fa-brands fa-whatsapp" style="font-size: 1.5rem; color: #25D366;"></i> Konfigurasi WhatsApp API Gateway (Fonnte)
                </h3>
                <span class="badge ${fonnteEnabled ? 'badge-success' : 'badge-warning'}">
                  ${fonnteEnabled ? '🟢 Gateway Aktif (Fonnte API)' : '⚪ Gateway Non-Aktif'}
                </span>
              </div>

              <div style="background: #f0fdf4; padding: 1rem; border-radius: var(--radius-md); border: 1px solid #bbf7d0; margin-bottom: 1.25rem;">
                <p style="font-size: 0.88rem; color: #166534; margin: 0;">
                  <strong>Petunjuk Fonnte API:</strong> Dapatkan Device Token gratis atau berbayar dari dashboard <a href="https://fonnte.com" target="_blank" style="color: #15803d; font-weight: 700; text-decoration: underline;">Fonnte.com</a>. Masukkan Token API di bawah untuk mengaktifkan notifikasi WA otomatis saat peserta mendaftar atau saat verifikasi disetujui/direvisi/ditolak.
                </p>
              </div>

              <form onsubmit="App.handleSaveFonnteSettings(event)">
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
                  <div class="form-group">
                    <label class="form-label">Fonnte Device API Token *</label>
                    <input type="password" id="fonnteTokenInput" value="${Utils.escapeHtml(fonnteToken)}" placeholder="Contoh: a1b2c3d4e5f6g7h8..." required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Status Gateway *</label>
                    <select id="fonnteEnabledInput">
                      <option value="1" ${fonnteEnabled ? 'selected' : ''}>Aktif (Otomatis Kirim WA via Fonnte)</option>
                      <option value="0" ${!fonnteEnabled ? 'selected' : ''}>Non-Aktif</option>
                    </select>
                  </div>
                </div>

                <div style="display: flex; gap: 0.75rem; margin-bottom: 1.5rem;">
                  <button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> Simpan Konfigurasi Fonnte</button>
                </div>
              </form>

              <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 1.5rem 0;">

              <!-- Live Test WhatsApp Fonnte -->
              <div style="background: #f8fafc; padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                <h4 style="font-size: 1rem; font-weight: 800; color: var(--secondary); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                  <i class="fa-solid fa-paper-plane" style="color: #25D366;"></i> Tes Kirim Pesan WhatsApp (Fonnte API)
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 2fr auto; gap: 0.75rem; align-items: end;">
                  <div class="form-group">
                    <label class="form-label">No. WA Tujuan Tes *</label>
                    <input type="text" id="fonnteTestPhone" placeholder="08123456789">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Isi Pesan Tes</label>
                    <input type="text" id="fonnteTestMsg" value="Halo! Tes integrasi Fonnte WhatsApp Gateway JUMBARA PMR 2026 BERHASIL!">
                  </div>
                  <div>
                    <button type="button" class="btn btn-success btn-sm" onclick="App.handleTestFonnte()"><i class="fa-brands fa-whatsapp"></i> Kirim Tes WA</button>
                  </div>
                </div>
                <div id="fonnteTestResultContainer" style="margin-top: 0.75rem;"></div>
              </div>
            </div>
          </div>

        </div>
      `;

      if (isUnsur) {
        this.loadUnsurMasterList();
      }
    } catch (err) {
      container.innerHTML = `<div class="alert alert-danger">⚠️ Gagal memuat Master Data: ${Utils.escapeHtml(err.message)}</div>`;
    }
  },

  // --- UNSUR & KUOTA MASTER DATA HANDLERS ---
  async updateUnsurOptionsByUnit(unitId, selectElementId, selectedValue = '') {
    const select = typeof selectElementId === 'string' ? document.getElementById(selectElementId) : selectElementId;
    if (!select) return;

    if (!unitId) {
      select.innerHTML = '<option value="">-- Pilih Unit Sekolah Terlebih Dahulu --</option>';
      select.disabled = true;
      return;
    }

    select.disabled = true;
    select.innerHTML = '<option value="">Memuat unsur & kuota terpakai...</option>';

    try {
      const unsurs = await API.getUnsur(unitId);
      select.disabled = false;

      let html = '<option value="">-- Pilih Unsur Kontingen --</option>';
      unsurs.forEach(u => {
        const isFull = u.is_full;
        const used = u.used_quota || 0;
        const quota = u.quota || 0;
        const rem = u.remaining_quota ?? 0;

        let quotaText = '';
        if (quota > 0) {
          if (isFull) {
            quotaText = `(Terpakai: ${used}/${quota} - 🔴 KUOTA PENUH)`;
          } else {
            quotaText = `(Terpakai: ${used}/${quota} - 🟢 Sisa ${rem})`;
          }
        } else {
          quotaText = `(Terpakai: ${used} - ⚡ Tanpa Batas)`;
        }

        const isCurrentlySelected = (u.name === selectedValue);
        const isDisabled = (isFull && !isCurrentlySelected);
        const disabledAttr = isDisabled ? 'disabled' : '';
        const selectedAttr = isCurrentlySelected ? 'selected' : '';
        const styleAttr = isDisabled ? 'color: #94a3b8; background: #f1f5f9;' : '';

        html += `<option value="${Utils.escapeHtml(u.name)}" ${disabledAttr} ${selectedAttr} style="${styleAttr}">
          ${isFull ? '🔴' : (quota > 0 ? '🟢' : '⚡')} ${Utils.escapeHtml(u.name)} ${quotaText}
        </option>`;
      });

      select.innerHTML = html;
    } catch (err) {
      console.error('Error updating unsur options by unit:', err);
      select.disabled = false;
      select.innerHTML = '<option value="">-- Gagal memuat unsur --</option>';
    }
  },

  async loadUnsurMasterList() {
    const container = document.getElementById('unsurTableContainer');
    if (!container) return;

    const unitSelectEl = document.getElementById('filterUnsurUnitId');
    const selectedUnitId = unitSelectEl ? unitSelectEl.value : '';

    try {
      if (!this.cachedUnits || !this.cachedUnits.length) {
        this.cachedUnits = await API.getUnits().catch(() => []);
      }

      const unsurs = await API.getUnsur(selectedUnitId || null);
      this.cachedUnsurs = unsurs;

      const unitOptionsHtml = (this.cachedUnits || []).map(u =>
        `<option value="${u.id}" ${selectedUnitId == u.id ? 'selected' : ''}>[${u.code}] ${Utils.escapeHtml(u.name)} (${u.level_category})</option>`
      ).join('');

      const unitFilterToolbar = `
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
            <label style="font-weight: 700; font-size: 0.88rem; color: var(--secondary); display: flex; align-items: center; gap: 0.4rem;">
              <i class="fa-solid fa-calculator" style="color: var(--primary);"></i> Cek Detail Kuota Terpakai per Unit:
            </label>
            <select id="filterUnsurUnitId" style="width: auto; min-width: 260px; font-size: 0.85rem; padding: 0.4rem 0.65rem; border: 1px solid var(--border-color); border-radius: 6px; font-weight: 600;" onchange="App.loadUnsurMasterList()">
              <option value="">-- Semua Unit Sekolah (Statistik Global) --</option>
              ${unitOptionsHtml}
            </select>
          </div>
          ${selectedUnitId ? `
            <div style="font-size: 0.8rem; color: var(--primary); font-weight: 700;">
              <i class="fa-solid fa-circle-info"></i> Menampilkan rincian terpakai & sisa kuota untuk unit terpilih.
            </div>
          ` : `
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              Pilih unit sekolah pada dropdown untuk melihat status sisa kuota per unit.
            </div>
          `}
        </div>
      `;

      const papanMatrixWrapper = `<div id="papanInformasiUnsurMasterContainer" style="margin-bottom: 1.5rem;"></div>`;

      if (!unsurs.length) {
        container.innerHTML = papanMatrixWrapper + unitFilterToolbar + '<p style="color: var(--text-muted); padding: 1rem 0;">Belum ada data unsur terdaftar. Klik "+ Tambah Unsur Baru" di atas untuk membuat.</p>';
        this.loadPapanInformasiUnsurTable('papanInformasiUnsurMasterContainer');
        return;
      }

      const isUnitFiltered = !!selectedUnitId;

      const tableHtml = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th>Nama Unsur Kontingen</th>
                <th style="width: 150px;">Batas Kuota / Unit</th>
                ${isUnitFiltered ? `
                  <th style="width: 140px;">Kuota Terpakai</th>
                  <th style="width: 120px;">Sisa Kuota</th>
                  <th style="width: 175px;">Status Pendaftaran</th>
                ` : `
                  <th style="width: 160px;">Total Peserta Global</th>
                `}
                <th>Keterangan Deskripsi</th>
                <th style="width: 140px; text-align: center;">Aksi Pengelolaan</th>
              </tr>
            </thead>
            <tbody>
              ${unsurs.map((u, idx) => {
        let usageBadge = '';
        if (isUnitFiltered) {
          if (u.quota > 0) {
            if (u.is_full) {
              usageBadge = `<span class="badge" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; font-weight: 800; padding: 0.35rem 0.65rem;"><i class="fa-solid fa-lock"></i> 🔴 KUOTA PENUH (DISABLED)</span>`;
            } else {
              usageBadge = `<span class="badge" style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; font-weight: 800; padding: 0.35rem 0.65rem;"><i class="fa-solid fa-check-circle"></i> 🟢 TERSEDIA (${u.remaining_quota} Sisa)</span>`;
            }
          } else {
            usageBadge = `<span class="badge" style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; font-weight: 800; padding: 0.35rem 0.65rem;"><i class="fa-solid fa-infinity"></i> ⚡ TANPA BATAS</span>`;
          }
        }

        return `
                  <tr>
                    <td>#${idx + 1}</td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        ${Utils.getLevelBadgeHtml(u.name)}
                      </div>
                    </td>
                    <td>
                      <span class="badge ${u.quota > 0 ? 'badge-success' : 'badge-warning'}" style="font-size: 0.82rem; padding: 0.35rem 0.65rem;">
                        ${u.quota > 0 ? `Max ${u.quota} Orang / Unit` : 'Tidak Terbatas'}
                      </span>
                    </td>
                    ${isUnitFiltered ? `
                      <td><strong style="color: #0f172a; font-size: 0.95rem;">${u.used_quota}</strong> Orang</td>
                      <td>
                        <strong style="color: ${u.quota > 0 ? (u.is_full ? '#dc2626' : '#15803d') : '#0369a1'}; font-size: 0.95rem;">
                          ${u.quota > 0 ? u.remaining_quota + ' Orang' : '∞'}
                        </strong>
                      </td>
                      <td>${usageBadge}</td>
                    ` : `
                      <td><strong style="color: var(--primary); font-size: 0.95rem;">${u.total_global || 0}</strong> Pendaftar Aktif</td>
                    `}
                    <td style="font-size: 0.85rem; color: #475569;">${Utils.escapeHtml(u.description || '-')}</td>
                    <td style="text-align: center;">
                      <div style="display: flex; gap: 0.35rem; justify-content: center;">
                        <button class="btn btn-outline btn-sm" style="font-size: 0.78rem; padding: 0.25rem 0.5rem;" onclick="App.openEditUnsurModalById(${u.id})">
                          <i class="fa-solid fa-pen"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" style="font-size: 0.78rem; padding: 0.25rem 0.5rem;" onclick="App.handleDeleteUnsur(${u.id}, '${Utils.escapeHtml(u.name).replace(/'/g, "\\'")}')">
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        </div>
      `;

      container.innerHTML = papanMatrixWrapper + unitFilterToolbar + tableHtml;
      this.loadPapanInformasiUnsurTable('papanInformasiUnsurMasterContainer');
    } catch (err) {
      container.innerHTML = `<p style="color: red;">Gagal memuat data unsur: ${err.message}</p>`;
    }
  },

  openAddUnsurModal() {
    this.openUnsurModal();
  },

  openEditUnsurModalById(id) {
    const unsur = (this.cachedUnsurs || []).find(u => Number(u.id) === Number(id));
    if (unsur) {
      this.openUnsurModal(unsur);
    } else {
      Utils.showToast('Data unsur tidak ditemukan.', 'error');
    }
  },

  openEditUnsurModal(unsur) {
    this.openUnsurModal(unsur);
  },

  openUnsurModal(unsur = null) {
    const isEdit = !!(unsur && unsur.id);
    this.editingUnsurId = isEdit ? unsur.id : null;

    const modalHtml = `
      <div class="modal-overlay active" id="unsurFormModal" style="display: flex; opacity: 1; visibility: visible; z-index: 10000; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.7); align-items: center; justify-content: center;">
        <div class="modal-container" style="max-width: 460px; width: 90%; background: #ffffff; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); overflow: hidden; border: 1px solid var(--border-color); transform: translateY(0);">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; background: #f8fafc; border-bottom: 1px solid var(--border-color);">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0; color: var(--secondary);">
              <i class="fa-solid fa-users-rectangle" style="color: var(--primary);"></i> ${isEdit ? 'Edit Data Unsur & Kuota' : 'Tambah Unsur Kontingen Baru'}
            </h3>
            <button type="button" class="btn-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;" onclick="App.closeModal('unsurFormModal'); document.getElementById('unsurFormModal')?.remove();">&times;</button>
          </div>
          <div class="modal-body" style="padding: 1.25rem;">
            <form onsubmit="App.handleSaveUnsurSubmit(event)">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem; color: #334155;">Nama Unsur <span style="color: red;">*</span></label>
                <input type="text" id="unsur_name" required value="${isEdit ? Utils.escapeHtml(unsur.name) : ''}" placeholder="Contoh: Kepala Markas / PMR Wira / TSR" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.9rem;">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem; color: #334155;">Batas Kuota (Per Kontingen Unit) <span style="color: red;">*</span></label>
                <input type="number" id="unsur_quota" required min="0" value="${isEdit ? unsur.quota : 1}" placeholder="Masukkan angka kuota maksimal (misal: 1 atau 25)" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.9rem;">
                <small style="color: #64748b; font-size: 0.75rem; display: block; margin-top: 0.25rem;">Maksimal pendaftar unsur ini untuk setiap unit/kontingen sekolah (0 = Tanpa batas).</small>
              </div>
              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.88rem; color: #334155;">Deskripsi / Keterangan</label>
                <input type="text" id="unsur_description" value="${isEdit ? Utils.escapeHtml(unsur.description || '') : ''}" placeholder="Keterangan singkat unsur..." style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.9rem;">
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button type="button" class="btn btn-outline" onclick="App.closeModal('unsurFormModal'); document.getElementById('unsurFormModal')?.remove();">Batal</button>
                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Simpan Unsur</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('#unsurFormModal').forEach(el => el.remove());
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.openModal('unsurFormModal');
  },

  async handleSaveUnsurSubmit(e) {
    e.preventDefault();
    const unsurId = this.editingUnsurId;
    const name = document.getElementById('unsur_name')?.value.trim();
    const rawQuota = document.getElementById('unsur_quota')?.value;
    const quota = parseInt(rawQuota || '0', 10);
    const description = document.getElementById('unsur_description')?.value.trim();

    if (!name) return Utils.showToast('Nama unsur wajib diisi!', 'error');

    const payload = {
      name,
      quota: isNaN(quota) ? 0 : quota,
      description
    };

    try {
      if (unsurId) {
        payload.id = unsurId;
        const res = await API.updateUnsur(unsurId, payload);
        Utils.showToast(res.message || 'Data unsur berhasil diperbarui!', 'success');
      } else {
        const res = await API.createUnsur(payload);
        Utils.showToast(res.message || 'Unsur baru berhasil ditambahkan!', 'success');
      }
      this.closeModal('unsurFormModal');
      document.getElementById('unsurFormModal')?.remove();
      this.editingUnsurId = null;
      await this.loadUnsurMasterList();
      await this.loadCommonData();
    } catch (err) {
      Utils.showToast('Gagal menyimpan unsur: ' + err.message, 'error');
    }
  },

  async handleDeleteUnsur(unsurId, name) {
    const confirmed = await Utils.showConfirmModal({
      title: 'Hapus Kategori Unsur',
      message: `Apakah Anda yakin ingin menghapus unsur <strong>${Utils.escapeHtml(name)}</strong>?<br><span style="color: #dc2626; font-size: 0.82rem; margin-top: 0.4rem; display: block;"><i class="fa-solid fa-triangle-exclamation"></i> Kategori ini tidak dapat dipulihkan.</span>`,
      icon: 'fa-solid fa-trash-can',
      confirmText: 'Ya, Hapus Unsur',
      confirmClass: 'btn-danger'
    });
    if (!confirmed) return;

    try {
      const res = await API.deleteUnsur(unsurId);
      Utils.showToast(res.message || 'Kategori unsur berhasil dihapus!', 'success');
      try {
        await this.loadUnsurMasterList();
        await this.loadCommonData();
      } catch (refreshErr) {
        console.warn('Gagal memuat ulang daftar unsur setelah delete:', refreshErr);
      }
    } catch (err) {
      Utils.showToast('Gagal menghapus unsur: ' + err.message, 'error');
    }
  },

  // --- UNIT SEKOLAH CRUD HANDLERS ---
  openAddUnitModal() {
    const modalTitle = document.getElementById('unitModalTitle');
    const editId = document.getElementById('unitEditId');
    const nameInput = document.getElementById('unitNameInput');
    const levelInput = document.getElementById('unitLevelInput');
    const pembinaInput = document.getElementById('unitPembinaInput');
    const phoneInput = document.getElementById('unitPhoneInput');
    const addressInput = document.getElementById('unitAddressInput');

    if (modalTitle) modalTitle.innerHTML = '<i class="fa-solid fa-school"></i> Tambah Unit Sekolah Baru';
    if (editId) editId.value = '';
    if (nameInput) nameInput.value = '';
    if (levelInput) levelInput.value = 'Wira (SMA)';
    if (pembinaInput) pembinaInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (addressInput) addressInput.value = '';

    this.openModal('unitModal');
  },

  async openEditUnitModal(id, name, levelCategory, pembinaName, phone, address) {
    let unit = null;
    if (this.cachedUnits && this.cachedUnits.length) {
      unit = this.cachedUnits.find(u => Number(u.id) === Number(id));
    }
    if (!unit) {
      try {
        const units = await API.getUnits();
        this.cachedUnits = units;
        unit = units.find(u => Number(u.id) === Number(id));
      } catch (err) { }
    }

    const modalTitle = document.getElementById('unitModalTitle');
    const editId = document.getElementById('unitEditId');
    const nameInput = document.getElementById('unitNameInput');
    const levelInput = document.getElementById('unitLevelInput');
    const pembinaInput = document.getElementById('unitPembinaInput');
    const phoneInput = document.getElementById('unitPhoneInput');
    const addressInput = document.getElementById('unitAddressInput');

    if (modalTitle) modalTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Data Unit Sekolah';
    if (editId) editId.value = id;
    if (nameInput) nameInput.value = unit ? unit.name : (name || '');
    if (levelInput) levelInput.value = unit ? unit.level_category : (levelCategory || 'Wira (SMA)');
    if (pembinaInput) pembinaInput.value = unit ? unit.pembina_name : (pembinaName || '');
    if (phoneInput) phoneInput.value = unit ? (unit.phone || '') : (phone || '');
    if (addressInput) addressInput.value = unit ? (unit.address || '') : (address || '');

    this.openModal('unitModal');
  },

  async handleSaveUnit(e) {
    if (e) e.preventDefault();
    const editId = document.getElementById('unitEditId')?.value;
    const name = document.getElementById('unitNameInput')?.value.trim();
    const levelCategory = document.getElementById('unitLevelInput')?.value;
    const pembinaName = document.getElementById('unitPembinaInput')?.value.trim();
    const phone = document.getElementById('unitPhoneInput')?.value.trim();
    const address = document.getElementById('unitAddressInput')?.value.trim();

    if (!name || !pembinaName) {
      Utils.showToast('Nama Unit dan Pembina wajib diisi.', 'warning');
      return;
    }

    try {
      let res;
      if (editId) {
        res = await API.updateUnit(editId, { name, level_category: levelCategory, pembina_name: pembinaName, phone, address });
      } else {
        res = await API.createUnit({ name, level_category: levelCategory, pembina_name: pembinaName, phone, address });
      }
      Utils.showToast(res.message || 'Data unit berhasil disimpan!', 'success');
      this.closeModal('unitModal');
      this.loadCommonData();
      const content = document.getElementById('adminTabContent');
      if (content) this.renderTabMaster(content);
    } catch (err) {
      Utils.showToast(err.message || 'Gagal menyimpan unit.', 'error');
    }
  },

  async deleteUnit(id, name) {
    const confirmed = await Utils.showConfirmModal({
      title: 'Hapus Unit Sekolah',
      message: `Apakah Anda yakin ingin menghapus unit sekolah <strong>${Utils.escapeHtml(name)}</strong>?<br><span style="color: #dc2626; font-size: 0.82rem; margin-top: 0.4rem; display: block;"><i class="fa-solid fa-triangle-exclamation"></i> Menghapus unit akan mempengaruhi data peserta terkait.</span>`,
      icon: 'fa-solid fa-trash-can',
      confirmText: 'Ya, Hapus Unit',
      confirmClass: 'btn-danger'
    });
    if (!confirmed) return;

    try {
      const res = await API.deleteUnit(id);
      Utils.showToast(res.message || 'Unit berhasil dihapus!', 'success');
      try {
        await this.loadCommonData();
        const content = document.getElementById('adminTabContent');
        if (content) this.renderTabMaster(content);
      } catch (refreshErr) {
        console.warn('Gagal memuat ulang tab master:', refreshErr);
      }
    } catch (err) {
      Utils.showToast(err.message || 'Gagal menghapus unit.', 'error');
    }
  },

  // --- MASTER OPTIONS CHIP RENDERERS & HANDLERS ---
  renderReligionChipsHtml() {
    return (this.currentMasterReligions || []).map((r, i) => `
      <span class="badge" style="background: #e2e8f0; color: #1e293b; padding: 0.4rem 0.75rem; border-radius: 20px; font-size: 0.88rem; display: inline-flex; align-items: center; gap: 0.4rem;">
        ${Utils.escapeHtml(r)}
        <i class="fa-solid fa-xmark" style="cursor: pointer; color: #ef4444;" onclick="App.removeReligionItem(${i})"></i>
      </span>
    `).join('');
  },

  addReligionItem() {
    const input = document.getElementById('newReligionInput');
    const val = input?.value.trim();
    if (!val) return;
    if (!this.currentMasterReligions) this.currentMasterReligions = [];
    if (!this.currentMasterReligions.includes(val)) {
      this.currentMasterReligions.push(val);
      const container = document.getElementById('religionChipsContainer');
      if (container) container.innerHTML = this.renderReligionChipsHtml();
    }
    if (input) input.value = '';
  },

  removeReligionItem(idx) {
    if (this.currentMasterReligions && idx >= 0 && idx < this.currentMasterReligions.length) {
      this.currentMasterReligions.splice(idx, 1);
      const container = document.getElementById('religionChipsContainer');
      if (container) container.innerHTML = this.renderReligionChipsHtml();
    }
  },

  async saveReligions() {
    try {
      const res = await API.updateOptions({ option_religions: this.currentMasterReligions });
      Utils.showToast(res.message || 'Master Agama berhasil disimpan!', 'success');
    } catch (err) {
      Utils.showToast(err.message || 'Gagal menyimpan Master Agama.', 'error');
    }
  },

  renderBloodTypeChipsHtml() {
    return (this.currentMasterBloodTypes || []).map((b, i) => `
      <span class="badge" style="background: #fee2e2; color: #991b1b; padding: 0.4rem 0.75rem; border-radius: 20px; font-size: 0.88rem; display: inline-flex; align-items: center; gap: 0.4rem;">
        ${Utils.escapeHtml(b)}
        <i class="fa-solid fa-xmark" style="cursor: pointer; color: #ef4444;" onclick="App.removeBloodTypeItem(${i})"></i>
      </span>
    `).join('');
  },

  addBloodTypeItem() {
    const input = document.getElementById('newBloodTypeInput');
    const val = input?.value.trim();
    if (!val) return;
    if (!this.currentMasterBloodTypes) this.currentMasterBloodTypes = [];
    if (!this.currentMasterBloodTypes.includes(val)) {
      this.currentMasterBloodTypes.push(val);
      const container = document.getElementById('bloodTypeChipsContainer');
      if (container) container.innerHTML = this.renderBloodTypeChipsHtml();
    }
    if (input) input.value = '';
  },

  removeBloodTypeItem(idx) {
    if (this.currentMasterBloodTypes && idx >= 0 && idx < this.currentMasterBloodTypes.length) {
      this.currentMasterBloodTypes.splice(idx, 1);
      const container = document.getElementById('bloodTypeChipsContainer');
      if (container) container.innerHTML = this.renderBloodTypeChipsHtml();
    }
  },

  async saveBloodTypes() {
    try {
      const res = await API.updateOptions({ option_blood_types: this.currentMasterBloodTypes });
      Utils.showToast(res.message || 'Master Golongan Darah berhasil disimpan!', 'success');
    } catch (err) {
      Utils.showToast(err.message || 'Gagal menyimpan Master Golongan Darah.', 'error');
    }
  },

  renderGenderChipsHtml() {
    return (this.currentMasterGenders || []).map((g, i) => {
      const label = typeof g === 'object' ? g.label : g;
      const val = typeof g === 'object' ? g.value : g;
      return `
        <span class="badge" style="background: #e0f2fe; color: #0369a1; padding: 0.4rem 0.75rem; border-radius: 20px; font-size: 0.88rem; display: inline-flex; align-items: center; gap: 0.4rem;">
          ${Utils.escapeHtml(label)} (${Utils.escapeHtml(val)})
          <i class="fa-solid fa-xmark" style="cursor: pointer; color: #ef4444;" onclick="App.removeGenderItem(${i})"></i>
        </span>
      `;
    }).join('');
  },

  addGenderItem() {
    const valInput = document.getElementById('newGenderValInput');
    const labelInput = document.getElementById('newGenderLabelInput');
    const val = valInput?.value.trim();
    const label = labelInput?.value.trim() || val;

    if (!val) return;
    if (!this.currentMasterGenders) this.currentMasterGenders = [];
    this.currentMasterGenders.push({ value: val, label: label });
    const container = document.getElementById('genderChipsContainer');
    if (container) container.innerHTML = this.renderGenderChipsHtml();

    if (valInput) valInput.value = '';
    if (labelInput) labelInput.value = '';
  },

  removeGenderItem(idx) {
    if (this.currentMasterGenders && idx >= 0 && idx < this.currentMasterGenders.length) {
      this.currentMasterGenders.splice(idx, 1);
      const container = document.getElementById('genderChipsContainer');
      if (container) container.innerHTML = this.renderGenderChipsHtml();
    }
  },

  async saveGenders() {
    try {
      const res = await API.updateOptions({ option_genders: this.currentMasterGenders });
      Utils.showToast(res.message || 'Master Jenis Kelamin berhasil disimpan!', 'success');
    } catch (err) {
      Utils.showToast(err.message || 'Gagal menyimpan Master Jenis Kelamin.', 'error');
    }
  },

  // --- FONNTE WHATSAPP GATEWAY HANDLERS ---
  async handleSaveFonnteSettings(e) {
    if (e) e.preventDefault();
    const fonnteToken = document.getElementById('fonnteTokenInput')?.value.trim();
    const fonnteEnabled = document.getElementById('fonnteEnabledInput')?.value;

    try {
      const res = await API.updateSettings({
        fonnte_token: fonnteToken,
        fonnte_enabled: fonnteEnabled
      });
      Utils.showToast(res.message || 'Konfigurasi Fonnte WA Gateway disimpan!', 'success');
      const content = document.getElementById('adminTabContent');
      if (content) this.renderTabMaster(content);
    } catch (err) {
      Utils.showToast(err.message || 'Gagal menyimpan konfigurasi Fonnte.', 'error');
    }
  },

  async handleTestFonnte() {
    const phone = document.getElementById('fonnteTestPhone')?.value.trim();
    const message = document.getElementById('fonnteTestMsg')?.value.trim();
    const fonnteToken = document.getElementById('fonnteTokenInput')?.value.trim();
    const resultContainer = document.getElementById('fonnteTestResultContainer');

    if (!phone) {
      Utils.showToast('Nomor WhatsApp tujuan tes wajib diisi.', 'warning');
      return;
    }

    if (resultContainer) {
      resultContainer.innerHTML = `<span style="color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Mengirim pesan tes via Fonnte WA API...</span>`;
    }

    try {
      const res = await API.testFonnte(phone, message, fonnteToken);
      if (resultContainer) {
        resultContainer.innerHTML = `
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.88rem;">
            🟢 <strong>${Utils.escapeHtml(res.message)}</strong>
          </div>
        `;
      }
      Utils.showToast(res.message || 'Pesan tes WA Fonnte terkirim!', 'success');
    } catch (err) {
      if (resultContainer) {
        resultContainer.innerHTML = `
          <div style="background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.88rem;">
            🔴 <strong>Gagal:</strong> ${Utils.escapeHtml(err.message || 'Fonnte WA error')}
          </div>
        `;
      }
      Utils.showToast(err.message || 'Gagal tes kirim WA via Fonnte.', 'error');
    }
  },

  async loadPapanInformasiUnsurTable(containerId = 'papanInformasiUnsurContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<p style="text-align: center; padding: 2rem 0; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Memuat Papan Informasi Peserta per Unsur...</p>';

    try {
      const [unsurRes, unitsRes, partRes] = await Promise.all([
        API.getUnsur().catch(() => []),
        API.getUnits().catch(() => []),
        API.getParticipants({ limit: 5000, all: 'true' }).catch(() => ({ data: [] }))
      ]);

      const unsurList = Array.isArray(unsurRes) ? unsurRes : [];
      const units = Array.isArray(unitsRes) ? unitsRes : (unitsRes.units || []);
      const participants = Array.isArray(partRes) ? partRes : (partRes.data || []);

      // Kolom Matriks Dinamis: Murni diambil dari kategori unsur yang sudah diatur di tabel master (unsur_categories)
      const activeCols = [];
      const colSet = new Set();

      unsurList.forEach(u => {
        const rawName = (u.name || '').trim();
        const upName = rawName.toUpperCase();
        if (rawName && !colSet.has(upName)) {
          activeCols.push({
            id: u.id,
            key: upName,
            label: rawName,
            quota: Number(u.quota) || 0,
            desc: u.description || ''
          });
          colSet.add(upName);
        }
      });

      if (!units || !units.length) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 2.5rem; font-size: 0.95rem;"><i class="fa-solid fa-circle-info"></i> Belum ada data kontingen unit.</p>';
        return;
      }

      if (!activeCols || !activeCols.length) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 2.5rem; font-size: 0.95rem;"><i class="fa-solid fa-circle-info"></i> Belum ada kategori unsur yang diatur pada Master Unsur. Silakan tambahkan unsur di menu Master Data.</p>';
        return;
      }

      // Group participant counts by unit_id and matching unsur key
      const matrix = {};

      participants.forEach(p => {
        if (p.status === 'rejected') return;
        const uid = p.unit_id;
        if (!matrix[uid]) matrix[uid] = {};

        const rawUnsur = (p.level || p.registration_type || p.category || '').toUpperCase().trim();
        if (!rawUnsur) return;

        let matchedKey = null;

        // 1. Exact match (case-insensitive)
        for (const col of activeCols) {
          if (rawUnsur === col.key) {
            matchedKey = col.key;
            break;
          }
        }

        // 2. Exact match ignoring punctuation/spaces
        if (!matchedKey) {
          const cleanRaw = rawUnsur.replace(/[^A-Z0-9]/g, '');
          for (const col of activeCols) {
            const cleanKey = col.key.replace(/[^A-Z0-9]/g, '');
            if (cleanKey && cleanKey === cleanRaw) {
              matchedKey = col.key;
              break;
            }
          }
        }

        // 3. Substring matching
        if (!matchedKey) {
          for (const col of activeCols) {
            if (col.key.includes(rawUnsur) || rawUnsur.includes(col.key)) {
              matchedKey = col.key;
              break;
            }
          }
        }

        // 4. Synonym / description matching (e.g. Wira / Madya / Mula mapped to Anggota PMR / PMR categories)
        if (!matchedKey) {
          for (const col of activeCols) {
            const descUp = (col.desc || '').toUpperCase();
            if ((rawUnsur.includes('WIRA') || rawUnsur.includes('MADYA') || rawUnsur.includes('MULA')) &&
                (col.key.includes('PMR') || descUp.includes(rawUnsur) || descUp.includes('PMR'))) {
              matchedKey = col.key;
              break;
            }
          }
        }

        if (matchedKey) {
          matrix[uid][matchedKey] = (matrix[uid][matchedKey] || 0) + 1;
        }
      });

      // Calculate column totals
      const colTotals = {};
      activeCols.forEach(col => colTotals[col.key] = 0);

      units.forEach(u => {
        activeCols.forEach(col => {
          const cnt = matrix[u.id] ? (matrix[u.id][col.key] || 0) : 0;
          colTotals[col.key] += cnt;
        });
      });

      // Helper function to format header labels with clean line breaks
      const formatHeaderLabel = (lbl) => {
        const safe = Utils.escapeHtml(lbl || '');
        const words = safe.split(/\s+/);
        if (words.length <= 1) return safe;
        if (words.length === 2) return `${words[0]}<br>${words[1]}`;
        const mid = Math.ceil(words.length / 2);
        return `${words.slice(0, mid).join(' ')}<br>${words.slice(mid).join(' ')}`;
      };

      const tableMinWidth = Math.max(700, 240 + (activeCols.length * 130));

      const html = `
        <div style="background: #0f172a; border-radius: 8px; color: #ffffff; padding: 0.25rem 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.75rem; background: #1e293b; padding: 0.85rem 1.25rem; border-radius: 8px; border: 1px solid #334155;">
            <div>
              <h4 style="font-size: 1.05rem; font-weight: 800; color: #f8fafc; margin: 0 0 0.25rem 0; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-table-cells" style="color: #ef4444;"></i> Papan Matriks Kontingen & Unsur Peserta Jumbara
              </h4>
              <p style="margin: 0; font-size: 0.78rem; color: #94a3b8;">Display Monitoring Layar Penuh (Real-time Fullscreen Matrix)</p>
            </div>
            
            <div style="display: flex; gap: 1rem; align-items: center; background: #0f172a; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #334155;">
              <span style="font-size: 0.82rem; color: #cbd5e1; font-weight: 700;">Total Kontingen: <strong style="color: #38bdf8; font-size: 0.95rem;">${units.length}</strong></span>
              <span style="color: #475569;">|</span>
              <span style="font-size: 0.82rem; color: #cbd5e1; font-weight: 700;">Total Peserta: <strong style="color: #4ade80; font-size: 0.95rem;">${participants.length}</strong></span>
            </div>
          </div>

          <!-- Color Indicator Legend -->
          <div style="display: flex; gap: 1.5rem; font-size: 0.8rem; font-weight: 700; color: #f8fafc; margin-bottom: 0.85rem; background: #1e293b; padding: 0.65rem 1.25rem; border-radius: 6px; border: 1px solid #334155; flex-wrap: wrap; align-items: center;">
            <span style="color: #94a3b8; font-size: 0.75rem; font-weight: 800; text-transform: uppercase;">Keterangan Status Kuota:</span>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span style="display: inline-block; width: 14px; height: 14px; background: #16a34a; border-radius: 3px; border: 1px solid #22c55e;"></span> 🟢 Kuota Terpenuhi / Sesuai Target
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span style="display: inline-block; width: 14px; height: 14px; background: #f59e0b; border-radius: 3px; border: 1px solid #fbbf24;"></span> 🟡 Terisi Sebagian (Belum Penuh)
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span style="display: inline-block; width: 14px; height: 14px; background: #dc2626; border-radius: 3px; border: 1px solid #f87171;"></span> 🔴 Belum Ada / Kosong (0 Peserta)
            </div>
          </div>

          <!-- High-resolution Responsive Matrix Table -->
          <div class="table-responsive" style="border: 2px solid #334155; border-radius: 8px; overflow: auto; max-height: calc(100vh - 210px); background: #0f172a; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.78rem; font-family: inherit; min-width: ${tableMinWidth}px;">
              <thead>
                <tr>
                  <th style="position: sticky; top: 0; left: 0; z-index: 30; background: #1e293b; color: #f8fafc; padding: 12px 14px; text-align: left; font-weight: 800; border-bottom: 2px solid #475569; border-right: 2px solid #475569; min-width: 230px; max-width: 250px; font-size: 0.85rem; box-shadow: 2px 2px 5px rgba(0,0,0,0.3);">
                    Unit / Sekolah
                  </th>
                  ${activeCols.map(col => `
                    <th style="position: sticky; top: 0; z-index: 20; background: #1e293b; color: #f8fafc; padding: 10px 6px; text-align: center; font-size: 0.72rem; font-weight: 800; border-bottom: 2px solid #475569; border-right: 1px solid #334155; min-width: 110px; width: 110px; line-height: 1.25; vertical-align: middle; white-space: normal; word-break: break-word; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                      <div style="font-weight: 800; text-transform: uppercase;">${formatHeaderLabel(col.label)}</div>
                      <div style="font-size: 0.65rem; color: #38bdf8; font-weight: 700; margin-top: 3px;">
                        ${col.quota > 0 ? `(Maks: ${col.quota})` : '(Tanpa Batas)'}
                      </div>
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${units.map((u, rowIdx) => {
                  const rowBg = rowIdx % 2 === 0 ? '#1e293b' : '#0f172a';
                  return `
                    <tr style="background: ${rowBg};">
                      <td style="position: sticky; left: 0; z-index: 10; background: ${rowBg}; color: #ffffff; padding: 10px 14px; font-weight: 800; text-align: left; border-right: 2px solid #475569; border-bottom: 1px solid #334155; white-space: nowrap; font-size: 0.82rem; box-shadow: 2px 0 5px rgba(0,0,0,0.2);">
                        ${Utils.escapeHtml(u.name)}
                      </td>
                      ${activeCols.map(col => {
                        const cnt = matrix[u.id] ? (matrix[u.id][col.key] || 0) : 0;
                        const quota = col.quota;
                        let bg = '#dc2626'; // Default red (0 peserta)
                        let textClr = '#ffffff';

                        if (cnt > 0) {
                          if (quota > 0) {
                            if (cnt >= quota) {
                              bg = '#16a34a'; // Green (kuota terpenuhi/maksimal)
                            } else {
                              bg = '#f59e0b'; // Yellow (terisi sebagian)
                            }
                          } else {
                            bg = '#16a34a'; // Green jika tanpa batas dan terisi
                          }
                        }

                        return `
                          <td style="padding: 10px 4px; text-align: center; font-weight: 900; color: ${textClr}; background: ${bg}; border-right: 1px solid rgba(0,0,0,0.2); border-bottom: 1px solid rgba(0,0,0,0.2); font-size: 1rem; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">
                            ${cnt}
                          </td>
                        `;
                      }).join('')}
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td style="position: sticky; bottom: 0; left: 0; z-index: 30; background: #334155; color: #ffffff; padding: 12px 14px; text-align: left; font-weight: 900; border-top: 3px solid #64748b; border-right: 2px solid #64748b; font-size: 0.9rem; box-shadow: 2px -2px 5px rgba(0,0,0,0.3);">
                    TOTAL PESERTA
                  </td>
                  ${activeCols.map(col => {
                    const tot = colTotals[col.key] || 0;
                    return `
                      <td style="position: sticky; bottom: 0; z-index: 20; padding: 12px 4px; text-align: center; font-weight: 900; color: #f8fafc; border-top: 3px solid #64748b; border-right: 1px solid #475569; font-size: 1.05rem; background: #334155; box-shadow: 0 -2px 5px rgba(0,0,0,0.3);">
                        ${tot}
                      </td>
                    `;
                  }).join('')}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `;

      container.innerHTML = html;
    } catch (err) {
      console.error('Error rendering Papan Informasi Unsur:', err);
      container.innerHTML = `<p style="color: var(--danger-color); font-size: 0.85rem;">Gagal memuat papan informasi unsur: ${Utils.escapeHtml(err.message)}</p>`;
    }
  },

  openPapanInformasiUnsurModal() {
    const modal = document.getElementById('papanInformasiUnsurModal');
    if (modal) {
      modal.classList.add('active', 'modal-fullscreen');
      modal.style.display = 'flex';
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
      modal.style.zIndex = '999999';
    }
    this.loadPapanInformasiUnsurTable('papanInformasiUnsurModalContainer');

    // Auto trigger HTML5 browser Fullscreen if user clicked
    if (!document.fullscreenElement && modal) {
      if (modal.requestFullscreen) {
        modal.requestFullscreen().catch(err => console.log('Fullscreen blocked:', err));
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => console.log('Fullscreen blocked:', err));
      }
    }

    // Add Esc key listener to close cleanly
    if (!this._papanEscListener) {
      this._papanEscListener = (e) => {
        if (e.key === 'Escape') {
          this.closePapanInformasiUnsurModal();
        }
      };
      window.addEventListener('keydown', this._papanEscListener);
    }
  },

  closePapanInformasiUnsurModal() {
    const modal = document.getElementById('papanInformasiUnsurModal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
    }
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.log(err));
      }
    }
    if (this._papanEscListener) {
      window.removeEventListener('keydown', this._papanEscListener);
      this._papanEscListener = null;
    }
  },

  toggleNativeFullscreen(elementId) {
    const elem = document.getElementById(elementId) || document.documentElement;
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.log(err));
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.log(err));
      }
    }
  },

  handleLogout() {
    API.clearToken();
    this.currentUser = null;
    document.body.classList.remove('user-logged-in');
    document.body.classList.remove('has-mobile-portal');
    Utils.showToast('Anda telah logout.', 'info');
    this.renderHeaderNav();
    this.renderView();
  },

  // =========================================================================
  // MODUL PIAGAM PENGHARGAAN (CERTIFICATE MANAGEMENT, GENERATOR & PRINT)
  // =========================================================================
  activePiagamSubTab: 'preview',
  piagamParticipantsCache: [],
  selectedPiagamParticipant: null,

  async renderTabPiagam(container) {
    container.innerHTML = `
      <div class="panel-card" style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.25rem;">
          <div>
            <h3 class="panel-title" style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-scroll" style="color: #dc2626;"></i> Pengelolaan & Cetak Piagam Penghargaan PMI
            </h3>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #64748b;">
              Atur format Kop, Ketua & Tanda Tangan/Stempel Basah, generate nomor piagam masal, dan cetak piagam peserta.
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-outline btn-sm ${this.activePiagamSubTab === 'preview' ? 'active' : ''}" id="btnPiagamSubPrv" onclick="App.switchPiagamSubTab('preview')">
              <i class="fa-solid fa-eye"></i> Live Preview & Cetak
            </button>
            <button class="btn btn-outline btn-sm ${this.activePiagamSubTab === 'generate' ? 'active' : ''}" id="btnPiagamSubGen" onclick="App.switchPiagamSubTab('generate')">
              <i class="fa-solid fa-bolt"></i> Generate Nomor Masal
            </button>
            <button class="btn btn-outline btn-sm ${this.activePiagamSubTab === 'settings' ? 'active' : ''}" id="btnPiagamSubSet" onclick="App.switchPiagamSubTab('settings')">
              <i class="fa-solid fa-gears"></i> Pengaturan Piagam
            </button>
          </div>
        </div>

        <div id="piagamSubTabContent">
          <p style="text-align: center; padding: 2rem; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Memuat modul piagam...</p>
        </div>
      </div>
    `;

    this.switchPiagamSubTab(this.activePiagamSubTab || 'preview');
  },

  async switchPiagamSubTab(subTab) {
    this.activePiagamSubTab = subTab;
    const content = document.getElementById('piagamSubTabContent');
    if (!content) return;

    ['Prv', 'Gen', 'Set'].forEach(key => {
      const btn = document.getElementById('btnPiagamSub' + key);
      if (btn) btn.classList.remove('active');
    });

    if (subTab === 'preview') {
      const btn = document.getElementById('btnPiagamSubPrv');
      if (btn) btn.classList.add('active');
      this.renderPiagamPreviewTab(content);
    } else if (subTab === 'generate') {
      const btn = document.getElementById('btnPiagamSubGen');
      if (btn) btn.classList.add('active');
      this.renderPiagamGenerateTab(content);
    } else if (subTab === 'settings') {
      const btn = document.getElementById('btnPiagamSubSet');
      if (btn) btn.classList.add('active');
      this.renderPiagamSettingsTab(content);
    }
  },

  async renderPiagamPreviewTab(container) {
    container.innerHTML = `
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; justify-content: space-between; background: #f8fafc; padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 1.25rem;">
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; flex: 1;">
          <select id="piagamFilterUnit" class="form-control" style="width: 200px; font-size: 0.82rem;" onchange="App.loadPiagamParticipants()">
            <option value="">-- Semua Kontingen --</option>
          </select>
          <select id="piagamFilterRole" class="form-control" style="width: 180px; font-size: 0.82rem;" onchange="App.loadPiagamParticipants()">
            <option value="">-- Semua Unsur / Role --</option>
            <option value="Mula">PMR Mula</option>
            <option value="Madya">PMR Madya</option>
            <option value="Wira">PMR Wira</option>
            <option value="PANITIA">Panitia</option>
            <option value="FASILITATOR">Fasilitator / Pendamping</option>
          </select>
          <input type="text" id="piagamSearch" class="form-control" placeholder="Cari Nama / No Piagam..." style="width: 220px; font-size: 0.82rem;" oninput="App.loadPiagamParticipants()">
        </div>

        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="btn btn-primary btn-sm" onclick="App.printSelectedPiagam()"><i class="fa-solid fa-print"></i> Cetak Piagam Terpilih</button>
          <button class="btn btn-outline btn-sm" onclick="App.printAllFilteredPiagam()"><i class="fa-solid fa-file-pdf"></i> Cetak Semua</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 380px 1fr; gap: 1.25rem; align-items: start;">
        <!-- Left Column: Participants Table -->
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
          <div style="padding: 0.75rem 1rem; background: #1e293b; color: white; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; font-size: 0.88rem;"><i class="fa-solid fa-users"></i> Peserta Terverifikasi</span>
            <label style="font-size: 0.78rem; font-weight: 600; cursor: pointer; color: #94a3b8; margin: 0; display: flex; align-items: center; gap: 0.3rem;">
              <input type="checkbox" id="checkAllPiagam" onchange="App.toggleSelectAllPiagam(this.checked)"> Pilih Semua
            </label>
          </div>

          <div style="max-height: 650px; overflow-y: auto;" id="piagamParticipantsListContainer">
            <p style="text-align: center; padding: 2rem 0; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data peserta...</p>
          </div>
        </div>

        <!-- Right Column: Live Piagam Certificate Preview -->
        <div style="background: #cbd5e1; border: 1px solid #94a3b8; border-radius: 8px; padding: 1.25rem; display: flex; flex-direction: column; align-items: center; box-shadow: inset 0 2px 6px rgba(0,0,0,0.1);">
          <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; background: #ffffff; padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid #cbd5e1;">
            <h4 style="margin: 0; font-size: 0.95rem; font-weight: 800; color: #0f172a;"><i class="fa-solid fa-certificate" style="color: #dc2626;"></i> Pratinjau Tampilan Piagam Official</h4>
            <button class="btn btn-sm btn-danger" onclick="App.printSinglePiagamPreview()"><i class="fa-solid fa-print"></i> Cetak Piagam Ini</button>
          </div>

          <div id="piagamLivePreviewCard" style="width: 100%; overflow-x: auto; display: flex; justify-content: center; padding: 1rem 0;">
            <p style="text-align: center; padding: 3rem; color: #64748b;">Pilih salah satu peserta di tabel sebelah kiri untuk melihat pratinjau piagam.</p>
          </div>
        </div>
      </div>
    `;

    // Populate units dropdown
    const unitSelect = document.getElementById('piagamFilterUnit');
    if (unitSelect && this.cachedUnits) {
      unitSelect.innerHTML = '<option value="">-- Semua Kontingen --</option>' + 
        this.cachedUnits.map(u => `<option value="${u.id}">${Utils.escapeHtml(u.name)}</option>`).join('');
    }

    this.loadPiagamParticipants();
  },

  async renderPiagamGenerateTab(container) {
    const configRes = await API.getCertificateConfig();
    const cfg = configRes.settings || {};
    const stats = configRes.stats || {};

    container.innerHTML = `
      <div style="max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 1.5rem;">
        <h4 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-top: 0; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem;">
          <i class="fa-solid fa-bolt" style="color: #d97706;"></i> Generator Nomor Piagam Masal
        </h4>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; background: #f8fafc; padding: 1rem; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div>
            <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Total Peserta Terverifikasi:</span>
            <h3 style="margin: 0.2rem 0 0 0; color: #2563eb; font-weight: 900; font-size: 1.4rem;">${stats.total_verified || 0}</h3>
          </div>
          <div>
            <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Sudah Memiliki Nomor Piagam:</span>
            <h3 style="margin: 0.2rem 0 0 0; color: #16a34a; font-weight: 900; font-size: 1.4rem;">${stats.total_generated || 0}</h3>
          </div>
        </div>

        <form onsubmit="App.handleGeneratePiagamNumbersSubmit(event)">
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label style="font-weight: 700; font-size: 0.85rem; color: #334155;">Format Pattern Nomor Piagam:</label>
            <input type="text" id="genPiagamPattern" class="form-control" value="${Utils.escapeHtml(cfg.piagam_number_format || '{NO}/02.05/JUMTEK-II/IX/2025')}" required>
            <small style="color: #64748b; font-size: 0.78rem;">Gunakan tag <code>{NO}</code> yang akan diganti nomor urut otomatis (contoh: <code>0001</code>, <code>0002</code>, dst).</small>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
            <div class="form-group">
              <label style="font-weight: 700; font-size: 0.85rem; color: #334155;">Nomor Urut Mulai (Start No):</label>
              <input type="number" id="genPiagamStartNo" class="form-control" value="1" min="1" required>
            </div>
            <div class="form-group">
              <label style="font-weight: 700; font-size: 0.85rem; color: #334155;">Filter Kontingen:</label>
              <select id="genPiagamUnit" class="form-control">
                <option value="0">-- Semua Kontingen Unit --</option>
                ${(this.cachedUnits || []).map(u => `<option value="${u.id}">${Utils.escapeHtml(u.name)}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="font-weight: 700; font-size: 0.85rem; color: #334155;">Mode Pembuatan Nomor:</label>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.35rem;">
              <label style="font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                <input type="radio" name="genPiagamForce" value="0" checked> Generate hanya untuk peserta yang BELUM memiliki nomor piagam (Aman)
              </label>
              <label style="font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; color: #dc2626;">
                <input type="radio" name="genPiagamForce" value="1"> Timpa & buat ulang SEMUA nomor piagam peserta dari awal
              </label>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; font-weight: 800; padding: 0.75rem;">
            <i class="fa-solid fa-bolt"></i> Jalankan Auto-Generate Nomor Piagam Masal
          </button>
        </form>
      </div>
    `;
  },

  async renderPiagamSettingsTab(container) {
    const configRes = await API.getCertificateConfig();
    const cfg = configRes.settings || {};

    container.innerHTML = `
      <form onsubmit="App.handleSavePiagamSettingsSubmit(event)" style="max-width: 900px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 1.5rem;">
        <h4 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-top: 0; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem;">
          <i class="fa-solid fa-gears" style="color: #4f46e5;"></i> Pengaturan Template Piagam Penghargaan PMI
        </h4>

        <!-- Section 1: Header / Kop PMI -->
        <div style="margin-bottom: 1.5rem; background: #f8fafc; padding: 1.25rem; border-radius: 6px; border: 1px solid #e2e8f0;">
          <h5 style="margin: 0 0 0.85rem 0; font-size: 0.95rem; font-weight: 800; color: #1e293b;"><i class="fa-solid fa-heading" style="color: #dc2626;"></i> Kop Surat & Nama Pengurus PMI</h5>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label style="font-weight: 700; font-size: 0.82rem;">Baris 1 (contoh: Pengurus Daerah):</label>
              <input type="text" id="piagam_org_line1" class="form-control" value="${Utils.escapeHtml(cfg.piagam_org_line1 || 'Pengurus Daerah')}">
            </div>
            <div class="form-group">
              <label style="font-weight: 700; font-size: 0.82rem;">Baris 2 (contoh: PALANG MERAH INDONESIA):</label>
              <input type="text" id="piagam_org_line2" class="form-control" value="${Utils.escapeHtml(cfg.piagam_org_line2 || 'PALANG MERAH INDONESIA')}">
            </div>
            <div class="form-group">
              <label style="font-weight: 700; font-size: 0.82rem;">Baris 3 (contoh: Daerah Istimewa Yogyakarta):</label>
              <input type="text" id="piagam_org_line3" class="form-control" value="${Utils.escapeHtml(cfg.piagam_org_line3 || 'Daerah Istimewa Yogyakarta')}">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label style="font-weight: 700; font-size: 0.82rem;">Judul Atas (contoh: Menyampaikan):</label>
              <input type="text" id="piagam_title_top" class="form-control" value="${Utils.escapeHtml(cfg.piagam_title_top || 'Menyampaikan')}">
            </div>
            <div class="form-group">
              <label style="font-weight: 700; font-size: 0.82rem;">Judul Utama (contoh: PENGHARGAAN):</label>
              <input type="text" id="piagam_title_main" class="form-control" value="${Utils.escapeHtml(cfg.piagam_title_main || 'PENGHARGAAN')}">
            </div>
          </div>
        </div>

        <!-- Section 2: Upload Assets (Kop Surat/Logo, TTD & Stempel Basah) -->
        <div style="margin-bottom: 1.5rem; background: #f8fafc; padding: 1.25rem; border-radius: 6px; border: 1px solid #e2e8f0;">
          <h5 style="margin: 0 0 0.85rem 0; font-size: 0.95rem; font-weight: 800; color: #1e293b;"><i class="fa-solid fa-file-image" style="color: #dc2626;"></i> Asset Gambar (Kop Surat, Logo, Tanda Tangan & Stempel)</h5>
          
          <!-- Upload Kop Surat / Header Logo -->
          <div style="background: #ffffff; padding: 1rem; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 1rem;">
            <label style="font-weight: 700; font-size: 0.85rem; display: block; margin-bottom: 0.5rem;">Gambar Kop Surat / Header Logo Piagam (PNG/JPG):</label>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="width: 140px; height: 75px; border: 1px dashed #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: #fafafa; overflow: hidden;" id="piagamKopPreviewBox">
                ${cfg.piagam_header_logo ? `<img src="${cfg.piagam_header_logo}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` : '<span style="font-size: 0.72rem; color: #94a3b8;">Belum ada Kop Gambar</span>'}
              </div>
              <div>
                <input type="file" id="inputPiagamKop" accept="image/*" style="font-size: 0.8rem; margin-bottom: 0.35rem;" onchange="App.handleUploadPiagamAssetChange('kop', this)">
                <small style="color: #64748b; font-size: 0.75rem; display: block;">Upload gambar Kop Surat lengkap beserta logo PMI / penyelenggara.</small>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
            <!-- Upload TTD -->
            <div style="background: #ffffff; padding: 1rem; border-radius: 6px; border: 1px solid #cbd5e1;">
              <label style="font-weight: 700; font-size: 0.85rem; display: block; margin-bottom: 0.5rem;">Gambar Tanda Tangan Ketua (PNG Transparan):</label>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 120px; height: 70px; border: 1px dashed #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: #fafafa; overflow: hidden;" id="piagamSigPreviewBox">
                  ${cfg.piagam_signature_image ? `<img src="${cfg.piagam_signature_image}" style="max-width: 100%; max-height: 100%;">` : '<span style="font-size: 0.72rem; color: #94a3b8;">Belum ada TTD</span>'}
                </div>
                <div>
                  <input type="file" id="inputPiagamSig" accept="image/*" style="font-size: 0.8rem; margin-bottom: 0.35rem;" onchange="App.handleUploadPiagamAssetChange('signature', this)">
                  <small style="color: #64748b; font-size: 0.75rem; display: block;">Format PNG dengan background transparan disarankan.</small>
                </div>
              </div>
            </div>

            <!-- Upload Stempel -->
            <div style="background: #ffffff; padding: 1rem; border-radius: 6px; border: 1px solid #cbd5e1;">
              <label style="font-weight: 700; font-size: 0.85rem; display: block; margin-bottom: 0.5rem;">Gambar Stempel Basah PMI (PNG Transparan):</label>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 120px; height: 70px; border: 1px dashed #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: #fafafa; overflow: hidden;" id="piagamStampPreviewBox">
                  ${cfg.piagam_stamp_image ? `<img src="${cfg.piagam_stamp_image}" style="max-width: 100%; max-height: 100%;">` : '<span style="font-size: 0.72rem; color: #94a3b8;">Belum ada Stempel</span>'}
                </div>
                <div>
                  <input type="file" id="inputPiagamStamp" accept="image/*" style="font-size: 0.8rem; margin-bottom: 0.35rem;" onchange="App.handleUploadPiagamAssetChange('stamp', this)">
                  <small style="color: #64748b; font-size: 0.75rem; display: block;">Stempel akan di-overlay secara pas di atas TTD.</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Signer Details & Event Information -->
        <div style="margin-bottom: 1.5rem; background: #f8fafc; padding: 1.25rem; border-radius: 6px; border: 1px solid #e2e8f0;">
          <h5 style="margin: 0 0 0.85rem 0; font-size: 0.95rem; font-weight: 800; color: #1e293b;"><i class="fa-solid fa-pen-nib" style="color: #059669;"></i> Detail Nama Penandatangan & Tempat/Tanggal</h5>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label style="font-weight: 700; font-size: 0.82rem;">Jabatan (contoh: Ketua,):</label>
              <input type="text" id="piagam_signer_title" class="form-control" value="${Utils.escapeHtml(cfg.piagam_signer_title || 'Ketua,')}">
            </div>
            <div class="form-group">
              <label style="font-weight: 700; font-size: 0.82rem;">Nama Lengkap & Gelar Ketua:</label>
              <input type="text" id="piagam_signer_name" class="form-control" value="${Utils.escapeHtml(cfg.piagam_signer_name || 'GBPH. H. Prabukusumo, S.Psi.')}">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label style="font-weight: 700; font-size: 0.82rem;">Tempat & Tanggal Penerbitan (contoh: Yogyakarta, 29 September 2025):</label>
              <input type="text" id="piagam_city_date" class="form-control" value="${Utils.escapeHtml(cfg.piagam_city_date || 'Yogyakarta, 29 September 2025')}">
            </div>
            <div class="form-group">
              <label style="font-weight: 700; font-size: 0.82rem;">Tampilkan QR Code Verifikasi:</label>
              <select id="piagam_show_qr" class="form-control">
                <option value="1" ${cfg.piagam_show_qr !== '0' ? 'selected' : ''}>Ya, Tampilkan QR Code Verifikasi di Piagam</option>
                <option value="0" ${cfg.piagam_show_qr === '0' ? 'selected' : ''}>Tidak (Sembunyikan QR Code)</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label style="font-weight: 700; font-size: 0.82rem;">Judul Kegiatan Line 1:</label>
              <input type="text" id="piagam_event_line1" class="form-control" value="${Utils.escapeHtml(cfg.piagam_event_line1 || 'Jumbara & Temu Karya PMI Daerah Istimewa Yogyakarta Tahun 2025')}">
            </div>
            <div class="form-group">
              <label style="font-weight: 700; font-size: 0.82rem;">Lokasi & Tanggal Kegiatan Line 2:</label>
              <input type="text" id="piagam_event_line2" class="form-control" value="${Utils.escapeHtml(cfg.piagam_event_line2 || 'Jaka Garong, 27-29 September 2025')}">
            </div>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; font-weight: 800; padding: 0.75rem;">
          <i class="fa-solid fa-floppy-disk"></i> Simpan Pengaturan Template Piagam
        </button>
      </form>
    `;
  },

  async loadPiagamParticipants() {
    const listContainer = document.getElementById('piagamParticipantsListContainer');
    if (!listContainer) return;

    const unitId = document.getElementById('piagamFilterUnit')?.value || '';
    const role = document.getElementById('piagamFilterRole')?.value || '';
    const search = document.getElementById('piagamSearch')?.value || '';

    listContainer.innerHTML = '<p style="text-align: center; padding: 2rem 0; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data peserta...</p>';

    try {
      const res = await API.getCertificateParticipants({ unit_id: unitId, role, search });
      this.piagamParticipantsCache = res.participants || [];

      if (!this.piagamParticipantsCache.length) {
        listContainer.innerHTML = '<p style="text-align: center; padding: 2rem 1rem; color: #64748b; font-size: 0.85rem;">Tidak ada peserta terverifikasi yang cocok.</p>';
        return;
      }

      listContainer.innerHTML = `
        <table class="table" style="font-size: 0.78rem; width: 100%; margin: 0; border-collapse: collapse;">
          <tbody>
            ${this.piagamParticipantsCache.map(p => `
              <tr style="border-bottom: 1px solid #e2e8f0; cursor: pointer;" onclick="App.previewSinglePiagam(${p.id})">
                <td style="width: 30px; text-align: center; padding: 8px;" onclick="event.stopPropagation();">
                  <input type="checkbox" class="cb-piagam-select" value="${p.id}">
                </td>
                <td style="padding: 8px 10px;">
                  <strong style="color: #0f172a; display: block; font-size: 0.84rem;">${Utils.escapeHtml(p.full_name)}</strong>
                  <span style="color: #64748b; font-size: 0.75rem;">${Utils.escapeHtml(p.unit_name || '')} (${p.level || (Array.isArray(p.sub_categories) ? p.sub_categories.join(',') : p.sub_categories) || 'Peserta'})</span>
                  ${p.certificate_number ? `
                    <span style="display: block; font-family: monospace; font-size: 0.72rem; color: #16a34a; font-weight: 700; margin-top: 2px;">
                      <i class="fa-solid fa-certificate"></i> ${Utils.escapeHtml(p.certificate_number)}
                    </span>
                  ` : `
                    <span style="display: block; font-size: 0.72rem; color: #dc2626; font-weight: 600; margin-top: 2px;">Belum ada nomor</span>
                  `}
                </td>
                <td style="width: 40px; text-align: right; padding: 8px;">
                  <button class="btn btn-outline btn-xs" style="padding: 2px 6px; font-size: 0.7rem;" onclick="event.stopPropagation(); App.previewSinglePiagam(${p.id})"><i class="fa-solid fa-eye"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      if (this.piagamParticipantsCache.length > 0 && !this.selectedPiagamParticipant) {
        this.previewSinglePiagam(this.piagamParticipantsCache[0].id);
      } else if (this.selectedPiagamParticipant) {
        this.previewSinglePiagam(this.selectedPiagamParticipant.id);
      }
    } catch (err) {
      console.error('Error loading piagam participants:', err);
      listContainer.innerHTML = `<p style="color: red; padding: 1rem; text-align: center;">Gagal memuat peserta: ${Utils.escapeHtml(err.message)}</p>`;
    }
  },

  toggleSelectAllPiagam(checked) {
    document.querySelectorAll('.cb-piagam-select').forEach(cb => {
      cb.checked = checked;
    });
  },

  async previewSinglePiagam(participantId) {
    const previewBox = document.getElementById('piagamLivePreviewCard');
    if (!previewBox) return;

    const participant = this.piagamParticipantsCache.find(p => p.id === participantId) || this.piagamParticipantsCache[0];
    if (!participant) return;

    this.selectedPiagamParticipant = participant;

    try {
      const configRes = await API.getCertificateConfig();
      const cfg = configRes.settings || {};
      const html = this.buildPiagamHTML(participant, cfg);
      previewBox.innerHTML = html;
    } catch (err) {
      console.error('Error previewing piagam:', err);
    }
  },

  buildPiagamHTML(p, cfg) {
    const qrText = `${window.location.origin}${window.APP_BASE_URL || '/'}?verify_cert=${encodeURIComponent(p.certificate_number || p.code || p.id)}`;
    const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrText)}`;

    const certNo = p.certificate_number || (cfg.piagam_number_format || '{NO}/02.05/JUMTEK-II/IX/2025').replace('{NO}', '0001');

    const roleText = (p.level ? 'PESERTA ' + p.level : (Array.isArray(p.sub_categories) ? p.sub_categories.join(' / ') : (p.sub_categories || 'PESERTA'))).toUpperCase();

    return `
      <div class="piagam-paper" id="piagamCard_${p.id}" style="width: 210mm; min-height: 297mm; padding: 0 0 15mm 0; background: #ffffff; color: #000000; font-family: 'Trebuchet MS', 'Segoe UI', Arial, sans-serif; border: 1px solid #cbd5e1; box-shadow: 0 5px 25px rgba(0,0,0,0.18); margin: 0 auto; position: relative; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; transform-origin: top center;">
        
        ${cfg.piagam_header_logo ? `
          <!-- Custom Kop Gambar Uploaded (Full Width Edge-to-Edge Mentok Atas) -->
          <div style="width: 100%; margin: 0 0 20px 0; padding: 0; line-height: 0; overflow: hidden;">
            <img src="${cfg.piagam_header_logo}" style="width: 100%; height: auto; display: block; object-fit: contain;">
          </div>
        ` : `
          <!-- Official PMI Top Red Header Banner -->
          <div style="width: 100%; height: 18px; background: linear-gradient(90deg, #dc2626 0%, #ef4444 60%, #fca5a5 100%); margin-bottom: 25px;"></div>
        `}

        <div style="padding: 0 18mm; flex: 1; display: flex; flex-direction: column; justify-content: space-between; text-align: center;">
          
          ${!cfg.piagam_header_logo ? `
            <!-- Default Logo & Header Palang Merah Indonesia -->
            <div style="text-align: center; margin-bottom: 25px; position: relative;">
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
                <img src="${(this.appSettings && this.appSettings.app_logo) || 'frontend/images/logo-pmi.svg'}" style="height: 65px; margin-bottom: 4px; object-fit: contain;">
                <span style="font-family: 'Trebuchet MS', sans-serif; font-weight: 700; font-size: 13pt; color: #000000; letter-spacing: 0.5px;">Palang Merah Indonesia</span>
              </div>
            </div>
          ` : ''}

          <!-- Body Content with Exact PMI Brand Guidelines Point Sizes -->
          <div style="text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center;">
            
            <!-- PIAGAM PENGHARGAAN (35pt Bold Trebuchet MS) -->
            <h1 style="font-size: 35pt; margin: 0 0 6px 0; font-weight: 800; font-family: 'Trebuchet MS', sans-serif; color: #000000; letter-spacing: 1.5px; text-transform: uppercase;">
              ${Utils.escapeHtml(cfg.piagam_title_main || 'PIAGAM PENGHARGAAN')}
            </h1>

            <!-- No : 0234/2013 (15pt Trebuchet MS + 2 Spasi Gap) -->
            <p style="font-size: 15pt; margin: 0 0 30px 0; font-weight: 700; font-family: 'Trebuchet MS', sans-serif; color: #000000;">
              No : <span style="font-family: 'Trebuchet MS', monospace; font-size: 15pt;">${Utils.escapeHtml(certNo)}</span>
            </p>

            <!-- Diberikan kepada : (20pt Trebuchet MS) -->
            <p style="font-size: 20pt; margin: 0 0 12px 0; font-weight: 600; font-family: 'Trebuchet MS', sans-serif; color: #000000;">
              ${Utils.escapeHtml(cfg.piagam_text_given_to || 'Diberikan kepada :')}
            </p>

            <!-- MUHAMMAD SOBARI (25pt Bold ALL CAPS Trebuchet MS) -->
            <h2 style="font-size: 25pt; margin: 0 0 6px 0; font-weight: 800; font-family: 'Trebuchet MS', sans-serif; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">
              ${Utils.escapeHtml(p.full_name)}
            </h2>

            <!-- PMI Provinsi Kalimantan Selatan / Unit (20pt Trebuchet MS + 1 Spasi Gap) -->
            <h3 style="font-size: 20pt; margin: 0 0 24px 0; font-weight: 700; font-family: 'Trebuchet MS', sans-serif; color: #000000;">
              ${Utils.escapeHtml(p.unit_name || 'PMI Kota Yogyakarta')}
            </h3>

            <!-- Sebagai (20pt Trebuchet MS) -->
            <p style="font-size: 20pt; margin: 0 0 6px 0; font-weight: 600; font-family: 'Trebuchet MS', sans-serif; color: #000000;">
              ${Utils.escapeHtml(cfg.piagam_text_as || 'Sebagai')}
            </p>

            <!-- PESERTA (20pt Bold ALL CAPS Trebuchet MS) -->
            <h4 style="font-size: 20pt; margin: 0 0 26px 0; font-weight: 800; font-family: 'Trebuchet MS', sans-serif; color: #000000; text-transform: uppercase; letter-spacing: 1px;">
              ${Utils.escapeHtml(roleText)}
            </h4>

            <!-- Pelatihan Penyegaran / Program Dukungan Psikososial (22pt Bold Trebuchet MS) -->
            <p style="font-size: 22pt; margin: 0 0 6px 0; font-weight: 800; font-family: 'Trebuchet MS', sans-serif; color: #000000; line-height: 1.25; max-width: 94%; margin-left: auto; margin-right: auto;">
              ${Utils.escapeHtml(cfg.piagam_event_line1 || 'Jumbara & Temu Karya PMI Daerah Istimewa Yogyakarta Tahun 2025')}
            </p>
            
            <!-- Jakarta, 23-24 Juli 2013 (20pt Trebuchet MS + 2 Spasi Gap) -->
            <p style="font-size: 20pt; margin: 0 0 30px 0; font-weight: 600; font-family: 'Trebuchet MS', sans-serif; color: #000000;">
              ${Utils.escapeHtml(cfg.piagam_event_line2 || 'Jaka Garong, 27-29 September 2025')}
            </p>
          </div>

          <!-- Signatures, Date, Wet Stamp & Verification QR Block (Rata Tengah) -->
          <div style="position: relative; margin-top: 15px; width: 100%; text-align: center;">
            
            <!-- QR Code Verification (Bottom Left Corner) -->
            ${cfg.piagam_show_qr !== '0' ? `
              <div style="position: absolute; left: 0; bottom: 0; text-align: center; width: 100px; z-index: 10;">
                <div style="display: inline-block; background: #ffffff; padding: 3px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  <img src="${qrImgSrc}" style="width: 70px; height: 70px; display: block;">
                </div>
                <p style="margin: 3px 0 0 0; font-size: 7.5pt; font-family: 'Trebuchet MS', sans-serif; color: #64748b; font-weight: 700;">Verifikasi Piagam</p>
              </div>
            ` : ''}

            <!-- Center Signature Block -->
            <div style="text-align: center; margin: 0 auto; max-width: 460px; position: relative;">
              <!-- Yogyakarta, 29 September 2026 (15pt) -->
              <p style="font-size: 15pt; margin: 0 0 4px 0; font-weight: 600; font-family: 'Trebuchet MS', sans-serif; color: #000000;">
                ${Utils.escapeHtml(cfg.piagam_city_date || 'Yogyakarta, 29 September 2026')}
              </p>
              <!-- Pengurus Daerah (15pt) -->
              <p style="font-size: 15pt; margin: 0; font-weight: 700; font-family: 'Trebuchet MS', sans-serif; color: #000000;">
                ${Utils.escapeHtml(cfg.piagam_org_line1 || 'Pengurus Daerah')}
              </p>
              <!-- PALANG MERAH INDONESIA (16pt Bold ALL CAPS) -->
              <p style="font-size: 16pt; margin: 0; font-weight: 800; font-family: 'Trebuchet MS', sans-serif; color: #000000; text-transform: uppercase;">
                ${Utils.escapeHtml(cfg.piagam_org_line2 || 'PALANG MERAH INDONESIA')}
              </p>
              <!-- Daerah Istimewa Yogyakarta (15pt) -->
              <p style="font-size: 15pt; margin: 0 0 4px 0; font-weight: 700; font-family: 'Trebuchet MS', sans-serif; color: #000000;">
                ${Utils.escapeHtml(cfg.piagam_org_line3 || 'Daerah Istimewa Yogyakarta')}
              </p>
              <!-- Ketua, (15pt) -->
              <p style="font-size: 15pt; margin: 0 0 8px 0; font-weight: 700; font-family: 'Trebuchet MS', sans-serif; color: #000000;">
                ${Utils.escapeHtml(cfg.piagam_signer_title || 'Ketua,')}
              </p>

              <!-- Signature & Stamp Container (Smart Relative Anchoring) -->
              <div style="height: 75px; margin: 4px 0; display: flex; justify-content: center; align-items: center;">
                <div style="position: relative; display: inline-flex; align-items: center; justify-content: center; min-width: 180px;">
                  
                  <!-- Wet Stamp: Smartly anchors to the left edge of signature, overlapping it naturally -->
                  ${cfg.piagam_stamp_image ? `
                    <img src="${cfg.piagam_stamp_image}" style="position: absolute; left: -40px; top: -10px; height: 95px; width: 95px; opacity: 0.85; pointer-events: none; z-index: 2; object-fit: contain;">
                  ` : `
                    <div style="position: absolute; left: -35px; top: -8px; width: 85px; height: 85px; border: 3px double #1d4ed8; border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(-12deg); opacity: 0.75; color: #1d4ed8; font-size: 8pt; font-weight: 900; font-family: 'Trebuchet MS', sans-serif; text-align: center; padding: 2px; z-index: 2; pointer-events: none;">
                      STEMPEL RESMI<br>PMI D.I.Y.
                    </div>
                  `}

                  <!-- Signature Image or Brush Script Fallback -->
                  ${cfg.piagam_signature_image ? `
                    <img src="${cfg.piagam_signature_image}" style="height: 70px; max-width: 230px; z-index: 3; position: relative;">
                  ` : `
                    <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 28pt; color: #0f172a; z-index: 3; position: relative; font-style: italic;">
                      ${Utils.escapeHtml(cfg.piagam_signer_name?.split(',')[0] || 'GBPH. H. Prabukusumo')}
                    </div>
                  `}
                </div>
              </div>

              <!-- GBPH. H. Prabukusumo, S.Psi. (18pt Bold Trebuchet MS) -->
              <p style="font-size: 18pt; margin: 6px 0 0 0; font-weight: 800; font-family: 'Trebuchet MS', sans-serif; color: #000000;">
                ${Utils.escapeHtml(cfg.piagam_signer_name || 'GBPH. H. Prabukusumo, S.Psi.')}
              </p>
            </div>

          </div>

        </div>

      </div>
    `;
  },

  async handleSavePiagamSettingsSubmit(e) {
    e.preventDefault();
    const payload = {
      piagam_org_line1: document.getElementById('piagam_org_line1')?.value,
      piagam_org_line2: document.getElementById('piagam_org_line2')?.value,
      piagam_org_line3: document.getElementById('piagam_org_line3')?.value,
      piagam_title_top: document.getElementById('piagam_title_top')?.value,
      piagam_title_main: document.getElementById('piagam_title_main')?.value,
      piagam_signer_title: document.getElementById('piagam_signer_title')?.value,
      piagam_signer_name: document.getElementById('piagam_signer_name')?.value,
      piagam_city_date: document.getElementById('piagam_city_date')?.value,
      piagam_show_qr: document.getElementById('piagam_show_qr')?.value,
      piagam_event_line1: document.getElementById('piagam_event_line1')?.value,
      piagam_event_line2: document.getElementById('piagam_event_line2')?.value
    };

    try {
      const res = await API.saveCertificateConfig(payload);
      Utils.showToast(res.message || 'Pengaturan piagam berhasil disimpan!', 'success');
      this.switchPiagamSubTab('preview');
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async handleUploadPiagamAssetChange(assetType, inputEl) {
    const file = inputEl.files && inputEl.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileData = e.target.result;
      try {
        const res = await API.uploadCertificateAsset({ file_data: fileData, asset_type: assetType });
        Utils.showToast(res.message, 'success');
        
        const boxId = assetType === 'kop' ? 'piagamKopPreviewBox' : (assetType === 'stamp' ? 'piagamStampPreviewBox' : 'piagamSigPreviewBox');
        const box = document.getElementById(boxId);
        if (box) {
          box.innerHTML = `<img src="${res.url}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
        }
      } catch (err) {
        Utils.showToast('Gagal mengunggah gambar: ' + err.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  },

  async handleGeneratePiagamNumbersSubmit(e) {
    e.preventDefault();
    const pattern = document.getElementById('genPiagamPattern')?.value;
    const start_no = document.getElementById('genPiagamStartNo')?.value;
    const unit_id = document.getElementById('genPiagamUnit')?.value;
    const forceRadio = document.querySelector('input[name="genPiagamForce"]:checked');
    const force = forceRadio ? Number(forceRadio.value) : 0;

    try {
      const res = await API.generateCertificateNumbers({
        piagam_number_format: pattern,
        start_no,
        unit_id,
        force
      });
      Utils.showToast(res.message, 'success');
      this.switchPiagamSubTab('preview');
    } catch (err) {
      Utils.showToast('Gagal generate nomor piagam: ' + err.message, 'error');
    }
  },

  async printSelectedPiagam() {
    const checked = Array.from(document.querySelectorAll('.cb-piagam-select:checked')).map(cb => Number(cb.value));
    if (!checked.length) {
      Utils.showToast('Silakan pilih minimal satu peserta di tabel.', 'warning');
      return;
    }
    const selectedParts = this.piagamParticipantsCache.filter(p => checked.includes(p.id));
    this.openPiagamPrintWindow(selectedParts);
  },

  async printAllFilteredPiagam() {
    if (!this.piagamParticipantsCache.length) {
      Utils.showToast('Tidak ada peserta terverifikasi untuk dicetak.', 'warning');
      return;
    }
    this.openPiagamPrintWindow(this.piagamParticipantsCache);
  },

  async printSinglePiagamPreview() {
    if (!this.selectedPiagamParticipant) {
      Utils.showToast('Silakan pilih peserta terlebih dahulu.', 'warning');
      return;
    }
    this.openPiagamPrintWindow([this.selectedPiagamParticipant]);
  },

  async openPiagamPrintWindow(participants) {
    if (!participants || !participants.length) return;

    try {
      const configRes = await API.getCertificateConfig();
      const cfg = configRes.settings || {};

      const printWin = window.open('', '_blank');
      if (!printWin) {
        Utils.showToast('Jendela popup diblokir oleh browser. Harap izinkan popup untuk mencetak piagam.', 'error');
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Cetak Piagam Penghargaan PMI</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: 'Times New Roman', Times, serif, Arial;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .page-break {
              page-break-after: always;
              page-break-inside: avoid;
            }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="padding: 10px 20px; background: #1e293b; color: white; display: flex; justify-content: space-between; align-items: center; font-family: sans-serif;">
            <span>Siap mencetak ${participants.length} Piagam Penghargaan (A4 Portrait).</span>
            <button onclick="window.print()" style="padding: 8px 16px; background: #dc2626; color: white; border: none; font-weight: bold; border-radius: 4px; cursor: pointer;">
              🖨️ Cetak / Simpan Ke PDF
            </button>
          </div>

          ${participants.map(p => `
            <div class="page-break" style="padding: 15mm 12mm; width: 210mm; height: 297mm; box-sizing: border-box;">
              ${this.buildPiagamHTML(p, cfg)}
            </div>
          `).join('')}
        </body>
        </html>
      `;

      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
    } catch (err) {
      console.error('Error opening piagam print window:', err);
      Utils.showToast('Gagal memuat jendela cetak piagam: ' + err.message, 'error');
    }
  },

  handleSessionExpired(msg) {
    if (this._sessionExpiredHandled) return;
    this._sessionExpiredHandled = true;

    API.clearToken();
    this.currentUser = null;
    document.body.classList.remove('user-logged-in');
    document.body.classList.remove('has-mobile-portal');

    if (typeof Utils !== 'undefined' && Utils.showToast) {
      Utils.showToast(msg || 'Sesi Anda telah berakhir. Silakan login kembali.', 'warning');
    }

    this.renderHeaderNav();
    this.renderView();

    setTimeout(() => {
      this._sessionExpiredHandled = false;
    }, 2000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
