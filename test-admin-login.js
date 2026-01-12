const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');

    const response = await axios.post('http://localhost:3000/api/adminlogin/adminlogin', {
      username: 'admin',
      password: 'admin123'
    });

    console.log('✅ Admin login successful!');
    console.log('Response:', response.data);

    // Test token verification
    const verifyResponse = await axios.get('http://localhost:3000/api/adminlogin/verify', {
      headers: {
        'Authorization': `Bearer ${response.data.token}`
      }
    });

    console.log('✅ Token verification successful!');
    console.log('User info:', verifyResponse.data.user);

  } catch (error) {
    console.error('❌ Admin login failed:', error.response ? error.response.data : error.message);
  }
}

testAdminLogin();
