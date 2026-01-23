// index.mjs - The entry point that starts the server
import app from './server.mjs';

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('🚀 Starting OnTrack Connect Server for Render...');
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Port: ${PORT}`);
  console.log(`🏠 Binding to: ${HOST}`);
  console.log('='.repeat(50));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Ready to accept requests`);
  console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
  console.log('='.repeat(50));
});