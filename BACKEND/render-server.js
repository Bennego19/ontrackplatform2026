// BACKEND/render-server.js
import app from './server.js';
import http from 'http';

const PORT = process.env.PORT || 3000;

console.log(`🚀 Starting OnTrack Connect Server for Render...`);
console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 Port: ${PORT}`);
console.log(`🏠 Binding to: 0.0.0.0`);
console.log('='.repeat(50));

const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Ready to accept requests`);
  console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
  console.log('='.repeat(50));
});

// Handle Render shutdown signals
process.on('SIGTERM', () => {
  console.log('\n🔴 SIGTERM received - shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force exit after 8 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown');
    process.exit(1);
  }, 8000);
});

process.on('SIGINT', () => {
  console.log('\n🔴 SIGINT received - shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force exit after 8 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown');
    process.exit(1);
  }, 8000);
});

// Keep alive heartbeat
setInterval(() => {
  console.log('💓 Server heartbeat - still running');
}, 300000); // Log every 5 minutes
