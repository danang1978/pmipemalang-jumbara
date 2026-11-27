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
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    });
  },

  // Format Attendance / Presensi Timestamp strictly to WIB (UTC+7)
  formatPresensiTime(ts) {
    if (!ts) return null;
    if (typeof ts === 'string') {
      const sqlMatch = ts.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
      if (sqlMatch && !ts.endsWith('Z')) {
        let [_, y, m, d, hh, mm] = sqlMatch;
        let hourNum = parseInt(hh, 10);
        // Safeguard: Jika jam < 10 (misal 04, 05, 06 hasil simpanan UTC server), otomatis sesuaikan +7 jam ke WIB
        if (hourNum < 10) {
          hourNum = (hourNum + 7) % 24;
          hh = String(hourNum).padStart(2, '0');
        }
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return {
          time: `${hh}.${mm} WIB`,
          date: `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1] || ''}`
        };
      }
    }
    const d = new Date(ts);
    if (isNaN(d.getTime())) return null;
    let hourNum = d.getHours();
    if (hourNum < 10) {
      d.setHours(d.getHours() + 7);
    }
    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
    const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' });
    return {
      time: `${timeStr.replace(':', '.')} WIB`,
      date: dateStr
    };
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

  // Generate 100% Offline SVG Data URL for QR Code
  getQRCodeUrl(text, size = 180) {
    if (!text) text = 'JMB-2026-0001';
    if (typeof window !== 'undefined' && window.QRCode && typeof window.QRCode.toString === 'function') {
      try {
        let svgStr = '';
        window.QRCode.toString(String(text), { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }, function(err, svg) {
          if (!err && svg) svgStr = svg;
        });
        if (svgStr) {
          return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgStr);
        }
      } catch (e) {
        console.warn('Local QRCode error, falling back to online API:', e);
      }
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(text)}`;
  },

  // Download QR Code as PNG image file
  downloadQRCode(code, filename) {
    const text = String(code || 'JMB-2026-0001');
    const fname = (filename || `QR-Presensi-${text}`).replace(/[^a-zA-Z0-9_-]/g, '_') + '.png';

    const triggerDownload = (dataUrl) => {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fname;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Utils.showToast(`Berhasil mengunduh QR Code ${text}`, 'success');
    };

    if (typeof window !== 'undefined' && window.QRCode && typeof window.QRCode.toDataURL === 'function') {
      window.QRCode.toDataURL(text, { width: 400, margin: 2, errorCorrectionLevel: 'H' }, (err, url) => {
        if (!err && url) {
          triggerDownload(url);
          return;
        }
        triggerDownload(this.getQRCodeUrl(text, 400));
      });
    } else {
      triggerDownload(this.getQRCodeUrl(text, 400));
    }
  },

  // Download QR Code Presensi with clear QR code & basic participant data (Fokus Scanner)
  downloadQRCodeWithIdentity(data, filename) {
    if (!data) return;
    const code = String(data.code || 'JMB-2026-0001');
    const name = String(data.full_name || 'Peserta').trim();
    const unit = String(data.unit_name || 'PMI KABUPATEN PEMALANG').trim();
    const level = String(data.level || 'Peserta').trim();
    const fname = (filename || `QR-Presensi-${code}`).replace(/[^a-zA-Z0-9_-]/g, '_') + '.png';

    const triggerDownload = (url) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = fname;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showToast(`QR Code Presensi ${code} berhasil diunduh!`, 'success');
    };

    const getQRDataUrl = () => {
      return new Promise((resolve) => {
        if (typeof window !== 'undefined' && window.QRCode && typeof window.QRCode.toDataURL === 'function') {
          window.QRCode.toDataURL(code, { width: 400, margin: 2, errorCorrectionLevel: 'H' }, (err, url) => {
            if (!err && url) resolve(url);
            else resolve(this.getQRCodeUrl(code, 400));
          });
        } else {
          resolve(this.getQRCodeUrl(code, 400));
        }
      });
    };

    getQRDataUrl().then((qrDataUrl) => {
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 760;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const roundRect = (c, x, y, w, h, r, fill, stroke) => {
          c.beginPath();
          c.moveTo(x + r, y);
          c.lineTo(x + w - r, y);
          c.quadraticCurveTo(x + w, y, x + w, y + r);
          c.lineTo(x + w, y + h - r);
          c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          c.lineTo(x + r, y + h);
          c.quadraticCurveTo(x, y + h, x, y + h - r);
          c.lineTo(x, y + r);
          c.quadraticCurveTo(x, y, x + r, y);
          c.closePath();
          if (fill) c.fill();
          if (stroke) c.stroke();
        };

        // Clip rounded card
        ctx.save();
        roundRect(ctx, 0, 0, 640, 760, 24, false, false);
        ctx.clip();

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 640, 760);

        // Header Gradient Banner
        const grad = ctx.createLinearGradient(0, 0, 640, 90);
        grad.addColorStop(0, '#7f1d1d');
        grad.addColorStop(0.5, '#b91c1c');
        grad.addColorStop(1, '#dc2626');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 90);

        // Header Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Inter, -apple-system, sans-serif';
        ctx.letterSpacing = '1.5px';
        ctx.fillText('PALANG MERAH INDONESIA KABUPATEN PEMALANG', 320, 38);

        ctx.fillStyle = '#fef08a';
        ctx.font = '900 18px Inter, -apple-system, sans-serif';
        ctx.letterSpacing = '1px';
        ctx.fillText('QR CODE PRESENSI JUMBARA PMR XII 2026', 320, 66);

        // Golden Accent Line
        ctx.fillStyle = '#eab308';
        ctx.fillRect(0, 86, 640, 4);

        // Large Crisp QR Code Box
        const qrBoxW = 400;
        const qrBoxH = 400;
        const qrBoxX = (640 - qrBoxW) / 2;
        const qrBoxY = 115;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        roundRect(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 20, true, true);

        // Draw QR Code Image (360x360 px, razor-sharp)
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(qrImg, qrBoxX + 20, qrBoxY + 20, 360, 360);

        // Monospaced Code Box
        const codeBoxW = 320;
        const codeBoxH = 46;
        const codeBoxX = (640 - codeBoxW) / 2;
        const codeBoxY = 535;
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        roundRect(ctx, codeBoxX, codeBoxY, codeBoxW, codeBoxH, 12, true, true);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 24px "JetBrains Mono", Courier, monospace';
        ctx.letterSpacing = '2px';
        ctx.fillText(code, 320, codeBoxY + 31);

        // Data Sedikit: Nama
        ctx.fillStyle = '#0f172a';
        let nameSize = 24;
        if (name.length > 30) nameSize = 19;
        else if (name.length > 22) nameSize = 21;
        ctx.font = `900 ${nameSize}px Inter, -apple-system, sans-serif`;
        ctx.fillText(name, 320, 620);

        // Data Sedikit: Role & Unit
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 16px Inter, -apple-system, sans-serif';
        const roleAndUnit = `${level.toUpperCase()} • ${unit}`;
        ctx.fillText(roleAndUnit, 320, 650);

        // Footer Banner
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 700, 640, 60);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Inter, -apple-system, sans-serif';
        ctx.letterSpacing = '1.5px';
        ctx.fillText('KARTU E-PRESENSI RESMI SCANNER LAPANGAN', 320, 736);

        ctx.restore();

        // Border
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        roundRect(ctx, 1, 1, 638, 758, 24, false, true);

        if (typeof canvas.toBlob === 'function') {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              triggerDownload(url);
              setTimeout(() => URL.revokeObjectURL(url), 10000);
            } else {
              triggerDownload(canvas.toDataURL('image/png', 1.0));
            }
          }, 'image/png', 1.0);
        } else {
          triggerDownload(canvas.toDataURL('image/png', 1.0));
        }
      };
      qrImg.src = qrDataUrl;
    }).catch((err) => {
      console.error('Error in downloadQRCodeWithIdentity:', err);
      this.downloadQRCode(code, fname);
    });
  },

  // Download DOM ID Card element as high-resolution PNG image
  async downloadIDCardElementAsImage(cardEl, filename, fallbackData) {
    const fname = (filename || 'ID-Card').replace(/[^a-zA-Z0-9_-]/g, '_') + '.png';

    // Prioritaskan generator canvas resmi agar desain ID Card 100% konsisten resmi dan tidak terpotong atau beda desain
    if (fallbackData && typeof this.downloadCompleteIDCardBadge === 'function') {
      this.downloadCompleteIDCardBadge(fallbackData, fname);
      return;
    }

    const triggerDownload = (url) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = fname;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showToast('ID Card Resmi berhasil diunduh!', 'success');
    };

    const h2c = (typeof window !== 'undefined' && window.html2canvas) ? window.html2canvas : (typeof html2canvas !== 'undefined' ? html2canvas : null);

    if (h2c && cardEl) {
      try {
        const canvas = await h2c(cardEl, {
          scale: 3, // 3x high-resolution crisp print quality
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        if (typeof canvas.toBlob === 'function') {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              triggerDownload(url);
              setTimeout(() => URL.revokeObjectURL(url), 10000);
            } else {
              triggerDownload(canvas.toDataURL('image/png', 1.0));
            }
          }, 'image/png', 1.0);
        } else {
          triggerDownload(canvas.toDataURL('image/png', 1.0));
        }
        return;
      } catch (e) {
        console.warn('html2canvas failed, using fallback badge generator:', e);
      }
    }

    if (fallbackData) {
      this.downloadCompleteIDCardBadge(fallbackData, fname);
    }
  },

  // Download Complete Official ID Card as high-resolution PNG image (Desain 100% Resmi Sesuai ID Card Cetak)
  downloadCompleteIDCardBadge(cardData, filename) {
    if (!cardData) return;
    const code = String(cardData.code || cardData.registration_code || 'JMB-2026-0001');
    const name = String(cardData.full_name || 'Peserta Jumbara').trim();
    const unit = String(cardData.unit_name || 'PMI KABUPATEN PEMALANG').trim();
    const level = String(cardData.level || cardData.registration_type || 'Peserta').trim();
    const photoUrl = cardData.photo_url || null;

    const s = {
      ...(typeof App !== 'undefined' ? (App.appSettings || {}) : {}),
      ...(cardData.settings || {}),
      ...(cardData || {})
    };

    const eventTitle = s.idcard_event_title || 'JUMBARA PMR IX';
    const eventSubtitle = s.idcard_event_subtitle || 'PALANG MERAH INDONESIA TAHUN 2026';
    const eventMotto = s.idcard_motto || '#JUMBARAPMR2026';
    const eventDate = s.idcard_date || 'Kabupaten, 2026';
    const appLogoUrl = s.app_logo || (typeof App !== 'undefined' && App.appSettings?.app_logo) || 'uploads/logo_1791009905.jpg';
    const eventLogoUrl = s.event_logo || (typeof App !== 'undefined' && App.appSettings?.event_logo) || 'frontend/images/logo-jumbara-xii.png';
    const templateBgUrl = s.idcard_template || null;

    let categoryTitle = (cardData.registration_type && cardData.registration_type !== 'Peserta') ? cardData.registration_type : 'PESERTA';
    if (categoryTitle.toUpperCase() === 'TAMU') {
      categoryTitle = 'TAMU UNDANGAN';
    }

    let catBg = '#ffe600';
    let catTextColor = '#000000';
    const catUpper = categoryTitle.toUpperCase();
    if (catUpper.includes('PANITIA')) {
      catBg = '#0284c7'; catTextColor = '#ffffff';
    } else if (catUpper.includes('PENINJAU')) {
      catBg = '#059669'; catTextColor = '#ffffff';
    } else if (catUpper.includes('PENDAMPING')) {
      catBg = '#166534'; catTextColor = '#ffffff';
    } else if (catUpper.includes('TAMU')) {
      catBg = '#7e22ce'; catTextColor = '#ffffff';
    } else if (catUpper.includes('MEDIA')) {
      catBg = '#ea580c'; catTextColor = '#ffffff';
    }

    const fname = (filename || `ID-Card-${code}`).replace(/[^a-zA-Z0-9_-]/g, '_') + '.png';

    const triggerDownload = (url) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = fname;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showToast(`ID Card Resmi ${code} berhasil diunduh!`, 'success');
    };

    const getQRDataUrl = () => {
      return new Promise((resolve) => {
        if (cardData.qr_code_base64) {
          return resolve(cardData.qr_code_base64);
        }
        if (typeof window !== 'undefined' && window.QRCode && typeof window.QRCode.toDataURL === 'function') {
          window.QRCode.toDataURL(code, { width: 450, margin: 2, errorCorrectionLevel: 'H' }, (err, url) => {
            if (!err && url) resolve(url);
            else resolve(this.getQRCodeUrl(code, 450));
          });
        } else {
          resolve(this.getQRCodeUrl(code, 450));
        }
      });
    };

    const loadImg = (src) => {
      return new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          // Retry without crossOrigin jika server static tidak mengirim CORS header
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = () => resolve(null);
          fallbackImg.src = src;
        };
        img.src = src;
      });
    };

    Promise.all([
      getQRDataUrl(),
      loadImg(photoUrl),
      loadImg(appLogoUrl),
      loadImg(eventLogoUrl),
      loadImg(templateBgUrl)
    ]).then(([qrDataUrl, photoImg, appLogoImg, eventLogoImg, templateImg]) => {
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 700;
        canvas.height = 1040;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Helper: rounded rectangle
        const roundRect = (c, x, y, w, h, r, fill, stroke) => {
          c.beginPath();
          c.moveTo(x + r, y);
          c.lineTo(x + w - r, y);
          c.quadraticCurveTo(x + w, y, x + w, y + r);
          c.lineTo(x + w, y + h - r);
          c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          c.lineTo(x + r, y + h);
          c.quadraticCurveTo(x, y + h, x, y + h - r);
          c.lineTo(x, y + r);
          c.quadraticCurveTo(x, y, x + r, y);
          c.closePath();
          if (fill) c.fill();
          if (stroke) c.stroke();
        };

        // Helper: wrap text into up to maxLines without overflowing
        const wrapTextLines = (c, text, maxWidth, maxLines = 2) => {
          if (!text) return [];
          const words = text.trim().split(/\s+/);
          const lines = [];
          let currentLine = '';

          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (c.measureText(testLine).width <= maxWidth) {
              currentLine = testLine;
            } else {
              if (currentLine) lines.push(currentLine);
              currentLine = word;
              if (lines.length === maxLines - 1) {
                const rest = words.slice(i).join(' ');
                lines.push(rest);
                currentLine = '';
                break;
              }
            }
          }
          if (currentLine && lines.length < maxLines) {
            lines.push(currentLine);
          }

          return lines.map(line => {
            let str = line;
            while (c.measureText(str).width > maxWidth && str.length > 3) {
              str = str.slice(0, -1);
            }
            return str;
          });
        };

        // Clip whole card with rounded corners (radius 16px)
        ctx.save();
        roundRect(ctx, 0, 0, 700, 1040, 16, false, false);
        ctx.clip();

        if (templateImg) {
          // --- MODE TEMPLATE KUSTOM ---
          ctx.drawImage(templateImg, 0, 0, 700, 1040);

          const catY = (parseInt(s.idcard_cat_y ?? 138, 10)) * 2;
          const photoX = (parseInt(s.idcard_photo_x ?? 0, 10)) * 2 + 34;
          const photoY = (parseInt(s.idcard_photo_y ?? 0, 10)) * 2 + 350;
          const photoW = (parseInt(s.idcard_photo_w ?? 110, 10)) * 2;
          const photoH = (parseInt(s.idcard_photo_h ?? 145, 10)) * 2;
          const nameY = (parseInt(s.idcard_name_y ?? 0, 10)) * 2;
          const unitY = (parseInt(s.idcard_unit_y ?? 0, 10)) * 2;
          const qrX = (parseInt(s.idcard_qr_x ?? 0, 10)) * 2;
          const qrY = (parseInt(s.idcard_qr_y ?? 0, 10)) * 2;
          const qrSize = Math.max((parseInt(s.idcard_qr_size ?? 95, 10)) * 2, 190);

          // Yellow / Category Band
          ctx.fillStyle = catBg;
          ctx.fillRect(0, catY, 700, 68);
          ctx.textAlign = 'center';
          ctx.fillStyle = catTextColor;
          ctx.font = '900 36px Outfit, "Plus Jakarta Sans", sans-serif';
          ctx.fillText(categoryTitle.toUpperCase(), 350, catY + 48);

          // Photo 3x4
          ctx.fillStyle = '#f8fafc';
          roundRect(ctx, photoX, photoY, photoW, photoH, 8, true, false);
          if (photoImg) {
            ctx.save();
            roundRect(ctx, photoX, photoY, photoW, photoH, 8, false, false);
            ctx.clip();
            const imgRatio = photoImg.width / photoImg.height;
            const targetRatio = photoW / photoH;
            let sw, sh, sx, sy;
            if (imgRatio > targetRatio) {
              sh = photoImg.height;
              sw = photoImg.height * targetRatio;
              sx = (photoImg.width - sw) / 2;
              sy = 0;
            } else {
              sw = photoImg.width;
              sh = photoImg.width / targetRatio;
              sx = 0;
              sy = (photoImg.height - sh) / 2;
            }
            ctx.drawImage(photoImg, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
            ctx.restore();
          }
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 3;
          roundRect(ctx, photoX, photoY, photoW, photoH, 8, false, true);

          // Name, Unit, QR Code on right
          const colX = photoX + photoW + 30;
          const colW = 700 - colX - 34;
          const rightEdge = colX + colW;

          let nameFontSize = 32;
          if (name.length > 35) nameFontSize = 21;
          else if (name.length > 25) nameFontSize = 25;
          ctx.textAlign = 'left';
          ctx.fillStyle = '#0f172a';
          ctx.font = `800 ${nameFontSize}px Outfit, "Plus Jakarta Sans", sans-serif`;
          const nameLines = wrapTextLines(ctx, name, colW, 2);
          const nameStartY = photoY + 30 + nameY;
          nameLines.forEach((l, i) => ctx.fillText(l, colX, nameStartY + i * (nameFontSize * 1.2)));
          const nameLineY = nameStartY + (nameLines.length - 1) * (nameFontSize * 1.2) + 10;
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(colX, nameLineY, colW, 2);
          ctx.textAlign = 'right';
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'italic 600 13px "Plus Jakarta Sans", sans-serif';
          ctx.fillText('Nama / Name', rightEdge, nameLineY + 16);

          let unitFontSize = 24;
          if (unit.length > 35) unitFontSize = 18;
          ctx.textAlign = 'left';
          ctx.fillStyle = '#0f172a';
          ctx.font = `700 ${unitFontSize}px Outfit, "Plus Jakarta Sans", sans-serif`;
          const unitLines = wrapTextLines(ctx, unit, colW, 2);
          const unitStartY = nameLineY + 44 + unitY;
          unitLines.forEach((l, i) => ctx.fillText(l, colX, unitStartY + i * (unitFontSize * 1.2)));
          const unitLineY = unitStartY + (unitLines.length - 1) * (unitFontSize * 1.2) + 10;
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(colX, unitLineY, colW, 2);
          ctx.textAlign = 'right';
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'italic 600 13px "Plus Jakarta Sans", sans-serif';
          ctx.fillText('Asal / Unit / Kontingen', rightEdge, unitLineY + 16);

          // QR Code
          const qrActualX = colX + qrX;
          const qrActualY = unitLineY + 24 + qrY;
          ctx.fillStyle = '#ffffff';
          roundRect(ctx, qrActualX, qrActualY, qrSize, qrSize, 8, true, false);
          ctx.drawImage(qrImg, qrActualX + 4, qrActualY + 4, qrSize - 8, qrSize - 8);

        } else {
          // --- MODE STANDAR RESMI PMI (JUMBARA OFFICIAL DESIGN) ---
          // 1. White Background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 700, 1040);

          // 2. Top Header (Height 130px)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 700, 130);
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(0, 128, 700, 2);

          // Event Logo (Left)
          if (eventLogoImg) {
            const maxLogoDim = 76;
            const ratio = eventLogoImg.width / eventLogoImg.height;
            let lw = maxLogoDim, lh = maxLogoDim;
            if (ratio > 1) lh = maxLogoDim / ratio;
            else lw = maxLogoDim * ratio;
            ctx.drawImage(eventLogoImg, 24 + (maxLogoDim - lw) / 2, 26 + (maxLogoDim - lh) / 2, lw, lh);
          } else {
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.arc(62, 64, 28, 0, Math.PI * 2);
            ctx.fill();
          }

          // Event Title & Subtitle
          ctx.textAlign = 'left';
          ctx.fillStyle = '#0f172a';
          ctx.font = '800 24px Outfit, "Plus Jakarta Sans", sans-serif';
          ctx.fillText(eventTitle, 114, 62);

          ctx.fillStyle = '#475569';
          ctx.font = '600 17px Outfit, "Plus Jakarta Sans", sans-serif';
          ctx.fillText(eventSubtitle, 114, 90);

          // PMI Logo (Right)
          if (appLogoImg) {
            const maxPmiDim = 68;
            const ratio = appLogoImg.width / appLogoImg.height;
            let pw = maxPmiDim, ph = maxPmiDim;
            if (ratio > 1) ph = maxPmiDim / ratio;
            else pw = maxPmiDim * ratio;
            ctx.drawImage(appLogoImg, 490 + (maxPmiDim - pw) / 2, 31 + (maxPmiDim - ph) / 2, pw, ph);
          } else {
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(510, 40, 28, 50);
            ctx.fillRect(499, 51, 50, 28);
          }

          // PMI Text (Right)
          ctx.textAlign = 'left';
          ctx.fillStyle = '#0f172a';
          ctx.font = '800 16px Outfit, "Plus Jakarta Sans", sans-serif';
          ctx.fillText('PALANG', 572, 54);
          ctx.fillText('MERAH', 572, 74);
          ctx.fillText('INDONESIA', 572, 94);

          // 3. Category Band (Yellow/Color Bar at y: 130, height: 68px)
          ctx.fillStyle = catBg;
          ctx.fillRect(0, 130, 700, 68);

          ctx.fillStyle = 'rgba(0,0,0,0.08)';
          ctx.fillRect(0, 196, 700, 2);

          ctx.textAlign = 'center';
          ctx.fillStyle = catTextColor;
          ctx.font = '900 36px Outfit, "Plus Jakarta Sans", sans-serif';
          ctx.fillText(categoryTitle.toUpperCase(), 350, 178);

          // 4. Body Content
          // Left Column: Pas Foto 3x4 (x: 34, y: 228, w: 220, h: 290)
          const photoX = 34;
          const photoY = 228;
          const photoW = 220;
          const photoH = 290;

          ctx.fillStyle = '#f8fafc';
          roundRect(ctx, photoX, photoY, photoW, photoH, 8, true, false);

          if (photoImg) {
            ctx.save();
            roundRect(ctx, photoX, photoY, photoW, photoH, 8, false, false);
            ctx.clip();
            const imgRatio = photoImg.width / photoImg.height;
            const targetRatio = photoW / photoH;
            let sw, sh, sx, sy;
            if (imgRatio > targetRatio) {
              sh = photoImg.height;
              sw = photoImg.height * targetRatio;
              sx = (photoImg.width - sw) / 2;
              sy = 0;
            } else {
              sw = photoImg.width;
              sh = photoImg.width / targetRatio;
              sx = 0;
              sy = (photoImg.height - sh) / 2;
            }
            ctx.drawImage(photoImg, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
            ctx.restore();
          } else {
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(photoX + photoW / 2, photoY + 110, 48, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(photoX + photoW / 2, photoY + 260, 100, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 3;
          roundRect(ctx, photoX, photoY, photoW, photoH, 8, false, true);

          // Right Column: Detail Peserta & QR Code
          const colX = 280;
          const colW = 386;
          const rightEdge = colX + colW; // 666

          // Nama Field
          let nameFontSize = 32;
          if (name.length > 35) nameFontSize = 21;
          else if (name.length > 25) nameFontSize = 25;
          else if (name.length > 18) nameFontSize = 28;

          ctx.textAlign = 'left';
          ctx.fillStyle = '#0f172a';
          ctx.font = `800 ${nameFontSize}px Outfit, "Plus Jakarta Sans", sans-serif`;

          const nameLines = wrapTextLines(ctx, name, colW, 2);
          const nameStartY = 258;
          const nameLineH = nameFontSize * 1.18;
          nameLines.forEach((lineText, idx) => {
            ctx.fillText(lineText, colX, nameStartY + idx * nameLineH);
          });

          const nameUnderlineY = nameStartY + (nameLines.length - 1) * nameLineH + 10;
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(colX, nameUnderlineY, colW, 2);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'italic 600 13px "Plus Jakarta Sans", sans-serif';
          ctx.fillText('Nama / Name', rightEdge, nameUnderlineY + 16);

          // Unit / Kontingen Field
          let unitFontSize = 24;
          if (unit.length > 35) unitFontSize = 18;
          else if (unit.length > 24) unitFontSize = 21;

          ctx.textAlign = 'left';
          ctx.fillStyle = '#0f172a';
          ctx.font = `700 ${unitFontSize}px Outfit, "Plus Jakarta Sans", sans-serif`;

          const unitLines = wrapTextLines(ctx, unit, colW, 2);
          const unitStartY = nameUnderlineY + 44;
          const unitLineH = unitFontSize * 1.2;
          unitLines.forEach((lineText, idx) => {
            ctx.fillText(lineText, colX, unitStartY + idx * unitLineH);
          });

          const unitUnderlineY = unitStartY + (unitLines.length - 1) * unitLineH + 10;
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(colX, unitUnderlineY, colW, 2);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'italic 600 13px "Plus Jakarta Sans", sans-serif';
          ctx.fillText('Kontingen / Unit', rightEdge, unitUnderlineY + 16);

          // QR Code Container
          const qrBoxSize = 200;
          const qrBoxX = colX;
          const qrBoxY = 530;

          ctx.fillStyle = '#ffffff';
          roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 8, true, false);
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.5;
          roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 8, false, true);

          if (qrImg) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(qrImg, qrBoxX + 6, qrBoxY + 6, qrBoxSize - 12, qrBoxSize - 12);
          }

          // Date & Location
          ctx.textAlign = 'right';
          ctx.fillStyle = '#334155';
          ctx.font = 'italic 700 16px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(eventDate, rightEdge, qrBoxY + qrBoxSize - 8);

          // 5. Footer Section (y: 890 to 1040, height: 150px)
          const stripY = 890;
          const stripH = 10;
          const stripW = 700 / 4;
          ctx.fillStyle = '#dc2626'; ctx.fillRect(0, stripY, stripW, stripH);
          ctx.fillStyle = '#ef4444'; ctx.fillRect(stripW, stripY, stripW, stripH);
          ctx.fillStyle = '#f87171'; ctx.fillRect(stripW * 2, stripY, stripW, stripH);
          ctx.fillStyle = '#fca5a5'; ctx.fillRect(stripW * 3, stripY, stripW, stripH);

          const footerGrad = ctx.createLinearGradient(0, 900, 0, 1040);
          footerGrad.addColorStop(0, '#f8fafc');
          footerGrad.addColorStop(1, '#f1f5f9');
          ctx.fillStyle = footerGrad;
          ctx.fillRect(0, 900, 700, 140);

          // Candi Silhouette
          ctx.save();
          ctx.fillStyle = '#cbd5e1';
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.moveTo(0, 1040); ctx.lineTo(0, 1024); ctx.lineTo(30, 1016); ctx.lineTo(70, 1020);
          ctx.lineTo(100, 1004); ctx.lineTo(130, 1016); ctx.lineTo(160, 996); ctx.lineTo(190, 1020);
          ctx.lineTo(220, 1008); ctx.lineTo(260, 1024); ctx.lineTo(320, 1020); ctx.lineTo(320, 1040);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#334155';
          ctx.globalAlpha = 0.25;
          ctx.beginPath();
          ctx.moveTo(20, 1040); ctx.lineTo(20, 996); ctx.lineTo(28, 990); ctx.lineTo(32, 970); ctx.lineTo(36, 990); ctx.lineTo(44, 996); ctx.lineTo(44, 1040);
          ctx.moveTo(52, 1040); ctx.lineTo(52, 976); ctx.lineTo(60, 964); ctx.lineTo(64, 936); ctx.lineTo(68, 964); ctx.lineTo(76, 976); ctx.lineTo(76, 1040);
          ctx.moveTo(84, 1040); ctx.lineTo(84, 990); ctx.lineTo(92, 980); ctx.lineTo(96, 956); ctx.lineTo(100, 980); ctx.lineTo(108, 990); ctx.lineTo(108, 1040);
          ctx.fill();
          ctx.restore();

          // Motto / Hashtag
          ctx.textAlign = 'left';
          ctx.fillStyle = '#0f172a';
          ctx.font = '900 24px Outfit, "Plus Jakarta Sans", sans-serif';
          ctx.fillText(eventMotto, 34, 1014);

          // 3 Mascots
          const drawMascot = (mx, my, color, type) => {
            ctx.save();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(mx, my, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(mx, my, 22, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            if (type === 1) {
              ctx.beginPath();
              ctx.arc(mx, my - 5, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(mx, my + 9, 8, Math.PI, 0);
              ctx.stroke();
            } else if (type === 2) {
              ctx.fillRect(mx - 2, my - 8, 4, 16);
              ctx.fillRect(mx - 8, my - 2, 16, 4);
            } else {
              ctx.beginPath();
              for (let i = 0; i < 5; i++) {
                const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const r = 8;
                const px = mx + Math.cos(a) * r;
                const py = my + Math.sin(a) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.closePath();
              ctx.fill();
            }
            ctx.restore();
          };

          drawMascot(570, 998, '#15803d', 1);
          drawMascot(610, 998, '#dc2626', 2);
          drawMascot(650, 998, '#0284c7', 3);
        }

        ctx.restore(); // restore clip

        // Outer border stroke
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        roundRect(ctx, 1, 1, 698, 1038, 16, false, true);

        // Export to Blob & Trigger Download
        if (typeof canvas.toBlob === 'function') {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              triggerDownload(url);
              setTimeout(() => URL.revokeObjectURL(url), 10000);
            } else {
              triggerDownload(canvas.toDataURL('image/png', 1.0));
            }
          }, 'image/png', 1.0);
        } else {
          triggerDownload(canvas.toDataURL('image/png', 1.0));
        }
      };
      qrImg.src = qrDataUrl;
    }).catch((err) => {
      console.error('Error generating complete ID Card:', err);
      this.downloadQRCode(code, fname);
    });
  },

  // Export JSON array to downloadable Excel (.xls) file with HTML Spreadsheet formatting
  exportToXLS(filename, rows, title = 'Data Export JUMBARA 2026') {
    if (!rows || !rows.length) {
      this.showToast('Tidak ada data untuk diexport.', 'error');
      return;
    }
    const cleanFilename = (filename || 'export').replace(/[^a-zA-Z0-9_-]/g, '_');
    const keys = Object.keys(rows[0]);

    const tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Data_Jumbara</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 0.5pt solid #cbd5e1; padding: 6px 10px; vertical-align: middle; }
  th { background-color: #dc2626; color: #ffffff; font-weight: bold; text-align: center; }
  .kop-title { font-size: 14pt; font-weight: bold; color: #b91c1c; text-align: center; background-color: #fee2e2; }
  .kop-meta { font-size: 9.5pt; color: #64748b; background-color: #f8fafc; }
  .row-even { background-color: #ffffff; }
  .row-odd { background-color: #f8fafc; }
  .text-num { mso-number-format: "\\@"; text-align: center; }
  .text-left { text-align: left; }
</style>
</head>
<body>
<table>
<thead>
<tr>
  <th colspan="${keys.length + 1}" class="kop-title">${this.escapeHtml(title)}</th>
</tr>
<tr>
  <th colspan="${keys.length + 1}" class="kop-meta">Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })} | Total Data: ${rows.length} Baris</th>
</tr>
<tr style="height: 10px;"><td colspan="${keys.length + 1}" style="border: none;"></td></tr>
<tr>
  <th style="width: 50px;">No</th>
  ${keys.map(k => `<th>${this.escapeHtml(k.replace(/_/g, ' ').toUpperCase())}</th>`).join('')}
</tr>
</thead>
<tbody>
${rows.map((row, idx) => `
<tr class="${idx % 2 === 0 ? 'row-even' : 'row-odd'}">
  <td class="text-num">${idx + 1}</td>
  ${keys.map(k => {
    let val = row[k];
    if (val === null || val === undefined) val = '-';
    else if (typeof val === 'object') val = JSON.stringify(val);
    return `<td class="text-num">${this.escapeHtml(String(val))}</td>`;
  }).join('')}
</tr>`).join('')}
</tbody>
</table>
</body>
</html>`;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${cleanFilename}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast(`Berhasil mengunduh data ${cleanFilename}.xls`, 'success');
  },

  // Export JSON array to downloadable file (Dialihkan ke XLS sesuai permintaan pengguna)
  exportToCSV(filename, rows, title) {
    return this.exportToXLS(filename, rows, title);
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

  // Check if a unit is an official PMR School Contingent (not KSR / TSR / PMI Headquarters)
  isPmrUnit(u) {
    if (!u) return false;
    const cat = (u.level_category || '').toUpperCase().trim();
    const name = (u.name || u.unit_name || '').toUpperCase().trim();
    if (cat.includes('KSR') || cat.includes('TSR') || cat.includes('PMI KAB') || cat.includes('MARKAS') ||
        name.includes('KSR') || name.includes('TSR') || name.startsWith('PMI ') || name.includes('MARKAS PMI') || name.includes('PMI KABUPATEN')) {
      return false;
    }
    return true;
  },

  // Identify unit category: 'PMR', 'KSR', 'TSR', or 'PMI Kab'
  getUnitCategory(u) {
    if (!u) return 'PMR';
    const cat = (u.level_category || '').toUpperCase().trim();
    const name = (u.name || u.unit_name || '').toUpperCase().trim();
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
  },

  sanitizeMapEmbedUrl(url, currentSettings = null) {
    const defaultOsm = 'https://www.openstreetmap.org/export/embed.html?bbox=109.240%2C-7.150%2C109.268%2C-7.128&layer=mapnik&marker=-7.13952%2C109.25411';
    if (!url || typeof url !== 'string') {
      return defaultOsm;
    }
    let clean = url.trim();
    if (clean.includes('<iframe')) {
      const match = clean.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) clean = match[1].trim();
    }

    const locContext = (currentSettings?.event_location || '') + ' ' + (currentSettings?.event_map_url || '');
    const isSemugih = /semugih|moga|ptpn/i.test(clean) || /semugih|moga|ptpn/i.test(locContext);
    const isOldMarkas = clean.includes('-6.911763') || clean.includes('109.383437') || clean.includes('109.378');

    // Upgrade old Markas PMI embed to Semugih if in Semugih context or default
    if (isOldMarkas && (isSemugih || !currentSettings?.event_location || currentSettings?.event_location.includes('Buperta'))) {
      return defaultOsm;
    }

    // Tangani link Google Maps yang diblokir oleh header SAMEORIGIN (refused to connect):
    // Format yang refused to connect jika di-embed dalam iframe:
    // 1. maps.google.com/maps?...
    // 2. www.google.com/maps?...
    // 3. google.com/maps/place/...
    // 4. goo.gl / maps.app.goo.gl
    // 5. Sembarang URL Google Maps selain format resmi /maps/embed?pb=
    const isGoogle = clean.includes('google.com') || clean.includes('goo.gl');
    if (isGoogle) {
      const isOfficialEmbed = clean.includes('/maps/embed');
      if (!isOfficialEmbed || clean.includes('output=embed') || clean.includes('iwloc=') || clean.includes('q=')) {
        // Coba ekstrak koordinat lat,lng dari URL Google Maps (@lat,lng atau q=lat,lng atau ll=lat,lng)
        const matchCoord = clean.match(/(?:@|q=|ll=)(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (matchCoord) {
          const lat = parseFloat(matchCoord[1]);
          const lon = parseFloat(matchCoord[2]);
          const minLon = (lon - 0.014).toFixed(3);
          const maxLon = (lon + 0.014).toFixed(3);
          const minLat = (lat - 0.011).toFixed(3);
          const maxLat = (lat + 0.011).toFixed(3);
          return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lon.toFixed(5)}`;
        }
        return defaultOsm;
      }
    }

    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      return defaultOsm;
    }

    return clean;
  }
};
