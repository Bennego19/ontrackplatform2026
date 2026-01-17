import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.ATLAS_URI || "";
const dbName = "ontrack";

let client = null;
let db = null;

// Connection options
const clientOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

const connectToDatabase = async () => {
  try {
    if (!connectionString) {
      console.error('❌ ATLAS_URI environment variable is not set');
      console.error('💡 Please set ATLAS_URI in your environment variables');
      console.error('💡 Format: mongodb+srv://username:password@cluster.mongodb.net/database_name');
      throw new Error('ATLAS_URI is not configured');
    }

    console.log('🔌 Connecting to MongoDB...');
    console.log(`📡 Connection string: ${connectionString.substring(0, 50)}...`);
    
    // Create new client
    client = new MongoClient(connectionString, clientOptions);
    
    // Connect with timeout
    await Promise.race([
      client.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ]);
    
    console.log('✅ MongoDB connected successfully');
    
    // Get database instance
    db = client.db(dbName);
    console.log(`📊 Using database: ${dbName}`);
    
    // Test the connection
    await db.command({ ping: 1 });
    console.log('✅ Database ping successful');
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Close client if it was partially created
    if (client) {
      await client.close().catch(() => {});
    }
    
    return null;
  }
};

// Initialize connection - use a simple promise
let dbInstancePromise = null;

const getDbInstance = async () => {
  if (!dbInstancePromise) {
    dbInstancePromise = connectToDatabase();
  }
  return dbInstancePromise;
};

// For backward compatibility - returns a promise
const dbInstance = await getDbInstance().catch(() => null);

// Export functions
export { connectToDatabase, getDbInstance };
export default dbInstance;