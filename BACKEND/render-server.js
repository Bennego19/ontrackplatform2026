// render-server.js - Optimized for Render
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';

// Import your router - ADJUST PATH AS NEEDED
import adminLoginRouter from './routes/adminlogin.mjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable if you need external scripts
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for Render
const allowedOrigins = [
  'https://platform.ontrackconnect.co.za',
  'http://platform.ontrackconnect.co.za',
  'http://localhost:3000',
  'http://localhost:5000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security - prevent NoSQL injection
app.use(mongoSanitize());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/adminlogin', adminLoginRouter);

// Health check endpoint (REQUIRED for Render)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'Ontrack Connect Backend',
    timestamp: new Date().toISOString(),
    node: process.version,
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend API is working!',
    timestamp: new Date().toISOString(),
    endpoints: {
      adminLogin: 'POST /api/adminlogin/adminlogin',
      health: 'GET /api/health',
      getAdmins: 'GET /api/adminlogin/admins'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'OnTrack Connect Backend API',
    version: '1.0.0',
    status: 'operational',
    documentation: 'See /api/health for service status'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    availableRoutes: [
      'GET  /api/health',
      'GET  /api/test',
      'POST /api/adminlogin/adminlogin',
      'GET  /api/adminlogin/admins'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.stack);
  
  // Handle CORS errors
  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      error: 'CORS Error',
      message: err.message,
      allowedOrigins: allowedOrigins
    });
  }
  
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 OnTrack Backend Server Started
  📡 Port: ${PORT}
  🌐 Environment: ${process.env.NODE_ENV || 'development'}
  ⏰ Time: ${new Date().toISOString()}
  📊 Health Check: http://localhost:${PORT}/api/health
  `);
});