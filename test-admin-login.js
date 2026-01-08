const fetch = require('node-fetch');

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');

    const response = await fetch('http://localhost:3000/api/adminlogin/adminlogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });

    const data = await response.json();
    console.log('Login response:', data);

    if (data.token) {
      console.log('Token received, testing verification...');

      // Test the token with a protected endpoint
      const verifyResponse = await fetch('http://localhost:3000/api/adminlogin/verify', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${data.token}` }
      });

      const verifyData = await verifyResponse.json();
      console.log('Token verification:', verifyData);

      // Test with onboardstudents endpoint
      const studentsResponse = await fetch('http://localhost:3000/api/onboardstudents', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${data.token}` }
      });

      const studentsData = await studentsResponse.json();
      console.log('Students endpoint response:', studentsData);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAdminLogin();
