import express from 'express';
import https from "https";
import cors from 'cors';
import dotenv from 'dotenv';
import mentorstudentassignment from './routes/mentorstudentassignment.mjs';
// Import your routes
import onboardstudents from './routes/onboardstudents.mjs';
import onboardmentors from './routes/onboardmentors.mjs';
import programs from './routes/programs.mjs';
import tracks from './routes/tracks.mjs';
import assessments from './routes/assessments.mjs';
import resources from './routes/resources.mjs';
import events from './routes/events.mjs';
import mentordashboard from './routes/mentordashboard.mjs';
import cohorts from './routes/cohorts.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import db from './db/conn.mjs'; // Import your database connection

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');

// Create directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Uploads directory created');
}
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Add connection status tracking
let dbConnectionStatus = 'DISCONNECTED';
let serverStatus = 'STOPPED';

// Function to check database connection
const checkDatabaseConnection = async () => {
  try {
    if (db) {
      // Try to ping the database
      const adminDb = db.admin();
      const pingResult = await adminDb.ping();
      
      if (pingResult && pingResult.ok === 1) {
        dbConnectionStatus = 'CONNECTED';
        console.log('✅ Database connection: CONNECTED');
        console.log(`📊 Database name: ${db.databaseName}`);
        
        // List collections
        const collections = await db.listCollections().toArray();
        console.log(`📁 Collections found: ${collections.length}`);
        collections.forEach(col => {
          console.log(`   - ${col.name}`);
        });
        
        return true;
      }
    }
  } catch (error) {
    dbConnectionStatus = 'ERROR';
    console.error('❌ Database connection error:', error.message);
    return false;
  }
  return false;
};

// CORS Configuration - UPDATED
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:5173', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Serve frontend admin login as landing page if available
const frontendDir = path.join(__dirname, '..', 'frontend html');
if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir));
  app.get('/', (req, res) => {
    res.sendFile(path.join(frontendDir, 'adminlogin.html'));
  });
  console.log('🌐 Frontend directory found and mounted');
} else {
  console.log('⚠️ Frontend directory not found');
}

// Import additional routes
import studentassignment from './routes/studentassignment.js';
import auth from './routes/auth.js';
import user from './routes/user.mjs';
import addassignment from './routes/addassignment.mjs';
import mentorship from './routes/mentorship.mjs';
import internship from './routes/internship.mjs';
import skillsdevelopment from './routes/skillsdevelopment.js';
import modules from './routes/modules.mjs';
import projects from './routes/projects.mjs';
import announcements from './routes/announcements.mjs';
import accesscontrol from './routes/accesscontrol.mjs';
import adminlogin from './routes/adminlogin.mjs';
import addtask from './routes/addtask.mjs';
import helpRequests from './routes/help-requests.mjs';

// Mount the routes with logging
const routes = [
  { path: '/api/onboardstudents', router: onboardstudents, name: 'Onboard Students' },
  { path: '/api/onboardmentors', router: onboardmentors, name: 'Onboard Mentors' },
  { path: '/api/mentorstudentassignment', router: mentorstudentassignment, name: 'Mentor Student Assignment' },
  { path: '/api/mentordashboard', router: mentordashboard, name: 'Mentor Dashboard' },
  { path: '/api/programs', router: programs, name: 'Programs' },
  { path: '/api/tracks', router: tracks, name: 'Tracks' },
  { path: '/api/assessments', router: assessments, name: 'Assessments' },
  { path: '/api/resources', router: resources, name: 'Resources' },
  { path: '/api/events', router: events, name: 'Events' },
  { path: '/api/cohorts', router: cohorts, name: 'Cohorts' },
  { path: '/api/studentassignment', router: studentassignment, name: 'Student Assignment' },
  { path: '/api/auth', router: auth, name: 'Auth' },
  { path: '/api/adminlogin', router: adminlogin, name: 'Admin Login' },
  { path: '/api/user', router: user, name: 'User' },
  { path: '/api/addassignment', router: addassignment, name: 'Add Assignment' },
  { path: '/api/accesscontrol', router: accesscontrol, name: 'Access Control' },
  { path: '/api/mentorship', router: mentorship, name: 'Mentorship' },
  { path: '/api/internship', router: internship, name: 'Internship' },
  { path: '/api/skillsdevelopment', router: skillsdevelopment, name: 'Skills Development' },
  { path: '/api/modules', router: modules, name: 'Modules' },
  { path: '/api/projects', router: projects, name: 'Projects' },
  { path: '/api/announcements', router: announcements, name: 'Announcements' },
  { path: '/api/addtask', router: addtask, name: 'Add Task' },
  { path: '/api/help-requests', router: helpRequests, name: 'Help Requests' }
];

