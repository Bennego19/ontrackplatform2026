// test.js - Run with: node test.js
const fetch = require('node-fetch');

async function test() {
  // 1. First login
  const loginRes = await fetch('http://localhost:3000/api/onboardstudents/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'testuser', // Replace with actual username
      password: 'testpass'  // Replace with actual password
    })
  });
  
  const loginData = await loginRes.json();
  console.log('Login response:', JSON.stringify(loginData, null, 2));
  
  if (loginData.token) {
    // 2. Check user data
    console.log('\nUser has:');
    console.log('Program:', loginData.user?.program);
    console.log('Track:', loginData.user?.track);
    
    // 3. Debug user endpoint
    const debugUserRes = await fetch(
      `http://localhost:3000/api/onboardstudents/debug-user/${loginData.user?.username}`,
      { headers: { 'Authorization': `Bearer ${loginData.token}` } }
    );
    const debugUser = await debugUserRes.json();
    console.log('\nDebug user:', JSON.stringify(debugUser, null, 2));
    
    // 4. Debug assessments
    const debugAssessRes = await fetch(
      'http://localhost:3000/api/assessments/debug-assessments',
      { headers: { 'Authorization': `Bearer ${loginData.token}` } }
    );
    const debugAssess = await debugAssessRes.json();
    console.log('\nDebug assessments:', JSON.stringify(debugAssess, null, 2));
    
    // 5. Try to get tasks
    const tasksRes = await fetch(
      `http://localhost:3000/api/assessments/tasks?program=${encodeURIComponent(loginData.user?.program)}&track=${encodeURIComponent(loginData.user?.track)}`,
      {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const tasksData = await tasksRes.json();
    console.log('\nTasks response:', JSON.stringify(tasksData, null, 2));
  }
}

test().catch(console.error);