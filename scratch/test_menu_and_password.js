const http = require('http');

function request(path, postData, cookie = '') {
  return new Promise((resolve, reject) => {
    const dataString = postData ? JSON.stringify(postData) : '';
    const options = {
      hostname: 'localhost',
      port: 8888,
      path: '/jumbara/api' + path,
      method: 'POST',
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
  console.log('Login Result:', loginRes.status, loginRes.data);
  const cookieHeader = (loginRes.cookies || []).map(c => c.split(';')[0]).join('; ');

  console.log('\n--- 2. Test Change Password (Incorrect Old Password) ---');
  const pwdErrRes = await request('/auth.php?action=change-password', {
    old_password: 'wrongpassword',
    new_password: 'admin123new',
    confirm_password: 'admin123new'
  }, cookieHeader);
  console.log('Change Password Wrong Old Password:', pwdErrRes.status, pwdErrRes.data);

  console.log('\n--- 3. Test Change Password (Success & Revert) ---');
  const pwdOkRes = await request('/auth.php?action=change-password', {
    old_password: 'admin123',
    new_password: 'admin123new',
    confirm_password: 'admin123new'
  }, cookieHeader);
  console.log('Change Password Success:', pwdOkRes.status, pwdOkRes.data);

  // Revert back to admin123
  const pwdRevertRes = await request('/auth.php?action=change-password', {
    old_password: 'admin123new',
    new_password: 'admin123',
    confirm_password: 'admin123'
  }, cookieHeader);
  console.log('Change Password Reverted:', pwdRevertRes.status, pwdRevertRes.data);

  console.log('\n--- 4. Test Menu Settings Save & Fetch ---');
  const menuSaveRes = await request('/settings.php', {
    menu_settings: JSON.stringify({ verifikasi: true, idcard: true, master: true, menu: true, password: true })
  }, cookieHeader);
  console.log('Save Menu Settings Result:', menuSaveRes.status, menuSaveRes.data);

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
  console.log('Fetched Settings menu_settings:', getSettingsRes.data?.menu_settings);
}

test().catch(console.error);
