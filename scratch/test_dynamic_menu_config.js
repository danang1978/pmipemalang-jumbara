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

async function test() {
  console.log('--- 1. Login Admin ---');
  const loginRes = await request('/auth.php?action=login', { username: 'admin_kab', password: 'admin123' });
  console.log('Login Status:', loginRes.status, loginRes.data.message);
  const cookieHeader = (loginRes.cookies || []).map(c => c.split(';')[0]).join('; ');

  console.log('\n--- 2. Save Custom Menu Mapping (Move Pengumuman to Peserta category) ---');
  const customConfig = {
    verifikasi: { enabled: true, category: 'peserta' },
    idcard: { enabled: true, category: 'peserta' },
    pengumuman: { enabled: true, category: 'peserta' }, // Moved from agenda to peserta!
    jadwal: { enabled: true, category: 'agenda' },
    presensi: { enabled: true, category: 'agenda' },
    penilaian: { enabled: true, category: 'penilaian' },
    laporan: { enabled: true, category: 'penilaian' },
    pengaturan: { enabled: true, category: 'pengaturan' },
    users: { enabled: true, category: 'pengaturan' },
    menu: { enabled: true, category: 'pengaturan' },
    password: { enabled: true, category: 'pengaturan' }
  };

  const saveRes = await request('/settings.php', {
    menu_config: JSON.stringify(customConfig),
    menu_settings: JSON.stringify(customConfig)
  }, cookieHeader, 'POST');
  console.log('Save Settings Result:', saveRes.status, saveRes.data);

  console.log('\n--- 3. Fetch Settings & Verify menu_config ---');
  const getSettingsRes = await new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 8888,
      path: '/jumbara/api/settings.php',
      headers: { Cookie: cookieHeader }
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
  
  console.log('Fetched menu_config:', getSettingsRes.menu_config);
}

test().catch(console.error);
