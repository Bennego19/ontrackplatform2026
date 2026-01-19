// src/config/api.js - UPDATED FOR RENDER
const config = {
  // API URLs from environment variables
  api: {
    baseURL: process.env.REACT_APP_API_URL || 
      (process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/api' 
        : 'https://ontrackplatform2026-5.onrender.com/api'),
    
    uploadsURL: process.env.REACT_APP_UPLOADS_URL || 
      (process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/uploads' 
        : 'https://ontrackplatform2026-5.onrender.com/uploads'),
  },
  
  // Environment info
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Domains - Updated for Render
  domains: {
    frontend: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001' 
      : 'https://platformontrackconnect.co.za',
    
    backend: process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://ontrackplatform2026-5.onrender.com'
  },
  
  // API endpoints (optional, for reference)
  endpoints: {
    health: '/api/health',
    welcome: '/api/welcome',
    test: '/api/test',
    debug: '/api/debug-db',
    // Add other endpoints as needed
  }
};

// Log in development
if (process.env.NODE_ENV === 'development') {
  console.log('🌐 API Configuration:');
  console.log('   Mode:', config.isDevelopment ? 'Development' : 'Production');
  console.log('   API URL:', config.api.baseURL);
  console.log('   Uploads URL:', config.api.uploadsURL);
  console.log('   Frontend:', config.domains.frontend);
  console.log('   Backend:', config.domains.backend);
}

export default config;