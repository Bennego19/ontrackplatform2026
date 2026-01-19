const { MongoClient } = require('mongodb');

async function createAdmins() {
  const client = new MongoClient('mongodb://localhost:27017');

  try {
    await client.connect();
    const db = client.db('ontrack-connect');
    const collection = db.collection('admins');

    // Check if admin already exists
    const existingAdmin = await collection.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.username);
      return;
    }

    // Create admin user
    const adminUser = {
      username: 'admin',
      password: 'admin123',
      name: 'System Administrator',
      email: 'admin@ontrack.com',
      role: 'admin',
      createdAt: new Date(),
      lastLogin: null,
      isActive: true
    };

    const result = await collection.insertOne(adminUser);
    console.log('✅ Admin created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('ID:', result.insertedId);

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await client.close();
  }
}

createAdmins();
