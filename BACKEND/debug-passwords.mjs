import axios from 'axios';

async function debugPasswords() {
  try {
    const response = await axios.get('http://localhost:3000/api/adminlogin/debug-passwords');
    console.log('Debug passwords:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

debugPasswords();
