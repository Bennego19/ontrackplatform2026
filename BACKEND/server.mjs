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

// CORS Configuration - UPDATED for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://platform.ontrackconnect.co.za']
    : ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:5173', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Security middleware
app.use(mongoSanitize());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  frameguard: { action: 'deny' }
}));

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

// Test route with connection status
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    status: 'OK',
    database: dbConnectionStatus,
    server: serverStatus,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Welcome route with logging
app.get('/api/welcome', (req, res) => {
  console.log(`📥 Request received: ${req.method} ${req.path} from ${req.headers.origin}`);
  res.json({ 
    message: 'Welcome to OnTrack Connect API Service!',
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
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
    }
  });
});

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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'OnTrack Connect API Server',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: 'ERROR',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Enhanced startup function
const startServer = async () => {
  try {
    console.log('🚀 Starting OnTrack Connect Server...');
    console.log('='.repeat(50));
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Port: ${PORT}`);
    console.log(`🏠 Host: 0.0.0.0`);
    console.log('='.repeat(50));
    
    // Check database connection before starting
    console.log('🔌 Checking database connection...');
    const dbConnected = await checkDatabaseConnection();
    
    if (!dbConnected) {
      console.warn('⚠️ Starting server without database connection');
    } else {
      console.log('✅ Database connection established');
    }
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      serverStatus = 'RUNNING';
      
      console.log('='.repeat(50));
      console.log(`✅ Server is running on port: ${PORT}`);
      console.log(`📡 Database status: ${dbConnectionStatus}`);
      console.log('='.repeat(50));
      console.log(`🌐 Access URLs:`);
      console.log(`   Local: http://localhost:${PORT}`);
      console.log(`   API Test: http://localhost:${PORT}/api/test`);
      console.log(`   Health Check: http://localhost:${PORT}/api/health`);
      console.log(`   Status: http://localhost:${PORT}/api/status`);
      console.log('='.repeat(50));
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`   Production: https://platform.ontrackconnect.co.za`);
        console.log('='.repeat(50));
      }
      
      console.log(`📊 Total routes mounted: ${routes.length}`);
      console.log('='.repeat(50));
      console.log(`🎉 OnTrack Connect Server started successfully!`);
      console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
      console.log('='.repeat(50));
    });
    
    // Handle server errors
    server.on('error', (error) => {
      serverStatus = 'ERROR';
      console.error('❌ Server error:', error.message);
      
      if (error.code === 'EADDRINUSE') {
        console.error(`💡 Port ${PORT} is already in use. Try:`);
        console.error(`   1. Change PORT in .env file to another number (e.g., 3002)`);
        console.error(`   2. Kill the process using port ${PORT}`);
        console.error(`   3. Run: npx kill-port ${PORT}`);
      } else if (error.code === 'EACCES') {
        console.error(`🔒 Permission denied for port ${PORT}. Try:`);
        console.error(`   1. Use a port above 1024 (e.g., 3001, 5000, 8080)`);
        console.error(`   2. Run as administrator (Windows)`);
        console.error(`   3. Change PORT in .env file`);
      }
      
      process.exit(1);
    });
    
    // Handle graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n🔴 Received ${signal}. Shutting down gracefully...`);
      serverStatus = 'STOPPING';
      
      server.close(() => {
        console.log('✅ Server shut down successfully');
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️ Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    // Global error handlers
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    return server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// CRITICAL: Export the app for Render
export default app;