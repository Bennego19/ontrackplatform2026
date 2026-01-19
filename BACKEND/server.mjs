import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { getDatabase } from "./db/conn.mjs";

/* ROUTES */
import mentorstudentassignment from "./routes/mentorstudentassignment.mjs";
import onboardstudents from "./routes/onboardstudents.mjs";
import onboardmentors from "./routes/onboardmentors.mjs";
import programs from "./routes/programs.mjs";
import tracks from "./routes/tracks.mjs";
import assessments from "./routes/assessments.mjs";
import resources from "./routes/resources.mjs";
import events from "./routes/events.mjs";
import mentordashboard from "./routes/mentordashboard.mjs";
import cohorts from "./routes/cohorts.mjs";
import studentassignment from "./routes/studentassignment.js";
import auth from "./routes/auth.js";
import user from "./routes/user.mjs";
import addassignment from "./routes/addassignment.mjs";
import mentorship from "./routes/mentorship.mjs";
import internship from "./routes/internship.mjs";
import skillsdevelopment from "./routes/skillsdevelopment.js";
import modules from "./routes/modules.mjs";
import projects from "./routes/projects.mjs";
import announcements from "./routes/announcements.mjs";
import accesscontrol from "./routes/accesscontrol.mjs";
import adminlogin from "./routes/adminlogin.mjs";
import addtask from "./routes/addtask.mjs";
import helpRequests from "./routes/help-requests.mjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* UPLOADS DIR */
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/* MIDDLEWARE */
// CORS Configuration for all environments
const corsOptions = {
  origin: (origin, callback) => {
    // List of allowed origins
    const allowedOrigins = [
      // Production origins
      'https://platformontrackconnect.co.za',
      'https://www.platformontrackconnect.co.za',
      'https://ontrackplatform2026-5.onrender.com',
      
      // Development origins
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];
    
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

app.use(mongoSanitize());
app.use(helmet());

/* DATABASE MIDDLEWARE (BEFORE ROUTES) */
app.use(async (req, res, next) => {
  try {
    req.db = await getDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

/* ROUTES */
app.use("/api/onboardstudents", onboardstudents);
app.use("/api/onboardmentors", onboardmentors);
app.use("/api/mentorstudentassignment", mentorstudentassignment);
app.use("/api/mentordashboard", mentordashboard);
app.use("/api/programs", programs);
app.use("/api/tracks", tracks);
app.use("/api/assessments", assessments);
app.use("/api/resources", resources);
app.use("/api/events", events);
app.use("/api/cohorts", cohorts);
app.use("/api/studentassignment", studentassignment);
app.use("/api/auth", auth);
app.use("/api/user", user);
app.use("/api/adminlogin", adminlogin);
app.use("/api/addassignment", addassignment);
app.use("/api/accesscontrol", accesscontrol);
app.use("/api/mentorship", mentorship);
app.use("/api/internship", internship);
app.use("/api/skillsdevelopment", skillsdevelopment);
app.use("/api/modules", modules);
app.use("/api/projects", projects);
app.use("/api/announcements", announcements);
app.use("/api/addtask", addtask);
app.use("/api/help-requests", helpRequests);

/* HEALTH */
app.get("/api/health", async (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* ROOT */
app.get("/", (req, res) => {
  res.json({
    message: "OnTrack Connect API",
    status: "RUNNING",
  });
});
// ====== ADD THESE ROUTES ======

// Welcome endpoint
app.get('/api/welcome', (req, res) => {
  res.json({
    message: 'Welcome to OnTrack Connect API!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    status: 'running',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/api/health',
      '/api/onboardstudents',
      '/api/onboardmentors',
      '/api/programs',
      '/api/tracks',
      '/api/assessments',
      '/api/events',
      '/api/cohorts'
    ]
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working!',
    status: 'OK',
    serverTime: new Date().toISOString(),
    database: 'Connected (based on health check)',
    uptime: process.uptime()
  });
});

// Debug DB endpoint
app.get('/api/debug-db', async (req, res) => {
  try {
    const db = await getDb();
    const collections = await db.listCollections().toArray();
    
    res.json({
      success: true,
      database: db.databaseName,
      collections: collections.map(c => c.name),
      totalCollections: collections.length,
      hasConnection: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      hasConnection: false,
      timestamp: new Date().toISOString()
    });
  }
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    server: {
      status: 'RUNNING',
      port: process.env.PORT || 3000,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    },
    endpoints: {
      working: ['/', '/api/health'],
      needsSetup: ['/api/welcome', '/api/test', '/api/debug-db', '/api/status']
    }
  });
});

/* 404 */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
