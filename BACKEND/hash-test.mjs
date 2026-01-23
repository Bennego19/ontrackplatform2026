import bcrypt from 'bcrypt';

async function hashTest() {
  try {
    const password = 'test123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('Password:', password);
    console.log('Hash:', hashedPassword);

    // Test comparison
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('Comparison result:', isValid);

  } catch (error) {
    console.error('Error:', error);
  }
}

hashTest();
