// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Only use proxy in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Setting up LOCAL development proxy...');
    console.log('   API calls → http://localhost:3000/api');
    
    app.use(
      '/api',
      createProxyMiddleware({
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        onProxyReq: (proxyReq, req, res) => {
          console.log(`🔄 Proxying: ${req.method} ${req.path}`);
        }
      })
    );
    
    app.use(
      '/uploads',
      createProxyMiddleware({
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      })
    );
    
  } else {
    console.log('🌐 Production: Using direct API calls');
    console.log('   API: https://api.ontrackconnect.co.za/api');
  }
};