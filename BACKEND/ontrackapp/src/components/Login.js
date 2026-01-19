import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/authMiddleware';
import { tokenManager } from '../services/authMiddleware';
import './Dashboard.css'; // Reuse the CSS

const Login = () => {
  const navigate = useNavigate();

  // Login form state
  const [activeTab, setActiveTab] = useState('admin');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [attempts, setAttempts] = useState(0);
const handleLogin = async (e) => {
  e.preventDefault();
  
  // Remove tab-based validation - only check form fields
  if (!credentials.username || !credentials.password) {
    setLoginError('Username and password are required');
    return;
  }
  
  setIsLoggingIn(true);
  setLoginError('');

  try {
    // Use ONLY ONE login endpoint - no admin/student distinction
    const response = await authAPI.login(credentials.username, credentials.password);
    
    console.log('Login response:', response); // Debug logging
    console.log('User object:', response.user); // Debug logging

    if (response.success) {
      tokenManager.setToken(response.token);
      tokenManager.setStoredUser(response.user);

      // Simple username-based routing
      // If username is "admin" (case-insensitive), go to /dashboard
      // All other usernames go to /userdashboard
      const username = response.user.username || '';
      
      if (username.toLowerCase() === 'admin') {
        console.log('Routing to admin dashboard for user:', username);
        navigate('/dashboard');
      } else {
        console.log('Routing to user dashboard for user:', username);
        navigate('/userdashboard');
      }
    } else {
      setLoginError(response.message || 'Login failed. Check username/password.');
    }
  } catch (error) {
    console.error('Login error:', error);
    setLoginError('Server error. Please try again later.');
  } finally {
    setIsLoggingIn(false);
  }
};
  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="dashboard-login-page">
      <div className="login-header">
        <h1 className="login-title">OnTrack Connect</h1>
        <p className="login-subtitle">Welcome to your learning platform</p>
      </div>
      
      <div className="login-container">
        <div className="login-tabs">
          <button
            className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            Admin Login
          </button>
          <button
            className={`tab-button ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => setActiveTab('student')}
          >
            Student Login
          </button>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {loginError && <div className="error-message">{loginError}</div>}
          
          <h3>{activeTab === 'admin' ? 'Admin Login' : 'Student Login'}</h3>
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              required
              disabled={isLoggingIn}
              placeholder="Enter your username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              required
              disabled={isLoggingIn}
              placeholder="Enter your password"
            />
          </div>
          
          <button
            type="submit"
            className="login-btn"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Logging in...' : `Login as ${activeTab === 'admin' ? 'Admin' : 'Student'}`}
          </button>

      
        </form>
      </div>
      

      <div className="copyright">
        © {new Date().getFullYear()} OnTrack Connect. All rights reserved.
      </div>
    </div>
  );
};

export default Login;