// src/config/api.js - SIMPLE VERSION
const config = {
  // API URLs from environment variables
  api: {
    baseURL: process.env.REACT_APP_API_URL || '/api',
    uploadsURL: process.env.REACT_APP_UPLOADS_URL || '/uploads',
  },
  
  // Environment info
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Domains
  domains: {
    frontend: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001' 
      : 'https://platformontrackconnect.co.za',
    
    backend: process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://api.ontrackconnect.co.za'
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