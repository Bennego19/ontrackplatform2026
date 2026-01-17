// BACKEND/render-server.js
import app from './server.js';
import http from 'http';

const PORT = process.env.PORT || 3000;

console.log(`🚀 Starting OnTrack Connect Server for Render...`);
console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 Port: ${PORT}`);
console.log(`🏠 Binding to: 0.0.0.0`);

const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Ready to accept requests`);
  console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
});

// Handle Render shutdown signals
process.on('SIGTERM', () => {
  console.log('🔴 SIGTERM received - shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔴 SIGINT received - shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Keep alive heartbeat
setInterval(() => {
  console.log('💓 Server heartbeat - still running');
}, 300000); // Log every 5 minutes