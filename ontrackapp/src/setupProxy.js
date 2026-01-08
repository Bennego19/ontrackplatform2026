// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 Setting up proxy configuration...');
  console.log('   Frontend: http://localhost:3001');
  console.log('   Backend: http://localhost:3000');
  
  // Proxy API calls to backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3000', // Backend on port 3000
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      pathRewrite: {
        '^/api': '/api' // Keep /api prefix
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxying: ${req.method} ${req.path} → http://localhost:3000${req.path}`);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message);
        console.error('   Make sure backend is running: npm start in backend folder');
        console.error('   Backend should be at: http://localhost:3000');
        res.status(503).json({ 
          error: 'Backend server unavailable',
          message: 'Ensure backend is running on port 3000'
        });
      }
    })
  );
  
  // Proxy uploads directory
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
      secure: false,
      logLevel: 'silent'
    })
  );
  
  console.log('✅ Proxy setup complete\n');
};