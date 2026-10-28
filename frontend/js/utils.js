/* ==========================================================================
   UTILITY HELPERS (Toasts, Date Formatting, CSV Export, Status Badges)
   ========================================================================== */

const Utils = {
  // Toast notification banner with FontAwesome icons
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '<i class="fa-solid fa-circle-info"></i>';
    if (type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === 'error') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';

    toast.innerHTML = `<span>${icon}</span> <span>${this.escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Modern Glassmorphism Confirmation Dialog Modal
  showConfirmModal({ title, message, icon = 'fa-solid fa-shield-halved', confirmText = 'Ya, Lanjutkan', confirmClass = 'btn-primary', cancelText = 'Batal' }) {
    return new Promise((resolve) => {
      let modal = document.getElementById('globalConfirmModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'globalConfirmModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
      }

      let btnBg = '#2563eb';
      if (confirmClass.includes('btn-success')) btnBg = '#16a34a';
      if (confirmClass.includes('btn-danger')) btnBg = '#dc2626';
      if (confirmClass.includes('btn-warning')) btnBg = '#d97706';

      modal.innerHTML = `
        <div class="modal-dialog" style="max-width: 480px; width: 92%; margin: auto; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.45); border: 1px solid rgba(226, 232, 240, 0.8);">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: white; padding: 1.35rem 1.5rem; display: flex; align-items: center; gap: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div style="width: 44px; height: 44px; background: rgba(255,255,255,0.12); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.35rem; flex-shrink: 0; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2);">
              <i class="${icon}" style="color: #fbbf24;"></i>
            </div>
            <div style="flex: 1;">
              <h3 style="font-size: 1.05rem; font-weight: 800; margin: 0; color: #ffffff; letter-spacing: -0.01em;">${this.escapeHtml(title || 'Konfirmasi Tindakan')}</h3>
              <p style="font-size: 0.76rem; margin: 0.2rem 0 0 0; opacity: 0.82; color: #cbd5e1;">Aplikasi Manajemen Jumbara PMR 2026</p>
            </div>
          </div>
          <div style="background: #ffffff; padding: 1.5rem; color: #1e293b; font-size: 0.93rem; line-height: 1.6;">
            ${message}
          </div>
          <div style="background: #f8fafc; padding: 1rem 1.5rem; display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; border-top: 1px solid #e2e8f0; flex-wrap: wrap;">
            <button type="button" id="confirmModalCancelBtn" class="btn btn-outline" style="padding: 0.65rem 1.25rem; font-weight: 700; border-radius: 8px; font-size: 0.88rem; min-height: 42px; cursor: pointer; color: #475569; background: #ffffff; border: 1px solid #cbd5e1; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;">
              ${this.escapeHtml(cancelText)}
            </button>
            <button type="button" id="confirmModalOkBtn" class="btn ${confirmClass}" style="padding: 0.65rem 1.45rem; font-weight: 800; border-radius: 8px; font-size: 0.88rem; min-height: 42px; cursor: pointer; color: #ffffff; background: ${btnBg}; border: none; box-shadow: 0 4px 14px rgba(0,0,0,0.2); display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;">
              ${confirmText}
            </button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.style.zIndex = '10005';
      modal.classList.add('active');
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';

      let isHandled = false;
      const closeModal = (result) => {
        if (isHandled) return;
        isHandled = true;
        const okBtn = document.getElementById('confirmModalOkBtn');
        const cancelBtn = document.getElementById('confirmModalCancelBtn');
        if (okBtn) okBtn.disabled = true;
        if (cancelBtn) cancelBtn.disabled = true;

        modal.classList.remove('active');
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        setTimeout(() => {
          modal.style.display = 'none';
          resolve(result);
        }, 150);
      };

      const cancelBtn = document.getElementById('confirmModalCancelBtn');
      const okBtn = document.getElementById('confirmModalOkBtn');

      if (cancelBtn) {
        cancelBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeModal(false);
        };
      }

      if (okBtn) {
        okBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          okBtn.disabled = true;
          okBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
          closeModal(true);
        };
      }
    });
  },

  // Format Date String to Indonesian localized string
  formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  },

  // Escape HTML to prevent XSS
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Export JSON array to downloadable CSV file
  exportToCSV(filename, rows) {
    if (!rows || !rows.length) {
      this.showToast('Tidak ada data untuk diexport.', 'error');
      return;
    }
    const keys = Object.keys(rows[0]);
    const csvContent = [
      keys.join(','),
      ...rows.map(row => keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast(`Berhasil mengunduh data ${filename}.csv`, 'success');
  },

  // Render Status Badge with FontAwesome vector icons
  getStatusBadgeHtml(status) {
    switch(status) {
      case 'pending_unit':
        return `<span class="status-badge badge-pending"><i class="fa-solid fa-hourglass-half"></i> Menunggu Unit</span>`;
      case 'revision':
        return `<span class="status-badge" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a;"><i class="fa-solid fa-triangle-exclamation"></i> Perlu Revisi</span>`;
      case 'verified_unit':
        return `<span class="status-badge badge-unit"><i class="fa-solid fa-user-clock"></i> Diverifikasi Unit</span>`;
      case 'verified_kabupaten':
        return `<span class="status-badge badge-kabupaten"><i class="fa-solid fa-user-check"></i> Disetujui Kabupaten</span>`;
      case 'rejected':
        return `<span class="status-badge badge-rejected"><i class="fa-solid fa-circle-xmark"></i> Ditolak</span>`;
      default:
        return `<span class="status-badge">${status}</span>`;
    }
  },

  // Render Unsur / Category Badge
  getLevelBadgeHtml(level) {
    if (!level) return '<span class="level-badge">-</span>';
    const lvl = level.toLowerCase();
    if (lvl.includes('kepala markas')) {
      return `<span class="level-badge" style="background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe;"><i class="fa-solid fa-user-tie"></i> Kepala Markas</span>`;
    }
    if (lvl.includes('ketua bidang')) {
      return `<span class="level-badge" style="background: #fae8ff; color: #86198f; border: 1px solid #f5d0fe;"><i class="fa-solid fa-user-shield"></i> Ketua Bidang PMR</span>`;
    }
    if (lvl.includes('forpis')) {
      return `<span class="level-badge" style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc;"><i class="fa-solid fa-people-group"></i> Koordinator Forpis</span>`;
    }
    if (lvl.includes('forel')) {
      return `<span class="level-badge" style="background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;"><i class="fa-solid fa-hands-holding-child"></i> Koordinator Forel</span>`;
    }
    if (lvl.includes('pengurus')) {
      return `<span class="level-badge" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;"><i class="fa-solid fa-user-tie"></i> Pengurus</span>`;
    }
    if (lvl.includes('relawan')) {
      return `<span class="level-badge" style="background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;"><i class="fa-solid fa-hand-holding-heart"></i> Relawan</span>`;
    }
    if (lvl.includes('pembina')) {
      return `<span class="level-badge" style="background: #fefce8; color: #a16207; border: 1px solid #fef08a;"><i class="fa-solid fa-chalkboard-user"></i> Pembina PMR</span>`;
    }
    if (lvl.includes('kepala sekolah')) {
      return `<span class="level-badge" style="background: #fdf2f8; color: #be185d; border: 1px solid #fbcfe8;"><i class="fa-solid fa-graduation-cap"></i> Kepala Sekolah</span>`;
    }
    if (lvl.includes('pegawai')) {
      return `<span class="level-badge" style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;"><i class="fa-solid fa-id-card-clip"></i> Pegawai</span>`;
    }
    if (lvl.includes('tsr')) {
      return `<span class="level-badge" style="background: #fff7ed; color: #9a3412; border: 1px solid #ffedd5;"><i class="fa-solid fa-heart-pulse"></i> TSR</span>`;
    }
    if (lvl.includes('ksr')) {
      return `<span class="level-badge" style="background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;"><i class="fa-solid fa-hand-holding-medical"></i> KSR</span>`;
    }
    if (lvl.includes('pmi kab') || lvl.includes('pmi kabupaten') || lvl.includes('markas')) {
      return `<span class="level-badge" style="background: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5;"><i class="fa-solid fa-building-flag"></i> PMI Kab</span>`;
    }
    if (lvl.includes('panitia')) {
      return `<span class="level-badge" style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc;"><i class="fa-solid fa-user-gear"></i> Panitia</span>`;
    }
    if (lvl.includes('peninjau')) {
      return `<span class="level-badge" style="background: #ecfdf5; color: #047857; border: 1px solid #6ee7b7;"><i class="fa-solid fa-eye"></i> Peninjau</span>`;
    }
    if (lvl.includes('pendamping')) {
      return `<span class="level-badge" style="background: #f0fdf4; color: #166534; border: 1px solid #86efac;"><i class="fa-solid fa-user-shield"></i> Pendamping</span>`;
    }
    if (lvl.includes('tamu')) {
      return `<span class="level-badge" style="background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe;"><i class="fa-solid fa-crown"></i> Tamu Undangan</span>`;
    }
    if (lvl.includes('media')) {
      return `<span class="level-badge" style="background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;"><i class="fa-solid fa-camera"></i> Media / Pers</span>`;
    }
    let cls = 'level-wira';
    if (lvl.includes('mula')) cls = 'level-mula';
    if (lvl.includes('madya')) cls = 'level-madya';
    return `<span class="level-badge ${cls}"><i class="fa-solid fa-user-tag"></i> ${Utils.escapeHtml(level)}</span>`;
  },

  // Mask Phone number to prevent scraping and privacy misuse (e.g. 0812-••••-8740)
  maskPhone(phone) {
    if (!phone) return '-';
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length < 7) return phone;
    const prefix = clean.substring(0, 4);
    const suffix = clean.substring(clean.length - 4);
    return `${prefix}-••••-${suffix}`;
  },

  // Identify unit category: 'PMR', 'KSR', 'TSR', or 'PMI Kab'
  getUnitCategory(u) {
    if (!u) return 'PMR';
    const cat = (u.level_category || '').toUpperCase().trim();
    const name = (u.name || '').toUpperCase().trim();
    if (cat === 'KSR' || cat.includes('KSR') || name.startsWith('KSR') || name.includes(' KSR ') || name.includes('KSR-') || name.includes('KORPS SUKARELA')) {
      return 'KSR';
    }
    if (cat === 'TSR' || cat.includes('TSR') || name.startsWith('TSR') || name.includes(' TSR ') || name.includes('TSR-') || name.includes('TENAGA SUKARELA')) {
      return 'TSR';
    }
    if (cat === 'PMI KAB' || cat.includes('PMI KAB') || cat.includes('MARKAS') || name.includes('PMI KAB') || name.includes('MARKAS PMI') || name.includes('PMI KABUPATEN') || name.includes('PENGURUS PMI') || name.includes('STAF PMI')) {
      return 'PMI Kab';
    }
    return 'PMR';
  }
};
