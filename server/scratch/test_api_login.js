const http = require('http');

const testLogin = (email, password) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email, password });

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (err) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

const run = async () => {
  console.log('Testing HTTP /api/users/login endpoint for all roles...\n');

  console.log('1. Testing Admin Login (chief.admin@autodoc.com):');
  const adminRes = await testLogin('chief.admin@autodoc.com', 'autodocadmin2026');
  console.log('   Status:', adminRes.status);
  console.log('   User payload returned:', adminRes.body.user);
  if (!adminRes.body.user || !adminRes.body.user.role) {
    console.error('❌ FAILED: user.role is missing from login response!');
  } else {
    console.log(`✅ SUCCESS: user.role = "${adminRes.body.user.role}", user_role = "${adminRes.body.user.user_role}"`);
  }

  console.log('\n2. Testing Owner Login (alex.owner@autodoc.com):');
  const ownerRes = await testLogin('alex.owner@autodoc.com', 'autodocowner2026');
  console.log('   Status:', ownerRes.status);
  console.log('   User payload returned:', ownerRes.body.user);
  if (!ownerRes.body.user || !ownerRes.body.user.role) {
    console.error('❌ FAILED: user.role is missing from login response!');
  } else {
    console.log(`✅ SUCCESS: user.role = "${ownerRes.body.user.role}", user_role = "${ownerRes.body.user.user_role}"`);
  }

  console.log('\n3. Testing Service Center Login (sarah.partner@autodoc.com):');
  const scRes = await testLogin('sarah.partner@autodoc.com', 'autodocpartner2026');
  console.log('   Status:', scRes.status);
  console.log('   User payload returned:', scRes.body.user);
  if (!scRes.body.user || !scRes.body.user.role) {
    console.error('❌ FAILED: user.role is missing from login response!');
  } else {
    console.log(`✅ SUCCESS: user.role = "${scRes.body.user.role}", user_role = "${scRes.body.user.user_role}"`);
  }
};

run().catch(console.error);
