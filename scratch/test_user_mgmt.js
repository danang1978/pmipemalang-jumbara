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

  console.log('\n--- 2. GET Users List ---');
  const usersRes = await request('/users.php', null, cookieHeader, 'GET');
  console.log('Get Users Count:', usersRes.data?.data?.length, 'Total:', usersRes.data?.pagination?.total);

  console.log('\n--- 3. Admin Create New User ---');
  const createRes = await request('/users.php?action=create', {
    username: 'test_user_mgmt',
    password: 'password123',
    role: 'panitia',
    email: 'testmgmt@pmikab.or.id'
  }, cookieHeader, 'POST');
  console.log('Create User Result:', createRes.status, createRes.data);
  const newUserId = createRes.data?.id;

  if (newUserId) {
    console.log('\n--- 4. Admin Reset Password of New User ---');
    const resetRes = await request('/users.php?action=reset-password', {
      user_id: newUserId,
      new_password: 'newsecretpassword123'
    }, cookieHeader, 'POST');
    console.log('Reset Password Result:', resetRes.status, resetRes.data);

    console.log('\n--- 5. Delete Test User ---');
    const delRes = await request(`/users.php?id=${newUserId}`, null, cookieHeader, 'DELETE');
    console.log('Delete User Result:', delRes.status, delRes.data);
  }
}

test().catch(console.error);
