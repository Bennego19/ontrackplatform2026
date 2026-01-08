const axios = require('axios');

// Test script to debug assessment endpoints
async function debugAssessments() {
  const baseURL = 'http://localhost:5000/api';

  try {
    console.log('=== DEBUGGING ASSESSMENTS ENDPOINTS ===\n');

    // 1. Test debug endpoint
    console.log('1. Testing debug endpoint...');
    const debugResponse = await axios.get(`${baseURL}/assessments/debug-database-contents`);
    console.log('Debug data:', JSON.stringify(debugResponse.data, null, 2));
    console.log('');

    // 2. Test general assessments endpoint
    console.log('2. Testing general assessments endpoint...');
    const assessmentsResponse = await axios.get(`${baseURL}/assessments`);
    console.log('Assessments:', JSON.stringify(assessmentsResponse.data, null, 2));
    console.log('');

    // 3. Test totals endpoints
    console.log('3. Testing totals endpoints...');
    const totalResponse = await axios.get(`${baseURL}/assessments/total`);
    console.log('Total assessments:', totalResponse.data.total);

    const totalsByType = await axios.get(`${baseURL}/assessments/totals-by-type`);
    console.log('Totals by type:', totalsByType.data.totals);

    const totalsByProgram = await axios.get(`${baseURL}/assessments/totals-by-program`);
    console.log('Totals by program:', totalsByProgram.data.totals);

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

debugAssessments();
