import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';

// Initialize environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI;
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
let mongooseConnection = null;

// ======================
// DATABASE CONNECTION
// ======================

const connectDatabase = async () => {
    try {
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        console.log('🔌 Connecting to MongoDB...');
        
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        };

        await mongoose.connect(MONGODB_URI, options);
        mongooseConnection = mongoose.connection;

        // Event listeners for MongoDB connection
        mongooseConnection.on('connected', () => {
            dbConnectionStatus = 'CONNECTED';
            console.log('✅ MongoDB connected successfully');
        });

        mongooseConnection.on('error', (err) => {
            dbConnectionStatus = 'ERROR';
            console.error('❌ MongoDB connection error:', err.message);
        });

        mongooseConnection.on('disconnected', () => {
            dbConnectionStatus = 'DISCONNECTED';
            console.log('⚠️ MongoDB disconnected');
        });

        // Initial connection check
        if (mongooseConnection.readyState === 1) {
            dbConnectionStatus = 'CONNECTED';
            console.log('✅ MongoDB is already connected');
        }

        return mongooseConnection;
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error.message);
        dbConnectionStatus = 'ERROR';
        
        // Retry connection after 5 seconds
        console.log('🔄 Retrying connection in 5 seconds...');
        setTimeout(connectDatabase, 5000);
        
        return null;
    }
};

// Database connection check function
const checkDatabaseConnection = async () => {
    try {
        if (mongooseConnection && mongooseConnection.readyState === 1) {
            const db = mongooseConnection.db;
            
            // Ping database
            await db.command({ ping: 1 });
            
            // Get database info
            const dbName = db.databaseName;
            const collections = await db.listCollections().toArray();
            
            console.log('✅ Database connection: CONNECTED');
            console.log(`📊 Database name: ${dbName}`);
            console.log(`📁 Collections found: ${collections.length}`);
            collections.forEach(col => {
                console.log(`   - ${col.name}`);
            });
            
            dbConnectionStatus = 'CONNECTED';
            return true;
        } else {
            console.log('❌ Database not connected. ReadyState:', mongooseConnection?.readyState);
            dbConnectionStatus = 'DISCONNECTED';
            return false;
        }
    } catch (error) {
        console.error('❌ Database check error:', error.message);
        dbConnectionStatus = 'ERROR';
        return false;
    }
};

// Export database connection for use in routes
export const getDatabase = () => {
    if (mongooseConnection && mongooseConnection.readyState === 1) {
        return mongooseConnection.db;
    }
    throw new Error('Database not connected');
};

export const getMongoose = () => {
    return mongoose;
};

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
            'https://platform.ontrackconnect.co.za',
            'https://www.platform.ontrackconnect.co.za',
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
    app.set('trust proxy', 1); // Trust proxy headers
    
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

// Middleware to inject database into routes
app.use((req, res, next) => {
    // Attach database connection to request object
    req.db = getDatabase;
    req.mongoose = getMongoose;
    next();
});

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

// Test endpoint with database retrieval
app.get('/api/test-db', async (req, res) => {
    try {
        const db = getDatabase();
        
        // Test by listing collections
        const collections = await db.listCollections().toArray();
        
        res.json({
            message: 'Database test successful!',
            status: 'OK',
            database: db.databaseName,
            collections: collections.map(col => col.name),
            environment: NODE_ENV,
            connectionStatus: dbConnectionStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Database test failed',
            message: error.message,
            connectionStatus: dbConnectionStatus,
            timestamp: new Date().toISOString()
        });
    }
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
            connected: mongooseConnection?.readyState === 1,
            name: mongooseConnection?.db?.databaseName || 'Not connected'
        },
        routes: routes.length,
        cors: {
            origins: corsOptions.origin,
            methods: corsOptions.methods
        }
    });
});

// Example data retrieval endpoint
app.get('/api/users', async (req, res) => {
    try {
        const db = getDatabase();
        const usersCollection = db.collection('users');
        const users = await usersCollection.find({}).limit(10).toArray();
        
        res.json({
            success: true,
            count: users.length,
            users: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
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
// SAMPLE ROUTE FOR RETRIEVAL
// ======================

// Add this as a demonstration of proper retrieval
app.get('/api/demo/users', async (req, res) => {
    try {
        const db = getDatabase();
        const users = await db.collection('users').find({}).toArray();
        
        res.json({
            success: true,
            message: 'Data retrieval successful',
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve data',
            details: error.message
        });
    }
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
        
        // Connect to database first
        console.log('🔌 Connecting to database...');
        await connectDatabase();
        
        // Check database connection
        const dbConnected = await checkDatabaseConnection();
        
        if (!dbConnected) {
            console.warn('⚠️ Starting server without database connection - some features may not work');
        } else {
            console.log('✅ Database connection established and verified');
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
            console.log(`   API Test: http://localhost:${PORT}/api/test-db`);
            console.log(`   Health Check: http://localhost:${PORT}/api/health`);
            console.log(`   Status: http://localhost:${PORT}/api/status`);
            console.log(`   Users Demo: http://localhost:${PORT}/api/demo/users`);
            
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
            
            server.close(async () => {
                // Close database connection
                if (mongooseConnection) {
                    await mongooseConnection.close();
                    console.log('✅ Database connection closed');
                }
                
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

// Global error handlers to prevent server exit on uncaught errors
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();

// Export app for testing
export default app;