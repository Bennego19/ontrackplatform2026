import http from "http";
import dotenv from "dotenv";
import app from "./server.mjs";
import { connectToDatabase } from "./db/conn.mjs";

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const startServer = async () => {
  console.log("🚀 Starting OnTrack Connect Server");
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔧 Port: ${PORT}`);

  try {
    await connectToDatabase();
    console.log("✅ Database ready");
  } catch (error) {
    console.log("⚠️ Database not ready, continuing...");
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
};

process.on("SIGTERM", () => {
  console.log("🛑 Shutting down...");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("🛑 Shutting down...");
  server.close(() => process.exit(0));
});

startServer();
