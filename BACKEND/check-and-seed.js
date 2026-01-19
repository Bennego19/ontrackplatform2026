const axios = require('axios');

async function checkAndSeedData() {
  const baseURL = 'http://localhost:3000/api';

  try {
    console.log('=== CHECKING BACKEND STATUS ===');

    // 1. Check if backend is running
    console.log('1. Checking if backend is running...');
    const welcomeResponse = await axios.get(`${baseURL}/assessments/welcome`);
    console.log('✅ Backend is running:', welcomeResponse.data.message);

    // 2. Check debug endpoint
    console.log('\n2. Checking database contents...');
    const debugResponse = await axios.get(`${baseURL}/assessments/debug-database-contents`);
    console.log('Database contents:', JSON.stringify(debugResponse.data, null, 2));

    // 3. Create additional sample data to ensure users see content
    console.log('\n3. Adding comprehensive sample data for all user types...');

    // Create sample data for common programs/tracks - ADD MORE VARIETY
    const sampleData = [
      // Tasks - Add general tasks that work for multiple programs
      { assessmentname: "Complete JavaScript Basics", assessmenttype: "task", program: "Mentorship Program", track: "Web Development", datedue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { assessmentname: "Build a Simple Calculator", assessmenttype: "task", program: "Internship Program", track: "Web Development", datedue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      { assessmentname: "Learn Java OOP Concepts", assessmenttype: "task", program: "Mentorship Program", track: "Java Programming", datedue: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
      { assessmentname: "Python Data Structures", assessmenttype: "task", program: "Skill Development Program", track: "Python Programming", datedue: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
      { assessmentname: "C# LINQ Queries", assessmenttype: "task", program: "Graduate Program", track: "C# Programming", datedue: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000) },

      // Modules
      { assessmentname: "HTML/CSS Module", assessmenttype: "module", program: "Mentorship Program", track: "Web Development" },
      { assessmentname: "Database Design Module", assessmenttype: "module", program: "Internship Program", track: "Java Programming" },
      { assessmentname: "React Fundamentals", assessmenttype: "module", program: "Skill Development Program", track: "Web Development" },
      { assessmentname: "Django Web Framework", assessmenttype: "module", program: "Mentorship Program", track: "Python Programming" },
      { assessmentname: ".NET Core Module", assessmenttype: "module", program: "Internship Program", track: "C# Programming" },

      // Assignments
      { assessmentname: "Portfolio Website Assignment", assessmenttype: "assignment", program: "Mentorship Program", track: "Web Development" },
      { assessmentname: "Database Schema Assignment", assessmenttype: "assignment", program: "Internship Program", track: "Java Programming" },
      { assessmentname: "API Development Assignment", assessmenttype: "assignment", program: "Skill Development Program", track: "Python Programming" },
      { assessmentname: "MVC Application Assignment", assessmenttype: "assignment", program: "Graduate Program", track: "C# Programming" },

      // Projects
      { assessmentname: "E-commerce Website Project", assessmenttype: "project", program: "Internship Program", track: "Web Development" },
      { assessmentname: "Inventory Management System", assessmenttype: "project", program: "Skill Development Program", track: "Java Programming" },
      { assessmentname: "Data Analysis Dashboard", assessmenttype: "project", program: "Mentorship Program", track: "Python Programming" },
      { assessmentname: "Enterprise Management System", assessmenttype: "project", program: "Graduate Program", track: "C# Programming" },

      // Resources
      { assessmentname: "JavaScript Documentation", assessmenttype: "resource", program: "Mentorship Program", track: "Web Development" },
      { assessmentname: "Java Best Practices Guide", assessmenttype: "resource", program: "Internship Program", track: "Java Programming" },
      { assessmentname: "Python Libraries Reference", assessmenttype: "resource", program: "Skill Development Program", track: "Python Programming" },
      { assessmentname: "C# Language Guide", assessmenttype: "resource", program: "Graduate Program", track: "C# Programming" },

      // Add some GENERAL assessments that ALL users can see
      { assessmentname: "General Programming Best Practices", assessmenttype: "resource", isGeneral: true },
      { assessmentname: "Version Control with Git", assessmenttype: "module", isGeneral: true },
      { assessmentname: "Software Development Life Cycle", assessmenttype: "task", isGeneral: true },
      { assessmentname: "Code Review Guidelines", assessmenttype: "assignment", isGeneral: true },
      { assessmentname: "Portfolio Development Project", assessmenttype: "project", isGeneral: true }
    ];

    for (const item of sampleData) {
      try {
        await axios.post(`${baseURL}/assessments`, item);
        console.log(`✅ Created: ${item.assessmenttype} - ${item.assessmentname}`);
      } catch (error) {
        console.log(`❌ Failed to create: ${item.assessmentname}`, error.message);
      }
    }

    // 4. Test the user endpoints (these require authentication, so they'll fail but show if routes exist)
    console.log('\n4. Testing user endpoints (will fail without auth, but checks if routes exist)...');
    try {
      await axios.get(`${baseURL}/assessments/tasks`);
      console.log('✅ Tasks endpoint accessible');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Tasks endpoint exists (requires auth)');
      } else {
        console.log('❌ Tasks endpoint error:', error.message);
      }
    }

    console.log('\n=== SETUP COMPLETE ===');
    console.log('The user dashboard tabs should now show data when logged in.');

  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
    console.log('\nMake sure the backend server is running on port 5000');
    console.log('Run: cd BACKEND && npm start');
  }
}

checkAndSeedData();
