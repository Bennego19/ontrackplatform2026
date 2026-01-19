import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.ATLAS_URI || "";
const dbName = "ontrack";

let client = null;
let db = null;

// MODERN CONNECTION OPTIONS (Node Driver v4+)
const clientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Timeout settings
  serverSelectionTimeoutMS: 5000,    // 5 seconds
  socketTimeoutMS: 45000,            // 45 seconds
  connectTimeoutMS: 10000,           // 10 seconds
  
  // Connection pool settings
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,             // Close idle connections after 30 seconds
};

const connectToDatabase = async () => {
  try {
    if (!connectionString) {
      console.error('❌ ATLAS_URI environment variable is not set');
      console.error('💡 Please set ATLAS_URI in your environment variables');
      throw new Error('ATLAS_URI is not configured');
    }

    console.log('🔌 Connecting to MongoDB...');
    console.log(`📡 Connection string: ${connectionString.substring(0, 50)}...`);
    
    // Create new client with modern options
    client = new MongoClient(connectionString, clientOptions);
    
    // Connect with timeout
    await client.connect();
    
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

// Initialize connection
let dbInstancePromise = null;

const getDbInstance = async () => {
  if (!dbInstancePromise) {
    dbInstancePromise = connectToDatabase();
  }
  return dbInstancePromise;
};

// Get database instance (returns promise)
const getDb = async () => {
  try {
    const db = await getDbInstance();
    if (!db) {
      throw new Error('Database connection failed');
    }
    return db;
  } catch (error) {
    console.error('Failed to get database instance:', error);
    throw error;
  }
};

// Export functions
export { connectToDatabase, getDbInstance, getDb };
export default getDb;