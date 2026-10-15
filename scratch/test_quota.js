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
    console.log('--- 1. Login as Admin Kabupaten ---');
    const kabLogin = await request({
      hostname: 'localhost', port: 8888, path: '/jumbara/api/auth.php?action=login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'admin_kab', password: 'admin123' });
    
    console.log('Kabupaten Login:', kabLogin.data);
    const kabCookie = kabLogin.cookies ? kabLogin.cookies[0].split(';')[0] : '';

    console.log('\n--- 2. Create Event with Quota = 2 Peserta per Unit ---');
    const createEvt = await request({
      hostname: 'localhost', port: 8888, path: '/jumbara/api/events.php', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': kabCookie }
    }, {
      title: 'Lomba Pertolongan Pertama (PP) Special Quota',
      category: 'Jumpa',
      pmr_level: 'Wira',
      max_participants_per_unit: 2,
      location: 'Hall C Jumbara',
      event_date: '2026-10-16',
      start_time: '09:00',
      end_time: '12:00',
      description: 'Lomba PP terbatas maks 2 peserta per unit sekolah.',
      pic_name: 'Sie Perlombaan'
    });
    console.log('Create Event Response:', createEvt.data);

    console.log('\n--- 3. Login as Admin Unit (SMAN 1) ---');
    const unitLogin = await request({
      hostname: 'localhost', port: 8888, path: '/jumbara/api/auth.php?action=login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'admin_sman1', password: 'unit123' });
    
    console.log('Unit Login:', unitLogin.data);
    const unitCookie = unitLogin.cookies ? unitLogin.cookies[0].split(';')[0] : '';

    console.log('\n--- 4. Fetch Unit Events ---');
    const unitEventsRes = await request({
      hostname: 'localhost', port: 8888, path: '/jumbara/api/events.php?action=unit_events&unit_id=1', method: 'GET',
      headers: { 'Cookie': unitCookie }
    });
    const createdEvent = unitEventsRes.data.events.find(e => e.title.includes('Special Quota'));
    console.log('Created Event fetched:', createdEvent ? { id: createdEvent.id, title: createdEvent.title, max_participants_per_unit: createdEvent.max_participants_per_unit } : 'Not found');
    const unitParticipants = unitEventsRes.data.unit_participants || [];
    console.log('Available Unit Participants:', unitParticipants.map(p => ({ id: p.id, name: p.full_name })));

    if (createdEvent && unitParticipants.length >= 3) {
      const p1 = unitParticipants[0].id;
      const p2 = unitParticipants[1].id;
      const p3 = unitParticipants[2].id;

      console.log('\n--- 5. Test Registering 3 Participants (EXCEEDS QUOTA OF 2) ---');
      const failReg = await request({
        hostname: 'localhost', port: 8888, path: '/jumbara/api/events.php?action=save_unit_event_registrations', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': unitCookie }
      }, {
        event_id: createdEvent.id,
        unit_id: 1,
        participant_ids: [p1, p2, p3]
      });
      console.log('Over-quota Registration Result (Expected Error 400):', failReg.data);

      console.log('\n--- 6. Test Registering 2 Participants (WITHIN QUOTA OF 2) ---');
      const successReg = await request({
        hostname: 'localhost', port: 8888, path: '/jumbara/api/events.php?action=save_unit_event_registrations', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': unitCookie }
      }, {
        event_id: createdEvent.id,
        unit_id: 1,
        participant_ids: [p1, p2]
      });
      console.log('Within-quota Registration Result (Expected Success):', successReg.data);
    }
  } catch (err) {
    console.error('Test error:', err);
  }
})();
