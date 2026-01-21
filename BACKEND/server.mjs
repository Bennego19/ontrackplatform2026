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
    // List of allowed origins - UPDATED
    const allowedOrigins = [
      // Production origins
      'https://platform.ontrackconnect.co.za',     // Your main domain
      'https://www.platform.ontrackconnect.co.za', // WWW version
      'https://ontrackplatform2026-5.onrender.com', // Your backend on Render
      
      // Development origins
      'http://localhost:3000',   // Local backend
      'http://localhost:3001',   // Local frontend (React default)
      'http://localhost:5173',   // Local frontend (Vite default)
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
    ];
    
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      console.log('CORS: No origin (API tool or mobile app)');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log(`CORS: Allowed origin: ${origin}`);
      return callback(null, true);
    } else {
      console.log(`CORS: Blocked origin: ${origin}`);
      console.log(`CORS: Allowed origins:`, allowedOrigins);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
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
    'Access-Control-Allow-Credentials',
    'X-API-Key'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
};

// ====== ADD CORS MIDDLEWARE HERE (AFTER app is created) ======
// Add this middleware for better CORS handling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // If origin matches, set the header
  const allowedOrigins = [
    'https://platform.ontrackconnect.co.za',
    'https://www.platform.ontrackconnect.co.za',
    'https://ontrackplatform2026-5.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Then use cors with your options
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes

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
    console.error('Database middleware error:', error);
    res.status(500).json({ 
      error: "Database connection failed",
      details: error.message 
    });
  }
});

/* ROUTES */
console.log('📋 Mounting API routes...');

const routes = [
  { path: "/api/onboardstudents", name: "Onboard Students" },
  { path: "/api/onboardmentors", name: "Onboard Mentors" },
  { path: "/api/mentorstudentassignment", name: "Mentor Student Assignment" },
  { path: "/api/mentordashboard", name: "Mentor Dashboard" },
  { path: "/api/programs", name: "Programs" },
  { path: "/api/tracks", name: "Tracks" },
  { path: "/api/assessments", name: "Assessments" },
  { path: "/api/resources", name: "Resources" },
  { path: "/api/events", name: "Events" },
  { path: "/api/cohorts", name: "Cohorts" },
  { path: "/api/studentassignment", name: "Student Assignment" },
  { path: "/api/auth", name: "Auth" },
  { path: "/api/user", name: "User" },
  { path: "/api/adminlogin", name: "Admin Login" },
  { path: "/api/addassignment", name: "Add Assignment" },
  { path: "/api/accesscontrol", name: "Access Control" },
  { path: "/api/mentorship", name: "Mentorship" },
  { path: "/api/internship", name: "Internship" },
  { path: "/api/skillsdevelopment", name: "Skills Development" },
  { path: "/api/modules", name: "Modules" },
  { path: "/api/projects", name: "Projects" },
  { path: "/api/announcements", name: "Announcements" },
  { path: "/api/addtask", name: "Add Task" },
  { path: "/api/help-requests", name: "Help Requests" },
];

// Mount all routes
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

// Log mounted routes
routes.forEach(route => {
  console.log(`✅ Route mounted: ${route.path} (${route.name})`);
});

console.log(`✅ Total routes mounted: ${routes.length}`);

/* HEALTH */
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    const db = req.db;
    await db.command({ ping: 1 });
    
    res.json({
      status: "OK",
      database: "CONNECTED",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      database: "DISCONNECTED",
      error: error.message,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }
});

/* ROOT */
app.get("/", (req, res) => {
  res.json({
    message: "OnTrack Connect API",
    status: "RUNNING",
    version: "1.0.0",
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    documentation: "Visit /api/welcome for available endpoints"
  });
});

/* ADDITIONAL ENDPOINTS */

// Welcome endpoint
app.get('/api/welcome', (req, res) => {
  res.json({
    message: 'Welcome to OnTrack Connect API!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    status: 'running',
    timestamp: new Date().toISOString(),
    availableEndpoints: routes.map(r => r.path),
    totalEndpoints: routes.length,
    documentation: {
      health: 'GET /api/health',
      test: 'GET /api/test',
      debug: 'GET /api/debug-db',
      status: 'GET /api/status'
    }
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working!',
    status: 'OK',
    serverTime: new Date().toISOString(),
    database: 'Connected (via middleware)',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug DB endpoint - FIXED: using getDatabase instead of getDb
app.get('/api/debug-db', async (req, res) => {
  try {
    // Use the database from middleware OR get a new connection
    const db = req.db || await getDatabase();
    const collections = await db.listCollections().toArray();
    
    res.json({
      success: true,
      database: db.databaseName,
      collections: collections.map(c => c.name),
      totalCollections: collections.length,
      hasConnection: true,
      viaMiddleware: !!req.db,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug DB error:', error);
    res.status(500).json({
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
    database: {
      status: 'CONNECTED (via middleware)',
      available: !!req.db
    },
    routes: {
      total: routes.length,
      working: ['/', '/api/health', '/api/welcome', '/api/test', '/api/debug-db', '/api/status'],
      mounted: routes.map(r => r.path)
    }
  });
});

/* 404 */
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    suggestion: "Try /api/welcome for available endpoints"
  });
});

/* ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: "Internal Server Error",
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Export the app
export default app;

// If this file is run directly, start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📅 Started: ${new Date().toISOString()}`);
  });
}