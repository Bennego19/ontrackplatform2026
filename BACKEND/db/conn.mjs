// conn.mjs - SIMPLE WORKING VERSION
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.ATLAS_URI || "";
const dbName = "ontrack";

let client = null;
let db = null;
let isConnecting = false;

export const connectToDatabase = async () => {
  try {
    if (!connectionString) {
      throw new Error("ATLAS_URI environment variable is not set");
    }

    console.log('🔌 Connecting to MongoDB...');
    
    client = new MongoClient(connectionString, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    console.log('✅ MongoDB connected successfully');

    db = client.db(dbName);
    console.log(`📊 Database: ${db.databaseName}`);
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

export const getDatabase = async () => {
  // If already connecting, wait
  if (isConnecting) {
    console.log('⏳ Database connection in progress, waiting...');
    // In a real app, you'd implement a proper waiting mechanism
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getDatabase();
  }

  // If already connected, return it
  if (db && client) {
    try {
      // Quick ping to verify connection is alive
      await client.db(dbName).command({ ping: 1 });
      return db;
    } catch (error) {
      console.log('⚠️ Connection stale, reconnecting...');
      db = null;
      client = null;
    }
  }

  // Otherwise, connect
  isConnecting = true;
  try {
    const connectedDb = await connectToDatabase();
    isConnecting = false;
    return connectedDb;
  } catch (error) {
    isConnecting = false;
    throw error;
  }
};

// Default export for convenience
export default getDatabase;

// Graceful shutdown
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('👋 MongoDB connection closed');
  }
  process.exit(0);
});