// Mount all routes with logging
routes.forEach(route => {
  app.use(route.path, route.router);
  console.log(`✅ Route mounted: ${route.path} (${route.name})`);
});

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(mongoSanitize());
app.use(helmet());

app.use(
  helmet.frameguard({
    action: "deny",
  })
);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  })
);

// Test route with connection status
app.get('/api/test', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.json({ 
    message: 'Server is working!',
    status: 'OK',
    database: dbConnectionStatus,
    server: serverStatus,
    timestamp: new Date().toISOString()
  });
});

// Welcome route with logging
app.get('/api/welcome', (req, res) => {
  console.log(`📥 Request received: ${req.method} ${req.path} from ${req.headers.origin}`);
  res.json({ 
    message: 'Welcome to the API Service!',
    status: {
      server: 'Running',
      database: dbConnectionStatus,
      port: PORT
    },
    serverTime: new Date().toISOString(),
    endpoints: routes.map(r => r.path)
  });
});

// Health check endpoint with detailed status
app.get('/api/health', async (req, res) => {
  const dbHealthy = await checkDatabaseConnection();
  
  res.json({
    status: dbHealthy ? 'HEALTHY' : 'UNHEALTHY',
    server: serverStatus,
    database: dbConnectionStatus,
    databaseHealthy: dbHealthy,
    port: PORT,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage()
  });
});

// Enhanced startup function
const startServer = async () => {
  try {
    console.log('🚀 Starting OnTrack Connect Server...');
    console.log('='.repeat(50));
    
    // Check database connection before starting
    console.log('🔌 Checking database connection...');
    const dbConnected = await checkDatabaseConnection();
    
    if (!dbConnected) {
      console.warn('⚠️ Starting server without database connection');
    }
    
    const server = app.listen(PORT, () => {
      serverStatus = 'RUNNING';
      
      console.log('='.repeat(50));
      console.log(`✅ Server is running on port: ${PORT}`);
      console.log(`📡 Database status: ${dbConnectionStatus}`);
      console.log('='.repeat(50));
      console.log(`🌐 Test endpoints:`);
      console.log(`   http://localhost:${PORT}/api/test`);
      console.log(`   http://localhost:${PORT}/api/health`);
      console.log(`   http://localhost:${PORT}/api/welcome`);
      console.log('='.repeat(50));
      console.log(`📊 Total routes mounted: ${routes.length}`);
      console.log('='.repeat(50));
      
      // Log startup completion
      console.log(`🎉 OnTrack Connect Server started successfully at ${new Date().toLocaleTimeString()}`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      serverStatus = 'ERROR';
      console.error('❌ Server error:', error);
      
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try a different port.`);
        process.exit(1);
      }
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🔴 Received SIGINT. Shutting down gracefully...');
      serverStatus = 'STOPPING';
      server.close(() => {
        console.log('✅ Server shut down successfully');
        process.exit(0);
      });
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🔴 Received SIGTERM. Shutting down gracefully...');
      serverStatus = 'STOPPING';
      server.close(() => {
        console.log('✅ Server shut down successfully');
        process.exit(0);
      });
    });
    
    return server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Add a status endpoint to check server status
app.get('/api/status', (req, res) => {
  res.json({
    server: {
      status: serverStatus,
      port: PORT,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    },
    database: {
      status: dbConnectionStatus,
      name: db?.databaseName || 'Not connected'
    },
    routes: routes.length,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start the server
startServer();