import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

const endpoints = [
  // Basic endpoints
  { method: 'GET', path: '/api/test', description: 'Test endpoint' },
  { method: 'GET', path: '/api/health', description: 'Health check' },
  { method: 'GET', path: '/api/welcome', description: 'Welcome endpoint' },

  // Onboard Students
  { method: 'GET', path: '/api/onboardstudents/', description: 'Get all students' },
  { method: 'GET', path: '/api/onboardstudents/total-students', description: 'Get total students' },
  { method: 'GET', path: '/api/onboardstudents/students-by-track', description: 'Get students by track' },

  // Onboard Mentors
  { method: 'GET', path: '/api/onboardmentors/', description: 'Get all mentors' },
  { method: 'GET', path: '/api/onboardmentors/total-mentors', description: 'Get total mentors' },
  { method: 'GET', path: '/api/onboardmentors/mentors-by-track', description: 'Get mentors by track' },

  // Programs
  { method: 'GET', path: '/api/programs/', description: 'Get all programs' },

  // Tracks
  { method: 'GET', path: '/api/tracks/', description: 'Get all tracks' },

  // Assessments
  { method: 'GET', path: '/api/assessments/', description: 'Get all assessments' },

  // Resources
  { method: 'GET', path: '/api/resources/', description: 'Get all resources' },

  // Events
  { method: 'GET', path: '/api/events/', description: 'Get all events' },

  // Cohorts
  { method: 'GET', path: '/api/cohorts/', description: 'Get all cohorts' },

  // Student Assignment
  { method: 'GET', path: '/api/studentassignment/', description: 'Get student assignments' },

  // Auth
  { method: 'GET', path: '/api/auth/', description: 'Auth endpoint' },

  // Admin Login
  { method: 'GET', path: '/api/adminlogin/', description: 'Admin login endpoint' },

  // User
  { method: 'GET', path: '/api/user/', description: 'User endpoint' },

  // Add Assignment
  { method: 'GET', path: '/api/addassignment/', description: 'Add assignment endpoint' },

  // Add Task
  { method: 'GET', path: '/api/addtask/', description: 'Add task endpoint' },

  // Access Control
  { method: 'GET', path: '/api/accesscontrol/', description: 'Access control endpoint' },

  // Mentorship
  { method: 'GET', path: '/api/mentorship/', description: 'Mentorship endpoint' },

  // Internship
  { method: 'GET', path: '/api/internship/', description: 'Internship endpoint' },

  // Skills Development
  { method: 'GET', path: '/api/skillsdevelopment/', description: 'Skills development endpoint' },

  // Modules
  { method: 'GET', path: '/api/modules/', description: 'Modules endpoint' },

  // Projects
  { method: 'GET', path: '/api/projects/', description: 'Projects endpoint' },

  // Announcements
  { method: 'GET', path: '/api/announcements/', description: 'Announcements endpoint' },

  // Mentor Student Assignment
  { method: 'GET', path: '/api/mentorstudentassignment/', description: 'Mentor student assignment endpoint' },

  // Mentor Dashboard
  { method: 'GET', path: '/api/mentordashboard/', description: 'Mentor dashboard endpoint' },

  // Add Task
  { method: 'GET', path: '/api/addtask/', description: 'Add task endpoint' },
];

async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  const options = {
    method: endpoint.method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await fetch(url, options);
    const status = response.status;
    let responseText = '';

    try {
      responseText = await response.text();
    } catch (e) {
      responseText = 'Could not read response body';
    }

    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      description: endpoint.description,
      status,
      success: status >= 200 && status < 300,
      responseLength: responseText.length,
      error: null
    };
  } catch (error) {
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      description: endpoint.description,
      status: null,
      success: false,
      responseLength: 0,
      error: error.message
    };
  }
}

async function testAllEndpoints() {
  console.log('🔍 Testing all API endpoints...\n');
  console.log('=' .repeat(80));

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);

    const statusIcon = result.success ? '✅' : '❌';
    const statusText = result.status ? `Status: ${result.status}` : `Error: ${result.error}`;

    console.log(`${statusIcon} ${result.method} ${result.endpoint}`);
    console.log(`   ${result.description}`);
    console.log(`   ${statusText}`);
    console.log('');

    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('=' .repeat(80));
  console.log(`📊 Test Results Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📈 Success Rate: ${((successCount / endpoints.length) * 100).toFixed(1)}%`);
  console.log('');

  // Group failures
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('❌ Failed Endpoints:');
    failures.forEach(failure => {
      console.log(`   ${failure.method} ${failure.endpoint} - ${failure.error || `Status: ${failure.status}`}`);
    });
  }

  return results;
}

// Run the tests
testAllEndpoints().catch(console.error);
