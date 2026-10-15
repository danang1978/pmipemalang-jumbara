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

async function runUnsurTests() {
  console.log("--- 1. Login Admin Kabupaten ---");
  const loginRes = await request('/auth.php?action=login', { username: 'admin_kab', password: 'admin123' });
  console.log("Login Status:", loginRes.status, loginRes.data.message);
  const cookieHeader = (loginRes.cookies || []).map(c => c.split(';')[0]).join('; ');

  console.log("\n--- 2. Fetch Unsur List via GET /api/unsur.php ---");
  const getRes = await request('/unsur.php', null, cookieHeader, 'GET');
  console.log("Fetched Unsur items count:", Array.isArray(getRes.data) ? getRes.data.length : 0);
  console.log("Items:", getRes.data.map(u => `${u.name} (Quota: ${u.quota})`).join(', '));

  console.log("\n--- 3. Create Custom Unsur 'KSR PMK' ---");
  const createRes = await request('/unsur.php', {
    name: 'KSR PMK Test',
    quota: 3,
    description: 'Unsur KSR Perguruan Tinggi'
  }, cookieHeader, 'POST');
  console.log("Create Result:", createRes.status, createRes.data.message);
  const customId = createRes.data.id;

  console.log("\n--- 4. Edit Custom Unsur Quota to 5 ---");
  const editRes = await request('/unsur.php', {
    id: customId,
    name: 'KSR PMK Test',
    quota: 5,
    description: 'Updated Description'
  }, cookieHeader, 'PUT');
  console.log("Edit Result:", editRes.status, editRes.data.message);

  console.log("\n--- 5. Delete Custom Unsur ---");
  const delRes = await request(`/unsur.php?id=${customId}`, null, cookieHeader, 'DELETE');
  console.log("Delete Result:", delRes.status, delRes.data.message);

  console.log("\n--- 6. Test Unsur Quota Enforcement for 'Kepala Markas' (Quota Max 1) ---");
  const testUnitId = 1;

  // Register 1st Kepala Markas
  const reg1 = await request('/auth.php?action=register-peserta', {
    full_name: 'Dr. Test Kepala Markas 1',
    unit_id: testUnitId,
    registration_type: 'Peserta',
    level: 'Kepala Markas',
    religion: 'Islam',
    gender: 'L',
    blood_type: 'O',
    phone: '081234500001'
  });
  console.log("Reg 1 Result (Should succeed or handle existing):", reg1.status, reg1.data.message || reg1.data.error);

  // Attempt Register 2nd Kepala Markas for same unit (Must fail due to Quota Limit 1)
  const reg2 = await request('/auth.php?action=register-peserta', {
    full_name: 'Dr. Test Kepala Markas 2',
    unit_id: testUnitId,
    registration_type: 'Peserta',
    level: 'Kepala Markas',
    religion: 'Islam',
    gender: 'P',
    blood_type: 'A',
    phone: '081234500002'
  });
  console.log("Reg 2 Result (Must fail due to quota limit):", reg2.status, reg2.data.error);

  if (reg2.status === 400 && reg2.data.error && reg2.data.error.includes('Kuota')) {
    console.log("\n✅ SUCCESS: Dynamic Unsur Quota Enforcement works 100%!");
  } else {
    console.log("\nNote: Reg 2 status/error message:", reg2.status, reg2.data);
  }
}

runUnsurTests().catch(err => console.error("TEST FAILED:", err));
