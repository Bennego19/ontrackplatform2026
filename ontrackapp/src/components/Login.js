// login.js - Updated version
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/authMiddleware';
import { tokenManager } from '../services/authMiddleware';
import './Dashboard.css';

const Login = () => {
  const navigate = useNavigate();

  // Define test credentials for different roles
  const TEST_CREDENTIALS = {
    admin: {
      username: 'admin',
      password: 'admin123'
    },
    student: {
      username: 'student',
      password: 'student123'
    }
  };

  // Login form state
  const [activeTab, setActiveTab] = useState('admin');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Use pre-filled test credentials based on selected tab
  const [credentials, setCredentials] = useState(TEST_CREDENTIALS.admin);

  // Update credentials when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCredentials(TEST_CREDENTIALS[tab]);
    setLoginError('');
  };

const handleLogin = async (e) => {
  e.preventDefault();
  
  if (!credentials.username || !credentials.password) {
    setLoginError('Username and password are required');
    return;
  }
  
  setIsLoggingIn(true);
  setLoginError('');

  try {
    // Pass the activeTab to the API to select the correct endpoint
    const response = await authAPI.login(
      credentials.username, 
      credentials.password, 
      activeTab
    );
    
    console.log('Login response:', response); 
    console.log('User object:', response.user);
    console.log('User type from response:', response.userType); // Debug

    if (response.success) {
      tokenManager.setToken(response.token);
      tokenManager.setStoredUser(response.user);

      // Check user type in priority order:
      // 1. Check response.userType (root level)
      // 2. Check response.user.userType
      // 3. Check response.user.role
      // 4. Fallback to activeTab
      const userType = response.userType || 
                      response.user?.userType || 
                      response.user?.role || 
                      (activeTab === 'admin' ? 'admin' : 'student');
      
      console.log('Determined user type:', userType); // Debug
      
      // Route based on user type
      if (userType === 'admin' || userType === 'superadmin') {
        console.log('Routing to admin dashboard');
        navigate('/dashboard');
      } else if (userType === 'student') {
        console.log('Routing to user dashboard');
        navigate('/userdashboard');
      } else {
        // If user type is not recognized, fallback based on activeTab
        if (activeTab === 'admin') {
          console.log('Fallback: Routing to admin dashboard');
          navigate('/dashboard');
        } else {
          console.log('Fallback: Routing to user dashboard');
          navigate('/userdashboard');
        }
      }
    } else {
      setLoginError(response.message || 'Login failed. Check username/password.');
    }
  } catch (error) {
    console.error('Login error:', error);
    setLoginError(error.message || 'Server error. Please try again later.');
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
            onClick={() => handleTabChange('admin')}
          >
            Admin Login
          </button>
          <button
            className={`tab-button ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => handleTabChange('student')}
          >
            Student Login
          </button>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {loginError && <div className="error-message">{loginError}</div>}
          
          <h3>{activeTab === 'admin' ? 'Admin Login' : 'Student Login'}</h3>
          
          <div className="test-credentials">
            <small>
              <strong>Test Credentials:</strong><br />
              Username: {credentials.username}<br />
              Password: {credentials.password}
            </small>
          </div>
          
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