const http = require('http');

function request(path, postData = null, cookie = '', method = 'POST') {
  return new Promise((resolve, reject) => {
    const dataString = postData ? JSON.stringify(postData) : '';
    const options = {
      hostname: 'localhost',
      port: 8888,
      path: '/jumbara/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString),
        'Cookie': cookie
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      const resCookies = res.headers['set-cookie'] || [];
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), cookies: resCookies });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, cookies: resCookies });
        }
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runReset() {
  const loginRes = await request('/auth.php?action=login', { username: 'admin_kab', password: 'admin123' });
  const cookieHeader = (loginRes.cookies || []).map(c => c.split(';')[0]).join('; ');

  const defaultStruct = {
    categories: [
      { id: 'peserta', label: 'Data Peserta & Card', icon: 'fa-solid fa-users', color: '#2563eb', bg: '#eff6ff' },
      { id: 'agenda', label: 'Agenda & Presensi', icon: 'fa-solid fa-calendar-check', color: '#d97706', bg: '#fffbeb' },
      { id: 'penilaian', label: 'Penilaian & Laporan', icon: 'fa-solid fa-award', color: '#059669', bg: '#ecfdf5' },
      { id: 'pengaturan', label: 'Pengaturan & Akun', icon: 'fa-solid fa-gears', color: '#4f46e5', bg: '#eef2ff' }
    ],
    items: [
      { id: 'verifikasi', label: 'Verifikasi Peserta', icon: 'fa-solid fa-user-check', category: 'peserta', enabled: true, isSystem: true },
      { id: 'idcard', label: 'Cetak ID Card Batch', icon: 'fa-solid fa-id-card', category: 'peserta', enabled: true, isSystem: true },
      { id: 'master', label: 'Master Data & WA', icon: 'fa-solid fa-database', category: 'peserta', enabled: true, isSystem: true },
      { id: 'jadwal', label: 'Kelola Jadwal', icon: 'fa-solid fa-calendar-days', category: 'agenda', enabled: true, isSystem: true },
      { id: 'presensi', label: 'Scan Presensi QR', icon: 'fa-solid fa-qrcode', category: 'agenda', enabled: true, isSystem: true },
      { id: 'pengumuman', label: 'Pengumuman', icon: 'fa-solid fa-bullhorn', category: 'agenda', enabled: true, isSystem: true },
      { id: 'penilaian', label: 'Penilaian & Medali', icon: 'fa-solid fa-trophy', category: 'penilaian', enabled: true, isSystem: true },
      { id: 'laporan', label: 'Laporan & Export', icon: 'fa-solid fa-file-export', category: 'penilaian', enabled: true, isSystem: true },
      { id: 'pengaturan', label: 'Pengaturan DB', icon: 'fa-solid fa-gear', category: 'pengaturan', enabled: true, isSystem: true },
      { id: 'users', label: 'Kelola User & Password', icon: 'fa-solid fa-users-gear', category: 'pengaturan', enabled: true, isSystem: true },
      { id: 'menu', label: 'Pengaturan Menu', icon: 'fa-solid fa-list-check', category: 'pengaturan', enabled: true, isSystem: true, isRequired: true },
      { id: 'password', label: 'Ganti Password Saya', icon: 'fa-solid fa-key', category: 'pengaturan', enabled: true, isSystem: true, isRequired: true }
    ]
  };

  const jsonStr = JSON.stringify(defaultStruct);
  await request('/settings.php', {
    menu_config: jsonStr,
    menu_settings: jsonStr
  }, cookieHeader, 'POST');
  console.log("Clean reset to default complete!");
}

runReset();
