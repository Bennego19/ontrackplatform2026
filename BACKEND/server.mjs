import express from 'express';
import https from "https"; // prevent MITM attacks and eavesdropping and DDos

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
import helmet from "helmet"; // protects against cross site scripting (XSS), clickjacking, etc.
import mongoSanitize from "express-mongo-sanitize"; // against NoSQL injection attacks



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');

// Create directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created');
}
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Mount the routes
app.use('/api/onboardstudents', onboardstudents);
app.use('/api/onboardmentors', onboardmentors);
app.use('/api/mentorstudentassignment', mentorstudentassignment);
app.use('/api/mentordashboard', mentordashboard);
app.use('/api/programs', programs);
app.use('/api/tracks', tracks);
app.use('/api/assessments', assessments);
app.use('/api/resources', resources);
app.use('/api/events',events);
app.use('/api/cohorts', cohorts);
app.use('/api/studentassignment', studentassignment);
app.use('/api/auth', auth);
app.use('/api/adminlogin', adminlogin);
app.use('/api/user', user);
app.use('/api/addassignment', addassignment);
app.use('/api/accesscontrol', accesscontrol);
app.use('/api/mentorship', mentorship);
app.use('/api/internship', internship);
app.use('/api/skillsdevelopment', skillsdevelopment);
app.use('/api/modules', modules);
app.use('/api/projects', projects);
app.use('/api/announcements', announcements);
app.use('/api/addtask', addtask);
app.use('/api/help-requests', helpRequests);

// Basic middleware
app.use(cors()); // enable CORS (you can configure origin instead of "*")
app.use(express.json());
app.use(mongoSanitize());
app.use(helmet()); // sensible defaults

app.use(
  helmet.frameguard({
    action: "deny", // use "sameorigin" if you need to allow framing by same origin
  })
);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      // Block all framing (modern browsers)
      frameAncestors: ["'none'"], // change to ["'self'"] if you prefer sameorigin behavior
      // keep other directives minimal — expand as needed
    },
  })
);



// Test route with CORS headers
app.get('/api/test', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

// Welcome route with logging
app.get('/api/welcome', (req, res) => {
  console.log(`Request received: ${req.method} ${req.path} from ${req.headers.origin}`);
  res.json({ 
    message: 'Welcome to the API Service!',
    serverTime: new Date().toISOString(),
    endpoints: [
      '/api/onboardstudents',
      '/api/onboardmentors',
      '/api/assessments',
      '/api/resources'
    ]
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    server: 'Running',
    port: PORT,
    time: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port: ${PORT}`);
  console.log(`🌐 Test endpoints:`);
  console.log(`   http://localhost:${PORT}/api/test`);
  console.log(`   http://localhost:${PORT}/api/health`);
  console.log(`   http://localhost:${PORT}/api/welcome`);
});