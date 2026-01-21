import axios from 'axios';

async function checkAdmins() {
  try {
    console.log('Checking admins in database...');

    const response = await axios.get('http://localhost:3000/api/adminlogin/debug-db');

    console.log('Admins found:', response.data.admins);

  } catch (error) {
    console.error('Error checking admins:', error.response ? error.response.data : error.message);
  }
}

checkAdmins();
