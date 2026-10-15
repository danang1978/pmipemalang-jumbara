const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const payloadStr = postData ? JSON.stringify(postData) : null;
    const headers = { ...options.headers };
    if (payloadStr) {
      headers['Content-Length'] = Buffer.byteLength(payloadStr);
    }

    const reqOptions = { ...options, headers };
    const req = http.request(reqOptions, (res) => {
      let body = '';
      const setCookie = res.headers['set-cookie'];
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, cookies: setCookie, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, cookies: setCookie, rawData: body });
        }
      });
    });
    req.on('error', reject);
    if (payloadStr) req.write(payloadStr);
    req.end();
  });
}

(async () => {
  try {
    console.log('--- 1. Login as Admin Unit (SMAN 1) ---');
    const unitLogin = await request({
      hostname: 'localhost', port: 8888, path: '/jumbara/api/auth.php?action=login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'admin_sman1', password: 'unit123' });
    
    console.log('Unit Login Result:', unitLogin.data);
    const unitCookie = unitLogin.cookies ? unitLogin.cookies[0].split(';')[0] : '';

    console.log('\n--- 2. Admin Unit Editing Participant #1 (Rizky Pratama) ---');
    const editPartRes = await request({
      hostname: 'localhost', port: 8888, path: '/jumbara/api/participants.php?action=admin_update', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': unitCookie }
    }, {
      id: 1,
      full_name: 'Rizky Pratama (Updated by Unit Admin)',
      nisn: '0012345678',
      registration_type: 'Peserta',
      level: 'Wira',
      gender: 'L',
      blood_type: 'O',
      phone: '081234567890',
      emergency_contact: 'Pembina SMAN 1'
    });
    console.log('Admin Unit Edit Participant Result:', editPartRes.data);

    console.log('\n--- 3. Verify Participant Data via GET /participants.php?id=1 ---');
    const getPart = await request({
      hostname: 'localhost', port: 8888, path: '/jumbara/api/participants.php?id=1', method: 'GET',
      headers: { 'Cookie': unitCookie }
    });
    console.log('Updated Participant details:', getPart.data ? getPart.data.full_name : getPart.rawData);

    console.log('\n--- 4. Login as Admin Kabupaten ---');
    const kabLogin = await request({
      hostname: 'localhost', port: 8888, path: '/jumbara/api/auth.php?action=login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'admin_kab', password: 'admin123' });

    const kabCookie = kabLogin.cookies ? kabLogin.cookies[0].split(';')[0] : '';

    console.log('\n--- 5. Admin Kabupaten Editing Event #1 ---');
    const editEvtRes = await request({
      hostname: 'localhost', port: 8888, path: '/jumbara/api/events.php', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': kabCookie }
    }, {
      id: 1,
      title: 'Upacara Pembukaan Jumbara PMR 2026 (Edited)',
      category: 'Umum',
      pmr_level: 'Semua',
      max_participants_per_unit: 5,
      location: 'Lapangan Utama Buperta PMI',
      event_date: '2026-10-15',
      start_time: '08:00',
      end_time: '10:00',
      description: 'Pembukaan resmi dengan peragaan kolosal.',
      pic_name: 'Ketua Panitia'
    });
    console.log('Edit Event Result:', editEvtRes.data);

  } catch (err) {
    console.error('Test error:', err);
  }
})();
