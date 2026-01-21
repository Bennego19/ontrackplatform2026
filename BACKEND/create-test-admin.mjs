import getDb from './db/conn.mjs';
import bcrypt from 'bcrypt';

async function createTestAdmin() {
  try {
    console.log('Creating test admin...');

    const db = await getDb();
    if (!db) {
      console.error('Database connection failed');
      return;
    }

    const collection = db.collection('admins');

    // Check if test admin already exists
    const existingAdmin = await collection.findOne({ username: 'testadmin' });
    if (existingAdmin) {
      console.log('Test admin already exists');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);

    const testAdmin = {
      username: 'testadmin',
      password: hashedPassword,
      name: 'Test Administrator',
      email: 'test@ontrack.com',
      role: 'admin',
      createdAt: new Date(),
      lastLogin: null,
      isActive: true
    };

    const result = await collection.insertOne(testAdmin);
    console.log('Test admin created successfully:', result.insertedId);

  } catch (error) {
    console.error('Error creating test admin:', error);
  }
}

createTestAdmin();
