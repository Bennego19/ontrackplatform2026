import app, { setServerStatus } from './server.mjs'; // Import the function
import http from 'http';

const PORT = process.env.PORT || 3000;

console.log(`🚀 Starting OnTrack Connect Server for Render...`);
console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 Port: ${PORT}`);
console.log(`🏠 Binding to: 0.0.0.0`);
console.log('='.repeat(50));

const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  // Update server status
  setServerStatus('RUNNING');
  
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Ready to accept requests`);
  console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
  console.log('='.repeat(50));
});