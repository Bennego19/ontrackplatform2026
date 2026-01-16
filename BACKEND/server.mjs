import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import db from './db/conn.mjs';

// Initialize environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const uploadsDir = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Uploads directory created');
}

// Initialize Express app
const app = express();

// Connection status tracking
let dbConnectionStatus = 'DISCONNECTED';
let serverStatus = 'STOPPED';

// ======================
// SECURITY MIDDLEWARE
// ======================

// Enhanced CORS Configuration for production
const corsOptions = {
    origin: NODE_ENV === 'development' 
        ? [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3003',
            'http://localhost:5173',
            'http://localhost:8080'
        ]
        : [
            'https://ontrackconnect.co.za',
            'https://www.ontrackconnect.co.za',
            'https://platform.ontrackconnect.co.za',
            'http://platform.ontrackconnect.co.za' // For testing
        ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    credentials: true,
    exposedHeaders: ['Authorization', 'Set-Cookie'],
    maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://ontrackconnect.co.za", "https://*.ontrackconnect.co.za"],
            frameAncestors: ["'none'"]
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(mongoSanitize());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======================
// DOMAIN REDIRECTION
// ======================

// Production domain redirection
if (NODE_ENV === 'production') {
    app.use((req, res, next) => {
        const host = req.headers.host;
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        
        // Redirect www to non-www
        if (host && host.startsWith('www.')) {
            const newHost = host.replace('www.', '');
            return res.redirect(301, `https://${newHost}${req.url}`);
        }
        
        // Force HTTPS in production
        if (!isSecure && !host.includes('localhost')) {
            return res.redirect(301, `https://${host}${req.url}`);
        }
        
        next();
    });
}

// ======================
// STATIC FILES
// ======================

app.use('/uploads', express.static(uploadsDir));

// Serve frontend if available
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

// ======================
// DATABASE CONNECTION CHECK
// ======================

const checkDatabaseConnection = async () => {
    try {
        if (db) {
            const adminDb = db.admin();
            const pingResult = await adminDb.ping();
            
            if (pingResult && pingResult.ok === 1) {
                dbConnectionStatus = 'CONNECTED';
                
                // Get database info
                const dbName = db.databaseName;
                const collections = await db.listCollections().toArray();
                
                console.log('✅ Database connection: CONNECTED');
                console.log(`📊 Database name: ${dbName}`);
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
    
    dbConnectionStatus = 'DISCONNECTED';
    return false;
};

// ======================
// IMPORT ROUTES
// ======================

// Import route modules
import mentorstudentassignment from './routes/mentorstudentassignment.mjs';
import onboardstudents from './routes/onboardstudents.mjs';
import onboardmentors from './routes/onboardmentors.mjs';
import programs from './routes/programs.mjs';
import tracks from './routes/tracks.mjs';
import assessments from './routes/assessments.mjs';
import resources from './routes/resources.mjs';
import events from './routes/events.mjs';
import mentordashboard from './routes/mentordashboard.mjs';
import cohorts from './routes/cohorts.mjs';
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

// Define routes
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

// Mount all routes
routes.forEach(route => {
    app.use(route.path, route.router);
    console.log(`✅ Route mounted: ${route.path} (${route.name})`);
});

// ======================
// API ENDPOINTS
// ======================

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path} | Origin: ${req.headers.origin || 'No Origin'} | Time: ${new Date().toISOString()}`);
    next();
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Server is working!',
        status: 'OK',
        environment: NODE_ENV,
        database: dbConnectionStatus,
        server: serverStatus,
        domain: req.headers.host,
        timestamp: new Date().toISOString()
    });
});

// Welcome endpoint
app.get('/api/welcome', (req, res) => {
    res.json({
        message: 'Welcome to OnTrack Connect API Service!',
        status: {
            server: 'Running',
            database: dbConnectionStatus,
            port: PORT,
            environment: NODE_ENV
        },
        endpoints: routes.map(r => r.path),
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    const dbHealthy = await checkDatabaseConnection();
    
    res.json({
        status: dbHealthy ? 'HEALTHY' : 'UNHEALTHY',
        server: serverStatus,
        database: dbConnectionStatus,
        databaseHealthy: dbHealthy,
        port: PORT,
        environment: NODE_ENV,
        uptime: process.uptime(),
        memory: {
            rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
        },
        timestamp: new Date().toISOString()
    });
});

// Server status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        server: {
            status: serverStatus,
            port: PORT,
            environment: NODE_ENV,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        },
        database: {
            status: dbConnectionStatus,
            name: db?.databaseName || 'Not connected'
        },
        routes: routes.length,
        cors: {
            origins: corsOptions.origin,
            methods: corsOptions.methods
        }
    });
});

// Catch-all for undefined routes
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

// ======================
// SERVER STARTUP
// ======================

const startServer = async () => {
    try {
        console.log('🚀 Starting OnTrack Connect Server...');
        console.log('='.repeat(60));
        console.log(`📦 Environment: ${NODE_ENV}`);
        console.log(`🔧 Port: ${PORT}`);
        console.log(`🏠 Host: ${NODE_ENV === 'production' ? 'platform.ontrackconnect.co.za' : 'localhost'}`);
        console.log('='.repeat(60));
        
        // Check database connection
        console.log('🔌 Checking database connection...');
        const dbConnected = await checkDatabaseConnection();
        
        if (!dbConnected) {
            console.warn('⚠️ Starting server without database connection');
        }
        
        // Start server
        const server = app.listen(PORT, () => {
            serverStatus = 'RUNNING';
            
            console.log('='.repeat(60));
            console.log(`✅ Server is running on port: ${PORT}`);
            console.log(`📡 Database status: ${dbConnectionStatus}`);
            console.log('='.repeat(60));
            console.log(`🌐 Access URLs:`);
            console.log(`   Local: http://localhost:${PORT}`);
            console.log(`   API Test: http://localhost:${PORT}/api/test`);
            console.log(`   Health Check: http://localhost:${PORT}/api/health`);
            console.log(`   Status: http://localhost:${PORT}/api/status`);
            
            if (NODE_ENV === 'production') {
                console.log(`   Production: https://platform.ontrackconnect.co.za`);
            }
            
            console.log('='.repeat(60));
            console.log(`📊 Total routes mounted: ${routes.length}`);
            console.log('='.repeat(60));
            console.log(`🎉 OnTrack Connect Server started successfully!`);
            console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
            console.log('='.repeat(60));
        });
        
        // Handle server errors
        server.on('error', (error) => {
            serverStatus = 'ERROR';
            console.error('❌ Server startup error:', error.message);
            
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
        
        // Graceful shutdown
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
        
        return server;
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

// Export app for testing
export default app;