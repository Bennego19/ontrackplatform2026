import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, tokenManager } from '../services/authMiddleware';
import './Dashboard.css';

const Login = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('admin');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setLoginError('Username and password are required');
      return;
    }
    
    setIsLoggingIn(true);
    setLoginError('');

    try {
      let response;
      
      // Use the correct login function based on tab
      if (activeTab === 'admin') {
        // Use adminLogin function (hits /api/adminlogin/adminlogin)
        response = await authAPI.adminLogin(credentials.username, credentials.password);
        
        if (response.success) {
          // Admin login successful - go to admin dashboard
          navigate('/dashboard');
        } else {
          setLoginError(response.message || 'Admin login failed');
        }
      } else {
        // Use regular login function (auto-detects user type)
        response = await authAPI.login(credentials.username, credentials.password);
        
        if (response.success) {
          // Check if it's actually an admin (username === 'admin')
          const username = response.user?.username || credentials.username;
          
          if (username.toLowerCase() === 'admin') {
            // It's an admin - go to admin dashboard
            navigate('/dashboard');
          } else {
            // It's a student - go to user dashboard
            navigate('/userdashboard');
          }
        } else {
          setLoginError(response.message || 'Login failed');
        }
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
    // Clear error when user starts typing
    if (loginError) setLoginError('');
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
            onClick={() => {
              setActiveTab('admin');
              setLoginError('');
            }}
          >
            Admin Login
          </button>
          <button
            className={`tab-button ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('student');
              setLoginError('');
            }}
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
              placeholder={activeTab === 'admin' ? 'Enter admin username' : 'Enter student username'}
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