import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.ATLAS_URI;
const dbName = process.env.DB_NAME || "ontrack";

if (!connectionString) {
  console.error("❌ ATLAS_URI is not set in environment variables");
}

const CLIENT_OPTIONS = {
  maxPoolSize: 20,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
};

let client = null;
let db = null;
let connectingPromise = null;

/**
 * Connect to MongoDB
 */
export const connectToDatabase = async () => {
  if (db) {
    return db;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    try {
      console.log("🔌 Connecting to MongoDB...");
      client = new MongoClient(connectionString, CLIENT_OPTIONS);
      await client.connect();

      db = client.db(dbName);

      await db.command({ ping: 1 });

      console.log("✅ MongoDB connected");
      console.log(`📊 Database: ${db.databaseName}`);

      return db;
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error.message);
      client = null;
      db = null;
      connectingPromise = null;
      throw error;
    }
  })();

  return connectingPromise;
};

/**
 * Get DB instance (auto-connects)
 */
export const getDatabase = async () => {
  if (!db) {
    return await connectToDatabase();
  }

  try {
    await db.command({ ping: 1 });
    return db;
  } catch {
    db = null;
    client = null;
    return await connectToDatabase();
  }
};

/**
 * Health check
 */
export const checkHealth = async () => {
  try {
    const database = await getDatabase();
    const stats = await database.stats();

    return {
      healthy: true,
      database: database.databaseName,
      collections: stats.collections,
      documents: stats.objects,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      healthy: false,
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Close connection
 */
export const closeConnection = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    connectingPromise = null;
    console.log("👋 MongoDB connection closed");
  }
};

export default getDatabase;
