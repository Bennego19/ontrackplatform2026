import {MongoClient} from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.ATLAS_URI || "";
const dbName = "ontrack";

let client;
let db;

const connectToDatabase = async () => {
  try {
    if (!connectionString) {
      console.error('❌ ATLAS_URI environment variable is not set');
      console.error('💡 Please set ATLAS_URI in your environment variables');
      console.error('💡 Format: mongodb+srv://username:password@cluster.mongodb.net/database_name');
      return null;
    }

    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(connectionString);
    await client.connect();
    console.log('✅ MongoDB connected successfully');

    db = client.db(dbName);
    console.log(`📊 Using database: ${dbName}`);

    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return null;
  }
};

// Initialize connection
const initializeDb = async () => {
  db = await connectToDatabase();
  return db;
};

// Export the database connection (with fallback)
let dbInstance = null;

try {
  dbInstance = await initializeDb();
} catch (error) {
  console.error('❌ Failed to initialize database connection:', error.message);
  console.warn('⚠️ Server will start without database connection');
}

export { connectToDatabase };
export default dbInstance;
